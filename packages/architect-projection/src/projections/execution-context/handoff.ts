/**
 * @architect
 * @architect-pattern HandoffProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses ExecutionContextProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Projects a flat `HandoffRecord` per pattern + session type so
 * CLI, MCP, and UI handoff surfaces share one shape covering completed,
 * in-progress, discovered, blockers, and next-session fields.
 *
 * **Invariant:** Handoff output stays flattened and independent of scope or
 * session-context bundles; caller-supplied overrides for any field win over
 * graph-derived defaults; `blockers` always resolves to `['None']` when no
 * incomplete dependencies exist; options are parsed through
 * `HandoffOptionsSchema`.
 *
 * **Behavior:**
 * - Derives `completed` and `inProgress` from deliverable statuses
 *   (`complete` / `pending` vs. other states) using `[x]` / `[ ]` checkboxes
 *   with the deliverable `name (location)` format.
 * - Derives `discovered` from `discoveredGaps`, `discoveredImprovements`, and
 *   `discoveredLearnings`, and `blockers` from incomplete `dependsOn`
 *   relationships as `name (status)` entries.
 * - Emits `nextSession` as a numbered list of remaining deliverables unless
 *   the caller provides an explicit string.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { HandoffRecord } from '../../fragments/execution-context/index.js';

import {
  HandoffOptionsSchema,
  buildHandoffRecord,
  type HandoffOptions,
} from './handoff.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { HandoffOptionsSchema } from './handoff.internal.js';
export type { HandoffOptions } from './handoff.internal.js';

export function projectHandoffRecord(
  context: ProjectionContext,
  options: HandoffOptions
): ProjectionBundle<HandoffRecord> {
  return projectSingle(buildHandoffRecord(context, options));
}

export const parseAndProjectHandoffRecord = parseAndProject(
  HandoffOptionsSchema,
  projectHandoffRecord,
  'parseAndProjectHandoffRecord'
);
