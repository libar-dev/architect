/**
 * Tag value format types
 *
 * Defines how tag values are parsed and validated.
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