// architect-projection public surface.
//
// This file re-exports four internal barrels. To narrow a consumer to a single
// subdomain (e.g. to import only governance schemas or only renderers),
// prefer one of the dedicated exports documented in package.json rather than
// the aggregated surface below:
//
//   import { ... } from '@libar-dev/architect-projection/blocks'
//   import { ... } from '@libar-dev/architect-projection/fragments'
//   import { ... } from '@libar-dev/architect-projection/projections'
//   import { ... } from '@libar-dev/architect-projection/renderers'
//
// Context types that are shared across subdomains (ProjectionContext,
// TagExampleOverride, etc.) stay explicitly enumerated below.

export * from './blocks/schema.js';
export * from './disclosure/index.js';
export * from './routing/index.js';
export * from './fragments/index.js';
export * from './projections/index.js';
export * from './renderers/index.js';

export { PerspectiveHintSchema, ProjectionContextSchema } from './context/projection-context.js';
export type {
  PerspectiveHint,
  ProjectionContext,
  TagExampleOverride,
  TagExampleOverrides,
} from './context/projection-context.js';
export type {
  MarkdownRenderEvent,
  ProjectionInput,
  RenderCompactOptions,
  RenderJsonOptions,
  RenderMarkdownOptions,
  RenderUiOptions,
} from './renderers/types.js';
