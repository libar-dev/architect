/**
 * @architect
 * @architect-pattern JsonRenderer
 * @architect-status completed
 * @architect-role:codec
 * @architect-bounded-context:rendering
 *
 * Renders fragments as JSON-safe objects or stable JSON strings for structured tool output.
 * This renderer validates serializability and bundle routing metadata; it does not
 * transform raw PatternGraph data or invent presentation-specific fields.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { Fragment, ProjectionBundle } from '../fragments/index.js';
import { isBundle } from '../fragments/index.js';

import type { ProjectionInput, RenderJsonOptions } from './types.js';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

interface JsonRoutingMetadata {
  childPathStrategy: 'flat' | 'nested';
  anchorStrategy: 'heading-slug' | 'kind-id';
  rootRouteId: string;
  childRouteIds: Record<string, string>;
}

interface JsonBundle {
  root: JsonObject;
  children: Record<string, JsonObject>;
  routing?: JsonRoutingMetadata;
}

const DEFAULT_OPTIONS: Required<RenderJsonOptions> = {
  pretty: false,
  stableKeyOrder: true,
};

export function renderJson(
  input: ProjectionInput,
  options: RenderJsonOptions & { pretty: true }
): string;
export function renderJson(
  input: ProjectionInput,
  options?: RenderJsonOptions & { pretty?: false | undefined }
): object;
export function renderJson(input: ProjectionInput, options?: RenderJsonOptions): string | object {
  const resolvedOptions = resolveOptions(options);
  const payload = isBundle(input)
    ? serializeBundle(input, resolvedOptions)
    : serializeFragment(input, resolvedOptions, '$');

  return resolvedOptions.pretty ? JSON.stringify(payload, null, 2) : payload;
}

function resolveOptions(options: RenderJsonOptions | undefined): Required<RenderJsonOptions> {
  return {
    pretty: options?.pretty ?? DEFAULT_OPTIONS.pretty,
    stableKeyOrder: options?.stableKeyOrder ?? DEFAULT_OPTIONS.stableKeyOrder,
  };
}

function serializeBundle(
  bundle: ProjectionBundle<Fragment>,
  options: Required<RenderJsonOptions>
): JsonBundle {
  const childrenEntries = Object.entries(bundle.children);
  const serializedChildren = Object.fromEntries(
    orderEntries(childrenEntries, options.stableKeyOrder).map(([key, child]) => [
      key,
      serializeFragment(child, options, appendPath('$.children', key)),
    ])
  ) as Record<string, JsonObject>;

  const serializedRoot = serializeFragment(bundle.root, options, '$.root');

  if (bundle.routing) {
    const routing = bundle.routing;
    const serializedRouting: JsonRoutingMetadata = {
      anchorStrategy: routing.anchorStrategy,
      childRouteIds: Object.fromEntries(
        orderEntries(childrenEntries, options.stableKeyOrder).map(([key]) => [
          key,
          routing.childRouteIds[key] ?? key,
        ])
      ),
      childPathStrategy: routing.childPathStrategy,
      rootRouteId: routing.rootRouteId,
    };

    return {
      children: serializedChildren,
      root: serializedRoot,
      routing: serializedRouting,
    };
  }

  return {
    children: serializedChildren,
    root: serializedRoot,
  };
}

function serializeFragment(
  fragment: Fragment,
  options: Required<RenderJsonOptions>,
  path: string
): JsonObject {
  return transformObject(fragment as Record<string, unknown>, options, path);
}

function transformValue(
  value: unknown,
  options: Required<RenderJsonOptions>,
  path: string
): JsonValue {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`renderJson encountered a non-JSON-safe number at ${path}: ${String(value)}`);
    }

    return value;
  }

  if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
    throw new Error(`renderJson encountered a non-JSON-safe ${typeof value} at ${path}.`);
  }

  if (value instanceof Date) {
    throw new Error(`renderJson encountered a non-JSON-safe Date at ${path}.`);
  }

  if (value instanceof Map) {
    throw new Error(`renderJson encountered a non-JSON-safe Map at ${path}.`);
  }

  if (value instanceof Set) {
    throw new Error(`renderJson encountered a non-JSON-safe Set at ${path}.`);
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => transformValue(entry, options, `${path}[${String(index)}]`));
  }

  if (!isPlainObject(value)) {
    const constructorName = getConstructorName(value);
    throw new Error(`renderJson encountered a non-JSON-safe ${constructorName} at ${path}.`);
  }

  return transformObject(value, options, path);
}

function transformObject(
  value: Record<string, unknown>,
  options: Required<RenderJsonOptions>,
  path: string
): JsonObject {
  const result: JsonObject = {};

  for (const [key, fieldValue] of orderEntries(Object.entries(value), options.stableKeyOrder)) {
    if (fieldValue === undefined) {
      continue;
    }

    result[key] = transformValue(fieldValue, options, appendPath(path, key));
  }

  return result;
}

function orderEntries<T>(entries: [string, T][], stableKeyOrder: boolean): [string, T][] {
  if (!stableKeyOrder) {
    return entries;
  }

  return [...entries].sort(([left], [right]) => left.localeCompare(right));
}

function appendPath(basePath: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key)
    ? `${basePath}.${key}`
    : `${basePath}[${JSON.stringify(key)}]`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getConstructorName(value: object): string {
  const prototype: unknown = Object.getPrototypeOf(value);
  if (typeof prototype !== 'object' || prototype === null || !('constructor' in prototype)) {
    return 'object';
  }

  const constructorValue = (prototype as { constructor: unknown }).constructor;
  if (typeof constructorValue !== 'function' || constructorValue.name.length === 0) {
    return 'object';
  }

  return constructorValue.name;
}
