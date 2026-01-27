import { z } from 'zod';
/**
 * Function export with optional signature
 */
const FunctionExportSchema = z
    .object({
    type: z.literal('function'),
    name: z.string().min(1, 'Export name cannot be empty'),
    signature: z.string().optional(),
})
    .strict();
/**
 * Type alias export (no runtime signature)
 *
 * **Design Decision**: Types are compile-time only, so signature field
 * is omitted entirely rather than marked undefined.
 */
const TypeExportSchema = z
    .object({
    type: z.literal('type'),
    name: z.string().min(1, 'Export name cannot be empty'),
})
    .strict();
/**
 * Const/variable export with optional signature
 */
const ConstExportSchema = z
    .object({
    type: z.literal('const'),
    name: z.string().min(1, 'Export name cannot be empty'),
    signature: z.string().optional(),
})
    .strict();
/**
 * Interface export (no runtime signature)
 *
 * **Design Decision**: Interfaces are compile-time only, so signature field
 * is omitted entirely rather than marked undefined.
 */
const InterfaceExportSchema = z
    .object({
    type: z.literal('interface'),
    name: z.string().min(1, 'Export name cannot be empty'),
})
    .strict();
/**
 * Class export with optional signature
 */
const ClassExportSchema = z
    .object({
    type: z.literal('class'),
    name: z.string().min(1, 'Export name cannot be empty'),
    signature: z.string().optional(),
})
    .strict();
/**
 * Enum export (runtime values with compile-time type)
 *
 * **Design Decision**: Enums are a first-class export type separate from const,
 * preserving semantic fidelity. Enums have both runtime values and compile-time
 * type information, unlike type aliases or interfaces.
 */
const EnumExportSchema = z
    .object({
    type: z.literal('enum'),
    name: z.string().min(1, 'Export name cannot be empty'),
})
    .strict();
/**
 * Discriminated union of all export types
 *
 * **Benefits:**
 * - Type narrowing based on 'type' discriminant
 * - Compile-time exhaustiveness checking
 * - Better error messages from Zod
 */
export const ExportInfoSchema = z.discriminatedUnion('type', [
    FunctionExportSchema,
    TypeExportSchema,
    ConstExportSchema,
    InterfaceExportSchema,
    ClassExportSchema,
    EnumExportSchema,
]);
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
export function isExportInfo(value) {
    return ExportInfoSchema.safeParse(value).success;
}
//# sourceMappingURL=export-info.js.map