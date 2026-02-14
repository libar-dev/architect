/**
 * Types for the vitest-cucumber step linter.
 *
 * Defines the shapes used by feature-only, step-only, and cross-file checks.
 */
/** All step lint rule IDs */
export const STEP_LINT_RULES = {
    // Feature-only checks
    hashInDescription: {
        id: 'hash-in-description',
        severity: 'error',
        description: '# at line start in description context terminates the description (Gherkin parser treats it as a comment)',
    },
    duplicateAndStep: {
        id: 'duplicate-and-step',
        severity: 'error',
        description: 'Multiple And steps with identical text in the same scenario cause vitest-cucumber matching failures',
    },
    dollarInStepText: {
        id: 'dollar-in-step-text',
        severity: 'warning',
        description: '$ character in step text causes matching issues in vitest-cucumber',
    },
    // Step-only checks
    regexStepPattern: {
        id: 'regex-step-pattern',
        severity: 'error',
        description: 'vitest-cucumber does not support regex step patterns — use string patterns with {string}/{int}',
    },
    unsupportedPhraseType: {
        id: 'unsupported-phrase-type',
        severity: 'error',
        description: 'vitest-cucumber does not support {phrase} — use {string} instead',
    },
    // Cross-file checks
    scenarioOutlineFunctionParams: {
        id: 'scenario-outline-function-params',
        severity: 'error',
        description: 'ScenarioOutline step callbacks should use variables object, not function params (_ctx, value)',
    },
    missingAndDestructuring: {
        id: 'missing-and-destructuring',
        severity: 'error',
        description: 'Feature has And steps but step definition does not destructure And — causes StepAbleUnknowStepError',
    },
    missingRuleWrapper: {
        id: 'missing-rule-wrapper',
        severity: 'error',
        description: 'Feature has Rule: blocks but step definition does not destructure Rule from describeFeature',
    },
};
//# sourceMappingURL=types.js.map