/**
 * Shared utilities for the vitest-cucumber step linter.
 */
/**
 * Strip content inside quoted strings (single and double quotes) from text.
 *
 * Returns the text with quoted content replaced by empty quote pairs.
 * This allows lint checks to detect problematic characters (like $ or #)
 * only when they appear OUTSIDE of quoted string values in step text.
 *
 * Example: `parse JSON '{"$schema": "..."}' now` → `parse JSON '' now`
 */
export declare function stripQuotedContent(text: string): string;
/**
 * Count the net brace balance on a line: +1 for {, -1 for }.
 * Ignores braces inside string literals (single/double/backtick quotes).
 *
 * Used by both step-checks and cross-checks to track scenario block
 * boundaries via brace depth counting.
 */
export declare function countBraceBalance(line: string): number;
//# sourceMappingURL=utils.d.ts.map