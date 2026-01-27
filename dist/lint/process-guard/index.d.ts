/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern ProcessGuardModule
 * @libar-docs-status active
 * @libar-docs-depends-on:FSMValidator,DeriveProcessState,DetectChanges,ProcessGuardDecider
 *
 * ## ProcessGuardModule - Process Guard Linter
 *
 * Enforces delivery process rules by validating changes against:
 * - Protection levels (completed files require unlock-reason)
 * - Status transitions (must follow PDR-005 FSM)
 * - Scope creep (active specs cannot add new deliverables)
 * - Session scope (modifications outside session warn)
 *
 * ### Architecture
 *
 * ```
 * derive-state.ts ─┐
 *                  ├──► decider.ts ──► ValidationResult
 * detect-changes.ts┘
 * ```
 *
 * ### When to Use
 *
 * - Pre-commit hook validation
 * - CI/CD pipeline validation
 * - Interactive validation during development
 */
export type { ProcessState, FileState, SessionState, SessionStatus, ChangeDetection, StatusTransition, DeliverableChange, ValidationResult, ProcessViolation, ViolationSeverity, ProcessGuardRule, ProcessGuardRuleDefinition, LintProcessOptions, ValidationMode, DeciderInput, DeciderOutput, DeciderEvent, DeciderOptions, } from './types.js';
export { deriveProcessState, getFileState, getFilesByProtection, isInSessionScope, isSessionExcluded, type DeriveStateConfig, } from './derive-state.js';
export { detectStagedChanges, detectBranchChanges, detectFileChanges, hasChanges, getAllChangedFiles, fileWasModified, getStatusTransition, getDeliverableChanges, detectDeliverableChanges, type ChangeDetectionOptions, } from './detect-changes.js';
export { validateChanges, hasErrors, hasWarnings, getAllIssues, getViolationsByRule, summarizeResult, } from './decider.js';
//# sourceMappingURL=index.d.ts.map