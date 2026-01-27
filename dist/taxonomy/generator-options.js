/**
 * Generator section option enums
 *
 * All format, groupBy, sortBy, and filterBy options used by generator sections.
 * Centralized here to eliminate hardcoded strings in generator-config.ts.
 */
// ─────────────────────────────────────────────────────────────────────────────
// Format Options
// ─────────────────────────────────────────────────────────────────────────────
/** core-patterns section format */
export const CORE_PATTERNS_FORMAT = ['table', 'list'];
/** dependencies section format */
export const DEPENDENCIES_FORMAT = ['mermaid', 'table'];
/** pattern-list section format */
export const PATTERN_LIST_FORMAT = ['full', 'list', 'summary', 'adr'];
/** deliverables-summary section format */
export const DELIVERABLES_FORMAT = ['table', 'checklist', 'progress-bar'];
/** acceptance-criteria section format */
export const ACCEPTANCE_CRITERIA_FORMAT = ['gherkin', 'bullet-points', 'table'];
// ─────────────────────────────────────────────────────────────────────────────
// GroupBy Options
// ─────────────────────────────────────────────────────────────────────────────
/** timeline-summary section groupBy */
export const TIMELINE_GROUP_BY = ['quarter', 'phase'];
/** deliverables-summary section groupBy */
export const DELIVERABLES_GROUP_BY = ['status', 'phase', 'location', 'none'];
/** prd-features section groupBy */
export const PRD_FEATURES_GROUP_BY = ['product-area', 'user-role', 'phase'];
/** session-findings section groupBy */
export const SESSION_FINDINGS_GROUP_BY = ['category', 'phase'];
/** constraints-index section groupBy */
export const CONSTRAINTS_GROUP_BY = ['product-area', 'constraint'];
/** adr-list section groupBy */
export const ADR_LIST_GROUP_BY = ['status', 'category'];
/** remaining-work section groupPlannedBy */
export const REMAINING_WORK_GROUP_BY = ['quarter', 'priority', 'level', 'none'];
// ─────────────────────────────────────────────────────────────────────────────
// SortBy Options
// ─────────────────────────────────────────────────────────────────────────────
/** remaining-work section sortBy */
export const REMAINING_WORK_SORT_BY = ['phase', 'priority', 'effort', 'quarter'];
/** pr-changes section sortBy */
export const PR_CHANGES_SORT_BY = ['phase', 'priority', 'workflow'];
// ─────────────────────────────────────────────────────────────────────────────
// Metadata Tag Enums (from tag-registry)
// ─────────────────────────────────────────────────────────────────────────────
/** workflow discipline values */
export const WORKFLOW_VALUES = [
    'implementation',
    'planning',
    'validation',
    'documentation',
];
/** priority level values */
export const PRIORITY_VALUES = ['critical', 'high', 'medium', 'low'];
/** ADR/PDR status values */
export const ADR_STATUS_VALUES = ['proposed', 'accepted', 'deprecated', 'superseded'];
/** ADR theme grouping values */
export const ADR_THEME_VALUES = [
    'persistence',
    'isolation',
    'commands',
    'projections',
    'coordination',
    'taxonomy',
    'testing',
];
/** ADR evolutionary layer values */
export const ADR_LAYER_VALUES = ['foundation', 'infrastructure', 'refinement'];
// ─────────────────────────────────────────────────────────────────────────────
// Format Options (global)
// ─────────────────────────────────────────────────────────────────────────────
/** Global format options for pattern display */
export const GLOBAL_FORMAT_OPTIONS = ['full', 'list', 'summary'];
//# sourceMappingURL=generator-options.js.map