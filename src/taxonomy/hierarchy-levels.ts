/**
 * @architect
 * @architect-pattern HierarchyLevels
 * @architect-status completed
 * @architect-core
 * @architect-extract-shapes HIERARCHY_LEVELS, HierarchyLevel, DEFAULT_HIERARCHY_LEVEL
 *
 * ## Hierarchy Levels for Work Item Breakdown
 *
 * Three-level hierarchy for organizing work:
 * - epic: Multi-quarter strategic initiatives
 * - phase: Standard work units (2-5 days)
 * - task: Fine-grained session-level work (1-4 hours)
 *
 * **When to Use:** When assigning or validating work item granularity in roadmap specs and feature annotations.
 */
export const HIERARCHY_LEVELS = ['epic', 'phase', 'task'] as const;

export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];

/**
 * Default hierarchy level (for backward compatibility)
 */
export const DEFAULT_HIERARCHY_LEVEL: HierarchyLevel = 'phase';
