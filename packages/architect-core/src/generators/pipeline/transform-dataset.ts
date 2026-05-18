import type { ExtractedPattern } from '../../validation-schemas/index.js';
import { ExtractedPatternSchema } from '../../validation-schemas/index.js';
import { getPatternName } from '../../read-api/pattern-helpers.js';
import type {
  ExactStatusGroups,
  StatusGroups,
  StatusCounts,
  PhaseGroup,
  SourceViews,
  RelationshipEntry,
  ArchIndex,
} from '../../validation-schemas/pattern-graph.js';
import { inferMaturity, normalizeStatus, ACCEPTED_STATUS_VALUES } from '../../taxonomy/index.js';
import { inferContext } from './context-inference.js';
import {
  createRelationshipEntry,
  buildReverseLookups,
  detectDanglingReferences,
} from './relationship-resolver.js';
import type {
  MalformedPattern,
  ValidationSummary,
  TransformResult,
  RuntimePatternGraph,
  RawDataset,
} from './transform-types.js';

function isKnownStatus(status: string | undefined): boolean {
  if (!status) return true;
  return ACCEPTED_STATUS_VALUES.includes(status as (typeof ACCEPTED_STATUS_VALUES)[number]);
}

interface RegistryRoleDefinition {
  readonly tag: string;
  readonly priority: number;
  readonly aliases?: readonly string[] | undefined;
}

function buildCanonicalRoleLookup(
  roles: readonly RegistryRoleDefinition[],
): ReadonlyMap<string, string> {
  const canonicalRoleByValue = new Map<string, string>();
  for (const role of roles) {
    canonicalRoleByValue.set(role.tag, role.tag);
    for (const alias of role.aliases ?? []) {
      canonicalRoleByValue.set(alias, role.tag);
    }
  }
  return canonicalRoleByValue;
}

export function sortRoleDefinitionsForOutput(
  roles: readonly RegistryRoleDefinition[],
): readonly RegistryRoleDefinition[] {
  return [...roles].sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    return priorityDiff !== 0 ? priorityDiff : a.tag.localeCompare(b.tag);
  });
}

export function populateByRoleView(
  patterns: readonly ExtractedPattern[],
  roles: readonly RegistryRoleDefinition[],
): Record<string, ExtractedPattern[]> {
  const canonicalRoleByValue = buildCanonicalRoleLookup(roles);
  const groupedByRole = new Map<string, ExtractedPattern[]>();

  for (const pattern of patterns) {
    if (pattern.role === undefined) continue;
    const canonicalRole = canonicalRoleByValue.get(pattern.role);
    if (canonicalRole === undefined) continue;
    const rolePatterns = groupedByRole.get(canonicalRole) ?? [];
    rolePatterns.push(pattern);
    groupedByRole.set(canonicalRole, rolePatterns);
  }

  const byRole: Record<string, ExtractedPattern[]> = {};
  for (const role of sortRoleDefinitionsForOutput(roles)) {
    const rolePatterns = groupedByRole.get(role.tag);
    if (rolePatterns !== undefined && rolePatterns.length > 0) {
      byRole[role.tag] = rolePatterns;
    }
  }

  return byRole;
}

export function transformToPatternGraph(raw: RawDataset): RuntimePatternGraph {
  return transformToPatternGraphWithValidation(raw).dataset;
}

export function transformToPatternGraphWithValidation(raw: RawDataset): TransformResult {
  const { patterns: rawPatterns, tagRegistry, workflow, contextInferenceRules } = raw;
  const roleDefinitions: readonly RegistryRoleDefinition[] = tagRegistry.roles;
  const canonicalRoleByValue = buildCanonicalRoleLookup(roleDefinitions);

  const malformedPatterns: MalformedPattern[] = [];
  const unknownStatusSet = new Set<string>();
  const patterns: ExtractedPattern[] = [];
  const allPatternNames = new Set<string>();

  for (const pattern of rawPatterns) {
    const parseResult = ExtractedPatternSchema.safeParse(pattern);
    if (!parseResult.success) {
      malformedPatterns.push({
        patternId: getPatternName(pattern),
        issues: parseResult.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        ),
      });
      continue;
    }

    const normalizedPattern = parseResult.data;
    patterns.push(normalizedPattern);
    allPatternNames.add(getPatternName(normalizedPattern));
    if (!isKnownStatus(normalizedPattern.status)) {
      unknownStatusSet.add(normalizedPattern.status);
    }
  }

  // Canonical ordering: sort patterns lexicographically by name so all
  // downstream indices, projections, and CLI/MCP serializations are
  // deterministic across machines and runs.
  patterns.sort((a, b) => getPatternName(a).localeCompare(getPatternName(b)));

  const byStatus: ExactStatusGroups = {
    candidate: [],
    roadmap: [],
    active: [],
    completed: [],
    deferred: [],
  };
  const byNormalizedStatus: StatusGroups = {
    completed: [],
    active: [],
    planned: [],
    candidate: [],
  };
  const byMaturity: Record<string, ExtractedPattern[]> = {
    idea: [],
    plan: [],
    design: [],
    executable: [],
  };
  const byPhaseMap = new Map<number, ExtractedPattern[]>();
  const byQuarter: Record<string, ExtractedPattern[]> = {};
  const bySourceType: SourceViews = {
    typescript: [],
    gherkin: [],
    roadmap: [],
    prd: [],
  };
  const byProductAreaMap: Record<string, ExtractedPattern[]> = {};
  const relationshipIndex: Record<string, RelationshipEntry> = {};
  const archIndex: ArchIndex = {
    byRole: {},
    byContext: {},
    byLayer: {},
    byView: {},
    all: [],
  };

  for (const pattern of patterns) {
    byStatus[pattern.status].push(pattern);
    const normalizedStatus = normalizeStatus(pattern.status);
    byNormalizedStatus[normalizedStatus].push(pattern);

    const maturityBucket = byMaturity[inferMaturity(pattern.status)];
    if (maturityBucket !== undefined) {
      maturityBucket.push(pattern);
    }

    if (pattern.phase !== undefined) {
      const existing = byPhaseMap.get(pattern.phase) ?? [];
      existing.push(pattern);
      byPhaseMap.set(pattern.phase, existing);
      bySourceType.roadmap.push(pattern);
    }

    if (pattern.quarter) {
      const quarterPatterns = byQuarter[pattern.quarter] ?? [];
      quarterPatterns.push(pattern);
      byQuarter[pattern.quarter] = quarterPatterns;
    }

    if (pattern.source.file.endsWith('.feature') || pattern.source.file.endsWith('.feature.md')) {
      bySourceType.gherkin.push(pattern);
    } else {
      bySourceType.typescript.push(pattern);
    }

    if (pattern.productArea || pattern.userRole || pattern.businessValue) {
      bySourceType.prd.push(pattern);
    }

    if (pattern.productArea) {
      const productAreaPatterns = byProductAreaMap[pattern.productArea] ?? [];
      productAreaPatterns.push(pattern);
      byProductAreaMap[pattern.productArea] = productAreaPatterns;
    }

    const patternKey = getPatternName(pattern);
    relationshipIndex[patternKey] = createRelationshipEntry(pattern);

    const inferredContext =
      pattern.boundedContext ?? inferContext(pattern.source.file, contextInferenceRules);
    const canonicalRole =
      pattern.role !== undefined ? canonicalRoleByValue.get(pattern.role) : undefined;
    const hasArchMetadata =
      canonicalRole !== undefined ||
      inferredContext !== undefined ||
      (pattern.include !== undefined && pattern.include.length > 0);

    if (hasArchMetadata) {
      archIndex.all.push(pattern);
      if (canonicalRole !== undefined) {
        const rolePatterns = archIndex.byRole[canonicalRole] ?? [];
        rolePatterns.push(pattern);
        archIndex.byRole[canonicalRole] = rolePatterns;
      }
      if (inferredContext) {
        const contextPatterns = archIndex.byContext[inferredContext] ?? [];
        contextPatterns.push(pattern);
        archIndex.byContext[inferredContext] = contextPatterns;
      }
      if (pattern.include) {
        for (const view of pattern.include) {
          if (view.length === 0) continue;
          const viewPatterns = archIndex.byView[view] ?? [];
          viewPatterns.push(pattern);
          archIndex.byView[view] = viewPatterns;
        }
      }
    }
  }

  buildReverseLookups(patterns, relationshipIndex);
  const danglingReferences = detectDanglingReferences(patterns, allPatternNames);

  const byPhase: PhaseGroup[] = Array.from(byPhaseMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([phaseNumber, phasePatterns]) => ({
      phaseNumber,
      phaseName:
        workflow?.config.phases.find((phase) => phase.order === phaseNumber)?.name ??
        phasePatterns[0]?.name,
      patterns: phasePatterns,
      counts: computeCounts(phasePatterns),
    }));

  const byRole = populateByRoleView(patterns, roleDefinitions);
  const counts: StatusCounts = {
    completed: byNormalizedStatus.completed.length,
    active: byNormalizedStatus.active.length,
    planned: byNormalizedStatus.planned.length,
    candidate: byNormalizedStatus.candidate.length,
    total: patterns.length,
  };

  const validation: ValidationSummary = {
    totalPatterns: patterns.length,
    malformedPatterns,
    danglingReferences,
    unknownStatuses: [...unknownStatusSet],
    warningCount: malformedPatterns.length + danglingReferences.length + unknownStatusSet.size,
  };

  const nameIndex = new Map<string, ExtractedPattern>();
  for (const pattern of patterns) {
    const key = getPatternName(pattern).toLowerCase();
    if (!nameIndex.has(key)) nameIndex.set(key, pattern);
  }

  const dataset: RuntimePatternGraph = {
    patterns,
    tagRegistry,
    byStatus,
    byNormalizedStatus,
    byMaturity,
    byPhase,
    byQuarter,
    byRole,
    bySourceType,
    byProductArea: byProductAreaMap,
    counts,
    phaseCount: byPhaseMap.size,
    roleCount: Object.keys(byRole).length,
    relationshipIndex,
    nameIndex,
    ...(raw.featureParseFailures !== undefined
      ? { featureParseFailures: [...raw.featureParseFailures] }
      : {}),
    ...(archIndex.all.length > 0 && { archIndex }),
  };

  if (workflow !== undefined) {
    return { dataset: { ...dataset, workflow }, validation };
  }

  return { dataset, validation };
}

function computeCounts(patterns: readonly ExtractedPattern[]): StatusCounts {
  let completed = 0;
  let active = 0;
  let planned = 0;
  let candidate = 0;

  for (const pattern of patterns) {
    const status = normalizeStatus(pattern.status);
    if (status === 'completed') completed++;
    else if (status === 'active') active++;
    else if (status === 'candidate') candidate++;
    else planned++;
  }

  return { completed, active, planned, candidate, total: patterns.length };
}
