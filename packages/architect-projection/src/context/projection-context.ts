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
