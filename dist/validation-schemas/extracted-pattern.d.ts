/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern ExtractedPatternSchema
 * @libar-docs-status completed
 * @libar-docs-uses DocDirectiveSchema
 * @libar-docs-used-by Generators, SectionRenderers
 *
 * ## ExtractedPatternSchema - Complete Pattern Validation
 *
 * Zod schema for validating complete extracted patterns with code,
 * metadata, relationships, and source information.
 *
 * ### When to Use
 *
 * - Use when validating extracted patterns from the extractor
 * - Use when serializing/deserializing pattern data
 */
import { z } from 'zod';
/**
 * Business rule extracted from Gherkin Rule: keyword
 *
 * This is the canonical definition used by:
 * - ExtractedPatternSchema.rules (this file)
 * - helpers.ts (rich content rendering)
 * - adr.ts (ADR document codec)
 *
 * Rules group scenarios under business rule statements with rich descriptions.
 * Used for PRD generation where business rules are more relevant than test scenarios.
 */
export declare const BusinessRuleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    scenarioCount: z.ZodNumber;
    scenarioNames: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/**
 * Business rule type inferred from schema
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type BusinessRule = z.infer<typeof BusinessRuleSchema>;
/**
 * Source information schema
 */
export declare const SourceInfoSchema: z.ZodObject<{
    file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../index.js").SourceFilePath, string>>;
    lines: z.ZodReadonly<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
}, z.core.$strict>;
export type SourceInfo = z.infer<typeof SourceInfoSchema>;
/**
 * Complete extracted pattern with code and metadata
 *
 * Schema enforces:
 * - Valid pattern ID format (pattern-{8-char-hex})
 * - Non-empty name and code
 * - Normalized category names
 * - Valid TypeScript source file
 * - ISO 8601 timestamp
 * - Strict mode to prevent extra fields
 */
export declare const ExtractedPatternSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodString, z.ZodTransform<import("../index.js").PatternId, string>>;
    name: z.ZodString;
    category: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodTransform<import("../index.js").CategoryName, string>>;
    directive: z.ZodObject<{
        tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../index.js").DirectiveTag, string>>>>;
        description: z.ZodDefault<z.ZodString>;
        examples: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
        position: z.ZodObject<{
            startLine: z.ZodNumber;
            endLine: z.ZodNumber;
        }, z.core.$strict>;
        patternName: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            active: "active";
            roadmap: "roadmap";
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
    }, z.core.$strict>;
    code: z.ZodString;
    source: z.ZodObject<{
        file: z.ZodPipe<z.ZodString, z.ZodTransform<import("../index.js").SourceFilePath, string>>;
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
        active: "active";
        roadmap: "roadmap";
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
    archRole: z.ZodOptional<z.ZodString>;
    archContext: z.ZodOptional<z.ZodString>;
    archLayer: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/**
 * Type alias inferred from schema
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type ExtractedPattern = z.infer<typeof ExtractedPatternSchema>;
/**
 * Runtime type guard for ExtractedPattern
 *
 * @param value - Value to check
 * @returns True if value conforms to ExtractedPattern schema
 *
 * @example
 * ```typescript
 * if (isExtractedPattern(parsed)) {
 *   console.log(parsed.id); // Type-safe access
 * }
 * ```
 */
export declare function isExtractedPattern(value: unknown): value is ExtractedPattern;
//# sourceMappingURL=extracted-pattern.d.ts.map