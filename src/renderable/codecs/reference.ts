/**
 * @libar-docs
 * @libar-docs-pattern ReferenceDocumentCodec
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Parameterized Reference Document Codec
 *
 * A single codec factory that creates reference document codecs from
 * configuration objects. Replaces 11 recipe .feature files with
 * TypeScript config.
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

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for a reference document type.
 *
 * Each config object replaces one recipe .feature file.
 * The Source Mapping from the recipe becomes these fields.
 */
export interface ReferenceDocConfig {
  /** Document title (e.g., "Process Guard Reference") */
  readonly title: string;

  /** Convention tag values to extract from decision records */
  readonly conventionTags: readonly string[];

  /**
   * Glob patterns for TypeScript shape extraction sources.
   * Placeholder — requires SourceMapper integration.
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
 * The codec composes a RenderableDocument from convention content
 * and behavior patterns. Shape extraction is a placeholder for
 * future SourceMapper integration.
 *
 * @param config - Reference document configuration (replaces recipe file)
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

      // 2. Behavior content from tagged patterns
      if (config.behaviorTags.length > 0) {
        sections.push(...buildBehaviorSections(dataset, config.behaviorTags, opts.detailLevel));
      }

      // 3. Shape extraction placeholder (requires runtime file access)
      // config.shapeSources will be used when SourceMapper integration is added

      if (sections.length === 0) {
        sections.push(
          paragraph('No content found for the configured convention tags and behavior tags.')
        );
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
