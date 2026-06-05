export { renderCompactText } from './render-compact-text.js';
export { renderJson } from './render-json.js';
export { renderMarkdown, renderTaxonomyManagedRegion } from './render-markdown.js';
export {
  applyManagedRegion,
  applyManagedRegions,
  managedRegionMarkers,
  ManagedRegionError,
  readManagedRegion,
} from './managed-region.js';
export { renderUi } from './render-ui.js';
export type {
  MarkdownRenderEvent,
  ProjectionInput,
  RenderCompactOptions,
  RenderJsonOptions,
  RenderMarkdownOptions,
  RenderUiOptions,
} from './types.js';
export {
  RendererOptionsSchema,
  RenderCompactOptionsSchema,
  RenderJsonOptionsSchema,
  RenderMarkdownOptionsSchema,
  RenderUiOptionsSchema,
} from './types.js';
export type { UiDocument, UiSection } from './render-ui.js';
