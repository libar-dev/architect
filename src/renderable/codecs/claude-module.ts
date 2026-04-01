/**
 * @architect
 * @architect-pattern ClaudeModuleCodec
 * @architect-status active
 * @architect-convention codec-registry
 * @architect-product-area:Generation
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
 * - Feature description → skipped (meta-documentation, not operational content)
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

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
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
import {
  type BaseCodecOptions,
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
  createDecodeOnlyCodec,
} from './types/base.js';
import { renderToClaudeMdModule } from '../render.js';
import { parseBusinessRuleAnnotations } from './helpers.js';
import { extractTablesAsSectionBlocks } from './convention-extractor.js';
import type { ClaudeSectionValue } from '../../taxonomy/claude-section-values.js';

const DEFAULT_CLAUDE_SECTION: ClaudeSectionValue = 'core';

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
export function createClaudeModuleCodec(options?: ClaudeModuleCodecOptions): DocumentCodec {
  const opts = mergeOptions(DEFAULT_CLAUDE_MODULE_OPTIONS, options);

  return createDecodeOnlyCodec(({ dataset }) => buildClaudeModuleDocument(dataset, opts));
}

/**
 * Default Claude Module Codec
 *
 * Transforms MasterDataset → RenderableDocument for CLAUDE.md modules.
 * Uses default options with standard detail level.
 */
export const ClaudeModuleCodec = createClaudeModuleCodec();

export const codecMeta = {
  type: 'claude-modules',
  outputPath: 'CLAUDE-MODULES.md',
  description: 'CLAUDE.md modules generated from annotated behavior specs',
  factory: createClaudeModuleCodec,
  defaultInstance: ClaudeModuleCodec,
  renderer: renderToClaudeMdModule,
} as const;

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
        paragraph('No patterns have `@architect-claude-module` tags.'),
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
    p.claudeSection ?? DEFAULT_CLAUDE_SECTION,
    p.name,
    `${p.rules?.length ?? 0} rules`,
  ]);
  sections.push(table(['Module', 'Section', 'Source Pattern', 'Content'], rows));

  // Build each module as an additional file
  const additionalFiles: Record<string, RenderableDocument> = {};
  for (const pattern of modulePatterns) {
    const section = pattern.claudeSection ?? DEFAULT_CLAUDE_SECTION;
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

  // Skip Feature description (Problem/Solution preamble) — it is meta-documentation
  // about why the spec exists, not operational content. Only Rule blocks contain
  // the actual invariants and guidance needed in _claude-md/ modules.

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
 * Build a Rule section (H4 heading + invariant + rationale + tables).
 *
 * Related: `renderRuleDescription()` in helpers.ts performs the same
 * annotation-parse-to-blocks sequence but produces full-detail output
 * (includes verifiedBy, codeExamples, remainingContent). This function
 * intentionally produces compact output for _claude-md/ modules.
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
