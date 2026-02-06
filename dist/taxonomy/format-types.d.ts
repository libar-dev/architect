/**
 * @libar-docs
 * @libar-docs-pattern FormatTypes
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes FORMAT_TYPES, FormatType
 *
 * ## Tag Value Format Types
 *
 * Defines how tag values are parsed and validated.
 * Each format type determines the parsing strategy for tag values.
 */
export declare const FORMAT_TYPES: readonly ["value", "enum", "quoted-value", "csv", "number", "flag"];
export type FormatType = (typeof FORMAT_TYPES)[number];
//# sourceMappingURL=format-types.d.ts.map