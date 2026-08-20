/**
 * @architect
 * @architect-pattern ScopeReadinessProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses ExecutionContextProjectionSupport, ProjectionFragmentContracts, ScopeReadinessReport, ScopeReadinessCheck
 * @architect-bounded-context:projection
 *
 * **Value:** Projects a `ScopeReadinessReport` per pattern + session type so
 * implement and design sessions see the same verdict (`PASS`, `WARN`, or
 * `BLOCKED`) with structured checks driving CLI, MCP, and UI gatekeeping.
 *
 * **Invariant:** Implement sessions run the full check suite
 * (`dependencies-completed`, `deliverables-defined`, `fsm-allows-transition`,
 * `design-decisions-recorded`, `executable-specs-set`); design sessions run
 * only `stubs-from-deps-exist`; `strict: true` promotes failing warnings to
 * errors and recomputes the verdict; options are parsed through
 * `ScopeReadinessOptionsSchema`.
 *
 * **Behavior:**
 * - `dependencies-completed` resolves each `dependsOn` via `findPatternByName`
 *   and flags incomplete dependencies as blocker entries.
 * - `fsm-allows-transition` rejects `candidate → active` explicitly,
 *   otherwise consults `VALID_TRANSITIONS` against the current status.
 * - `design-decisions-recorded` scans stub directives for `ADR|PDR|DD-<id>`
 *   references; `executable-specs-set` accepts either `executableSpecs` or
 *   `behaviorFile`.
 *
 * ### When to Use
 *
 * - Projects scope-readiness checks and verdicts for design and implement sessions.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { ScopeReadinessReport } from '../../fragments/execution-context/index.js';

import {
  ScopeReadinessOptionsSchema,
  buildScopeReadinessReport,
  type ScopeReadinessOptions,
} from './scope-readiness.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { ScopeReadinessOptionsSchema } from './scope-readiness.internal.js';
export type { ScopeReadinessOptions } from './scope-readiness.internal.js';

export function projectScopeReadinessReport(
  context: ProjectionContext,
  options: ScopeReadinessOptions,
): ProjectionBundle<ScopeReadinessReport> {
  return projectSingle(buildScopeReadinessReport(context, options));
}

export const parseAndProjectScopeReadinessReport = parseAndProject(
  ScopeReadinessOptionsSchema,
  projectScopeReadinessReport,
  'parseAndProjectScopeReadinessReport',
);
