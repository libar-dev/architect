/**
 * @architect
 * @architect-pattern GeneratorDegeneracyGuard
 * @architect-status completed
 * @architect-role:utility
 * @architect-uses ProjectionFragmentContracts
 * @architect-bounded-context:documentation-composition
 *
 * ## Generator degeneracy guard
 *
 * **Value:** Turns a silent-empty documentation generator into a loud
 * build-time failure. A view that advertises itself as "the traceability
 * matrix" or "the pattern catalog" yet renders a zero-row collection is a
 * trust failure — the gate refuses to let such a degenerate root ship.
 *
 * **Invariant:** For every collection-bearing fragment kind the guard knows
 * about (TraceabilityMatrix→`rows`, RoadmapTimeline→`patterns`,
 * PatternCatalog→`items`, BusinessRuleSet→`rules`,
 * RequirementDigest→`requirements`), an empty primary collection throws
 * `GeneratorDegenerateError` naming the document type and the reason; fragment
 * kinds with no registered primary collection are not collection-bearing and
 * pass unconditionally.
 *
 * **Behavior:**
 * - Looks the root fragment's `kind` up in a per-kind primary-collection map;
 *   when present and the collection is empty, throws so the docs runner exits
 *   non-zero via the CLI error handler.
 * - Centralises degeneracy knowledge in the projection package (which owns the
 *   fragment shapes) rather than scattering magic strings through the runner.
 *
 * ### When to Use
 *
 * - Assert at documentation-generation time that a row/collection-bearing
 *   generator produced a non-empty root before it is written to disk.
 */
import type { Fragment, FragmentKind } from '../../fragments/fragment-schema.internal.js';
import type { SupportedDocumentationType } from './documentation-type-registry.identity.js';

/**
 * Maps each collection-bearing fragment kind to the field on its root fragment
 * that holds the primary collection. A kind absent from this map is treated as
 * not collection-bearing and is never reported degenerate.
 */
const PRIMARY_COLLECTION_BY_KIND = {
  TraceabilityMatrix: 'rows',
  RoadmapTimeline: 'patterns',
  PatternCatalog: 'items',
  BusinessRuleSet: 'rules',
  RequirementDigest: 'requirements',
} as const satisfies Partial<Record<FragmentKind, string>>;

type CollectionBearingKind = keyof typeof PRIMARY_COLLECTION_BY_KIND;

/**
 * Thrown by the documentation runner when a collection-bearing generator
 * produces a degenerate (empty primary collection) root fragment. The runner's
 * CLI error handler converts this into a non-zero exit so a silent-empty view
 * cannot regress unnoticed.
 *
 * @architect-shape
 */
export class GeneratorDegenerateError extends Error {
  constructor(
    readonly documentType: SupportedDocumentationType,
    readonly reason: string,
  ) {
    super(`Documentation generator "${documentType}" is degenerate: ${reason}`);
    this.name = 'GeneratorDegenerateError';
  }
}

function isCollectionBearingKind(kind: FragmentKind): kind is CollectionBearingKind {
  return kind in PRIMARY_COLLECTION_BY_KIND;
}

/**
 * Asserts that a documentation generator's root fragment is not degenerate.
 *
 * For collection-bearing fragment kinds, throws {@link GeneratorDegenerateError}
 * when the primary collection (e.g. `rows`, `patterns`, `items`) is empty.
 * Fragment kinds with no registered primary collection are not collection-
 * bearing and pass unconditionally.
 */
export function assertGeneratorNotDegenerate(
  documentType: SupportedDocumentationType,
  rootFragment: Fragment,
): void {
  if (!isCollectionBearingKind(rootFragment.kind)) {
    return;
  }

  const field = PRIMARY_COLLECTION_BY_KIND[rootFragment.kind];
  const collection = (rootFragment as Record<string, unknown>)[field];

  if (Array.isArray(collection) && collection.length === 0) {
    throw new GeneratorDegenerateError(documentType, `0 ${field}`);
  }
}
