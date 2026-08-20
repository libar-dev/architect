/**
 * @architect
 * @architect-pattern PatternReferenceContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:validation-schemas
 */
import { z } from 'zod';

export const PATTERN_IDENTIFIER_REGEX = /^[A-Z][A-Za-z0-9]+$/u;
export const PATTERN_REFERENCE_REGEX = /^(?:([a-z0-9-]+):)?([A-Z][A-Za-z0-9]+)$/u;

export const PATTERN_IDENTIFIER_RULE = '^[A-Z][A-Za-z0-9]+$';
export const PATTERN_IDENTIFIER_MESSAGE =
  'Pattern identifiers must match ^[A-Z][A-Za-z0-9]+$ (PascalCase only; no spaces, hyphens, or descriptive suffixes)';
export const PATTERN_REFERENCE_MESSAGE =
  'Pattern references must use a declared PascalCase pattern name, optionally prefixed as package-id:PatternName';

export const PatternIdentifierSchema = z
  .string()
  .trim()
  .min(1, 'Pattern identifier cannot be empty')
  .regex(PATTERN_IDENTIFIER_REGEX, PATTERN_IDENTIFIER_MESSAGE);

export const PatternReferenceSchema = z
  .string()
  .trim()
  .min(1, 'Pattern reference cannot be empty')
  .regex(PATTERN_REFERENCE_REGEX, PATTERN_REFERENCE_MESSAGE);

export interface ParsedPatternReference {
  readonly packageId?: string;
  readonly patternName: string;
}

export function parsePatternReference(value: string): ParsedPatternReference | undefined {
  const match = PATTERN_REFERENCE_REGEX.exec(value.trim());
  if (match === null) return undefined;

  const packageId = match[1];
  const patternName = match[2];
  if (patternName === undefined) return undefined;

  return {
    ...(packageId !== undefined ? { packageId } : {}),
    patternName,
  };
}
