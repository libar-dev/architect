/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ReportingCodecs
 * @libar-docs-status completed
 *
 * ## Reporting Document Codecs
 *
 * Transforms MasterDataset into RenderableDocuments for reporting outputs:
 * - CHANGELOG-GENERATED.md (Keep a Changelog format)
 * - TRACEABILITY.md (Timeline to behavior file coverage)
 * - OVERVIEW.md (Project architecture overview)
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, list, collapsible, document, } from '../schema.js';
import { getDisplayName, extractSummary, completionPercentage, renderProgressBar, } from '../utils.js';
import { groupBy } from '../../utils/index.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
/**
 * Default options for ChangelogCodec
 */
export const DEFAULT_CHANGELOG_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeUnreleased: true,
    includeLinks: true,
    categoryMapping: {},
};
/**
 * Default options for TraceabilityCodec
 */
export const DEFAULT_TRACEABILITY_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeGaps: true,
    includeStats: true,
    includeCovered: true,
};
/**
 * Default options for OverviewCodec
 */
export const DEFAULT_OVERVIEW_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeArchitecture: true,
    includePatternsSummary: true,
    includeTimelineSummary: true,
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';
// ═══════════════════════════════════════════════════════════════════════════
// Changelog Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a ChangelogCodec with custom options.
 */
export function createChangelogCodec(options) {
    const opts = mergeOptions(DEFAULT_CHANGELOG_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildChangelogDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('ChangelogCodec is decode-only. See zod-codecs.md');
        },
    });
}
export const ChangelogCodec = createChangelogCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Traceability Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a TraceabilityCodec with custom options.
 */
export function createTraceabilityCodec(options) {
    const opts = mergeOptions(DEFAULT_TRACEABILITY_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildTraceabilityDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('TraceabilityCodec is decode-only. See zod-codecs.md');
        },
    });
}
export const TraceabilityCodec = createTraceabilityCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Overview Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create an OverviewCodec with custom options.
 */
export function createOverviewCodec(options) {
    const opts = mergeOptions(DEFAULT_OVERVIEW_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildOverviewDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('OverviewCodec is decode-only. See zod-codecs.md');
        },
    });
}
export const OverviewCodec = createOverviewCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Changelog Builder
// ═══════════════════════════════════════════════════════════════════════════
function buildChangelogDocument(dataset, options) {
    const sections = [];
    // Header following Keep a Changelog format
    sections.push(paragraph('All notable changes to this project will be documented in this file.'), paragraph('The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).'), separator());
    // Unreleased section (active patterns + vNEXT tagged patterns)
    if (options.includeUnreleased) {
        const unreleased = [
            ...dataset.byStatus.active,
            ...dataset.patterns.filter((p) => p.release === 'vNEXT'),
        ];
        // Deduplicate by name
        const seen = new Set();
        const uniqueUnreleased = unreleased.filter((p) => {
            if (seen.has(p.name))
                return false;
            seen.add(p.name);
            return true;
        });
        if (uniqueUnreleased.length > 0) {
            sections.push(heading(2, '[Unreleased]'));
            sections.push(...buildChangelogSection(uniqueUnreleased, options));
        }
    }
    // Group completed by release version (primary) or fall back to quarter
    const completedWithRelease = dataset.byStatus.completed.filter((p) => p.release !== undefined && p.release !== '' && p.release !== 'vNEXT');
    const byRelease = groupBy(completedWithRelease, (p) => p.release ?? 'Unknown');
    // Sort releases in reverse semver order (most recent first)
    const sortedReleases = [...byRelease.keys()].sort((a, b) => {
        // Simple semver-like comparison (v0.2.0 > v0.1.0)
        return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
    });
    for (const release of sortedReleases) {
        const patterns = byRelease.get(release) ?? [];
        sections.push(heading(2, `[${release}]`));
        sections.push(...buildChangelogSection(patterns, options));
    }
    // Patterns without release tag - group by quarter as fallback
    const noRelease = dataset.byStatus.completed.filter((p) => !p.release);
    if (noRelease.length > 0) {
        const byQuarter = groupBy(noRelease.filter((p) => p.quarter), (p) => p.quarter ?? 'Unknown');
        const sortedQuarters = [...byQuarter.keys()].sort().reverse();
        for (const quarter of sortedQuarters) {
            const patterns = byQuarter.get(quarter) ?? [];
            sections.push(heading(2, `[${quarter}]`));
            sections.push(...buildChangelogSection(patterns, options));
        }
        // Patterns without quarter or release
        const noQuarter = noRelease.filter((p) => !p.quarter);
        if (noQuarter.length > 0) {
            sections.push(heading(2, '[Earlier]'));
            sections.push(...buildChangelogSection(noQuarter, options));
        }
    }
    return document('Changelog', sections, {
        purpose: 'Project changelog in Keep a Changelog format',
    });
}
function buildChangelogSection(patterns, options) {
    const sections = [];
    // Group by change type (Added, Changed, Fixed, etc.)
    const byType = new Map();
    for (const pattern of patterns) {
        // Determine change type from category or default to "Added"
        let changeType = 'Added';
        // Use pattern.category (the primary category) for classification
        const category = String(pattern.category).toLowerCase();
        if (options.categoryMapping[category]) {
            changeType = options.categoryMapping[category];
        }
        else if (category.includes('fix') || category.includes('bug')) {
            changeType = 'Fixed';
        }
        else if (category.includes('change') ||
            category.includes('update') ||
            category.includes('refactor')) {
            changeType = 'Changed';
        }
        else if (category.includes('remove') || category.includes('deprecate')) {
            changeType = 'Removed';
        }
        else if (category.includes('security')) {
            changeType = 'Security';
        }
        if (!byType.has(changeType)) {
            byType.set(changeType, []);
        }
        byType.get(changeType)?.push(pattern);
    }
    // Standard order for changelog sections
    const typeOrder = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
    for (const type of typeOrder) {
        const typePatterns = byType.get(type);
        if (!typePatterns || typePatterns.length === 0)
            continue;
        sections.push(heading(3, type));
        const items = typePatterns.map((p) => {
            const name = getDisplayName(p);
            const summary = extractSummary(p.directive.description, p.patternName);
            return summary ? `**${name}**: ${summary}` : `**${name}**`;
        });
        sections.push(list(items));
    }
    // Any remaining types not in standard order
    for (const [type, typePatterns] of byType.entries()) {
        if (typeOrder.includes(type))
            continue;
        sections.push(heading(3, type));
        const items = typePatterns.map((p) => {
            const name = getDisplayName(p);
            return `**${name}**`;
        });
        sections.push(list(items));
    }
    sections.push(separator());
    return sections;
}
// ═══════════════════════════════════════════════════════════════════════════
// Traceability Builder
// ═══════════════════════════════════════════════════════════════════════════
function buildTraceabilityDocument(dataset, options) {
    const sections = [];
    // Get timeline patterns (from Gherkin with phase)
    const timelinePatterns = dataset.bySource.gherkin.filter((p) => p.phase !== undefined);
    if (timelinePatterns.length === 0) {
        sections.push(heading(2, 'No Timeline Patterns'), paragraph('*No Gherkin patterns with phase metadata found.*'));
        return document('Timeline → Behavior Traceability', sections, {
            purpose: 'Coverage report linking timeline phases to behavioral tests',
        });
    }
    // Check behavior file coverage
    const covered = [];
    const gaps = [];
    for (const pattern of timelinePatterns) {
        const hasBehaviorFile = pattern.behaviorFile !== undefined;
        const behaviorVerified = pattern.behaviorFileVerified === true;
        if (hasBehaviorFile || behaviorVerified) {
            covered.push(pattern);
        }
        else {
            gaps.push(pattern);
        }
    }
    // Statistics
    if (options.includeStats) {
        const coveragePercent = timelinePatterns.length > 0
            ? Math.round((covered.length / timelinePatterns.length) * 100)
            : 0;
        sections.push(heading(2, 'Coverage Statistics'), table(['Metric', 'Value'], [
            ['Timeline Phases', String(timelinePatterns.length)],
            ['With Behavior Tests', String(covered.length)],
            ['Missing Behavior Tests', String(gaps.length)],
            ['Coverage', `${coveragePercent}%`],
        ]), separator());
    }
    // Gaps (missing coverage)
    if (options.includeGaps && gaps.length > 0) {
        sections.push(heading(2, 'Coverage Gaps'));
        sections.push(paragraph(`${gaps.length} phases without behavior test coverage:`));
        const gapRows = gaps.map((p) => {
            const name = getDisplayName(p);
            const phase = p.phase !== undefined ? String(p.phase) : '-';
            return [name, phase, '❌ Missing'];
        });
        sections.push(table(['Pattern', 'Phase', 'Status'], gapRows));
        sections.push(separator());
    }
    // Covered phases
    if (options.includeCovered && covered.length > 0) {
        const coveredContent = [];
        const coveredRows = covered.map((p) => {
            const name = getDisplayName(p);
            const phase = p.phase !== undefined ? String(p.phase) : '-';
            const file = p.behaviorFile ?? '(inferred)';
            return [name, phase, `✅ ${file}`];
        });
        coveredContent.push(table(['Pattern', 'Phase', 'Behavior File'], coveredRows));
        sections.push(collapsible(`✅ Covered Phases (${covered.length})`, coveredContent));
    }
    return document('Timeline → Behavior Traceability', sections, {
        purpose: 'Coverage report linking timeline phases to behavioral tests',
    });
}
// ═══════════════════════════════════════════════════════════════════════════
// Overview Builder
// ═══════════════════════════════════════════════════════════════════════════
function buildOverviewDocument(dataset, options) {
    const sections = [];
    // Architecture overview from @libar-docs-overview patterns
    if (options.includeArchitecture) {
        const overviewPatterns = dataset.patterns.filter((p) => p.directive.tags.some((t) => t === 'overview' || t.includes('overview')));
        if (overviewPatterns.length > 0) {
            sections.push(heading(2, 'Architecture'));
            for (const pattern of overviewPatterns) {
                const name = getDisplayName(pattern);
                sections.push(heading(3, name));
                if (pattern.directive.description) {
                    sections.push(paragraph(pattern.directive.description));
                }
            }
            sections.push(separator());
        }
    }
    // Patterns summary
    if (options.includePatternsSummary) {
        const { counts } = dataset;
        const progress = completionPercentage(counts);
        const progressBar = renderProgressBar(counts.completed, counts.total, 20);
        sections.push(heading(2, 'Patterns Summary'), paragraph(`**Progress:** ${progressBar} (${progress}%)`), table(['Category', 'Count'], [...Object.entries(dataset.byCategory)].map(([cat, patterns]) => [
            cat,
            String(patterns.length),
        ])), separator());
    }
    // Timeline summary
    if (options.includeTimelineSummary) {
        const completedPhases = dataset.byPhase.filter((p) => p.counts.total > 0 && p.counts.completed === p.counts.total).length;
        sections.push(heading(2, 'Timeline Summary'), table(['Metric', 'Value'], [
            ['Total Phases', String(dataset.phaseCount)],
            ['Completed Phases', String(completedPhases)],
            ['Active Phases', String(dataset.byPhase.filter((p) => p.counts.active > 0).length)],
            ['Patterns', String(dataset.counts.total)],
        ]), separator());
    }
    return document('Architecture Overview', sections, {
        purpose: 'Project architecture and status overview',
    });
}
//# sourceMappingURL=reporting.js.map