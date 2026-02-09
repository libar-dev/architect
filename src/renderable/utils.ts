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
import { camelCaseToTitleCase, groupBy } from '../utils/index.js';
import {
  normalizeStatus as taxonomyNormalizeStatus,
  type NormalizedStatus as TaxonomyNormalizedStatus,
} from '../taxonomy/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Status Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default status emoji mapping (fallback when no workflow)
 * Per PDR-005: roadmap, active, completed, deferred
 */
const STATUS_EMOJI: Record<string, string> = {
  completed: '\u2705', // ✅
  active: '\ud83d\udea7', // 🚧
  roadmap: '\ud83d\udccb', // 📋
  planned: '\ud83d\udccb', // 📋 (normalized)
  deferred: '\u23f8\ufe0f', // ⏸️
};

/**
 * Get status emoji
 *
 * @param status - Status string
 * @param workflow - Optional workflow for custom emojis
 * @returns Emoji string
 */
export function getStatusEmoji(status: string | undefined, workflow?: LoadedWorkflow): string {
  if (!status) return '';

  if (workflow) {
    const statusDef = workflow.statusMap.get(status.toLowerCase());
    return statusDef?.emoji ?? '';
  }

  return STATUS_EMOJI[status.toLowerCase()] ?? '';
}

/**
 * Get status display text (capitalized)
 */
export function getStatusText(status: string | undefined): string {
  if (!status) return 'Planned';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// Display Name & Text Processing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get human-readable display name for a pattern
 *
 * Priority: title > patternName (CamelCase converted) > name
 */
export function getDisplayName(pattern: ExtractedPattern): string {
  if (pattern.title) return pattern.title;
  if (pattern.patternName) return camelCaseToTitleCase(pattern.patternName);
  return pattern.name;
}

/**
 * Common acronyms that should be rendered in uppercase
 */
const ACRONYMS = new Set(['ddd', 'cqrs', 'api', 'cms', 'es', 'occ', 'dcb', 'bc']);

/**
 * Format category name (capitalize words, handle acronyms)
 *
 * Handles common acronyms like DDD, CQRS, API by rendering them in uppercase.
 * Hyphenated names like "event-sourcing" become "Event Sourcing".
 */
export function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Format business value (replace hyphens with spaces)
 */
export function formatBusinessValue(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/-/g, ' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// Description Extraction
// ═══════════════════════════════════════════════════════════════════════════

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
export function stripLeadingHeaders(text: string): string {
  if (!text) return text;

  const lines = text.split('\n');
  let startIndex = 0;

  // Skip leading empty lines and markdown header lines (# to ######)
  while (startIndex < lines.length) {
    const line = lines[startIndex]?.trim() ?? '';
    if (!line) {
      // Skip empty lines
      startIndex++;
      continue;
    }
    // Check if line is a markdown header (starts with 1-6 # followed by space)
    if (/^#{1,6}\s/.test(line)) {
      startIndex++;
      continue;
    }
    // Found non-empty, non-header line - stop here
    break;
  }

  return lines.slice(startIndex).join('\n').trim();
}

/** Maximum length for summary text */
const SUMMARY_MAX_LENGTH = 120;
/** Truncation suffix */
const TRUNCATION_SUFFIX = '...';

/**
 * Strip markdown formatting from text
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s*/, '') // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/`([^`]+)`/g, '`$1`') // Keep inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
}

/**
 * Extract summary for pattern (first complete sentence, truncated if needed)
 *
 * Combines multiple lines to find a complete sentence, respecting max length.
 * If no sentence ending is found within the limit, truncates at word boundary with "..."
 */
export function extractSummary(description: string, patternName?: string): string {
  if (!description) return '';

  const lines = description.split('\n');
  const nonEmptyLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      nonEmptyLines.push(trimmed);
    }
  }

  if (nonEmptyLines.length === 0) return '';

  // Find starting index, skipping tautological first lines and section headers
  let startIndex = 0;
  const firstCleaned = stripMarkdown(nonEmptyLines[0] ?? '');

  // Skip tautological first line (just the pattern name)
  if (firstCleaned.toLowerCase().trim() === patternName?.toLowerCase().trim()) {
    startIndex = 1;
  }

  // Skip section header labels like "Problem:", "Solution:", "Context:"
  const startText = stripMarkdown(nonEmptyLines[startIndex] ?? '');
  if (/^[A-Za-z]+:$/.test(startText) && startIndex < nonEmptyLines.length - 1) {
    startIndex++;
  }

  // Combine lines until we find a sentence ending or exceed max length
  let summary = '';
  const sentenceEndPattern = /[.!?](?=\s+[A-Z]|\s*$)/;

  for (let i = startIndex; i < nonEmptyLines.length && summary.length < SUMMARY_MAX_LENGTH; i++) {
    const lineText = stripMarkdown(nonEmptyLines[i] ?? '');
    if (!lineText) continue;

    // Add space between combined lines
    if (summary.length > 0) {
      summary += ' ';
    }
    summary += lineText;

    // Check if we've found a complete sentence
    const sentenceMatch = sentenceEndPattern.exec(summary);
    if (sentenceMatch) {
      summary = summary.slice(0, sentenceMatch.index + 1);
      break;
    }
  }

  // Truncate if too long, preferring sentence boundaries
  if (summary.length > SUMMARY_MAX_LENGTH) {
    const withinLimit = summary.slice(0, SUMMARY_MAX_LENGTH);

    // Try to find the last complete sentence within the limit
    const lastSentenceMatch = /.*[.!?](?=\s|$)/.exec(withinLimit);
    if (lastSentenceMatch && lastSentenceMatch[0].length > 20) {
      // Found a sentence boundary with reasonable length
      summary = lastSentenceMatch[0];
    } else {
      // No sentence boundary found - truncate at word boundary
      const truncateAt = SUMMARY_MAX_LENGTH - TRUNCATION_SUFFIX.length;
      const lastSpace = withinLimit.lastIndexOf(' ', truncateAt);
      summary = withinLimit.slice(0, lastSpace > 0 ? lastSpace : truncateAt) + TRUNCATION_SUFFIX;
    }
  } else if (summary.length > 0 && !/[.!?]$/.test(summary)) {
    // Text is under limit but doesn't end with sentence punctuation - add ellipsis
    summary = summary + TRUNCATION_SUFFIX;
  }

  return summary.trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// Progress & Counts
// ═══════════════════════════════════════════════════════════════════════════

// Note: StatusCounts type is now imported from validation-schemas (canonical source)
// and re-exported above for backward compatibility

/**
 * Compute status counts from patterns
 */
export function computeStatusCounts(patterns: readonly ExtractedPattern[]): StatusCounts {
  const counts: StatusCounts = { completed: 0, active: 0, planned: 0, total: patterns.length };

  for (const p of patterns) {
    const status = taxonomyNormalizeStatus(p.status);
    counts[status]++;
  }

  return counts;
}

/**
 * Calculate completion percentage
 */
export function completionPercentage(counts: StatusCounts): number {
  if (counts.total === 0) return 0;
  return Math.round((counts.completed / counts.total) * 100);
}

/**
 * Check if all items are completed
 */
export function isFullyCompleted(counts: StatusCounts): boolean {
  return counts.total > 0 && counts.completed === counts.total;
}

/**
 * Render ASCII progress bar
 *
 * @param completed - Number completed
 * @param total - Total number
 * @param width - Bar width in characters
 * @returns Progress bar string like "[████░░░░] 4/8"
 */
export function renderProgressBar(completed: number, total: number, width = 10): string {
  if (total === 0) return `[${'░'.repeat(width)}] 0/0`;

  const percent = completed / total;
  const filled = Math.round(percent * width);
  const empty = width - filled;

  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${completed}/${total}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Pattern Grouping
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Group patterns by category
 */
export function groupByCategory(
  patterns: readonly ExtractedPattern[]
): Map<string, ExtractedPattern[]> {
  return groupBy(patterns, (p) => p.category);
}

/**
 * Group patterns by phase number
 */
export function groupByPhase(
  patterns: readonly ExtractedPattern[]
): Map<number, ExtractedPattern[]> {
  const withPhase = patterns.filter(
    (p): p is ExtractedPattern & { phase: number } => p.phase !== undefined
  );
  return groupBy(withPhase, (p) => p.phase);
}

/**
 * Group patterns by quarter
 */
export function groupByQuarter(
  patterns: readonly ExtractedPattern[]
): Map<string, ExtractedPattern[]> {
  const withQuarter = patterns.filter(
    (p): p is ExtractedPattern & { quarter: string } => p.quarter !== undefined
  );
  return groupBy(withQuarter, (p) => p.quarter);
}

// ═══════════════════════════════════════════════════════════════════════════
// Sorting
// ═══════════════════════════════════════════════════════════════════════════

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
export function sortByPhaseAndName(
  patterns: ExtractedPattern[],
  inPlace = false
): ExtractedPattern[] {
  const arr = inPlace ? patterns : [...patterns];
  return arr.sort((a, b) => {
    const phaseA = a.phase ?? Infinity;
    const phaseB = b.phase ?? Infinity;
    if (phaseA !== phaseB) return phaseA - phaseB;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort patterns by status (completed first) then name
 *
 * @param patterns - Array of patterns to sort
 * @param inPlace - If true, sorts the array in place (mutates input).
 *                  If false (default), creates a copy before sorting.
 *                  Use inPlace=true when you've already created a copy.
 * @returns Sorted array (same reference if inPlace=true, new array otherwise)
 */
export function sortByStatusAndName(
  patterns: ExtractedPattern[],
  inPlace = false
): ExtractedPattern[] {
  const statusOrder: Record<TaxonomyNormalizedStatus, number> = {
    completed: 0,
    active: 1,
    planned: 2,
  };

  const arr = inPlace ? patterns : [...patterns];
  return arr.sort((a, b) => {
    const statusA = statusOrder[taxonomyNormalizeStatus(a.status)];
    const statusB = statusOrder[taxonomyNormalizeStatus(b.status)];
    if (statusA !== statusB) return statusA - statusB;
    return a.name.localeCompare(b.name);
  });
}
