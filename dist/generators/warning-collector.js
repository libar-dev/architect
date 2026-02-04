/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern WarningCollector
 * @libar-docs-status roadmap
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
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Format a warning location string
 */
export function formatWarningLocation(warning) {
    if (warning.line !== undefined) {
        return `${warning.source}:${warning.line}`;
    }
    return warning.source;
}
/**
 * ANSI color codes for console output
 */
const ANSI = {
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
};
// =============================================================================
// Implementation
// =============================================================================
/**
 * Create a new warning collector
 */
export function createWarningCollector() {
    const warnings = [];
    return {
        capture(warning) {
            warnings.push(warning);
        },
        getAll() {
            return warnings;
        },
        filterByCategory(category) {
            return warnings.filter((w) => w.category === category);
        },
        filterBySource(source) {
            return warnings.filter((w) => w.source === source);
        },
        groupBySource() {
            const groups = new Map();
            for (const warning of warnings) {
                const existing = groups.get(warning.source);
                if (existing) {
                    existing.push(warning);
                }
                else {
                    groups.set(warning.source, [warning]);
                }
            }
            return groups;
        },
        getSummary() {
            const summary = {
                validation: 0,
                extraction: 0,
                deduplication: 0,
                'file-access': 0,
                format: 0,
            };
            for (const warning of warnings) {
                summary[warning.category]++;
            }
            return summary;
        },
        formatForConsole() {
            if (warnings.length === 0) {
                return '';
            }
            return warnings
                .map((w) => {
                const location = formatWarningLocation(w);
                return `${ANSI.yellow}\u26a0 ${location} - ${w.message}${ANSI.reset}`;
            })
                .join('\n');
        },
        formatAsJson() {
            return JSON.stringify(warnings.map((w) => ({
                source: w.source,
                line: w.line,
                category: w.category,
                subcategory: w.subcategory,
                message: w.message,
            })), null, 2);
        },
        formatAsMarkdown() {
            if (warnings.length === 0) {
                return '';
            }
            const lines = ['## Warnings', ''];
            const groups = this.groupBySource();
            for (const [source, sourceWarnings] of groups) {
                lines.push(`### ${source}`, '');
                for (const w of sourceWarnings) {
                    const location = w.line !== undefined ? `:${w.line}` : '';
                    lines.push(`- ${w.message}${location}`);
                }
                lines.push('');
            }
            return lines.join('\n');
        },
        isEmpty() {
            return warnings.length === 0;
        },
        count() {
            return warnings.length;
        },
    };
}
/**
 * Utilities for creating ResultWithWarnings values
 */
export const ResultWithWarnings = {
    /**
     * Create a successful result with warnings
     */
    ok: (value, warnings = []) => ({
        ok: true,
        value,
        warnings,
    }),
    /**
     * Create an error result with warnings
     */
    err: (error, warnings = []) => ({
        ok: false,
        error,
        warnings,
    }),
    /**
     * Check if result is successful
     */
    isOk: (result) => result.ok,
    /**
     * Check if result is an error
     */
    isError: (result) => !result.ok,
};
//# sourceMappingURL=warning-collector.js.map