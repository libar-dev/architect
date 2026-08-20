/**
 * @architect
 * @architect-pattern StatusValueDomain
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:domain
 *
 * ## StatusValueDomain - Canonical @architect-status Vocabulary
 *
 * The single source of truth for accepted and process `@architect-status`
 * values plus `DEFAULT_STATUS`. Exports the ordered value tuples, their derived
 * union types, and the validation sets that every status check across the
 * toolchain consults. A root primitive of the taxonomy with no outbound pattern
 * edges.
 *
 * ### When to Use
 *
 * - Validating or normalizing a raw `@architect-status` value.
 * - Resolving the default status for a pattern that omits the tag.
 * - Enumerating the legal process / accepted status values for codegen or UI.
 */
export const PROCESS_STATUS_VALUES = ['roadmap', 'active', 'completed', 'deferred'] as const;

export const ACCEPTED_STATUS_VALUES = ['candidate', ...PROCESS_STATUS_VALUES] as const;

export type AcceptedStatusValue = (typeof ACCEPTED_STATUS_VALUES)[number];

export type ProcessStatusValue = (typeof PROCESS_STATUS_VALUES)[number];

export const DEFAULT_STATUS: ProcessStatusValue = 'roadmap';

export const VALID_PROCESS_STATUS_SET: ReadonlySet<string> = new Set<string>(PROCESS_STATUS_VALUES);

export const VALID_ACCEPTED_STATUS_SET: ReadonlySet<string> = new Set<string>(
  ACCEPTED_STATUS_VALUES,
);
