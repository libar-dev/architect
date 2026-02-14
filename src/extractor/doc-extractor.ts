/**
 * @libar-docs
 * @libar-docs-core @libar-docs-extractor
 * @libar-docs-pattern Document Extractor
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context extractor
 * @libar-docs-arch-layer application
 * @libar-docs-arch-view pipeline-stages
 * @libar-docs-uses Pattern Scanner, Tag Registry, Zod
 * @libar-docs-used-by Orchestrator, Generators
 * @libar-docs-usecase "When converting scanned files to ExtractedPattern objects"
 * @libar-docs-usecase "When inferring pattern names and categories from exports"
 *
 * ## Document Extractor - Pattern Extraction and Metadata Generation
 *
 * Converts scanned file data into complete ExtractedPattern objects with
 * unique IDs, inferred names, categories, and timestamps. Second stage of
 * the pipeline: Scanner → **Extractor** → Generator.
 *
 * ### When to Use
 *
 * - Transforming directives to structured patterns
 * - Inferring metadata from tags and exports
 * - Validating pattern structure against schemas
 *
 * ### Key Concepts
 *
 * - **Category Inference**: Uses tag registry priorities to determine primary category
 * - **Name Inference**: Extracts from exports or JSDoc title when not explicit
 * - **Deterministic IDs**: MD5 hash of file path + line number ensures stable identifiers
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ScannedFile } from '../scanner/index.js';
import { processExtractShapesTag, discoverTaggedShapes } from './shape-extractor.js';
import type {
  ExtractedPattern,
  DocDirective,
  ExportInfo,
  PatternValidationError,
} from '../types/index.js';
import { Result } from '../types/index.js';
import {
  asPatternId,
  asCategoryName,
  asSourceFilePath,
  createPatternValidationError,
} from '../types/index.js';
import {
  ExtractedPatternSchema,
  createDefaultTagRegistry,
  type TagRegistry,
} from '../validation-schemas/index.js';
import { generatePatternId } from '../utils/index.js';

/**
 * Results of pattern extraction with error collection
 */
export interface ExtractionResults {
  /** Successfully extracted patterns */
  readonly patterns: readonly ExtractedPattern[];
  /** Patterns that failed validation */
  readonly errors: readonly PatternValidationError[];
}

/**
 * Convert scanned files to extracted patterns
 *
 * **Result Pattern**: Collects both successful extractions AND validation errors,
 * enabling partial success scenarios.
 *
 * @param scannedFiles - Files scanned for directives
 * @param baseDir - Base directory for relative path calculation
 * @param registry - Tag registry for category inference and aggregation tags (optional, defaults to generic registry)
 * @returns Extraction results with patterns and errors
 *
 * @example
 * ```typescript
 * import { scanPatterns } from '@libar-dev/code-first-docs/scanner';
 * import { extractPatterns } from '@libar-dev/code-first-docs/extractor';
 *
 * const scanResult = await scanPatterns(config);
 * if (scanResult.ok) {
 *   const extraction = extractPatterns(scanResult.value.files, '/path/to/project');
 *   console.log(`Extracted ${extraction.patterns.length} patterns`);
 *   console.log(`Failed ${extraction.errors.length} validations`);
 * }
 * ```
 */
export function extractPatterns(
  scannedFiles: readonly ScannedFile[],
  baseDir: string,
  registry?: TagRegistry
): ExtractionResults {
  const patterns: ExtractedPattern[] = [];
  const errors: PatternValidationError[] = [];
  const effectiveRegistry = registry ?? createDefaultTagRegistry();

  for (const scannedFile of scannedFiles) {
    for (const item of scannedFile.directives) {
      const result = buildPattern(
        item.directive,
        item.code,
        item.exports,
        scannedFile.filePath,
        baseDir,
        effectiveRegistry
      );

      if (Result.isOk(result)) {
        patterns.push(result.value);
      } else {
        errors.push(result.error);
      }
    }
  }

  return { patterns, errors };
}

/**
 * Build a complete ExtractedPattern from components
 *
 * **Schema-First Enforcement**: Validates constructed pattern against schema
 * to ensure data integrity at the boundary.
 *
 * @param directive - Parsed JSDoc directive
 * @param code - Extracted code snippet
 * @param exports - Exported symbols from code block
 * @param filePath - Absolute file path
 * @param baseDir - Base directory for relative path calculation
 * @param registry - Tag registry for category inference
 * @returns Result containing validated pattern or validation error
 *
 * @example
 * ```typescript
 * const result = buildPattern(
 *   directive,
 *   codeSnippet,
 *   exports,
 *   '/project/src/utils.ts',
 *   '/project',
 *   tagRegistry
 * );
 *
 * if (result.ok) {
 *   console.log(result.value.id);        // 'pattern-a1b2c3d4'
 *   console.log(result.value.source.file); // 'src/utils.ts'
 * }
 * ```
 */
export function buildPattern(
  directive: DocDirective,
  code: string,
  exports: readonly ExportInfo[],
  filePath: string,
  baseDir: string,
  registry: TagRegistry
): Result<ExtractedPattern, PatternValidationError> {
  const relativePath = path.relative(baseDir, filePath);
  const id = asPatternId(generatePatternId(relativePath, directive.position.startLine));
  const name = inferPatternName(directive, exports, registry);
  const category = asCategoryName(inferCategory(directive.tags as readonly string[], registry));

  // Shape extraction: both @libar-docs-extract-shapes (pattern-level) and
  // @libar-docs-shape (declaration-level) contribute to extractedShapes.
  // Read file once for both paths.
  let extractedShapes;
  const extractionWarnings: string[] = [];

  // Only TypeScript files can have shapes
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let sourceContent: string | undefined;
    try {
      sourceContent = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      extractionWarnings.push(
        `[shape-extraction] Failed to read file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Path 1: Existing @libar-docs-extract-shapes tag processing
    if (
      sourceContent !== undefined &&
      directive.extractShapes !== undefined &&
      directive.extractShapes.length > 0
    ) {
      const shapeResult = processExtractShapesTag(
        sourceContent,
        directive.extractShapes.join(', ')
      );
      extractedShapes = shapeResult.shapes;
      extractionWarnings.push(...shapeResult.warnings);
    }

    // Path 2: Declaration-level @libar-docs-shape discovery
    // Performance note: when both paths fire, sourceCode is parsed by typescript-estree
    // twice (once in processExtractShapesTag, once in discoverTaggedShapes). Acceptable
    // for v1 — future optimization could accept a pre-parsed AST.
    if (sourceContent?.includes('libar-docs-shape') === true) {
      const taggedResult = discoverTaggedShapes(sourceContent);
      if (taggedResult.ok && taggedResult.value.shapes.length > 0) {
        const existingByName = new Map((extractedShapes ?? []).map((s) => [s.name, s]));
        const newShapes = taggedResult.value.shapes.filter((s) => !existingByName.has(s.name));
        // Merge group from tagged shapes onto existing Path 1 shapes
        for (const tagged of taggedResult.value.shapes) {
          const existing = existingByName.get(tagged.name);
          if (existing !== undefined && tagged.group !== undefined) {
            existing.group = tagged.group;
          }
        }
        extractedShapes = [...(extractedShapes ?? []), ...newShapes];
        extractionWarnings.push(...taggedResult.value.warnings);
      } else if (!taggedResult.ok) {
        extractionWarnings.push(`[shape-discovery] ${taggedResult.error.message}`);
      }
    }
  } else if (directive.extractShapes !== undefined && directive.extractShapes.length > 0) {
    // Non-TS file with extract-shapes tag — legacy path
    try {
      const sourceContent = fs.readFileSync(filePath, 'utf-8');
      const shapeResult = processExtractShapesTag(
        sourceContent,
        directive.extractShapes.join(', ')
      );
      extractedShapes = shapeResult.shapes;
      extractionWarnings.push(...shapeResult.warnings);
    } catch (error) {
      extractionWarnings.push(
        `[shape-extraction] Failed to read file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  // Note: extractionWarnings are collected but currently not surfaced
  // Future enhancement: add warnings field to ExtractedPattern schema

  // Build pattern object
  const pattern = {
    id,
    name,
    category,
    directive,
    code,
    source: {
      file: asSourceFilePath(relativePath),
      lines: [directive.position.startLine, directive.position.endLine] as const,
    },
    exports: [...exports],
    extractedAt: new Date().toISOString(),
    // Include optional fields only if present in directive
    ...(directive.patternName !== undefined && { patternName: directive.patternName }),
    ...(directive.status !== undefined && { status: directive.status }),
    ...(directive.isCore === true && { isCore: directive.isCore }),
    ...(directive.useCases !== undefined &&
      directive.useCases.length > 0 && { useCases: directive.useCases }),
    ...(directive.whenToUse !== undefined && { whenToUse: directive.whenToUse }),
    ...(directive.uses !== undefined && directive.uses.length > 0 && { uses: directive.uses }),
    ...(directive.usedBy !== undefined &&
      directive.usedBy.length > 0 && { usedBy: directive.usedBy }),
    // Roadmap integration fields
    ...(directive.phase !== undefined && { phase: directive.phase }),
    ...(directive.brief !== undefined && { brief: directive.brief }),
    ...(directive.dependsOn !== undefined &&
      directive.dependsOn.length > 0 && { dependsOn: directive.dependsOn }),
    ...(directive.enables !== undefined &&
      directive.enables.length > 0 && { enables: directive.enables }),
    // UML-inspired relationship fields (PatternRelationshipModel)
    ...(directive.implements !== undefined &&
      directive.implements.length > 0 && { implementsPatterns: directive.implements }),
    ...(directive.extends !== undefined && { extendsPattern: directive.extends }),
    // Cross-reference and API navigation fields (PatternRelationshipModel enhancement)
    ...(directive.seeAlso !== undefined &&
      directive.seeAlso.length > 0 && { seeAlso: directive.seeAlso }),
    ...(directive.apiRef !== undefined &&
      directive.apiRef.length > 0 && { apiRef: directive.apiRef }),
    // Design session stub metadata fields
    ...(directive.target !== undefined && { targetPath: directive.target }),
    ...(directive.since !== undefined && { since: directive.since }),
    // Architecture diagram generation fields
    ...(directive.archRole !== undefined && { archRole: directive.archRole }),
    ...(directive.archContext !== undefined && { archContext: directive.archContext }),
    ...(directive.archLayer !== undefined && { archLayer: directive.archLayer }),
    ...(directive.archView !== undefined &&
      directive.archView.length > 0 && { archView: directive.archView }),
    // Shape extraction fields (extracted from source file when @libar-docs-extract-shapes present)
    ...(extractedShapes && extractedShapes.length > 0 && { extractedShapes }),
    // Convention tags for reference document generation
    ...(directive.convention !== undefined &&
      directive.convention.length > 0 && { convention: directive.convention }),
  };

  // Validate against schema (schema-first enforcement)
  const validation = ExtractedPatternSchema.safeParse(pattern);

  if (!validation.success) {
    const errorMessages = validation.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    const error = createPatternValidationError(
      asSourceFilePath(relativePath),
      name,
      'Pattern validation failed',
      errorMessages
    );
    return Result.err(error);
  }

  return Result.ok(validation.data);
}

/**
 * Infer pattern name from directive or exports
 *
 * Uses fallback chain:
 * 1. Explicit pattern tag value (highest priority)
 * 2. First line of description (if not a tag)
 * 3. First export name
 * 4. Generated from primary tag
 *
 * @param directive - Parsed JSDoc directive
 * @param exports - Exported symbols from code block
 * @param registry - Tag registry for prefix-aware tag stripping
 * @returns Inferred pattern name
 *
 * @example
 * ```typescript
 * // From explicit pattern tag (highest priority)
 * const name0 = inferPatternName(
 *   { patternName: 'Decider Pattern', description: 'Some description', tags: [...] },
 *   [],
 *   registry
 * );
 * console.log(name0); // 'Decider Pattern'
 *
 * // From description
 * const name1 = inferPatternName(
 *   { description: 'User Authentication\n...', tags: [...] },
 *   [],
 *   registry
 * );
 * console.log(name1); // 'User Authentication'
 *
 * // From export
 * const name2 = inferPatternName(
 *   { description: '@docs-core', tags: [...] },
 *   [{ name: 'createUser', type: 'function' }],
 *   registry
 * );
 * console.log(name2); // 'createUser'
 *
 * // From tag
 * const name3 = inferPatternName(
 *   { description: '', tags: ['@docs-domain-auth'] },
 *   [],
 *   registry
 * );
 * console.log(name3); // 'domain-pattern'
 * ```
 */
export function inferPatternName(
  directive: DocDirective,
  exports: readonly ExportInfo[],
  registry: TagRegistry
): string {
  // Priority 1: Explicit pattern tag value
  if (directive.patternName) {
    return directive.patternName;
  }

  // Priority 2: Try to extract name from first line of description
  const lines = directive.description.split('\n');
  const firstLine = lines[0];
  if (firstLine?.trim() && !firstLine.trim().startsWith('@')) {
    // Strip markdown header prefixes (##, ###, etc.)
    const cleanedName = firstLine.trim().replace(/^#+\s*/, '');
    if (cleanedName) {
      return cleanedName;
    }
  }

  // Fall back to first export name
  const firstExport = exports[0];
  if (firstExport) {
    return firstExport.name;
  }

  // Last resort: generate from tags using registry prefix
  const tagPrefix = registry.tagPrefix;
  const firstTag = directive.tags[0] as string | undefined;
  const primaryTag = firstTag?.replace(tagPrefix, '') ?? 'unknown';
  return `${primaryTag}-pattern`;
}

/**
 * Infer category from @libar-docs-* tags using priority system
 *
 * Categories are selected based on priority order:
 * domain > arch > infra > validation > testing > performance > security > core
 *
 * @param tags - Array of @libar-docs-* tags
 * @returns Inferred category string
 *
 * @example
 * ```typescript
 * // Priority-based selection
 * const cat1 = inferCategory([
 *   '@libar-docs-core',
 *   '@libar-docs-domain-auth'
 * ]);
 * console.log(cat1); // 'domain' (higher priority than 'core')
 *
 * // From first tag
 * const cat2 = inferCategory(['@libar-docs-validation-zod']);
 * console.log(cat2); // 'validation'
 *
 * // No tags
 * const cat3 = inferCategory([]);
 * console.log(cat3); // 'uncategorized'
 * ```
 */
export function inferCategory(tags: readonly string[], registry: TagRegistry): string {
  // Build priority map from registry (includes aliases)
  // Also track canonical tag for each alias
  const priorityMap = new Map<string, number>();
  const canonicalMap = new Map<string, string>(); // Maps alias → canonical tag

  for (const cat of registry.categories) {
    priorityMap.set(cat.tag, cat.priority);
    canonicalMap.set(cat.tag, cat.tag); // Canonical tags map to themselves

    // Include aliases with same priority, mapping to canonical tag
    for (const alias of cat.aliases) {
      priorityMap.set(alias, cat.priority);
      canonicalMap.set(alias, cat.tag); // Alias maps to canonical tag
    }
  }

  // Extract category names from tags (remove prefix)
  const prefix = registry.tagPrefix;
  const categoryTags: string[] = [];

  for (const tag of tags) {
    if (!tag.startsWith(prefix)) continue;

    // Remove prefix to get tag content
    const withoutPrefix = tag.substring(prefix.length);

    // Find ALL matching categories in this tag
    // This handles cases like "@libar-docs-utils-validation" which contains both "utils" and "validation"
    const matches: string[] = [];

    // Check for exact match first
    if (priorityMap.has(withoutPrefix)) {
      matches.push(withoutPrefix);
    } else {
      // Check all possible contiguous subsequences for category matches
      // e.g., for "utils-validation" check: "utils-validation", "utils", "validation"
      const parts = withoutPrefix.split('-');

      // Try all contiguous subsequences from longest to shortest
      for (let len = parts.length; len > 0; len--) {
        for (let start = 0; start <= parts.length - len; start++) {
          const candidate = parts.slice(start, start + len).join('-');
          if (priorityMap.has(candidate)) {
            matches.push(candidate);
          }
        }
      }
    }

    // Add all matches to categoryTags
    categoryTags.push(...matches);
  }

  // Find tag with highest priority (lowest number)
  // Use canonical tags (normalize aliases)
  let selectedCategory: string | null = null;
  let highestPriority = Infinity;

  for (const categoryTag of categoryTags) {
    const priority = priorityMap.get(categoryTag);
    if (priority !== undefined && priority < highestPriority) {
      highestPriority = priority;
      // Use canonical tag (normalizes aliases like "infrastructure" → "infra")
      selectedCategory = canonicalMap.get(categoryTag) ?? categoryTag;
    }
  }

  // If found by priority, return it
  if (selectedCategory !== null) {
    return selectedCategory;
  }

  // Fallback: Extract category from first tag
  const firstTag = tags[0];
  if (firstTag?.startsWith(prefix) === true) {
    const withoutPrefix = firstTag.substring(prefix.length);
    const parts = withoutPrefix.split('-');
    const firstPart = parts[0];
    if (firstPart) {
      return firstPart;
    }
  }

  return 'uncategorized';
}

/**
 * Check if directive has specific aggregation tag
 *
 * Generic helper for checking any aggregation tag. Replaces individual
 * hasOverviewTag/hasDecisionTag/hasIntroTag helpers with a unified approach.
 *
 * @param tags - Directive tags to check
 * @param aggregationTagName - Name of aggregation tag (e.g., "overview", "decision", "intro")
 * @param registry - Tag registry
 * @returns True if directive has the specified aggregation tag
 *
 * @example
 * ```typescript
 * hasAggregationTag(['@libar-docs-core', '@libar-docs-overview'], "overview", registry); // true
 * hasAggregationTag(['@libar-docs-core'], "overview", registry); // false
 * hasAggregationTag(['@libar-docs-arch', '@libar-docs-decision'], "decision", registry); // true
 * ```
 */
export function hasAggregationTag(
  tags: readonly string[],
  aggregationTagName: string,
  registry: TagRegistry
): boolean {
  const aggregationTag = registry.aggregationTags.find((t) => t.tag === aggregationTagName);
  if (!aggregationTag) return false;
  const fullTag = `${registry.tagPrefix}${aggregationTag.tag}`;
  return tags.some((t) => t === fullTag);
}

/**
 * Result of extracting aggregation tags from pattern tags
 */
export interface AggregationTags {
  /** True if pattern should appear in OVERVIEW.md */
  readonly overview: boolean;
  /** True if pattern should appear in DECISIONS.md */
  readonly decision: boolean;
  /** True if pattern is a package introduction */
  readonly intro: boolean;
}

/**
 * Extract aggregation tags from pattern tags
 *
 * Identifies which aggregated documents a pattern should appear in.
 * Patterns can appear in multiple documents if they have multiple aggregation tags.
 *
 * @param tags - Array of @libar-docs-* tags
 * @param registry - Tag registry for aggregation tag lookup
 * @returns Object indicating which aggregated docs to include pattern in
 *
 * @example
 * ```typescript
 * // Pattern with both overview and decision tags
 * getAggregationTags(['@libar-docs-overview', '@libar-docs-decision'], registry);
 * // { overview: true, decision: true, intro: false }
 *
 * // Pattern with only core tag (no aggregation)
 * getAggregationTags(['@libar-docs-core'], registry);
 * // { overview: false, decision: false, intro: false }
 * ```
 */
export function getAggregationTags(
  tags: readonly string[],
  registry: TagRegistry
): AggregationTags {
  return {
    overview: hasAggregationTag(tags, 'overview', registry),
    decision: hasAggregationTag(tags, 'decision', registry),
    intro: hasAggregationTag(tags, 'intro', registry),
  };
}
