/**
 * @architect
 * @architect-pattern GovernanceProjectionSupport
 * @architect-status completed
 * @architect-role:utility
 * @architect-uses ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Hosts the small set of string utilities that governance
 * projections share — pattern-name resolution, annotation text
 * normalization, and slugification — so decision, business-rule, taxonomy,
 * and validation digests emit consistent fragments.
 *
 * **Invariant:** Helpers are pure: `getPatternName` always returns a defined
 * string, `normalizeAnnotationText` and `normalizeLineEndings` never mutate
 * input, and `slugify` produces a lowercase, dash-delimited token with no
 * leading/trailing dashes.
 *
 * **Behavior:**
 * - `normalizeLineEndings` folds Windows `\r\n` sequences to `\n`.
 * - `normalizeAnnotationText` trims each line, drops empty lines, and joins
 *   the remainder with single spaces for downstream parsing.
 * - `slugify` lowercases, replaces non-alphanumeric runs with `-`, and trims
 *   dashes from both ends.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';

export function getPatternName(pattern: ExtractedPattern): string {
  return pattern.patternName ?? pattern.name;
}

export function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, '\n');
}

export function normalizeAnnotationText(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .trim();
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
