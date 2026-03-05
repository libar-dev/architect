/**
 * @libar-docs
 * @libar-docs-pattern ClaudeModuleCodec
 * @libar-docs-status active
 * @libar-docs-convention codec-registry
 * @libar-docs-product-area:Generation
 *
 * ## ClaudeModuleCodec
 *
 * Transforms MasterDataset into RenderableDocuments for CLAUDE.md module generation.
 * Filters patterns with `claudeModule` tags and generates compact markdown modules
 * suitable for the `_claude-md/` directory structure.
 *
 * **Purpose:** Generate CLAUDE.md modules from annotated behavior specs.
 *
 * **Output Files:** One file per claude-module-tagged pattern at `{section}/{module}.md`
 *
 * ### Content Extraction
 *
 * - Feature description → module introduction (Problem/Solution)
 * - Rule: blocks → H4 sections with invariant + rationale
 * - Scenario Outline Examples → decision tables
 * - Tables in Rule descriptions → preserved as-is
 *
 * ### Factory Pattern
 *
 * Use `createClaudeModuleCodec(options)` for custom options:
 * ```typescript
 * const codec = createClaudeModuleCodec({ detailLevel: 'detailed' });
 * const doc = codec.decode(dataset);
 * ```
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
} from '../../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { BusinessRule } from '../../validation-schemas/extracted-pattern.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  linkOut,
  document,
} from '../schema.js';
import { type BaseCodecOptions, DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { parseBusinessRuleAnnotations } from './helpers.js';
import { extractTablesAsSectionBlocks } from './convention-extractor.js';

// ═══════════════════════════════════════════════════════════════════════════
// Claude Module Codec Options
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for ClaudeModuleCodec
 *
 * Supports progressive disclosure via detailLevel:
 * - "summary": Rules and Examples tables only (compact)
 * - "standard": Above + invariant + rationale per rule
 * - "detailed": Full content including scenario details
 */
export interface ClaudeModuleCodecOptions extends BaseCodecOptions {
  /** Path prefix for "See: Full Documentation" links (default: "docs/") */
  fullDocsPath?: string;

  /** Include rationale section per rule (default: true) */
  includeRationale?: boolean;

  /** Include tables from rule descriptions (default: true) */
  includeTables?: boolean;
}

/**
 * Default options for ClaudeModuleCodec
 */
export const DEFAULT_CLAUDE_MODULE_OPTIONS: Required<ClaudeModuleCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  fullDocsPath: 'docs/',
  includeRationale: true,
  includeTables: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// Codec Creation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a ClaudeModuleCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 */
export function createClaudeModuleCodec(
  options?: ClaudeModuleCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_CLAUDE_MODULE_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildClaudeModuleDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error('ClaudeModuleCodec is decode-only. See zod-codecs.md');
    },
  });
}

/**
 * Default Claude Module Codec
 *
 * Transforms MasterDataset → RenderableDocument for CLAUDE.md modules.
 * Uses default options with standard detail level.
 */
export const ClaudeModuleCodec = createClaudeModuleCodec();

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the index document listing all generated modules,
 * with each module as an additionalFile.
 */
function buildClaudeModuleDocument(
  dataset: MasterDataset,
  options: Required<ClaudeModuleCodecOptions>
): RenderableDocument {
  // Filter to patterns with claudeModule set
  const modulePatterns = dataset.patterns.filter(
    (p) => p.claudeModule !== undefined && p.claudeModule !== ''
  );

  if (modulePatterns.length === 0) {
    return document(
      'Claude Modules',
      [
        heading(2, 'No Claude Modules Found'),
        paragraph('No patterns have `@libar-docs-claude-module` tags.'),
      ],
      {
        purpose: 'Claude module generation index',
      }
    );
  }

  // Build index sections
  const sections: SectionBlock[] = [];
  sections.push(
    heading(2, 'Generated Modules'),
    paragraph(`${modulePatterns.length} module(s) generated from annotated behavior specs.`)
  );

  // Summary table
  const rows = modulePatterns.map((p) => [
    p.claudeModule ?? '',
    p.claudeSection ?? 'core',
    p.name,
    `${p.rules?.length ?? 0} rules`,
  ]);
  sections.push(table(['Module', 'Section', 'Source Pattern', 'Content'], rows));

  // Build each module as an additional file
  const additionalFiles: Record<string, RenderableDocument> = {};
  for (const pattern of modulePatterns) {
    const section = pattern.claudeSection ?? 'core';
    const module = pattern.claudeModule ?? pattern.name;
    const filePath = `${section}/${module}.md`;
    additionalFiles[filePath] = buildModuleFile(pattern, options);
  }

  const docOptions: {
    purpose: string;
    detailLevel: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {
    purpose: 'Claude module generation index',
    detailLevel: options.detailLevel,
  };
  if (Object.keys(additionalFiles).length > 0) {
    docOptions.additionalFiles = additionalFiles;
  }

  return document('Claude Modules', sections, docOptions);
}

// ═══════════════════════════════════════════════════════════════════════════
// Module File Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a single module file from a pattern.
 * Extracts content from Feature description, Rule blocks, and Scenario Outline Examples.
 */
function buildModuleFile(
  pattern: ExtractedPattern,
  options: Required<ClaudeModuleCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];
  const featureDescription = pattern.directive.description;

  // Extract Problem/Solution from feature description
  const descSections = extractDescriptionSections(featureDescription);
  if (descSections.length > 0) {
    sections.push(...descSections);
  }

  // Rule blocks → H4 sections
  if (pattern.rules && pattern.rules.length > 0) {
    sections.push(separator());
    for (const rule of pattern.rules) {
      sections.push(...buildRuleSection(rule, options));
    }
  }

  // Scenario Outline Examples → decision tables
  if (options.detailLevel !== 'summary') {
    const examplesTables = extractExamplesTables(pattern);
    if (examplesTables.length > 0) {
      sections.push(...examplesTables);
    }
  }

  // See-also link
  if (options.fullDocsPath) {
    const slug = pattern.claudeModule ?? pattern.name.toLowerCase();
    const fullPath = `${options.fullDocsPath}${slug.toUpperCase()}.md`;
    sections.push(separator());
    sections.push(linkOut(`Full Documentation`, fullPath));
  }

  return document(pattern.name, sections, {
    purpose: `Claude module: ${pattern.claudeModule ?? pattern.name}`,
    detailLevel: options.detailLevel,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Content Extractors
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract Problem/Solution and tables from feature description.
 */
function extractDescriptionSections(description: string): SectionBlock[] {
  if (!description || description.trim().length === 0) {
    return [];
  }

  const sections: SectionBlock[] = [];
  const lines = description.trim().split('\n');
  const textBlocks: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Stop at Gherkin structural keywords that end the Feature description
    if (
      trimmed.startsWith('Background:') ||
      trimmed.startsWith('Scenario:') ||
      trimmed.startsWith('Scenario Outline:') ||
      trimmed.startsWith('Rule:')
    ) {
      break;
    }
    textBlocks.push(trimmed);
  }

  const text = textBlocks.join('\n').trim();
  if (text.length > 0) {
    sections.push(paragraph(text));
  }

  return sections;
}

/**
 * Build a Rule section (H4 heading + invariant + rationale + tables).
 */
function buildRuleSection(
  rule: BusinessRule,
  options: Required<ClaudeModuleCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // H2 heading from rule name (renderer offsets to H4 for _claude-md/ modules)
  sections.push(heading(2, rule.name));

  // Parse structured annotations from rule description
  const annotations = parseBusinessRuleAnnotations(rule.description);

  if (annotations.invariant) {
    sections.push(paragraph(`**Invariant:** ${annotations.invariant}`));
  }

  if (options.includeRationale && annotations.rationale) {
    sections.push(paragraph(`**Rationale:** ${annotations.rationale}`));
  }

  // Extract and preserve tables from the rule description
  if (options.includeTables) {
    const tables = extractTablesAsSectionBlocks(rule.description);
    for (const t of tables) {
      sections.push(t);
    }
  }

  return sections;
}

/**
 * Extract Scenario Outline Examples tables from pattern scenarios.
 */
function extractExamplesTables(pattern: ExtractedPattern): SectionBlock[] {
  const sections: SectionBlock[] = [];

  if (!pattern.scenarios) return sections;

  for (const scenario of pattern.scenarios) {
    if (!scenario.steps) continue;

    for (const step of scenario.steps) {
      const dt = step.dataTable;
      if (dt && dt.headers.length > 0 && dt.rows.length > 0) {
        const rows = dt.rows.map((row) => dt.headers.map((h) => row[h] ?? ''));
        sections.push(table([...dt.headers], rows));
      }
    }
  }

  return sections;
}
