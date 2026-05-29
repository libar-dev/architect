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
 * projection depends on — phase/status counting, quarter grouping, release
 * bucketing, traceability-row shaping, slug generation, and deterministic
 * pattern sorting — so each `project*` entry point stays a one-liner.
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
 * - Groups patterns into quarter buckets with year-then-quarter ordering and
 *   locale-aware label comparison, falling back to a lexical sort when no
 *   quarter metadata is parseable.
 * - Builds release entries in canonical changelog order (Unreleased → tagged
 *   releases descending → quarter fallbacks descending → Earlier) and
 *   deduplicates deliverables across patterns within an entry.
 *
 * ### When to Use
 *
 * - Provides shared delivery-reporting helpers for phase, status, timeline,
 *   release, and traceability projections.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import { isPatternActive, isPatternComplete, isPatternPlanned } from '@libar-dev/architect-core';

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import {
  type PhaseProgress,
  type RoadmapTimeline,
  type ReleaseNotesDigest,
  type StatusDistribution,
  type TraceabilityMatrix,
} from '../../fragments/delivery-reporting/index.js';
import type {
  QuarterEntry,
  ReleaseEntry,
  StatusCounts,
  TraceRow,
} from '../../fragments/delivery-reporting/supporting.js';
import {
  createPatternSummaryFragment,
  getPatternName,
  getRelationships,
  normalizeDeliverables,
  uniqueSortedStrings,
} from '../_shared/pattern-helpers.internal.js';
import { slugForFilename } from '../../_internal/slug.js';
import type { EmbeddedDeliverable } from '../../fragments/pattern-relations/supporting.js';
import { filterPatterns } from '../_shared/filter.js';
import { createEntityRouteId, createIndexRouteId } from '../../routing/route-id.js';

export function buildPhaseProgress(
  context: ProjectionContext,
  phase: number,
): PhaseProgress | undefined {
  const phaseGroup = context.graph.byPhase.find((entry) => entry.phaseNumber === phase);
  if (phaseGroup === undefined) {
    return undefined;
  }

  const patterns = filterPatterns(phaseGroup.patterns, context.projectionFilter);
  const counts = createStatusCounts(patterns);

  return {
    kind: 'PhaseProgress',
    phaseNumber: phaseGroup.phaseNumber,
    ...(phaseGroup.phaseName !== undefined ? { phaseName: phaseGroup.phaseName } : {}),
    ...counts,
    completionPercentage: calculateDeliveryPercentage(counts.completed, getDeliveryTotal(counts)),
  };
}

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
  const patterns =
    view === 'roadmap'
      ? [...context.graph.byStatus.roadmap, ...context.graph.byStatus.deferred]
      : view === 'milestones'
        ? context.graph.byNormalizedStatus.completed
        : context.graph.byNormalizedStatus.active;

  return createTimelineBundle(
    view,
    buildQuarterEntries(filterPatterns(patterns, context.projectionFilter)),
  );
}

export function buildReleaseNotes(
  context: ProjectionContext,
  release?: string,
): ProjectionBundle<ReleaseNotesDigest> {
  const entries = buildReleaseEntries(context, release);
  const children = createChildren(
    entries,
    (entry) => entry.release,
    (entry): ReleaseNotesDigest => ({
      kind: 'ReleaseNotesDigest',
      releases: [entry],
    }),
  );
  const root: ReleaseNotesDigest = {
    kind: 'ReleaseNotesDigest',
    releases: entries,
  };

  return {
    root,
    children,
    routing: {
      rootRouteId: createIndexRouteId('changelog'),
      childRouteIds: Object.fromEntries(
        Object.keys(children).map((key) => [key, createEntityRouteId('changelog', key)]),
      ),
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
  quarters: QuarterEntry[],
): ProjectionBundle<RoadmapTimeline> {
  const children = createChildren(
    quarters,
    (entry) => entry.quarter,
    (entry): RoadmapTimeline => ({
      kind: 'RoadmapTimeline',
      view,
      quarters: [entry],
    }),
  );
  const root: RoadmapTimeline = {
    kind: 'RoadmapTimeline',
    view,
    quarters,
  };

  return {
    root,
    children,
    routing: getTimelineRouting(view, Object.keys(children)),
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

function buildQuarterEntries(patterns: readonly ExtractedPattern[]): QuarterEntry[] {
  const grouped = new Map<string, ExtractedPattern[]>();

  for (const pattern of patterns) {
    const quarter = pattern.quarter?.trim();
    if (!quarter) {
      continue;
    }

    const bucket = grouped.get(quarter) ?? [];
    bucket.push(pattern);
    grouped.set(quarter, bucket);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => compareQuarterLabels(left, right))
    .map(([quarter, quarterPatterns]) => ({
      quarter,
      patterns: sortPatterns(quarterPatterns).map((pattern) =>
        createPatternSummaryFragment(pattern),
      ),
      counts: createStatusCounts(quarterPatterns),
    }));
}

function buildReleaseEntries(context: ProjectionContext, release?: string): ReleaseEntry[] {
  const entries = [
    ...buildUnreleasedEntries(context),
    ...buildTaggedReleaseEntries(context),
    ...buildQuarterFallbackEntries(context),
    ...buildEarlierFallbackEntries(context),
  ];

  if (release === undefined) {
    return entries;
  }

  return entries.filter((entry) => entry.release === release);
}

function buildUnreleasedEntries(context: ProjectionContext): ReleaseEntry[] {
  const unreleasedCandidates = filterPatterns(
    [
      ...context.graph.byNormalizedStatus.active,
      ...context.graph.patterns.filter((pattern) => pattern.release === 'vNEXT'),
    ],
    context.projectionFilter,
  );
  const patterns = deduplicatePatterns(unreleasedCandidates);

  return patterns.length === 0 ? [] : [createReleaseEntry('Unreleased', patterns)];
}

function buildTaggedReleaseEntries(context: ProjectionContext): ReleaseEntry[] {
  const grouped = new Map<string, ExtractedPattern[]>();

  for (const pattern of filterPatterns(
    context.graph.byNormalizedStatus.completed,
    context.projectionFilter,
  )) {
    const release = pattern.release?.trim();
    if (!release || release === 'vNEXT') {
      continue;
    }

    const bucket = grouped.get(release) ?? [];
    bucket.push(pattern);
    grouped.set(release, bucket);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) =>
      right.localeCompare(left, undefined, { numeric: true, sensitivity: 'base' }),
    )
    .map(([release, patterns]) => createReleaseEntry(release, patterns));
}

function buildQuarterFallbackEntries(context: ProjectionContext): ReleaseEntry[] {
  const grouped = new Map<string, ExtractedPattern[]>();

  for (const pattern of filterPatterns(
    context.graph.byNormalizedStatus.completed,
    context.projectionFilter,
  )) {
    if (pattern.release?.trim()) {
      continue;
    }

    const quarter = pattern.quarter?.trim();
    if (!quarter) {
      continue;
    }

    const bucket = grouped.get(quarter) ?? [];
    bucket.push(pattern);
    grouped.set(quarter, bucket);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => compareQuarterLabels(right, left))
    .map(([quarter, patterns]) => createReleaseEntry(quarter, patterns));
}

function buildEarlierFallbackEntries(context: ProjectionContext): ReleaseEntry[] {
  const patterns = filterPatterns(
    context.graph.byNormalizedStatus.completed,
    context.projectionFilter,
  ).filter((pattern) => {
    const release = pattern.release?.trim();
    const quarter = pattern.quarter?.trim();
    return !release && !quarter;
  });

  return patterns.length === 0 ? [] : [createReleaseEntry('Earlier', patterns)];
}

function createReleaseEntry(release: string, patterns: readonly ExtractedPattern[]): ReleaseEntry {
  const sortedPatterns = sortPatterns(patterns);
  const dates = sortedPatterns
    .map((pattern) => pattern.completed?.trim())
    .filter((value): value is string => value !== undefined && value.length > 0)
    .sort((left, right) => right.localeCompare(left));

  return {
    release,
    ...(dates[0] !== undefined ? { date: dates[0] } : {}),
    patterns: sortedPatterns.map((pattern) => createPatternSummaryFragment(pattern)),
    deliverables: deduplicateDeliverables(sortedPatterns),
  };
}

function deduplicateDeliverables(patterns: readonly ExtractedPattern[]): EmbeddedDeliverable[] {
  const seen = new Set<string>();
  const deliverables: EmbeddedDeliverable[] = [];

  for (const pattern of patterns) {
    for (const deliverable of normalizeDeliverables(pattern)) {
      const key = `${deliverable.name}::${deliverable.location}::${deliverable.release ?? ''}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      deliverables.push(deliverable);
    }
  }

  return deliverables;
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

function createChildren<
  TEntry,
  TFragment extends RoadmapTimeline | ReleaseNotesDigest | TraceabilityMatrix,
>(
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
  return [...patterns].sort((left, right) => {
    const phaseDelta =
      (left.phase ?? Number.MAX_SAFE_INTEGER) - (right.phase ?? Number.MAX_SAFE_INTEGER);
    if (phaseDelta !== 0) {
      return phaseDelta;
    }

    return getPatternName(left).localeCompare(getPatternName(right), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

function deduplicatePatterns(patterns: readonly ExtractedPattern[]): ExtractedPattern[] {
  const seen = new Set<string>();
  const unique: ExtractedPattern[] = [];

  for (const pattern of patterns) {
    const key = getPatternName(pattern).toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(pattern);
  }

  return sortPatterns(unique);
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

function compareQuarterLabels(left: string, right: string): number {
  const parsedLeft = parseQuarterLabel(left);
  const parsedRight = parseQuarterLabel(right);

  if (parsedLeft !== undefined && parsedRight !== undefined) {
    if (parsedLeft.year !== parsedRight.year) {
      return parsedLeft.year - parsedRight.year;
    }

    if (parsedLeft.quarter !== parsedRight.quarter) {
      return parsedLeft.quarter - parsedRight.quarter;
    }
  } else if (parsedLeft !== undefined) {
    return -1;
  } else if (parsedRight !== undefined) {
    return 1;
  }

  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function parseQuarterLabel(value: string): { year: number; quarter: number } | undefined {
  const normalized = value.trim();
  const quarterFirst = /^Q(\d+)[\s-]+(\d{4})$/i.exec(normalized);
  if (quarterFirst !== null) {
    return {
      quarter: Number(quarterFirst[1]),
      year: Number(quarterFirst[2]),
    };
  }

  const yearFirst = /^(\d{4})[\s-]+Q(\d+)$/i.exec(normalized);
  if (yearFirst !== null) {
    return {
      year: Number(yearFirst[1]),
      quarter: Number(yearFirst[2]),
    };
  }

  return undefined;
}

// ===========================================================================
// Public projection API for the delivery-reporting subdomain.
// Each exported projectX function has its own @architect-pattern annotation
// so the PatternGraph extractor registers them separately; implementation
// delegates to the build* helpers above.
// ===========================================================================

/**
 * @architect
 * @architect-pattern PhaseProgressProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DeliveryReportingProjectionSupport, PhaseProgress
 * @architect-bounded-context:projection
 *
 * ## Phase progress projection
 *
 * **Value:** Gives a consumer a single phase's delivery progress — counts of
 * completed/active/planned/candidate patterns plus a rounded completion
 * percentage — as a stable `PhaseProgress` fragment.
 *
 * **Invariant:** Fragment carries phase number, optional phase name, all four
 * status counts, total, and a `completionPercentage` computed against the
 * delivery total (`total - candidate`); an unknown phase yields `undefined`.
 *
 * **Behavior:**
 * - Resolves the phase group from `graph.byPhase` and returns `undefined`
 *   when no matching phase exists, rather than emitting an empty fragment.
 * - Computes counts via the shared `createStatusCounts` helper so classification
 *   stays consistent with `StatusDistributionProjection`.
 * - Rounds the delivery percentage to an integer and reports `0` when the
 *   delivery total is zero (i.e. candidate-only phases).
 *
 * ### When to Use
 *
 * - Projects one phase's delivery progress as a PhaseProgress bundle.
 */
export function projectPhaseProgress(
  context: ProjectionContext,
  phase: number,
): ProjectionBundle<PhaseProgress> | undefined {
  const fragment = buildPhaseProgress(context, phase);
  return fragment === undefined ? undefined : projectSingle(fragment);
}

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
 * **Value:** Exposes three specialised views of the pattern graph — roadmap
 * (planned + deferred), completed milestones, and current work (active) —
 * each as a `RoadmapTimeline` bundle with quarter-grouped entries, per-bucket
 * status counts, and deterministic routing to its own markdown file.
 *
 * **Invariant:** Every bundle sets its `view` field to the requested
 * entrypoint, orders quarters chronologically (year then quarter, lexical
 * fallback), excludes patterns without a quarter, and emits one child per
 * quarter with a slug-based routing key.
 *
 * **Behavior:**
 * - Selects the pattern set per view: `byStatus.roadmap + byStatus.deferred`
 *   for roadmap, `byNormalizedStatus.completed` for milestones, and
 *   `byNormalizedStatus.active` for current work.
 * - Groups patterns into `QuarterEntry` buckets with sorted pattern summaries
 *   and per-bucket status counts for in-place rendering.
 * - Supplies view-specific `outputPath` routing so renderers emit
 *   `ROADMAP.md`, `COMPLETED-MILESTONES.md`, or `CURRENT-WORK.md` with a
 *   matching child directory.
 *
 * ### When to Use
 *
 * - Projects roadmap, milestone, or current-work views as RoadmapTimeline
 *   bundles.
 */
export function projectRoadmapTimeline(
  context: ProjectionContext,
): ProjectionBundle<RoadmapTimeline> {
  return buildTimelineBundle(context, 'roadmap');
}

export function projectCompletedMilestones(
  context: ProjectionContext,
): ProjectionBundle<RoadmapTimeline> {
  return buildTimelineBundle(context, 'milestones');
}

export function projectCurrentWork(context: ProjectionContext): ProjectionBundle<RoadmapTimeline> {
  return buildTimelineBundle(context, 'current');
}

/**
 * @architect
 * @architect-pattern ReleaseNotesProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DeliveryReportingProjectionSupport, ReleaseNotesDigest
 * @architect-bounded-context:projection
 *
 * ## Release notes projection
 *
 * **Value:** Emits a changelog-shaped `ReleaseNotesDigest` bundle whose root
 * lists every release in canonical order and whose children split one digest
 * per release, so renderers can produce `CHANGELOG.md` plus a file per
 * release without re-deriving grouping.
 *
 * **Invariant:** Entries are ordered Unreleased → tagged releases (numeric
 * descending) → quarter fallbacks (descending) → Earlier; each entry carries
 * the latest completion date, sorted pattern summaries, and deduplicated
 * deliverables; a release filter returns at most the matching entry.
 *
 * **Behavior:**
 * - Collects Unreleased work from `byNormalizedStatus.active` plus any pattern
 *   explicitly tagged `release: vNEXT`, deduplicating by name.
 * - Groups completed patterns by their release tag, or falls back to their
 *   quarter, or to Earlier when neither is set.
 * - Sets up routing so the root emits `CHANGELOG.md` and children emit
 *   `releases/<slug>.md` with deterministic collision-safe keys.
 *
 * ### When to Use
 *
 * - Projects changelog-shaped release notes as a ReleaseNotesDigest bundle.
 */
export function projectReleaseNotesDigest(
  context: ProjectionContext,
  release?: string,
): ProjectionBundle<ReleaseNotesDigest> {
  return buildReleaseNotes(context, release);
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
