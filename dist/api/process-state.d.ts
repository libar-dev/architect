/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ProcessStateAPI
 * @libar-docs-status active
 * @libar-docs-implements PhaseStateMachineValidation
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 * @libar-docs-uses MasterDataset, FSMValidator
 *
 * ## Process State API - Programmatic Query Interface
 *
 * TypeScript interface for querying delivery process state.
 * Designed for Claude Code integration and programmatic access.
 *
 * ### When to Use
 *
 * - When querying patterns by status, phase, or relationships
 * - When validating FSM transitions before making changes
 * - When building dashboards or reports on delivery progress
 * - When Claude Code needs real-time delivery state (prefer over reading Markdown)
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
import type { MasterDataset, ExtractedPattern } from '../validation-schemas/index.js';
import type { ProcessStatusValue } from '../taxonomy/index.js';
import type { StatusCounts, StatusDistribution, PhaseProgress, PhaseGroup, PatternDependencies, PatternRelationships, PatternDeliverable, QuarterGroup, TransitionCheck, ProtectionInfo } from './types.js';
/**
 * Programmatic API for querying delivery process state
 */
export interface ProcessStateAPI {
    /**
     * Get all patterns with a specific normalized status
     *
     * @param status - "completed" | "active" | "planned"
     * @returns Array of patterns with that status
     */
    getPatternsByNormalizedStatus(status: 'completed' | 'active' | 'planned'): ExtractedPattern[];
    /**
     * Get all patterns with a specific FSM status value
     *
     * @param status - ProcessStatusValue (roadmap, active, completed, deferred)
     * @returns Array of patterns with that exact status
     */
    getPatternsByStatus(status: ProcessStatusValue): ExtractedPattern[];
    /**
     * Get status counts (completed, active, planned, total)
     */
    getStatusCounts(): StatusCounts;
    /**
     * Get status distribution with percentages
     */
    getStatusDistribution(): StatusDistribution;
    /**
     * Get overall completion percentage
     */
    getCompletionPercentage(): number;
    /**
     * Get all patterns in a specific phase
     *
     * @param phase - Phase number
     * @returns Array of patterns in that phase
     */
    getPatternsByPhase(phase: number): ExtractedPattern[];
    /**
     * Get progress for a specific phase
     *
     * @param phase - Phase number
     * @returns Phase progress with counts and completion percentage
     */
    getPhaseProgress(phase: number): PhaseProgress | undefined;
    /**
     * Get all phases with active work
     */
    getActivePhases(): PhaseGroup[];
    /**
     * Get all phase groups sorted by phase number
     */
    getAllPhases(): PhaseGroup[];
    /**
     * Check if a status transition is valid
     *
     * @param from - Current status
     * @param to - Target status
     */
    isValidTransition(from: ProcessStatusValue, to: ProcessStatusValue): boolean;
    /**
     * Get detailed transition validation result
     *
     * @param from - Current status
     * @param to - Target status
     */
    checkTransition(from: string, to: string): TransitionCheck;
    /**
     * Get valid transition targets from a status
     *
     * @param status - Current status
     */
    getValidTransitionsFrom(status: ProcessStatusValue): readonly ProcessStatusValue[];
    /**
     * Get protection level for a status
     *
     * @param status - Status to check
     */
    getProtectionInfo(status: ProcessStatusValue): ProtectionInfo;
    /**
     * Find a pattern by name
     *
     * @param name - Pattern name (case-insensitive)
     */
    getPattern(name: string): ExtractedPattern | undefined;
    /**
     * Get pattern dependencies
     *
     * @param name - Pattern name
     */
    getPatternDependencies(name: string): PatternDependencies | undefined;
    /**
     * Get complete pattern relationships (all relationship types)
     *
     * Returns the full relationship data from the MasterDataset's relationshipIndex,
     * including UML-inspired relationships (implements, extends) and cross-references
     * (see-also, api-ref).
     *
     * @param name - Pattern name
     */
    getPatternRelationships(name: string): PatternRelationships | undefined;
    /**
     * Get related patterns (from @libar-docs-see-also tag)
     *
     * Returns patterns that are related for cross-reference without implying
     * dependency. Used for planning session scoping.
     *
     * @param name - Pattern name
     */
    getRelatedPatterns(name: string): readonly string[];
    /**
     * Get API references (from @libar-docs-api-ref tag)
     *
     * Returns file paths to implementation APIs. Used for code navigation
     * from spec to implementation.
     *
     * @param name - Pattern name
     */
    getApiReferences(name: string): readonly string[];
    /**
     * Get pattern deliverables (from feature files)
     *
     * @param name - Pattern name
     */
    getPatternDeliverables(name: string): PatternDeliverable[];
    /**
     * Get patterns by category
     *
     * @param category - Category name
     */
    getPatternsByCategory(category: string): ExtractedPattern[];
    /**
     * Get all categories with pattern counts
     */
    getCategories(): Array<{
        category: string;
        count: number;
    }>;
    /**
     * Get patterns grouped by quarter
     *
     * @param quarter - Quarter string (e.g., "Q1-2026")
     */
    getPatternsByQuarter(quarter: string): ExtractedPattern[];
    /**
     * Get all quarters with patterns
     */
    getQuarters(): QuarterGroup[];
    /**
     * Get current work (active patterns)
     */
    getCurrentWork(): ExtractedPattern[];
    /**
     * Get roadmap items (roadmap + deferred patterns)
     */
    getRoadmapItems(): ExtractedPattern[];
    /**
     * Get recently completed patterns
     *
     * @param limit - Maximum number to return (default: 10)
     */
    getRecentlyCompleted(limit?: number): ExtractedPattern[];
    /**
     * Get the underlying MasterDataset
     */
    getMasterDataset(): MasterDataset;
}
/**
 * Create a ProcessStateAPI instance from a MasterDataset
 *
 * @param dataset - The MasterDataset to wrap
 * @returns ProcessStateAPI instance
 */
export declare function createProcessStateAPI(dataset: MasterDataset): ProcessStateAPI;
//# sourceMappingURL=process-state.d.ts.map