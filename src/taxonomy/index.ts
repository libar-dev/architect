/**
 * Taxonomy Module - Single Source of Truth
 *
 * This module provides all taxonomy constants, types, and the registry builder.
 * All consumers should import from this module instead of reading JSON files.
 *
 * @example
 * ```typescript
 * import {
 *   PROCESS_STATUS_VALUES,
 *   type ProcessStatusValue,
 *   buildRegistry
 * } from "@libar/taxonomy";
 *
 * // Use constant in Zod schema
 * const StatusSchema = z.enum(PROCESS_STATUS_VALUES);
 *
 * // Get full registry
 * const registry = buildRegistry();
 * ```
 */

// Status values (PDR-005 FSM)
export {
  ACCEPTED_STATUS_VALUES,
  DEFAULT_STATUS,
  PROCESS_STATUS_VALUES,
  VALID_PROCESS_STATUS_SET,
  type AcceptedStatusValue,
  type ProcessStatusValue,
} from './status-values.js';

// Normalized status (display buckets)
export {
  normalizeStatus,
  NORMALIZED_STATUS_VALUES,
  STATUS_NORMALIZATION_MAP,
  type NormalizedStatus,
} from './normalized-status.js';

// Format types (tag value formats)
export { FORMAT_TYPES, type FormatType } from './format-types.js';

// Hierarchy levels
export {
  DEFAULT_HIERARCHY_LEVEL,
  HIERARCHY_LEVELS,
  type HierarchyLevel,
} from './hierarchy-levels.js';

// Risk levels
export { RISK_LEVELS, type RiskLevel } from './risk-levels.js';

// Layer types (feature layer classification)
export { LAYER_TYPES, type LayerType } from './layer-types.js';

// Severity types (lint/validation)
export { SEVERITY_TYPES, type SeverityType } from './severity-types.js';

// Categories (DDD/ES/CQRS domain taxonomy)
export {
  CATEGORIES,
  CATEGORY_TAGS,
  type CategoryDefinition,
  type CategoryTag,
} from './categories.js';

// Generator options (format, groupBy, sortBy enums)
export {
  // Format options
  ACCEPTANCE_CRITERIA_FORMAT,
  CORE_PATTERNS_FORMAT,
  DELIVERABLES_FORMAT,
  DEPENDENCIES_FORMAT,
  GLOBAL_FORMAT_OPTIONS,
  PATTERN_LIST_FORMAT,
  // GroupBy options
  ADR_LIST_GROUP_BY,
  CONSTRAINTS_GROUP_BY,
  DELIVERABLES_GROUP_BY,
  PRD_FEATURES_GROUP_BY,
  REMAINING_WORK_GROUP_BY,
  SESSION_FINDINGS_GROUP_BY,
  TIMELINE_GROUP_BY,
  // SortBy options
  PR_CHANGES_SORT_BY,
  REMAINING_WORK_SORT_BY,
  // Metadata tag enums
  ADR_LAYER_VALUES,
  ADR_STATUS_VALUES,
  ADR_THEME_VALUES,
  PRIORITY_VALUES,
  WORKFLOW_VALUES,
  // Types
  type AcceptanceCriteriaFormat,
  type AdrLayerValue,
  type AdrListGroupBy,
  type AdrStatusValue,
  type AdrThemeValue,
  type ConstraintsGroupBy,
  type CorePatternsFormat,
  type DeliverablesFormat,
  type DeliverablesGroupBy,
  type DependenciesFormat,
  type GlobalFormatOption,
  type PatternListFormat,
  type PrChangesSortBy,
  type PrdFeaturesGroupBy,
  type PriorityValue,
  type RemainingWorkGroupBy,
  type RemainingWorkSortBy,
  type SessionFindingsGroupBy,
  type TimelineGroupBy,
  type WorkflowValue,
} from './generator-options.js';

// Registry builder
export { buildRegistry, type TagRegistry } from './registry-builder.js';
