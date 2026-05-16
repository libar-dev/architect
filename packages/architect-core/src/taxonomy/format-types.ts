export const FORMAT_TYPES = ['value', 'enum', 'quoted-value', 'csv', 'number', 'flag'] as const;

export type FormatType = (typeof FORMAT_TYPES)[number];
