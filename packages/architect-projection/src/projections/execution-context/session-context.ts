/**
 * @architect
 * @architect-pattern SessionContextProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses ExecutionContextProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Assembles the `SessionContextBundle` that CLI, MCP, and UI
 * surfaces use to open a session — varying shape by session type so planning,
 * design, and implement callers pay only for the context their session
 * needs.
 *
 * **Invariant:** Output shape is bounded by session type: planning returns
 * minimal metadata; design adds stubs, consumers, and architecture
 * neighbors; implement adds test files and FSM data. Options are parsed
 * through `SessionContextOptionsSchema`, which rejects invalid session types.
 *
 * **Behavior:**
 * - Resolves each focal pattern via `requirePattern` and emits
 *   `PatternContextMeta` with summary, status, phase, role, and file.
 * - Flattens per-pattern dependencies into a deduped `dependencies` list and
 *   a `sharedDependencies` subset (names appearing across multiple focal
 *   patterns).
 * - Resolves architecture neighbors via `context.graph.archIndex.byContext`
 *   excluding focal names; populates `fsm` only when exactly one focal
 *   pattern has a known process status.
 *
 * ### When to Use
 *
 * - Projects the session-opening context across patterns, dependencies, stubs, deliverables, and FSM data.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { SessionContextBundle } from '../../fragments/execution-context/index.js';

import {
  SessionContextOptionsSchema,
  buildSessionContextBundle,
  type SessionContextOptions,
} from './session-context.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { SessionContextOptionsSchema } from './session-context.internal.js';
export type { SessionContextOptions } from './session-context.internal.js';

export function projectSessionContextBundle(
  context: ProjectionContext,
  options: SessionContextOptions
): ProjectionBundle<SessionContextBundle> {
  return projectSingle(buildSessionContextBundle(context, options));
}

export const parseAndProjectSessionContext = parseAndProject(
  SessionContextOptionsSchema,
  projectSessionContextBundle,
  'parseAndProjectSessionContext'
);
