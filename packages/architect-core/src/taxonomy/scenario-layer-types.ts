export const SCENARIO_LAYER_TYPES = [
  'timeline',
  'domain',
  'integration',
  'e2e',
  'component',
  'unknown',
] as const;

export type ScenarioLayerType = (typeof SCENARIO_LAYER_TYPES)[number];
