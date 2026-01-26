/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ArchitectureCodec
 * @libar-docs-status completed
 * @libar-docs-uses MasterDataset, ArchIndex
 *
 * ## Architecture Diagram Codec
 *
 * Transforms MasterDataset into a RenderableDocument containing
 * architecture diagrams (Mermaid) generated from source annotations.
 *
 * ### Factory Pattern
 *
 * Use `createArchitectureCodec(options)` to create a configured codec:
 * ```typescript
 * const codec = createArchitectureCodec({ diagramType: "component" });
 * const doc = codec.decode(dataset);
 * ```
 *
 * Or use the default export for standard behavior:
 * ```typescript
 * const doc = ArchitectureDocumentCodec.decode(dataset);
 * ```
 *
 * ### Supported Diagram Types
 *
 * - **component**: System overview with bounded context subgraphs
 * - **layered**: Components organized by architectural layer
 */
import { z } from "zod";
import { MasterDatasetSchema } from "../../validation-schemas/master-dataset.js";
import { type BaseCodecOptions } from "./types/base.js";
import { RenderableDocumentOutputSchema } from "./shared-schema.js";
/**
 * Diagram type for architecture visualization
 * - component: System overview with bounded context subgraphs
 * - layered: Components organized by architectural layer
 */
export type ArchitectureDiagramType = "component" | "layered";
/**
 * Options for ArchitectureDocumentCodec
 */
export interface ArchitectureCodecOptions extends BaseCodecOptions {
    /** Type of diagram to generate (default: "component") */
    diagramType?: ArchitectureDiagramType;
    /** Include component inventory table (default: true) */
    includeInventory?: boolean;
    /** Include legend for arrow styles (default: true) */
    includeLegend?: boolean;
    /** Filter to specific contexts (default: all contexts) */
    filterContexts?: string[];
}
/**
 * Default options for ArchitectureDocumentCodec
 */
export declare const DEFAULT_ARCHITECTURE_OPTIONS: Required<ArchitectureCodecOptions>;
/**
 * Create an ArchitectureDocumentCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Generate component diagram (default)
 * const codec = createArchitectureCodec();
 *
 * // Generate layered diagram
 * const codec = createArchitectureCodec({ diagramType: "layered" });
 *
 * // Filter to specific bounded contexts
 * const codec = createArchitectureCodec({ filterContexts: ["orders", "inventory"] });
 * ```
 */
export declare function createArchitectureCodec(options?: ArchitectureCodecOptions): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema>;
/**
 * Default Architecture Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for architecture diagrams.
 * Uses default options with component diagram type.
 *
 * @example
 * ```typescript
 * const doc = ArchitectureDocumentCodec.decode(masterDataset);
 * const markdown = renderToMarkdown(doc);
 * ```
 */
export declare const ArchitectureDocumentCodec: z.ZodCodec<z.ZodObject<{
    patterns: z.ZodArray<z.ZodObject<{
        id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
        name: z.ZodString;
        category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
        directive: z.ZodObject<{
            tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
            description: z.ZodDefault<z.ZodString>;
            examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            position: z.ZodObject<{
                startLine: z.ZodNumber;
                endLine: z.ZodNumber;
            }, z.core.$strict>;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extends: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        code: z.ZodString;
        source: z.ZodObject<{
            file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
            lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, z.core.$strict>;
        exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"function">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"type">;
            name: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"const">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"interface">;
            name: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"class">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"enum">;
            name: z.ZodString;
        }, z.core.$strict>], "type">>>>;
        extractedAt: z.ZodISODateTime;
        patternName: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            roadmap: "roadmap";
            active: "active";
            completed: "completed";
            deferred: "deferred";
            implemented: "implemented";
            partial: "partial";
            "in-progress": "in-progress";
        }>>;
        isCore: z.ZodOptional<z.ZodBoolean>;
        useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                docString: z.ZodOptional<z.ZodString>;
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
        }, z.core.$strict>>>>;
        phase: z.ZodOptional<z.ZodNumber>;
        release: z.ZodOptional<z.ZodString>;
        brief: z.ZodOptional<z.ZodString>;
        dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        extendsPattern: z.ZodOptional<z.ZodString>;
        seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        quarter: z.ZodOptional<z.ZodString>;
        completed: z.ZodOptional<z.ZodString>;
        effort: z.ZodOptional<z.ZodString>;
        team: z.ZodOptional<z.ZodString>;
        productArea: z.ZodOptional<z.ZodString>;
        userRole: z.ZodOptional<z.ZodString>;
        businessValue: z.ZodOptional<z.ZodString>;
        deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            status: z.ZodString;
            tests: z.ZodNumber;
            location: z.ZodString;
            finding: z.ZodOptional<z.ZodString>;
            release: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>>;
        workflow: z.ZodOptional<z.ZodString>;
        risk: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            epic: "epic";
            phase: "phase";
            task: "task";
        }>>;
        parent: z.ZodOptional<z.ZodString>;
        children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        adr: z.ZodOptional<z.ZodString>;
        adrStatus: z.ZodOptional<z.ZodEnum<{
            proposed: "proposed";
            accepted: "accepted";
            deprecated: "deprecated";
            superseded: "superseded";
        }>>;
        adrCategory: z.ZodOptional<z.ZodString>;
        adrSupersedes: z.ZodOptional<z.ZodString>;
        adrSupersededBy: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        behaviorFile: z.ZodOptional<z.ZodString>;
        behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
        rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            scenarioCount: z.ZodNumber;
            scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>>;
        archRole: z.ZodOptional<z.ZodString>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    tagRegistry: z.ZodObject<{
        $schema: z.ZodOptional<z.ZodString>;
        version: z.ZodDefault<z.ZodString>;
        categories: z.ZodArray<z.ZodObject<{
            tag: z.ZodString;
            domain: z.ZodString;
            priority: z.ZodNumber;
            description: z.ZodString;
            aliases: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        }, z.core.$strict>>;
        metadataTags: z.ZodArray<z.ZodObject<{
            tag: z.ZodString;
            format: z.ZodEnum<{
                number: "number";
                value: "value";
                enum: "enum";
                "quoted-value": "quoted-value";
                csv: "csv";
                flag: "flag";
            }>;
            purpose: z.ZodString;
            required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            repeatable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            values: z.ZodOptional<z.ZodArray<z.ZodString>>;
            default: z.ZodOptional<z.ZodString>;
            example: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        aggregationTags: z.ZodArray<z.ZodObject<{
            tag: z.ZodString;
            targetDoc: z.ZodNullable<z.ZodString>;
            purpose: z.ZodString;
        }, z.core.$strict>>;
        formatOptions: z.ZodDefault<z.ZodArray<z.ZodString>>;
        tagPrefix: z.ZodDefault<z.ZodString>;
        fileOptInTag: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>;
    byStatus: z.ZodObject<{
        completed: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        active: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        planned: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strip>;
    byPhase: z.ZodArray<z.ZodObject<{
        phaseNumber: z.ZodNumber;
        phaseName: z.ZodOptional<z.ZodString>;
        patterns: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        counts: z.ZodObject<{
            completed: z.ZodNumber;
            active: z.ZodNumber;
            planned: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    byQuarter: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
        name: z.ZodString;
        category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
        directive: z.ZodObject<{
            tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
            description: z.ZodDefault<z.ZodString>;
            examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            position: z.ZodObject<{
                startLine: z.ZodNumber;
                endLine: z.ZodNumber;
            }, z.core.$strict>;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extends: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        code: z.ZodString;
        source: z.ZodObject<{
            file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
            lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, z.core.$strict>;
        exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"function">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"type">;
            name: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"const">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"interface">;
            name: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"class">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"enum">;
            name: z.ZodString;
        }, z.core.$strict>], "type">>>>;
        extractedAt: z.ZodISODateTime;
        patternName: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            roadmap: "roadmap";
            active: "active";
            completed: "completed";
            deferred: "deferred";
            implemented: "implemented";
            partial: "partial";
            "in-progress": "in-progress";
        }>>;
        isCore: z.ZodOptional<z.ZodBoolean>;
        useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                docString: z.ZodOptional<z.ZodString>;
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
        }, z.core.$strict>>>>;
        phase: z.ZodOptional<z.ZodNumber>;
        release: z.ZodOptional<z.ZodString>;
        brief: z.ZodOptional<z.ZodString>;
        dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        extendsPattern: z.ZodOptional<z.ZodString>;
        seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        quarter: z.ZodOptional<z.ZodString>;
        completed: z.ZodOptional<z.ZodString>;
        effort: z.ZodOptional<z.ZodString>;
        team: z.ZodOptional<z.ZodString>;
        productArea: z.ZodOptional<z.ZodString>;
        userRole: z.ZodOptional<z.ZodString>;
        businessValue: z.ZodOptional<z.ZodString>;
        deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            status: z.ZodString;
            tests: z.ZodNumber;
            location: z.ZodString;
            finding: z.ZodOptional<z.ZodString>;
            release: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>>;
        workflow: z.ZodOptional<z.ZodString>;
        risk: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            epic: "epic";
            phase: "phase";
            task: "task";
        }>>;
        parent: z.ZodOptional<z.ZodString>;
        children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        adr: z.ZodOptional<z.ZodString>;
        adrStatus: z.ZodOptional<z.ZodEnum<{
            proposed: "proposed";
            accepted: "accepted";
            deprecated: "deprecated";
            superseded: "superseded";
        }>>;
        adrCategory: z.ZodOptional<z.ZodString>;
        adrSupersedes: z.ZodOptional<z.ZodString>;
        adrSupersededBy: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        behaviorFile: z.ZodOptional<z.ZodString>;
        behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
        rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            scenarioCount: z.ZodNumber;
            scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>>;
        archRole: z.ZodOptional<z.ZodString>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    byCategory: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
        name: z.ZodString;
        category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
        directive: z.ZodObject<{
            tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
            description: z.ZodDefault<z.ZodString>;
            examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            position: z.ZodObject<{
                startLine: z.ZodNumber;
                endLine: z.ZodNumber;
            }, z.core.$strict>;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extends: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        code: z.ZodString;
        source: z.ZodObject<{
            file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
            lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, z.core.$strict>;
        exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"function">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"type">;
            name: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"const">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"interface">;
            name: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"class">;
            name: z.ZodString;
            signature: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>, z.ZodObject<{
            type: z.ZodLiteral<"enum">;
            name: z.ZodString;
        }, z.core.$strict>], "type">>>>;
        extractedAt: z.ZodISODateTime;
        patternName: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            roadmap: "roadmap";
            active: "active";
            completed: "completed";
            deferred: "deferred";
            implemented: "implemented";
            partial: "partial";
            "in-progress": "in-progress";
        }>>;
        isCore: z.ZodOptional<z.ZodBoolean>;
        useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                docString: z.ZodOptional<z.ZodString>;
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
        }, z.core.$strict>>>>;
        phase: z.ZodOptional<z.ZodNumber>;
        release: z.ZodOptional<z.ZodString>;
        brief: z.ZodOptional<z.ZodString>;
        dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        extendsPattern: z.ZodOptional<z.ZodString>;
        seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        quarter: z.ZodOptional<z.ZodString>;
        completed: z.ZodOptional<z.ZodString>;
        effort: z.ZodOptional<z.ZodString>;
        team: z.ZodOptional<z.ZodString>;
        productArea: z.ZodOptional<z.ZodString>;
        userRole: z.ZodOptional<z.ZodString>;
        businessValue: z.ZodOptional<z.ZodString>;
        deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            status: z.ZodString;
            tests: z.ZodNumber;
            location: z.ZodString;
            finding: z.ZodOptional<z.ZodString>;
            release: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>>;
        workflow: z.ZodOptional<z.ZodString>;
        risk: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            epic: "epic";
            phase: "phase";
            task: "task";
        }>>;
        parent: z.ZodOptional<z.ZodString>;
        children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        adr: z.ZodOptional<z.ZodString>;
        adrStatus: z.ZodOptional<z.ZodEnum<{
            proposed: "proposed";
            accepted: "accepted";
            deprecated: "deprecated";
            superseded: "superseded";
        }>>;
        adrCategory: z.ZodOptional<z.ZodString>;
        adrSupersedes: z.ZodOptional<z.ZodString>;
        adrSupersededBy: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        behaviorFile: z.ZodOptional<z.ZodString>;
        behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
        rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            scenarioCount: z.ZodNumber;
            scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>>;
        archRole: z.ZodOptional<z.ZodString>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    bySource: z.ZodObject<{
        typescript: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        gherkin: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        roadmap: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        prd: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strip>;
    counts: z.ZodObject<{
        completed: z.ZodNumber;
        active: z.ZodNumber;
        planned: z.ZodNumber;
        total: z.ZodNumber;
    }, z.core.$strip>;
    phaseCount: z.ZodNumber;
    categoryCount: z.ZodNumber;
    relationshipIndex: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        uses: z.ZodArray<z.ZodString>;
        usedBy: z.ZodArray<z.ZodString>;
        dependsOn: z.ZodArray<z.ZodString>;
        enables: z.ZodArray<z.ZodString>;
        implementsPatterns: z.ZodArray<z.ZodString>;
        implementedBy: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            file: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        extendsPattern: z.ZodOptional<z.ZodString>;
        extendedBy: z.ZodArray<z.ZodString>;
        seeAlso: z.ZodArray<z.ZodString>;
        apiRef: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>>;
    archIndex: z.ZodOptional<z.ZodObject<{
        byRole: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        byContext: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        byLayer: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        all: z.ZodArray<z.ZodObject<{
            id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").PatternId, string>>;
            name: z.ZodString;
            category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../../index.js").CategoryName, string>>;
            directive: z.ZodObject<{
                tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").DirectiveTag, string>>>>;
                description: z.ZodDefault<z.ZodString>;
                examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                position: z.ZodObject<{
                    startLine: z.ZodNumber;
                    endLine: z.ZodNumber;
                }, z.core.$strict>;
                patternName: z.ZodOptional<z.ZodString>;
                status: z.ZodOptional<z.ZodEnum<{
                    roadmap: "roadmap";
                    active: "active";
                    completed: "completed";
                    deferred: "deferred";
                    implemented: "implemented";
                    partial: "partial";
                    "in-progress": "in-progress";
                }>>;
                isCore: z.ZodOptional<z.ZodBoolean>;
                useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                phase: z.ZodOptional<z.ZodNumber>;
                brief: z.ZodOptional<z.ZodString>;
                dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                implements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodString>;
                seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                quarter: z.ZodOptional<z.ZodString>;
                completed: z.ZodOptional<z.ZodString>;
                effort: z.ZodOptional<z.ZodString>;
                team: z.ZodOptional<z.ZodString>;
                workflow: z.ZodOptional<z.ZodString>;
                risk: z.ZodOptional<z.ZodString>;
                priority: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            code: z.ZodString;
            source: z.ZodObject<{
                file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../../index.js").SourceFilePath, string>>;
                lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strict>;
            exports: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"function">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"type">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"const">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"interface">;
                name: z.ZodString;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"class">;
                name: z.ZodString;
                signature: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>, z.ZodObject<{
                type: z.ZodLiteral<"enum">;
                name: z.ZodString;
            }, z.core.$strict>], "type">>>>;
            extractedAt: z.ZodISODateTime;
            patternName: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodEnum<{
                roadmap: "roadmap";
                active: "active";
                completed: "completed";
                deferred: "deferred";
                implemented: "implemented";
                partial: "partial";
                "in-progress": "in-progress";
            }>>;
            isCore: z.ZodOptional<z.ZodBoolean>;
            useCases: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            whenToUse: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            uses: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            usedBy: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            scenarios: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
                    docString: z.ZodOptional<z.ZodString>;
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
            }, z.core.$strict>>>>;
            phase: z.ZodOptional<z.ZodNumber>;
            release: z.ZodOptional<z.ZodString>;
            brief: z.ZodOptional<z.ZodString>;
            dependsOn: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            enables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            implementsPatterns: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extendsPattern: z.ZodOptional<z.ZodString>;
            seeAlso: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            apiRef: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            quarter: z.ZodOptional<z.ZodString>;
            completed: z.ZodOptional<z.ZodString>;
            effort: z.ZodOptional<z.ZodString>;
            team: z.ZodOptional<z.ZodString>;
            productArea: z.ZodOptional<z.ZodString>;
            userRole: z.ZodOptional<z.ZodString>;
            businessValue: z.ZodOptional<z.ZodString>;
            deliverables: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                status: z.ZodString;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                epic: "epic";
                phase: "phase";
                task: "task";
            }>>;
            parent: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredGaps: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredImprovements: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredRisks: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            discoveredLearnings: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            constraints: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            adr: z.ZodOptional<z.ZodString>;
            adrStatus: z.ZodOptional<z.ZodEnum<{
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
                superseded: "superseded";
            }>>;
            adrCategory: z.ZodOptional<z.ZodString>;
            adrSupersedes: z.ZodOptional<z.ZodString>;
            adrSupersededBy: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            behaviorFile: z.ZodOptional<z.ZodString>;
            behaviorFileVerified: z.ZodOptional<z.ZodBoolean>;
            rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                scenarioCount: z.ZodNumber;
                scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>>>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    title: z.ZodString;
    purpose: z.ZodOptional<z.ZodString>;
    detailLevel: z.ZodOptional<z.ZodString>;
    sections: z.ZodArray<z.ZodAny>;
    additionalFiles: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>>;
//# sourceMappingURL=architecture.d.ts.map