/**
 * Orchestrator for vitest-cucumber step lint checks.
 *
 * Discovers feature and step files, pairs them, runs all checks,
 * and returns a LintSummary compatible with the existing lint engine.
 */
import type { LintSummary } from '../engine.js';
/**
 * Options for the step lint runner
 */
export interface StepLintOptions {
    /** Base directory for resolving paths (default: cwd) */
    readonly baseDir?: string;
    /** Feature file glob patterns (default: tests + specs + decisions) */
    readonly featureGlobs?: readonly string[];
    /** Step file glob patterns (default: tests/steps) */
    readonly stepGlobs?: readonly string[];
}
/**
 * Run all step lint checks and return a LintSummary.
 *
 * Executes three categories of checks:
 * 1. Feature-only checks on all .feature files
 * 2. Step-only checks on all .steps.ts files
 * 3. Cross-file checks on paired feature+step files
 */
export declare function runStepLint(options?: StepLintOptions): LintSummary;
//# sourceMappingURL=runner.d.ts.map