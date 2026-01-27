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

// Rule types and definitions
export type { LintSeverity, LintViolation } from '../validation-schemas/lint.js';
export type { LintRule, LintContext } from './rules.js';
export {
  defaultRules,
  filterRulesBySeverity,
  missingPatternName,
  invalidStatus,
  missingStatus,
  missingWhenToUse,
  tautologicalDescription,
  missingRelationships,
  patternConflictInImplements,
  missingRelationshipTarget,
} from './rules.js';

// Engine types and functions
export type { LintResult, LintSummary, DirectiveWithLocation } from './engine.js';
export {
  lintDirective,
  lintFiles,
  hasFailures,
  sortViolationsBySeverity,
  formatPretty,
  formatJson,
} from './engine.js';

// Process Guard (FSM validation, change detection, protection enforcement)
export * from './process-guard/index.js';
