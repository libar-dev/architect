/**
 * @architect
 * @architect-pattern DocumentationBundle
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DocumentationCompositionProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Gives documentation consumers a single registry-driven entry point
 * for every supported document type while returning the underlying domain
 * projection bundle directly.
 *
 * **Invariant:** Requested document types must match the retained supported set;
 * dropped and unknown types throw at the projection boundary, and the
 * parse-and-project variant parses options before dispatching.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { ProjectionContext } from '../../context/projection-context.js';
import type { ProjectionBundle } from '../../fragments/base.js';
import type { Fragment } from '../../fragments/index.js';

import { parseAndProject } from '../_shared/parse-and-project.internal.js';
import {
  RawProjectDocumentationBundleOptionsSchema,
  projectDocumentationBundleInternal,
  type ProjectDocumentationBundleOptions,
} from './documentation-bundle.internal.js';

export { ProjectDocumentationBundleOptionsSchema } from './documentation-bundle.internal.js';

export function projectDocumentationBundle(
  context: ProjectionContext,
  options: ProjectDocumentationBundleOptions
): ProjectionBundle<Fragment> {
  return projectDocumentationBundleInternal(context, options);
}

export const parseAndProjectDocumentationBundle = parseAndProject(
  RawProjectDocumentationBundleOptionsSchema,
  projectDocumentationBundleInternal,
  'parseAndProjectDocumentationBundle'
);

export type { ProjectDocumentationBundleOptions } from './documentation-bundle.internal.js';
