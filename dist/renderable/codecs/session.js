/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SessionCodec
 * @libar-docs-status completed
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 *
 * ## Session Document Codec
 *
 * Transforms MasterDataset into RenderableDocuments for session/planning outputs:
 * - SESSION-CONTEXT.md (current session context)
 * - REMAINING-WORK.md (incomplete work aggregation)
 *
 * ### When to Use
 *
 * - When generating session context for Claude Code integration
 * - When tracking remaining work and incomplete deliverables
 * - When building session handoff documentation
 *
 * ### Factory Pattern
 *
 * Use factory functions for custom options:
 * ```typescript
 * const codec = createSessionContextCodec({ includeRelatedPatterns: true });
 * const remainingCodec = createRemainingWorkCodec({ sortBy: "priority" });
 * ```
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, list, collapsible, linkOut, document, } from '../schema.js';
import { normalizeStatus } from '../../taxonomy/index.js';
import { getStatusEmoji, getDisplayName, extractSummary, completionPercentage, renderProgressBar, sortByPhaseAndName, formatBusinessValue, } from '../utils.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
/**
 * Default options for SessionContextCodec
 */
export const DEFAULT_SESSION_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeAcceptanceCriteria: true,
    includeDependencies: true,
    includeDeliverables: true,
    includeRelatedPatterns: false,
    includeHandoffContext: true,
};
/**
 * Default options for RemainingWorkCodec
 */
export const DEFAULT_REMAINING_WORK_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    includeIncomplete: true,
    includeBlocked: true,
    includeNextActionable: true,
    maxNextActionable: 5,
    includeStats: true,
    sortBy: 'phase',
    groupPlannedBy: 'none',
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { renderAcceptanceCriteria, renderBusinessRulesSection } from './helpers.js';
import { toKebabCase } from '../../utils/index.js';
// ═══════════════════════════════════════════════════════════════════════════
// Session Context Document Codec
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Create a SessionContextCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Include related patterns
 * const codec = createSessionContextCodec({ includeRelatedPatterns: true });
 *
 * // Disable detail files for compact output
 * const codec = createSessionContextCodec({ generateDetailFiles: false });
 * ```
 */
export function createSessionContextCodec(options) {
    const opts = mergeOptions(DEFAULT_SESSION_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildSessionContextDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('SessionContextCodec is decode-only. See zod-codecs.md');
        },
    });
}
/**
 * Default Session Context Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for session context.
 * Shows current phase focus, active work, and planning context.
 */
export const SessionContextCodec = createSessionContextCodec();
/**
 * Create a RemainingWorkCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Sort by priority instead of phase
 * const codec = createRemainingWorkCodec({ sortBy: "priority" });
 *
 * // Group planned items by quarter
 * const codec = createRemainingWorkCodec({ groupPlannedBy: "quarter" });
 * ```
 */
export function createRemainingWorkCodec(options) {
    const opts = mergeOptions(DEFAULT_REMAINING_WORK_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            return buildRemainingWorkDocument(dataset, opts);
        },
        /** @throws Always - this codec is decode-only. See zod-codecs.md */
        encode: () => {
            throw new Error('RemainingWorkCodec is decode-only. See zod-codecs.md');
        },
    });
}
/**
 * Default Remaining Work Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for remaining work.
 * Aggregates all incomplete work across phases.
 */
export const RemainingWorkCodec = createRemainingWorkCodec();
// ═══════════════════════════════════════════════════════════════════════════
// Session Context Document Builder
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build session context document
 */
function buildSessionContextDocument(dataset, options) {
    const sections = [];
    // 1. Overall status
    sections.push(...buildSessionStatus(dataset));
    // 2. Phase navigation table (links to detail files)
    sections.push(...buildSessionPhaseNavigation(dataset, options));
    // 3. Active work (current focus)
    sections.push(...buildActiveWork(dataset, options));
    // 4. Current phase context (summary only)
    sections.push(...buildCurrentPhaseContextSummary(dataset, options));
    // 5. Blocked items (if any - controlled by includeDependencies)
    if (options.includeDependencies) {
        sections.push(...buildBlockedItems(dataset));
    }
    // 6. Recent completions
    sections.push(...buildSessionRecentCompletions(dataset, options));
    // Build phase detail files (if enabled)
    const additionalFiles = options.generateDetailFiles
        ? buildSessionPhaseFiles(dataset, options)
        : {};
    const docOpts = {
        purpose: 'Current session context and focus areas',
        detailLevel: options.generateDetailFiles
            ? 'Summary with links to phase details'
            : 'Compact summary',
    };
    if (Object.keys(additionalFiles).length > 0) {
        docOpts.additionalFiles = additionalFiles;
    }
    return document('Session Context', sections, docOpts);
}
/**
 * Build session status section
 */
function buildSessionStatus(dataset) {
    const { counts } = dataset;
    const progress = completionPercentage(counts);
    const progressBar = renderProgressBar(counts.completed, counts.total, 20);
    // Find current phase (first incomplete phase)
    const currentPhase = dataset.byPhase.find((p) => p.counts.total > 0 && p.counts.completed < p.counts.total);
    const currentPhaseInfo = currentPhase
        ? `Phase ${currentPhase.phaseNumber}: ${currentPhase.phaseName ?? 'Unnamed'}`
        : 'All phases complete';
    return [
        heading(2, 'Session Status'),
        paragraph(`**Overall Progress:** ${progressBar} (${progress}%)`),
        paragraph(`**Current Focus:** ${currentPhaseInfo}`),
        table(['Metric', 'Value'], [
            ['Active Patterns', String(counts.active)],
            ['Completed', String(counts.completed)],
            ['Remaining', String(counts.planned + counts.active)],
        ]),
        separator(),
    ];
}
/**
 * Build active work section
 */
function buildActiveWork(dataset, _options) {
    const sections = [];
    const activePatterns = dataset.byStatus.active;
    if (activePatterns.length === 0) {
        sections.push(heading(2, 'Active Work'), paragraph('No patterns are currently active.'), separator());
        return sections;
    }
    sections.push(heading(2, 'Active Work'));
    sections.push(paragraph(`${activePatterns.length} patterns in progress:`));
    // Group by phase
    const byPhase = new Map();
    for (const p of activePatterns) {
        const phase = p.phase ?? 0;
        const existing = byPhase.get(phase) ?? [];
        existing.push(p);
        byPhase.set(phase, existing);
    }
    // Sort by phase
    const sortedPhases = [...byPhase.keys()].sort((a, b) => a - b);
    for (const phase of sortedPhases) {
        const patterns = byPhase.get(phase) ?? [];
        const phaseLabel = phase === 0 ? 'Unphased' : `Phase ${phase}`;
        sections.push(heading(3, `🚧 ${phaseLabel}`));
        const rows = patterns.map((p) => {
            const name = getDisplayName(p);
            const summary = extractSummary(p.directive.description, p.patternName);
            const effort = p.effort ?? '-';
            return [name, summary || '-', effort];
        });
        sections.push(table(['Pattern', 'Description', 'Effort'], rows));
    }
    sections.push(separator());
    return sections;
}
/**
 * Build current phase context summary (links to detail file)
 */
function buildCurrentPhaseContextSummary(dataset, options) {
    const sections = [];
    // Find current phase (first incomplete)
    const currentPhase = dataset.byPhase.find((p) => p.counts.total > 0 && p.counts.completed < p.counts.total);
    if (!currentPhase) {
        return [];
    }
    const { phaseNumber, phaseName, counts } = currentPhase;
    const displayName = phaseName ?? `Phase ${phaseNumber}`;
    const progress = completionPercentage(counts);
    const progressBar = renderProgressBar(counts.completed, counts.total, 15);
    const slug = getSessionPhaseSlug(phaseNumber, phaseName);
    sections.push(heading(2, 'Current Phase Focus'));
    sections.push(paragraph(`**${displayName}:** ${progressBar} ${progress}% complete`), paragraph(`${counts.active} active, ${counts.planned} planned, ${counts.completed} completed`));
    // Only show link if generating detail files
    if (options.generateDetailFiles) {
        sections.push(linkOut(`View ${displayName} details →`, `sessions/${slug}.md`));
    }
    sections.push(separator());
    return sections;
}
/**
 * Build recent completions section
 */
function buildSessionRecentCompletions(dataset, options) {
    const sections = [];
    const completed = dataset.byStatus.completed;
    if (completed.length === 0) {
        return [];
    }
    // Show most recent completions (use limits from options with safe default)
    const recentLimit = options.limits.recentItems ?? 10;
    const recent = completed.slice(-recentLimit).reverse();
    const completedContent = [];
    const items = recent.map((p) => {
        const name = getDisplayName(p);
        const phase = p.phase !== undefined ? ` (Phase ${p.phase})` : '';
        return `✅ ${name}${phase}`;
    });
    completedContent.push(list(items));
    if (completed.length > recentLimit) {
        completedContent.push(paragraph(`...and ${completed.length - recentLimit} more.`));
    }
    sections.push(collapsible(`Recent Completions (${completed.length} total)`, completedContent));
    return sections;
}
/**
 * Build blocked items section
 */
function buildBlockedItems(dataset) {
    const sections = [];
    // Find patterns that are blocked (have unmet dependencies)
    const blocked = [];
    for (const pattern of dataset.patterns) {
        if (!pattern.dependsOn || pattern.dependsOn.length === 0)
            continue;
        if (normalizeStatus(pattern.status) === 'completed')
            continue;
        // Check if any dependency is not completed
        const hasUnmetDep = pattern.dependsOn.some((depName) => {
            const dep = dataset.patterns.find((p) => p.patternName === depName || p.name === depName);
            return dep !== undefined && normalizeStatus(dep.status) !== 'completed';
        });
        if (hasUnmetDep) {
            blocked.push(pattern);
        }
    }
    if (blocked.length === 0) {
        return [];
    }
    sections.push(heading(2, '⚠️ Blocked Items'));
    sections.push(paragraph(`${blocked.length} patterns are blocked by incomplete dependencies:`));
    const rows = blocked.map((p) => {
        const name = getDisplayName(p);
        const deps = (p.dependsOn ?? []).join(', ');
        return [name, deps];
    });
    sections.push(table(['Pattern', 'Blocked By'], rows));
    sections.push(separator());
    return sections;
}
// ═══════════════════════════════════════════════════════════════════════════
// Session Context Progressive Disclosure
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Generate slug for session phase detail file
 */
function getSessionPhaseSlug(phaseNumber, phaseName) {
    const paddedPhase = String(phaseNumber).padStart(2, '0');
    const namePart = phaseName ? toKebabCase(phaseName) : 'unnamed';
    return `phase-${paddedPhase}-${namePart}`;
}
/**
 * Build session phase navigation table
 */
function buildSessionPhaseNavigation(dataset, options) {
    const sections = [];
    // Get incomplete phases (the ones relevant for session context)
    const incompletePhases = dataset.byPhase.filter((p) => p.counts.total > 0 && p.counts.completed < p.counts.total);
    if (incompletePhases.length === 0) {
        return [];
    }
    sections.push(heading(2, 'Phase Navigation'));
    const rows = incompletePhases
        .sort((a, b) => a.phaseNumber - b.phaseNumber)
        .map((phase) => {
        const { phaseNumber, phaseName, counts } = phase;
        const displayName = phaseName ?? `Phase ${phaseNumber}`;
        const progress = completionPercentage(counts);
        const remaining = counts.total - counts.completed;
        const slug = getSessionPhaseSlug(phaseNumber, phaseName);
        const statusEmoji = counts.active > 0 ? '🚧' : '📋';
        // Link to detail file only if generating detail files
        const nameCell = options.generateDetailFiles
            ? `${statusEmoji} [${displayName}](sessions/${slug}.md)`
            : `${statusEmoji} ${displayName}`;
        return [nameCell, `${remaining} remaining`, `${progress}%`];
    });
    sections.push(table(['Phase', 'Remaining', 'Complete'], rows), separator());
    return sections;
}
/**
 * Build session phase detail files (progressive disclosure)
 */
function buildSessionPhaseFiles(dataset, options) {
    const files = {};
    // Get incomplete phases
    const incompletePhases = dataset.byPhase.filter((p) => p.counts.total > 0 && p.counts.completed < p.counts.total);
    for (const phase of incompletePhases) {
        const slug = getSessionPhaseSlug(phase.phaseNumber, phase.phaseName);
        files[`sessions/${slug}.md`] = buildSessionPhaseDetailDocument(phase, dataset, options);
    }
    return files;
}
/**
 * Build a single session phase detail document
 */
function buildSessionPhaseDetailDocument(phase, dataset, options) {
    const sections = [];
    const { phaseNumber, phaseName, patterns, counts } = phase;
    const displayName = phaseName ?? `Phase ${phaseNumber}`;
    // Summary
    const progress = completionPercentage(counts);
    const progressBar = renderProgressBar(counts.completed, counts.total, 20);
    sections.push(heading(2, 'Summary'), paragraph(`**Progress:** ${progressBar} (${progress}%)`), table(['Status', 'Count'], [
        ['🚧 Active', String(counts.active)],
        ['📋 Planned', String(counts.planned)],
        ['✅ Completed', String(counts.completed)],
        ['**Total**', String(counts.total)],
    ]), separator());
    // Active patterns (priority)
    const active = patterns.filter((p) => normalizeStatus(p.status) === 'active');
    if (active.length > 0) {
        sections.push(heading(2, '🚧 Active Work'));
        sections.push(...buildSessionPatternList(active, true));
    }
    // Planned patterns
    const planned = patterns.filter((p) => normalizeStatus(p.status) === 'planned');
    if (planned.length > 0) {
        sections.push(heading(2, '📋 Planned Work'));
        // Separate blocked from ready (only if includeDependencies is enabled)
        if (options.includeDependencies) {
            const blocked = [];
            const ready = [];
            for (const pattern of planned) {
                if (!pattern.dependsOn || pattern.dependsOn.length === 0) {
                    ready.push(pattern);
                    continue;
                }
                const hasUnmetDep = pattern.dependsOn.some((depName) => {
                    const dep = dataset.patterns.find((p) => p.patternName === depName || p.name === depName);
                    return dep !== undefined && normalizeStatus(dep.status) !== 'completed';
                });
                if (hasUnmetDep) {
                    blocked.push(pattern);
                }
                else {
                    ready.push(pattern);
                }
            }
            if (ready.length > 0) {
                sections.push(heading(3, '✅ Ready to Start'));
                sections.push(...buildSessionPatternList(ready, false));
            }
            if (blocked.length > 0) {
                sections.push(heading(3, '⚠️ Blocked'));
                sections.push(...buildBlockedPatternList(blocked));
            }
        }
        else {
            // Without dependency checking, show all planned items together
            sections.push(...buildSessionPatternList(planned, false));
        }
    }
    // Completed patterns (collapsible)
    const completed = patterns.filter((p) => normalizeStatus(p.status) === 'completed');
    if (completed.length > 0) {
        const completedContent = [];
        const items = completed.map((p) => `✅ ${getDisplayName(p)}`);
        completedContent.push(list(items));
        sections.push(collapsible(`Completed in this phase (${completed.length})`, completedContent));
    }
    // Back link
    sections.push(linkOut('← Back to Session Context', '../SESSION-CONTEXT.md'));
    return document(`${displayName} - Session Focus`, sections, {
        purpose: `Detailed session context for ${displayName}`,
    });
}
/**
 * Build session pattern list with details
 */
function buildSessionPatternList(patterns, showEffort) {
    const sections = [];
    for (const pattern of sortByPhaseAndName([...patterns])) {
        const emoji = getStatusEmoji(pattern.status);
        const name = getDisplayName(pattern);
        sections.push(heading(3, `${emoji} ${name}`));
        // Metadata table
        const metaRows = [['Status', normalizeStatus(pattern.status)]];
        if (showEffort && pattern.effort) {
            metaRows.push(['Effort', pattern.effort]);
        }
        const businessValue = formatBusinessValue(pattern.businessValue);
        if (businessValue) {
            metaRows.push(['Business Value', businessValue]);
        }
        sections.push(table(['Property', 'Value'], metaRows));
        // Description
        if (pattern.directive.description) {
            sections.push(paragraph(pattern.directive.description));
        }
        // Use cases
        if (pattern.useCases && pattern.useCases.length > 0) {
            sections.push(heading(4, 'Use Cases'), list([...pattern.useCases]));
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
 * Build blocked pattern list with dependencies
 */
function buildBlockedPatternList(patterns) {
    const rows = sortByPhaseAndName([...patterns]).map((p) => {
        const name = getDisplayName(p);
        const deps = (p.dependsOn ?? []).join(', ');
        const effort = p.effort ?? '-';
        return [name, deps, effort];
    });
    return [table(['Pattern', 'Blocked By', 'Effort'], rows), separator()];
}
// ═══════════════════════════════════════════════════════════════════════════
// Remaining Work Document Builder
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build remaining work document
 */
function buildRemainingWorkDocument(dataset, options) {
    const sections = [];
    // Get all incomplete patterns based on options
    let incomplete = [];
    if (options.includeIncomplete) {
        incomplete = [...dataset.byStatus.active, ...dataset.byStatus.planned];
    }
    else {
        incomplete = [...dataset.byStatus.active]; // Only active
    }
    if (incomplete.length === 0) {
        sections.push(heading(2, 'All Work Complete'), paragraph('All patterns have been completed. 🎉'));
        return document('Remaining Work', sections, {
            purpose: 'Track incomplete work',
        });
    }
    // 1. Summary (if enabled)
    if (options.includeStats) {
        sections.push(...buildRemainingWorkSummary(dataset, incomplete));
    }
    // 2. Phase navigation table (links to detail files)
    sections.push(...buildRemainingPhaseNavigation(dataset, options));
    // 3. By priority (blocked vs not blocked) - summary only (if blocked items enabled)
    if (options.includeBlocked) {
        sections.push(...buildRemainingByPrioritySummary(dataset, incomplete, options));
    }
    // 4. Next actionable items (if enabled)
    if (options.includeNextActionable) {
        sections.push(...buildNextActionableItems(dataset, incomplete, options));
    }
    // Build phase detail files (if enabled)
    const additionalFiles = options.generateDetailFiles
        ? buildRemainingPhaseFiles(dataset, options)
        : {};
    const docOpts = {
        purpose: 'Aggregate view of all incomplete work',
        detailLevel: options.generateDetailFiles
            ? 'Summary with links to phase details'
            : 'Compact summary',
    };
    if (Object.keys(additionalFiles).length > 0) {
        docOpts.additionalFiles = additionalFiles;
    }
    return document('Remaining Work', sections, docOpts);
}
/**
 * Build next actionable items section
 */
function buildNextActionableItems(dataset, incomplete, options) {
    const sections = [];
    // Find patterns that are not blocked
    const actionable = incomplete.filter((pattern) => {
        if (normalizeStatus(pattern.status) !== 'planned') {
            return false; // Active items are already being worked on
        }
        if (!pattern.dependsOn || pattern.dependsOn.length === 0) {
            return true; // No dependencies = actionable
        }
        // Check if all dependencies are completed
        const allDepsComplete = pattern.dependsOn.every((depName) => {
            const dep = dataset.patterns.find((p) => p.patternName === depName || p.name === depName);
            return dep === undefined || normalizeStatus(dep.status) === 'completed';
        });
        return allDepsComplete;
    });
    if (actionable.length === 0) {
        return [];
    }
    sections.push(heading(2, 'Next Actionable Items'));
    sections.push(paragraph('Items ready to start (no blocking dependencies):'));
    const limit = options.maxNextActionable;
    const items = sortByPhaseAndName(actionable)
        .slice(0, limit)
        .map((p) => {
        const name = getDisplayName(p);
        const phase = p.phase !== undefined ? ` (Phase ${p.phase})` : '';
        const effort = p.effort ? ` - ${p.effort}` : '';
        return `📋 ${name}${phase}${effort}`;
    });
    sections.push(list(items));
    if (actionable.length > limit) {
        sections.push(paragraph(`Showing ${limit} of ${actionable.length} actionable items.`));
    }
    sections.push(separator());
    return sections;
}
/**
 * Build remaining work summary
 */
function buildRemainingWorkSummary(dataset, incomplete) {
    const active = incomplete.filter((p) => normalizeStatus(p.status) === 'active');
    const planned = incomplete.filter((p) => normalizeStatus(p.status) === 'planned');
    const progress = completionPercentage(dataset.counts);
    const progressBar = renderProgressBar(dataset.counts.completed, dataset.counts.total, 20);
    return [
        heading(2, 'Summary'),
        paragraph(`**Overall Progress:** ${progressBar} (${progress}%)`),
        table(['Status', 'Count'], [
            ['🚧 Active', String(active.length)],
            ['📋 Planned', String(planned.length)],
            ['**Total Remaining**', String(incomplete.length)],
        ]),
        separator(),
    ];
}
// ═══════════════════════════════════════════════════════════════════════════
// Remaining Work Progressive Disclosure
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Generate slug for remaining work phase detail file
 */
function getRemainingPhaseSlug(phaseNumber, phaseName) {
    const paddedPhase = String(phaseNumber).padStart(2, '0');
    const namePart = phaseName ? toKebabCase(phaseName) : 'unnamed';
    return `phase-${paddedPhase}-${namePart}`;
}
/**
 * Build remaining work phase navigation table
 */
function buildRemainingPhaseNavigation(dataset, options) {
    const sections = [];
    // Get incomplete phases
    const incompletePhases = dataset.byPhase.filter((p) => p.counts.total > 0 && p.counts.completed < p.counts.total);
    if (incompletePhases.length === 0) {
        return [];
    }
    sections.push(heading(2, 'By Phase'));
    const rows = incompletePhases
        .sort((a, b) => a.phaseNumber - b.phaseNumber)
        .map((phase) => {
        const { phaseNumber, phaseName, counts } = phase;
        const displayName = phaseName ?? `Phase ${phaseNumber}`;
        const remaining = counts.total - counts.completed;
        const progress = completionPercentage(counts);
        const slug = getRemainingPhaseSlug(phaseNumber, phaseName);
        const statusEmoji = counts.active > 0 ? '🚧' : '📋';
        // Link to detail file only if generating detail files
        const nameCell = options.generateDetailFiles
            ? `${statusEmoji} [${displayName}](remaining/${slug}.md)`
            : `${statusEmoji} ${displayName}`;
        return [nameCell, String(remaining), String(counts.active), `${progress}%`];
    });
    // Add backlog row for patterns without a phase assignment
    // Use pattern.id (always defined) instead of patternName (can be undefined)
    // to avoid incorrect filtering when undefined values are added to the Set
    const patternsWithPhase = new Set(dataset.byPhase.flatMap((p) => p.patterns.map((pat) => pat.id)));
    const incomplete = [...dataset.byStatus.active, ...dataset.byStatus.planned];
    const backlogPatterns = incomplete.filter((p) => !patternsWithPhase.has(p.id));
    if (backlogPatterns.length > 0) {
        const backlogActive = backlogPatterns.filter((p) => normalizeStatus(p.status) === 'active').length;
        const statusEmoji = backlogActive > 0 ? '🚧' : '📋';
        rows.push([
            `${statusEmoji} Backlog (No Phase)`,
            String(backlogPatterns.length),
            String(backlogActive),
            '0%',
        ]);
    }
    sections.push(table(['Phase', 'Remaining', 'Active', 'Complete'], rows), separator());
    return sections;
}
/**
 * Build remaining work by priority (summary only for index)
 */
function buildRemainingByPrioritySummary(dataset, incomplete, options) {
    const sections = [];
    // Categorize by priority
    const unblocked = [];
    const blocked = [];
    for (const pattern of incomplete) {
        if (!pattern.dependsOn || pattern.dependsOn.length === 0) {
            unblocked.push(pattern);
            continue;
        }
        const hasUnmetDep = pattern.dependsOn.some((depName) => {
            const dep = dataset.patterns.find((p) => p.patternName === depName || p.name === depName);
            return dep !== undefined && normalizeStatus(dep.status) !== 'completed';
        });
        if (hasUnmetDep) {
            blocked.push(pattern);
        }
        else {
            unblocked.push(pattern);
        }
    }
    sections.push(heading(2, 'By Priority'));
    // Summary table
    const readyCount = unblocked.filter((p) => normalizeStatus(p.status) === 'planned').length;
    const activeCount = incomplete.filter((p) => normalizeStatus(p.status) === 'active').length;
    sections.push(table(['Priority', 'Count'], [
        ['🚧 In Progress', String(activeCount)],
        ['✅ Ready to Start', String(readyCount)],
        ['⚠️ Blocked', String(blocked.length)],
    ]));
    // Show top ready to start (use limits from options with safe default)
    const limit = options.limits.recentItems ?? 10;
    const readyToStart = unblocked.filter((p) => normalizeStatus(p.status) === 'planned');
    if (readyToStart.length > 0) {
        sections.push(heading(3, 'Top Ready to Start'));
        const items = sortByPhaseAndName(readyToStart)
            .slice(0, limit)
            .map((p) => {
            const name = getDisplayName(p);
            const phase = p.phase !== undefined ? ` (Phase ${p.phase})` : '';
            return `${name}${phase}`;
        });
        sections.push(list(items));
        if (readyToStart.length > limit) {
            sections.push(paragraph(`See phase detail files for full list.`));
        }
    }
    sections.push(separator());
    return sections;
}
/**
 * Build remaining work phase detail files (progressive disclosure)
 */
function buildRemainingPhaseFiles(dataset, options) {
    const files = {};
    // Get incomplete phases
    const incompletePhases = dataset.byPhase.filter((p) => p.counts.total > 0 && p.counts.completed < p.counts.total);
    for (const phase of incompletePhases) {
        const slug = getRemainingPhaseSlug(phase.phaseNumber, phase.phaseName);
        files[`remaining/${slug}.md`] = buildRemainingPhaseDetailDocument(phase, dataset, options);
    }
    return files;
}
/**
 * Build a single remaining work phase detail document
 */
function buildRemainingPhaseDetailDocument(phase, dataset, _options) {
    const sections = [];
    const { phaseNumber, phaseName, patterns, counts } = phase;
    const displayName = phaseName ?? `Phase ${phaseNumber}`;
    // Summary
    const progress = completionPercentage(counts);
    const progressBar = renderProgressBar(counts.completed, counts.total, 20);
    const remaining = counts.total - counts.completed;
    sections.push(heading(2, 'Summary'), paragraph(`**Progress:** ${progressBar} (${progress}%)`), paragraph(`**Remaining:** ${remaining} patterns (${counts.active} active, ${counts.planned} planned)`), separator());
    // Get incomplete patterns
    const incompletePatterns = patterns.filter((p) => normalizeStatus(p.status) !== 'completed');
    // Categorize by priority
    const active = [];
    const ready = [];
    const blocked = [];
    for (const pattern of incompletePatterns) {
        if (normalizeStatus(pattern.status) === 'active') {
            active.push(pattern);
            continue;
        }
        if (!pattern.dependsOn || pattern.dependsOn.length === 0) {
            ready.push(pattern);
            continue;
        }
        const hasUnmetDep = pattern.dependsOn.some((depName) => {
            const dep = dataset.patterns.find((p) => p.patternName === depName || p.name === depName);
            return dep !== undefined && normalizeStatus(dep.status) !== 'completed';
        });
        if (hasUnmetDep) {
            blocked.push(pattern);
        }
        else {
            ready.push(pattern);
        }
    }
    // Active patterns
    if (active.length > 0) {
        sections.push(heading(2, '🚧 In Progress'));
        sections.push(...buildRemainingPatternTable(active));
    }
    // Ready to start
    if (ready.length > 0) {
        sections.push(heading(2, '✅ Ready to Start'));
        sections.push(paragraph('These patterns can be started immediately:'));
        sections.push(...buildRemainingPatternTable(ready));
    }
    // Blocked
    if (blocked.length > 0) {
        sections.push(heading(2, '⚠️ Blocked'));
        sections.push(paragraph('These patterns are waiting on dependencies:'));
        const rows = sortByPhaseAndName([...blocked]).map((p) => {
            const name = getDisplayName(p);
            const deps = (p.dependsOn ?? []).join(', ');
            const effort = p.effort ?? '-';
            return [name, deps, effort];
        });
        sections.push(table(['Pattern', 'Blocked By', 'Effort'], rows));
        sections.push(separator());
    }
    // All remaining patterns (detailed)
    sections.push(heading(2, 'All Remaining Patterns'));
    for (const pattern of sortByPhaseAndName([...incompletePatterns])) {
        const emoji = getStatusEmoji(pattern.status);
        const name = getDisplayName(pattern);
        sections.push(heading(3, `${emoji} ${name}`));
        // Metadata table
        const metaRows = [['Status', normalizeStatus(pattern.status)]];
        if (pattern.effort) {
            metaRows.push(['Effort', pattern.effort]);
        }
        const businessValue = formatBusinessValue(pattern.businessValue);
        if (businessValue) {
            metaRows.push(['Business Value', businessValue]);
        }
        if (pattern.dependsOn && pattern.dependsOn.length > 0) {
            metaRows.push(['Dependencies', pattern.dependsOn.join(', ')]);
        }
        sections.push(table(['Property', 'Value'], metaRows));
        // Description
        if (pattern.directive.description) {
            sections.push(paragraph(pattern.directive.description));
        }
        // Use cases
        if (pattern.useCases && pattern.useCases.length > 0) {
            sections.push(heading(4, 'Use Cases'), list([...pattern.useCases]));
        }
        // Acceptance Criteria (scenarios with steps, DataTables, DocStrings)
        sections.push(...renderAcceptanceCriteria(pattern.scenarios));
        // Business Rules (from Gherkin Rule: keyword)
        sections.push(...renderBusinessRulesSection(pattern.rules));
    }
    sections.push(separator());
    // Back link
    sections.push(linkOut('← Back to Remaining Work', '../REMAINING-WORK.md'));
    return document(`${displayName} - Remaining Work`, sections, {
        purpose: `Detailed remaining work for ${displayName}`,
    });
}
/**
 * Build remaining pattern table
 */
function buildRemainingPatternTable(patterns) {
    const rows = sortByPhaseAndName([...patterns]).map((p) => {
        const emoji = getStatusEmoji(p.status);
        const name = getDisplayName(p);
        const effort = p.effort ?? '-';
        const businessValue = formatBusinessValue(p.businessValue) || '-';
        return [`${emoji} ${name}`, effort, businessValue];
    });
    return [table(['Pattern', 'Effort', 'Business Value'], rows), separator()];
}
//# sourceMappingURL=session.js.map