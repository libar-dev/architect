/**
 * @architect-bounded-context:_shared
 *
 * Shared mechanics for the "grouped routed bundle" projection shape: collect a
 * flat list of items, bucket them by a stable group key, sort the groups, build
 * a root fragment plus exactly one child fragment per group, attach routing, and
 * degrade to a single root document when there are no groups.
 *
 * Several routed projections re-implemented this group → sort → root+children →
 * routing → degrade dance. `api-reference` and `business-rules` now route through
 * this helper — each emits one child per group, keyed by the group key.
 * `requirements-executable`/`-specs` deliberately stays bespoke: it is a
 * genuinely different *two-level* shape (each package group emits a package-index
 * child **plus** per-entity detail children), which this one-child-per-group
 * helper does not model — adding that generality back before a second caller
 * needs it is the speculative complexity ADR-010 exists to refuse. `architecture`
 * is a fixed-lens projection and never grouped.
 *
 * Callers keep ownership of every graph read, fragment construction, and Zod
 * shape (ADR-005/006/009); the helper never builds a fragment — it only
 * orchestrates the caller's builders.
 */
import { projectSingle, type BundleRouting, type ProjectionBundle } from '../../fragments/base.js';
import type { Fragment } from '../../fragments/index.js';

/** A group of items sharing the same stable group key, in first-seen order. */
export interface GroupDescriptor<TItem> {
  readonly key: string;
  readonly items: readonly TItem[];
}

export interface GroupedRoutedBundleSpec<TItem, TRoot extends Fragment> {
  /** Pre-collected, already-filtered items. The caller owns all graph reads. */
  readonly items: readonly TItem[];
  /** Stable group key. Items with an equal key share a group (and a child). */
  readonly groupKey: (item: TItem) => string;
  /** Deterministic ordering of the grouped descriptors. */
  readonly compareGroups: (left: GroupDescriptor<TItem>, right: GroupDescriptor<TItem>) => number;
  /** Builds the root fragment from all items plus the ordered group descriptors. */
  readonly buildRoot: (items: readonly TItem[], groups: readonly GroupDescriptor<TItem>[]) => TRoot;
  /**
   * Builds the single child fragment for one group. The helper keys it by the
   * group's own `key`, which is globally unique by construction (one bucket per
   * distinct group key), so child keys never collide.
   */
  readonly buildGroupChild: (group: GroupDescriptor<TItem>) => Fragment;
  /** Builds the routing block once the full ordered child-key set is known. */
  readonly buildRouting: (childKeys: readonly string[]) => BundleRouting;
}

/**
 * Groups `spec.items`, sorts the groups, and assembles a routed bundle. When no
 * group yields a child, returns `projectSingle(root)` — the one canonical
 * empty-degradation shape (a root with `children: {}` and no routing).
 */
export function buildGroupedRoutedBundle<TItem, TRoot extends Fragment>(
  spec: GroupedRoutedBundleSpec<TItem, TRoot>,
): ProjectionBundle<TRoot> {
  const grouped = new Map<string, TItem[]>();
  for (const item of spec.items) {
    const key = spec.groupKey(item);
    const bucket = grouped.get(key);
    if (bucket === undefined) {
      grouped.set(key, [item]);
    } else {
      bucket.push(item);
    }
  }

  const groups: GroupDescriptor<TItem>[] = [...grouped.entries()]
    .map(([key, items]) => ({ key, items }))
    .sort(spec.compareGroups);

  const root = spec.buildRoot(spec.items, groups);

  // Every group yields exactly one child keyed by the group key, so "no children"
  // is precisely "no groups" — the one canonical empty-degradation shape.
  if (groups.length === 0) {
    return projectSingle(root);
  }

  const children: Record<string, Fragment> = {};
  for (const group of groups) {
    children[group.key] = spec.buildGroupChild(group);
  }

  return { root, children, routing: spec.buildRouting(Object.keys(children)) };
}
