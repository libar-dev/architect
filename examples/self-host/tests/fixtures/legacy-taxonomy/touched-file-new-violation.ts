/** @architect */

/**
 * @architect-role:service
 * @architect-pattern TouchedFileNewViolation
 * @architect-status completed
 * @architect-uses NotInBaseline
 *
 * ## TouchedFileNewViolation
 *
 * Represents a touched file with a new relationship violation that no baseline may hide.
 *
 * **When to use:** Use this fixture to prove path-aware baselines do not mask new hits.
 */
export interface TouchedFileNewViolation {
  readonly id: string;
}
