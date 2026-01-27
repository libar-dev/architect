/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SharedCodecSchema
 * @libar-docs-status completed
 *
 * ## Shared Codec Output Schema
 *
 * Provides a simplified RenderableDocument output schema for use with
 * Zod 4 codecs. The simplification (using z.any() for recursive fields)
 * avoids complex recursive type issues at the codec boundary while
 * maintaining type safety in the rest of the system.
 *
 * ### Why z.any() for sections?
 *
 * Zod's recursive schemas with z.lazy() cause type inference issues
 * when used with z.codec(). The full RenderableDocumentSchema from
 * schema.ts works fine for validation, but causes the codec's decode()
 * return type to become `any`. Using a simplified schema here keeps
 * codec return types clean while still validating the structure.
 */
import { z } from 'zod';
/**
 * Simplified output schema for codec decode results.
 *
 * This schema is intentionally loose for the sections and additionalFiles
 * fields to avoid Zod recursive schema type inference issues. The actual
 * content is still type-safe via the RenderableDocument interface.
 */
export const RenderableDocumentOutputSchema = z.object({
    title: z.string(),
    purpose: z.string().optional(),
    detailLevel: z.string().optional(),
    sections: z.array(z.any()),
    additionalFiles: z.record(z.string(), z.any()).optional(),
});
//# sourceMappingURL=shared-schema.js.map