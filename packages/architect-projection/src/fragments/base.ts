import type { Fragment } from './fragment-schema.internal.js';
import { isLogicalRouteId, type LogicalRouteId } from '../routing/route-id.js';
import { DisclosureSpecSchema, type DisclosureSpec } from '../disclosure/spec.js';

export interface BundleRouting {
  rootRouteId: LogicalRouteId;
  childRouteIds: Readonly<Record<string, LogicalRouteId>>;
  childPathStrategy: 'flat' | 'nested';
  anchorStrategy: 'heading-slug' | 'kind-id';
  disclosureSpec?: DisclosureSpec;
  /** Filename for the root document under the markdown route profile (e.g. `PATTERNS.md`). */
  markdownRootTarget?: string;
  /**
   * Child directory for entity and child routes under the markdown route profile.
   * Falls back to `documentType` from the routeId when undefined.
   */
  markdownChildDirectory?: string;
  /**
   * Entity-route file layout. When `'nested-index'`, entities resolve to
   * `${dir}/${slug}/INDEX.md`; otherwise (or when undefined) entities resolve
   * to a flat `${dir}/${slug}.md` file.
   */
  entityPathLayout?: 'flat' | 'nested-index';
}

export interface ProjectionBundle<T extends Fragment> {
  root: T;
  children: Record<string, Fragment>;
  routing?: BundleRouting;
}

export function isBundle<T extends Fragment>(value: unknown): value is ProjectionBundle<T> {
  if (!isPlainObject(value)) {
    return false;
  }

  if (!isFragmentLike(value['root'])) {
    return false;
  }

  if (!isPlainObject(value['children'])) {
    return false;
  }

  if (!Object.values(value['children']).every((child) => isFragmentLike(child))) {
    return false;
  }

  return value['routing'] === undefined || isRoutingLike(value['routing']);
}

export function projectSingle<T extends Fragment>(fragment: T): ProjectionBundle<T> {
  return {
    root: fragment,
    children: {},
  };
}

function isFragmentLike(value: unknown): value is Fragment {
  return isPlainObject(value) && typeof value['kind'] === 'string';
}

function isRoutingLike(value: unknown): value is BundleRouting {
  return (
    isPlainObject(value) &&
    isRouteIdValue(value['rootRouteId']) &&
    isPlainObject(value['childRouteIds']) &&
    Object.values(value['childRouteIds']).every(isRouteIdValue) &&
    isChildPathStrategy(value['childPathStrategy']) &&
    isAnchorStrategy(value['anchorStrategy']) &&
    isValidDisclosureSpec(value['disclosureSpec']) &&
    isOptionalString(value['markdownRootTarget']) &&
    isOptionalString(value['markdownChildDirectory']) &&
    isOptionalEntityPathLayout(value['entityPathLayout'])
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalEntityPathLayout(value: unknown): boolean {
  return value === undefined || value === 'flat' || value === 'nested-index';
}

function isValidDisclosureSpec(value: unknown): boolean {
  return value === undefined || DisclosureSpecSchema.safeParse(value).success;
}

function isChildPathStrategy(value: unknown): value is BundleRouting['childPathStrategy'] {
  return value === 'flat' || value === 'nested';
}

function isAnchorStrategy(value: unknown): value is BundleRouting['anchorStrategy'] {
  return value === 'heading-slug' || value === 'kind-id';
}

function isRouteIdValue(value: unknown): value is LogicalRouteId {
  return typeof value === 'string' && isLogicalRouteId(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
