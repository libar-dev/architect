/**
 * @architect
 * @architect-pattern DecisionResolution
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:read-api
 * @architect-uses ExtractedPattern, PatternGraph, PatternHelpers
 *
 * ## DecisionResolution - Canonical decision identity (ADR-006)
 *
 * A decision (ADR/PDR) is identified by exactly one pattern — the decision
 * feature whose `@architect-adr:<NNN>` tag is set. That pattern carries two
 * keys callers reach for interchangeably: the canonical pattern NAME
 * (`ADR009ProjectionTrustBoundary`) and the human-typed ADR id form
 * (`ADR-009`, `ADR009`, `009`). `@architect-enforces-decision` values in the
 * wild use either form. This module is the single normalizer that maps any of
 * those forms to the one canonical decision pattern, so the kernel read-api,
 * the relationship-index `enforcedBy` resolution, the projection's
 * decision-scope match, and the CLI fail-loud all agree on identity.
 */
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { PatternGraph } from '../validation-schemas/pattern-graph.js';
import { findPatternByName, getPatternName } from './pattern-helpers.js';

function isPatternArray(
  source: PatternGraph | readonly ExtractedPattern[],
): source is readonly ExtractedPattern[] {
  return Array.isArray(source);
}

function asPatternArray(
  source: PatternGraph | readonly ExtractedPattern[],
): readonly ExtractedPattern[] {
  return isPatternArray(source) ? source : source.patterns;
}

/** A decision pattern is any pattern whose `@architect-adr` tag resolves to a value. */
export function isDecisionPattern(pattern: ExtractedPattern): boolean {
  return pattern.adr !== undefined && pattern.adr.trim().length > 0;
}

/**
 * Every decision (ADR/PDR) pattern in the graph, sorted by canonical name.
 * This is the accepted-value set the CLI `--decision` filter fails loud against
 * — the decision analogue of `listPackages()`.
 */
export function listDecisionPatterns(
  source: PatternGraph | readonly ExtractedPattern[],
): readonly ExtractedPattern[] {
  return asPatternArray(source)
    .filter(isDecisionPattern)
    .slice()
    .sort((left, right) => getPatternName(left).localeCompare(getPatternName(right)));
}

/**
 * Normalize an ADR id form to its bare alphanumeric key for comparison:
 * `ADR-009` → `adr009`, `009` → `009`, `9` → `9`, `PDR-005` → `pdr005`.
 * Strips every non-alphanumeric and lowercases.
 */
function normalizeIdKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/gu, '');
}

/**
 * The numeric portion of an ADR id form with leading zeros dropped, or
 * undefined when there is no digit run. `009` → `9`, `ADR-09` → `9`,
 * `ADR009ProjectionTrustBoundary` → `9`. Lets a 2/3-digit-padded `adr` tag
 * (`009`) match a user-typed bare `9` and vice versa.
 */
function numericKey(value: string): string | undefined {
  const digits = /(\d+)/u.exec(value)?.[1];
  if (digits === undefined) return undefined;
  const trimmed = digits.replace(/^0+/u, '');
  return trimmed.length > 0 ? trimmed : '0';
}

/**
 * Resolve any decision-reference form to its single canonical decision pattern,
 * or undefined when nothing matches. Resolution order (most specific first):
 *
 *  1. exact pattern-name match (`ADR009ProjectionTrustBoundary`, case-insensitive)
 *  2. id-key prefix match against the pattern name (`ADR009` / `ADR-009` →
 *     `ADR009ProjectionTrustBoundary`; `PDR005` → `PDR005ProcessGuardFSM`) —
 *     prefix, so the ADR/PDR distinction in the name disambiguates a shared
 *     numeric.
 *  3. exact `adr`-tag-value match (`009`, or the bare numeric `9`) — only when
 *     it resolves to exactly one decision pattern, so an ambiguous bare number
 *     shared by an ADR and a PDR (e.g. `005`) refuses rather than guesses.
 */
export function resolveDecisionPattern(
  source: PatternGraph | readonly ExtractedPattern[],
  input: string,
): ExtractedPattern | undefined {
  const direct = findPatternByName(source, input);
  if (direct !== undefined && isDecisionPattern(direct)) {
    return direct;
  }

  const decisions = listDecisionPatterns(source);
  const idKey = normalizeIdKey(input);
  if (idKey.length === 0) {
    return undefined;
  }

  const prefixMatches = decisions.filter((pattern) =>
    normalizeIdKey(getPatternName(pattern)).startsWith(idKey),
  );
  if (prefixMatches.length === 1) {
    return prefixMatches[0];
  }

  const inputNumeric = numericKey(input);
  if (inputNumeric !== undefined) {
    const numericMatches = decisions.filter(
      (pattern) => pattern.adr !== undefined && numericKey(pattern.adr) === inputNumeric,
    );
    if (numericMatches.length === 1) {
      return numericMatches[0];
    }
  }

  return undefined;
}

/**
 * The canonical decision identity for an `@architect-enforces-decision` value
 * or a `--decision` query input: the resolved decision pattern's name when it
 * resolves, else the input lowercased (so two un-resolvable-but-equal raw
 * values — e.g. the fixture's bare `777` on both sides — still compare equal).
 */
export function canonicalDecisionKey(
  source: PatternGraph | readonly ExtractedPattern[],
  input: string,
): string {
  const resolved = resolveDecisionPattern(source, input);
  return resolved !== undefined ? getPatternName(resolved).toLowerCase() : input.toLowerCase();
}
