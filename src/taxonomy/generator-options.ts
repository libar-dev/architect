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
export const CORE_PATTERNS_FORMAT = ['table', 'list'] as const;
export type CorePatternsFormat = (typeof CORE_PATTERNS_FORMAT)[number];

/** dependencies section format */
export const DEPENDENCIES_FORMAT = ['mermaid', 'table'] as const;
export type DependenciesFormat = (typeof DEPENDENCIES_FORMAT)[number];

/** pattern-list section format */
export const PATTERN_LIST_FORMAT = ['full', 'list', 'summary', 'adr'] as const;
export type PatternListFormat = (typeof PATTERN_LIST_FORMAT)[number];

/** deliverables-summary section format */
export const DELIVERABLES_FORMAT = ['table', 'checklist', 'progress-bar'] as const;
export type DeliverablesFormat = (typeof DELIVERABLES_FORMAT)[number];

/** acceptance-criteria section format */
export const ACCEPTANCE_CRITERIA_FORMAT = ['gherkin', 'bullet-points', 'table'] as const;
export type AcceptanceCriteriaFormat = (typeof ACCEPTANCE_CRITERIA_FORMAT)[number];

// ─────────────────────────────────────────────────────────────────────────────
// GroupBy Options
// ─────────────────────────────────────────────────────────────────────────────

/** timeline-summary section groupBy */
export const TIMELINE_GROUP_BY = ['quarter', 'phase'] as const;
export type TimelineGroupBy = (typeof TIMELINE_GROUP_BY)[number];

/** deliverables-summary section groupBy */
export const DELIVERABLES_GROUP_BY = ['status', 'phase', 'location', 'none'] as const;
export type DeliverablesGroupBy = (typeof DELIVERABLES_GROUP_BY)[number];

/** prd-features section groupBy */
export const PRD_FEATURES_GROUP_BY = ['product-area', 'user-role', 'phase'] as const;
export type PrdFeaturesGroupBy = (typeof PRD_FEATURES_GROUP_BY)[number];

/** session-findings section groupBy */
export const SESSION_FINDINGS_GROUP_BY = ['category', 'phase'] as const;
export type SessionFindingsGroupBy = (typeof SESSION_FINDINGS_GROUP_BY)[number];

/** constraints-index section groupBy */
export const CONSTRAINTS_GROUP_BY = ['product-area', 'constraint'] as const;
export type ConstraintsGroupBy = (typeof CONSTRAINTS_GROUP_BY)[number];

/** adr-list section groupBy */
export const ADR_LIST_GROUP_BY = ['status', 'category'] as const;
export type AdrListGroupBy = (typeof ADR_LIST_GROUP_BY)[number];

/** remaining-work section groupPlannedBy */
export const REMAINING_WORK_GROUP_BY = ['quarter', 'priority', 'level', 'none'] as const;
export type RemainingWorkGroupBy = (typeof REMAINING_WORK_GROUP_BY)[number];

// ─────────────────────────────────────────────────────────────────────────────
// SortBy Options
// ─────────────────────────────────────────────────────────────────────────────

/** remaining-work section sortBy */
export const REMAINING_WORK_SORT_BY = ['phase', 'priority', 'effort', 'quarter'] as const;
export type RemainingWorkSortBy = (typeof REMAINING_WORK_SORT_BY)[number];

/** pr-changes section sortBy */
export const PR_CHANGES_SORT_BY = ['phase', 'priority', 'workflow'] as const;
export type PrChangesSortBy = (typeof PR_CHANGES_SORT_BY)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Metadata Tag Enums (from tag-registry)
// ─────────────────────────────────────────────────────────────────────────────

/** workflow discipline values */
export const WORKFLOW_VALUES = [
  'implementation',
  'planning',
  'validation',
  'documentation',
] as const;
export type WorkflowValue = (typeof WORKFLOW_VALUES)[number];

/** priority level values */
export const PRIORITY_VALUES = ['critical', 'high', 'medium', 'low'] as const;
export type PriorityValue = (typeof PRIORITY_VALUES)[number];

/** ADR/PDR status values */
export const ADR_STATUS_VALUES = ['proposed', 'accepted', 'deprecated', 'superseded'] as const;
export type AdrStatusValue = (typeof ADR_STATUS_VALUES)[number];

/** ADR theme grouping values */
export const ADR_THEME_VALUES = [
  'persistence',
  'isolation',
  'commands',
  'projections',
  'coordination',
  'taxonomy',
  'testing',
] as const;
export type AdrThemeValue = (typeof ADR_THEME_VALUES)[number];

/** ADR evolutionary layer values */
export const ADR_LAYER_VALUES = ['foundation', 'infrastructure', 'refinement'] as const;
export type AdrLayerValue = (typeof ADR_LAYER_VALUES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Format Options (global)
// ─────────────────────────────────────────────────────────────────────────────

/** Global format options for pattern display */
export const GLOBAL_FORMAT_OPTIONS = ['full', 'list', 'summary'] as const;
export type GlobalFormatOption = (typeof GLOBAL_FORMAT_OPTIONS)[number];
