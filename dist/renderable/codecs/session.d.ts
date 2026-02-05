/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SessionCodec
 * @libar-docs-status completed
 *
 * ## Session Document Codec
 *
 * Transforms MasterDataset into RenderableDocuments for session/planning outputs:
 * - SESSION-CONTEXT.md (current session context)
 * - REMAINING-WORK.md (incomplete work aggregation)
 *
 * ### When to Use
 *
 * - When generating session context for Claude Code integration
 * - When tracking remaining work and incomplete deliverables
 * - When building session handoff documentation
 *
 * ### Factory Pattern
 *
 * Use factory functions for custom options:
 * ```typescript
 * const codec = createSessionContextCodec({ includeRelatedPatterns: true });
 * const remainingCodec = createRemainingWorkCodec({ sortBy: "priority" });
 * ```
 */
import { z } from 'zod';
import { MasterDatasetSchema } from '../../validation-schemas/master-dataset.js';
import { type BaseCodecOptions } from './types/base.js';
/**
 * Options for SessionContextCodec
 */
export interface SessionCodecOptions extends BaseCodecOptions {
    /** Include acceptance criteria (default: true) */
    includeAcceptanceCriteria?: boolean;
    /** Include dependencies (default: true) */
    includeDependencies?: boolean;
    /** Include deliverables (default: true) */
    includeDeliverables?: boolean;
    /** Include related patterns (default: false) */
    includeRelatedPatterns?: boolean;
    /** Include handoff context (default: true) */
    includeHandoffContext?: boolean;
}
/**
 * Default options for SessionContextCodec
 */
export declare const DEFAULT_SESSION_OPTIONS: Required<SessionCodecOptions>;
/**
 * Options for RemainingWorkCodec
 */
export interface RemainingWorkCodecOptions extends BaseCodecOptions {
    /** Include incomplete items (default: true) */
    includeIncomplete?: boolean;
    /** Include blocked items (default: true) */
    includeBlocked?: boolean;
    /** Include next actionable items (default: true) */
    includeNextActionable?: boolean;
    /** Maximum next actionable items to show (default: 5) */
    maxNextActionable?: number;
    /** Include statistics (default: true) */
    includeStats?: boolean;
    /** Sort by (default: "phase") */
    sortBy?: 'phase' | 'priority' | 'effort' | 'quarter';
    /** Group planned items by (default: "none") */
    groupPlannedBy?: 'quarter' | 'priority' | 'level' | 'none';
}
/**
 * Default options for RemainingWorkCodec
 */
export declare const DEFAULT_REMAINING_WORK_OPTIONS: Required<RemainingWorkCodecOptions>;
import { RenderableDocumentOutputSchema } from './shared-schema.js';
/**
 * Create a SessionContextCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Include related patterns
 * const codec = createSessionContextCodec({ includeRelatedPatterns: true });
 *
 * // Disable detail files for compact output
 * const codec = createSessionContextCodec({ generateDetailFiles: false });
 * ```
 */
export declare function createSessionContextCodec(options?: SessionCodecOptions): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema>;
/**
 * Default Session Context Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for session context.
 * Shows current phase focus, active work, and planning context.
 */
export declare const SessionContextCodec: z.ZodCodec<z.ZodObject<{
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
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
            completed: "completed";
            roadmap: "roadmap";
            active: "active";
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
                domain: "domain";
                unknown: "unknown";
                timeline: "timeline";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            decider: "decider";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            "command-handler": "command-handler";
            repository: "repository";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                enum: "enum";
                type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
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
            completed: "completed";
            roadmap: "roadmap";
            active: "active";
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
                domain: "domain";
                unknown: "unknown";
                timeline: "timeline";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            decider: "decider";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            "command-handler": "command-handler";
            repository: "repository";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                enum: "enum";
                type: "type";
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
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
            completed: "completed";
            roadmap: "roadmap";
            active: "active";
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
                domain: "domain";
                unknown: "unknown";
                timeline: "timeline";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            decider: "decider";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            "command-handler": "command-handler";
            repository: "repository";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                enum: "enum";
                type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
/**
 * Create a RemainingWorkCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Sort by priority instead of phase
 * const codec = createRemainingWorkCodec({ sortBy: "priority" });
 *
 * // Group planned items by quarter
 * const codec = createRemainingWorkCodec({ groupPlannedBy: "quarter" });
 * ```
 */
export declare function createRemainingWorkCodec(options?: RemainingWorkCodecOptions): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema>;
/**
 * Default Remaining Work Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for remaining work.
 * Aggregates all incomplete work across phases.
 */
export declare const RemainingWorkCodec: z.ZodCodec<z.ZodObject<{
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
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
            completed: "completed";
            roadmap: "roadmap";
            active: "active";
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
                domain: "domain";
                unknown: "unknown";
                timeline: "timeline";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            decider: "decider";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            "command-handler": "command-handler";
            repository: "repository";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                enum: "enum";
                type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
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
            completed: "completed";
            roadmap: "roadmap";
            active: "active";
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
                domain: "domain";
                unknown: "unknown";
                timeline: "timeline";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            decider: "decider";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            "command-handler": "command-handler";
            repository: "repository";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                enum: "enum";
                type: "type";
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
            archRole: z.ZodOptional<z.ZodString>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodString>;
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
            completed: "completed";
            roadmap: "roadmap";
            active: "active";
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
                domain: "domain";
                unknown: "unknown";
                timeline: "timeline";
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
        archRole: z.ZodOptional<z.ZodEnum<{
            "bounded-context": "bounded-context";
            decider: "decider";
            projection: "projection";
            saga: "saga";
            "process-manager": "process-manager";
            infrastructure: "infrastructure";
            "command-handler": "command-handler";
            repository: "repository";
            "read-model": "read-model";
            service: "service";
        }>>;
        archContext: z.ZodOptional<z.ZodString>;
        archLayer: z.ZodOptional<z.ZodEnum<{
            domain: "domain";
            infrastructure: "infrastructure";
            application: "application";
        }>>;
        extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            kind: z.ZodEnum<{
                function: "function";
                enum: "enum";
                type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
                    completed: "completed";
                    roadmap: "roadmap";
                    active: "active";
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
                archRole: z.ZodOptional<z.ZodString>;
                archContext: z.ZodOptional<z.ZodString>;
                archLayer: z.ZodOptional<z.ZodString>;
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
                completed: "completed";
                roadmap: "roadmap";
                active: "active";
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
                    domain: "domain";
                    unknown: "unknown";
                    timeline: "timeline";
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
            archRole: z.ZodOptional<z.ZodEnum<{
                "bounded-context": "bounded-context";
                decider: "decider";
                projection: "projection";
                saga: "saga";
                "process-manager": "process-manager";
                infrastructure: "infrastructure";
                "command-handler": "command-handler";
                repository: "repository";
                "read-model": "read-model";
                service: "service";
            }>>;
            archContext: z.ZodOptional<z.ZodString>;
            archLayer: z.ZodOptional<z.ZodEnum<{
                domain: "domain";
                infrastructure: "infrastructure";
                application: "application";
            }>>;
            extractedShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                kind: z.ZodEnum<{
                    function: "function";
                    enum: "enum";
                    type: "type";
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
//# sourceMappingURL=session.d.ts.map