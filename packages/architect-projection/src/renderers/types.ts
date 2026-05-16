import type { Fragment, ProjectionBundle } from '../fragments/index.js';
import type { DisclosureSpec } from '../projections/documentation-composition/disclosure-spec.js';
import type { LogicalRouteId } from '../projections/documentation-composition/progressive-disclosure.js';

export type ProjectionInput = Fragment | ProjectionBundle<Fragment>;

export interface MarkdownRouteProfile {
  mapPath: (routeId: LogicalRouteId, kind: Fragment['kind'], key?: string) => string;
}

export interface RenderMarkdownOptions {
  sizeBudget?: number;
  splitStrategy?: 'h2-boundary' | 'never';
  includeChildren?: boolean;
  includeFrontmatter?: boolean;
  disclosureLevel?: 'essential' | 'important' | 'useful' | 'advanced';
  disclosureSpec?: DisclosureSpec;
  routeProfile?: MarkdownRouteProfile;
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
