/**
 * @architect
 * @architect-pattern LintModule
 * @architect-lint
 * @architect-status completed
 * @architect-role:barrel
 * @architect-bounded-context:lint
 * @architect-uses LintRules, LintEngine
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
export type { LintSeverity, LintViolation } from '@libar-dev/architect-core';
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

// Step Lint (vitest-cucumber feature/step compatibility checking)
export { runStepLint, STEP_LINT_RULES } from './steps/index.js';
export type { StepLintRule, FeatureStepPair, StepLintOptions } from './steps/index.js';

// Idea-tier soft lint (advisory warnings for @architect-maturity:idea specs)
export {
  runIdeaTierLint,
  runIdeaTierChecks,
  detectIdeaTier,
  checkLineBudget,
  checkNoScenarios,
  checkNoBackground,
  checkRuleHasInvariant,
  checkTagMinimum,
  IDEA_TIER_LINT_RULES,
  IDEA_TIER_LINE_BUDGET,
  IDEA_TIER_MIN_EXPLICIT_TAGS,
} from './idea-tier/index.js';
export type {
  IdeaTierLintRule,
  IdeaTierLintOptions,
  IdeaTierDetection,
} from './idea-tier/index.js';

export {
  DANGLING_BASELINE_SOURCE_PATH,
  compareDanglingBaseline,
  normalizeDanglingBaselineEntries,
  readDanglingBaseline,
  writeDanglingBaseline,
} from './dangling-baseline.js';
export type {
  DanglingBaselineComparison,
  DanglingBaselineEntry,
  DanglingBaselineFileOptions,
} from './dangling-baseline.js';
