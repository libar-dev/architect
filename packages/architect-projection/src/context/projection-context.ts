/**
 * @architect
 * @architect-pattern ProjectionContext
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:projection
 * @architect-uses PatternGraph, PackageResolver
 *
 * ## ProjectionContext - The Read-Side Spine Every Projection Receives
 *
 * The central typed envelope handed to every projection function: a readonly
 * `{ graph, packageResolver, projectMetadata?, perspective?, projectionFilter? }`
 * record plus its `strictObject` Zod schema. It is the seam between
 * architect-core's read model (the `PatternGraph`) and the entire projection
 * package — the single argument that carries the assembled graph, the
 * config-supplied `PackageResolver`, and the optional shaping hints
 * (perspective, projection filter, tag-example overrides) downstream into
 * every renderer.
 *
 * The highest fan-in contract in the package: dozens of projections depend on
 * this shape, so any change here ripples across the whole read side.
 *
 * ### When to Use
 *
 * - Writing or extending any projection function — it receives this context.
 * - Resolving a `pattern.source.file` to a workspace package via
 *   `packageResolver` (unmatched files raise a `ProjectionError`).
 * - Carrying perspective / filter / project-metadata hints into a projection
 *   without widening individual function signatures.
 */
import {
  PatternGraphSchema,
  type FormatType,
  type PackageResolver,
  type PatternGraph,
  type ProjectMetadata,
} from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionFilter } from '../projections/_shared/filter.js';
import { ProjectionFilterSchema } from '../projections/_shared/filter.js';

export interface TagExampleOverride {
  readonly description?: string;
  readonly example?: string;
}

export type TagExampleOverrides = Partial<Record<FormatType, TagExampleOverride>>;

const TagExampleOverrideSchema = z
  .strictObject({
    description: z.string().optional(),
    example: z.string().optional(),
  })
  .readonly();

const TagExampleOverridesSchema = z
  .strictObject({
    value: TagExampleOverrideSchema.optional(),
    enum: TagExampleOverrideSchema.optional(),
    'quoted-value': TagExampleOverrideSchema.optional(),
    csv: TagExampleOverrideSchema.optional(),
    number: TagExampleOverrideSchema.optional(),
    flag: TagExampleOverrideSchema.optional(),
  })
  .readonly();

export type PerspectiveHint =
  | 'delivery'
  | 'architectural-review'
  | 'planning'
  | 'implementation-queue'
  | 'idea-triage';

export const PerspectiveHintSchema = z.enum([
  'delivery',
  'architectural-review',
  'planning',
  'implementation-queue',
  'idea-triage',
]);

const ProjectMetadataSchema = z
  .custom<ProjectMetadata>(
    (value) => value === undefined || (value !== null && typeof value === 'object'),
    'Expected project metadata object',
  )
  .optional();

const PackageResolverSchema = z.custom<PackageResolver>(
  (value) => typeof value === 'function',
  'Expected packageResolver function',
);

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

export const ProjectionContextSchema = z
  .strictObject({
    graph: PatternGraphSchema,
    packageResolver: PackageResolverSchema,
    projectMetadata: ProjectMetadataSchema,
    tagExampleOverrides: TagExampleOverridesSchema.optional(),
    perspective: PerspectiveHintSchema.optional(),
    projectionFilter: ProjectionFilterSchema.optional(),
  })
  .readonly();
