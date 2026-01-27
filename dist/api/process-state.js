/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ProcessStateAPI
 * @libar-docs-status active
 * @libar-docs-depends-on:MasterDataset
 * @libar-docs-depends-on:FSMValidator
 *
 * ## Process State API - Programmatic Query Interface
 *
 * TypeScript interface for querying delivery process state.
 * Designed for Claude Code integration and programmatic access.
 *
 * ### Key Features
 *
 * - **Status Queries**: Get patterns by status, counts, distributions
 * - **Phase Queries**: Get phase progress, active phases, patterns
 * - **FSM Queries**: Validate transitions, check protection levels
 * - **Pattern Queries**: Find patterns, get dependencies, deliverables
 * - **Timeline Queries**: Group by quarter, get current work, roadmap
 *
 * ### Usage
 *
 * ```typescript
 * import { createProcessStateAPI } from "@libar-dev/delivery-process";
 *
 * const api = createProcessStateAPI(masterDataset);
 *
 * // Get current work
 * const active = api.getCurrentWork();
 *
 * // Check transition
 * if (api.isValidTransition("roadmap", "active")) {
 *   console.log("Can start work");
 * }
 * ```
 */
import { validateTransition, getProtectionSummary, isValidTransition, getValidTransitionsFrom, } from '../validation/fsm/index.js';
// =============================================================================
// Process State API Implementation
// =============================================================================
/**
 * Create a ProcessStateAPI instance from a MasterDataset
 *
 * @param dataset - The MasterDataset to wrap
 * @returns ProcessStateAPI instance
 */
export function createProcessStateAPI(dataset) {
    // Helper to find patterns by exact FSM status
    function filterByExactStatus(status) {
        return dataset.patterns.filter((p) => p.status === status);
    }
    // Helper to convert MasterPhaseGroup to PhaseGroup
    function convertPhaseGroup(mpg) {
        return {
            phaseNumber: mpg.phaseNumber,
            phaseName: mpg.phaseName,
            patterns: mpg.patterns,
            counts: mpg.counts,
        };
    }
    // Build relationship index if not present
    const relationshipIndex = dataset.relationshipIndex ?? {};
    return {
        // ─────────────────────────────────────────────────────────────────────
        // Status Queries
        // ─────────────────────────────────────────────────────────────────────
        getPatternsByNormalizedStatus(status) {
            return dataset.byStatus[status];
        },
        getPatternsByStatus(status) {
            return filterByExactStatus(status);
        },
        getStatusCounts() {
            return { ...dataset.counts };
        },
        getStatusDistribution() {
            const total = dataset.counts.total === 0 ? 1 : dataset.counts.total;
            return {
                counts: { ...dataset.counts },
                percentages: {
                    completed: Math.round((dataset.counts.completed / total) * 100),
                    active: Math.round((dataset.counts.active / total) * 100),
                    planned: Math.round((dataset.counts.planned / total) * 100),
                },
            };
        },
        getCompletionPercentage() {
            const total = dataset.counts.total === 0 ? 1 : dataset.counts.total;
            return Math.round((dataset.counts.completed / total) * 100);
        },
        // ─────────────────────────────────────────────────────────────────────
        // Phase Queries
        // ─────────────────────────────────────────────────────────────────────
        getPatternsByPhase(phase) {
            const phaseGroup = dataset.byPhase.find((p) => p.phaseNumber === phase);
            return phaseGroup?.patterns ?? [];
        },
        getPhaseProgress(phase) {
            const phaseGroup = dataset.byPhase.find((p) => p.phaseNumber === phase);
            if (!phaseGroup)
                return undefined;
            const total = phaseGroup.counts.total === 0 ? 1 : phaseGroup.counts.total;
            return {
                phaseNumber: phaseGroup.phaseNumber,
                phaseName: phaseGroup.phaseName,
                completed: phaseGroup.counts.completed,
                active: phaseGroup.counts.active,
                planned: phaseGroup.counts.planned,
                total: phaseGroup.counts.total,
                completionPercentage: Math.round((phaseGroup.counts.completed / total) * 100),
            };
        },
        getActivePhases() {
            return dataset.byPhase.filter((p) => p.counts.active > 0).map(convertPhaseGroup);
        },
        getAllPhases() {
            return dataset.byPhase.map(convertPhaseGroup);
        },
        // ─────────────────────────────────────────────────────────────────────
        // FSM Queries
        // ─────────────────────────────────────────────────────────────────────
        isValidTransition(from, to) {
            return isValidTransition(from, to);
        },
        checkTransition(from, to) {
            const result = validateTransition(from, to);
            return {
                from: result.from,
                to: result.to,
                valid: result.valid,
                error: result.error,
                validAlternatives: result.validAlternatives,
            };
        },
        getValidTransitionsFrom(status) {
            return getValidTransitionsFrom(status);
        },
        getProtectionInfo(status) {
            const summary = getProtectionSummary(status);
            return {
                status,
                level: summary.level,
                description: summary.description,
                canAddDeliverables: summary.canAddDeliverables,
                requiresUnlock: summary.requiresUnlock,
            };
        },
        // ─────────────────────────────────────────────────────────────────────
        // Pattern Queries
        // ─────────────────────────────────────────────────────────────────────
        getPattern(name) {
            const lowerName = name.toLowerCase();
            return dataset.patterns.find((p) => p.name.toLowerCase() === lowerName);
        },
        getPatternDependencies(name) {
            const entry = relationshipIndex[name];
            if (!entry) {
                // Try to find by scanning patterns
                const pattern = this.getPattern(name);
                if (!pattern)
                    return undefined;
                return {
                    dependsOn: pattern.dependsOn ?? [],
                    enables: pattern.enables ?? [],
                    uses: pattern.uses ?? [],
                    usedBy: pattern.usedBy ?? [],
                };
            }
            return {
                dependsOn: entry.dependsOn,
                enables: entry.enables,
                uses: entry.uses,
                usedBy: entry.usedBy,
            };
        },
        getPatternRelationships(name) {
            const entry = relationshipIndex[name];
            if (!entry) {
                // Try to find by scanning patterns
                const pattern = this.getPattern(name);
                if (!pattern)
                    return undefined;
                return {
                    dependsOn: pattern.dependsOn ?? [],
                    enables: pattern.enables ?? [],
                    uses: pattern.uses ?? [],
                    usedBy: pattern.usedBy ?? [],
                    implementsPatterns: pattern.implementsPatterns ?? [],
                    implementedBy: [],
                    extendsPattern: pattern.extendsPattern,
                    extendedBy: [],
                    seeAlso: pattern.seeAlso ?? [],
                    apiRef: pattern.apiRef ?? [],
                };
            }
            return {
                dependsOn: entry.dependsOn,
                enables: entry.enables,
                uses: entry.uses,
                usedBy: entry.usedBy,
                implementsPatterns: entry.implementsPatterns,
                implementedBy: entry.implementedBy,
                extendsPattern: entry.extendsPattern,
                extendedBy: entry.extendedBy,
                seeAlso: entry.seeAlso,
                apiRef: entry.apiRef,
            };
        },
        getRelatedPatterns(name) {
            const entry = relationshipIndex[name];
            if (!entry) {
                const pattern = this.getPattern(name);
                return pattern?.seeAlso ?? [];
            }
            return entry.seeAlso;
        },
        getApiReferences(name) {
            const entry = relationshipIndex[name];
            if (!entry) {
                const pattern = this.getPattern(name);
                return pattern?.apiRef ?? [];
            }
            return entry.apiRef;
        },
        getPatternDeliverables(name) {
            const pattern = this.getPattern(name);
            if (!pattern?.deliverables)
                return [];
            return pattern.deliverables.map((d) => ({
                name: d.name,
                status: d.status,
                tests: d.tests,
                location: d.location,
                finding: d.finding,
                release: d.release,
            }));
        },
        getPatternsByCategory(category) {
            return dataset.byCategory[category] ?? [];
        },
        getCategories() {
            return Object.entries(dataset.byCategory)
                .map(([category, patterns]) => ({
                category,
                count: patterns.length,
            }))
                .sort((a, b) => b.count - a.count);
        },
        // ─────────────────────────────────────────────────────────────────────
        // Timeline Queries
        // ─────────────────────────────────────────────────────────────────────
        getPatternsByQuarter(quarter) {
            return dataset.byQuarter[quarter] ?? [];
        },
        getQuarters() {
            return Object.entries(dataset.byQuarter)
                .map(([quarter, patterns]) => {
                const counts = {
                    completed: patterns.filter((p) => p.status === 'completed').length,
                    active: patterns.filter((p) => p.status === 'active').length,
                    planned: patterns.filter((p) => p.status === 'roadmap' || p.status === 'deferred')
                        .length,
                    total: patterns.length,
                };
                return { quarter, patterns, counts };
            })
                .sort((a, b) => a.quarter.localeCompare(b.quarter));
        },
        getCurrentWork() {
            return filterByExactStatus('active');
        },
        getRoadmapItems() {
            const roadmap = filterByExactStatus('roadmap');
            const deferred = filterByExactStatus('deferred');
            return [...roadmap, ...deferred];
        },
        getRecentlyCompleted(limit = 10) {
            const completed = filterByExactStatus('completed');
            // Sort by completion date if available
            return completed
                .filter((p) => p.completed)
                .sort((a, b) => {
                const dateA = a.completed ?? '';
                const dateB = b.completed ?? '';
                return dateB.localeCompare(dateA); // Descending
            })
                .slice(0, limit);
        },
        // ─────────────────────────────────────────────────────────────────────
        // Raw Access
        // ─────────────────────────────────────────────────────────────────────
        getMasterDataset() {
            return dataset;
        },
    };
}
//# sourceMappingURL=process-state.js.map