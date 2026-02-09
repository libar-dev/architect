/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern RenderableUtils
 * @libar-docs-status completed
 *
 * ## Renderable Utilities
 *
 * Utility functions for document codecs. These are pure functions that
 * transform pattern data into display-ready strings.
 *
 * ### When to Use
 *
 * - When formatting status values, names, or progress indicators
 * - When computing status counts or completion percentages
 * - When sorting patterns for display in documents
 *
 * Ported from the original helpers.ts with the essential functions
 * needed by document codecs.
 */
import type { ExtractedPattern, StatusCounts } from '../validation-schemas/index.js';
import type { LoadedWorkflow } from '../validation-schemas/workflow-config.js';
/**
 * Get status emoji
 *
 * @param status - Status string
 * @param workflow - Optional workflow for custom emojis
 * @returns Emoji string
 */
export declare function getStatusEmoji(status: string | undefined, workflow?: LoadedWorkflow): string;
/**
 * Get status display text (capitalized)
 */
export declare function getStatusText(status: string | undefined): string;
/**
 * Get human-readable display name for a pattern
 *
 * Priority: title > patternName (CamelCase converted) > name
 */
export declare function getDisplayName(pattern: ExtractedPattern): string;
/**
 * Format category name (capitalize words, handle acronyms)
 *
 * Handles common acronyms like DDD, CQRS, API by rendering them in uppercase.
 * Hyphenated names like "event-sourcing" become "Event Sourcing".
 */
export declare function formatCategoryName(category: string): string;
/**
 * Format business value (replace hyphens with spaces)
 */
export declare function formatBusinessValue(value: string | undefined): string;
/**
 * Strip leading markdown headers from text to avoid duplicate headings.
 *
 * When directive descriptions start with a markdown header (e.g., "## Topic"),
 * rendering under a "## Description" heading creates duplicate/nested headers.
 * This function removes leading headers and empty lines to get the actual content.
 *
 * @param text - Text that may start with markdown headers
 * @returns Text with leading headers and empty lines stripped
 *
 * @example
 * ```typescript
 * stripLeadingHeaders("## Topic\n\nActual content here")
 * // Returns: "Actual content here"
 *
 * stripLeadingHeaders("Content without header")
 * // Returns: "Content without header"
 * ```
 */
export declare function stripLeadingHeaders(text: string): string;
/**
 * Strip markdown formatting from text
 */
export declare function stripMarkdown(text: string): string;
/**
 * Extract summary for pattern (first complete sentence, truncated if needed)
 *
 * Combines multiple lines to find a complete sentence, respecting max length.
 * If no sentence ending is found within the limit, truncates at word boundary with "..."
 */
export declare function extractSummary(description: string, patternName?: string): string;
/**
 * Compute status counts from patterns
 */
export declare function computeStatusCounts(patterns: readonly ExtractedPattern[]): StatusCounts;
/**
 * Calculate completion percentage
 */
export declare function completionPercentage(counts: StatusCounts): number;
/**
 * Check if all items are completed
 */
export declare function isFullyCompleted(counts: StatusCounts): boolean;
/**
 * Render ASCII progress bar
 *
 * @param completed - Number completed
 * @param total - Total number
 * @param width - Bar width in characters
 * @returns Progress bar string like "[████░░░░] 4/8"
 */
export declare function renderProgressBar(completed: number, total: number, width?: number): string;
/**
 * Group patterns by category
 */
export declare function groupByCategory(patterns: readonly ExtractedPattern[]): Map<string, ExtractedPattern[]>;
/**
 * Group patterns by phase number
 */
export declare function groupByPhase(patterns: readonly ExtractedPattern[]): Map<number, ExtractedPattern[]>;
/**
 * Group patterns by quarter
 */
export declare function groupByQuarter(patterns: readonly ExtractedPattern[]): Map<string, ExtractedPattern[]>;
/**
 * Sort patterns by phase number then name
 *
 * @param patterns - Array of patterns to sort
 * @param inPlace - If true, sorts the array in place (mutates input).
 *                  If false (default), creates a copy before sorting.
 *                  Use inPlace=true when you've already created a copy.
 * @returns Sorted array (same reference if inPlace=true, new array otherwise)
 *
 * @example
 * ```typescript
 * // Safe default - doesn't modify input
 * const sorted = sortByPhaseAndName(patterns);
 *
 * // Performance optimization - when array is already a copy
 * const copy = [...patterns];
 * sortByPhaseAndName(copy, true); // Mutates copy
 * ```
 */
export declare function sortByPhaseAndName(patterns: ExtractedPattern[], inPlace?: boolean): ExtractedPattern[];
/**
 * Sort patterns by status (completed first) then name
 *
 * @param patterns - Array of patterns to sort
 * @param inPlace - If true, sorts the array in place (mutates input).
 *                  If false (default), creates a copy before sorting.
 *                  Use inPlace=true when you've already created a copy.
 * @returns Sorted array (same reference if inPlace=true, new array otherwise)
 */
export declare function sortByStatusAndName(patterns: ExtractedPattern[], inPlace?: boolean): ExtractedPattern[];
//# sourceMappingURL=utils.d.ts.map