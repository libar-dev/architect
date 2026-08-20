/**
 * @architect
 * @architect-pattern DeliveryReportingProjectionSupport
 * @architect-status completed
 * @architect-role:utility
 * @architect-uses DeliveryReportingFragmentContracts, ExtractedPattern
 * @architect-bounded-context:projection
 *
 * ## Delivery reporting projection support
 *
 * **Value:** Centralises the pure helpers that every delivery-reporting
 * projection depends on — status counting, traceability-row shaping, slug
 * generation, and deterministic pattern sorting — so each `project*` entry
 * point stays a one-liner.
 *
 * **Invariant:** Helpers never touch the filesystem, renderable docs, or the
 * raw PatternGraph beyond `ProjectionContext`; percentage math always excludes
 * candidates from the delivery total; child keys are always deterministic
 * slugs with collision-safe numeric suffixes.
 *
 * **Behavior:**
 * - Classifies patterns with `isPatternComplete`, `isPatternActive`, and
 *   `isPatternPlanned` from `@libar-dev/architect-core`, then folds the
 *   results into a `StatusCounts` summary reused across projections.
 * - Selects the per-view pattern set for roadmap, current-work, and changelog
 *   (completed) timelines and folds it into a flat, name-sorted summary list.
 *
 * ### When to Use
 *
 * - Provides shared delivery-reporting helpers for status, timeline,
 *   changelog, and traceability projections.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import { isPatternActive, isPatternComplete, isPatternPlanned } from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import {
  type RoadmapTimeline,
  type StatusDistribution,
  type TraceabilityMatrix,
} from '../../fragments/delivery-reporting/index.js';
import type { StatusCounts, TraceRow } from '../../fragments/delivery-reporting/supporting.js';
import {
  createPatternSummaryFragment,
  getPatternName,
  getRelationships,
  uniqueSortedStrings,
} from '../_shared/pattern-helpers.internal.js';
import { slugForFilename } from '../../_internal/slug.js';
import { filterPatterns } from '../_shared/filter.js';
import { createEntityRouteId, createIndexRouteId } from '../../routing/route-id.js';

export function buildStatusDistribution(context: ProjectionContext): StatusDistribution {
  const counts = createStatusCounts(
    filterPatterns(context.graph.patterns, context.projectionFilter),
  );
  const deliveryTotal = getDeliveryTotal(counts);

  return {
    kind: 'StatusDistribution',
    counts,
    percentages:
      deliveryTotal === 0
        ? {
            completed: 0,
            active: 0,
            planned: 0,
            candidate: 0,
          }
        : {
            completed: calculateDeliveryPercentage(counts.completed, deliveryTotal),
            active: calculateDeliveryPercentage(counts.active, deliveryTotal),
            planned: calculateDeliveryPercentage(counts.planned, deliveryTotal),
            candidate: calculateDeliveryPercentage(counts.candidate, counts.total),
          },
  };
}

export function buildTimelineBundle(
  context: ProjectionContext,
  view: RoadmapTimeline['view'],
): ProjectionBundle<RoadmapTimeline> {
  const selected =
    view === 'roadmap'
      ? [...context.graph.byStatus.roadmap, ...context.graph.byStatus.deferred]
      : view === 'milestones'
        ? context.graph.byNormalizedStatus.completed
        : context.graph.byNormalizedStatus.active;

  const patterns = filterPatterns(selected, context.projectionFilter);

  return createTimelineBundle(view, patterns);
}

export function buildChangelog(context: ProjectionContext): ProjectionBundle<RoadmapTimeline> {
  const completed = filterPatterns(
    context.graph.byNormalizedStatus.completed,
    context.projectionFilter,
  );
  const sorted = sortPatterns(completed);

  const root: RoadmapTimeline = {
    kind: 'RoadmapTimeline',
    view: 'milestones',
    patterns: sorted.map((pattern) => createPatternSummaryFragment(pattern)),
    counts: createStatusCounts(sorted),
  };

  return {
    root,
    children: {},
    routing: {
      rootRouteId: createIndexRouteId('changelog'),
      childRouteIds: {},
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

export function buildTraceabilityMatrix(
  context: ProjectionContext,
): ProjectionBundle<TraceabilityMatrix> {
  const rows = buildTraceRows(context);
  const children = createChildren(
    rows,
    (row) => row.pattern,
    (row): TraceabilityMatrix => ({
      kind: 'TraceabilityMatrix',
      rows: [row],
    }),
  );
  const root: TraceabilityMatrix = {
    kind: 'TraceabilityMatrix',
    rows,
  };

  return {
    root,
    children,
    routing: {
      rootRouteId: createIndexRouteId('traceability'),
      childRouteIds: Object.fromEntries(
        Object.keys(children).map((key) => [key, createEntityRouteId('traceability', key)]),
      ),
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function createTimelineBundle(
  view: RoadmapTimeline['view'],
  patterns: readonly ExtractedPattern[],
): ProjectionBundle<RoadmapTimeline> {
  const sorted = sortPatterns(patterns);
  const root: RoadmapTimeline = {
    kind: 'RoadmapTimeline',
    view,
    patterns: sorted.map((pattern) => createPatternSummaryFragment(pattern)),
    counts: createStatusCounts(sorted),
  };

  return {
    root,
    children: {},
    routing: getTimelineRouting(view, []),
  };
}

function createStatusCounts(patterns: readonly ExtractedPattern[]): StatusCounts {
  return {
    completed: patterns.filter((pattern) => isPatternComplete(pattern.status)).length,
    active: patterns.filter((pattern) => isPatternActive(pattern.status)).length,
    planned: patterns.filter((pattern) => isPatternPlanned(pattern.status)).length,
    candidate: patterns.filter((pattern) => pattern.status === 'candidate').length,
    total: patterns.length,
  };
}

function buildTraceRows(context: ProjectionContext): TraceRow[] {
  const realized = filterPatterns(context.graph.patterns, context.projectionFilter).filter(
    (pattern) =>
      (getRelationships(context, getPatternName(pattern))?.implementedBy.length ?? 0) > 0,
  );

  return sortPatterns(realized).map((pattern) => {
    const relationships = getRelationships(context, getPatternName(pattern));
    const implementedBy = relationships?.implementedBy ?? [];

    return {
      pattern: getPatternName(pattern),
      status: pattern.status,
      // `tests` is the executable-spec realization surface only: the `.feature`
      // files that realize this pattern via `@architect-implements`. Production
      // TS implementers (e.g. a `role:projection` source that realizes a CLI
      // pattern) also appear on `implementedBy` but are NOT tests, so they are
      // excluded from the traceability `tests` column.
      tests: uniqueSortedStrings(
        implementedBy
          .map((reference) => reference.file)
          .filter((file) => isExecutableFeatureFile(file)),
      ),
      specs: [pattern.source.file],
      deliverables: deduplicateStrings(
        (pattern.deliverables ?? []).map((deliverable) => deliverable.location),
      ),
    };
  });
}

/** Executable-spec realization carriers are Gherkin `.feature` files. */
function isExecutableFeatureFile(file: string): boolean {
  return file.toLowerCase().endsWith('.feature');
}

function getTimelineRouting(
  view: RoadmapTimeline['view'],
  childKeys: readonly string[],
): NonNullable<ProjectionBundle<RoadmapTimeline>['routing']> {
  const documentType =
    view === 'roadmap' ? 'roadmap' : view === 'milestones' ? 'milestones' : 'current-work';

  return {
    rootRouteId: createIndexRouteId(documentType),
    childRouteIds: Object.fromEntries(
      childKeys.map((key) => [key, createEntityRouteId(documentType, key)]),
    ),
    childPathStrategy: 'nested',
    anchorStrategy: 'heading-slug',
  };
}

function createChildren<TEntry, TFragment extends RoadmapTimeline | TraceabilityMatrix>(
  entries: readonly TEntry[],
  label: (entry: TEntry) => string,
  createFragment: (entry: TEntry) => TFragment,
): Record<string, TFragment> {
  const children: Record<string, TFragment> = {};
  const seen = new Map<string, number>();

  for (const entry of entries) {
    const baseKey = slugForFilename(label(entry)) || 'item';
    const collisionCount = seen.get(baseKey) ?? 0;
    const collisionSuffix = String(collisionCount + 1);
    const key = collisionCount === 0 ? baseKey : `${baseKey}-${collisionSuffix}`;
    seen.set(baseKey, collisionCount + 1);
    children[key] = createFragment(entry);
  }

  return children;
}

function sortPatterns(patterns: readonly ExtractedPattern[]): ExtractedPattern[] {
  return [...patterns].sort((left, right) =>
    getPatternName(left).localeCompare(getPatternName(right), undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
}

function deduplicateStrings(values: readonly string[]): string[] {
  const unique = new Set<string>();

  for (const value of values) {
    if (value.trim().length > 0) {
      unique.add(value);
    }
  }

  return [...unique];
}

function getDeliveryTotal(counts: StatusCounts): number {
  return Math.max(counts.total - counts.candidate, 0);
}

function calculateDeliveryPercentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

// ===========================================================================
// Public projection API for the delivery-reporting subdomain.
// Each exported projectX function has its own @architect-pattern annotation
// so the PatternGraph extractor registers them separately; implementation
// delegates to the build* helpers above.
// ===========================================================================

/**
 * @architect
 * @architect-pattern StatusDistributionProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DeliveryReportingProjectionSupport, StatusDistribution
 * @architect-bounded-context:projection
 *
 * ## Status distribution projection
 *
 * **Value:** Summarises the whole pattern graph by status — completed,
 * active, planned, candidate, and total counts plus matching percentage
 * fields — in a schema-validated `StatusDistribution` fragment.
 *
 * **Invariant:** Every count bucket and every percentage bucket is always
 * present; candidate-only graphs and zero-delivery graphs produce explicit
 * zeros rather than `NaN`; the candidate percentage is computed against the
 * full pattern total while completed/active/planned are computed against
 * the delivery total.
 *
 * **Behavior:**
 * - Reuses `createStatusCounts` over the full `graph.patterns` list so
 *   classification matches phase-level progress.
 * - Divides the delivery counts by `total - candidate` to keep candidates
 *   from inflating completion, rounding each percentage to an integer.
 * - Short-circuits to all-zero percentages when the delivery total is zero,
 *   fixing the legacy division-by-zero bug.
 *
 * ### When to Use
 *
 * - Projects graph-wide status counts and percentages as a StatusDistribution
 *   bundle.
 */
export function projectStatusDistribution(
  context: ProjectionContext,
): ProjectionBundle<StatusDistribution> {
  return projectSingle(buildStatusDistribution(context));
}

/**
 * @architect
 * @architect-pattern RoadmapTimelineProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DeliveryReportingProjectionSupport, RoadmapTimeline
 * @architect-bounded-context:projection
 *
 * ## Roadmap timeline projection
 *
 * **Value:** Exposes specialised views of the pattern graph — roadmap (planned
 * + deferred) and current work (active) — each as a `RoadmapTimeline` bundle
 * with a flat, name-sorted pattern list, overall status counts, and
 * deterministic routing to its own markdown file.
 *
 * **Invariant:** Every bundle sets its `view` field to the requested
 * entrypoint, lists every selected pattern (deterministically name-sorted),
 * and reports the overall status counts for the view.
 *
 * **Behavior:**
 * - Selects the pattern set per view: `byStatus.roadmap + byStatus.deferred`
 *   for roadmap and `byNormalizedStatus.active` for current work.
 * - Sorts the patterns by name and folds them into `PatternSummary` fragments
 *   with overall status counts.
 * - Supplies view-specific `outputPath` routing so renderers emit `ROADMAP.md`
 *   or `CURRENT-WORK.md`.
 *
 * ### When to Use
 *
 * - Projects roadmap or current-work views as RoadmapTimeline bundles.
 */
export function projectRoadmapTimeline(
  context: ProjectionContext,
): ProjectionBundle<RoadmapTimeline> {
  return buildTimelineBundle(context, 'roadmap');
}

export function projectCurrentWork(context: ProjectionContext): ProjectionBundle<RoadmapTimeline> {
  return buildTimelineBundle(context, 'current');
}

/**
 * @architect
 * @architect-pattern ChangelogProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DeliveryReportingProjectionSupport, RoadmapTimeline
 * @architect-bounded-context:projection
 *
 * ## Changelog projection
 *
 * **Value:** Emits the release-free changelog — the set of `completed` patterns
 * in completion (name) order as a `RoadmapTimeline` milestones bundle — so the
 * renderer can produce `CHANGELOG.md` without any release tag or calendar date.
 * Per ADR-013 the release axis and completion-date field are retired; releases,
 * when first practiced, are derived from git tags, never annotated.
 *
 * **Invariant:** The root lists every `completed` pattern (deterministically
 * name-sorted) with overall status counts; there is no release grouping, no
 * completion-date column, and no fallback bucket. The changelog never carries
 * a child split.
 *
 * **Behavior:**
 * - Selects `byNormalizedStatus.completed`, applies the projection filter, and
 *   sorts by pattern name.
 * - Folds the set into a `RoadmapTimeline` (`view: 'milestones'`) with status
 *   counts and routes the root to `CHANGELOG.md`.
 *
 * ### When to Use
 *
 * - Projects the completed-patterns changelog as a RoadmapTimeline bundle.
 */
export function projectChangelog(context: ProjectionContext): ProjectionBundle<RoadmapTimeline> {
  return buildChangelog(context);
}

/**
 * @architect
 * @architect-pattern TraceabilityMatrixProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DeliveryReportingProjectionSupport, TraceabilityMatrix
 * @architect-bounded-context:projection
 *
 * ## Traceability matrix projection
 *
 * **Value:** Links each production pattern that carries a realization edge
 * (`@architect-implements`) to the executable features/steps that realize it,
 * plus its spec file and deliverable locations, in one `TraceabilityMatrix`
 * bundle — a ready-to-render audit surface (`TRACEABILITY.md` + one child per
 * row) sourced from the read model's `implementedBy` edges, not raw DTOs.
 *
 * **Invariant:** Every row exposes `pattern`, `status`, `tests`, `specs`, and
 * `deliverables`; exactly one row appears per pattern that has at least one
 * `implementedBy` realization edge; `tests` are the deduplicated executable
 * `.feature` realization files only (production TS implementers are excluded);
 * `specs` is the pattern's own source file; deliverables are deduplicated; rows
 * are sorted by pattern name; child keys are deterministic pattern slugs.
 *
 * **Behavior:**
 * - Iterates `graph.patterns`, keeping only those whose `relationshipIndex`
 *   entry carries one or more `implementedBy` refs (the realization edges).
 * - Derives each row's `tests` from the realizing refs' `.feature` files
 *   (deduped, sorted), dropping non-`.feature` (production TS) realizers, and
 *   `specs` from the pattern's own source file.
 * - Routes the root to `TRACEABILITY.md` and children to
 *   `traceability/<slug>.md` so downstream renderers can deep-link a single
 *   pattern row.
 *
 * ### When to Use
 *
 * - Projects realization-edge traceability rows as a TraceabilityMatrix bundle.
 */
export function projectTraceabilityMatrix(
  context: ProjectionContext,
): ProjectionBundle<TraceabilityMatrix> {
  return buildTraceabilityMatrix(context);
}
