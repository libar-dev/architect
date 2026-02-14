/**
 * Types for the vitest-cucumber step linter.
 *
 * Defines the shapes used by feature-only, step-only, and cross-file checks.
 */

import type { LintSeverity } from '../../validation-schemas/lint.js';

/**
 * A lint rule definition for step/feature boundary checking
 */
export interface StepLintRule {
  /** Unique rule ID (e.g., 'hash-in-description') */
  readonly id: string;
  /** Default severity level */
  readonly severity: LintSeverity;
  /** Human-readable rule description */
  readonly description: string;
}

/**
 * A paired feature file and its step definition file
 */
export interface FeatureStepPair {
  /** Absolute path to the .feature file */
  readonly featurePath: string;
  /** Absolute path to the .steps.ts file */
  readonly stepPath: string;
}

/** All step lint rule IDs */
export const STEP_LINT_RULES = {
  // Feature-only checks
  hashInDescription: {
    id: 'hash-in-description',
    severity: 'error' as const,
    description:
      '# at line start in description context terminates the description (Gherkin parser treats it as a comment)',
  },
  duplicateAndStep: {
    id: 'duplicate-and-step',
    severity: 'error' as const,
    description:
      'Multiple And steps with identical text in the same scenario cause vitest-cucumber matching failures',
  },
  dollarInStepText: {
    id: 'dollar-in-step-text',
    severity: 'warning' as const,
    description: '$ character in step text causes matching issues in vitest-cucumber',
  },

  // Step-only checks
  regexStepPattern: {
    id: 'regex-step-pattern',
    severity: 'error' as const,
    description:
      'vitest-cucumber does not support regex step patterns — use string patterns with {string}/{int}',
  },
  unsupportedPhraseType: {
    id: 'unsupported-phrase-type',
    severity: 'error' as const,
    description: 'vitest-cucumber does not support {phrase} — use {string} instead',
  },

  // Cross-file checks
  scenarioOutlineFunctionParams: {
    id: 'scenario-outline-function-params',
    severity: 'error' as const,
    description:
      'ScenarioOutline step callbacks should use variables object, not function params (_ctx, value)',
  },
  missingAndDestructuring: {
    id: 'missing-and-destructuring',
    severity: 'error' as const,
    description:
      'Feature has And steps but step definition does not destructure And — causes StepAbleUnknowStepError',
  },
  missingRuleWrapper: {
    id: 'missing-rule-wrapper',
    severity: 'error' as const,
    description:
      'Feature has Rule: blocks but step definition does not destructure Rule from describeFeature',
  },
} satisfies Record<string, StepLintRule>;
