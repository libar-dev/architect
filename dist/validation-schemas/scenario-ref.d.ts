import { z } from 'zod';
/**
 * Schema for DataTable attached to scenario steps
 */
export declare const ScenarioDataTableSchema: z.ZodObject<{
    headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
}, z.core.$strict>;
export type ScenarioDataTable = z.infer<typeof ScenarioDataTableSchema>;
/**
 * Schema for a DocString attached to a step
 *
 * DocStrings can have an optional mediaType that specifies the content language
 * (e.g., "typescript", "json", "jsdoc") for proper syntax highlighting.
 */
export declare const ScenarioDocStringSchema: z.ZodObject<{
    content: z.ZodString;
    mediaType: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type ScenarioDocString = z.infer<typeof ScenarioDocStringSchema>;
/**
 * Schema for scenario steps with optional DataTable/DocString
 *
 * Mirrors GherkinStep type but with Zod validation.
 */
export declare const ScenarioStepSchema: z.ZodObject<{
    keyword: z.ZodString;
    text: z.ZodString;
    dataTable: z.ZodOptional<z.ZodObject<{
        headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
    }, z.core.$strict>>;
    docString: z.ZodOptional<z.ZodObject<{
        content: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type ScenarioStep = z.infer<typeof ScenarioStepSchema>;
/**
 * Schema for scenario references from Gherkin feature files
 *
 * This schema defines the structure for scenario references
 * used in ExtractedPattern.scenarios.
 */
export declare const ScenarioRefSchema: z.ZodObject<{
    featureFile: z.ZodString;
    featureName: z.ZodString;
    featureDescription: z.ZodString;
    scenarioName: z.ZodString;
    semanticTags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    steps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
        keyword: z.ZodString;
        text: z.ZodString;
        dataTable: z.ZodOptional<z.ZodObject<{
            headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
        }, z.core.$strict>>;
        docString: z.ZodOptional<z.ZodObject<{
            content: z.ZodString;
            mediaType: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>>;
    layer: z.ZodOptional<z.ZodEnum<{
        timeline: "timeline";
        domain: "domain";
        integration: "integration";
        e2e: "e2e";
        component: "component";
        unknown: "unknown";
    }>>;
    line: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/**
 * Type alias inferred from schema
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type ScenarioRef = z.infer<typeof ScenarioRefSchema>;
//# sourceMappingURL=scenario-ref.d.ts.map