/**
 * @architect
 * @architect-lint
 * @architect-pattern ProcessGuardDecider
 * @architect-status active
 * @architect-role:decider
 * @architect-bounded-context:lint
 * @architect-implements ProcessGuardLinter
 * @architect-uses FSMValidator, DeriveProcessState, DetectChanges
 *
 * ## ProcessGuardDecider - Pure Validation Logic
 *
 * Pure function that validates changes against process rules.
 * Follows the Decider pattern from platform-core: no I/O, no side effects.
 *
 * ### When to Use
 *
 * - When validating proposed changes against workflow rules
 * - When implementing custom validation rules for the process guard
 * - When building pre-commit hooks that enforce FSM transitions
 *
 * ### Design Principles
 *
 * - **Pure Function**: (state, changes, options) => result
 * - **No I/O**: All data passed in, no file reads
 * - **Composable Rules**: Rules are separate functions combined in decider
 * - **Testable**: Easy to unit test with mock data
 *
 * ### Rules Implemented
 *
 * 1. **Protection Level** - Modifying a completed spec warns (advisory);
 *    unlock-reason suppresses it (PDR-006)
 * 2. **Status Transition** - Transitions must follow the FSM (PDR-005, as
 *    revised by PDR-006: completed reopens to active/roadmap)
 * 3. **Scope Creep** - Adding pending scope to an active spec warns (advisory);
 *    adding real-progress scope is silent; unlock-reason suppresses (PDR-006)
 * 4. **Session Scope** - Modifications outside session scope warn
 * 5. **Session Exclusion** - Explicitly excluded files are a hard error
 * 6. **Deliverable Removal** - Removing a deliverable from an active spec warns;
 *    unlock-reason suppresses (PDR-006)
 *
 * The invariants and rationale for each rule are the load-bearing narrative
 * in `tests/features/process-guard-rules.feature`
 * (`@architect-pattern:ProcessGuardRulesExecutableTests`).
 */

import {
  validateTransition,
  getValidTransitionsFrom,
  isTerminalState,
} from '@libar-dev/architect-core';
import type { TagRegistry } from '@libar-dev/architect-core';
import type {
  ProcessState,
  ChangeDetection,
  ValidationResult,
  ProcessViolation,
  ViolationSeverity,
  DeciderInput,
  DeciderOutput,
  DeciderEvent,
  ProcessGuardRule,
} from './types.js';
import { isInSessionScope, isSessionExcluded } from './session-state-reader.js';
import { DEFAULT_TAG_PREFIX } from '@libar-dev/architect-core';

// =============================================================================
// Decider - Main Entry Point
// =============================================================================

/**
 * Validate changes against process rules.
 *
 * Pure function following the Decider pattern:
 * - Takes all inputs explicitly (no hidden state)
 * - Returns result without side effects
 * - Emits events for observability
 *
 * @param input - Complete input including state, changes, and options
 * @returns DeciderOutput with validation result and events
 *
 * @example
 * ```typescript
 * const output = validateChanges({
 *   state: processState,
 *   changes: changeDetection,
 *   options: { strict: false, ignoreSession: false },
 * });
 *
 * if (!output.result.valid) {
 *   console.log('Violations:', output.result.violations);
 * }
 * ```
 */
export function validateChanges(input: DeciderInput): DeciderOutput {
  const { state, changes, options } = input;
  const events: DeciderEvent[] = [];
  const violations: ProcessViolation[] = [];
  const warnings: ProcessViolation[] = [];

  // Emit start event
  const allFiles = [...changes.modifiedFiles, ...changes.addedFiles];
  events.push({ type: 'validation_started', fileCount: allFiles.length });

  // Run each rule
  const rules = [
    {
      rule: 'completed-protection' as const,
      fn: () => checkProtectionLevel(state, changes, options.registry),
    },
    {
      rule: 'invalid-status-transition' as const,
      fn: () => checkStatusTransitions(state, changes),
    },
    { rule: 'scope-creep' as const, fn: () => checkScopeCreep(state, changes) },
    {
      rule: 'session-scope' as const,
      fn: () => (options.ignoreSession ? [] : checkSessionScope(state, changes)),
    },
    {
      rule: 'session-excluded' as const,
      fn: () => (options.ignoreSession ? [] : checkSessionExcluded(state, changes)),
    },
  ];

  for (const { rule, fn } of rules) {
    const ruleViolations = fn();
    const passed = ruleViolations.length === 0;
    events.push({ type: 'rule_checked', rule, passed });

    for (const v of ruleViolations) {
      if (v.severity === 'error') {
        violations.push(v);
      } else {
        warnings.push(v);
      }
    }
  }

  // In strict mode, promote warnings to violations
  const finalViolations = options.strict
    ? [...violations, ...warnings.map((w) => ({ ...w, severity: 'error' as const }))]
    : violations;
  const finalWarnings = options.strict ? [] : warnings;

  const valid = finalViolations.length === 0;
  events.push({
    type: 'validation_completed',
    valid,
    violationCount: finalViolations.length,
  });

  return {
    result: {
      valid,
      violations: finalViolations,
      warnings: finalWarnings,
      processState: state,
      changes,
    },
    events,
  };
}

/**
 * Check protection level (completed-spec) advisory.
 *
 * Modifying or reopening a completed (hard-protected) spec surfaces a warning,
 * never a commit-blocking error (PDR-006 Rule 1/2). `@architect-unlock-reason`
 * is optional: when present it records intent and suppresses the warning; when
 * absent the guard warns but does not block. `--strict` promotes the warning to
 * blocking via the shared severity model in `validateChanges`.
 *
 * @param state - Current process state
 * @param changes - Detected changes
 * @param registry - Optional tag registry for prefix-aware messages
 */
function checkProtectionLevel(
  state: ProcessState,
  changes: ChangeDetection,
  registry?: TagRegistry,
): ProcessViolation[] {
  const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const violations: ProcessViolation[] = [];

  for (const file of [...changes.modifiedFiles, ...changes.addedFiles]) {
    const fileState = state.files.get(file);
    if (!fileState) continue;

    // Check hard protection (completed) — unlock-reason suppresses the warning
    if (fileState.protection === 'hard' && !fileState.hasUnlockReason) {
      // Exempt files transitioning TO a terminal state — this is a completion, not a post-completion edit
      const transition = changes.statusTransitions.get(file);
      if (transition !== undefined && isTerminalState(transition.to)) {
        continue;
      }
      violations.push(
        createViolation(
          'completed-protection',
          'warning',
          `Modifying completed spec '${file}'`,
          file,
          `Add ${tagPrefix}unlock-reason:'your reason' to record intent and suppress this warning`,
        ),
      );
    }
  }

  return violations;
}

/**
 * Check status transition validity.
 *
 * Uses FSM validation from phase-state-machine module.
 * Enhanced error messages include line numbers and docstring context.
 */
function checkStatusTransitions(state: ProcessState, changes: ChangeDetection): ProcessViolation[] {
  const violations: ProcessViolation[] = [];

  for (const [file, transition] of changes.statusTransitions) {
    // Only validated unlock reasons bypass FSM, and only for retroactive completion paths
    const fileState = state.files.get(file);
    if (
      transition.to === 'completed' &&
      transition.hasUnlockReason === true &&
      fileState?.hasUnlockReason === true
    ) {
      continue;
    }

    const validationResult = validateTransition(transition.from, transition.to);

    if (!validationResult.valid) {
      const validTransitions = getValidTransitionsFrom(transition.from);

      // Build detailed message with context
      const fileContext = transition.isNewFile === true ? ' (new file)' : '';
      const lineInfo = transition.toLocation
        ? ` at line ${String(transition.toLocation.lineNumber)}`
        : '';

      const message = `Invalid status transition in '${file}'${fileContext}${lineInfo}: ${transition.from} → ${transition.to}`;

      // Build suggestion with debugging hints
      let suggestion = `Valid transitions from '${transition.from}': ${validTransitions.join(', ')}`;

      // Add docstring debugging info if multiple tags were found
      if (transition.allDetectedTags && transition.allDetectedTags.length > 1) {
        const docstringTags = transition.allDetectedTags.filter((t) => t.insideDocstring);
        if (docstringTags.length > 0) {
          suggestion += `\n    Note: ${String(docstringTags.length)} status tag(s) inside docstrings were ignored`;
          suggestion += '\n    Detected tags:';
          for (const tag of transition.allDetectedTags) {
            const context = tag.insideDocstring ? ' [inside docstring - ignored]' : ' [file-level]';
            suggestion += `\n      Line ${String(tag.lineNumber)}${context}`;
          }
        }
      }

      violations.push(
        createViolation('invalid-status-transition', 'error', message, file, suggestion),
      );
    }
  }

  return violations;
}

/**
 * Check active-spec scope changes (advisory).
 *
 * Expanding the scope of an active (scope-locked) spec is advisory (PDR-006
 * Rule 3): adding a deliverable whose status is `pending` (unbuilt scope)
 * warns; adding a deliverable that records real progress
 * (in-progress/complete/deferred/superseded/n/a) is silent; removing a
 * deliverable warns. `@architect-unlock-reason` suppresses these warnings, and
 * `--strict` promotes them to blocking. No deliverable change to an active spec
 * blocks a commit on the commit path.
 */
function checkScopeCreep(state: ProcessState, changes: ChangeDetection): ProcessViolation[] {
  const violations: ProcessViolation[] = [];

  for (const [file, deliverableChange] of changes.deliverableChanges) {
    const fileState = state.files.get(file);
    if (!fileState) continue;

    // Only active specs (scope-locked) are advised on; unlock-reason suppresses.
    if (fileState.protection !== 'scope' || fileState.hasUnlockReason) {
      continue;
    }

    // Adding pending (unbuilt) scope warns; adding real-progress scope is silent.
    if (deliverableChange.addedPending.length > 0) {
      violations.push(
        createViolation(
          'scope-creep',
          'warning',
          `Adding pending scope to active spec '${file}': ${deliverableChange.addedPending.join(', ')}`,
          file,
          'Confirm this scope is intentional, or add @architect-unlock-reason to suppress this warning.',
        ),
      );
    }

    // Warn about removed deliverables
    if (deliverableChange.removed.length > 0) {
      violations.push(
        createViolation(
          'deliverable-removed',
          'warning',
          `Deliverable removed from '${file}': ${deliverableChange.removed.join(', ')}`,
          file,
          'Was this completed or descoped? Consider documenting the reason.',
        ),
      );
    }
  }

  return violations;
}

/**
 * Check session scope violations.
 *
 * Files outside active session scope trigger warnings.
 */
function checkSessionScope(state: ProcessState, changes: ChangeDetection): ProcessViolation[] {
  const violations: ProcessViolation[] = [];

  if (!state.activeSession) {
    return violations; // No session, no scope rules
  }

  for (const file of [...changes.modifiedFiles, ...changes.addedFiles]) {
    if (!isInSessionScope(state, file)) {
      violations.push(
        createViolation(
          'session-scope',
          'warning',
          `File '${file}' is not in session scope`,
          file,
          `Add to session '${state.activeSession.id}' scope or use --ignore-session flag`,
        ),
      );
    }
  }

  return violations;
}

/**
 * Check for explicitly excluded files.
 *
 * Explicitly excluded files trigger errors (not warnings).
 */
function checkSessionExcluded(state: ProcessState, changes: ChangeDetection): ProcessViolation[] {
  const violations: ProcessViolation[] = [];

  if (!state.activeSession) {
    return violations;
  }

  for (const file of [...changes.modifiedFiles, ...changes.addedFiles]) {
    if (isSessionExcluded(state, file)) {
      violations.push(
        createViolation(
          'session-excluded',
          'error',
          `File '${file}' is explicitly excluded from session '${state.activeSession.id}'`,
          file,
          'This file was explicitly excluded and cannot be modified in this session',
        ),
      );
    }
  }

  return violations;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create a process violation.
 */
function createViolation(
  rule: ProcessGuardRule,
  severity: ViolationSeverity,
  message: string,
  file: string,
  suggestion?: string,
): ProcessViolation {
  // Build violation (handle exactOptionalPropertyTypes)
  const violation: ProcessViolation = { rule, severity, message, file };

  // Only add suggestion if provided
  if (suggestion !== undefined) {
    (violation as { suggestion?: string }).suggestion = suggestion;
  }

  return violation;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Check if validation result has any errors.
 */
export function hasErrors(result: ValidationResult): boolean {
  return result.violations.length > 0;
}

/**
 * Check if validation result has any warnings.
 */
export function hasWarnings(result: ValidationResult): boolean {
  return result.warnings.length > 0;
}

/**
 * Get all violations and warnings combined.
 */
export function getAllIssues(result: ValidationResult): readonly ProcessViolation[] {
  return [...result.violations, ...result.warnings];
}

/**
 * Filter violations by rule.
 */
export function getViolationsByRule(
  result: ValidationResult,
  rule: ProcessGuardRule,
): readonly ProcessViolation[] {
  return result.violations.filter((v) => v.rule === rule);
}

/**
 * Create a summary string for the validation result.
 */
export function summarizeResult(result: ValidationResult): string {
  const errorCount = result.violations.length;
  const warningCount = result.warnings.length;

  if (result.valid && warningCount === 0) {
    return 'Process guard check passed';
  }

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${String(errorCount)} error${errorCount !== 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${String(warningCount)} warning${warningCount !== 1 ? 's' : ''}`);
  }

  return `Process guard check: ${parts.join(', ')}`;
}
