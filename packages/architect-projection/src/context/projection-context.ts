import type {
  FormatType,
  PackageResolver,
  PatternGraph,
  ProjectMetadata,
} from '@libar-dev/architect-core';

import type { ProjectionFilter } from '../projections/_shared/filter.js';

export interface TagExampleOverride {
  readonly description?: string;
  readonly example?: string;
}

export type TagExampleOverrides = Partial<Record<FormatType, TagExampleOverride>>;

export type PerspectiveHint =
  | 'delivery'
  | 'architectural-review'
  | 'planning'
  | 'implementation-queue'
  | 'idea-triage';

/**
 * Context shared by all projection functions that operate purely on
 * {@link PatternGraph}.
 *
 * `packageResolver` is required (per ARCHITECTURE.md §2). It maps
 * `pattern.source.file` to a workspace `Package` via config-supplied
 * matchers. Unmatched files raise `ProjectionError('UNMAPPED_PACKAGE', …)`
 * per D-5 = A — no silent `_other` bucket.
 */
export interface ProjectionContext {
  readonly graph: PatternGraph;
  readonly packageResolver: PackageResolver;
  readonly projectMetadata?: ProjectMetadata;
  readonly tagExampleOverrides?: TagExampleOverrides;
  readonly perspective?: PerspectiveHint;
  readonly projectionFilter?: ProjectionFilter;
}
