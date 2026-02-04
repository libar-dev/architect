/**
 * @libar-docs
 * @libar-docs-pattern ExtractedShapeSchema
 * @libar-docs-status completed
 * @libar-docs-implements ShapeExtraction
 *
 * ## ExtractedShape Schema
 *
 * Zod schema for TypeScript type definitions extracted from source files
 * via the @libar-docs-extract-shapes tag.
 *
 * ### When to Use
 *
 * - When validating shapes extracted by the shape extractor
 * - When serializing/deserializing shape data for documentation generation
 * - When rendering API types in documentation codecs
 */
import { z } from 'zod';
/**
 * Kind of TypeScript construct that was extracted.
 */
export declare const ShapeKindSchema: z.ZodEnum<{
    function: "function";
    type: "type";
    enum: "enum";
    const: "const";
    interface: "interface";
}>;
export type ShapeKind = z.infer<typeof ShapeKindSchema>;
/**
 * A single extracted shape from TypeScript source.
 *
 * Represents an interface, type alias, enum, function signature, or const
 * that was extracted via @libar-docs-extract-shapes for documentation.
 */
export declare const ExtractedShapeSchema: z.ZodObject<{
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
}, z.core.$strip>;
/**
 * Type alias inferred from schema.
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type ExtractedShape = z.infer<typeof ExtractedShapeSchema>;
/**
 * Information about a shape that was re-exported from another file.
 *
 * Re-exports are treated like imports - not extracted, but tracked
 * so we can provide helpful warnings with source module info.
 */
export declare const ReExportedShapeSchema: z.ZodObject<{
    name: z.ZodString;
    sourceModule: z.ZodString;
    typeOnly: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type ReExportedShape = z.infer<typeof ReExportedShapeSchema>;
/**
 * Result of shape extraction from a file.
 */
export declare const ShapeExtractionResultSchema: z.ZodObject<{
    shapes: z.ZodReadonly<z.ZodArray<z.ZodObject<{
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
    }, z.core.$strip>>>;
    notFound: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    imported: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    reExported: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        sourceModule: z.ZodString;
        typeOnly: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    warnings: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type ShapeExtractionResult = z.infer<typeof ShapeExtractionResultSchema>;
/**
 * Options for shape extraction.
 */
export declare const ShapeExtractionOptionsSchema: z.ZodObject<{
    includeJsDoc: z.ZodDefault<z.ZodBoolean>;
    functionDetail: z.ZodDefault<z.ZodEnum<{
        signature: "signature";
        "name-only": "name-only";
    }>>;
    preserveFormatting: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
/** Output type with all defaults applied */
export type ShapeExtractionOptions = z.infer<typeof ShapeExtractionOptionsSchema>;
/** Input type for function parameters (all fields optional with defaults) */
export type ShapeExtractionOptionsInput = z.input<typeof ShapeExtractionOptionsSchema>;
/**
 * Runtime type guard for ExtractedShape
 */
export declare function isExtractedShape(value: unknown): value is ExtractedShape;
/**
 * Runtime type guard for ShapeExtractionResult
 */
export declare function isShapeExtractionResult(value: unknown): value is ShapeExtractionResult;
//# sourceMappingURL=extracted-shape.d.ts.map