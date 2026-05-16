export const ARCH_LAYER_VALUES = ['domain', 'application', 'infrastructure'] as const;

export type ArchLayerValue = (typeof ARCH_LAYER_VALUES)[number];
