/**
 * @architect
 * @architect-validation
 * @architect-pattern FSMTransitions
 * @architect-status active
 * @architect-role:read-model
 * @architect-bounded-context:validation
 */

import type { ProcessStatusValue } from '../../taxonomy/index.js';
import type { TagRegistry } from '../../validation-schemas/tag-registry.js';
import { DEFAULT_TAG_PREFIX } from '../../config/defaults.js';

export interface TransitionMessageOptions {
  readonly registry?: TagRegistry;
}

export const VALID_TRANSITIONS: Readonly<
  Record<ProcessStatusValue, readonly ProcessStatusValue[]>
> = {
  roadmap: ['active', 'deferred'],
  active: ['completed', 'roadmap'],
  completed: ['active', 'roadmap'],
  deferred: ['roadmap'],
} as const;

export function isValidTransition(from: ProcessStatusValue, to: ProcessStatusValue): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function getValidTransitionsFrom(status: ProcessStatusValue): readonly ProcessStatusValue[] {
  return VALID_TRANSITIONS[status];
}

export function getTransitionErrorMessage(
  from: ProcessStatusValue,
  to: ProcessStatusValue,
  options?: TransitionMessageOptions,
): string {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  // completed → active / completed → roadmap are valid reopen transitions (PDR-006),
  // so this branch only fires for targets that remain invalid from completed
  // (e.g. completed → completed, completed → deferred).
  if (from === 'completed') {
    return `Cannot transition from 'completed' to '${to}'. Reopen to 'active' or 'roadmap'; use ${tagPrefix}unlock-reason to record intent.`;
  }

  if (from === 'roadmap' && to === 'completed') {
    return `Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first.`;
  }

  if (from === 'deferred' && (to === 'active' || to === 'completed')) {
    return `Cannot transition from 'deferred' to '${to}'. Must reactivate to 'roadmap' first.`;
  }

  const validTargets = VALID_TRANSITIONS[from];
  if (validTargets.length === 0) {
    return `Cannot transition from '${from}' (terminal state).`;
  }

  return `Invalid transition from '${from}' to '${to}'. Valid targets: ${validTargets.join(', ')}.`;
}
