/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DecisionDocGenerator
 * @libar-docs-status completed
 * @libar-docs-phase 27
 * @libar-docs-depends-on DecisionDocCodec,SourceMapper
 *
 * ## Decision Doc Generator - Documentation from Decision Documents
 *
 * Orchestrates the full pipeline for generating documentation from decision
 * documents (ADR/PDR in .feature format):
 *
 * 1. Decision parsing - Extract source mappings, rules, DocStrings
 * 2. Source mapping - Aggregate content from TypeScript, Gherkin, decision sources
 * 3. Content assembly - Build RenderableDocument from aggregated sections
 * 4. Multi-level output - Generate compact (_claude-md/) and detailed (docs/) versions
 *
 * ### When to Use
 *
 * - When generating documentation from ADR/PDR decision documents
 * - When decision documents contain source mapping tables
 * - When building progressive disclosure docs at multiple detail levels
 *
 * ### Output Path Convention
 *
 * - Compact: `_claude-md/{section}/{module}.md` (~50 lines)
 * - Detailed: `docs/{PATTERN-NAME}.md` (~300 lines)
 */

import type { DocumentGenerator, GeneratorContext, GeneratorOutput, OutputFile } from '../types.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { DetailLevel } from '../../renderable/codecs/types/base.js';
import type { RenderableDocument, SectionBlock } from '../../renderable/schema.js';
import {
  heading,
  paragraph,
  code,
  list,
  separator,
  collapsible,
  document as createDocument,
} from '../../renderable/schema.js';
import { renderToMarkdown } from '../../renderable/render.js';
import {
  parseDecisionDocument,
  type DecisionDocContent,
} from '../../renderable/codecs/decision-doc.js';
import {
  executeSourceMapping,
  type SourceMapperOptions,
  type AggregatedContent,
} from '../source-mapper.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for decision doc generation
 */
export interface DecisionDocGeneratorOptions {
  /** Base directory for resolving relative paths */
  baseDir: string;

  /** Detail level for output generation */
  detailLevel?: DetailLevel;

  /** Output directory override (defaults to standard paths) */
  outputDir?: string;

  /** Claude MD section name (e.g., "validation" for _claude-md/validation/) */
  claudeMdSection?: string;
}

/**
 * Output paths for generated documentation
 */
export interface GeneratedOutputPaths {
  /** Path for compact output (e.g., _claude-md/validation/process-guard.md) */
  compact: string;

  /** Path for detailed output (e.g., docs/PROCESS-GUARD.md) */
  detailed: string;
}

/**
 * Result of decision doc generation
 */
export interface DecisionDocGeneratorResult {
  /** Successfully generated output files */
  files: OutputFile[];

  /** Warnings produced during generation */
  warnings: string[];

  /** Errors that prevented generation */
  errors: string[];
}

// =============================================================================
// Tag Helpers
// =============================================================================

/**
 * Extract claude-md-section from pattern tags
 *
 * Looks for `@libar-docs-claude-md-section:VALUE` tag and extracts the value.
 * Returns undefined if tag not found.
 *
 * @param pattern - Extracted pattern with directive tags
 * @returns Section value (e.g., "validation") or undefined
 *
 * @example
 * ```typescript
 * // Pattern with @libar-docs-claude-md-section:validation tag
 * const section = extractClaudeMdSection(pattern);
 * // Returns: "validation"
 * ```
 */
export function extractClaudeMdSection(pattern: ExtractedPattern): string | undefined {
  const tags = pattern.directive.tags;
  for (const tag of tags) {
    // Match @libar-docs-claude-md-section:VALUE or @docs-claude-md-section:VALUE
    const match = /^@(?:libar-)?docs-claude-md-section[:\s]+(.+)$/i.exec(tag);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

// =============================================================================
// Output Path Resolution
// =============================================================================

/**
 * Determine output paths from decision metadata
 *
 * Uses pattern name and optional section to compute paths:
 * - Compact: _claude-md/{section}/{module}.md
 * - Detailed: docs/{PATTERN-NAME}.md
 *
 * @param patternName - Pattern name from decision document
 * @param options - Generator options including section override
 * @returns Computed output paths
 *
 * @example
 * ```typescript
 * const paths = determineOutputPaths('ProcessGuard', { section: 'validation' });
 * // Returns:
 * // {
 * //   compact: '_claude-md/validation/process-guard.md',
 * //   detailed: 'docs/PROCESS-GUARD.md'
 * // }
 * ```
 */
export function determineOutputPaths(
  patternName: string,
  options?: { section?: string }
): GeneratedOutputPaths {
  // Convert PatternName to kebab-case for module name
  const moduleName = patternName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  // Use provided section or default to 'generated'
  const section = options?.section ?? 'generated';

  // Convert PatternName to UPPER-KEBAB-CASE for detailed path
  const upperKebab = patternName.replace(/([a-z])([A-Z])/g, '$1-$2').toUpperCase();

  return {
    compact: `_claude-md/${section}/${moduleName}.md`,
    detailed: `docs/${upperKebab}.md`,
  };
}

// =============================================================================
// Content Generation
// =============================================================================

/**
 * Generate compact/summary output (~50 lines)
 *
 * Includes only essential tables and type definitions.
 * Suitable for Claude MD context files.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for compact output
 */
export function generateCompactOutput(
  decisionContent: DecisionDocContent,
  aggregatedContent: AggregatedContent
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Title and brief
  sections.push(heading(2, 'Overview'));

  // Extract key tables and types from aggregated sections
  for (const extracted of aggregatedContent.sections) {
    // Only include sections with substantial content
    if (!extracted.content || extracted.content.trim().length === 0) {
      continue;
    }

    // For compact output, only include:
    // 1. Type/interface definitions (shapes)
    // 2. Key tables
    if (extracted.shapes && extracted.shapes.length > 0) {
      sections.push(heading(3, extracted.section));

      // Render shapes as compact type list
      const typeList = extracted.shapes.map((shape) => `\`${shape.name}\` - ${shape.kind}`);
      sections.push(list(typeList));
    } else if (extracted.content.includes('|')) {
      // Content contains a table - include it
      sections.push(heading(3, extracted.section));
      sections.push(paragraph(extracted.content));
    }
  }

  // If no sections were added, add a placeholder
  if (sections.length <= 1) {
    sections.push(paragraph('*No structured content extracted.*'));
  }

  return createDocument(decisionContent.patternName, sections, {
    purpose: 'Compact reference for Claude context',
    detailLevel: 'summary',
  });
}

/**
 * Generate detailed output (~300 lines)
 *
 * Includes everything: JSDoc, examples, full descriptions.
 * Suitable for docs/ directory.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for detailed output
 */
export function generateDetailedOutput(
  decisionContent: DecisionDocContent,
  aggregatedContent: AggregatedContent
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Feature description
  if (decisionContent.description && decisionContent.description.trim().length > 0) {
    sections.push(paragraph(decisionContent.description));
    sections.push(separator());
  }

  // Context section from rules
  if (decisionContent.rules.context.length > 0) {
    sections.push(heading(2, 'Context'));
    for (const rule of decisionContent.rules.context) {
      sections.push(heading(3, rule.name.replace(/^Context\s*[-:]\s*/i, '')));
      if (rule.description) {
        sections.push(paragraph(rule.description));
      }
    }
  }

  // Decision section from rules
  if (decisionContent.rules.decision.length > 0) {
    sections.push(heading(2, 'Decision'));
    for (const rule of decisionContent.rules.decision) {
      sections.push(heading(3, rule.name.replace(/^Decision\s*[-:]\s*/i, '')));
      if (rule.description) {
        sections.push(paragraph(rule.description));
      }
    }
  }

  // Aggregated content sections
  if (aggregatedContent.sections.length > 0) {
    sections.push(heading(2, 'Implementation Details'));

    for (const extracted of aggregatedContent.sections) {
      if (!extracted.content || extracted.content.trim().length === 0) {
        continue;
      }

      sections.push(heading(3, extracted.section));

      // Handle different content types
      if (extracted.shapes && extracted.shapes.length > 0) {
        // Render full shape definitions with JSDoc
        for (const shape of extracted.shapes) {
          if (shape.jsDoc) {
            sections.push(paragraph(`*${shape.jsDoc}*`));
          }
          sections.push(code(shape.sourceText, 'typescript'));
        }
      } else if (extracted.docStrings && extracted.docStrings.length > 0) {
        // Render DocStrings as code blocks
        for (const ds of extracted.docStrings) {
          sections.push(code(ds.content, ds.language));
        }
      } else {
        // Plain content
        sections.push(paragraph(extracted.content));
      }
    }
  }

  // Consequences section from rules
  if (decisionContent.rules.consequences.length > 0) {
    sections.push(heading(2, 'Consequences'));
    for (const rule of decisionContent.rules.consequences) {
      sections.push(heading(3, rule.name.replace(/^Consequence[s]?\s*[-:]\s*/i, '')));
      if (rule.description) {
        sections.push(paragraph(rule.description));
      }
    }
  }

  // Other rules (custom sections)
  if (decisionContent.rules.other.length > 0) {
    for (const rule of decisionContent.rules.other) {
      sections.push(heading(2, rule.name));
      if (rule.description) {
        sections.push(paragraph(rule.description));
      }
    }
  }

  // DocStrings if not already included
  if (decisionContent.docStrings.length > 0 && aggregatedContent.sections.length === 0) {
    sections.push(heading(2, 'Examples'));
    for (const ds of decisionContent.docStrings) {
      sections.push(code(ds.content, ds.language));
    }
  }

  // Add generation warnings if any
  if (aggregatedContent.warnings.length > 0) {
    sections.push(separator());
    sections.push(
      collapsible(
        'Generation Warnings',
        aggregatedContent.warnings.map((w) => paragraph(`- ${w.severity}: ${w.message}`))
      )
    );
  }

  return createDocument(decisionContent.patternName, sections, {
    purpose: 'Full documentation generated from decision document',
    detailLevel: 'detailed',
  });
}

/**
 * Generate standard output (~150 lines)
 *
 * Balance between compact and detailed: tables, types, key descriptions.
 * Suitable for general documentation.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for standard output
 */
export function generateStandardOutput(
  decisionContent: DecisionDocContent,
  aggregatedContent: AggregatedContent
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Brief description
  if (decisionContent.description && decisionContent.description.trim().length > 0) {
    const briefDesc = decisionContent.description.split('\n').slice(0, 3).join('\n');
    sections.push(paragraph(briefDesc));
    sections.push(separator());
  }

  // Context summary
  if (decisionContent.rules.context.length > 0) {
    sections.push(heading(2, 'Context'));
    const contextNames = decisionContent.rules.context.map((r) =>
      r.name.replace(/^Context\s*[-:]\s*/i, '')
    );
    sections.push(list(contextNames));
  }

  // Decision summary
  if (decisionContent.rules.decision.length > 0) {
    sections.push(heading(2, 'Decision'));
    for (const rule of decisionContent.rules.decision) {
      sections.push(heading(3, rule.name.replace(/^Decision\s*[-:]\s*/i, '')));
      // First paragraph only
      if (rule.description) {
        const firstPara = rule.description.split('\n\n')[0] ?? '';
        sections.push(paragraph(firstPara));
      }
    }
  }

  // Aggregated content with moderate detail
  for (const extracted of aggregatedContent.sections) {
    if (!extracted.content || extracted.content.trim().length === 0) {
      continue;
    }

    sections.push(heading(3, extracted.section));

    if (extracted.shapes && extracted.shapes.length > 0) {
      // Type definitions without full JSDoc
      for (const shape of extracted.shapes) {
        sections.push(code(shape.sourceText, 'typescript'));
      }
    } else {
      sections.push(paragraph(extracted.content));
    }
  }

  return createDocument(decisionContent.patternName, sections, {
    purpose: 'Standard documentation from decision document',
    detailLevel: 'standard',
  });
}

// =============================================================================
// Main Generation Function
// =============================================================================

/**
 * Generate documentation from a decision document
 *
 * Main entry point that orchestrates the full pipeline:
 * 1. Parse decision document to extract content
 * 2. Execute source mapping to aggregate content from referenced files
 * 3. Generate output at specified detail level(s)
 * 4. Return output files for writing
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Generation result with files and warnings
 *
 * @example
 * ```typescript
 * const result = await generateFromDecision(processGuardPattern, {
 *   baseDir: process.cwd(),
 *   detailLevel: 'detailed',
 *   claudeMdSection: 'validation',
 * });
 *
 * for (const file of result.files) {
 *   fs.writeFileSync(file.path, file.content);
 * }
 * ```
 */
export function generateFromDecision(
  pattern: ExtractedPattern,
  options: DecisionDocGeneratorOptions
): DecisionDocGeneratorResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const files: OutputFile[] = [];

  // Pattern name can come from directive.patternName or pattern.patternName or pattern.name
  // directive.patternName and pattern.patternName are optional, pattern.name is required
  const patternName = pattern.directive.patternName ?? pattern.patternName ?? pattern.name;

  const description = pattern.directive.description;
  const rules = pattern.rules ?? [];

  // Step 1: Parse decision document
  const decisionContent = parseDecisionDocument(patternName, description, rules);

  // Step 2: Execute source mapping (if mappings exist)
  let aggregatedContent: AggregatedContent = {
    sections: [],
    warnings: [],
    success: true,
  };

  if (decisionContent.sourceMappings.length > 0) {
    const mapperOptions: SourceMapperOptions = {
      baseDir: options.baseDir,
      decisionDocPath: pattern.source.file,
      decisionContent,
      detailLevel: options.detailLevel ?? 'standard',
    };

    aggregatedContent = executeSourceMapping(decisionContent.sourceMappings, mapperOptions);

    // Collect warnings
    for (const w of aggregatedContent.warnings) {
      warnings.push(`${w.severity}: ${w.message}`);
    }
  }

  // Step 3: Generate output at requested detail level(s)
  const sectionOption = options.claudeMdSection;
  const outputPaths = determineOutputPaths(
    patternName,
    sectionOption ? { section: sectionOption } : undefined
  );

  const detailLevel = options.detailLevel ?? 'standard';

  // Generate based on detail level
  let doc: RenderableDocument;
  let outputPath: string;

  switch (detailLevel) {
    case 'summary':
      doc = generateCompactOutput(decisionContent, aggregatedContent);
      outputPath = outputPaths.compact;
      break;
    case 'detailed':
      doc = generateDetailedOutput(decisionContent, aggregatedContent);
      outputPath = outputPaths.detailed;
      break;
    case 'standard':
    default:
      doc = generateStandardOutput(decisionContent, aggregatedContent);
      outputPath = outputPaths.detailed;
      break;
  }

  // Render to markdown
  const content = renderToMarkdown(doc);
  files.push({ path: outputPath, content });

  return { files, warnings, errors };
}

/**
 * Generate both compact and detailed outputs
 *
 * Convenience function that generates documentation at both detail levels
 * for maximum utility.
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Generation result with both output files
 */
export function generateFromDecisionMultiLevel(
  pattern: ExtractedPattern,
  options: DecisionDocGeneratorOptions
): DecisionDocGeneratorResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const files: OutputFile[] = [];

  // Generate compact version
  const compactResult = generateFromDecision(pattern, {
    ...options,
    detailLevel: 'summary',
  });
  files.push(...compactResult.files);
  warnings.push(...compactResult.warnings);
  errors.push(...compactResult.errors);

  // Generate detailed version (only if compact succeeded)
  if (compactResult.errors.length === 0) {
    const detailedResult = generateFromDecision(pattern, {
      ...options,
      detailLevel: 'detailed',
    });
    files.push(...detailedResult.files);
    warnings.push(...detailedResult.warnings);
    errors.push(...detailedResult.errors);
  }

  return { files, warnings, errors };
}

// =============================================================================
// DocumentGenerator Implementation
// =============================================================================

/**
 * Decision Doc Generator for registry integration
 *
 * Implements DocumentGenerator interface for use with the generator registry.
 * Filters patterns by type to find ADR/PDR decision documents with source mappings.
 */
export class DecisionDocGeneratorImpl implements DocumentGenerator {
  readonly name = 'doc-from-decision';
  readonly description = 'Generate documentation from ADR/PDR decision documents';

  generate(
    patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    const allFiles: OutputFile[] = [];

    // Filter for decision documents (ADR/PDR patterns with source mappings)
    const decisionPatterns = patterns.filter((p) => {
      // Check if pattern has source mapping table in description or rules
      const description = p.directive.description;
      const hasSourceMappingInDesc =
        description.includes('| Section |') &&
        (description.includes('| Source File |') || description.includes('| Source |'));

      // Check rules for source mapping tables
      const hasSourceMappingInRules = (p.rules ?? []).some(
        (rule) =>
          rule.description.includes('| Section |') &&
          (rule.description.includes('| Source File |') || rule.description.includes('| Source |'))
      );

      return hasSourceMappingInDesc || hasSourceMappingInRules;
    });

    if (decisionPatterns.length === 0) {
      console.warn(
        '[doc-from-decision] No decision documents with source mappings found. Ensure patterns have source mapping tables.'
      );
      return Promise.resolve({
        files: [],
      });
    }

    // Generate documentation for each decision pattern
    for (const pattern of decisionPatterns) {
      // Extract section from pattern tags or default to 'generated'
      const section = extractClaudeMdSection(pattern) ?? 'generated';

      const result = generateFromDecisionMultiLevel(pattern, {
        baseDir: context.baseDir,
        detailLevel: 'detailed', // Generate both levels
        claudeMdSection: section,
      });

      allFiles.push(...result.files);

      // Log errors and warnings (but don't fail)
      for (const error of result.errors) {
        console.error(`[doc-from-decision] Error: ${error}`);
      }
      for (const warning of result.warnings) {
        console.warn(`[doc-from-decision] ${warning}`);
      }
    }

    return Promise.resolve({
      files: allFiles,
    });
  }
}

/**
 * Create decision doc generator instance
 */
export function createDecisionDocGenerator(): DocumentGenerator {
  return new DecisionDocGeneratorImpl();
}
