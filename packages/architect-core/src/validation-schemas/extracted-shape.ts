import { z } from 'zod';

export const ShapeKindSchema = z.enum(['interface', 'type', 'enum', 'function', 'const']);

export type ShapeKind = z.infer<typeof ShapeKindSchema>;

export const PropertyDocSchema = z.strictObject({
  name: z.string(),
  jsDoc: z.string(),
});

export type PropertyDoc = z.infer<typeof PropertyDocSchema>;

export const ParamDocSchema = z.strictObject({
  name: z.string(),
  type: z.string().optional(),
  description: z.string(),
});

export type ParamDoc = z.infer<typeof ParamDocSchema>;

export const ReturnsDocSchema = z.strictObject({
  type: z.string().optional(),
  description: z.string(),
});

export type ReturnsDoc = z.infer<typeof ReturnsDocSchema>;

export const ThrowsDocSchema = z.strictObject({
  type: z.string().optional(),
  description: z.string(),
});

export type ThrowsDoc = z.infer<typeof ThrowsDocSchema>;

export const ExtractedShapeSchema = z.strictObject({
  name: z.string().min(1, 'Shape name cannot be empty'),
  kind: ShapeKindSchema,
  sourceText: z.string(),
  jsDoc: z.string().optional(),
  lineNumber: z.number().int().positive(),
  typeParameters: z.array(z.string()).readonly().optional(),
  extends: z.array(z.string()).readonly().optional(),
  overloads: z.array(z.string()).readonly().optional(),
  exported: z.boolean().default(true),
  group: z.string().optional(),
  includes: z.array(z.string().min(1)).readonly().optional(),
  propertyDocs: z.array(PropertyDocSchema).readonly().optional(),
  params: z.array(ParamDocSchema).readonly().optional(),
  returns: ReturnsDocSchema.optional(),
  throws: z.array(ThrowsDocSchema).readonly().optional(),
});

export type ExtractedShape = z.infer<typeof ExtractedShapeSchema>;

export const ReExportedShapeSchema = z.strictObject({
  name: z.string(),
  sourceModule: z.string(),
  typeOnly: z.boolean().default(false),
});

export type ReExportedShape = z.infer<typeof ReExportedShapeSchema>;

export const ShapeExtractionResultSchema = z.strictObject({
  shapes: z.array(ExtractedShapeSchema).readonly(),
  notFound: z.array(z.string()).readonly(),
  imported: z.array(z.string()).readonly(),
  reExported: z.array(ReExportedShapeSchema).readonly(),
  warnings: z.array(z.string()).readonly(),
});

export type ShapeExtractionResult = z.infer<typeof ShapeExtractionResultSchema>;

export const ShapeExtractionOptionsSchema = z.strictObject({
  includeJsDoc: z.boolean().default(true),
  functionDetail: z.enum(['signature', 'name-only']).default('signature'),
  preserveFormatting: z.boolean().default(true),
  jsx: z.boolean().default(false),
});

export type ShapeExtractionOptions = z.infer<typeof ShapeExtractionOptionsSchema>;
export type ShapeExtractionOptionsInput = z.input<typeof ShapeExtractionOptionsSchema>;

export function isExtractedShape(value: unknown): value is ExtractedShape {
  return ExtractedShapeSchema.safeParse(value).success;
}

export function isShapeExtractionResult(value: unknown): value is ShapeExtractionResult {
  return ShapeExtractionResultSchema.safeParse(value).success;
}
