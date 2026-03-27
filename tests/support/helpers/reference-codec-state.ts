/**
 * Shared state and helpers for reference-codec test splits.
 *
 * Extracted from the original reference-codec.steps.ts to be shared between
 * reference-codec-core.steps.ts, reference-codec-diagrams.steps.ts,
 * reference-codec-diagram-types.steps.ts, and reference-codec-detail-rendering.steps.ts.
 */

import type { MasterDataset } from '../../../src/validation-schemas/master-dataset.js';
import type { RenderableDocument } from '../../../src/renderable/schema.js';
import type { DetailLevel } from '../../../src/renderable/codecs/types/base.js';
import {
  createReferenceCodec,
  type ReferenceDocConfig,
} from '../../../src/renderable/codecs/reference.js';
import { createTestPattern, resetPatternCounter } from '../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findLists,
  findParagraphs,
  findTables,
  findBlocksByType,
  findCollapsibles,
  findLinkOuts,
} from './document-assertions.js';

// Re-export for step files
export {
  createReferenceCodec,
  createTestPattern,
  createTestMasterDataset,
  findHeadings,
  findLists,
  findParagraphs,
  findTables,
  findBlocksByType,
  findCollapsibles,
  findLinkOuts,
};
export type { MasterDataset, RenderableDocument, DetailLevel, ReferenceDocConfig };

// ============================================================================
// State
// ============================================================================

export interface ReferenceCodecState {
  config: ReferenceDocConfig | null;
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
}

export function initState(): ReferenceCodecState {
  resetPatternCounter();
  return { config: null, dataset: null, document: null };
}

// ============================================================================
// Helpers
// ============================================================================

export function makeConfig(conventionTags: string, behaviorCategories: string): ReferenceDocConfig {
  return {
    title: 'Test Reference Document',
    conventionTags: conventionTags ? conventionTags.split(',').map((t) => t.trim()) : [],
    shapeSelectors: [],
    behaviorCategories: behaviorCategories
      ? behaviorCategories.split(',').map((t) => t.trim())
      : [],
    claudeMdSection: 'test',
    docsFilename: 'TEST-REFERENCE.md',
    claudeMdFilename: 'test.md',
  };
}

export function getRenderedMarkdown(state: ReferenceCodecState): string {
  const doc = state.document!;
  // Flatten paragraph text and code block content for content assertions
  const paragraphText = findParagraphs(doc)
    .map((p) => p.text)
    .join('\n');
  const codeText = findBlocksByType(doc, 'code')
    .map((c) => c.content)
    .join('\n');
  return `${paragraphText}\n${codeText}`;
}
