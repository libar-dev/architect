/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DocDirectiveSchema
 * @libar-docs-status completed
 * @libar-docs-implements MvpWorkflowImplementation
 * @libar-docs-used-by DocExtractor, ExtractedPatternSchema
 *
 * ## DocDirectiveSchema - Parsed JSDoc Directive Validation
 *
 * Zod schemas for validating parsed @libar-docs-* directives from JSDoc comments.
 * Enforces tag format, position validity, and metadata extraction.
 *
 * ### When to Use
 *
 * - Use when parsing JSDoc comments for @libar-docs-* tags
 * - Use when validating directive structure at boundaries
 */
import { z } from 'zod';
import { type AcceptedStatusValue } from '../taxonomy/index.js';
import type { TagRegistry } from './tag-registry.js';
/**
 * Position information for a directive in source code
 */
export declare const PositionSchema: z.ZodObject<{
    startLine: z.ZodNumber;
    endLine: z.ZodNumber;
}, z.core.$strict>;
export type Position = z.infer<typeof PositionSchema>;
/**
 * Creates a DirectiveTag schema for a given tag prefix.
 * This factory enables projects to use custom prefixes (e.g., "@docs-" instead of "@libar-docs-").
 *
 * @param tagPrefix - The tag prefix to validate against (e.g., "@docs-" or "@libar-docs-")
 * @returns Zod schema that validates and transforms tags with the given prefix
 *
 * @example
 * ```typescript
 * // Custom prefix
 * const customSchema = createDirectiveTagSchema("@docs-");
 * customSchema.parse("@docs-pattern"); // Valid
 *
 * // Default prefix
 * const defaultSchema = createDirectiveTagSchema("@libar-docs-");
 * defaultSchema.parse("@libar-docs-status"); // Valid
 * ```
 */
export declare function createDirectiveTagSchema(tagPrefix: string): z.ZodPipe<z.ZodString, z.ZodTransform<import("../index.js").DirectiveTag, string>>;
/**
 * Default status values for pattern implementation state
 *
 * Uses the single source of truth from taxonomy module (PDR-005 FSM).
 * For registry-based status validation, use createPatternStatusSchema().
 *
 * @see src/taxonomy/status-values.ts
 */
export declare const DefaultPatternStatusSchema: z.ZodEnum<{
    roadmap: "roadmap";
    active: "active";
    completed: "completed";
    deferred: "deferred";
}>;
/**
 * Extended status values accepted for directive validation
 *
 * Accepts FSM states + legacy values (implemented, partial, in-progress).
 * Legacy values are normalized to FSM states via normalizeStatus().
 *
 * @see src/taxonomy/status-values.ts
 * @see src/taxonomy/normalized-status.ts
 */
export declare const AcceptedPatternStatusSchema: z.ZodEnum<{
    roadmap: "roadmap";
    active: "active";
    completed: "completed";
    deferred: "deferred";
}>;
/**
 * Pattern status schema for directive validation
 *
 * Uses AcceptedPatternStatusSchema to allow legacy values.
 * Legacy values are normalized to display values via normalizeStatus().
 */
export declare const PatternStatusSchema: z.ZodEnum<{
    roadmap: "roadmap";
    active: "active";
    completed: "completed";
    deferred: "deferred";
}>;
export type PatternStatus = AcceptedStatusValue;
/**
 * Create pattern status schema from tag registry
 *
 * Builds a Zod enum schema using status values defined in the registry's
 * metadata tags. Falls back to default schema if "status" tag not found in registry.
 *
 * @param registry - Tag registry containing metadata tag definitions
 * @returns Zod enum schema for pattern status validation
 *
 * @example
 * ```typescript
 * const config = await loadConfig();
 * const statusSchema = createPatternStatusSchema(config.tagRegistry);
 * const result = statusSchema.safeParse("completed"); // Validates against registry values
 * ```
 */
export declare function createPatternStatusSchema(registry: TagRegistry): z.ZodType<string>;
/**
 * Parsed @libar-docs-* directive from JSDoc comment
 *
 * Schema enforces:
 * - At least one tag
 * - Valid position with endLine >= startLine
 * - Strict mode to prevent extra fields
 *
 * Description defaults to empty string to allow tag-only directives:
 * ```typescript
 * /**
 *  * @libar-docs-core
 *  *\/
 * export function myFunction() {}
 * ```
 */
export declare const DocDirectiveSchema: z.ZodObject<{
    tags: z.ZodReadonly<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<import("../index.js").DirectiveTag, string>>>>;
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
    archRole: z.ZodOptional<z.ZodString>;
    archContext: z.ZodOptional<z.ZodString>;
    archLayer: z.ZodOptional<z.ZodString>;
    extractShapes: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
}, z.core.$strict>;
/**
 * Type alias inferred from schema
 *
 * **Schema-First Law**: Always infer types from schemas,
 * never define types separately to avoid duplication.
 */
export type DocDirective = z.infer<typeof DocDirectiveSchema>;
/**
 * Runtime type guard for DocDirective
 *
 * @param value - Value to check
 * @returns True if value conforms to DocDirective schema
 *
 * @example
 * ```typescript
 * if (isDocDirective(parsed)) {
 *   console.log(parsed.tags); // Type-safe access
 * }
 * ```
 */
export declare function isDocDirective(value: unknown): value is DocDirective;
//# sourceMappingURL=doc-directive.d.ts.map