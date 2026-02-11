/**
 * @libar-docs
 * @libar-docs-pattern ReferenceDocumentCodec
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Parameterized Reference Document Codec
 *
 * A single codec factory that creates reference document codecs from
 * configuration objects. Convention content is sourced from
 * decision records tagged with @libar-docs-convention.
 *
 * ### When to Use
 *
 * - When generating reference documentation from convention-tagged decisions
 * - When creating both detailed (docs/) and summary (_claude-md/) outputs
 *
 * ### Factory Pattern
 *
 * ```typescript
 * const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
 * const doc = codec.decode(dataset);
 * ```
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
} from '../../validation-schemas/master-dataset.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  code,
  document,
} from '../schema.js';
import {
  type BaseCodecOptions,
  type DetailLevel,
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
} from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { extractConventions, type ConventionBundle } from './convention-extractor.js';
import { extractShapesFromDataset } from './shape-matcher.js';
import type { ExtractedShape } from '../../validation-schemas/extracted-shape.js';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for a reference document type.
 *
 * Each config object defines one reference document's composition.
 * Convention tags, shape sources, and behavior tags control content assembly.
 */
export interface ReferenceDocConfig {
  /** Document title (e.g., "Process Guard Reference") */
  readonly title: string;

  /** Convention tag values to extract from decision records */
  readonly conventionTags: readonly string[];

  /**
   * Glob patterns for TypeScript shape extraction sources.
   * Resolved via in-memory matching against pattern.source.file (AD-6).
   */
  readonly shapeSources: readonly string[];

  /** Tags to filter behavior patterns from MasterDataset */
  readonly behaviorTags: readonly string[];

  /** Target _claude-md/ directory for summary output */
  readonly claudeMdSection: string;

  /** Output filename for detailed docs (in docs/) */
  readonly docsFilename: string;

  /** Output filename for summary _claude-md module */
  readonly claudeMdFilename: string;
}

// ============================================================================
// Reference Codec Options
// ============================================================================

export interface ReferenceCodecOptions extends BaseCodecOptions {
  /** Override detail level (default: 'standard') */
  readonly detailLevel?: DetailLevel;
}

const DEFAULT_REFERENCE_OPTIONS: Required<ReferenceCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  detailLevel: 'standard',
};

// ============================================================================
// Codec Factory
// ============================================================================

/**
 * Creates a reference document codec from configuration.
 *
 * The codec composes a RenderableDocument from three sources:
 * 1. Convention content from convention-tagged decision records
 * 2. TypeScript shapes from patterns matching shapeSources globs
 * 3. Behavior content from category-tagged patterns
 *
 * @param config - Reference document configuration
 * @param options - Codec options including DetailLevel
 */
export function createReferenceCodec(
  config: ReferenceDocConfig,
  options?: ReferenceCodecOptions
): DocumentCodec {
  const opts = mergeOptions(DEFAULT_REFERENCE_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      const sections: SectionBlock[] = [];

      // 1. Convention content from tagged decision records
      const conventions = extractConventions(dataset, config.conventionTags);
      if (conventions.length > 0) {
        sections.push(...buildConventionSections(conventions, opts.detailLevel));
      }

      // 2. Shape extraction from matching patterns (AD-6: in-memory glob matching)
      if (config.shapeSources.length > 0) {
        const shapes = extractShapesFromDataset(dataset, config.shapeSources);
        if (shapes.length > 0) {
          sections.push(...buildShapeSections(shapes, opts.detailLevel));
        }
      }

      // 3. Behavior content from tagged patterns
      if (config.behaviorTags.length > 0) {
        sections.push(...buildBehaviorSections(dataset, config.behaviorTags, opts.detailLevel));
      }

      if (sections.length === 0) {
        sections.push(paragraph('No content found for the configured sources.'));
      }

      return document(config.title, sections, {
        purpose: `Reference document: ${config.title}`,
        detailLevel: opts.detailLevel === 'summary' ? 'Compact summary' : 'Full reference',
      });
    },
    encode: (): never => {
      throw new Error('ReferenceDocumentCodec is decode-only');
    },
  });
}

// ============================================================================
// Section Builders
// ============================================================================

/**
 * Build sections from convention bundles.
 */
function buildConventionSections(
  conventions: readonly ConventionBundle[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  for (const bundle of conventions) {
    if (bundle.rules.length === 0) continue;

    for (const rule of bundle.rules) {
      sections.push(heading(2, rule.ruleName));

      if (rule.invariant) {
        sections.push(paragraph(`**Invariant:** ${rule.invariant}`));
      }

      if (rule.narrative && detailLevel !== 'summary') {
        sections.push(paragraph(rule.narrative));
      }

      if (rule.rationale && detailLevel === 'detailed') {
        sections.push(paragraph(`**Rationale:** ${rule.rationale}`));
      }

      for (const tbl of rule.tables) {
        const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
        sections.push(table([...tbl.headers], rows));
      }

      if (rule.verifiedBy && rule.verifiedBy.length > 0 && detailLevel === 'detailed') {
        sections.push(paragraph(`**Verified by:** ${rule.verifiedBy.join(', ')}`));
      }

      sections.push(separator());
    }
  }

  return sections;
}

/**
 * Build sections from behavior-tagged patterns.
 */
function buildBehaviorSections(
  dataset: MasterDataset,
  behaviorTags: readonly string[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Filter patterns whose category matches any behaviorTag
  const matchingPatterns = dataset.patterns.filter((p) => behaviorTags.includes(p.category));

  if (matchingPatterns.length === 0) return sections;

  sections.push(heading(2, 'Behavior Specifications'));

  for (const pattern of matchingPatterns) {
    sections.push(heading(3, pattern.name));

    if (pattern.directive.description && detailLevel !== 'summary') {
      sections.push(paragraph(pattern.directive.description));
    }

    if (pattern.rules && pattern.rules.length > 0) {
      const ruleRows = pattern.rules.map((r) => [
        r.name,
        r.description ? r.description.substring(0, 120) : '',
      ]);
      sections.push(table(['Rule', 'Description'], ruleRows));
    }
  }

  sections.push(separator());
  return sections;
}

/**
 * Build sections from extracted TypeScript shapes.
 *
 * Composition order follows AD-5: conventions → shapes → behaviors.
 *
 * Detail level controls:
 * - summary: type name + kind table only (compact)
 * - standard: names + source text code blocks
 * - detailed: full source with JSDoc and property doc tables
 */
function buildShapeSections(
  shapes: readonly ExtractedShape[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, 'API Types'));

  if (detailLevel === 'summary') {
    // Summary: just a table of type names and kinds
    const rows = shapes.map((s) => [s.name, s.kind]);
    sections.push(table(['Type', 'Kind'], rows));
  } else {
    // Standard/Detailed: code blocks for each shape
    for (const shape of shapes) {
      sections.push(heading(3, `${shape.name} (${shape.kind})`));

      if (shape.jsDoc && detailLevel === 'detailed') {
        sections.push(paragraph(shape.jsDoc));
      }

      sections.push(code(shape.sourceText, 'typescript'));

      // Property docs table for interfaces at detailed level
      if (detailLevel === 'detailed' && shape.propertyDocs && shape.propertyDocs.length > 0) {
        const propRows = shape.propertyDocs.map((p) => [p.name, p.jsDoc]);
        sections.push(table(['Property', 'Description'], propRows));
      }
    }
  }

  sections.push(separator());
  return sections;
}
