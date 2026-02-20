/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern WarningCollector
 * @libar-docs-status completed
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
// Types
// =============================================================================

/**
 * Warning category for grouping and filtering
 */
export type WarningCategory =
  | 'validation'
  | 'extraction'
  | 'deduplication'
  | 'file-access'
  | 'format';

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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a warning location string
 */
export function formatWarningLocation(warning: Warning): string {
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
} as const;

// =============================================================================
// Implementation
// =============================================================================

/**
 * Create a new warning collector
 */
export function createWarningCollector(): WarningCollector {
  const warnings: Warning[] = [];

  return {
    capture(warning: Warning): void {
      warnings.push(warning);
    },

    getAll(): readonly Warning[] {
      // Return a copy to prevent external mutation of internal state
      return [...warnings];
    },

    filterByCategory(category: WarningCategory): readonly Warning[] {
      return warnings.filter((w) => w.category === category);
    },

    filterBySource(source: string): readonly Warning[] {
      return warnings.filter((w) => w.source === source);
    },

    groupBySource(): Map<string, readonly Warning[]> {
      const groups = new Map<string, Warning[]>();
      for (const warning of warnings) {
        const existing = groups.get(warning.source);
        if (existing) {
          existing.push(warning);
        } else {
          groups.set(warning.source, [warning]);
        }
      }
      return groups;
    },

    getSummary(): Record<WarningCategory, number> {
      const summary: Record<WarningCategory, number> = {
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

    formatForConsole(): string {
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

    formatAsJson(): string {
      return JSON.stringify(
        warnings.map((w) => ({
          source: w.source,
          line: w.line,
          category: w.category,
          subcategory: w.subcategory,
          message: w.message,
        })),
        null,
        2
      );
    },

    formatAsMarkdown(): string {
      if (warnings.length === 0) {
        return '';
      }

      const lines: string[] = ['## Warnings', ''];
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

    isEmpty(): boolean {
      return warnings.length === 0;
    },

    count(): number {
      return warnings.length;
    },
  };
}

// =============================================================================
// Result Integration Types
// =============================================================================

/**
 * A Result that includes warnings alongside the success/error value.
 * Warnings are collected regardless of success or failure state.
 */
export type ResultWithWarnings<T, E = Error> =
  | { ok: true; value: T; warnings: readonly Warning[] }
  | { ok: false; error: E; warnings: readonly Warning[] };

/**
 * Utilities for creating ResultWithWarnings values
 */
export const ResultWithWarnings = {
  /**
   * Create a successful result with warnings
   */
  ok: <T>(value: T, warnings: readonly Warning[] = []): ResultWithWarnings<T, never> => ({
    ok: true,
    value,
    warnings,
  }),

  /**
   * Create an error result with warnings
   */
  err: <E>(error: E, warnings: readonly Warning[] = []): ResultWithWarnings<never, E> => ({
    ok: false,
    error,
    warnings,
  }),

  /**
   * Check if result is successful
   */
  isOk: <T, E>(
    result: ResultWithWarnings<T, E>
  ): result is { ok: true; value: T; warnings: readonly Warning[] } => result.ok,

  /**
   * Check if result is an error
   */
  isError: <T, E>(
    result: ResultWithWarnings<T, E>
  ): result is { ok: false; error: E; warnings: readonly Warning[] } => !result.ok,
};
