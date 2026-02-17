#!/usr/bin/env node
/**
 * CLI for vitest-cucumber step/feature compatibility linting.
 *
 * Detects common vitest-cucumber traps statically — before tests run.
 * Catches mismatches between .feature files and .steps.ts files that
 * cause cryptic runtime failures.
 */
/**
 * CLI configuration
 */
export interface LintStepsCLIConfig {
    /** Treat warnings as errors */
    strict: boolean;
    /** Base directory for relative paths */
    baseDir: string;
    /** Output format */
    format: 'pretty' | 'json';
    /** Show help */
    help: boolean;
    /** Show version */
    version: boolean;
}
/**
 * Parse command line arguments
 */
export declare function parseArgs(argv?: string[]): LintStepsCLIConfig;
/**
 * Print usage information
 */
export declare function printHelp(): void;
//# sourceMappingURL=lint-steps.d.ts.map