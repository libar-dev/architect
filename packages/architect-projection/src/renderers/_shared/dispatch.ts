/**
 * @architect
 * @architect-pattern FragmentRendererDispatch
 * @architect-status completed
 * @architect-role:codec
 * @architect-bounded-context:rendering
 * @architect-uses ProjectionFragmentSchema
 *
 * ### When to Use
 *
 * - When a renderer needs the shared `FragmentKind` dispatch bridge and must
 *   keep kind-specific normalizers wired through the compile-time
 *   `FragmentByKind<K>` handler table.
 */
import type { Fragment, FragmentKind, FragmentByKind } from '../../fragments/index.js';

/**
 * A partial handler table keyed by {@link FragmentKind}; each entry receives the
 * exact `FragmentByKind<K>` for its key and returns the renderer output. Kinds
 * without an entry fall through to the dispatcher's fallback.
 *
 * @architect-shape
 */
export type KindTable<Out, Options> = {
  readonly [K in FragmentKind]?: (fragment: FragmentByKind<K>, options: Options) => Out;
};

/**
 * A handler table that requires an entry for every kind in `Kinds`, giving
 * compile-time exhaustiveness over the chosen subset of {@link FragmentKind}.
 *
 * @architect-shape
 */
export type StrictKindTable<Out, Options, Kinds extends FragmentKind> = {
  readonly [K in Kinds]: (fragment: FragmentByKind<K>, options: Options) => Out;
};

/**
 * Dispatches a fragment to its kind-specific handler in `table`, or to
 * `fallback` when no entry matches. Bridges the runtime `fragment.kind`
 * discriminator back to the compile-time `FragmentByKind<K>` handler signature.
 *
 * @architect-shape
 * @param fragment - The fragment to dispatch on its `kind`.
 * @param table - The kind-keyed handler table to look the fragment up in.
 * @param fallback - Handler invoked when no table entry matches the kind.
 * @param options - Renderer options threaded through to the selected handler.
 * @returns The output produced by the matched handler or the fallback.
 */
export function dispatchByKind<Out, Options>(
  fragment: Fragment,
  table: KindTable<Out, Options>,
  fallback: (fragment: Fragment, options: Options) => Out,
  options: Options,
): Out {
  const fn = table[fragment.kind];
  return fn
    ? // Invariant: each table entry is stored under the exact matching `fragment.kind`, so once the
      // lookup succeeds this cast is a sound bridge from the runtime string discriminator back to
      // the compile-time `FragmentByKind<K>` handler signature. Keep the table keyed by `FragmentKind`
      // and do not reuse handlers across mismatched kinds, or this load-bearing cast stops being safe.
      (fn as (f: Fragment, o: Options) => Out)(fragment, options)
    : fallback(fragment, options);
}
