/**
 * @architect
 *
 * Render-layer options for progressive disclosure.
 * Size budgets and detail-level enforcement live here (not in codec options)
 * to keep codecs focused on content decisions.
 */

import type { DetailLevel } from './codecs/types/base.js';
import type { RenderableDocument } from './schema.js';

/**
 * Size budget configuration for auto-splitting oversized detail files.
 */
export interface SizeBudget {
  /** Maximum lines per detail file before splitting (default: unlimited) */
  readonly detailFile?: number;
}

/** Default size budget — no splitting (backward compatible) */
export const DEFAULT_SIZE_BUDGET: SizeBudget = {};

/**
 * Render-layer options controlling output format and splitting.
 *
 * Passed to `renderDocumentWithFiles()` — NOT to codecs.
 * Codecs produce content; the render layer controls presentation.
 */
export interface RenderOptions {
  /** Size budget for auto-splitting detail files */
  readonly sizeBudget?: SizeBudget;
  /** Generate "← Back to" links in sub-files */
  readonly generateBackLinks?: boolean;
  /** Custom renderer function (default: renderToMarkdown) */
  readonly renderer?: (doc: RenderableDocument) => string;
  /** Detail level for renderer-level enforcement (optional) */
  readonly detailLevel?: DetailLevel;
}
