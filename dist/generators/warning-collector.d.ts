/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern WarningCollector
 * @libar-docs-status completed
 * @libar-docs-phase 28
 *
 * ## Warning Collector - Unified Warning Handling
 *
 * Provides a unified system for capturing, categorizing, and reporting
 * non-fatal issues during document generation. Replaces scattered console.warn
 * calls with structured warning handling that integrates with the Result pattern.
 *
 * ### When to Use
 *
 * - When generating documentation from source mappings
 * - When extracting content from TypeScript or Gherkin files
 * - When deduplicating or assembling content sections
 *
 * ### Key Concepts
 *
 * - **Warning Categories**: validation, extraction, deduplication, file-access, format
 * - **Source Attribution**: Each warning includes source file and optional line number
 * - **Aggregation**: Warnings collected across pipeline stages, maintaining insertion order
 * - **Formatting**: Console, JSON, and markdown output formats
 */
/**
 * Warning category for grouping and filtering
 */
export type WarningCategory = 'validation' | 'extraction' | 'deduplication' | 'file-access' | 'format';
/**
 * A captured warning with source context
 */
export interface Warning {
    /** Source file path (e.g., "src/types.ts") */
    source: string;
    /** Optional line number within the source file */
    line?: number;
    /** Warning category for grouping */
    category: WarningCategory;
    /** Optional subcategory for finer-grained classification */
    subcategory?: string;
    /** Warning message describing the issue */
    message: string;
}
/**
 * Warning collector interface for capturing and querying warnings
 */
export interface WarningCollector {
    /**
     * Capture a warning
     */
    capture(warning: Warning): void;
    /**
     * Get all captured warnings in insertion order
     */
    getAll(): readonly Warning[];
    /**
     * Filter warnings by category
     */
    filterByCategory(category: WarningCategory): readonly Warning[];
    /**
     * Filter warnings by source file
     */
    filterBySource(source: string): readonly Warning[];
    /**
     * Group warnings by source file
     */
    groupBySource(): Map<string, readonly Warning[]>;
    /**
     * Get summary counts by category
     */
    getSummary(): Record<WarningCategory, number>;
    /**
     * Format warnings for console output (with colors)
     */
    formatForConsole(): string;
    /**
     * Format warnings as JSON (machine-readable)
     */
    formatAsJson(): string;
    /**
     * Format warnings as markdown (for documentation)
     */
    formatAsMarkdown(): string;
    /**
     * Check if collector has no warnings
     */
    isEmpty(): boolean;
    /**
     * Get total warning count
     */
    count(): number;
}
/**
 * Format a warning location string
 */
export declare function formatWarningLocation(warning: Warning): string;
/**
 * Create a new warning collector
 */
export declare function createWarningCollector(): WarningCollector;
/**
 * A Result that includes warnings alongside the success/error value.
 * Warnings are collected regardless of success or failure state.
 */
export type ResultWithWarnings<T, E = Error> = {
    ok: true;
    value: T;
    warnings: readonly Warning[];
} | {
    ok: false;
    error: E;
    warnings: readonly Warning[];
};
/**
 * Utilities for creating ResultWithWarnings values
 */
export declare const ResultWithWarnings: {
    /**
     * Create a successful result with warnings
     */
    ok: <T>(value: T, warnings?: readonly Warning[]) => ResultWithWarnings<T, never>;
    /**
     * Create an error result with warnings
     */
    err: <E>(error: E, warnings?: readonly Warning[]) => ResultWithWarnings<never, E>;
    /**
     * Check if result is successful
     */
    isOk: <T, E>(result: ResultWithWarnings<T, E>) => result is {
        ok: true;
        value: T;
        warnings: readonly Warning[];
    };
    /**
     * Check if result is an error
     */
    isError: <T, E>(result: ResultWithWarnings<T, E>) => result is {
        ok: false;
        error: E;
        warnings: readonly Warning[];
    };
};
//# sourceMappingURL=warning-collector.d.ts.map