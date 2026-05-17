/**
 * @architect
 * @architect-pattern FragmentRendererDispatch
 * @architect-status completed
 * @architect-role:codec
 * @architect-bounded-context:rendering
 *
 * ### When to Use
 *
 * - When a renderer needs the shared `FragmentKind` dispatch bridge and must
 *   keep kind-specific normalizers wired through the compile-time
 *   `FragmentByKind<K>` handler table.
 */
import type { Fragment, FragmentKind, FragmentByKind } from '../../fragments/index.js';

export type KindTable<Out, Options> = {
  readonly [K in FragmentKind]?: (fragment: FragmentByKind<K>, options: Options) => Out;
};

export type StrictKindTable<Out, Options, Kinds extends FragmentKind> = {
  readonly [K in Kinds]: (fragment: FragmentByKind<K>, options: Options) => Out;
};

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
