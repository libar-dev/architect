/**
 * @architect
 * @architect-pattern DocumentationCompositionProjectionSupport
 * @architect-status completed
 * @architect-role:utility
 * @architect-uses ProjectConfigSnapshot, ArchitectureDiagram, PrChangeReview
 * @architect-bounded-context:projection
 *
 * **Value:** Consolidates shared scalar helpers used by documentation-composition
 * projections without owning a presentation fragment pipeline.
 *
 * **Invariant:** String collection helpers trim, dedupe, and preserve first-seen
 * ordering; text detection treats whitespace-only strings as absent.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
export function dedupeStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    deduped.push(trimmed);
  }

  return deduped;
}

export function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
