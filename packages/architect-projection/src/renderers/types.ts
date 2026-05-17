import type { Fragment, ProjectionBundle } from '../fragments/index.js';
import type { BundleRouting } from '../fragments/base.js';
import type { DisclosureSpec } from '../disclosure/spec.js';
import type { LogicalRouteId } from '../routing/route-id.js';

export type ProjectionInput = Fragment | ProjectionBundle<Fragment>;

export interface MarkdownRouteProfile {
  mapPath: (
    routeId: LogicalRouteId,
    kind: Fragment['kind'],
    key: string | undefined,
    routing: BundleRouting | undefined,
  ) => string;
}

export interface MarkdownRenderEvent {
  readonly renderKey: string;
  readonly path: string;
  readonly title: string;
  readonly phase: 'measure' | 'emit';
  readonly lineCount: number;
}

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

export interface RenderCompactOptions {
  sectionSeparator?: '===' | '---' | 'none';
  includeHeader?: boolean;
  wrapLines?: number;
}

export interface RenderJsonOptions {
  pretty?: boolean;
  /** Defaults to true when omitted. */
  stableKeyOrder?: boolean;
}

export interface RenderUiOptions {
  resolveChildLinks: boolean;
}
