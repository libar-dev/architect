/**
 * @libar-docs
 * @libar-docs-core
 *
 * ## Renderable Document Model (RDM)
 *
 * Unified document generation using codecs and a universal renderer.
 *
 * Architecture:
 * ```
 * MasterDataset → Document Codecs → RenderableDocument → Universal Renderer → Markdown
 * ```
 *
 * Key Exports:
 * - Schema: `RenderableDocument`, `SectionBlock`, block builders
 * - Codecs: `PatternsDocumentCodec`, `TimelineCodec`, etc.
 * - Renderer: `renderToMarkdown`, `renderDocumentWithFiles`
 * - Generation: `generateDocument`, `generateAllDocuments`
 */

// ═══════════════════════════════════════════════════════════════════════════
// Schema Exports
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Schemas
  RenderableDocumentSchema,
  HeadingBlockSchema,
  ParagraphBlockSchema,
  SeparatorBlockSchema,
  TableBlockSchema,
  ListBlockSchema,
  CodeBlockSchema,
  MermaidBlockSchema,
  CollapsibleBlockSchema,
  LinkOutBlockSchema,
  SectionBlockSchema,
  // Types
  type RenderableDocument,
  type HeadingBlock,
  type ParagraphBlock,
  type SeparatorBlock,
  type TableBlock,
  type ListBlock,
  type CodeBlock,
  type MermaidBlock,
  type CollapsibleBlock,
  type LinkOutBlock,
  type SectionBlock,
  type ListItem,
  // Builders
  heading,
  paragraph,
  separator,
  table,
  list,
  code,
  mermaid,
  collapsible,
  linkOut,
  document,
} from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// Renderer Exports
// ═══════════════════════════════════════════════════════════════════════════

export { renderToMarkdown, renderDocumentWithFiles, type OutputFile } from './render.js';

// ═══════════════════════════════════════════════════════════════════════════
// Codec Exports
// ═══════════════════════════════════════════════════════════════════════════

export {
  PatternsDocumentCodec,
  RoadmapDocumentCodec,
  CompletedMilestonesCodec,
  RequirementsDocumentCodec,
  SessionContextCodec,
  RemainingWorkCodec,
} from './codecs/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Generation Exports
// ═══════════════════════════════════════════════════════════════════════════

export {
  generateDocument,
  generateDocuments,
  generateAllDocuments,
  getAvailableDocumentTypes,
  isValidDocumentType,
  getDocumentTypeInfo,
  DOCUMENT_TYPES,
  type DocumentType,
} from './generate.js';

// ═══════════════════════════════════════════════════════════════════════════
// Utility Exports
// ═══════════════════════════════════════════════════════════════════════════

export { normalizeStatus } from '../taxonomy/index.js';
export {
  getStatusEmoji,
  getDisplayName,
  formatCategoryName,
  extractFirstParagraph,
  extractSummary,
  computeStatusCounts,
  completionPercentage,
  renderProgressBar,
  sortByPhaseAndName,
  sortByStatusAndName,
  formatBusinessValue,
} from './utils.js';
export { groupBy } from '../utils/index.js';
