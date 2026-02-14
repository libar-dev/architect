/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ProjectConfigSchema
 * @libar-docs-status active
 * @libar-docs-uses ProjectConfigTypes
 * @libar-docs-used-by ConfigLoader
 *
 * ## Project Configuration Schema
 *
 * Zod validation schema for `DeliveryProcessProjectConfig`.
 * Validates at load time (not at `defineConfig()` call time)
 * following the Vite/Vitest identity-function convention.
 *
 * ### Validation Rules
 *
 * - At least one TypeScript source glob when `sources` is provided
 * - No parent directory traversal in glob patterns (security)
 * - Preset name must be one of the known presets
 * - `replaceFeatures` and `additionalFeatures` are mutually exclusive
 */
import { z } from 'zod';
import type { DeliveryProcessProjectConfig } from './project-config.js';
import type { DeliveryProcessInstance } from './types.js';
/**
 * Schema for source file configuration.
 */
export declare const SourcesConfigSchema: z.ZodObject<{
    typescript: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    features: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    stubs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    exclude: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
}, z.core.$strict>;
/**
 * Schema for output configuration.
 */
export declare const OutputConfigSchema: z.ZodObject<{
    directory: z.ZodOptional<z.ZodString>;
    overwrite: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
/**
 * Schema for per-generator source overrides.
 */
export declare const GeneratorSourceOverrideSchema: z.ZodObject<{
    additionalFeatures: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    additionalInput: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    replaceFeatures: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    outputDirectory: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/**
 * Full project configuration schema.
 *
 * Validated at config load time by `loadProjectConfig()`.
 * The `defineConfig()` identity function does NOT validate —
 * it only provides TypeScript type checking.
 */
export declare const DeliveryProcessProjectConfigSchema: z.ZodObject<{
    preset: z.ZodOptional<z.ZodEnum<{
        generic: "generic";
        "libar-generic": "libar-generic";
        "ddd-es-cqrs": "ddd-es-cqrs";
    }>>;
    tagPrefix: z.ZodOptional<z.ZodString>;
    fileOptInTag: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
        tag: z.ZodString;
        domain: z.ZodString;
        priority: z.ZodNumber;
        description: z.ZodString;
        aliases: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>>>;
    sources: z.ZodOptional<z.ZodObject<{
        typescript: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        features: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        stubs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        exclude: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    }, z.core.$strict>>;
    output: z.ZodOptional<z.ZodObject<{
        directory: z.ZodOptional<z.ZodString>;
        overwrite: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    generators: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    generatorOverrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        additionalFeatures: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        additionalInput: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        replaceFeatures: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        outputDirectory: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    contextInferenceRules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
        pattern: z.ZodString;
        context: z.ZodString;
    }, z.core.$strict>>>>;
    workflowPath: z.ZodOptional<z.ZodString>;
    referenceDocConfigs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        conventionTags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        shapeSources: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        behaviorCategories: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        diagramScope: z.ZodOptional<z.ZodObject<{
            archContext: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            patterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            archLayer: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            direction: z.ZodOptional<z.ZodEnum<{
                TB: "TB";
                LR: "LR";
            }>>;
            title: z.ZodOptional<z.ZodString>;
            diagramType: z.ZodOptional<z.ZodEnum<{
                "stateDiagram-v2": "stateDiagram-v2";
                graph: "graph";
                sequenceDiagram: "sequenceDiagram";
                C4Context: "C4Context";
                classDiagram: "classDiagram";
            }>>;
            showEdgeLabels: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        diagramScopes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            archContext: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            patterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            archLayer: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            direction: z.ZodOptional<z.ZodEnum<{
                TB: "TB";
                LR: "LR";
            }>>;
            title: z.ZodOptional<z.ZodString>;
            diagramType: z.ZodOptional<z.ZodEnum<{
                "stateDiagram-v2": "stateDiagram-v2";
                graph: "graph";
                sequenceDiagram: "sequenceDiagram";
                C4Context: "C4Context";
                classDiagram: "classDiagram";
            }>>;
            showEdgeLabels: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>>>;
        claudeMdSection: z.ZodString;
        docsFilename: z.ZodString;
        claudeMdFilename: z.ZodString;
        shapeSelectors: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            group: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            source: z.ZodString;
            names: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>, z.ZodObject<{
            source: z.ZodString;
        }, z.core.$strict>]>>>>;
    }, z.core.$strict>>>>;
}, z.core.$strict>;
/**
 * Type guard for raw project config objects.
 *
 * Used by `loadProjectConfig()` to distinguish between:
 * - New-style `DeliveryProcessProjectConfig` (has `sources`, `preset`, `output`, etc.)
 * - Legacy `DeliveryProcessInstance` (has `registry` + `regexBuilders`)
 */
export declare function isProjectConfig(value: unknown): value is DeliveryProcessProjectConfig;
/**
 * Type guard for legacy DeliveryProcessInstance objects.
 */
export declare function isLegacyInstance(value: unknown): value is DeliveryProcessInstance;
//# sourceMappingURL=project-config-schema.d.ts.map