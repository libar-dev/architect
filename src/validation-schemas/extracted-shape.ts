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

// =============================================================================
// Shape Kind Enum
// =============================================================================

/**
 * Kind of TypeScript construct that was extracted.
 */
export const ShapeKindSchema = z.enum(['interface', 'type', 'enum', 'function', 'const']);

export type ShapeKind = z.infer<typeof ShapeKindSchema>;

// =============================================================================
// Property Documentation Schema
// =============================================================================

/**
 * JSDoc documentation for an interface property.
 *
 * Used to capture property-level documentation from interfaces,
 * enabling generation of description tables alongside code blocks.
 */
export const PropertyDocSchema = z.object({
  /** Property name */
  name: z.string(),

  /** JSDoc comment text (without delimiters) */
  jsDoc: z.string(),
});

export type PropertyDoc = z.infer<typeof PropertyDocSchema>;

// =============================================================================
// JSDoc Tag Documentation Schemas (DD-3)
// =============================================================================

/**
 * JSDoc @param tag documentation for a function parameter.
 */
export const ParamDocSchema = z.object({
  /** Parameter name */
  name: z.string(),

  /** Type annotation from JSDoc {Type} syntax (optional in TypeScript) */
  type: z.string().optional(),

  /** Parameter description */
  description: z.string(),
});

export type ParamDoc = z.infer<typeof ParamDocSchema>;

/**
 * JSDoc @returns tag documentation.
 */
export const ReturnsDocSchema = z.object({
  /** Return type from JSDoc {Type} syntax (optional in TypeScript) */
  type: z.string().optional(),

  /** Return value description */
  description: z.string(),
});

export type ReturnsDoc = z.infer<typeof ReturnsDocSchema>;

/**
 * JSDoc @throws tag documentation.
 */
export const ThrowsDocSchema = z.object({
  /** Exception type from JSDoc {Type} syntax */
  type: z.string().optional(),

  /** Description of when this exception is thrown */
  description: z.string(),
});

export type ThrowsDoc = z.infer<typeof ThrowsDocSchema>;

// =============================================================================
// Extracted Shape Schema
// =============================================================================

/**
 * A single extracted shape from TypeScript source.
 *
 * Represents an interface, type alias, enum, function signature, or const
 * that was extracted via @libar-docs-extract-shapes for documentation.
 */
export const ExtractedShapeSchema = z.object({
  /** Shape name (interface/type/enum/function name) */
  name: z.string().min(1, 'Shape name cannot be empty'),

  /** Kind of TypeScript construct */
  kind: ShapeKindSchema,

  /** Extracted source text (exact from file) */
  sourceText: z.string(),

  /** JSDoc comment above the shape, if present */
  jsDoc: z.string().optional(),

  /** Line number in source file */
  lineNumber: z.number().int().positive(),

  /** Generic type parameters, if any (e.g., ["T", "E = Error"]) */
  typeParameters: z.array(z.string()).readonly().optional(),

  /** For interfaces: what it extends (e.g., ["BaseConfig", "Serializable"]) */
  extends: z.array(z.string()).readonly().optional(),

  /** For functions: overload signatures (excludes implementation signature) */
  overloads: z.array(z.string()).readonly().optional(),

  /** Whether this is an exported shape */
  exported: z.boolean().default(true),

  /** For interfaces: JSDoc documentation for each property */
  propertyDocs: z.array(PropertyDocSchema).readonly().optional(),

  /** DD-3: For functions: documented @param tags from JSDoc */
  params: z.array(ParamDocSchema).readonly().optional(),

  /** DD-3: For functions: documented @returns tag from JSDoc */
  returns: ReturnsDocSchema.optional(),

  /** DD-3: For functions: documented @throws tags from JSDoc */
  throws: z.array(ThrowsDocSchema).readonly().optional(),
});

/**
 * Type alias inferred from schema.
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type ExtractedShape = z.infer<typeof ExtractedShapeSchema>;

// =============================================================================
// Re-exported Shape Schema
// =============================================================================

/**
 * Information about a shape that was re-exported from another file.
 *
 * Re-exports are treated like imports - not extracted, but tracked
 * so we can provide helpful warnings with source module info.
 */
export const ReExportedShapeSchema = z.object({
  /** The shape name that was re-exported */
  name: z.string(),

  /** The source module path (e.g., './types.js') */
  sourceModule: z.string(),

  /** Whether it's a type-only re-export (export type { ... }) */
  typeOnly: z.boolean().default(false),
});

export type ReExportedShape = z.infer<typeof ReExportedShapeSchema>;

// =============================================================================
// Shape Extraction Result Schema
// =============================================================================

/**
 * Result of shape extraction from a file.
 */
export const ShapeExtractionResultSchema = z.object({
  /** Successfully extracted shapes, in requested order */
  shapes: z.array(ExtractedShapeSchema).readonly(),

  /** Shape names that were requested but not found */
  notFound: z.array(z.string()).readonly(),

  /** Shape names that exist but are imports (not defined in file) */
  imported: z.array(z.string()).readonly(),

  /** Shape names that are re-exported from other files */
  reExported: z.array(ReExportedShapeSchema).readonly(),

  /** Any warnings generated during extraction */
  warnings: z.array(z.string()).readonly(),
});

export type ShapeExtractionResult = z.infer<typeof ShapeExtractionResultSchema>;

// =============================================================================
// Shape Extraction Options Schema
// =============================================================================

/**
 * Options for shape extraction.
 */
export const ShapeExtractionOptionsSchema = z.object({
  /** Include JSDoc comments in extraction (default: true) */
  includeJsDoc: z.boolean().default(true),

  /** For functions, include full signature or just name+params (default: 'signature') */
  functionDetail: z.enum(['signature', 'name-only']).default('signature'),

  /** Preserve original formatting vs normalize (default: true) */
  preserveFormatting: z.boolean().default(true),
});

/** Output type with all defaults applied */
export type ShapeExtractionOptions = z.infer<typeof ShapeExtractionOptionsSchema>;

/** Input type for function parameters (all fields optional with defaults) */
export type ShapeExtractionOptionsInput = z.input<typeof ShapeExtractionOptionsSchema>;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Runtime type guard for ExtractedShape
 */
export function isExtractedShape(value: unknown): value is ExtractedShape {
  return ExtractedShapeSchema.safeParse(value).success;
}

/**
 * Runtime type guard for ShapeExtractionResult
 */
export function isShapeExtractionResult(value: unknown): value is ShapeExtractionResult {
  return ShapeExtractionResultSchema.safeParse(value).success;
}
