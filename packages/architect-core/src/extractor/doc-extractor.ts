/**
 * @architect
 * @architect-pattern DocExtractor
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:extractor
 * @architect-uses ShapeExtractor
 *
 * ## DocExtractor - JSDoc Directive Extraction
 *
 * Walks scanned `.ts` files and extracts `@architect-*` JSDoc directives
 * into `DocDirective` records for graph assembly. Coordinates with the
 * shape extractor for tagged-shape discovery.
 *
 * ### When to Use
 *
 * - Build pipeline: turn scanned TS sources into directive records
 * - Validation: surface ill-formed directives via diagnostics
 */
import * as fs from 'fs';
import * as path from 'path';

import type { ScannedFile } from '../scanner/index.js';
import { discoverTaggedShapes } from './shape-extractor.js';
import type {
  ExtractedPattern,
  DocDirective,
  ExportInfo,
  PatternValidationError,
} from '../types/index.js';
import { Result } from '../types/index.js';
import { asPatternId, asSourceFilePath, createPatternValidationError } from '../types/index.js';
import {
  ExtractedPatternDraftSchema,
  createDefaultTagRegistry,
} from '../validation-schemas/index.js';
import { BoundaryParseError, parseAtBoundary } from '../validation/boundary.js';
import { resolveCanonicalRole, type TagRegistry } from '../validation-schemas/tag-registry.js';
import { generatePatternId } from '../utils/index.js';
import { inferMaturity } from '../taxonomy/index.js';
import {
  createPatternContractDiagnostics,
  createDeprecatedTagDiagnostic,
  createRemovedLayerTagDiagnostic,
  createDiagnostic,
  type ExtractionDiagnostic,
} from './extraction-diagnostics.js';

export interface ExtractionResults {
  readonly patterns: readonly ExtractedPattern[];
  readonly errors: readonly PatternValidationError[];
  readonly diagnostics: readonly ExtractionDiagnostic[];
}

function createRoleValuesSuggestion(roles: TagRegistry['roles']): string {
  return roles
    .map((role) => role.tag)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ');
}

function collectRoleDiagnostics(
  directive: DocDirective,
  patternRole: string | undefined,
  registry: TagRegistry,
  filePath: string,
): ExtractionDiagnostic[] {
  const diagnostics: ExtractionDiagnostic[] = [];
  const validRoleValues = createRoleValuesSuggestion(registry.roles);
  const canonicalRoleTagPrefix = `${registry.tagPrefix}role`;

  const canonicalRoleTags = directive.tags.filter(
    (tag) => tag === canonicalRoleTagPrefix || tag.startsWith(`${canonicalRoleTagPrefix}:`),
  );
  if (canonicalRoleTags.length > 1) {
    diagnostics.push(
      createDiagnostic(
        filePath,
        'invalid-enum-value',
        `Multiple @architect-role tags found; using the first value and ignoring ${String(canonicalRoleTags.length - 1)} duplicate tag(s)`,
        'Keep exactly one @architect-role tag',
      ),
    );
  }

  if (directive.role !== undefined && patternRole === undefined) {
    diagnostics.push(
      createDiagnostic(
        filePath,
        'invalid-enum-value',
        `Unrecognized value '${directive.role}' for @architect-role`,
        `Valid values: ${validRoleValues}`,
      ),
    );
  }

  for (const deprecatedTag of directive.deprecatedTags ?? []) {
    const normalized = deprecatedTag.startsWith('@architect-')
      ? deprecatedTag.substring('@architect-'.length)
      : deprecatedTag;

    if (normalized.startsWith('arch-role:')) {
      const value = normalized.substring('arch-role:'.length);
      const canonicalRole = resolveCanonicalRole(registry, value) ?? value;
      diagnostics.push(
        createDeprecatedTagDiagnostic(filePath, deprecatedTag, `@architect-role:${canonicalRole}`),
      );
      continue;
    }

    if (normalized.startsWith('arch-context:')) {
      const value = normalized.substring('arch-context:'.length);
      diagnostics.push(
        createDeprecatedTagDiagnostic(
          filePath,
          deprecatedTag,
          `@architect-bounded-context:${value}`,
        ),
      );
      continue;
    }

    if (normalized.startsWith('arch-layer:')) {
      diagnostics.push(createRemovedLayerTagDiagnostic(filePath, deprecatedTag));
      continue;
    }

    const canonicalRole = resolveCanonicalRole(registry, normalized);
    if (canonicalRole !== undefined) {
      diagnostics.push(
        createDeprecatedTagDiagnostic(filePath, deprecatedTag, `@architect-role:${canonicalRole}`),
      );
    }
  }

  return diagnostics;
}

export function extractPatterns(
  scannedFiles: readonly ScannedFile[],
  baseDir: string,
  registry?: TagRegistry,
): ExtractionResults {
  const patterns: ExtractedPattern[] = [];
  const errors: PatternValidationError[] = [];
  const diagnostics: ExtractionDiagnostic[] = [];
  const effectiveRegistry = registry ?? createDefaultTagRegistry();

  for (const scannedFile of scannedFiles) {
    for (const item of scannedFile.directives) {
      const result = buildPattern(
        item.directive,
        item.code,
        item.exports,
        scannedFile.filePath,
        baseDir,
        effectiveRegistry,
      );

      if (Result.isOk(result)) {
        patterns.push(result.value);
        diagnostics.push(
          ...collectRoleDiagnostics(
            item.directive,
            result.value.role,
            effectiveRegistry,
            path.relative(baseDir, scannedFile.filePath),
          ),
        );
      } else {
        errors.push(result.error);
        diagnostics.push(
          ...createPatternContractDiagnostics(
            path.relative(baseDir, scannedFile.filePath),
            result.error.validationErrors ?? [],
          ),
        );
      }
    }
  }

  return { patterns, errors, diagnostics };
}

export function buildPattern(
  directive: DocDirective,
  code: string,
  exports: readonly ExportInfo[],
  filePath: string,
  baseDir: string,
  registry: TagRegistry,
): Result<ExtractedPattern, PatternValidationError> {
  const relativePath = path.relative(baseDir, filePath);
  const id = asPatternId(generatePatternId(relativePath, directive.position.startLine));
  const name = inferPatternName(directive, exports, registry);
  const role = resolveCanonicalRole(registry, directive.role);

  let extractedShapes: ExtractedPattern['extractedShapes'];
  const extractionWarnings: string[] = [];

  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    const jsx = filePath.endsWith('.tsx');
    let sourceContent: string | undefined;
    try {
      sourceContent = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      extractionWarnings.push(
        `[shape-extraction] Failed to read file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (sourceContent?.includes('architect-shape') === true) {
      const taggedResult = discoverTaggedShapes(sourceContent, { jsx });
      if (taggedResult.ok && taggedResult.value.shapes.length > 0) {
        extractedShapes = [...taggedResult.value.shapes];
        extractionWarnings.push(...taggedResult.value.warnings);
      } else if (!taggedResult.ok) {
        extractionWarnings.push(`[shape-discovery] ${taggedResult.error.message}`);
      }
    }
  }

  void extractionWarnings;

  const status = directive.status ?? 'roadmap';
  void inferMaturity(status);

  const pattern = {
    id,
    name,
    directive,
    code,
    source: {
      file: asSourceFilePath(relativePath),
      lines: [directive.position.startLine, directive.position.endLine] as const,
    },
    exports: [...exports],
    extractedAt: new Date().toISOString(),
    ...(directive.patternName !== undefined && { patternName: directive.patternName }),
    ...(role !== undefined && { role }),
    ...(directive.unlockReason !== undefined && { unlockReason: directive.unlockReason }),
    status,
    ...(directive.boundedContext !== undefined && { boundedContext: directive.boundedContext }),
    ...(directive.whenToUse !== undefined && { whenToUse: directive.whenToUse }),
    ...(directive.uses !== undefined && directive.uses.length > 0 && { uses: directive.uses }),
    ...(directive.phase !== undefined && { phase: directive.phase }),
    ...(directive.level !== undefined && { level: directive.level }),
    ...(directive.parent !== undefined && { parent: directive.parent }),
    ...(directive.implements !== undefined &&
      directive.implements.length > 0 && { implementsPatterns: directive.implements }),
    ...(directive.extends !== undefined && { extendsPattern: directive.extends }),
    ...(directive.seeAlso !== undefined &&
      directive.seeAlso.length > 0 && { seeAlso: directive.seeAlso }),
    ...(directive.enforcesDecisions !== undefined &&
      directive.enforcesDecisions.length > 0 && { enforcesDecisions: directive.enforcesDecisions }),
    ...(directive.apiRef !== undefined &&
      directive.apiRef.length > 0 && { apiRef: directive.apiRef }),
    ...(directive.target !== undefined && { targetPath: directive.target }),
    ...(directive.since !== undefined && { since: directive.since }),
    ...(directive.executableSpecs !== undefined &&
      directive.executableSpecs.length > 0 && { executableSpecs: directive.executableSpecs }),
    ...(directive.include !== undefined &&
      directive.include.length > 0 && { include: directive.include }),
    ...(directive.productArea !== undefined && { productArea: directive.productArea }),
    ...(extractedShapes && extractedShapes.length > 0 && { extractedShapes }),
    ...(directive.convention !== undefined &&
      directive.convention.length > 0 && { convention: directive.convention }),
  };

  try {
    const validatedPattern = parseAtBoundary(
      ExtractedPatternDraftSchema,
      pattern,
      `ExtractedPatternDraft validation failed for ${relativePath}`,
    );
    return Result.ok(validatedPattern);
  } catch (error: unknown) {
    if (!(error instanceof BoundaryParseError)) {
      throw error;
    }

    return Result.err(
      createPatternValidationError(
        asSourceFilePath(relativePath),
        name,
        'Pattern validation failed',
        error.details.map((detail) => {
          const pathLabel = detail.path.length > 0 ? detail.path.join('.') : 'pattern';
          return `${pathLabel}: expected ${detail.expected}, received ${detail.received}`;
        }),
      ),
    );
  }
}

export function inferPatternName(
  directive: DocDirective,
  exports: readonly ExportInfo[],
  registry: TagRegistry,
): string {
  if (directive.patternName) return directive.patternName;

  const firstLine = directive.description.split('\n')[0];
  if (firstLine?.trim() && !firstLine.trim().startsWith('@')) {
    const cleanedName = firstLine.trim().replace(/^#+\s*/, '');
    if (cleanedName) return cleanedName;
  }

  const firstExport = exports[0];
  if (firstExport) return firstExport.name;

  const firstTag = directive.tags[0] as string | undefined;
  const primaryTag = firstTag?.replace(registry.tagPrefix, '') ?? 'unknown';
  return `${primaryTag}-pattern`;
}

export function hasAggregationTag(
  tags: readonly string[],
  aggregationTagName: string,
  registry: TagRegistry,
): boolean {
  const aggregationTag = registry.aggregationTags.find((tag) => tag.tag === aggregationTagName);
  if (!aggregationTag) return false;
  const fullTag = `${registry.tagPrefix}${aggregationTag.tag}`;
  return tags.some((tag) => tag === fullTag);
}

export interface AggregationTags {
  readonly overview: boolean;
  readonly decision: boolean;
  readonly intro: boolean;
}

export function getAggregationTags(
  tags: readonly string[],
  registry: TagRegistry,
): AggregationTags {
  return {
    overview: hasAggregationTag(tags, 'overview', registry),
    decision: hasAggregationTag(tags, 'decision', registry),
    intro: hasAggregationTag(tags, 'intro', registry),
  };
}
