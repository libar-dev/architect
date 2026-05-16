/**
 * @architect
 * @architect-pattern ValidationRuleDigestProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses GovernanceProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Produces a `ValidationRuleDigest` fragment that describes the
 * lifecycle validation surface — canonical rule catalog, FSM states and
 * transitions, and protection-level buckets — so documentation consumers
 * render a deterministic view driven by core constants.
 *
 * **Invariant:** The digest always reports `roadmap` as the initial state,
 * computes terminal states from `VALID_TRANSITIONS`, and exposes a
 * protection-level entry per `PROTECTION_LEVELS` bucket with matching
 * statuses plus `canAddDeliverables` and `needsUnlock` flags.
 *
 * **Behavior:**
 * - Materializes the fixed validation rule list (completed-protection,
 *   invalid-status-transition, scope-creep, session-scope,
 *   session-excluded, deliverable-removed) with severity labels.
 * - Emits FSM transitions by iterating status order and mapping each
 *   `VALID_TRANSITIONS[from]` entry to a `from → to` edge with a
 *   human-readable description.
 * - Describes protection levels explicitly: planning editable, scope-locked
 *   active work, hard-locked completed work requiring unlock reason.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { ValidationRuleDigest } from '../../fragments/governance/index.js';
import { buildValidationRuleDigest } from './validation-rule-digest.internal.js';

export function projectValidationRuleDigest(
  context: ProjectionContext
): ProjectionBundle<ValidationRuleDigest> {
  return projectSingle(buildValidationRuleDigest(context));
}
