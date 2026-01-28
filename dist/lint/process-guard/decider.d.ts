/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern ProcessGuardDecider
 * @libar-docs-status active
 * @libar-docs-implements ProcessGuardLinter
 * @libar-docs-depends-on:FSMValidator,DeriveProcessState,DetectChanges
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
import type { ValidationResult, ProcessViolation, DeciderInput, DeciderOutput, ProcessGuardRule } from './types.js';
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
export declare function validateChanges(input: DeciderInput): DeciderOutput;
/**
 * Check if validation result has any errors.
 */
export declare function hasErrors(result: ValidationResult): boolean;
/**
 * Check if validation result has any warnings.
 */
export declare function hasWarnings(result: ValidationResult): boolean;
/**
 * Get all violations and warnings combined.
 */
export declare function getAllIssues(result: ValidationResult): readonly ProcessViolation[];
/**
 * Filter violations by rule.
 */
export declare function getViolationsByRule(result: ValidationResult, rule: ProcessGuardRule): readonly ProcessViolation[];
/**
 * Create a summary string for the validation result.
 */
export declare function summarizeResult(result: ValidationResult): string;
//# sourceMappingURL=decider.d.ts.map