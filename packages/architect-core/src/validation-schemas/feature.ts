import { z } from 'zod';

export type GherkinDataTableRow = Readonly<Record<string, string>>;

export const GherkinDataTableSchema = z.strictObject({
  headers: z.array(z.string()).readonly(),
  rows: z.array(z.record(z.string(), z.string())).readonly(),
});

export const GherkinDocStringSchema = z.strictObject({
  content: z.string(),
  mediaType: z.string().optional(),
});

export type GherkinDocString = z.infer<typeof GherkinDocStringSchema>;

export const GherkinExamplesSchema = z.strictObject({
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).readonly(),
  headers: z.array(z.string()).readonly(),
  rows: z.array(z.record(z.string(), z.string())).readonly(),
  line: z.number().int().positive(),
});

export type GherkinExamples = z.infer<typeof GherkinExamplesSchema>;

export const GherkinStepSchema = z.strictObject({
  keyword: z.string().min(1),
  text: z.string(),
  dataTable: GherkinDataTableSchema.optional(),
  docString: GherkinDocStringSchema.optional(),
});

export const GherkinBackgroundSchema = z.strictObject({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(GherkinStepSchema).readonly(),
  line: z.number().int().positive(),
});

export const GherkinScenarioSchema = z.strictObject({
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).readonly(),
  steps: z.array(GherkinStepSchema).readonly(),
  examples: z.array(GherkinExamplesSchema).readonly().optional(),
  line: z.number().int().positive(),
});

export const GherkinRuleSchema = z.strictObject({
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()).readonly(),
  scenarios: z.array(GherkinScenarioSchema).readonly(),
  line: z.number().int().positive(),
});

export const GherkinFeatureSchema = z.strictObject({
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()).readonly(),
  language: z.string().default('en'),
  line: z.number().int().positive(),
});

export const ScannedGherkinFileSchema = z.strictObject({
  filePath: z.string(),
  feature: GherkinFeatureSchema,
  background: GherkinBackgroundSchema.optional(),
  rules: z.array(GherkinRuleSchema).readonly().optional(),
  scenarios: z.array(GherkinScenarioSchema).readonly(),
});

export const GherkinFileErrorSchema = z.strictObject({
  file: z.string(),
  patternName: z.string().optional(),
  error: z.strictObject({
    message: z.string(),
    line: z.number().int().positive().optional(),
    column: z.number().int().positive().optional(),
  }),
});

export const GherkinScanResultsSchema = z.strictObject({
  files: z.array(ScannedGherkinFileSchema).readonly(),
  errors: z.array(GherkinFileErrorSchema).readonly(),
});

export type GherkinDataTable = z.infer<typeof GherkinDataTableSchema>;
export type GherkinStep = z.infer<typeof GherkinStepSchema>;
export type GherkinBackground = z.infer<typeof GherkinBackgroundSchema>;
export type GherkinScenario = z.infer<typeof GherkinScenarioSchema>;
export type GherkinRule = z.infer<typeof GherkinRuleSchema>;
export type GherkinFeature = z.infer<typeof GherkinFeatureSchema>;
export type ScannedGherkinFile = z.infer<typeof ScannedGherkinFileSchema>;
export type GherkinFileError = z.infer<typeof GherkinFileErrorSchema>;
export type GherkinScanResults = z.infer<typeof GherkinScanResultsSchema>;

export const ParsedStepSchema = GherkinStepSchema;
export const ParsedScenarioSchema = GherkinScenarioSchema;
export const ParsedBackgroundSchema = GherkinBackgroundSchema;
export const ParsedFeatureSchema = GherkinFeatureSchema;
export const FeatureFileSchema = ScannedGherkinFileSchema;

export type ParsedStep = z.infer<typeof ParsedStepSchema>;
export type ParsedScenario = z.infer<typeof ParsedScenarioSchema>;
export type ParsedBackground = z.infer<typeof ParsedBackgroundSchema>;
export type ParsedFeature = z.infer<typeof ParsedFeatureSchema>;
export type FeatureFile = z.infer<typeof FeatureFileSchema>;
