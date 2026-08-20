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
