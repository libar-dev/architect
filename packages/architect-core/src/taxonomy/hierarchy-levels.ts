export const HIERARCHY_LEVELS = ['epic', 'phase', 'task', 'slice'] as const;

export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];

export const DEFAULT_HIERARCHY_LEVEL: HierarchyLevel = 'phase';
