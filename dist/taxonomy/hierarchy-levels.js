/**
 * @libar-docs
 * @libar-docs-pattern HierarchyLevels
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes HIERARCHY_LEVELS, HierarchyLevel, DEFAULT_HIERARCHY_LEVEL
 *
 * ## Hierarchy Levels for Work Item Breakdown
 *
 * Three-level hierarchy for organizing work:
 * - epic: Multi-quarter strategic initiatives
 * - phase: Standard work units (2-5 days)
 * - task: Fine-grained session-level work (1-4 hours)
 */
export const HIERARCHY_LEVELS = ['epic', 'phase', 'task'];
/**
 * Default hierarchy level (for backward compatibility)
 */
export const DEFAULT_HIERARCHY_LEVEL = 'phase';
//# sourceMappingURL=hierarchy-levels.js.map