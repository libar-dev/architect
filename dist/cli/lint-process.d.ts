#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-lint
 * @libar-docs-pattern LintProcessCLI
 * @libar-docs-status active
 * @libar-docs-depends-on:ProcessGuardModule
 * @libar-docs-extract-shapes ProcessGuardCLIConfig
 *
 * ## LintProcessCLI - Process Guard Linter CLI
 *
 * Validates git changes against delivery process rules.
 * Enforces protection levels, status transitions, and session scope.
 *
 * ### When to Use
 *
 * - Pre-commit hook to validate staged changes
 * - CI/CD to validate all changes against main branch
 * - Development to check specific files
 */
import { type ValidationMode } from '../lint/process-guard/index.js';
/**
 * CLI configuration
 */
export interface ProcessGuardCLIConfig {
    /** Validation mode */
    mode: ValidationMode;
    /** Specific files to validate (when mode is 'files') */
    files: string[];
    /** Treat warnings as errors */
    strict: boolean;
    /** Ignore session scope rules */
    ignoreSession: boolean;
    /** Show derived process state (debugging) */
    showState: boolean;
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
export declare function parseArgs(argv?: string[]): ProcessGuardCLIConfig;
/**
 * Print usage information
 */
export declare function printHelp(): void;
//# sourceMappingURL=lint-process.d.ts.map