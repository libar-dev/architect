/**
 * Idea-tier soft lint module — advisory `warning`-only checks for specs at
 * explicit `@architect-maturity:idea`. Enforces the minimum-Gherkin-by-tier
 * philosophy: line budget ≤30, no Scenario, no Background, every Rule
 * declares an **Invariant:**, ≥5 explicit @architect-* tags incl. parent
 * (parent waived for `@architect-level:epic|slice`). Always soft — never
 * blocks a build.
 */
export type { IdeaTierLintRule } from './types.js';
export {
  IDEA_TIER_LINT_RULES,
  IDEA_TIER_LINE_BUDGET,
  IDEA_TIER_MIN_EXPLICIT_TAGS,
} from './types.js';

export type { IdeaTierDetection, IdeaTierLevel } from './idea-tier-checks.js';
export {
  detectIdeaTier,
  runIdeaTierChecks,
  checkLineBudget,
  checkNoScenarios,
  checkNoBackground,
  checkRuleHasInvariant,
  checkTagMinimum,
} from './idea-tier-checks.js';

export type { IdeaTierLintOptions } from './runner.js';
export { runIdeaTierLint } from './runner.js';
