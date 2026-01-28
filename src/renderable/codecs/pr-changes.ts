/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern PrChangesCodec
 * @libar-docs-status completed
 *
 * ## PR Changes Document Codec
 *
 * Transforms MasterDataset into RenderableDocument for PR-scoped output.
 * Filters patterns by changed files and/or release version tags.
 *
 * ### When to Use
 *
 * - When generating PR summaries filtered by changed files
 * - When creating release-scoped documentation for PR reviews
 * - When building CI/CD outputs focused on PR scope
 *
 * ### Factory Pattern
 *
 * Use `createPrChangesCodec(options)` for custom options:
 * ```typescript
 * const codec = createPrChangesCodec({
 *   changedFiles: ['src/commands/order.ts'],
 *   releaseFilter: 'v1.0.0',
 * });
 * const doc = codec.decode(dataset);
 * ```
 *
 * ### Scope Filtering
 *
 * PR Changes codec filters patterns by:
 * 1. Changed files (matches against pattern.filePath)
 * 2. Release version (matches against deliverable.release tags)
 *
 * If both are specified, patterns must match at least one criterion.
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
} from '../../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  list,
  document,
} from '../schema.js';
import { normalizeStatus } from '../../taxonomy/index.js';
import {
  getStatusEmoji,
  getDisplayName,
  extractSummary,
  formatBusinessValue,
  sortByPhaseAndName,
} from '../utils.js';
import { type BaseCodecOptions, DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';

// ═══════════════════════════════════════════════════════════════════════════
// PR Changes Codec Options (co-located with codec)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for PrChangesCodec
 *
 * NOTE: changedFiles is required for PR scope filtering
 */
export interface PrChangesCodecOptions extends BaseCodecOptions {
  /** Files changed in this PR (required for PR scope) */
  changedFiles?: string[];

  /** Release version filter (e.g., "v1.0.0") */
  releaseFilter?: string;

  /** Include deliverables (default: true) */
  includeDeliverables?: boolean;

  /** Include review checklist (default: true) */
  includeReviewChecklist?: boolean;

  /** Include business value (default: true) */
  includeBusinessValue?: boolean;

  /** Include dependencies (default: true) */
  includeDependencies?: boolean;

  /** Sort by (default: "phase") */
  sortBy?: 'phase' | 'priority' | 'workflow';
}

/**
 * Default options for PrChangesCodec
 */
export const DEFAULT_PR_CHANGES_OPTIONS: Required<PrChangesCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  changedFiles: [],
  releaseFilter: '',
  includeDeliverables: true,
  includeReviewChecklist: true,
  includeBusinessValue: true,
  includeDependencies: true,
  sortBy: 'phase',
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { renderAcceptanceCriteria, renderBusinessRulesSection } from './helpers.js';

// ═══════════════════════════════════════════════════════════════════════════
// PR Changes Document Codec
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a PrChangesCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Filter by changed files in PR
 * const codec = createPrChangesCodec({
 *   changedFiles: ['src/commands/order.ts', 'src/events/order.ts'],
 * });
 *
 * // Filter by release version
 * const codec = createPrChangesCodec({ releaseFilter: 'v1.0.0' });
 *
 * // Combine both filters
 * const codec = createPrChangesCodec({
 *   changedFiles: ['src/commands/order.ts'],
 *   releaseFilter: 'v1.0.0',
 * });
 * ```
 */
export function createPrChangesCodec(
  options?: PrChangesCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_PR_CHANGES_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildPrChangesDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error('PrChangesCodec is decode-only. See zod-codecs.md');
    },
  });
}

/**
 * Default PR Changes Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for PR changes.
 * Without options, shows all patterns (no filtering).
 */
export const PrChangesCodec = createPrChangesCodec();

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build PR changes document
 */
function buildPrChangesDocument(
  dataset: MasterDataset,
  options: Required<PrChangesCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Filter patterns by PR scope
  const filteredPatterns = filterPatternsByPrScope(dataset.patterns, options);

  if (filteredPatterns.length === 0) {
    sections.push(heading(2, 'No Changes'), paragraph(buildNoChangesMessage(options)));

    return document('Pull Request Changes', sections, {
      purpose: 'Summary of changes in this PR for review',
    });
  }

  // 1. Summary
  sections.push(...buildPrSummary(filteredPatterns, options));

  // 2. Changes by phase (if sortBy is "phase")
  if (options.sortBy === 'phase') {
    sections.push(...buildChangesByPhase(filteredPatterns, options));
  } else if (options.sortBy === 'priority') {
    sections.push(...buildChangesByPriority(filteredPatterns, options));
  } else {
    // Default: flat list
    sections.push(...buildFlatChangesList(filteredPatterns, options));
  }

  // 3. Review checklist (if configured)
  if (options.includeReviewChecklist) {
    sections.push(...buildReviewChecklist(filteredPatterns));
  }

  // 4. Dependencies (if configured)
  if (options.includeDependencies) {
    sections.push(...buildPrDependencies(filteredPatterns));
  }

  return document('Pull Request Changes', sections, {
    purpose: 'Summary of changes in this PR for review',
    detailLevel: buildDetailLevelDescription(options),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Scope Filtering
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Filter patterns by PR scope criteria
 */
function filterPatternsByPrScope(
  patterns: ExtractedPattern[],
  options: Required<PrChangesCodecOptions>
): ExtractedPattern[] {
  const { changedFiles, releaseFilter } = options;
  const hasFileFilter = changedFiles.length > 0;
  const hasReleaseFilter = releaseFilter.length > 0;

  // No filters = return all active/completed patterns
  if (!hasFileFilter && !hasReleaseFilter) {
    return patterns.filter((p) => {
      const status = normalizeStatus(p.status);
      return status === 'active' || status === 'completed';
    });
  }

  return patterns.filter((pattern) => {
    // Check status first - only active or completed patterns
    const status = normalizeStatus(pattern.status);
    if (status !== 'active' && status !== 'completed') {
      return false;
    }

    // File match: pattern's source file is in changed files
    const matchesFile =
      hasFileFilter &&
      changedFiles.some((file) => {
        // Normalize paths for comparison
        const normalizedFile = file.replace(/\\/g, '/');
        const normalizedPattern = pattern.source.file.replace(/\\/g, '/');
        return (
          normalizedPattern.includes(normalizedFile) || normalizedFile.includes(normalizedPattern)
        );
      });

    // Release match: any deliverable has matching release tag
    const matchesRelease =
      hasReleaseFilter && (pattern.deliverables?.some((d) => d.release === releaseFilter) ?? false);

    // If both filters specified, match either (OR logic)
    if (hasFileFilter && hasReleaseFilter) {
      return matchesFile || matchesRelease;
    }

    // Single filter - match that one
    return hasFileFilter ? matchesFile : matchesRelease;
  });
}

/**
 * Build message for when no changes match filters
 */
function buildNoChangesMessage(options: Required<PrChangesCodecOptions>): string {
  const parts: string[] = [];

  if (options.changedFiles.length > 0) {
    parts.push(
      `files matching: ${options.changedFiles.slice(0, 3).join(', ')}${options.changedFiles.length > 3 ? '...' : ''}`
    );
  }

  if (options.releaseFilter) {
    parts.push(`release: ${options.releaseFilter}`);
  }

  if (parts.length === 0) {
    return 'No active or completed patterns found.';
  }

  return `No patterns found matching ${parts.join(' or ')}.`;
}

/**
 * Build detail level description
 */
function buildDetailLevelDescription(options: Required<PrChangesCodecOptions>): string {
  const parts: string[] = ['PR-scoped view'];

  if (options.changedFiles.length > 0) {
    parts.push(`${options.changedFiles.length} changed files`);
  }

  if (options.releaseFilter) {
    parts.push(`release ${options.releaseFilter}`);
  }

  return parts.join(', ');
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build PR summary section
 */
function buildPrSummary(
  patterns: ExtractedPattern[],
  options: Required<PrChangesCodecOptions>
): SectionBlock[] {
  const completed = patterns.filter((p) => normalizeStatus(p.status) === 'completed');
  const active = patterns.filter((p) => normalizeStatus(p.status) === 'active');

  const rows: string[][] = [
    ['Patterns in PR', String(patterns.length)],
    ['Completed', String(completed.length)],
    ['Active', String(active.length)],
  ];

  if (options.releaseFilter) {
    rows.push(['Release Tag', options.releaseFilter]);
  }

  if (options.changedFiles.length > 0) {
    rows.push(['Files Filter', `${options.changedFiles.length} files`]);
  }

  return [heading(2, 'Summary'), table(['Metric', 'Value'], rows), separator()];
}

/**
 * Build changes grouped by phase
 */
function buildChangesByPhase(
  patterns: ExtractedPattern[],
  options: Required<PrChangesCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Group by phase
  const byPhase = new Map<number, ExtractedPattern[]>();
  for (const pattern of patterns) {
    const phaseNum = pattern.phase ?? 0;
    if (!byPhase.has(phaseNum)) {
      byPhase.set(phaseNum, []);
    }
    byPhase.get(phaseNum)?.push(pattern);
  }

  if (byPhase.size === 0) {
    return [];
  }

  sections.push(heading(2, 'Changes by Phase'));

  const sortedPhases = [...byPhase.keys()].sort((a, b) => a - b);

  for (const phaseNum of sortedPhases) {
    const phasePatterns = byPhase.get(phaseNum) ?? [];
    sections.push(heading(3, `Phase ${phaseNum}`));
    sections.push(...buildPatternChangesList(phasePatterns, options));
  }

  return sections;
}

/**
 * Build changes grouped by priority
 */
function buildChangesByPriority(
  patterns: ExtractedPattern[],
  options: Required<PrChangesCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Group by priority
  const byPriority = new Map<string, ExtractedPattern[]>();
  for (const pattern of patterns) {
    const priority = pattern.priority ?? 'none';
    if (!byPriority.has(priority)) {
      byPriority.set(priority, []);
    }
    byPriority.get(priority)?.push(pattern);
  }

  if (byPriority.size === 0) {
    return [];
  }

  sections.push(heading(2, 'Changes by Priority'));

  // Sort priorities: high, medium, low, none
  const priorityOrder = ['high', 'medium', 'low', 'none'];
  const sortedPriorities = [...byPriority.keys()].sort(
    (a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b)
  );

  for (const priority of sortedPriorities) {
    const priorityPatterns = byPriority.get(priority) ?? [];
    const emoji = priority === 'high' ? '!' : priority === 'medium' ? '-' : '';
    sections.push(
      heading(3, `${emoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`)
    );
    sections.push(...buildPatternChangesList(priorityPatterns, options));
  }

  return sections;
}

/**
 * Build flat changes list (no grouping)
 */
function buildFlatChangesList(
  patterns: ExtractedPattern[],
  options: Required<PrChangesCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, 'Changes'));
  sections.push(...buildPatternChangesList(patterns, options));

  return sections;
}

/**
 * Build list of pattern changes
 */
function buildPatternChangesList(
  patterns: ExtractedPattern[],
  options: Required<PrChangesCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const sorted = sortByPhaseAndName([...patterns]);

  for (const pattern of sorted) {
    const emoji = getStatusEmoji(pattern.status);
    const name = getDisplayName(pattern);
    const status = normalizeStatus(pattern.status);

    sections.push(heading(4, `${emoji} ${name}`));

    // Metadata
    const metaRows: string[][] = [['Status', status]];

    if (pattern.phase !== undefined) {
      metaRows.push(['Phase', String(pattern.phase)]);
    }

    if (options.includeBusinessValue) {
      const businessValue = formatBusinessValue(pattern.businessValue);
      if (businessValue) {
        metaRows.push(['Business Value', businessValue]);
      }
    }

    sections.push(table(['Property', 'Value'], metaRows));

    // Description
    if (pattern.directive.description) {
      const summary = extractSummary(pattern.directive.description, pattern.patternName);
      if (summary) {
        sections.push(paragraph(summary));
      }
    }

    // Deliverables (if configured)
    if (options.includeDeliverables && pattern.deliverables && pattern.deliverables.length > 0) {
      // Filter deliverables by release if releaseFilter is set
      let deliverables = pattern.deliverables;
      if (options.releaseFilter) {
        deliverables = deliverables.filter((d) => d.release === options.releaseFilter);
      }

      if (deliverables.length > 0) {
        const deliverableItems = deliverables.map((d) => {
          const statusEmoji =
            d.status === 'complete' ? '✅' : d.status === 'in-progress' ? '🚧' : '📋';
          const release = d.release ? ` (${d.release})` : '';
          return `${statusEmoji} ${d.name}${release}`;
        });

        sections.push(paragraph('**Deliverables:**'), list(deliverableItems));
      }
    }

    // Acceptance Criteria (scenarios with steps, DataTables, DocStrings)
    sections.push(...renderAcceptanceCriteria(pattern.scenarios));

    // Business Rules (from Gherkin Rule: keyword)
    sections.push(...renderBusinessRulesSection(pattern.rules));
  }

  sections.push(separator());

  return sections;
}

/**
 * Build review checklist section
 */
function buildReviewChecklist(patterns: ExtractedPattern[]): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, 'Review Checklist'));

  // Generate checklist items based on patterns
  const checklistItems: string[] = [];

  // General items
  checklistItems.push('- [ ] Code follows project conventions');
  checklistItems.push('- [ ] Tests added/updated for changes');
  checklistItems.push('- [ ] Documentation updated if needed');

  // Pattern-specific items
  const hasCompletedPatterns = patterns.some((p) => normalizeStatus(p.status) === 'completed');
  if (hasCompletedPatterns) {
    checklistItems.push('- [ ] Completed patterns verified working');
  }

  const hasActivePatterns = patterns.some((p) => normalizeStatus(p.status) === 'active');
  if (hasActivePatterns) {
    checklistItems.push('- [ ] Active work is in a consistent state');
  }

  // Check for dependencies
  const hasDependencies = patterns.some((p) => p.dependsOn !== undefined && p.dependsOn.length > 0);
  if (hasDependencies) {
    checklistItems.push('- [ ] Dependencies are satisfied');
  }

  // Check for deliverables
  const hasDeliverables = patterns.some(
    (p) => p.deliverables !== undefined && p.deliverables.length > 0
  );
  if (hasDeliverables) {
    checklistItems.push('- [ ] Deliverables tracked in feature files');
  }

  sections.push(paragraph(checklistItems.join('\n')));
  sections.push(separator());

  return sections;
}

/**
 * Build dependencies section for PR
 */
function buildPrDependencies(patterns: ExtractedPattern[]): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Collect all dependencies
  const allDependsOn: string[] = [];
  const allEnables: string[] = [];

  for (const pattern of patterns) {
    if (pattern.dependsOn) {
      allDependsOn.push(...pattern.dependsOn);
    }
    if (pattern.enables) {
      allEnables.push(...pattern.enables);
    }
  }

  // Deduplicate
  const uniqueDependsOn = [...new Set(allDependsOn)];
  const uniqueEnables = [...new Set(allEnables)];

  if (uniqueDependsOn.length === 0 && uniqueEnables.length === 0) {
    return [];
  }

  sections.push(heading(2, 'Dependencies'));

  if (uniqueDependsOn.length > 0) {
    sections.push(heading(3, 'Depends On'), list(uniqueDependsOn.map((d) => `Requires: ${d}`)));
  }

  if (uniqueEnables.length > 0) {
    sections.push(heading(3, 'Enables'), list(uniqueEnables.map((e) => `Unlocks: ${e}`)));
  }

  sections.push(separator());

  return sections;
}
