import { z } from 'zod';

import { SCENARIO_LAYER_TYPES } from '../taxonomy/scenario-layer-types.js';

export const ScenarioDataTableSchema = z.strictObject({
  headers: z.array(z.string()).readonly(),
  rows: z.array(z.record(z.string(), z.string())).readonly(),
});

export type ScenarioDataTable = z.infer<typeof ScenarioDataTableSchema>;

export const ScenarioDocStringSchema = z.strictObject({
  content: z.string(),
  mediaType: z.string().optional(),
});

export type ScenarioDocString = z.infer<typeof ScenarioDocStringSchema>;

export const ScenarioStepSchema = z.strictObject({
  keyword: z.string(),
  text: z.string(),
  dataTable: ScenarioDataTableSchema.optional(),
  docString: ScenarioDocStringSchema.optional(),
});

export type ScenarioStep = z.infer<typeof ScenarioStepSchema>;

export const ScenarioRefSchema = z.strictObject({
  featureFile: z.string(),
  featureName: z.string(),
  featureDescription: z.string(),
  scenarioName: z.string(),
  semanticTags: z.array(z.string()).readonly(),
  tags: z.array(z.string()).readonly(),
  steps: z.array(ScenarioStepSchema).readonly().optional(),
  layer: z.enum(SCENARIO_LAYER_TYPES).optional(),
  line: z.number().int().positive().optional(),
});

export type ScenarioRef = z.infer<typeof ScenarioRefSchema>;
