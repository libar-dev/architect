/**
 * @architect
 * @architect-pattern ProjectionBundle
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:projection
 * @architect-uses ProjectionFragmentSchema, EmissionDescriptor
 *
 * ## ProjectionBundle - The Sink-Agnostic Envelope Every Renderer Receives
 *
 * The output contract of every projection: `ProjectionBundle<T>` wraps a root
 * fragment, its keyed `children`, an optional logical `BundleRouting`, and an
 * optional `emission` overlay. The routing/emission split is the heart of the
 * sink-agnostic doctrine — `routing` carries only logical route ids plus the
 * composition `disclosureSpec` and never names a file target, while the file-sink
 * specifics (which `.md` file, child directory, entity layout) live exclusively
 * on the optional `EmissionDescriptor`. The absence of `emission` is the baseline
 * (the bundle handed to API/MCP consumers or the Studio view-state sink); a
 * present descriptor writes the bundle to markdown.
 *
 * Also exports the `BundleRouting` interface + its `strictObject` schema, the
 * `isBundle` runtime witness, and `projectSingle` (the trivial root-only bundle).
 * The second-highest fan-in contract in the package after `ProjectionContext`.
 *
 * ### When to Use
 *
 * - Returning a result from any projection function — the return is a bundle.
 * - Composing or routing fragments without committing to a file sink.
 * - Narrowing an `unknown` value to a bundle via `isBundle`.
 * - Wrapping a single fragment into a bundle via `projectSingle`.
 */
import { z } from 'zod';

import type { Fragment } from './fragment-schema.internal.js';
import { EmissionDescriptorSchema, type EmissionDescriptor } from './emission-descriptor.js';
import { LogicalRouteIdSchema, type LogicalRouteId } from '../routing/route-id.js';
import { DisclosureSpecSchema, type DisclosureSpec } from '../disclosure/spec.js';
import { isPlainObject } from '../shared/plain-object.js';

/**
 * Logical, sink-agnostic routing for a projection bundle. The file-sink specifics
 * (which `.md` file, child directory, entity layout) moved OFF this interface and
 * ONTO the optional `emission` descriptor (`ProjectionBundle.emission`) — see the
 * `BundleRouting` split in `emission-descriptor.ts`. This carries only logical
 * route ids + the composition `disclosureSpec`; it never names a file target.
 */
export interface BundleRouting {
  rootRouteId: LogicalRouteId;
  childRouteIds: Readonly<Record<string, LogicalRouteId>>;
  childPathStrategy: 'flat' | 'nested';
  anchorStrategy: 'heading-slug' | 'kind-id';
  disclosureSpec?: DisclosureSpec;
}

/**
 * Runtime witness for {@link BundleRouting} — the Zod replacement for the deleted
 * hand-written `isRoutingLike` guard (stub DD-1). `strictObject` so a stray field
 * fails discrimination rather than silently passing; the markdown-file fields that
 * used to be tolerated here now live on the `emission` descriptor exclusively.
 */
export const BundleRoutingSchema = z.strictObject({
  rootRouteId: LogicalRouteIdSchema,
  childRouteIds: z.record(z.string(), LogicalRouteIdSchema),
  childPathStrategy: z.enum(['flat', 'nested']),
  anchorStrategy: z.enum(['heading-slug', 'kind-id']),
  disclosureSpec: DisclosureSpecSchema.optional(),
});

export interface ProjectionBundle<T extends Fragment> {
  root: T;
  children: Record<string, Fragment>;
  routing?: BundleRouting;
  /**
   * Optional file-sink overlay. Its ABSENCE is the sink-agnostic baseline (the
   * bundle handed to the API/MCP consumer or the Studio view-state sink); a PRESENT
   * descriptor writes the bundle to a markdown file (whole-artifact or embedded-region).
   */
  emission?: EmissionDescriptor;
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

  const routingValid =
    value['routing'] === undefined || BundleRoutingSchema.safeParse(value['routing']).success;
  const emissionValid =
    value['emission'] === undefined ||
    EmissionDescriptorSchema.safeParse(value['emission']).success;

  return routingValid && emissionValid;
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
