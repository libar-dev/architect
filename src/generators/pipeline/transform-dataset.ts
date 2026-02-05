/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-core
 * @libar-docs-pattern TransformDataset
 * @libar-docs-status completed
 * @libar-docs-implements PatternRelationshipModel
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
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

import type { ExtractedPattern, TagRegistry } from '../../validation-schemas/index.js';
import type { LoadedWorkflow } from '../../config/workflow-loader.js';
import type {
  StatusGroups,
  StatusCounts,
  PhaseGroup,
  SourceViews,
  RelationshipEntry,
  ImplementationRef,
  ArchIndex,
} from '../../validation-schemas/master-dataset.js';

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import { normalizeStatus } from '../../taxonomy/index.js';

/**
 * Runtime MasterDataset with optional workflow
 *
 * Extends the Zod-compatible MasterDataset with workflow reference.
 * LoadedWorkflow contains Maps which aren't JSON-serializable,
 * so it's kept separate from the Zod schema.
 */
export interface RuntimeMasterDataset extends MasterDataset {
  /** Optional workflow configuration (not serializable) */
  readonly workflow?: LoadedWorkflow;
}

/**
 * Raw input data for transformation
 */
export interface RawDataset {
  /** Extracted patterns from TypeScript and/or Gherkin sources */
  readonly patterns: readonly ExtractedPattern[];

  /** Tag registry for category lookups */
  readonly tagRegistry: TagRegistry;

  /** Optional workflow configuration for phase names (can be undefined) */
  readonly workflow?: LoadedWorkflow | undefined;
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
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns MasterDataset with all pre-computed views
 *
 * @example
 * ```typescript
 * const masterDataset = transformToMasterDataset({
 *   patterns: mergedPatterns,
 *   tagRegistry: registry,
 *   workflow,
 * });
 *
 * // Access pre-computed views
 * const completed = masterDataset.byStatus.completed;
 * const phase3Patterns = masterDataset.byPhase.find(p => p.phaseNumber === 3);
 * const q42024 = masterDataset.byQuarter["Q4-2024"];
 * ```
 */
export function transformToMasterDataset(raw: RawDataset): RuntimeMasterDataset {
  const { patterns, tagRegistry, workflow } = raw;

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

  const relationshipIndex: Record<string, RelationshipEntry> = {};

  // Architecture index for diagram generation
  const archIndex: ArchIndex = {
    byRole: {},
    byContext: {},
    byLayer: {},
    all: [],
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Single pass over all patterns
  // ─────────────────────────────────────────────────────────────────────────

  for (const pattern of patterns) {
    // Reference for accumulation
    const p = pattern;

    // ─── Status grouping ───────────────────────────────────────────────────
    const status = normalizeStatus(pattern.status);
    byStatus[status].push(p);

    // ─── Phase grouping ────────────────────────────────────────────────────
    if (pattern.phase !== undefined) {
      const existing = byPhaseMap.get(pattern.phase) ?? [];
      existing.push(p);
      byPhaseMap.set(pattern.phase, existing);

      // Also add to roadmap view (patterns with phase are roadmap items)
      bySource.roadmap.push(p);
    }

    // ─── Quarter grouping ──────────────────────────────────────────────────
    if (pattern.quarter) {
      const quarter = pattern.quarter;
      const quarterPatterns = (byQuarter[quarter] ??= []);
      quarterPatterns.push(p);
    }

    // ─── Category grouping ─────────────────────────────────────────────────
    const category = pattern.category;
    const categoryPatterns = byCategoryMap.get(category) ?? [];
    categoryPatterns.push(p);
    byCategoryMap.set(category, categoryPatterns);

    // ─── Source grouping ───────────────────────────────────────────────────
    if (pattern.source.file.endsWith('.feature')) {
      bySource.gherkin.push(p);
    } else {
      bySource.typescript.push(p);
    }

    // ─── PRD grouping (has productArea, userRole, or businessValue) ────────
    if (pattern.productArea || pattern.userRole || pattern.businessValue) {
      bySource.prd.push(p);
    }

    // ─── Relationship index ────────────────────────────────────────────────
    const patternKey = pattern.patternName ?? pattern.name;
    relationshipIndex[patternKey] = {
      uses: [...(pattern.uses ?? [])],
      usedBy: [...(pattern.usedBy ?? [])],
      dependsOn: [...(pattern.dependsOn ?? [])],
      enables: [...(pattern.enables ?? [])],
      // UML-inspired relationship fields (PatternRelationshipModel)
      implementsPatterns: [...(pattern.implementsPatterns ?? [])],
      implementedBy: [], // Computed in second pass
      extendsPattern: pattern.extendsPattern,
      extendedBy: [], // Computed in second pass
      // Cross-reference and API navigation fields (PatternRelationshipModel enhancement)
      seeAlso: [...(pattern.seeAlso ?? [])],
      apiRef: [...(pattern.apiRef ?? [])],
    };

    // ─── Architecture index (for diagram generation) ──────────────────────
    const hasArchMetadata =
      pattern.archRole !== undefined ||
      pattern.archContext !== undefined ||
      pattern.archLayer !== undefined;
    if (hasArchMetadata) {
      archIndex.all.push(p);

      // Group by role (bounded-context, projection, saga, etc.)
      if (pattern.archRole) {
        const rolePatterns = (archIndex.byRole[pattern.archRole] ??= []);
        rolePatterns.push(p);
      }

      // Group by context (orders, inventory, etc.) for subgraph rendering
      if (pattern.archContext) {
        const contextPatterns = (archIndex.byContext[pattern.archContext] ??= []);
        contextPatterns.push(p);
      }

      // Group by layer (domain, application, infrastructure)
      if (pattern.archLayer) {
        const layerPatterns = (archIndex.byLayer[pattern.archLayer] ??= []);
        layerPatterns.push(p);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Second pass: compute reverse lookups (implementedBy, extendedBy)
  // ─────────────────────────────────────────────────────────────────────────

  // We iterate over patterns again to have access to source.file for implementedBy
  for (const pattern of patterns) {
    const patternKey = pattern.patternName ?? pattern.name;
    const entry = relationshipIndex[patternKey];
    if (!entry) continue;

    // Build implementedBy reverse lookup with full ImplementationRef
    for (const implemented of entry.implementsPatterns) {
      const target = relationshipIndex[implemented];
      if (target) {
        // Check if this implementation is already added (by name)
        const alreadyAdded = target.implementedBy.some(
          (impl: ImplementationRef) => impl.name === patternKey
        );
        if (!alreadyAdded) {
          // Extract first line of description if available, truncate to 100 chars
          const desc = pattern.directive.description;
          const firstLine = desc ? desc.split('\n')[0]?.trim() : undefined;
          const description =
            firstLine && firstLine.length > 0
              ? firstLine.slice(0, 100) + (firstLine.length > 100 ? '...' : '')
              : undefined;

          target.implementedBy.push({
            name: patternKey,
            file: pattern.source.file,
            description,
          });
        }
      }
    }

    // Build extendedBy reverse lookup (still uses string names)
    if (entry.extendsPattern) {
      const target = relationshipIndex[entry.extendsPattern];
      if (target && !target.extendedBy.includes(patternKey)) {
        target.extendedBy.push(patternKey);
      }
    }
  }

  // Sort implementedBy alphabetically by file path for consistent output
  for (const entry of Object.values(relationshipIndex)) {
    entry.implementedBy.sort((a: ImplementationRef, b: ImplementationRef) =>
      a.file.localeCompare(b.file)
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build phase groups with counts (sorted by phase number)
  // ─────────────────────────────────────────────────────────────────────────

  const byPhase: PhaseGroup[] = Array.from(byPhaseMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([phaseNumber, phasePatterns]) => {
      // Try workflow config first, then derive from patterns
      const workflowPhaseName = workflow?.config.phases.find((p) => p.order === phaseNumber)?.name;
      // If no workflow name, use the first pattern's name (often the phase has one primary pattern)
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
  // Convert category map to record
  // ─────────────────────────────────────────────────────────────────────────

  const byCategory = Object.fromEntries(byCategoryMap);

  // ─────────────────────────────────────────────────────────────────────────
  // Compute aggregate counts
  // ─────────────────────────────────────────────────────────────────────────

  const counts: StatusCounts = {
    completed: byStatus.completed.length,
    active: byStatus.active.length,
    planned: byStatus.planned.length,
    total: patterns.length,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Return assembled MasterDataset
  // ─────────────────────────────────────────────────────────────────────────

  const result: RuntimeMasterDataset = {
    patterns: patterns as ExtractedPattern[],
    tagRegistry,
    byStatus,
    byPhase,
    byQuarter,
    byCategory,
    bySource,
    counts,
    phaseCount: byPhaseMap.size,
    categoryCount: byCategoryMap.size,
    relationshipIndex,
    // Only include archIndex if it has content
    ...(archIndex.all.length > 0 && { archIndex }),
  };

  // Only include workflow if defined (exactOptionalPropertyTypes compliance)
  if (workflow !== undefined) {
    return { ...result, workflow };
  }

  return result;
}

/**
 * Compute status counts for a subset of patterns
 *
 * @param patterns - Patterns to count
 * @returns Status counts including total
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
 *
 * @param counts - Status counts
 * @returns Percentage (0-100) of completed items
 */
export function completionPercentage(counts: StatusCounts): number {
  if (counts.total === 0) return 0;
  return Math.round((counts.completed / counts.total) * 100);
}

/**
 * Check if all items in a phase/group are completed
 *
 * @param counts - Status counts
 * @returns True if all items are completed
 */
export function isFullyCompleted(counts: StatusCounts): boolean {
  return counts.total > 0 && counts.completed === counts.total;
}
