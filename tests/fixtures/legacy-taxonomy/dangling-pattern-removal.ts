/** @architect */

/**
 * @architect-role:service
 * @architect-pattern ConsumerAfterRemoval
 * @architect-status completed
 * @architect-uses RemovedPattern
 *
 * ## ConsumerAfterRemoval
 *
 * Represents a consumer left behind after its provider pattern declaration was removed.
 *
 * **When to use:** Use this fixture to prove dangling references block lint-patterns.
 */
export interface ConsumerAfterRemoval {
  readonly id: string;
}
