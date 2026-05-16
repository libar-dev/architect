/**
 * @architect
 * @architect-pattern EnforcementZone
 * @architect-status roadmap
 * @architect-implements EnforcementConfiguration
 * @architect-target src/validation/enforcement-zone.ts
 * @architect-product-area:Validation
 *
 * ## EnforcementConfiguration -- Enforcement Zone Determination
 *
 * Derives the enforcement zone from a pattern's status. The zone determines
 * which ProcessGuard rules apply and at what level.
 *
 * ### Design Decisions
 * AD-1: Zone is derived from status, not configured -- it is a structural
 *   property of the lifecycle, not a user preference. Pre-delivery has no
 *   enforcement. Delivery has full FSM enforcement. Post-delivery has hard
 *   protection requiring unlock.
 *
 * ### When to Use
 * - ProcessGuard decider: call deriveEnforcementZone() before rule evaluation
 *   to determine if the pattern should be evaluated or skipped
 * - FileState derivation: add zone field to FileState based on status
 *
 * See ADR-007: architect/decisions/adr-007-coordinated-taxonomy-redesign.feature
 * See: architect/specs/enforcement-configuration.feature Rule 1
 */

import type { AcceptedStatusValue } from '../../src/taxonomy/status-values.js';

/**
 * Three enforcement zones corresponding to lifecycle phases.
 *
 * - pre-delivery: candidate status, no enforcement, freely editable
 * - delivery: roadmap/active/deferred, full FSM enforcement
 * - post-delivery: completed, hard protection requiring unlock-reason
 */
export declare type EnforcementZone = 'pre-delivery' | 'delivery' | 'post-delivery';

/**
 * Derive the enforcement zone from a pattern's status.
 *
 * @param status - The pattern's AcceptedStatusValue
 * @returns The enforcement zone for this status
 *
 * Mapping:
 * - candidate -> pre-delivery
 * - roadmap -> delivery
 * - active -> delivery
 * - deferred -> delivery
 * - completed -> post-delivery
 */
export declare function deriveEnforcementZone(status: AcceptedStatusValue): EnforcementZone;
