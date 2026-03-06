/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern ProcessGuardDecider
 * @libar-docs-status active
 * @libar-docs-arch-role decider
 * @libar-docs-arch-context lint
 * @libar-docs-arch-layer application
 * @libar-docs-implements ProcessGuardLinter
 * @libar-docs-uses FSMValidator, DeriveProcessState, DetectChanges
 * @libar-docs-depends-on:FSMValidator,DeriveProcessState,DetectChanges
 * @libar-docs-convention process-guard-errors
 * @libar-docs-extract-shapes validateChanges
 *
 * ## ProcessGuardDecider - Pure Validation Logic
 *
 * Pure function that validates changes against process rules.
 * Follows the Decider pattern from platform-core: no I/O, no side effects.
 *
 * ### When to Use
 *
 * - When validating proposed changes against delivery process rules
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
 * 1. **Protection Level** - Completed files require unlock-reason
 * 2. **Status Transition** - Transitions must follow PDR-005 FSM
 * 3. **Scope Creep** - Active specs cannot add new deliverables
 * 4. **Session Scope** - Modifications outside session scope warn
 *
 * ### Error Guide Content (convention: process-guard-errors)
 *
 * ## completed-protection
 *
 * **Invariant:** Completed specs are immutable without an explicit unlock
 * reason. The unlock reason must be at least 10 characters and cannot be
 * a placeholder.
 *
 * **Rationale:** The `completed` status represents verified, accepted work.
 * Allowing silent modification undermines the terminal-state guarantee.
 * Requiring an unlock reason creates an audit trail and forces the developer
 * to justify why completed work needs revisiting.
 *
 * | Situation | Solution | Example |
 * |-----------|----------|---------|
 * | Fix typo in completed spec | Add unlock reason tag | `@libar-docs-unlock-reason:Fix-typo-in-FSM-diagram` |
 * | Spec needs rework | Create new spec instead | New feature file with `roadmap` status |
 * | Legacy import | Multiple transitions in one commit | Set `roadmap` then `completed` |
 *
 * ## invalid-status-transition
 *
 * **Invariant:** Status transitions must follow the PDR-005 FSM path.
 * The only valid paths are: roadmap to active, roadmap to deferred,
 * active to completed, active to roadmap, deferred to roadmap.
 *
 * **Rationale:** The FSM enforces a deliberate progression through
 * planning, implementation, and completion. Skipping states (e.g.,
 * roadmap to completed) means work was never tracked as active, breaking
 * session scoping and deliverable validation.
 *
 * | Attempted | Why Invalid | Valid Path |
 * |-----------|-------------|------------|
 * | roadmap to completed | Must go through active | roadmap to active to completed |
 * | deferred to active | Must return to roadmap first | deferred to roadmap to active |
 * | deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
 *
 * ## scope-creep
 *
 * **Invariant:** Active specs cannot add new deliverables. Scope is locked
 * when status transitions to `active`.
 *
 * **Rationale:** Prevents scope creep during implementation. Plan fully
 * before starting; implement what was planned. Adding deliverables mid-
 * implementation signals inadequate planning and risks incomplete work.
 *
 * | Situation | Solution | Example |
 * |-----------|----------|---------|
 * | Need new deliverable | Revert to roadmap first | Change status to roadmap, add deliverable, then back to active |
 * | Discovered work during implementation | Create new spec | New feature file for the discovered work |
 *
 * ## session-scope
 *
 * **Invariant:** Files outside the active session scope trigger warnings
 * to prevent accidental cross-session modifications.
 *
 * **Rationale:** Session scoping ensures focused work. Modifying files
 * outside the session scope often indicates scope creep or working on
 * the wrong task. The warning is informational (not blocking) to allow
 * intentional cross-scope changes with `--ignore-session`.
 *
 * ## session-excluded
 *
 * **Invariant:** Files explicitly excluded from a session cannot be
 * modified in that session. This is a hard error, not a warning.
 *
 * **Rationale:** Explicit exclusion is a deliberate decision to protect
 * certain files from modification during a session. Unlike session-scope
 * (warning), exclusion represents a conscious boundary that should not
 * be violated without changing the session configuration.
 *
 * ## deliverable-removed
 *
 * **Invariant:** Removing a deliverable from an active spec triggers a
 * warning to ensure the removal is intentional and documented.
 *
 * **Rationale:** Deliverable removal during active implementation may
 * indicate descoping or completion elsewhere. The warning ensures
 * visibility -- the commit message should document why the deliverable
 * was removed.
 */

import {
  validateTransition,
  getValidTransitionsFrom,
  isTerminalState,
} from '../../validation/fsm/index.js';
import type { TagRegistry } from '../../validation-schemas/tag-registry.js';
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
import { isInSessionScope, isSessionExcluded } from './derive-state.js';
import { DEFAULT_TAG_PREFIX } from '../../config/defaults.js';

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

// =============================================================================
// Rule: Protection Level
// =============================================================================

/**
 * Check protection level violations.
 *
 * - Completed (hard) files require unlock-reason tag
 * - Returns error if modified without unlock
 *
 * @param state - Current process state
 * @param changes - Detected changes
 * @param registry - Optional tag registry for prefix-aware messages
 */
function checkProtectionLevel(
  state: ProcessState,
  changes: ChangeDetection,
  registry?: TagRegistry
): ProcessViolation[] {
  const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const violations: ProcessViolation[] = [];

  for (const file of [...changes.modifiedFiles, ...changes.addedFiles]) {
    const fileState = state.files.get(file);
    if (!fileState) continue;

    // Check hard protection (completed)
    if (fileState.protection === 'hard' && !fileState.hasUnlockReason) {
      // Exempt files transitioning TO a terminal state — this is a completion, not a post-completion edit
      const transition = changes.statusTransitions.get(file);
      if (transition !== undefined && isTerminalState(transition.to)) {
        continue;
      }
      violations.push(
        createViolation(
          'completed-protection',
          'error',
          `Cannot modify completed spec '${file}' without unlock reason`,
          file,
          `Add ${tagPrefix}unlock-reason:'your reason' to proceed`
        )
      );
    }
  }

  return violations;
}

// =============================================================================
// Rule: Status Transitions
// =============================================================================

/**
 * Check status transition validity.
 *
 * Uses FSM validation from phase-state-machine module.
 * Enhanced error messages include line numbers and docstring context.
 */
function checkStatusTransitions(state: ProcessState, changes: ChangeDetection): ProcessViolation[] {
  const violations: ProcessViolation[] = [];

  for (const [file, transition] of changes.statusTransitions) {
    // Files with unlock-reason bypass FSM check (supports retroactive completions and file splits)
    if (transition.hasUnlockReason === true) {
      continue;
    }

    const validationResult = validateTransition(transition.from, transition.to);

    if (!validationResult.valid) {
      const validTransitions = getValidTransitionsFrom(transition.from);

      // Build detailed message with context
      const fileContext = transition.isNewFile === true ? ' (new file)' : '';
      const lineInfo = transition.toLocation ? ` at line ${transition.toLocation.lineNumber}` : '';

      const message = `Invalid status transition in '${file}'${fileContext}${lineInfo}: ${transition.from} → ${transition.to}`;

      // Build suggestion with debugging hints
      let suggestion = `Valid transitions from '${transition.from}': ${validTransitions.join(', ')}`;

      // Add docstring debugging info if multiple tags were found
      if (transition.allDetectedTags && transition.allDetectedTags.length > 1) {
        const docstringTags = transition.allDetectedTags.filter((t) => t.insideDocstring);
        if (docstringTags.length > 0) {
          suggestion += `\n    Note: ${docstringTags.length} status tag(s) inside docstrings were ignored`;
          suggestion += '\n    Detected tags:';
          for (const tag of transition.allDetectedTags) {
            const context = tag.insideDocstring ? ' [inside docstring - ignored]' : ' [file-level]';
            suggestion += `\n      Line ${tag.lineNumber}${context}`;
          }
        }
      }

      violations.push(
        createViolation('invalid-status-transition', 'error', message, file, suggestion)
      );
    }
  }

  return violations;
}

// =============================================================================
// Rule: Scope Creep
// =============================================================================

/**
 * Check for scope creep (new deliverables in active specs).
 *
 * Active specs cannot add new deliverables.
 */
function checkScopeCreep(state: ProcessState, changes: ChangeDetection): ProcessViolation[] {
  const violations: ProcessViolation[] = [];

  for (const [file, deliverableChange] of changes.deliverableChanges) {
    const fileState = state.files.get(file);
    if (!fileState) continue;

    // Only check active specs (scope-locked)
    if (fileState.protection === 'scope' && deliverableChange.added.length > 0) {
      violations.push(
        createViolation(
          'scope-creep',
          'error',
          `Cannot add deliverables to active spec '${file}': ${deliverableChange.added.join(', ')}`,
          file,
          'Create new spec or revert to roadmap status first'
        )
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
          'Was this completed or descoped? Consider documenting the reason.'
        )
      );
    }
  }

  return violations;
}

// =============================================================================
// Rule: Session Scope
// =============================================================================

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
          `Add to session '${state.activeSession.id}' scope or use --ignore-session flag`
        )
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
          'This file was explicitly excluded and cannot be modified in this session'
        )
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
  suggestion?: string
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
  rule: ProcessGuardRule
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
    parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
  }

  return `Process guard check: ${parts.join(', ')}`;
}
