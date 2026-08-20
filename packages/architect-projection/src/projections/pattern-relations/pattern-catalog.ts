/**
 * @architect
 * @architect-pattern PatternCatalogProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts, PatternCatalog
 * @architect-bounded-context:projection
 *
 * ## Pattern catalog projection
 *
 * **Value:** Gives typed-tool and UI consumers (`architect_list`,
 * `architect_search`, UI pickers) a stable filtered catalog of
 * `PatternSummary` items, with
 * role-alias resolution, combined status/role filtering, and compact
 * `namesOnly` / `count` response modes.
 *
 * **Invariant:** The output always carries `{filters, count, names, items}`
 * with `count` matching the filtered result size; role filters are resolved
 * to canonical tags through the tag registry before matching, status/role
 * combine with AND semantics, results are sorted alphabetically by
 * pattern name, and `namesOnly`/`count` flags omit `items` (and `names`
 * when `count` is true) while still reporting `count`.
 *
 * **Behavior:**
 * - Validates options through `PatternCatalogOptionsSchema` (status, maturity,
 *   role, namesOnly, count) and delegates to `buildPatternCatalog`.
 * - Resolves role aliases via the graph's `tagRegistry.roles` before
 *   filtering, so callers can pass non-canonical role names.
 * - Exposes `parseAndProjectPatternCatalog` for callers that receive raw
 *   option payloads.
 *
 * ### When to Use
 *
 * - Projects the filtered pattern catalog used by list/search surfaces, including name-only and count-only modes.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { PatternCatalog } from '../../fragments/pattern-relations/index.js';

import {
  PatternCatalogOptionsSchema,
  buildPatternCatalog,
  type PatternCatalogOptions,
} from './pattern-catalog.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { PatternCatalogOptionsSchema } from './pattern-catalog.internal.js';
export type { PatternCatalogOptions } from './pattern-catalog.internal.js';

export function projectPatternCatalog(
  context: ProjectionContext,
  options: PatternCatalogOptions = {},
): ProjectionBundle<PatternCatalog> {
  return projectSingle(buildPatternCatalog(context, options));
}

export const parseAndProjectPatternCatalog = parseAndProject(
  PatternCatalogOptionsSchema,
  projectPatternCatalog,
  'parseAndProjectPatternCatalog',
  {},
);
