/**
 * @architect
 * @architect-pattern ProjectConfigProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DocumentationCompositionProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Provides a normalized `ProjectConfigSnapshot` fragment that
 * consumers use to describe the active project — base directory, config path,
 * source globs, graph counts, build time, and resolved project name — from
 * the Studio config payload plus live `ProjectionContext` data.
 *
 * **Invariant:** `projectConfig` always flattens `input`, `features`, and
 * `exclude` globs into a single deduped `sourceGlobs` list (prefixing
 * exclude entries with `!`), preserves caller-supplied metadata, and carries
 * graph-derived `patternCount`, `phaseCount`, and `roleCount` from the
 * projection context; `parseAndProjectConfig` rejects malformed glob groups
 * via `ProjectConfigOptionsSchema`.
 *
 * **Behavior:**
 * - Resolves the project name from explicit options first, then from
 *   `context.projectMetadata.name`, omitting the field when neither has text.
 * - Exposes `ProjectConfigOptionsSchema` and `SourceGlobGroupsSchema` for
 *   callers that parse options independently.
 * - Wraps the fragment in a single-bundle projection via `projectSingle`.
 *
 * ### When to Use
 *
 * - Projects a normalized ProjectConfigSnapshot bundle from config input and
*   graph metadata.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { ProjectConfigSnapshot } from '../../fragments/documentation-composition/index.js';

import {
  ProjectConfigOptionsSchema,
  buildProjectConfigSnapshot,
  type ProjectConfigOptions,
} from './project-config.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { ProjectConfigOptionsSchema } from './project-config.internal.js';
export { SourceGlobGroupsSchema } from './project-config.internal.js';

export function projectConfig(
  context: ProjectionContext,
  options: ProjectConfigOptions
): ProjectionBundle<ProjectConfigSnapshot> {
  return projectSingle(buildProjectConfigSnapshot(context, options));
}

export const parseAndProjectConfig = parseAndProject(
  ProjectConfigOptionsSchema,
  projectConfig,
  'parseAndProjectConfig'
);

export type { ProjectConfigOptions } from './project-config.internal.js';
export type { SourceGlobGroups } from './project-config.internal.js';
