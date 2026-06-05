export const CORE_PATTERNS_FORMAT = ['table', 'list'] as const;
export type CorePatternsFormat = (typeof CORE_PATTERNS_FORMAT)[number];

export const DEPENDENCIES_FORMAT = ['mermaid', 'table'] as const;
export type DependenciesFormat = (typeof DEPENDENCIES_FORMAT)[number];

export const PATTERN_LIST_FORMAT = ['full', 'list', 'summary', 'adr'] as const;
export type PatternListFormat = (typeof PATTERN_LIST_FORMAT)[number];

export const DELIVERABLES_FORMAT = ['table', 'checklist', 'progress-bar'] as const;
export type DeliverablesFormat = (typeof DELIVERABLES_FORMAT)[number];

export const ACCEPTANCE_CRITERIA_FORMAT = ['gherkin', 'bullet-points', 'table'] as const;
export type AcceptanceCriteriaFormat = (typeof ACCEPTANCE_CRITERIA_FORMAT)[number];

export const DELIVERABLES_GROUP_BY = ['status', 'location', 'none'] as const;
export type DeliverablesGroupBy = (typeof DELIVERABLES_GROUP_BY)[number];

export const PRD_FEATURES_GROUP_BY = ['product-area'] as const;
export type PrdFeaturesGroupBy = (typeof PRD_FEATURES_GROUP_BY)[number];

export const SESSION_FINDINGS_GROUP_BY = ['category'] as const;
export type SessionFindingsGroupBy = (typeof SESSION_FINDINGS_GROUP_BY)[number];

export const CONSTRAINTS_GROUP_BY = ['product-area', 'constraint'] as const;
export type ConstraintsGroupBy = (typeof CONSTRAINTS_GROUP_BY)[number];

export const ADR_LIST_GROUP_BY = ['status', 'category'] as const;
export type AdrListGroupBy = (typeof ADR_LIST_GROUP_BY)[number];

export const REMAINING_WORK_GROUP_BY = ['level', 'none'] as const;
export type RemainingWorkGroupBy = (typeof REMAINING_WORK_GROUP_BY)[number];

export const PR_CHANGES_SORT_BY = ['workflow'] as const;
export type PrChangesSortBy = (typeof PR_CHANGES_SORT_BY)[number];

export const WORKFLOW_VALUES = [
  'implementation',
  'planning',
  'validation',
  'documentation',
] as const;
export type WorkflowValue = (typeof WORKFLOW_VALUES)[number];

export const ADR_STATUS_VALUES = ['proposed', 'accepted', 'deprecated', 'superseded'] as const;
export type AdrStatusValue = (typeof ADR_STATUS_VALUES)[number];

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

export const ADR_LAYER_VALUES = ['foundation', 'infrastructure', 'refinement'] as const;
export type AdrLayerValue = (typeof ADR_LAYER_VALUES)[number];

export const GLOBAL_FORMAT_OPTIONS = ['full', 'list', 'summary'] as const;
export type GlobalFormatOption = (typeof GLOBAL_FORMAT_OPTIONS)[number];
