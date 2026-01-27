#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern LintPatternsCLI
 * @libar-docs-status completed
 * @libar-docs-uses LintEngine, LintRules, PatternScanner
 *
 * ## LintPatternsCLI - Pattern Annotation Quality Checker
 *
 * Validates pattern annotations for quality and completeness.
 * Use in CI to enforce documentation standards.
 *
 * ### When to Use
 *
 * - Use in CI pipelines to enforce annotation quality
 * - Use locally to check annotations before committing
 * - Use with `--strict` flag to treat warnings as errors
 */
import { type LintSeverity } from '../lint/index.js';
/**
 * CLI configuration
 */
export interface LintCLIConfig {
    /** Glob patterns for input files */
    input: string[];
    /** Glob patterns to exclude */
    exclude: string[];
    /** Base directory for path resolution */
    baseDir: string;
    /** Treat warnings as errors */
    strict: boolean;
    /** Output format */
    format: 'pretty' | 'json';
    /** Only show errors (suppress warnings/info) */
    quiet: boolean;
    /** Minimum severity to report */
    minSeverity: LintSeverity;
    /** Path to tag registry JSON (auto-discovers if not specified) */
    tagRegistryPath: string | null;
    /** Show help */
    help: boolean;
    /** Show version */
    version: boolean;
}
/**
 * Parse command line arguments
 *
 * @param argv - Command line arguments (defaults to process.argv.slice(2))
 * @returns Parsed CLI configuration
 * @throws Error if required flags are missing values
 */
export declare function parseArgs(argv?: string[]): LintCLIConfig;
/**
 * Print usage information
 */
export declare function printHelp(): void;
//# sourceMappingURL=lint-patterns.d.ts.map