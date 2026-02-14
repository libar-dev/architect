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
export declare const STEP_LINT_RULES: {
    hashInDescription: {
        id: string;
        severity: "error";
        description: string;
    };
    duplicateAndStep: {
        id: string;
        severity: "error";
        description: string;
    };
    dollarInStepText: {
        id: string;
        severity: "warning";
        description: string;
    };
    regexStepPattern: {
        id: string;
        severity: "error";
        description: string;
    };
    unsupportedPhraseType: {
        id: string;
        severity: "error";
        description: string;
    };
    scenarioOutlineFunctionParams: {
        id: string;
        severity: "error";
        description: string;
    };
    missingAndDestructuring: {
        id: string;
        severity: "error";
        description: string;
    };
    missingRuleWrapper: {
        id: string;
        severity: "error";
        description: string;
    };
};
//# sourceMappingURL=types.d.ts.map