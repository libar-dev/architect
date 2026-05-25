/**
 * @architect
 * @architect-pattern GherkinExtractor
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:extractor
 * @architect-uses GherkinAstParser, LayerInference
 *
 * ## GherkinExtractor - Feature File Directive Extraction
 *
 * Parses `.feature` files via `@cucumber/gherkin`, extracts feature/rule
 * tags into `DocDirective` records, and surfaces structural diagnostics
 * for malformed feature inputs.
 *
 * ### When to Use
 *
 * - Build pipeline: turn scanned features into directive records for graph build
 * - Validation: surface ill-formed feature tags via diagnostics
 */
import { access } from 'node:fs/promises';
import * as path from 'node:path';

import { asDirectiveTag, asPatternId, asSourceFilePath } from '../types/branded.js';
import {
  createGherkinPatternValidationError,
  type GherkinPatternValidationError,
} from '../types/errors.js';
import { BoundaryParseError, parseAtBoundary } from '../validation/boundary.js';
import { getPatternName } from '../read-api/pattern-helpers.js';
import { ACCEPTED_STATUS_VALUES } from '../taxonomy/index.js';
import { generatePatternId } from '../utils/index.js';
import type {
  GherkinRule,
  GherkinScenario,
  ScannedGherkinFile,
} from '../validation-schemas/feature.js';
import {
  ExtractedPatternDraftSchema,
  type ExtractedPatternDraft,
  type ExtractedPattern,
} from '../validation-schemas/extracted-pattern.js';
import {
  createDefaultTagRegistry,
  resolveCanonicalRole,
  type TagRegistry,
} from '../validation-schemas/tag-registry.js';
import { extractPatternTags, type FeatureTagMetadata } from '../scanner/gherkin-ast-parser.js';
import { extractDeliverables, type Deliverable } from './dual-source-extractor.js';
import {
  createDiagnostic,
  createDeprecatedTagDiagnostic,
  createPatternContractDiagnostics,
  createRemovedLayerTagDiagnostic,
  type ExtractionDiagnostic,
} from './extraction-diagnostics.js';
import { inferFeatureLayer } from './layer-inference.js';

export const SEMANTIC_SCENARIO_TAGS = [
  'happy-path',
  'validation',
  'business-failure',
  'business-rule',
  'compensation',
  'idempotency',
  'expiration',
  'workflow-state',
] as const;

const INVALID_UNLOCK_REASON_PLACEHOLDERS = /^(test|xxx|bypass|temp|todo|fixme)$/i;
const MIN_UNLOCK_REASON_LENGTH = 10;

function validateUnlockReason(
  rawValue: string | undefined,
  filePath: string,
): { unlockReason?: string; diagnostic?: ExtractionDiagnostic } {
  if (rawValue === undefined) {
    return {};
  }

  const unlockReason = rawValue.trim();
  if (
    unlockReason.length >= MIN_UNLOCK_REASON_LENGTH &&
    !INVALID_UNLOCK_REASON_PLACEHOLDERS.test(unlockReason)
  ) {
    return { unlockReason };
  }

  return {
    diagnostic: createDiagnostic(
      filePath,
      'invalid-unlock-reason',
      `Invalid @architect-unlock-reason value '${unlockReason || rawValue}'`,
      'Use a meaningful reason with at least 10 characters and avoid placeholders like test, temp, todo, or fixme',
    ),
  };
}

function collectDeprecatedTagDiagnostics(
  metadata: FeatureTagMetadata,
  filePath: string,
  registry: TagRegistry,
): ExtractionDiagnostic[] {
  const diagnostics: ExtractionDiagnostic[] = [];
  const validRoleValues = registry.roles.map((role) => role.tag).join(', ');

  const roleValues = metadata._roleTagValues ?? [];
  if (roleValues.length > 1) {
    diagnostics.push(
      createDiagnostic(
        filePath,
        'invalid-enum-value',
        `Multiple @architect-role tags found; using the first value and ignoring ${String(roleValues.length - 1)} duplicate tag(s)`,
        'Keep exactly one @architect-role tag',
      ),
    );
  }

  for (const unknownRoleValue of metadata._unrecognizedRoleValues ?? []) {
    diagnostics.push(
      createDiagnostic(
        filePath,
        'invalid-enum-value',
        `Unrecognized value '${unknownRoleValue}' for @architect-role`,
        `Valid values: ${validRoleValues}`,
      ),
    );
  }

  for (const tag of metadata._deprecatedTags ?? []) {
    if (tag.startsWith('arch-role:')) {
      const value = tag.substring('arch-role:'.length);
      const canonicalRole = resolveCanonicalRole(registry, value) ?? value;
      diagnostics.push(
        createDeprecatedTagDiagnostic(filePath, tag, `@architect-role:${canonicalRole}`),
      );
      continue;
    }

    if (tag.startsWith('arch-context:')) {
      const value = tag.substring('arch-context:'.length);
      diagnostics.push(
        createDeprecatedTagDiagnostic(filePath, tag, `@architect-bounded-context:${value}`),
      );
      continue;
    }

    if (tag.startsWith('arch-layer:')) {
      diagnostics.push(createRemovedLayerTagDiagnostic(filePath, tag));
      continue;
    }

    diagnostics.push(
      createDeprecatedTagDiagnostic(
        filePath,
        tag,
        `@architect-role:${resolveCanonicalRole(registry, tag) ?? tag}`,
      ),
    );
  }

  return diagnostics;
}

function buildGherkinPatternDraft(input: {
  relativePath: string;
  filePath: string;
  patternId: ExtractedPattern['id'];
  patternName: string;
  feature: ScannedGherkinFile['feature'];
  metadata: FeatureTagMetadata & { readonly status: ExtractedPattern['status'] };
  whenToUse: readonly string[];
  scenarios: readonly GherkinScenario[];
  rules: readonly GherkinRule[] | undefined;
  deliverables: readonly Deliverable[];
  unlockReason: string | undefined;
  behaviorFile: string | undefined;
  behaviorFileVerified: boolean | undefined;
}): Omit<ExtractedPatternDraft, '_diagnostics'> {
  const {
    relativePath,
    filePath,
    patternId,
    patternName,
    feature,
    metadata,
    whenToUse,
    scenarios,
    rules,
    deliverables,
    unlockReason,
    behaviorFile,
    behaviorFileVerified,
  } = input;

  const draft: Omit<ExtractedPatternDraft, '_diagnostics'> = {
    id: patternId,
    name: patternName,
    ...(metadata.role !== undefined ? { role: metadata.role } : {}),
    directive: {
      tags: feature.tags.map((tag) => asDirectiveTag(`@architect-${tag}`)),
      description: feature.description,
      examples: [],
      position: { startLine: feature.line, endLine: feature.line },
      status: metadata.status,
      ...(unlockReason !== undefined ? { unlockReason } : {}),
      ...(metadata.boundedContext !== undefined ? { boundedContext: metadata.boundedContext } : {}),
      ...(metadata.phase !== undefined ? { phase: metadata.phase } : {}),
      ...(metadata.role !== undefined ? { role: metadata.role } : {}),
      ...(metadata.uses !== undefined && metadata.uses.length > 0 ? { uses: metadata.uses } : {}),
      ...(metadata.level !== undefined ? { level: metadata.level } : {}),
      ...(metadata.parent !== undefined ? { parent: metadata.parent } : {}),
      ...(metadata.executableSpecs !== undefined
        ? { executableSpecs: metadata.executableSpecs }
        : {}),
    },
    code: '',
    source: {
      file: asSourceFilePath(relativePath),
      lines: [feature.line, feature.line] as const,
    },
    exports: [],
    extractedAt: new Date().toISOString(),
    status: metadata.status,
    ...(metadata.pattern !== undefined ? { patternName: metadata.pattern } : {}),
    ...(metadata.boundedContext !== undefined ? { boundedContext: metadata.boundedContext } : {}),
    ...(unlockReason !== undefined ? { unlockReason } : {}),
    ...(metadata.phase !== undefined ? { phase: metadata.phase } : {}),
    ...(metadata.release !== undefined ? { release: metadata.release } : {}),
    ...(metadata.uses !== undefined && metadata.uses.length > 0 ? { uses: metadata.uses } : {}),
    ...(metadata.implementsPatterns !== undefined && metadata.implementsPatterns.length > 0
      ? { implementsPatterns: metadata.implementsPatterns }
      : {}),
    ...(metadata.seeAlso !== undefined && metadata.seeAlso.length > 0
      ? { seeAlso: metadata.seeAlso }
      : {}),
    ...(metadata.apiRef !== undefined && metadata.apiRef.length > 0
      ? { apiRef: metadata.apiRef }
      : {}),
    ...(metadata.extendsPattern !== undefined ? { extendsPattern: metadata.extendsPattern } : {}),
    ...(metadata.target !== undefined ? { targetPath: metadata.target } : {}),
    ...(metadata.since !== undefined ? { since: metadata.since } : {}),
    ...(metadata.executableSpecs !== undefined && metadata.executableSpecs.length > 0
      ? { executableSpecs: metadata.executableSpecs }
      : {}),
    ...(metadata.quarter !== undefined ? { quarter: metadata.quarter } : {}),
    ...(metadata.completed !== undefined ? { completed: metadata.completed } : {}),
    ...(metadata.effort !== undefined ? { effort: metadata.effort } : {}),
    ...(metadata.effortActual !== undefined ? { effortActual: metadata.effortActual } : {}),
    ...(metadata.team !== undefined ? { team: metadata.team } : {}),
    ...(metadata.workflow !== undefined ? { workflow: metadata.workflow } : {}),
    ...(metadata.risk !== undefined ? { risk: metadata.risk } : {}),
    ...(metadata.priority !== undefined ? { priority: metadata.priority } : {}),
    ...(metadata.productArea !== undefined ? { productArea: metadata.productArea } : {}),
    ...(metadata.userRole !== undefined ? { userRole: metadata.userRole } : {}),
    ...(metadata.businessValue !== undefined ? { businessValue: metadata.businessValue } : {}),
    ...(metadata.level !== undefined ? { level: metadata.level } : {}),
    ...(metadata.parent !== undefined ? { parent: metadata.parent } : {}),
    ...(metadata.discoveredGaps !== undefined && metadata.discoveredGaps.length > 0
      ? { discoveredGaps: metadata.discoveredGaps }
      : {}),
    ...(metadata.discoveredImprovements !== undefined && metadata.discoveredImprovements.length > 0
      ? { discoveredImprovements: metadata.discoveredImprovements }
      : {}),
    ...(metadata.discoveredRisks !== undefined && metadata.discoveredRisks.length > 0
      ? { discoveredRisks: metadata.discoveredRisks }
      : {}),
    ...(metadata.discoveredLearnings !== undefined && metadata.discoveredLearnings.length > 0
      ? { discoveredLearnings: metadata.discoveredLearnings }
      : {}),
    ...(metadata.constraints !== undefined && metadata.constraints.length > 0
      ? { constraints: metadata.constraints }
      : {}),
    ...(metadata.adr !== undefined ? { adr: metadata.adr } : {}),
    ...(metadata.adrStatus !== undefined ? { adrStatus: metadata.adrStatus } : {}),
    ...(metadata.adrCategory !== undefined ? { adrCategory: metadata.adrCategory } : {}),
    ...(metadata.adrSupersedes !== undefined ? { adrSupersedes: metadata.adrSupersedes } : {}),
    ...(metadata.adrSupersededBy !== undefined
      ? { adrSupersededBy: metadata.adrSupersededBy }
      : {}),
    ...(metadata.adrTheme !== undefined ? { adrTheme: metadata.adrTheme } : {}),
    ...(metadata.adrLayer !== undefined ? { adrLayer: metadata.adrLayer } : {}),
    ...(metadata.convention !== undefined && metadata.convention.length > 0
      ? { convention: metadata.convention }
      : {}),
    ...(metadata.include !== undefined && metadata.include.length > 0
      ? { include: metadata.include }
      : {}),
    ...(whenToUse.length > 0 ? { whenToUse } : {}),
    ...(deliverables.length > 0 ? { deliverables } : {}),
    ...(scenarios.length > 0
      ? {
          scenarios: scenarios.map((scenario) => ({
            featureFile: relativePath,
            featureName: feature.name,
            featureDescription: feature.description,
            scenarioName: scenario.name,
            semanticTags: scenario.tags.filter((tag) =>
              (SEMANTIC_SCENARIO_TAGS as readonly string[]).includes(tag),
            ),
            tags: scenario.tags,
            layer: inferFeatureLayer(filePath),
            line: scenario.line,
            ...(scenario.steps.length > 0
              ? {
                  steps: scenario.steps.map((step) => ({
                    keyword: step.keyword,
                    text: step.text,
                    ...(step.dataTable !== undefined ? { dataTable: step.dataTable } : {}),
                    ...(step.docString !== undefined ? { docString: step.docString } : {}),
                  })),
                }
              : {}),
          })),
        }
      : {}),
    ...(behaviorFile !== undefined ? { behaviorFile } : {}),
    ...(behaviorFileVerified !== undefined ? { behaviorFileVerified } : {}),
    ...(rules !== undefined && rules.length > 0
      ? {
          rules: rules.map((rule) => ({
            name: rule.name,
            description: rule.description,
            scenarioCount: rule.scenarios.length,
            scenarioNames: rule.scenarios.map((scenario) => scenario.name),
            ...(rule.tags.length > 0 ? { tags: rule.tags } : {}),
          })),
        }
      : {}),
  };

  return draft;
}

export interface GherkinExtractorConfig {
  readonly baseDir: string;
  readonly tagRegistry?: TagRegistry;
  readonly scenariosAsUseCases?: boolean;
}

export interface GherkinExtractionResult {
  readonly patterns: readonly ExtractedPattern[];
  readonly errors: readonly GherkinPatternValidationError[];
  readonly diagnostics: readonly ExtractionDiagnostic[];
}

function hasRequiredStatus(
  metadata: FeatureTagMetadata,
): metadata is FeatureTagMetadata & { readonly status: ExtractedPattern['status'] } {
  return metadata.status !== undefined;
}

export async function extractPatternsFromGherkin(
  scannedFiles: readonly ScannedGherkinFile[],
  config: GherkinExtractorConfig,
): Promise<GherkinExtractionResult> {
  const { baseDir } = config;
  const scenariosAsUseCases = config.scenariosAsUseCases ?? true;
  const effectiveRegistry = config.tagRegistry ?? createDefaultTagRegistry();

  interface PatternWithPendingVerification {
    pattern: ExtractedPattern;
    behaviorPathToVerify?: string;
  }

  const patternsToVerify: PatternWithPendingVerification[] = [];
  const errors: GherkinPatternValidationError[] = [];
  const diagnostics: ExtractionDiagnostic[] = [];

  for (const file of scannedFiles) {
    const { feature, scenarios, rules, filePath } = file;
    const relativePath = path.relative(baseDir, filePath);
    const metadata = extractPatternTags(feature.tags, effectiveRegistry);

    const hasOptIn = feature.tags.some((tag) => tag === 'architect');
    if (!hasOptIn) {
      continue;
    }

    for (const entry of metadata._unrecognizedEnums ?? []) {
      const code =
        entry.tag === 'status' ? ('unrecognized-status' as const) : ('invalid-enum-value' as const);

      diagnostics.push(
        createDiagnostic(
          relativePath,
          code,
          `Unrecognized value '${entry.value}' for @architect-${entry.tag}`,
          `Valid values: ${entry.validValues.join(', ')}`,
        ),
      );
    }

    diagnostics.push(...collectDeprecatedTagDiagnostics(metadata, relativePath, effectiveRegistry));

    if (!metadata.pattern) {
      diagnostics.push(
        createDiagnostic(
          relativePath,
          'missing-pattern-name',
          'File has @architect gate tag but no @architect-pattern tag',
          'Add @architect-pattern YourPatternName',
        ),
      );
      continue;
    }

    if (!hasRequiredStatus(metadata)) {
      const nonCandidateStatuses = ACCEPTED_STATUS_VALUES.filter(
        (value) => value !== 'candidate',
      ).join('/');

      diagnostics.push(
        createDiagnostic(
          relativePath,
          'missing-status',
          'File has @architect gate tag but no @architect-status tag',
          `Add @architect-status candidate (or ${nonCandidateStatuses})`,
        ),
      );
      continue;
    }

    const patternName = metadata.pattern || feature.name;
    const whenToUse: string[] = [];
    if (scenariosAsUseCases) {
      for (const scenario of scenarios) {
        if (scenario.tags.includes('acceptance-criteria')) {
          whenToUse.push(`When ${scenario.name.toLowerCase()}`);
        }
      }
    }

    const patternId = asPatternId(generatePatternId(relativePath, feature.line));
    const { deliverables, diagnostics: deliverableDiagnostics } = extractDeliverables(file);
    diagnostics.push(...deliverableDiagnostics);

    const { unlockReason, diagnostic: unlockReasonDiagnostic } = validateUnlockReason(
      metadata.unlockReason,
      relativePath,
    );
    if (unlockReasonDiagnostic !== undefined) {
      diagnostics.push(unlockReasonDiagnostic);
    }

    let behaviorFile = metadata.behaviorFile;
    let behaviorPathToVerify: string | undefined;
    if (!behaviorFile) {
      const inferred = inferBehaviorFilePath(relativePath);
      if (inferred !== undefined) {
        behaviorFile = inferred;
        behaviorPathToVerify = path.join(baseDir, inferred);
      }
    } else {
      behaviorPathToVerify = path.join(baseDir, behaviorFile);
    }

    try {
      const pattern = parseAtBoundary(
        ExtractedPatternDraftSchema,
        buildGherkinPatternDraft({
          relativePath,
          filePath,
          patternId,
          patternName,
          feature,
          metadata,
          whenToUse,
          scenarios,
          rules,
          deliverables,
          unlockReason,
          behaviorFile,
          behaviorFileVerified: undefined,
        }),
        `ExtractedPatternDraft validation failed for ${relativePath}`,
      );

      patternsToVerify.push(
        behaviorPathToVerify !== undefined ? { pattern, behaviorPathToVerify } : { pattern },
      );
    } catch (error: unknown) {
      if (!(error instanceof BoundaryParseError)) {
        throw error;
      }

      const validationErrors = error.details.map((detail) => {
        const pathLabel = detail.path.length > 0 ? detail.path.join('.') : 'pattern';
        return `${pathLabel}: expected ${detail.expected}, received ${detail.received}`;
      });

      diagnostics.push(...createPatternContractDiagnostics(relativePath, validationErrors));
      errors.push(
        createGherkinPatternValidationError(
          relativePath,
          patternName,
          'Schema validation failed',
          validationErrors,
        ),
      );
    }
  }

  const patterns = await Promise.all(
    patternsToVerify.map(async ({ pattern, behaviorPathToVerify }) => {
      if (behaviorPathToVerify === undefined) {
        return pattern;
      }

      return {
        ...pattern,
        behaviorFileVerified: await fileExistsAsync(behaviorPathToVerify),
      };
    }),
  );

  return { patterns, errors, diagnostics };
}

export function inferBehaviorFilePath(timelineFilePath: string): string | undefined {
  const match = /phase-\d+[a-z]?-(.+)\.feature$/.exec(timelineFilePath);
  return match?.[1] ? `tests/features/behavior/${match[1]}.feature` : undefined;
}

async function fileExistsAsync(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function computeHierarchyChildren(
  patterns: readonly ExtractedPattern[],
): ExtractedPattern[] {
  const parentToChildren = new Map<string, string[]>();
  for (const pattern of patterns) {
    if (pattern.parent) {
      const children = parentToChildren.get(pattern.parent) ?? [];
      children.push(getPatternName(pattern));
      parentToChildren.set(pattern.parent, children);
    }
  }

  return patterns.map((pattern) => {
    const children = parentToChildren.get(getPatternName(pattern));
    if (children && children.length > 0) {
      return { ...pattern, children };
    }

    return pattern;
  });
}

export {};
