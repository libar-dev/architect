/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern ProcessGuardDecider
 * @libar-docs-status active
 * @libar-docs-arch-context lint
 * @libar-docs-arch-layer application
 * @libar-docs-implements ProcessGuardLinter
 * @libar-docs-depends-on:FSMValidator,DeriveProcessState,DetectChanges
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
 */
import { validateTransition, getValidTransitionsFrom } from '../../validation/fsm/index.js';
import { isInSessionScope, isSessionExcluded } from './derive-state.js';
/**
 * Default tag prefix for error messages when no registry is provided.
 */
const DEFAULT_TAG_PREFIX = '@libar-docs-';
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
export function validateChanges(input) {
    const { state, changes, options } = input;
    const events = [];
    const violations = [];
    const warnings = [];
    // Emit start event
    const allFiles = [...changes.modifiedFiles, ...changes.addedFiles];
    events.push({ type: 'validation_started', fileCount: allFiles.length });
    // Run each rule
    const rules = [
        {
            rule: 'completed-protection',
            fn: () => checkProtectionLevel(state, changes, options.registry),
        },
        {
            rule: 'invalid-status-transition',
            fn: () => checkStatusTransitions(state, changes),
        },
        { rule: 'scope-creep', fn: () => checkScopeCreep(state, changes) },
        {
            rule: 'session-scope',
            fn: () => (options.ignoreSession ? [] : checkSessionScope(state, changes)),
        },
        {
            rule: 'session-excluded',
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
            }
            else {
                warnings.push(v);
            }
        }
    }
    // In strict mode, promote warnings to violations
    const finalViolations = options.strict
        ? [...violations, ...warnings.map((w) => ({ ...w, severity: 'error' }))]
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
function checkProtectionLevel(state, changes, registry) {
    const tagPrefix = registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
    const violations = [];
    for (const file of [...changes.modifiedFiles, ...changes.addedFiles]) {
        const fileState = state.files.get(file);
        if (!fileState)
            continue;
        // Check hard protection (completed)
        if (fileState.protection === 'hard' && !fileState.hasUnlockReason) {
            violations.push(createViolation('completed-protection', 'error', `Cannot modify completed spec '${file}' without unlock reason`, file, `Add ${tagPrefix}unlock-reason:'your reason' to proceed`));
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
function checkStatusTransitions(state, changes) {
    const violations = [];
    for (const [file, transition] of changes.statusTransitions) {
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
            violations.push(createViolation('invalid-status-transition', 'error', message, file, suggestion));
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
function checkScopeCreep(state, changes) {
    const violations = [];
    for (const [file, deliverableChange] of changes.deliverableChanges) {
        const fileState = state.files.get(file);
        if (!fileState)
            continue;
        // Only check active specs (scope-locked)
        if (fileState.protection === 'scope' && deliverableChange.added.length > 0) {
            violations.push(createViolation('scope-creep', 'error', `Cannot add deliverables to active spec '${file}': ${deliverableChange.added.join(', ')}`, file, 'Create new spec or revert to roadmap status first'));
        }
        // Warn about removed deliverables
        if (deliverableChange.removed.length > 0) {
            violations.push(createViolation('deliverable-removed', 'warning', `Deliverable removed from '${file}': ${deliverableChange.removed.join(', ')}`, file, 'Was this completed or descoped? Consider documenting the reason.'));
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
function checkSessionScope(state, changes) {
    const violations = [];
    if (!state.activeSession) {
        return violations; // No session, no scope rules
    }
    for (const file of [...changes.modifiedFiles, ...changes.addedFiles]) {
        if (!isInSessionScope(state, file)) {
            violations.push(createViolation('session-scope', 'warning', `File '${file}' is not in session scope`, file, `Add to session '${state.activeSession.id}' scope or use --ignore-session flag`));
        }
    }
    return violations;
}
/**
 * Check for explicitly excluded files.
 *
 * Explicitly excluded files trigger errors (not warnings).
 */
function checkSessionExcluded(state, changes) {
    const violations = [];
    if (!state.activeSession) {
        return violations;
    }
    for (const file of [...changes.modifiedFiles, ...changes.addedFiles]) {
        if (isSessionExcluded(state, file)) {
            violations.push(createViolation('session-excluded', 'error', `File '${file}' is explicitly excluded from session '${state.activeSession.id}'`, file, 'This file was explicitly excluded and cannot be modified in this session'));
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
function createViolation(rule, severity, message, file, suggestion) {
    // Build violation (handle exactOptionalPropertyTypes)
    const violation = { rule, severity, message, file };
    // Only add suggestion if provided
    if (suggestion !== undefined) {
        violation.suggestion = suggestion;
    }
    return violation;
}
// =============================================================================
// Convenience Functions
// =============================================================================
/**
 * Check if validation result has any errors.
 */
export function hasErrors(result) {
    return result.violations.length > 0;
}
/**
 * Check if validation result has any warnings.
 */
export function hasWarnings(result) {
    return result.warnings.length > 0;
}
/**
 * Get all violations and warnings combined.
 */
export function getAllIssues(result) {
    return [...result.violations, ...result.warnings];
}
/**
 * Filter violations by rule.
 */
export function getViolationsByRule(result, rule) {
    return result.violations.filter((v) => v.rule === rule);
}
/**
 * Create a summary string for the validation result.
 */
export function summarizeResult(result) {
    const errorCount = result.violations.length;
    const warningCount = result.warnings.length;
    if (result.valid && warningCount === 0) {
        return 'Process guard check passed';
    }
    const parts = [];
    if (errorCount > 0) {
        parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    }
    if (warningCount > 0) {
        parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
    }
    return `Process guard check: ${parts.join(', ')}`;
}
//# sourceMappingURL=decider.js.map