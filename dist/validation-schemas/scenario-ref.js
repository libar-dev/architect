import { z } from "zod";
import { LAYER_TYPES } from "../taxonomy/index.js";
/**
 * Schema for DataTable attached to scenario steps
 */
export const ScenarioDataTableSchema = z
    .object({
    /** Column headers from the first row */
    headers: z.array(z.string()).readonly(),
    /** Data rows (excluding header row), each row maps column name to value */
    rows: z.array(z.record(z.string(), z.string())).readonly(),
})
    .strict();
/**
 * Schema for scenario steps with optional DataTable/DocString
 *
 * Mirrors GherkinStep type but with Zod validation.
 */
export const ScenarioStepSchema = z
    .object({
    /** Step keyword (Given, When, Then, And, But) */
    keyword: z.string(),
    /** Step text */
    text: z.string(),
    /** Optional DataTable attached to this step */
    dataTable: ScenarioDataTableSchema.optional(),
    /** Optional DocString attached to this step */
    docString: z.string().optional(),
})
    .strict();
/**
 * Schema for scenario references from Gherkin feature files
 *
 * This schema defines the structure for scenario references
 * used in ExtractedPattern.scenarios.
 */
export const ScenarioRefSchema = z
    .object({
    /** Absolute path to the feature file */
    featureFile: z.string(),
    /** Name of the feature */
    featureName: z.string(),
    /** Description of the feature (from lines between Feature: and Background:/Scenario:) */
    featureDescription: z.string(),
    /** Name of the scenario */
    scenarioName: z.string(),
    /** Semantic tags on the scenario (e.g., @happy-path, @validation) */
    semanticTags: z.array(z.string()).readonly(),
    /** All tags on the scenario (excluding @pattern:*) */
    tags: z.array(z.string()).readonly(),
    /** Scenario steps with Given/When/Then (optional for backward compatibility) */
    steps: z.array(ScenarioStepSchema).readonly().optional(),
    /** Inferred feature layer based on directory path (timeline, domain, integration, e2e, component) */
    layer: z.enum(LAYER_TYPES).optional(),
    /** Line number in feature file (for traceability links) */
    line: z.number().int().positive().optional(),
})
    .strict();
//# sourceMappingURL=scenario-ref.js.map