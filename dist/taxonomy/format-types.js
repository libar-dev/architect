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
export const FORMAT_TYPES = [
    'value', // Simple string value
    'enum', // Constrained to predefined values
    'quoted-value', // String in quotes (preserves spaces)
    'csv', // Comma-separated values
    'number', // Numeric value
    'flag', // Boolean presence (no value needed)
];
//# sourceMappingURL=format-types.js.map