/**
 * @architect-bounded-context:governance
 */
/**
 * Builds the governance validation digest from core FSM status constants and protection-level mappings.
 */

import {
  PROCESS_STATUS_VALUES,
  PROTECTION_LEVELS,
  VALID_TRANSITIONS,
  isTerminalState,
} from '@libar-dev/architect-core';

import type { ValidationRuleDigest } from '../../fragments/governance/index.js';

const PROTECTION_LEVEL_ORDER = ['none', 'scope', 'hard'] as const;

export function buildValidationRuleDigest(): ValidationRuleDigest {
  const rules: ValidationRuleDigest['rules'] = [
    {
      id: 'completed-protection',
      description: 'Modifying a completed spec warns; unlock-reason is optional and suppresses it',
      severity: 'warning',
    },
    {
      id: 'invalid-status-transition',
      description: 'Status transitions must follow FSM path',
      severity: 'error',
    },
    {
      id: 'scope-creep',
      description: 'Adding pending scope to an active spec warns; unlock-reason suppresses it',
      severity: 'warning',
    },
    {
      id: 'session-scope',
      description: 'File outside session scope',
      severity: 'warning',
    },
    {
      id: 'session-excluded',
      description: 'File explicitly excluded from session',
      severity: 'error',
    },
    {
      id: 'deliverable-removed',
      description: 'Deliverable was removed from spec',
      severity: 'warning',
    },
  ];

  return {
    kind: 'ValidationRuleDigest',
    rules,
    fsm: {
      initialState: 'roadmap',
      // `completed` is the settled end state (isTerminalState) even though it has
      // outbound reopen edges to active/roadmap (PDR-006); terminal-ness is the
      // FSM-identity fact, not "no outbound transitions".
      terminalStates: PROCESS_STATUS_VALUES.filter((status) => isTerminalState(status)),
      states: [...PROCESS_STATUS_VALUES],
      transitions: PROCESS_STATUS_VALUES.flatMap((from) =>
        VALID_TRANSITIONS[from].map((to) => ({
          from,
          to,
          description: describeTransition(from, to),
        })),
      ),
    },
    protectionLevels: PROTECTION_LEVEL_ORDER.map((level) => {
      const statuses = PROCESS_STATUS_VALUES.filter(
        (status) => PROTECTION_LEVELS[status] === level,
      );
      return {
        level,
        statuses,
        meaning: describeProtectionLevel(level),
        canAddDeliverables: level !== 'scope' && level !== 'hard',
        unlockSuppressesWarning: level !== 'none',
      };
    }),
  };
}

function describeTransition(from: string, to: string): string {
  if (from === 'roadmap' && to === 'active') return 'Start implementation work';
  if (from === 'roadmap' && to === 'deferred') return 'Defer work without completing it';
  if (from === 'roadmap' && to === 'roadmap') return 'Keep work in planning';
  if (from === 'active' && to === 'completed') return 'Finish implementation work';
  if (from === 'active' && to === 'roadmap') return 'Move active work back to planning';
  if (from === 'deferred' && to === 'roadmap') return 'Reactivate deferred work';
  if (from === 'completed' && to === 'active') return 'Reopen completed work for changes';
  if (from === 'completed' && to === 'roadmap') return 'Reopen completed work back to planning';
  return `${from} -> ${to}`;
}

function describeProtectionLevel(level: (typeof PROTECTION_LEVEL_ORDER)[number]): string {
  if (level === 'none') return 'Planning statuses remain editable.';
  if (level === 'scope')
    return 'Active work is scope-locked; adding pending deliverables warns (advisory).';
  return 'Completed work is hard-locked; editing or reopening warns, unlock reason is optional (advisory).';
}
