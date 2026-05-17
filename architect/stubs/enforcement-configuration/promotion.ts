/**
 * @architect
 * @architect-pattern PromotionValidation
 * @architect-status roadmap
 * @architect-implements EnforcementConfiguration
 * @architect-target src/validation/promotion.ts
 * @architect-product-area:Validation
 *
 * ## EnforcementConfiguration -- Promotion and Demotion Validation
 *
 * Validates lifecycle gates that are NOT FSM transitions. Promotion bridges
 * the pre-delivery zone (candidate) to the delivery zone (roadmap). Demotion
 * attempts to regress from delivery back to pre-delivery.
 *
 * ### Design Decisions
 * AD-1: Promotion is a lifecycle gate, not an FSM transition -- the FSM has
 *   no candidate state. These are HELPER FUNCTIONS called before ProcessGuard
 *   rule evaluation, not configurable ProcessGuard rules. They do not appear
 *   in ProcessGuardRuleId and cannot be overridden via ruleOverrides.
 * AD-2: Demotion is always rejected (not configurable) -- allowing delivery
 *   states to regress to candidate would bypass scope-lock and completed-
 *   protection by round-tripping through the pre-delivery zone.
 * AD-3: isDemotion() checks ALL 4 delivery states (roadmap, active, completed,
 *   deferred) -> candidate. The redesign doc code snippet shows only roadmap
 *   as a simplified example; the full implementation covers all delivery states.
 *
 * ### When to Use
 * - ProcessGuard decider: call before FSM transition validation when a status
 *   change involves candidate
 * - The promotion path is: candidate -> roadmap (only valid promotion)
 * - All delivery -> candidate paths are demotions (rejected)
 *
 * See ADR-007: architect/decisions/adr-007-coordinated-taxonomy-redesign.feature
 * See: architect/specs/enforcement-configuration.feature Rule 4
 */

import type { AcceptedStatusValue } from '../../src/taxonomy/status-values.js';

/**
 * Check if a status change is a valid lifecycle promotion.
 * Currently: only candidate -> roadmap is a valid promotion.
 *
 * @param from - Source status (AcceptedStatusValue)
 * @param to - Target status (AcceptedStatusValue)
 * @returns true if the change is a valid promotion
 */
export declare function isValidPromotion(
  from: AcceptedStatusValue,
  to: AcceptedStatusValue,
): boolean;

/**
 * Check if a status change is a demotion (delivery -> pre-delivery).
 * Any change from roadmap/active/completed/deferred to candidate is a demotion.
 * Checks: to === 'candidate' && PROCESS_STATUS_VALUES.includes(from)
 *
 * @param from - Source status (AcceptedStatusValue)
 * @param to - Target status (AcceptedStatusValue)
 * @returns true if the change is a demotion (should be rejected)
 */
export declare function isDemotion(from: AcceptedStatusValue, to: AcceptedStatusValue): boolean;
