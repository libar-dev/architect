/**
 * @architect
 * @architect-pattern PrChangeReviewProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DocumentationCompositionProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Lets Studio and GitHub Action surfaces share one
 * `PrChangeReview` fragment per branch change set, listing affected patterns
 * and reviewer recommendations derived purely from the supplied options.
 *
 * **Invariant:** Output preserves the caller's explicit `branch` and deduped
 * `changedFiles`; `affectedPatterns` contains only patterns whose source,
 * behavior, target, or deliverable paths match a changed file, sorted
 * alphabetically; options are parsed through
 * `ProjectPrChangeReviewOptionsSchema` before projection.
 *
 * **Behavior:**
 * - Deduplicates and normalizes slash separators across changed files and
 *   pattern references before matching.
 * - Emits recommendation blocks that differ when no patterns match (prompting
 *   a review of unannotated surfaces) versus when one or more patterns match
 *   (listing them and prompting dependency-impact review).
 * - Wraps the fragment in a single-bundle projection via `projectSingle`.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { PrChangeReview } from '../../fragments/documentation-composition/index.js';

import {
  ProjectPrChangeReviewOptionsSchema,
  buildPrChangeReview,
  type ProjectPrChangeReviewOptions,
} from './pr-change-review.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { ProjectPrChangeReviewOptionsSchema } from './pr-change-review.internal.js';

export function projectPrChangeReview(
  context: ProjectionContext,
  options: ProjectPrChangeReviewOptions
): ProjectionBundle<PrChangeReview> {
  return projectSingle(buildPrChangeReview(context, options));
}

export const parseAndProjectPrChangeReview = parseAndProject(
  ProjectPrChangeReviewOptionsSchema,
  projectPrChangeReview,
  'parseAndProjectPrChangeReview'
);

export type { ProjectPrChangeReviewOptions } from './pr-change-review.internal.js';
