/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern LintEngine
 * @libar-docs-status completed
 * @libar-docs-uses LintRules, CodecUtils
 * @libar-docs-used-by LintPatternsCLI
 *
 * ## LintEngine - Rule Execution Orchestrator
 *
 * Orchestrates lint rule execution against parsed directives.
 * Takes scanned @libar-docs-* directives and runs quality rules against them,
 * collecting violations and computing summary statistics for CI enforcement.
 *
 * ### When to Use
 *
 * - Use when validating annotation quality across multiple files
 * - Use when building CI pipelines for documentation standards
 * - Use for formatting lint results (pretty or JSON output)
 */
import type { DocDirective } from '../validation-schemas/doc-directive.js';
import { type LintContext, type LintRule, type LintViolation } from './rules.js';
import type { Result } from '../types/result.js';
/**
 * Lint results for a single file
 */
export interface LintResult {
    /** Source file path */
    readonly file: string;
    /** All violations found in this file */
    readonly violations: readonly LintViolation[];
}
/**
 * Summary statistics for a lint run
 */
export interface LintSummary {
    /** Results per file (only files with violations) */
    readonly results: readonly LintResult[];
    /** Total error count */
    readonly errorCount: number;
    /** Total warning count */
    readonly warningCount: number;
    /** Total info count */
    readonly infoCount: number;
    /** Total files scanned */
    readonly filesScanned: number;
    /** Total directives checked */
    readonly directivesChecked: number;
}
/**
 * Input format for directive with location info
 */
export interface DirectiveWithLocation {
    readonly directive: DocDirective;
    readonly line: number;
}
/**
 * Run lint rules against a single directive
 *
 * @param directive - Parsed directive to check
 * @param file - Source file path
 * @param line - Line number in source
 * @param rules - Rules to apply
 * @param context - Optional context for rules that need pattern registry
 * @returns Array of violations (empty if all rules pass)
 */
export declare function lintDirective(directive: DocDirective, file: string, line: number, rules: readonly LintRule[], context?: LintContext): LintViolation[];
/**
 * Run lint rules against multiple files with directives
 *
 * @param files - Map of file path to directives in that file
 * @param rules - Rules to apply
 * @param context - Optional context for rules that need pattern registry
 * @returns Summary with results and statistics
 */
export declare function lintFiles(files: Map<string, readonly DirectiveWithLocation[]>, rules: readonly LintRule[], context?: LintContext): LintSummary;
/**
 * Check if lint summary indicates failure based on mode
 *
 * @param summary - Lint summary to check
 * @param strict - Whether to treat warnings as errors
 * @returns True if there are failures (exit code should be 1)
 */
export declare function hasFailures(summary: LintSummary, strict: boolean): boolean;
/**
 * Sort violations by severity (errors first, then warnings, then info)
 */
export declare function sortViolationsBySeverity(violations: readonly LintViolation[]): LintViolation[];
/**
 * Format lint summary as pretty-printed text
 *
 * @param summary - Lint summary to format
 * @param options - Formatting options
 * @returns Formatted string for console output
 */
export declare function formatPretty(summary: LintSummary, options?: {
    quiet?: boolean;
}): string;
/**
 * Format lint summary as JSON
 *
 * Uses LintOutputCodec for type-safe serialization.
 * Returns Result type per project guidelines (no exceptions thrown).
 *
 * @param summary - Lint summary to format
 * @returns Result with JSON string on success, Error on serialization failure
 */
export declare function formatJson(summary: LintSummary): Result<string>;
//# sourceMappingURL=engine.d.ts.map