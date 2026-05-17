import { z } from 'zod';

export function hasNullByte(value: string): boolean {
  return value.includes('\u0000');
}

export function assertNoNullBytes(value: string, label: string): asserts value is string {
  if (hasNullByte(value)) {
    throw new Error(`${label} must not contain null bytes`);
  }
}

export function assertHasValue(value: string | undefined, label: string): asserts value is string {
  if (value === undefined) {
    throw new Error(`${label} requires a value`);
  }
  if (value.startsWith('-')) {
    throw new Error(
      `${label} requires a value, but received another flag (${value}). Use -- to pass values that start with "-".`,
    );
  }
  assertNoNullBytes(value, `${label} value`);
}

export const SafeStringSchema = z.string().refine((value) => !hasNullByte(value), {
  message: 'must not contain null bytes',
});

export const NonEmptySafeStringSchema = z
  .string()
  .min(1)
  .refine((value) => !hasNullByte(value), {
    message: 'must not contain null bytes',
  });
