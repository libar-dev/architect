/**
 * Source-ownership rules per ADR-001 Rule 6.
 *
 * Mirrors ADR-001 Rule 6 in `architect/decisions/`. Edit the
 * ADR table and this constant together. The ADR is the decision record; these
 * constants are its TypeScript projection.
 *
 * Two layers per the d8b6170 hybrid model (canonical minimum + per-instance
 * extension):
 *
 * - `CANONICAL_FEATURE_ONLY_TAG_SUFFIXES` — the universal floor every project
 *   shares. The Rule 6 ADR table at the canonical minimum lists these.
 *   Anti-pattern detection MUST flag any of these in TypeScript JSDoc.
 *   Sync-tested against the ADR table by `canonical-values-sync.feature`.
 *
 * - `ARCHITECT_PACKAGE_FEATURE_ONLY_TAG_SUFFIXES` — this package's choice of
 *   how to extend the canonical minimum, enriching its requirement-doc
 *   vocabulary (`workflow`). Other
 *   projects may declare their own extension list; they MUST include the
 *   canonical minimum but may add to it freely. The package's extension is
 *   NOT sync-tested against the ADR — extensions are per-project and may
 *   legitimately drift from any single ADR's table.
 *
 * The `quarter` tag was retired per ADR-013 (no calendar temporal axis), and
 * the `completed` completion-date field was retired by the same decision
 * (no temporal state in the read model; completion order lives in git), so the
 * canonical minimum is `team` alone and the package extension is `workflow`.
 *
 * Source-ownership *violation detection* (flagging `@architect-uses` in
 * `.feature` files, or `@architect-depends-on` in TS JSDoc) is graph-health
 * work for the graph handle's drift views (ADR-014), not the guard pipeline.
 * See the ADR-001 Rule 6 narrative for the rationale.
 */

export const CANONICAL_FEATURE_ONLY_TAG_SUFFIXES = ['team'] as const;

export const ARCHITECT_PACKAGE_FEATURE_ONLY_TAG_SUFFIXES = [
  ...CANONICAL_FEATURE_ONLY_TAG_SUFFIXES,
  'workflow',
] as const;

export type CanonicalFeatureOnlyTag = (typeof CANONICAL_FEATURE_ONLY_TAG_SUFFIXES)[number];
export type ArchitectPackageFeatureOnlyTag =
  (typeof ARCHITECT_PACKAGE_FEATURE_ONLY_TAG_SUFFIXES)[number];
