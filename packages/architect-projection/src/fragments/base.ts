import type { Fragment } from './fragment-schema.internal.js';

export type BundleRouteId =
  | `${string}:index`
  | `${string}:${string}`
  | `${string}:${string}:${string}:${string}`;

export interface BundleRouting {
  rootRouteId: BundleRouteId;
  childRouteIds: Readonly<Record<string, BundleRouteId>>;
  childPathStrategy: 'flat' | 'nested';
  anchorStrategy: 'heading-slug' | 'kind-id';
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
    isRouteId(value['rootRouteId']) &&
    isPlainObject(value['childRouteIds']) &&
    Object.values(value['childRouteIds']).every(isRouteId) &&
    isChildPathStrategy(value['childPathStrategy']) &&
    isAnchorStrategy(value['anchorStrategy'])
  );
}

function isChildPathStrategy(value: unknown): value is BundleRouting['childPathStrategy'] {
  return value === 'flat' || value === 'nested';
}

function isAnchorStrategy(value: unknown): value is BundleRouting['anchorStrategy'] {
  return value === 'heading-slug' || value === 'kind-id';
}

function isRouteId(value: unknown): value is BundleRouteId {
  return (
    typeof value === 'string' &&
    /^([A-Za-z0-9][A-Za-z0-9_-]*)(:([A-Za-z0-9][A-Za-z0-9_-]*)){1,3}$/u.test(value)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
