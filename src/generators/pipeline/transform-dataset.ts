/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-core
 * @libar-docs-pattern TransformDataset
 * @libar-docs-status completed
 * @libar-docs-implements PatternRelationshipModel
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-include pipeline-stages
 * @libar-docs-uses MasterDataset, ExtractedPattern, TagRegistry, NormalizeStatus
 * @libar-docs-used-by Orchestrator
 * @libar-docs-usecase "When computing all pattern views in a single pass"
 * @libar-docs-usecase "When transforming raw extracted data for generators"
 * @libar-docs-extract-shapes RuntimeMasterDataset, RawDataset, transformToMasterDataset
 *
 * ## TransformDataset - Single-Pass Pattern Transformation
 *
 * Transforms raw extracted patterns into a MasterDataset with all pre-computed
 * views. This is the core of the unified transformation pipeline, computing
 * status groups, phase groups, quarter groups, category groups, and source
 * groups in a single iteration over the pattern array.
 *
 * ### When to Use
 *
 * - Use in orchestrator after pattern extraction and merging
 * - Use when you need pre-computed views for multiple generators
 *
 * ### Key Concepts
 *
 * - **Single-pass**: O(n) complexity regardless of view count
 * - **Immutable output**: Returns a new MasterDataset object
 * - **Workflow integration**: Uses workflow config for phase names
 */

import type { ExtractedPattern } from '../../validation-schemas/index.js';
import { ExtractedPatternSchema } from '../../validation-schemas/index.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import type {
  StatusGroups,
  StatusCounts,
  PhaseGroup,
  SourceViews,
  RelationshipEntry,
  ArchIndex,
  SequenceIndexEntry,
} from '../../validation-schemas/master-dataset.js';

import { normalizeStatus, ACCEPTED_STATUS_VALUES } from '../../taxonomy/index.js';
import { buildSequenceIndexEntryWithValidation } from './sequence-utils.js';
import { inferContext } from './context-inference.js';
import { buildReverseLookups, detectDanglingReferences } from './relationship-resolver.js';
import type {
  MalformedPattern,
  ValidationSummary,
  TransformResult,
  RuntimeMasterDataset,
  RawDataset,
} from './transform-types.js';

/**
 * Check if a status value is a known/valid status.
 */
function isKnownStatus(status: string | undefined): boolean {
  if (!status) return true; // undefined is acceptable (defaults to planned)
  return ACCEPTED_STATUS_VALUES.includes(status as (typeof ACCEPTED_STATUS_VALUES)[number]);
}

/**
 * Transform raw extracted data into a MasterDataset with all pre-computed views.
 *
 * This is a ONE-PASS transformation that computes:
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Optional relationship index
 *
 * For backward compatibility, this function returns just the dataset.
 * Use `transformToMasterDatasetWithValidation` to get validation summary.
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns MasterDataset with all pre-computed views
 */
export function transformToMasterDataset(raw: RawDataset): RuntimeMasterDataset {
  return transformToMasterDatasetWithValidation(raw).dataset;
}

/**
 * Transform raw extracted data into a MasterDataset with validation summary.
 *
 * This is the full transformation that includes:
 * - Pre-loop validation against ExtractedPatternSchema
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Relationship index with dangling reference detection
 * - Validation summary with malformed patterns and unknown statuses
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns TransformResult with dataset and validation summary
 */
export function transformToMasterDatasetWithValidation(raw: RawDataset): TransformResult {
  const { patterns, tagRegistry, workflow, contextInferenceRules } = raw;

  // ─────────────────────────────────────────────────────────────────────────
  // Validation tracking
  // ─────────────────────────────────────────────────────────────────────────

  const malformedPatterns: MalformedPattern[] = [];
  const unknownStatusSet = new Set<string>();

  // ─────────────────────────────────────────────────────────────────────────
  // Pre-loop validation: validate each pattern against schema
  // ─────────────────────────────────────────────────────────────────────────

  const allPatternNames = new Set<string>();
  for (const pattern of patterns) {
    allPatternNames.add(getPatternName(pattern));
  }

  for (const pattern of patterns) {
    const parseResult = ExtractedPatternSchema.safeParse(pattern);
    if (!parseResult.success) {
      const patternId = getPatternName(pattern);
      const issues = parseResult.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      malformedPatterns.push({ patternId, issues });
    }

    if (pattern.status && !isKnownStatus(pattern.status)) {
      unknownStatusSet.add(pattern.status);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize accumulators for single-pass computation
  // ─────────────────────────────────────────────────────────────────────────

  const byStatus: StatusGroups = {
    completed: [],
    active: [],
    planned: [],
  };

  const byPhaseMap = new Map<number, ExtractedPattern[]>();
  const byQuarter: Record<string, ExtractedPattern[]> = {};
  const byCategoryMap = new Map<string, ExtractedPattern[]>();

  const bySource: SourceViews = {
    typescript: [],
    gherkin: [],
    roadmap: [],
    prd: [],
  };

  const byProductAreaMap: Record<string, ExtractedPattern[]> = {};
  const relationshipIndex: Record<string, RelationshipEntry> = {};
  const sequenceIndex: Record<string, SequenceIndexEntry> = {};

  const archIndex: ArchIndex = {
    byRole: {},
    byContext: {},
    byLayer: {},
    byView: {},
    all: [],
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Single pass over all patterns
  // ─────────────────────────────────────────────────────────────────────────

  for (const pattern of patterns) {
    // ─── Status grouping ───────────────────────────────────────────────────
    const status = normalizeStatus(pattern.status);
    byStatus[status].push(pattern);

    // ─── Phase grouping ────────────────────────────────────────────────────
    if (pattern.phase !== undefined) {
      const existing = byPhaseMap.get(pattern.phase) ?? [];
      existing.push(pattern);
      byPhaseMap.set(pattern.phase, existing);
      bySource.roadmap.push(pattern);
    }

    // ─── Quarter grouping ──────────────────────────────────────────────────
    if (pattern.quarter) {
      const quarter = pattern.quarter;
      const quarterPatterns = (byQuarter[quarter] ??= []);
      quarterPatterns.push(pattern);
    }

    // ─── Category grouping ─────────────────────────────────────────────────
    const category = pattern.category;
    const categoryPatterns = byCategoryMap.get(category) ?? [];
    categoryPatterns.push(pattern);
    byCategoryMap.set(category, categoryPatterns);

    // ─── Source grouping ───────────────────────────────────────────────────
    if (pattern.source.file.endsWith('.feature') || pattern.source.file.endsWith('.feature.md')) {
      bySource.gherkin.push(pattern);
    } else {
      bySource.typescript.push(pattern);
    }

    // ─── PRD grouping (has productArea, userRole, or businessValue) ────────
    if (pattern.productArea || pattern.userRole || pattern.businessValue) {
      bySource.prd.push(pattern);
    }

    // ─── Product area grouping ──────────────────────────────────────────
    if (pattern.productArea) {
      const areaPatterns = (byProductAreaMap[pattern.productArea] ??= []);
      areaPatterns.push(pattern);
    }

    // ─── Relationship index ────────────────────────────────────────────────
    const patternKey = getPatternName(pattern);
    relationshipIndex[patternKey] = {
      uses: [...(pattern.uses ?? [])],
      usedBy: [...(pattern.usedBy ?? [])],
      dependsOn: [...(pattern.dependsOn ?? [])],
      enables: [...(pattern.enables ?? [])],
      implementsPatterns: [...(pattern.implementsPatterns ?? [])],
      implementedBy: [], // Computed by buildReverseLookups
      extendsPattern: pattern.extendsPattern,
      extendedBy: [], // Computed by buildReverseLookups
      seeAlso: [...(pattern.seeAlso ?? [])],
      apiRef: [...(pattern.apiRef ?? [])],
    };

    // ─── Architecture index (for diagram generation) ──────────────────────
    const inferredContext =
      pattern.archContext ?? inferContext(pattern.source.file, contextInferenceRules);

    const hasArchMetadata =
      pattern.archRole !== undefined ||
      inferredContext !== undefined ||
      pattern.archLayer !== undefined ||
      (pattern.include !== undefined && pattern.include.length > 0);
    if (hasArchMetadata) {
      archIndex.all.push(pattern);

      if (pattern.archRole) {
        const rolePatterns = (archIndex.byRole[pattern.archRole] ??= []);
        rolePatterns.push(pattern);
      }

      if (inferredContext) {
        const contextPatterns = (archIndex.byContext[inferredContext] ??= []);
        contextPatterns.push(pattern);
      }

      if (pattern.archLayer) {
        const layerPatterns = (archIndex.byLayer[pattern.archLayer] ??= []);
        layerPatterns.push(pattern);
      }

      if (pattern.include) {
        for (const view of pattern.include) {
          if (view.length === 0) continue;
          const viewPatterns = (archIndex.byView[view] ??= []);
          viewPatterns.push(pattern);
        }
      }
    }

    // ─── Sequence index (for design review diagram generation) ────────────
    if (pattern.sequenceOrchestrator) {
      if (pattern.rules && pattern.rules.length > 0) {
        const result = buildSequenceIndexEntryWithValidation(
          pattern.sequenceOrchestrator,
          pattern.rules
        );
        if (result.entry !== undefined) {
          sequenceIndex[patternKey] = result.entry;
        } else if (result.issues.length > 0) {
          malformedPatterns.push({
            patternId: patternKey,
            issues: [...result.issues],
          });
        } else {
          malformedPatterns.push({
            patternId: patternKey,
            issues: [
              'Has @libar-docs-sequence-orchestrator but no rules with @libar-docs-sequence-step tags',
            ],
          });
        }
      } else {
        malformedPatterns.push({
          patternId: patternKey,
          issues: [
            'Has @libar-docs-sequence-orchestrator but no Rule: blocks to extract sequence steps from',
          ],
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Second pass: compute reverse lookups (implementedBy, extendedBy, enables, usedBy)
  // ─────────────────────────────────────────────────────────────────────────

  buildReverseLookups(patterns, relationshipIndex);

  // ─────────────────────────────────────────────────────────────────────────
  // Third pass: detect dangling references in relationship fields
  // ─────────────────────────────────────────────────────────────────────────

  const danglingReferences = detectDanglingReferences(patterns, allPatternNames);

  // ─────────────────────────────────────────────────────────────────────────
  // Build phase groups with counts (sorted by phase number)
  // ─────────────────────────────────────────────────────────────────────────

  const byPhase: PhaseGroup[] = Array.from(byPhaseMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([phaseNumber, phasePatterns]) => {
      const workflowPhaseName = workflow?.config.phases.find((p) => p.order === phaseNumber)?.name;
      const firstPattern = phasePatterns[0];
      const derivedName = firstPattern?.name;

      return {
        phaseNumber,
        phaseName: workflowPhaseName ?? derivedName,
        patterns: phasePatterns,
        counts: computeCounts(phasePatterns),
      };
    });

  // ─────────────────────────────────────────────────────────────────────────
  // Assemble final MasterDataset
  // ─────────────────────────────────────────────────────────────────────────

  const byCategory = Object.fromEntries(byCategoryMap);

  const counts: StatusCounts = {
    completed: byStatus.completed.length,
    active: byStatus.active.length,
    planned: byStatus.planned.length,
    total: patterns.length,
  };

  const unknownStatuses = [...unknownStatusSet];
  const validation: ValidationSummary = {
    totalPatterns: patterns.length,
    malformedPatterns,
    danglingReferences,
    unknownStatuses,
    warningCount: malformedPatterns.length + danglingReferences.length + unknownStatuses.length,
  };

  const dataset: RuntimeMasterDataset = {
    patterns: patterns as ExtractedPattern[],
    tagRegistry,
    byStatus,
    byPhase,
    byQuarter,
    byCategory,
    bySource,
    byProductArea: byProductAreaMap,
    counts,
    phaseCount: byPhaseMap.size,
    categoryCount: byCategoryMap.size,
    relationshipIndex,
    ...(archIndex.all.length > 0 && { archIndex }),
    ...(Object.keys(sequenceIndex).length > 0 && { sequenceIndex }),
  };

  if (workflow !== undefined) {
    return { dataset: { ...dataset, workflow }, validation };
  }

  return { dataset, validation };
}

/**
 * Compute status counts for a subset of patterns
 */
function computeCounts(patterns: readonly ExtractedPattern[]): StatusCounts {
  let completed = 0;
  let active = 0;
  let planned = 0;

  for (const p of patterns) {
    const s = normalizeStatus(p.status);
    if (s === 'completed') completed++;
    else if (s === 'active') active++;
    else planned++;
  }

  return {
    completed,
    active,
    planned,
    total: patterns.length,
  };
}

/**
 * Compute completion percentage from status counts
 */
export function completionPercentage(counts: StatusCounts): number {
  if (counts.total === 0) return 0;
  return Math.round((counts.completed / counts.total) * 100);
}

/**
 * Check if all items in a phase/group are completed
 */
export function isFullyCompleted(counts: StatusCounts): boolean {
  return counts.total > 0 && counts.completed === counts.total;
}
