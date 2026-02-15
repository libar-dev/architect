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
    // Extended rules (step-lint-extended-rules spec)
    hashInStepText: {
        id: 'hash-in-step-text',
        severity: 'warning',
        description: 'Mid-line # in step text is interpreted as a Gherkin comment, silently truncating the step',
    },
    keywordInDescription: {
        id: 'keyword-in-description',
        severity: 'error',
        description: 'Description line starting with Given/When/Then/And/But breaks the Gherkin parser',
    },
    outlineQuotedValues: {
        id: 'outline-quoted-values',
        severity: 'warning',
        description: 'Scenario Outline steps with quoted values suggest Cucumber expression pattern instead of variable substitution',
    },
    repeatedStepPattern: {
        id: 'repeated-step-pattern',
        severity: 'error',
        description: 'Same step pattern registered twice in one scenario block — second registration overwrites the first',
    },
    // Infrastructure
    pairResolver: {
        id: 'pair-resolver',
        severity: 'warning',
        description: 'Feature-to-step file pairing issue — could not read step file or extract loadFeature() path',
    },
};
//# sourceMappingURL=types.js.map