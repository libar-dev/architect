/**
 * Generator section option enums
 *
 * All format, groupBy, sortBy, and filterBy options used by generator sections.
 * Centralized here to eliminate hardcoded strings in generator-config.ts.
 */
/** core-patterns section format */
export declare const CORE_PATTERNS_FORMAT: readonly ["table", "list"];
export type CorePatternsFormat = (typeof CORE_PATTERNS_FORMAT)[number];
/** dependencies section format */
export declare const DEPENDENCIES_FORMAT: readonly ["mermaid", "table"];
export type DependenciesFormat = (typeof DEPENDENCIES_FORMAT)[number];
/** pattern-list section format */
export declare const PATTERN_LIST_FORMAT: readonly ["full", "list", "summary", "adr"];
export type PatternListFormat = (typeof PATTERN_LIST_FORMAT)[number];
/** deliverables-summary section format */
export declare const DELIVERABLES_FORMAT: readonly ["table", "checklist", "progress-bar"];
export type DeliverablesFormat = (typeof DELIVERABLES_FORMAT)[number];
/** acceptance-criteria section format */
export declare const ACCEPTANCE_CRITERIA_FORMAT: readonly ["gherkin", "bullet-points", "table"];
export type AcceptanceCriteriaFormat = (typeof ACCEPTANCE_CRITERIA_FORMAT)[number];
/** timeline-summary section groupBy */
export declare const TIMELINE_GROUP_BY: readonly ["quarter", "phase"];
export type TimelineGroupBy = (typeof TIMELINE_GROUP_BY)[number];
/** deliverables-summary section groupBy */
export declare const DELIVERABLES_GROUP_BY: readonly ["status", "phase", "location", "none"];
export type DeliverablesGroupBy = (typeof DELIVERABLES_GROUP_BY)[number];
/** prd-features section groupBy */
export declare const PRD_FEATURES_GROUP_BY: readonly ["product-area", "user-role", "phase"];
export type PrdFeaturesGroupBy = (typeof PRD_FEATURES_GROUP_BY)[number];
/** session-findings section groupBy */
export declare const SESSION_FINDINGS_GROUP_BY: readonly ["category", "phase"];
export type SessionFindingsGroupBy = (typeof SESSION_FINDINGS_GROUP_BY)[number];
/** constraints-index section groupBy */
export declare const CONSTRAINTS_GROUP_BY: readonly ["product-area", "constraint"];
export type ConstraintsGroupBy = (typeof CONSTRAINTS_GROUP_BY)[number];
/** adr-list section groupBy */
export declare const ADR_LIST_GROUP_BY: readonly ["status", "category"];
export type AdrListGroupBy = (typeof ADR_LIST_GROUP_BY)[number];
/** remaining-work section groupPlannedBy */
export declare const REMAINING_WORK_GROUP_BY: readonly ["quarter", "priority", "level", "none"];
export type RemainingWorkGroupBy = (typeof REMAINING_WORK_GROUP_BY)[number];
/** remaining-work section sortBy */
export declare const REMAINING_WORK_SORT_BY: readonly ["phase", "priority", "effort", "quarter"];
export type RemainingWorkSortBy = (typeof REMAINING_WORK_SORT_BY)[number];
/** pr-changes section sortBy */
export declare const PR_CHANGES_SORT_BY: readonly ["phase", "priority", "workflow"];
export type PrChangesSortBy = (typeof PR_CHANGES_SORT_BY)[number];
/** workflow discipline values */
export declare const WORKFLOW_VALUES: readonly ["implementation", "planning", "validation", "documentation"];
export type WorkflowValue = (typeof WORKFLOW_VALUES)[number];
/** priority level values */
export declare const PRIORITY_VALUES: readonly ["critical", "high", "medium", "low"];
export type PriorityValue = (typeof PRIORITY_VALUES)[number];
/** ADR/PDR status values */
export declare const ADR_STATUS_VALUES: readonly ["proposed", "accepted", "deprecated", "superseded"];
export type AdrStatusValue = (typeof ADR_STATUS_VALUES)[number];
/** ADR theme grouping values */
export declare const ADR_THEME_VALUES: readonly ["persistence", "isolation", "commands", "projections", "coordination", "taxonomy", "testing"];
export type AdrThemeValue = (typeof ADR_THEME_VALUES)[number];
/** ADR evolutionary layer values */
export declare const ADR_LAYER_VALUES: readonly ["foundation", "infrastructure", "refinement"];
export type AdrLayerValue = (typeof ADR_LAYER_VALUES)[number];
/** Global format options for pattern display */
export declare const GLOBAL_FORMAT_OPTIONS: readonly ["full", "list", "summary"];
export type GlobalFormatOption = (typeof GLOBAL_FORMAT_OPTIONS)[number];
//# sourceMappingURL=generator-options.d.ts.map