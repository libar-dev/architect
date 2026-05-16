/**
 * @architect
 * @architect-pattern GherkinExtractor
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:extractor
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
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DirectiveTag } from '../types/branded.js';
import { asPatternId, asSourceFilePath, asDirectiveTag } from '../types/branded.js';
import {
  createGherkinPatternValidationError,
  type GherkinPatternValidationError,
} from '../types/errors.js';
import { generatePatternId } from '../utils/index.js';
import { getPatternName } from '../read-api/pattern-helpers.js';
import type {
  GherkinRule,
  GherkinScenario,
  ScannedGherkinFile,
} from '../validation-schemas/feature.js';
import {
  ExtractedPatternSchema,
  type ExtractedPattern,
} from '../validation-schemas/extracted-pattern.js';
import { createDefaultTagRegistry, type TagRegistry } from '../validation-schemas/tag-registry.js';
import { extractPatternTags } from '../scanner/gherkin-ast-parser.js';
import { inferFeatureLayer } from './layer-inference.js';
import { extractDeliverables, type Deliverable } from './dual-source-extractor.js';
import { ACCEPTED_STATUS_VALUES } from '../taxonomy/index.js';
import {
  createPatternContractDiagnostics,
  createDeprecatedTagDiagnostic,
  createRemovedLayerTagDiagnostic,
  createDiagnostic,
  type ExtractionDiagnostic,
} from './extraction-diagnostics.js';

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

function assignIfDefined(obj: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined && value !== null) obj[key] = value;
}

function assignIfNonEmpty(
  obj: Record<string, unknown>,
  key: string,
  arr: readonly unknown[] | undefined
): void {
  if (arr && arr.length > 0) obj[key] = arr;
}

const INVALID_UNLOCK_REASON_PLACEHOLDERS = /^(test|xxx|bypass|temp|todo|fixme)$/i;
const MIN_UNLOCK_REASON_LENGTH = 10;

function validateUnlockReason(
  rawValue: string | undefined,
  filePath: string
): { unlockReason?: string; diagnostic?: ExtractionDiagnostic } {
  if (rawValue === undefined) return {};
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
      'Use a meaningful reason with at least 10 characters and avoid placeholders like test, temp, todo, or fixme'
    ),
  };
}

interface RoleLike {
  readonly tag: string;
  readonly aliases?: readonly string[];
}

function buildRoleLookup(roles: readonly RoleLike[]): {
  readonly canonical: ReadonlyMap<string, string>;
  readonly aliases: ReadonlyMap<string, string>;
} {
  const canonical = new Map<string, string>();
  const aliases = new Map<string, string>();
  for (const role of roles) {
    canonical.set(role.tag, role.tag);
    for (const alias of role.aliases ?? []) aliases.set(alias, role.tag);
  }
  return { canonical, aliases };
}

function resolveCanonicalRole(
  rawValue: string | undefined,
  roles: readonly RoleLike[]
): string | undefined {
  if (rawValue === undefined) return undefined;
  const lookup = buildRoleLookup(roles);
  if (lookup.canonical.has(rawValue)) return rawValue;
  return lookup.aliases.get(rawValue);
}

function collectDeprecatedTagDiagnostics(
  metadata: ReturnType<typeof extractPatternTags>,
  filePath: string,
  roles: readonly RoleLike[]
): ExtractionDiagnostic[] {
  const diagnostics: ExtractionDiagnostic[] = [];
  const validRoleValues = roles.map((role) => role.tag).join(', ');

  const roleValues = metadata._roleTagValues ?? [];
  if (roleValues.length > 1) {
    diagnostics.push(
      createDiagnostic(
        filePath,
        'invalid-enum-value',
        `Multiple @architect-role tags found; using the first value and ignoring ${String(roleValues.length - 1)} duplicate tag(s)`,
        'Keep exactly one @architect-role tag'
      )
    );
  }

  for (const unknownRoleValue of metadata._unrecognizedRoleValues ?? []) {
    diagnostics.push(
      createDiagnostic(
        filePath,
        'invalid-enum-value',
        `Unrecognized value '${unknownRoleValue}' for @architect-role`,
        `Valid values: ${validRoleValues}`
      )
    );
  }

  for (const tag of metadata._deprecatedTags ?? []) {
    if (tag.startsWith('arch-role:')) {
      const value = tag.substring('arch-role:'.length);
      const canonicalRole = resolveCanonicalRole(value, roles) ?? value;
      diagnostics.push(
        createDeprecatedTagDiagnostic(filePath, tag, `@architect-role:${canonicalRole}`)
      );
      continue;
    }
    if (tag.startsWith('arch-context:')) {
      const value = tag.substring('arch-context:'.length);
      diagnostics.push(
        createDeprecatedTagDiagnostic(filePath, tag, `@architect-bounded-context:${value}`)
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
        `@architect-role:${resolveCanonicalRole(tag, roles) ?? tag}`
      )
    );
  }

  return diagnostics;
}

function buildGherkinRawPattern(input: {
  relativePath: string;
  filePath: string;
  patternId: string;
  patternName: string;
  feature: ScannedGherkinFile['feature'];
  metadata: ReturnType<typeof extractPatternTags>;
  whenToUse: readonly string[];
  scenarios: readonly GherkinScenario[];
  rules: readonly GherkinRule[] | undefined;
  deliverables: readonly Deliverable[];
  unlockReason: string | undefined;
  behaviorFile: string | undefined;
  behaviorFileVerified: boolean | undefined;
}): Record<string, unknown> {
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

  const rawPattern: Record<string, unknown> = {
    id: patternId,
    name: patternName,
    ...(metadata.role !== undefined && { role: metadata.role }),
    directive: {
      tags: feature.tags.map((tag) =>
        asDirectiveTag(`@architect-${tag}`)
      ) as readonly DirectiveTag[],
      description: feature.description,
      examples: [],
      position: { startLine: feature.line, endLine: feature.line },
      status: metadata.status,
      ...(unlockReason !== undefined && { unlockReason }),
      ...(metadata.boundedContext !== undefined && { boundedContext: metadata.boundedContext }),
      phase: metadata.phase,
      ...(metadata.role !== undefined && { role: metadata.role }),
      ...(metadata.uses !== undefined && metadata.uses.length > 0 && { uses: metadata.uses }),
      ...(metadata.level !== undefined && { level: metadata.level }),
      ...(metadata.parent !== undefined && { parent: metadata.parent }),
      ...(metadata.executableSpecs !== undefined && { executableSpecs: metadata.executableSpecs }),
    },
    code: '',
    source: {
      file: asSourceFilePath(relativePath),
      lines: [feature.line, feature.line] as const,
    },
    exports: [],
    extractedAt: new Date().toISOString(),
  };

  assignIfDefined(rawPattern, 'patternName', metadata.pattern);
  assignIfDefined(rawPattern, 'status', metadata.status);
  assignIfDefined(rawPattern, 'boundedContext', metadata.boundedContext);
  assignIfDefined(rawPattern, 'unlockReason', unlockReason);
  assignIfDefined(rawPattern, 'phase', metadata.phase);
  assignIfDefined(rawPattern, 'release', metadata.release);
  assignIfNonEmpty(rawPattern, 'uses', metadata.uses);
  assignIfNonEmpty(rawPattern, 'implementsPatterns', metadata.implementsPatterns);
  assignIfNonEmpty(rawPattern, 'seeAlso', metadata.seeAlso);
  assignIfNonEmpty(rawPattern, 'apiRef', metadata.apiRef);
  assignIfDefined(rawPattern, 'extendsPattern', metadata.extendsPattern);
  assignIfDefined(rawPattern, 'targetPath', metadata.target);
  assignIfDefined(rawPattern, 'since', metadata.since);
  assignIfNonEmpty(rawPattern, 'executableSpecs', metadata.executableSpecs);
  assignIfDefined(rawPattern, 'quarter', metadata.quarter);
  assignIfDefined(rawPattern, 'completed', metadata.completed);
  assignIfDefined(rawPattern, 'effort', metadata.effort);
  assignIfDefined(rawPattern, 'effortActual', metadata.effortActual);
  assignIfDefined(rawPattern, 'team', metadata.team);
  assignIfDefined(rawPattern, 'workflow', metadata.workflow);
  assignIfDefined(rawPattern, 'risk', metadata.risk);
  assignIfDefined(rawPattern, 'priority', metadata.priority);
  assignIfDefined(rawPattern, 'productArea', metadata.productArea);
  assignIfDefined(rawPattern, 'userRole', metadata.userRole);
  assignIfDefined(rawPattern, 'businessValue', metadata.businessValue);
  assignIfDefined(rawPattern, 'level', metadata.level);
  assignIfDefined(rawPattern, 'parent', metadata.parent);
  assignIfNonEmpty(rawPattern, 'discoveredGaps', metadata.discoveredGaps);
  assignIfNonEmpty(rawPattern, 'discoveredImprovements', metadata.discoveredImprovements);
  assignIfNonEmpty(rawPattern, 'discoveredRisks', metadata.discoveredRisks);
  assignIfNonEmpty(rawPattern, 'discoveredLearnings', metadata.discoveredLearnings);
  assignIfNonEmpty(rawPattern, 'constraints', metadata.constraints);
  assignIfDefined(rawPattern, 'adr', metadata.adr);
  assignIfDefined(rawPattern, 'adrStatus', metadata.adrStatus);
  assignIfDefined(rawPattern, 'adrCategory', metadata.adrCategory);
  assignIfDefined(rawPattern, 'adrSupersedes', metadata.adrSupersedes);
  assignIfDefined(rawPattern, 'adrSupersededBy', metadata.adrSupersededBy);
  assignIfDefined(rawPattern, 'adrTheme', metadata.adrTheme);
  assignIfDefined(rawPattern, 'adrLayer', metadata.adrLayer);
  assignIfNonEmpty(rawPattern, 'convention', metadata.convention);
  assignIfNonEmpty(rawPattern, 'include', metadata.include);
  assignIfNonEmpty(rawPattern, 'whenToUse', whenToUse);
  assignIfNonEmpty(rawPattern, 'deliverables', deliverables);

  if (scenarios.length > 0) {
    rawPattern['scenarios'] = scenarios.map((scenario) => {
      const scenarioRef: Record<string, unknown> = {
        featureFile: relativePath,
        featureName: feature.name,
        featureDescription: feature.description,
        scenarioName: scenario.name,
        semanticTags: scenario.tags.filter((tag) =>
          (SEMANTIC_SCENARIO_TAGS as readonly string[]).includes(tag)
        ),
        tags: scenario.tags,
        layer: inferFeatureLayer(filePath),
        line: scenario.line,
      };
      if (scenario.steps.length > 0) {
        scenarioRef['steps'] = scenario.steps.map((step) => {
          const stepObj: Record<string, unknown> = { keyword: step.keyword, text: step.text };
          assignIfDefined(stepObj, 'dataTable', step.dataTable);
          assignIfDefined(stepObj, 'docString', step.docString);
          return stepObj;
        });
      }
      return scenarioRef;
    });
  }

  assignIfDefined(rawPattern, 'behaviorFile', behaviorFile);
  if (behaviorFileVerified !== undefined) rawPattern['behaviorFileVerified'] = behaviorFileVerified;

  if (rules && rules.length > 0) {
    rawPattern['rules'] = rules.map((rule) => {
      return {
        name: rule.name,
        description: rule.description,
        scenarioCount: rule.scenarios.length,
        scenarioNames: rule.scenarios.map((scenario) => scenario.name),
        ...(rule.tags.length > 0 && { tags: rule.tags }),
      };
    });
  }

  return rawPattern;
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

export function extractPatternsFromGherkin(
  scannedFiles: readonly ScannedGherkinFile[],
  config: GherkinExtractorConfig
): GherkinExtractionResult {
  const patterns: ExtractedPattern[] = [];
  const errors: GherkinPatternValidationError[] = [];
  const diagnostics: ExtractionDiagnostic[] = [];
  const { baseDir } = config;
  const scenariosAsUseCases = config.scenariosAsUseCases ?? true;
  const effectiveRegistry = config.tagRegistry ?? createDefaultTagRegistry();

  for (const file of scannedFiles) {
    const { feature, scenarios, rules, filePath } = file;
    const relativePath = path.relative(baseDir, filePath);
    const metadata = extractPatternTags(feature.tags, effectiveRegistry);

    const hasOptIn = feature.tags.some((tag) => tag === 'architect');
    if (!hasOptIn) continue;

    const unrecognizedEnums = metadata['_unrecognizedEnums'] as
      | { tag: string; value: string; validValues: readonly string[] }[]
      | undefined;
    if (unrecognizedEnums !== undefined) {
      for (const entry of unrecognizedEnums) {
        const code =
          entry.tag === 'status'
            ? ('unrecognized-status' as const)
            : ('invalid-enum-value' as const);
        diagnostics.push(
          createDiagnostic(
            relativePath,
            code,
            `Unrecognized value '${entry.value}' for @architect-${entry.tag}`,
            `Valid values: ${entry.validValues.join(', ')}`
          )
        );
      }
    }

    diagnostics.push(
      ...collectDeprecatedTagDiagnostics(metadata, relativePath, effectiveRegistry.roles)
    );

    if (!metadata.pattern) {
      diagnostics.push(
        createDiagnostic(
          relativePath,
          'missing-pattern-name',
          'File has @architect gate tag but no @architect-pattern tag',
          'Add @architect-pattern YourPatternName'
        )
      );
      continue;
    }

    if (!metadata.status) {
      const nonCandidateStatuses = ACCEPTED_STATUS_VALUES.filter((v) => v !== 'candidate').join(
        '/'
      );
      diagnostics.push(
        createDiagnostic(
          relativePath,
          'missing-status',
          'File has @architect gate tag but no @architect-status tag',
          `Add @architect-status candidate (or ${nonCandidateStatuses})`
        )
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

    let behaviorFile = metadata.behaviorFile;
    let behaviorFileVerified: boolean | undefined;
    if (!behaviorFile) {
      const inferred = inferBehaviorFilePath(relativePath);
      if (inferred) {
        behaviorFile = inferred;
        behaviorFileVerified = fileExistsSync(path.join(baseDir, inferred));
      }
    } else {
      behaviorFileVerified = fileExistsSync(path.join(baseDir, behaviorFile));
    }

    const { unlockReason, diagnostic: unlockReasonDiagnostic } = validateUnlockReason(
      metadata.unlockReason,
      relativePath
    );
    if (unlockReasonDiagnostic !== undefined) diagnostics.push(unlockReasonDiagnostic);

    const validation = ExtractedPatternSchema.safeParse(
      buildGherkinRawPattern({
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
      })
    );

    if (!validation.success) {
      const validationErrors = validation.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      diagnostics.push(...createPatternContractDiagnostics(relativePath, validationErrors));
      errors.push(
        createGherkinPatternValidationError(
          relativePath,
          patternName,
          'Schema validation failed',
          validationErrors
        )
      );
      continue;
    }

    patterns.push(validation.data);
  }

  return { patterns, errors, diagnostics };
}

export function inferBehaviorFilePath(timelineFilePath: string): string | undefined {
  const match = /phase-\d+[a-z]?-(.+)\.feature$/.exec(timelineFilePath);
  return match?.[1] ? `tests/features/behavior/${match[1]}.feature` : undefined;
}

function fileExistsSync(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

async function fileExistsAsync(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function extractPatternsFromGherkinAsync(
  scannedFiles: readonly ScannedGherkinFile[],
  config: GherkinExtractorConfig
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
    if (!hasOptIn) continue;

    diagnostics.push(
      ...collectDeprecatedTagDiagnostics(metadata, relativePath, effectiveRegistry.roles)
    );

    if (!metadata.pattern) {
      diagnostics.push(
        createDiagnostic(
          relativePath,
          'missing-pattern-name',
          'File has @architect gate tag but no @architect-pattern tag',
          'Add @architect-pattern YourPatternName'
        )
      );
      continue;
    }

    if (!metadata.status) {
      const nonCandidateStatuses = ACCEPTED_STATUS_VALUES.filter((v) => v !== 'candidate').join(
        '/'
      );
      diagnostics.push(
        createDiagnostic(
          relativePath,
          'missing-status',
          'File has @architect gate tag but no @architect-status tag',
          `Add @architect-status candidate (or ${nonCandidateStatuses})`
        )
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
      relativePath
    );
    if (unlockReasonDiagnostic !== undefined) diagnostics.push(unlockReasonDiagnostic);

    let behaviorFile = metadata.behaviorFile;
    let behaviorPathToVerify: string | undefined;
    if (!behaviorFile) {
      const inferred = inferBehaviorFilePath(relativePath);
      if (inferred) {
        behaviorFile = inferred;
        behaviorPathToVerify = path.join(baseDir, inferred);
      }
    } else {
      behaviorPathToVerify = path.join(baseDir, behaviorFile);
    }

    void metadata.status;

    const validation = ExtractedPatternSchema.safeParse(
      buildGherkinRawPattern({
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
      })
    );

    if (!validation.success) {
      errors.push(
        createGherkinPatternValidationError(
          relativePath,
          patternName,
          'Schema validation failed',
          validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        )
      );
      continue;
    }

    if (behaviorPathToVerify !== undefined)
      patternsToVerify.push({ pattern: validation.data, behaviorPathToVerify });
    else patternsToVerify.push({ pattern: validation.data });
  }

  const patterns = await Promise.all(
    patternsToVerify.map(async ({ pattern, behaviorPathToVerify }) => {
      if (behaviorPathToVerify) {
        const exists = await fileExistsAsync(behaviorPathToVerify);
        return { ...pattern, behaviorFileVerified: exists } as ExtractedPattern;
      }
      return pattern;
    })
  );

  return { patterns, errors, diagnostics };
}

export function computeHierarchyChildren(
  patterns: readonly ExtractedPattern[]
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
      return { ...pattern, children } as ExtractedPattern;
    }
    return pattern;
  });
}
