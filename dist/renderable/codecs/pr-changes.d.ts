/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern PrChangesCodec
 * @libar-docs-status completed
 *
 * ## PR Changes Document Codec
 *
 * Transforms MasterDataset into RenderableDocument for PR-scoped output.
 * Filters patterns by changed files and/or release version tags.
 *
 * ### When to Use
 *
 * - When generating PR summaries filtered by changed files
 * - When creating release-scoped documentation for PR reviews
 * - When building CI/CD outputs focused on PR scope
 *
 * ### Factory Pattern
 *
 * Use `createPrChangesCodec(options)` for custom options:
 * ```typescript
 * const codec = createPrChangesCodec({
 *   changedFiles: ['src/commands/order.ts'],
 *   releaseFilter: 'v1.0.0',
 * });
 * const doc = codec.decode(dataset);
 * ```
 *
 * ### Scope Filtering
 *
 * PR Changes codec filters patterns by:
 * 1. Changed files (matches against pattern.filePath)
 * 2. Release version (matches against deliverable.release tags)
 *
 * If both are specified, patterns must match at least one criterion.
 */
import { z } from 'zod';
import { MasterDatasetSchema } from '../../validation-schemas/master-dataset.js';
import { type BaseCodecOptions } from './types/base.js';
/**
 * Options for PrChangesCodec
 *
 * NOTE: changedFiles is required for PR scope filtering
 */
export interface PrChangesCodecOptions extends BaseCodecOptions {
    /** Files changed in this PR (required for PR scope) */
    changedFiles?: string[];
    /** Release version filter (e.g., "v1.0.0") */
    releaseFilter?: string;
    /** Include deliverables (default: true) */
    includeDeliverables?: boolean;
    /** Include review checklist (default: true) */
    includeReviewChecklist?: boolean;
    /** Include business value (default: true) */
    includeBusinessValue?: boolean;
    /** Include dependencies (default: true) */
    includeDependencies?: boolean;
    /** Sort by (default: "phase") */
    sortBy?: 'phase' | 'priority' | 'workflow';
}
/**
 * Default options for PrChangesCodec
 */
export declare const DEFAULT_PR_CHANGES_OPTIONS: Required<PrChangesCodecOptions>;
import { RenderableDocumentOutputSchema } from './shared-schema.js';
/**
 * Create a PrChangesCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Filter by changed files in PR
 * const codec = createPrChangesCodec({
 *   changedFiles: ['src/commands/order.ts', 'src/events/order.ts'],
 * });
 *
 * // Filter by release version
 * const codec = createPrChangesCodec({ releaseFilter: 'v1.0.0' });
 *
 * // Combine both filters
 * const codec = createPrChangesCodec({
 *   changedFiles: ['src/commands/order.ts'],
 *   releaseFilter: 'v1.0.0',
 * });
 * ```
 */
export declare function createPrChangesCodec(options?: PrChangesCodecOptions): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema>;
/**
 * Default PR Changes Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for PR changes.
 * Without options, shows all patterns (no filtering).
 */
export declare const PrChangesCodec: z.ZodCodec<z.ZodObject<{
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
            target: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strict>>>>;
            layer: z.ZodOptional<z.ZodEnum<{
                unknown: "unknown";
                timeline: "timeline";
                domain: "domain";
                integration: "integration";
                e2e: "e2e";
                component: "component";
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
        targetPath: z.ZodOptional<z.ZodString>;
        since: z.ZodOptional<z.ZodString>;
        convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
            status: z.ZodEnum<{
                deferred: "deferred";
                complete: "complete";
                "in-progress": "in-progress";
                pending: "pending";
                superseded: "superseded";
                "n/a": "n/a";
            }>;
            tests: z.ZodNumber;
            location: z.ZodString;
            finding: z.ZodOptional<z.ZodString>;
            release: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>>;
        workflow: z.ZodOptional<z.ZodString>;
        risk: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            phase: "phase";
            epic: "epic";
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
            superseded: "superseded";
            proposed: "proposed";
            accepted: "accepted";
            deprecated: "deprecated";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            "command-handler": "command-handler";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            repository: "repository";
            decider: "decider";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                type: "type";
                enum: "enum";
                const: "const";
                interface: "interface";
            }>;
            sourceText: z.ZodString;
            jsDoc: z.ZodOptional<z.ZodString>;
            lineNumber: z.ZodNumber;
            typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            exported: z.ZodDefault<z.ZodBoolean>;
            propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                jsDoc: z.ZodString;
            }, z.core.$strip>>>>;
        }, z.core.$strip>>>>;
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
                enum: "enum";
                value: "value";
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
            target: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strict>>>>;
            layer: z.ZodOptional<z.ZodEnum<{
                unknown: "unknown";
                timeline: "timeline";
                domain: "domain";
                integration: "integration";
                e2e: "e2e";
                component: "component";
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
        targetPath: z.ZodOptional<z.ZodString>;
        since: z.ZodOptional<z.ZodString>;
        convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
            status: z.ZodEnum<{
                deferred: "deferred";
                complete: "complete";
                "in-progress": "in-progress";
                pending: "pending";
                superseded: "superseded";
                "n/a": "n/a";
            }>;
            tests: z.ZodNumber;
            location: z.ZodString;
            finding: z.ZodOptional<z.ZodString>;
            release: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>>;
        workflow: z.ZodOptional<z.ZodString>;
        risk: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            phase: "phase";
            epic: "epic";
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
            superseded: "superseded";
            proposed: "proposed";
            accepted: "accepted";
            deprecated: "deprecated";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            "command-handler": "command-handler";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            repository: "repository";
            decider: "decider";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                type: "type";
                enum: "enum";
                const: "const";
                interface: "interface";
            }>;
            sourceText: z.ZodString;
            jsDoc: z.ZodOptional<z.ZodString>;
            lineNumber: z.ZodNumber;
            typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            exported: z.ZodDefault<z.ZodBoolean>;
            propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                jsDoc: z.ZodString;
            }, z.core.$strip>>>>;
        }, z.core.$strip>>>>;
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
            target: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strict>>>>;
            layer: z.ZodOptional<z.ZodEnum<{
                unknown: "unknown";
                timeline: "timeline";
                domain: "domain";
                integration: "integration";
                e2e: "e2e";
                component: "component";
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
        targetPath: z.ZodOptional<z.ZodString>;
        since: z.ZodOptional<z.ZodString>;
        convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
            status: z.ZodEnum<{
                deferred: "deferred";
                complete: "complete";
                "in-progress": "in-progress";
                pending: "pending";
                superseded: "superseded";
                "n/a": "n/a";
            }>;
            tests: z.ZodNumber;
            location: z.ZodString;
            finding: z.ZodOptional<z.ZodString>;
            release: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>>;
        workflow: z.ZodOptional<z.ZodString>;
        risk: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            phase: "phase";
            epic: "epic";
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
            superseded: "superseded";
            proposed: "proposed";
            accepted: "accepted";
            deprecated: "deprecated";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            "command-handler": "command-handler";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            repository: "repository";
            decider: "decider";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                type: "type";
                enum: "enum";
                const: "const";
                interface: "interface";
            }>;
            sourceText: z.ZodString;
            jsDoc: z.ZodOptional<z.ZodString>;
            lineNumber: z.ZodNumber;
            typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            exported: z.ZodDefault<z.ZodBoolean>;
            propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                jsDoc: z.ZodString;
            }, z.core.$strip>>>>;
        }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
        }, z.core.$strict>>>;
        byView: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
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
                target: z.ZodOptional<z.ZodString>;
                since: z.ZodOptional<z.ZodString>;
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
                archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>>;
                layer: z.ZodOptional<z.ZodEnum<{
                    unknown: "unknown";
                    timeline: "timeline";
                    domain: "domain";
                    integration: "integration";
                    e2e: "e2e";
                    component: "component";
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
            targetPath: z.ZodOptional<z.ZodString>;
            since: z.ZodOptional<z.ZodString>;
            convention: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
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
                status: z.ZodEnum<{
                    deferred: "deferred";
                    complete: "complete";
                    "in-progress": "in-progress";
                    pending: "pending";
                    superseded: "superseded";
                    "n/a": "n/a";
                }>;
                tests: z.ZodNumber;
                location: z.ZodString;
                finding: z.ZodOptional<z.ZodString>;
                release: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>>>;
            workflow: z.ZodOptional<z.ZodString>;
            risk: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodString>;
            level: z.ZodOptional<z.ZodEnum<{
                phase: "phase";
                epic: "epic";
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
                superseded: "superseded";
                proposed: "proposed";
                accepted: "accepted";
                deprecated: "deprecated";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                "command-handler": "command-handler";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                repository: "repository";
                decider: "decider";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            archView: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    type: "type";
                    enum: "enum";
                    const: "const";
                    interface: "interface";
                }>;
                sourceText: z.ZodString;
                jsDoc: z.ZodOptional<z.ZodString>;
                lineNumber: z.ZodNumber;
                typeParameters: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                extends: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                overloads: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
                exported: z.ZodDefault<z.ZodBoolean>;
                propertyDocs: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    jsDoc: z.ZodString;
                }, z.core.$strip>>>>;
            }, z.core.$strip>>>>;
        }, z.core.$strict>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    title: z.ZodString;
    purpose: z.ZodOptional<z.ZodString>;
    detailLevel: z.ZodOptional<z.ZodString>;
    sections: z.ZodArray<z.ZodAny>;
    additionalFiles: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>>;
//# sourceMappingURL=pr-changes.d.ts.map