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
} from '@libar-dev/architect-core';

import type { ValidationRuleDigest } from '../../fragments/governance/index.js';

const PROTECTION_LEVEL_ORDER = ['none', 'scope', 'hard'] as const;

export function buildValidationRuleDigest(): ValidationRuleDigest {
  const rules: ValidationRuleDigest['rules'] = [
    {
      id: 'completed-protection',
      description: 'Completed specs require unlock-reason tag to modify',
      severity: 'error',
    },
    {
      id: 'invalid-status-transition',
      description: 'Status transitions must follow FSM path',
      severity: 'error',
    },
    {
      id: 'scope-creep',
      description: 'Active specs cannot add new deliverables',
      severity: 'error',
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
      terminalStates: PROCESS_STATUS_VALUES.filter(
        (status) => VALID_TRANSITIONS[status].length === 0,
      ),
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
        needsUnlock: level === 'hard',
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
  return `${from} -> ${to}`;
}

function describeProtectionLevel(level: (typeof PROTECTION_LEVEL_ORDER)[number]): string {
  if (level === 'none') return 'Planning statuses remain editable.';
  if (level === 'scope') return 'Active work is scope-locked against deliverable expansion.';
  return 'Completed work is hard-locked until an explicit unlock reason is provided.';
}
