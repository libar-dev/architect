/**
 * @architect
 * @architect-pattern PatternBundleProjection
 * @architect-status active
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts
 * @architect-bounded-context:projection
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import type { ProjectionBundle } from '../../fragments/base.js';
import type { PatternBundleEntry } from '../../fragments/pattern-relations/pattern-bundle-entry.js';

import { parseAndProject } from '../_shared/parse-and-project.internal.js';

import {
  buildPatternBundle,
  PatternBundleOptionsSchema,
  type PatternBundleOptions,
} from './bundle.internal.js';

export { BundleIncludeSchema, BundleModeSchema } from './bundle.internal.js';
export { PatternBundleOptionsSchema } from './bundle.internal.js';
export type { PatternBundleOptions } from './bundle.internal.js';

export function projectPatternBundle(
  context: ProjectionContext,
  options: PatternBundleOptions
): ProjectionBundle<PatternBundleEntry> {
  return buildPatternBundle(context, options);
}

export const parseAndProjectPatternBundle = parseAndProject(
  PatternBundleOptionsSchema,
  projectPatternBundle,
  'parseAndProjectPatternBundle'
);
