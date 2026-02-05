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
import { parseDescriptionWithDocStrings } from '../../renderable/codecs/helpers.js';
import {
  executeSourceMapping,
  type SourceMapperOptions,
  type AggregatedContent,
} from '../source-mapper.js';
import { toKebabCase, toUpperKebabCase } from '../../utils/string-utils.js';
import {
  createWarningCollector,
  type Warning,
  type WarningCollector,
} from '../warning-collector.js';
import { validateSourceMappingTable, type ValidationResult } from '../source-mapping-validator.js';
import { deduplicateSections, type DeduplicationResult } from '../content-deduplicator.js';

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

  /** Claude MD section name (e.g., "validation" for _claude-md/validation/) */
  claudeMdSection?: string;

  /** Enable pre-flight validation of source mappings (default: true) */
  enableValidation?: boolean;

  /** Enable content deduplication after extraction (default: true) */
  enableDeduplication?: boolean;

  /** Enable warning collection across pipeline stages (default: true) */
  enableWarningCollection?: boolean;
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
  const moduleName = toKebabCase(patternName);

  // Use provided section or default to 'generated'
  const section = options?.section ?? 'generated';

  // Convert PatternName to UPPER-KEBAB-CASE for detailed path
  const upperKebab = toUpperKebabCase(patternName);

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

  // Track rendered DocString content to prevent duplicates
  // Key is content hash (language + content) to identify unique DocStrings
  const renderedDocStrings = new Set<string>();

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
        sections.push(...parseDescriptionWithDocStrings(rule.description));
      }
    }
  }

  // Decision section from rules
  if (decisionContent.rules.decision.length > 0) {
    sections.push(heading(2, 'Decision'));
    for (const rule of decisionContent.rules.decision) {
      sections.push(heading(3, rule.name.replace(/^Decision\s*[-:]\s*/i, '')));
      if (rule.description) {
        sections.push(...parseDescriptionWithDocStrings(rule.description));
      }
    }
  }

  // Aggregated content sections
  // Include all sections from Source Mapping - both external files AND self-references
  // The Source Mapping table defines the canonical order of content
  // Self-references to rules will be rendered here, and we filter them from "Other rules" below
  const nonDuplicateSections = aggregatedContent.sections.filter((extracted) => {
    // Skip empty content
    if (!extracted.content || extracted.content.trim().length === 0) {
      return false;
    }
    return true;
  });

  if (nonDuplicateSections.length > 0) {
    sections.push(heading(2, 'Implementation Details'));

    for (const extracted of nonDuplicateSections) {
      sections.push(heading(3, extracted.section));

      // Handle different content types
      if (extracted.shapes && extracted.shapes.length > 0) {
        // Render full shape definitions with JSDoc
        for (const shape of extracted.shapes) {
          // Include JSDoc as part of the code block (combined with source)
          const fullSource = shape.jsDoc ? `${shape.jsDoc}\n${shape.sourceText}` : shape.sourceText;
          sections.push(code(fullSource, 'typescript'));
        }
      } else if (extracted.docStrings && extracted.docStrings.length > 0) {
        // Check if content has meaningful text beyond just DocStrings
        // Rule block extractions include context text, tables, AND DocStrings
        // We should render full content to preserve all text, not just DocStrings
        const contentWithoutDocStrings = extracted.content
          .replace(/"""[\w]*\n[\s\S]*?"""/g, '') // Remove Gherkin DocStrings
          .replace(/```[\w]*\n[\s\S]*?```/g, '') // Remove markdown code blocks
          .trim();

        if (contentWithoutDocStrings.length > 0) {
          // Content has text beyond DocStrings - render full content with inline DocStrings
          sections.push(...parseDescriptionWithDocStrings(extracted.content));
        } else {
          // Content is ONLY DocStrings - render them as code blocks, skipping duplicates
          for (const ds of extracted.docStrings) {
            const contentKey = `${ds.language}:${ds.content}`;
            if (!renderedDocStrings.has(contentKey)) {
              renderedDocStrings.add(contentKey);
              sections.push(code(ds.content, ds.language));
            }
          }
        }
      } else {
        // Plain content - convert DocStrings to code fences
        sections.push(...parseDescriptionWithDocStrings(extracted.content));
      }
    }
  }

  // Consequences section from rules
  if (decisionContent.rules.consequences.length > 0) {
    sections.push(heading(2, 'Consequences'));
    for (const rule of decisionContent.rules.consequences) {
      sections.push(heading(3, rule.name.replace(/^Consequence[s]?\s*[-:]\s*/i, '')));
      if (rule.description) {
        sections.push(...parseDescriptionWithDocStrings(rule.description));
      }
    }
  }

  // Other rules (custom sections)
  // Skip if these rules are already covered by Source Mapping entries
  // to prevent duplicate content in reference documentation
  if (decisionContent.rules.other.length > 0) {
    // Build set of section names from Source Mapping (both self-references and external files)
    const sourceMappedSectionNames = new Set<string>();
    for (const mapping of decisionContent.sourceMappings) {
      // Normalize section name for matching (case-insensitive)
      const normalizedSection = mapping.section.toLowerCase().trim();
      sourceMappedSectionNames.add(normalizedSection);
    }

    // Helper: extract significant words (3+ chars) for fuzzy matching
    const getWords = (text: string): Set<string> =>
      new Set(
        text
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length >= 3)
      );

    // Only render rules that aren't covered by Source Mapping section names
    for (const rule of decisionContent.rules.other) {
      const ruleName = rule.name.toLowerCase().trim();
      const ruleWords = getWords(ruleName);

      // Check if any Source Mapping section matches this rule name
      // Match if: exact match, substring match, or 2+ words overlap
      const isCovered = Array.from(sourceMappedSectionNames).some((sectionName) => {
        // Exact or substring match
        if (
          ruleName === sectionName ||
          ruleName.includes(sectionName) ||
          sectionName.includes(ruleName)
        ) {
          return true;
        }
        // Word overlap match (at least 2 significant words)
        const sectionWords = getWords(sectionName);
        let matches = 0;
        for (const word of ruleWords) {
          if (sectionWords.has(word)) matches++;
        }
        return matches >= 2;
      });

      if (!isCovered) {
        sections.push(heading(2, rule.name));
        if (rule.description) {
          sections.push(...parseDescriptionWithDocStrings(rule.description));
        }
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
// Pipeline Execution (Internal)
// =============================================================================

/**
 * Result of pipeline execution
 */
interface PipelineResult {
  /** Parsed decision document content */
  decisionContent: DecisionDocContent;
  /** Aggregated and deduplicated content from source mapping */
  aggregatedContent: AggregatedContent;
  /** Warning collector (if enabled) */
  warningCollector: WarningCollector | undefined;
  /** Pattern name for output path generation */
  patternName: string;
  /** Deduplication warnings captured when no warningCollector is present */
  dedupWarnings: Warning[];
}

/**
 * Error result from pipeline execution
 */
interface PipelineError {
  /** Validation or processing errors */
  errors: string[];
  /** Warnings collected before error */
  warnings: string[];
}

/**
 * Execute the generation pipeline: validation, extraction, deduplication
 *
 * Internal function that performs the expensive work once. Both single-level
 * and multi-level generators use this to avoid duplicate work.
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Pipeline result or error
 */
function executePipeline(
  pattern: ExtractedPattern,
  options: DecisionDocGeneratorOptions
): PipelineResult | PipelineError {
  // Default options - all robustness features enabled by default
  const enableValidation = options.enableValidation ?? true;
  const enableDeduplication = options.enableDeduplication ?? true;
  const enableWarningCollection = options.enableWarningCollection ?? true;

  // Step 1: Create WarningCollector for unified warning handling
  const warningCollector: WarningCollector | undefined = enableWarningCollection
    ? createWarningCollector()
    : undefined;

  // Pattern name can come from directive.patternName or pattern.patternName or pattern.name
  // directive.patternName and pattern.patternName are optional, pattern.name is required
  // Use helper function to catch both null/undefined AND empty strings
  const getPatternName = (): string => {
    if (pattern.directive.patternName?.trim()) {
      return pattern.directive.patternName;
    }
    if (pattern.patternName?.trim()) {
      return pattern.patternName;
    }
    return pattern.name;
  };
  const patternName = getPatternName();

  const description = pattern.directive.description;
  const rules = pattern.rules ?? [];

  // Step 2: Parse decision document
  const decisionContent = parseDecisionDocument(patternName, description, rules);

  // Step 3 & 4: Validate and execute source mapping (if mappings exist)
  let aggregatedContent: AggregatedContent = {
    sections: [],
    warnings: [],
    success: true,
  };

  // Deduplication warnings when warningCollector is not used
  const dedupWarnings: Warning[] = [];

  if (decisionContent.sourceMappings.length > 0) {
    // Step 3: PRE-FLIGHT VALIDATION (if enabled)
    if (enableValidation) {
      const validatorOptions = warningCollector
        ? { baseDir: options.baseDir, warningCollector }
        : { baseDir: options.baseDir };

      const validationResult: ValidationResult = validateSourceMappingTable(
        decisionContent.sourceMappings,
        validatorOptions
      );

      // Capture validation warnings after successful validation (Issue #4 fix)
      if (validationResult.isValid && warningCollector && validationResult.warnings.length > 0) {
        for (const warning of validationResult.warnings) {
          warningCollector.capture(warning);
        }
      }

      // If validation fails with errors, return early
      if (!validationResult.isValid) {
        const warnings = warningCollector
          ? warningCollector.getAll().map((w) => `${w.category}: ${w.message}`)
          : [];

        return {
          warnings,
          errors: validationResult.errors.map((e) => {
            // Include suggestions if available
            if (e.suggestions && e.suggestions.length > 0) {
              return `${e.message}. Did you mean: ${e.suggestions.join(', ')}?`;
            }
            return e.message;
          }),
        };
      }
    }

    // Step 4: EXECUTE SOURCE MAPPING (with warning collector)
    const baseMapperOptions = {
      baseDir: options.baseDir,
      decisionDocPath: pattern.source.file,
      decisionContent,
      detailLevel: options.detailLevel ?? 'standard',
    };

    const mapperOptions: SourceMapperOptions = warningCollector
      ? { ...baseMapperOptions, warningCollector }
      : baseMapperOptions;

    aggregatedContent = executeSourceMapping(decisionContent.sourceMappings, mapperOptions);

    // Step 5: DEDUPLICATE SECTIONS (if enabled)
    if (enableDeduplication && aggregatedContent.sections.length > 0) {
      const dedupOptions = warningCollector ? { warningCollector } : undefined;
      const dedupResult: DeduplicationResult = deduplicateSections(
        aggregatedContent.sections,
        dedupOptions
      );
      aggregatedContent.sections = dedupResult.sections;
      // Capture deduplication warnings when not using collector
      // (When collector is present, warnings are captured via side-effect)
      if (!warningCollector && dedupResult.warnings.length > 0) {
        dedupWarnings.push(...dedupResult.warnings);
      }
    }
  }

  return { decisionContent, aggregatedContent, warningCollector, patternName, dedupWarnings };
}

/**
 * Check if pipeline result is an error
 */
function isPipelineError(result: PipelineResult | PipelineError): result is PipelineError {
  return 'errors' in result;
}

// =============================================================================
// Main Generation Function
// =============================================================================

/**
 * Generate documentation from a decision document
 *
 * Main entry point that orchestrates the full pipeline:
 * 1. Create WarningCollector for unified warning handling
 * 2. Parse decision document to extract content
 * 3. Validate source mappings (if enabled) - fails fast on validation errors
 * 4. Execute source mapping to aggregate content from referenced files
 * 5. Deduplicate sections (if enabled)
 * 6. Generate output at specified detail level(s)
 * 7. Return output files with all warnings
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
  // Execute the pipeline
  const pipelineResult = executePipeline(pattern, options);

  // If pipeline failed, return errors
  if (isPipelineError(pipelineResult)) {
    return { files: [], warnings: pipelineResult.warnings, errors: pipelineResult.errors };
  }

  const { decisionContent, aggregatedContent, warningCollector, patternName, dedupWarnings } =
    pipelineResult;

  // Generate output at requested detail level
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
  const files: OutputFile[] = [{ path: outputPath, content }];

  // Collect all warnings and return
  // When warningCollector is present, it captures all warnings via side-effects
  // When not present, we need to merge extraction warnings with deduplication warnings
  const warnings = warningCollector
    ? warningCollector.getAll().map((w) => `${w.category}: ${w.message}`)
    : [
        ...aggregatedContent.warnings.map((w) => `${w.severity}: ${w.message}`),
        ...dedupWarnings.map((w) => `${w.category}: ${w.message}`),
      ];

  return { files, warnings, errors: [] };
}

/**
 * Generate both compact and detailed outputs
 *
 * Runs the pipeline once and generates documentation at both detail levels.
 * More efficient than calling generateFromDecision twice.
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Generation result with both output files
 */
export function generateFromDecisionMultiLevel(
  pattern: ExtractedPattern,
  options: DecisionDocGeneratorOptions
): DecisionDocGeneratorResult {
  // Execute the pipeline ONCE
  const pipelineResult = executePipeline(pattern, options);

  // If pipeline failed, return errors
  if (isPipelineError(pipelineResult)) {
    return { files: [], warnings: pipelineResult.warnings, errors: pipelineResult.errors };
  }

  const { decisionContent, aggregatedContent, warningCollector, patternName, dedupWarnings } =
    pipelineResult;

  // Determine output paths
  const sectionOption = options.claudeMdSection;
  const outputPaths = determineOutputPaths(
    patternName,
    sectionOption ? { section: sectionOption } : undefined
  );

  // Generate BOTH outputs from the same processed data
  const compactDoc = generateCompactOutput(decisionContent, aggregatedContent);
  const detailedDoc = generateDetailedOutput(decisionContent, aggregatedContent);

  const compactContent = renderToMarkdown(compactDoc);
  const detailedContent = renderToMarkdown(detailedDoc);

  const files: OutputFile[] = [
    { path: outputPaths.compact, content: compactContent },
    { path: outputPaths.detailed, content: detailedContent },
  ];

  // Collect all warnings
  // When warningCollector is present, it captures all warnings via side-effects
  // When not present, we need to merge extraction warnings with deduplication warnings
  const warnings = warningCollector
    ? warningCollector.getAll().map((w) => `${w.category}: ${w.message}`)
    : [
        ...aggregatedContent.warnings.map((w) => `${w.severity}: ${w.message}`),
        ...dedupWarnings.map((w) => `${w.category}: ${w.message}`),
      ];

  return { files, warnings, errors: [] };
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

    // Collect all warnings and errors for metadata instead of console output
    const allWarnings: string[] = [];
    const allErrors: string[] = [];

    if (decisionPatterns.length === 0) {
      allWarnings.push(
        'No decision documents with source mappings found. Ensure patterns have source mapping tables.'
      );
      return Promise.resolve({
        files: [],
        metadata: {
          warnings: allWarnings,
          errors: allErrors,
          patternsProcessed: 0,
        },
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

      // Collect errors and warnings (but don't fail)
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return Promise.resolve({
      files: allFiles,
      metadata: {
        warnings: allWarnings,
        errors: allErrors,
        patternsProcessed: decisionPatterns.length,
      },
    });
  }
}

/**
 * Create decision doc generator instance
 */
export function createDecisionDocGenerator(): DocumentGenerator {
  return new DecisionDocGeneratorImpl();
}
