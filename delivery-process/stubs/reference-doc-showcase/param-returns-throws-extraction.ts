/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ReferenceDocShowcase
 *
 * ## Param/Returns/Throws Extraction from JSDoc
 *
 * Target: src/validation-schemas/extracted-shape.ts (schema additions)
 *         src/extractor/shape-extractor.ts (parseJsDocTags, extractShape integration)
 * See: DD-3 (New schema fields on ExtractedShape)
 * Since: DS-2
 *
 * ### Schema Additions (extracted-shape.ts)
 *
 * Three new optional fields on ExtractedShapeSchema:
 * - params: array of { name, type?, description }
 * - returns: { type?, description }
 * - throws: array of { type?, description }
 *
 * ### Extraction Logic (shape-extractor.ts)
 *
 * New function `parseJsDocTags()` parses raw JSDoc text for @param, @returns, @throws.
 * Called from `extractShape()` when kind === 'function'.
 *
 * ### JSDoc Format Variants
 *
 * @param formats:
 *   `@param {Type} name - description`     (JSDoc standard with type)
 *   `@param {Type} name description`        (no dash separator)
 *   `@param name - description`             (TypeScript style, no type)
 *   `@param name description`               (minimal)
 *
 * @returns formats:
 *   `@returns {Type} description`
 *   `@returns description`
 *   `@return {Type} description`            (alias)
 *
 * @throws formats:
 *   `@throws {Type} description`
 *   `@throws description`
 *   `@throw {Type} description`             (alias)
 */

import type { z } from 'zod';

// --- New schema additions for extracted-shape.ts ---

/** Schema for a documented function parameter */
export const ParamDocSchema = {
  name: 'z.string()',
  type: 'z.string().optional()',
  description: 'z.string()',
} as const;

/** Schema for return type documentation */
export const ReturnsDocSchema = {
  type: 'z.string().optional()',
  description: 'z.string()',
} as const;

/** Schema for throws documentation */
export const ThrowsDocSchema = {
  type: 'z.string().optional()',
  description: 'z.string()',
} as const;

// --- New fields added to ExtractedShapeSchema ---
// params: z.array(ParamDocSchema).readonly().optional(),
// returns: ReturnsDocSchema.optional(),
// throws: z.array(ThrowsDocSchema).readonly().optional(),

/** Parsed JSDoc tag data for a function shape */
interface ParsedJsDocTags {
  readonly params: ReadonlyArray<{ name: string; type?: string; description: string }>;
  readonly returns?: { type?: string; description: string };
  readonly throws: ReadonlyArray<{ type?: string; description: string }>;
}

/**
 * Parse @param, @returns, and @throws tags from raw JSDoc text.
 *
 * Handles multi-line tag descriptions by treating lines that don't start
 * with `@` as continuations of the previous tag.
 *
 * @param jsDocText - Raw JSDoc text (with delimiters already stripped)
 * @returns Structured param/returns/throws data
 */
function parseJsDocTags(jsDocText: string): ParsedJsDocTags {
  throw new Error('ReferenceDocShowcase not yet implemented - roadmap pattern');
}

// Integration point in extractShape():
//
// After line 378 (jsDoc extraction):
//   let parsedTags: ParsedJsDocTags | undefined;
//   if (options.includeJsDoc && kind === 'function' && jsDoc) {
//     parsedTags = parseJsDocTags(jsDoc);
//   }
//
// In the return object (after line 445):
//   params: parsedTags?.params.length ? parsedTags.params : undefined,
//   returns: parsedTags?.returns,
//   throws: parsedTags?.throws.length ? parsedTags.throws : undefined,
