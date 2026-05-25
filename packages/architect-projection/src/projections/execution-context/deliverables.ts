/**
 * @architect
 * @architect-pattern DeliverableProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses ExecutionContextProjectionSupport, ProjectionFragmentContracts, Deliverable, DeliverableManifest
 * @architect-bounded-context:projection
 *
 * **Value:** Lets consumers render a pattern's full `DeliverableManifest` or
 * look up a single `Deliverable` by name without iterating the raw pattern
 * `deliverables` array or replaying manifest ordering logic themselves.
 *
 * **Invariant:** Manifest items preserve the declared deliverable order from
 * the underlying pattern; single-deliverable lookups are case-insensitive;
 * both projections return `undefined` when the pattern is not found so
 * callers can distinguish missing patterns from empty manifests.
 *
 * **Behavior:**
 * - `projectDeliverableManifest` resolves the pattern, normalizes its
 *   deliverables via the shared helper, and wraps the manifest in a single-
 *   bundle projection.
 * - `projectDeliverable` walks the manifest items and matches by
 *   lower-cased name.
 *
 * ### When to Use
 *
 * - Projects deliverable manifests and single deliverable lookups for execution-context consumers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { Deliverable, DeliverableManifest } from '../../fragments/execution-context/index.js';

import { buildDeliverable, buildDeliverableManifest } from './deliverables.internal.js';

export function projectDeliverableManifest(
  context: ProjectionContext,
  pattern: string,
): ProjectionBundle<DeliverableManifest> | undefined {
  const manifest = buildDeliverableManifest(context, pattern);
  return manifest === undefined ? undefined : projectSingle(manifest);
}

export function projectDeliverable(
  context: ProjectionContext,
  pattern: string,
  name: string,
): ProjectionBundle<Deliverable> | undefined {
  const deliverable = buildDeliverable(context, pattern, name);
  return deliverable === undefined ? undefined : projectSingle(deliverable);
}
