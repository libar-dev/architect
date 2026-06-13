/**
 * @architect
 * @architect-pattern RendererOptions
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:rendering
 * @architect-uses DisclosureSpec
 *
 * ## RendererOptions - The Typed Seam Between Bundle and Rendering Sink
 *
 * The per-sink option contracts that make renderers pluggable across rendering
 * sinks: `RenderMarkdownOptions`, `RenderCompactOptions`, `RenderJsonOptions`,
 * and `RenderUiOptions`, unified by the `RendererOptionsSchema` Zod union. Also
 * carries the shared rendering vocabulary — `ProjectionInput` (the fragment or
 * bundle a renderer accepts), `MarkdownRouteProfile` (path mapping for emitted
 * markdown), and `MarkdownRenderEvent` (per-document render telemetry). Markdown
 * options depend on `DisclosureSpec` to drive progressive-disclosure depth.
 *
 * ### When to Use
 *
 * - Typing or validating options passed to a specific rendering sink.
 * - Adding a new renderer that must conform to the option contract.
 * - Threading disclosure depth or route-profile mapping into markdown rendering.
 */
import { z } from 'zod';

import type { MarkdownFileRoute } from '../fragments/emission-descriptor.js';
import type { Fragment, ProjectionBundle } from '../fragments/index.js';
import { ContentRichnessSchema } from '../disclosure/spec.js';
import type { ContentRichness, DisclosureSpec } from '../disclosure/spec.js';
import type { LogicalRouteId } from '../routing/route-id.js';

export type ProjectionInput = Fragment | ProjectionBundle<Fragment>;

export interface MarkdownRouteProfile {
  mapPath: (
    routeId: LogicalRouteId,
    kind: Fragment['kind'],
    key: string | undefined,
    markdownRoute?: MarkdownFileRoute,
  ) => string;
}

export interface MarkdownRenderEvent {
  readonly renderKey: string;
  readonly path: string;
  readonly title: string;
  readonly phase: 'measure' | 'emit';
  readonly lineCount: number;
}

const MarkdownRouteProfileSchema = z.custom<MarkdownRouteProfile>(
  (value): value is MarkdownRouteProfile =>
    value !== null &&
    typeof value === 'object' &&
    'mapPath' in value &&
    typeof (value as MarkdownRouteProfile).mapPath === 'function',
  'Expected markdown route profile',
);

const DisclosureLevelSchema = z.enum(['essential', 'important', 'useful', 'advanced']);

const DisclosureSpecSchema = z.custom<DisclosureSpec>(
  (value) => value !== null && typeof value === 'object',
  'Expected disclosure spec object',
);

export interface RenderMarkdownOptions {
  sizeBudget?: number;
  splitStrategy?: 'h2-boundary' | 'never';
  includeChildren?: boolean;
  includeFrontmatter?: boolean;
  disclosureLevel?: 'essential' | 'important' | 'useful' | 'advanced';
  disclosureSpec?: DisclosureSpec;
  routeProfile?: MarkdownRouteProfile;
  onRenderDocument?: (event: MarkdownRenderEvent) => void;
}

export const RenderMarkdownOptionsSchema = z
  .strictObject({
    sizeBudget: z.number().int().optional(),
    splitStrategy: z.enum(['h2-boundary', 'never']).optional(),
    includeChildren: z.boolean().optional(),
    includeFrontmatter: z.boolean().optional(),
    disclosureLevel: DisclosureLevelSchema.optional(),
    disclosureSpec: DisclosureSpecSchema.optional(),
    routeProfile: MarkdownRouteProfileSchema.optional(),
    onRenderDocument: z
      .custom<
        NonNullable<RenderMarkdownOptions['onRenderDocument']>
      >((value) => typeof value === 'function', 'Expected render event callback')
      .optional(),
  })
  .readonly();

export interface RenderCompactOptions {
  sectionSeparator?: '===' | '---' | 'none';
  includeHeader?: boolean;
  wrapLines?: number;
  /**
   * Per-entry content depth. Fragments that support disclosure (e.g.
   * OverviewDigest) trim or expand accordingly; fragments without disclosure
   * branching ignore it. Undefined renders at full fidelity (back-compatible).
   */
  richness?: ContentRichness;
}

export const RenderCompactOptionsSchema = z
  .strictObject({
    sectionSeparator: z.enum(['===', '---', 'none']).optional(),
    includeHeader: z.boolean().optional(),
    wrapLines: z.number().int().optional(),
    richness: ContentRichnessSchema.optional(),
  })
  .readonly();

export interface RenderJsonOptions {
  pretty?: boolean;
  stableKeyOrder?: boolean;
}

export const RenderJsonOptionsSchema = z
  .strictObject({
    pretty: z.boolean().optional(),
    stableKeyOrder: z.boolean().optional(),
  })
  .readonly();

export interface RenderUiOptions {
  resolveChildLinks: boolean;
}

export const RenderUiOptionsSchema = z
  .strictObject({
    resolveChildLinks: z.boolean(),
  })
  .readonly();

export const RendererOptionsSchema = z.union([
  RenderMarkdownOptionsSchema,
  RenderCompactOptionsSchema,
  RenderJsonOptionsSchema,
  RenderUiOptionsSchema,
]);
