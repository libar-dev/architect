/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern LintModule
 * @libar-docs-status completed
 * @libar-docs-uses LintRules, LintEngine
 *
 * ## LintModule - Annotation Quality Checking
 *
 * Provides lint rules and engine for pattern annotation quality checking.
 * Exports the complete lint API including rules, engine, and formatters.
 *
 * ### When to Use
 *
 * - Use when importing lint functionality into CLI or other consumers
 * - Use for accessing both rules and engine from a single import
 */
export type { LintSeverity, LintViolation } from '../validation-schemas/lint.js';
export type { LintRule, LintContext } from './rules.js';
export { defaultRules, filterRulesBySeverity, missingPatternName, invalidStatus, missingStatus, missingWhenToUse, tautologicalDescription, missingRelationships, patternConflictInImplements, missingRelationshipTarget, } from './rules.js';
export type { LintResult, LintSummary, DirectiveWithLocation } from './engine.js';
export { lintDirective, lintFiles, hasFailures, sortViolationsBySeverity, formatPretty, formatJson, } from './engine.js';
export * from './process-guard/index.js';
export { runStepLint, STEP_LINT_RULES } from './steps/index.js';
export type { StepLintRule, FeatureStepPair, StepLintOptions } from './steps/index.js';
//# sourceMappingURL=index.d.ts.map