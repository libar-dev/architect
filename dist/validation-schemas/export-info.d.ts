import { z } from 'zod';
/**
 * Discriminated union of all export types
 *
 * **Benefits:**
 * - Type narrowing based on 'type' discriminant
 * - Compile-time exhaustiveness checking
 * - Better error messages from Zod
 */
export declare const ExportInfoSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
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
}, z.core.$strict>], "type">;
/**
 * Type alias inferred from discriminated union schema
 *
 * **Schema-First Law**: Type automatically derives from Zod schema,
 * providing both compile-time and runtime type safety.
 */
export type ExportInfo = z.infer<typeof ExportInfoSchema>;
/**
 * Runtime type guard for ExportInfo
 *
 * @param value - Value to check
 * @returns True if value conforms to ExportInfo schema
 *
 * @example
 * ```typescript
 * if (isExportInfo(parsed)) {
 *   console.log(parsed.name); // Type-safe access
 * }
 * ```
 */
export declare function isExportInfo(value: unknown): value is ExportInfo;
//# sourceMappingURL=export-info.d.ts.map