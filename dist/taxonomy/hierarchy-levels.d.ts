/**
 * Hierarchy levels for work item breakdown
 *
 * Three-level hierarchy for organizing work:
 * - epic: Multi-quarter strategic initiatives
 * - phase: Standard work units (2-5 days)
 * - task: Fine-grained session-level work (1-4 hours)
 */
export declare const HIERARCHY_LEVELS: readonly ["epic", "phase", "task"];
export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];
/**
 * Default hierarchy level (for backward compatibility)
 */
export declare const DEFAULT_HIERARCHY_LEVEL: HierarchyLevel;
//# sourceMappingURL=hierarchy-levels.d.ts.map