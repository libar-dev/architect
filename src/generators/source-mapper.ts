/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SourceMapper
 * @libar-docs-status completed
 * @libar-docs-phase 27
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-depends-on DecisionDocCodec,ShapeExtractor,GherkinASTParser
 *
 * ## Source Mapper - Multi-Source Content Aggregation
 *
 * Aggregates content from multiple source files based on source mapping tables
 * parsed from decision documents. Dispatches extraction to appropriate handlers
 * based on extraction method (shape extraction, rule blocks, JSDoc, etc.).
 *
 * ### When to Use
 *
 * - When generating documentation from a decision document's source mapping
 * - When aggregating content from TypeScript, Gherkin, and decision sources
 * - When building docs with progressive disclosure (compact vs detailed)
 *
 * ### Key Concepts
 *
 * - **Source Mapping Table**: Defines sections, source files, and extraction methods
 * - **Self-Reference**: `THIS DECISION` markers extract from current document
 * - **Graceful Degradation**: Missing files produce warnings, not failures
 * - **Order Preservation**: Aggregated content maintains mapping table order
 */

import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import type { Result } from '../types/result.js';
import { Result as R } from '../types/result.js';
import {
  type SourceMappingEntry,
  type DecisionDocContent,
  type ExtractedDocString,
  type PartitionedDecisionRules,
  isSelfReference,
  parseSelfReference,
  normalizeExtractionMethod,
  findRuleByName,
  extractDocStrings,
} from '../renderable/codecs/decision-doc.js';
import type { BusinessRule } from '../validation-schemas/extracted-pattern.js';
import { extractShapes } from '../extractor/shape-extractor.js';
import { renderShapesAsMarkdown } from '../renderable/codecs/helpers.js';
import type { ExtractedShape } from '../validation-schemas/extracted-shape.js';
import { parseFeatureFile } from '../scanner/gherkin-ast-parser.js';
import type { GherkinRule, GherkinScenario } from '../validation-schemas/feature.js';
import type { WarningCollector } from './warning-collector.js';
import type { FileCache } from '../cache/file-cache.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for source mapping execution
 */
export interface SourceMapperOptions {
  /** Base directory for resolving relative paths */
  baseDir: string;

  /** Current decision document path (for self-references) */
  decisionDocPath: string;

  /** Parsed decision document content (for self-reference extraction) */
  decisionContent: DecisionDocContent;

  /** Detail level affects what content is included */
  detailLevel?: 'summary' | 'standard' | 'detailed';

  /** Optional warning collector for structured warning handling */
  warningCollector?: WarningCollector;

  /** Optional file cache for avoiding repeated disk reads */
  fileCache?: FileCache;
}

/**
 * Warning produced during extraction
 */
export interface ExtractionWarning {
  /** Warning severity */
  severity: 'warning' | 'info';

  /** Warning message */
  message: string;

  /** Source mapping entry that produced the warning */
  sourceMapping: SourceMappingEntry;
}

/**
 * Single extracted section from a source
 */
export interface ExtractedSection {
  /** Target section name from mapping */
  section: string;

  /** Source file path or self-reference marker */
  sourceFile: string;

  /** Extraction method used */
  extractionMethod: string;

  /** Extracted content (markdown) */
  content: string;

  /** Extracted shapes (if applicable) */
  shapes?: ExtractedShape[];

  /** Extracted DocStrings (if applicable) */
  docStrings?: ExtractedDocString[];
}

/**
 * Result of source mapping execution
 */
export interface AggregatedContent {
  /** Extracted sections in mapping order */
  sections: ExtractedSection[];

  /** Warnings produced during extraction */
  warnings: ExtractionWarning[];

  /** Overall success (true if at least one section extracted) */
  success: boolean;
}

// =============================================================================
// File Utilities
// =============================================================================

/**
 * Read file content asynchronously with error handling and optional caching
 */
async function readFile(filePath: string, fileCache?: FileCache): Promise<Result<string>> {
  // Check cache first
  if (fileCache) {
    const cached = fileCache.get(filePath);
    if (cached !== undefined) {
      return R.ok(cached);
    }
  }

  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');

    // Store in cache if provided
    if (fileCache) {
      fileCache.set(filePath, content);
    }

    return R.ok(content);
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(`Failed to read file: ${filePath}`));
  }
}

/**
 * Check if file exists asynchronously.
 * Captures filesystem errors (EACCES, EPERM, etc.) via warning collector to prevent silent failures.
 */
async function fileExists(filePath: string, warningCollector?: WarningCollector): Promise<boolean> {
  try {
    await fsPromises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    // ENOENT means file doesn't exist - this is expected, not an error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    // Capture actual error for debugging - filesystem errors (EACCES, EPERM, ELOOP, etc.)
    // should not be silently swallowed as they indicate real problems
    if (warningCollector) {
      warningCollector.capture({
        source: filePath,
        category: 'file-access',
        subcategory: 'check-error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return false;
  }
}

/**
 * Resolve a file path to absolute using the base directory.
 * If already absolute, returns as-is.
 * Validates that resolved path stays within the base directory to prevent path traversal.
 *
 * @returns Result with the resolved absolute path, or error if path traversal is detected
 */
function resolveAbsolutePath(filePath: string, baseDir: string): Result<string> {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
  const normalizedBase = path.resolve(baseDir);

  // Ensure resolved path is within base directory (prevent path traversal)
  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    return R.err(new Error(`Path traversal detected: ${filePath} escapes base directory`));
  }

  return R.ok(resolved);
}

// =============================================================================
// Extraction Helpers
// =============================================================================

/**
 * Collect all rules from partitioned decision content into a single array.
 * Helper to avoid duplicating array spread across multiple locations.
 */
function collectAllRules(rules: PartitionedDecisionRules): BusinessRule[] {
  return [...rules.context, ...rules.decision, ...rules.consequences, ...rules.other];
}

/**
 * Extract content from THIS DECISION (the current decision document)
 */
export function extractFromDecision(
  options: SourceMapperOptions,
  sourceMapping: SourceMappingEntry
): Result<ExtractedSection> {
  const { decisionContent } = options;
  const selfRef = parseSelfReference(sourceMapping.sourceFile);

  if (!selfRef) {
    return R.err(new Error(`Not a valid self-reference: ${sourceMapping.sourceFile}`));
  }

  let content = '';
  let docStrings: ExtractedDocString[] | undefined;

  switch (selfRef.type) {
    case 'document': {
      // Extract based on extraction method
      const method = normalizeExtractionMethod(sourceMapping.extractionMethod);

      if (method === 'DECISION_RULE_DESCRIPTION') {
        // Return all rule descriptions combined
        const allRules = collectAllRules(decisionContent.rules);
        content = allRules.map((r) => r.description).join('\n\n');
      } else if (method === 'FENCED_CODE_BLOCK') {
        // Return DocStrings as code blocks
        docStrings = decisionContent.docStrings;
        content = docStrings
          .map((ds) => `\`\`\`${ds.language}\n${ds.content}\n\`\`\``)
          .join('\n\n');
      } else {
        // Default: return feature description
        content = decisionContent.description;
      }
      break;
    }

    case 'rule': {
      // Find and extract specific rule by name
      const ruleName = selfRef.name;
      if (!ruleName) {
        return R.err(new Error('Self-reference rule name is missing'));
      }

      // Search in all rule partitions
      const rule = findRuleByName(collectAllRules(decisionContent.rules), ruleName);
      if (!rule) {
        return R.err(new Error(`Rule not found: ${ruleName}`));
      }

      content = rule.description;
      docStrings = extractDocStrings(content);
      break;
    }

    case 'docstring': {
      // Extract all DocStrings from the decision
      docStrings = decisionContent.docStrings;
      content = docStrings.map((ds) => `\`\`\`${ds.language}\n${ds.content}\n\`\`\``).join('\n\n');
      break;
    }
  }

  const section: ExtractedSection = {
    section: sourceMapping.section,
    sourceFile: sourceMapping.sourceFile,
    extractionMethod: sourceMapping.extractionMethod,
    content,
  };

  if (docStrings && docStrings.length > 0) {
    section.docStrings = docStrings;
  }

  return R.ok(section);
}

/**
 * Extract shapes from a TypeScript file using @extract-shapes
 */
export async function extractFromTypeScript(
  filePath: string,
  options: SourceMapperOptions,
  sourceMapping: SourceMappingEntry
): Promise<Result<ExtractedSection>> {
  const pathResult = resolveAbsolutePath(filePath, options.baseDir);
  if (!pathResult.ok) {
    return R.err(pathResult.error);
  }
  const absolutePath = pathResult.value;

  const fileResult = await readFile(absolutePath, options.fileCache);
  if (!fileResult.ok) {
    return R.err(fileResult.error);
  }

  const sourceCode = fileResult.value;
  const method = normalizeExtractionMethod(sourceMapping.extractionMethod);

  let content = '';
  let shapes: ExtractedShape[] | undefined;

  if (method === 'EXTRACT_SHAPES') {
    // Look for @libar-docs-extract-shapes tag in the file
    const extractShapesMatch = /@libar-docs-extract-shapes\s+(.+?)(?:\n|$)/i.exec(sourceCode);

    if (extractShapesMatch?.[1]) {
      const shapeNames = extractShapesMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const extractResult = extractShapes(sourceCode, shapeNames);
      if (!extractResult.ok) {
        return R.err(extractResult.error);
      }

      const result = extractResult.value;
      shapes = [...result.shapes]; // Convert readonly to mutable
      content = renderShapesAsMarkdown(result.shapes, { includeJsDoc: true });

      // Surface extraction warnings via warning collector
      if (options.warningCollector) {
        // Forward any extraction warnings
        for (const warning of result.warnings) {
          options.warningCollector.capture({
            source: filePath,
            category: 'extraction',
            subcategory: 'shape',
            message: warning,
          });
        }

        // Warn about shapes not found in file
        for (const name of result.notFound) {
          options.warningCollector.capture({
            source: filePath,
            category: 'extraction',
            subcategory: 'shape-not-found',
            message: `Shape '${name}' not found in file`,
          });
        }

        // Warn about imported shapes (should use source file instead)
        for (const name of result.imported) {
          options.warningCollector.capture({
            source: filePath,
            category: 'extraction',
            subcategory: 'shape-imported',
            message: `Shape '${name}' is imported, not defined in this file. Add @libar-docs-extract-shapes to the source file instead.`,
          });
        }

        // Warn about re-exported shapes with source module info
        for (const reExport of result.reExported) {
          const typeOnlyNote = reExport.typeOnly ? ' (type-only)' : '';
          options.warningCollector.capture({
            source: filePath,
            category: 'extraction',
            subcategory: 'shape-re-exported',
            message: `Shape '${reExport.name}' is re-exported${typeOnlyNote} from '${reExport.sourceModule}'. Add @libar-docs-extract-shapes to ${reExport.sourceModule} instead.`,
          });
        }
      }
    } else {
      // No @extract-shapes tag found - extract all exported types
      // This is a fallback for files without explicit shape tags
      return R.err(new Error(`No @libar-docs-extract-shapes tag found in ${filePath}`));
    }
  } else if (method === 'JSDOC_SECTION') {
    // Extract JSDoc markdown from the file's main JSDoc block
    const jsDocMatch = /\/\*\*\s*\n([\s\S]*?)\*\//m.exec(sourceCode);
    if (jsDocMatch?.[1]) {
      // First, strip * prefix from all lines to get clean markdown
      const cleanedContent = jsDocMatch[1].replace(/^\s*\*\s?/gm, '').trim();

      // Extract markdown content after ## header (stop at @tags)
      // Pattern: Find ## header, capture everything until @tag line or end
      const markdownMatch = /##\s+.+?\n([\s\S]*?)(?=\n\s*@|\n*$)/m.exec(cleanedContent);

      if (markdownMatch?.[1]) {
        content = markdownMatch[1].trim();
      } else {
        // Fallback: use everything after first ## header if no @tags found
        const headerStart = cleanedContent.indexOf('##');
        if (headerStart !== -1) {
          const afterHeader = cleanedContent.slice(headerStart);
          const firstNewline = afterHeader.indexOf('\n');
          if (firstNewline !== -1) {
            content = afterHeader.slice(firstNewline + 1).trim();
          }
        }
      }

      // Warn if JSDoc block was found but extraction produced empty content
      if (!content && options.warningCollector) {
        options.warningCollector.capture({
          source: filePath,
          category: 'extraction',
          subcategory: 'jsdoc-empty',
          message: `JSDoc block found but no markdown content extracted. Expected ## header followed by content. JSDoc starts with: "${cleanedContent.slice(0, 50)}..."`,
        });
      }
    }
  } else if (method === 'CREATE_VIOLATION_PATTERNS') {
    // Extract error message patterns from createViolation() calls
    const violationPattern = /createViolation\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = violationPattern.exec(sourceCode)) !== null) {
      if (match[1]) {
        violations.push(match[1]);
      }
    }
    content =
      violations.length > 0
        ? `| Error Code |\n|---|\n${violations.map((v) => `| ${v} |`).join('\n')}`
        : '';
  }

  const result: ExtractedSection = {
    section: sourceMapping.section,
    sourceFile: sourceMapping.sourceFile,
    extractionMethod: sourceMapping.extractionMethod,
    content,
  };

  if (shapes && shapes.length > 0) {
    result.shapes = shapes;
  }

  return R.ok(result);
}

/**
 * Extract Rule blocks or Scenario Outline Examples from a behavior spec
 */
export async function extractFromBehaviorSpec(
  filePath: string,
  options: SourceMapperOptions,
  sourceMapping: SourceMappingEntry
): Promise<Result<ExtractedSection>> {
  const pathResult = resolveAbsolutePath(filePath, options.baseDir);
  if (!pathResult.ok) {
    return R.err(pathResult.error);
  }
  const absolutePath = pathResult.value;

  const fileResult = await readFile(absolutePath, options.fileCache);
  if (!fileResult.ok) {
    return R.err(fileResult.error);
  }

  const parseResult = parseFeatureFile(fileResult.value, absolutePath);
  if (!parseResult.ok) {
    return R.err(new Error(`Failed to parse ${absolutePath}: ${parseResult.error.error.message}`));
  }

  const parsed = parseResult.value;
  const method = normalizeExtractionMethod(sourceMapping.extractionMethod);

  let content = '';

  if (method === 'RULE_BLOCKS') {
    // Extract Rule: blocks with names and descriptions
    if (parsed.rules && parsed.rules.length > 0) {
      content = extractRuleBlocksContent(parsed.rules);
    }
  } else if (method === 'SCENARIO_OUTLINE_EXAMPLES') {
    // Extract Examples tables from Scenario Outlines, filtered by section name
    content = extractScenarioOutlineExamples(parsed.scenarios, sourceMapping.section);
  }

  return R.ok({
    section: sourceMapping.section,
    sourceFile: sourceMapping.sourceFile,
    extractionMethod: sourceMapping.extractionMethod,
    content,
  });
}

/**
 * Format Rule blocks as markdown content
 */
function extractRuleBlocksContent(rules: readonly GherkinRule[]): string {
  const lines: string[] = [];

  for (const rule of rules) {
    lines.push(`### ${rule.name}`);
    if (rule.description) {
      lines.push('');
      lines.push(rule.description);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * Check if scenario name matches section name using keyword overlap
 *
 * Uses case-insensitive keyword matching to find relevant scenarios.
 * For example, "Protection Levels" matches "Protection level from status".
 *
 * @param sectionName - Section name from source mapping
 * @param scenarioName - Scenario name from feature file
 * @returns True if there's sufficient keyword overlap
 */
function scenarioMatchesSection(sectionName: string, scenarioName: string): boolean {
  // Basic stemming: remove common English suffixes
  const stem = (word: string): string => {
    // Order matters: check longer suffixes first
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
    if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
    if (word.endsWith('s') && word.length > 3) return word.slice(0, -1);
    if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
    if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
    return word;
  };

  // Normalize: lowercase, extract significant words (3+ chars), apply stemming
  const normalizeWords = (text: string): Set<string> =>
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((word) => word.length >= 3)
        .map(stem)
    );

  const sectionWords = normalizeWords(sectionName);
  const scenarioWords = normalizeWords(scenarioName);

  // Count matching words
  let matches = 0;
  for (const word of sectionWords) {
    if (scenarioWords.has(word)) {
      matches++;
    }
  }

  // Require at least 1 matching word (fuzzy match)
  return matches >= 1;
}

/**
 * Extract Examples tables from Scenario Outlines as markdown tables
 *
 * Uses the `examples` property on Scenario Outline nodes (not step DataTables).
 * Filters scenarios by matching section name to scenario name using keyword overlap.
 * This prevents duplicate content when multiple sections map to the same file.
 *
 * @param scenarios - All scenarios from the feature file
 * @param sectionName - Section name from source mapping for filtering
 * @returns Markdown tables from matching Scenario Outline Examples
 */
function extractScenarioOutlineExamples(
  scenarios: readonly GherkinScenario[],
  sectionName: string
): string {
  const tables: string[] = [];

  for (const scenario of scenarios) {
    // Skip scenarios that don't match the section name
    if (!scenarioMatchesSection(sectionName, scenario.name)) {
      continue;
    }

    // Check if scenario has Examples tables (Scenario Outline)
    if (scenario.examples && scenario.examples.length > 0) {
      for (const example of scenario.examples) {
        const { headers, rows } = example;
        if (headers.length > 0 && rows.length > 0) {
          // Build markdown table
          const headerLine = `| ${headers.join(' | ')} |`;
          const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
          const dataLines = rows.map(
            (row) => `| ${headers.map((h) => row[h] ?? '').join(' | ')} |`
          );

          tables.push([headerLine, separatorLine, ...dataLines].join('\n'));
        }
      }
    }
  }

  return tables.join('\n\n');
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Execute source mapping to aggregate content from multiple sources
 *
 * Takes source mapping entries from a decision document and extracts content
 * from each referenced source file. Handles self-references (THIS DECISION),
 * TypeScript files (@extract-shapes, JSDoc), and behavior specs (Rule blocks,
 * Scenario Outline Examples).
 *
 * @param sourceMappings - Source mapping entries from decision document
 * @param options - Mapper options including base directory and decision content
 * @returns Aggregated content with sections in mapping order
 *
 * @example
 * ```typescript
 * const result = await executeSourceMapping(decisionContent.sourceMappings, {
 *   baseDir: process.cwd(),
 *   decisionDocPath: 'specs/my-decision.feature',
 *   decisionContent: decisionContent,
 *   detailLevel: 'detailed',
 * });
 *
 * if (result.success) {
 *   for (const section of result.sections) {
 *     console.log(`## ${section.section}\n${section.content}`);
 *   }
 * }
 * ```
 */
export async function executeSourceMapping(
  sourceMappings: readonly SourceMappingEntry[],
  options: SourceMapperOptions
): Promise<AggregatedContent> {
  const sections: ExtractedSection[] = [];
  const warnings: ExtractionWarning[] = [];

  for (const mapping of sourceMappings) {
    let result: Result<ExtractedSection>;

    // Check file existence for non-self-reference sources
    if (!isSelfReference(mapping.sourceFile)) {
      const pathResult = resolveAbsolutePath(mapping.sourceFile, options.baseDir);
      if (!pathResult.ok) {
        warnings.push({
          severity: 'warning',
          message: pathResult.error.message,
          sourceMapping: mapping,
        });
        continue;
      }
      if (!(await fileExists(pathResult.value, options.warningCollector))) {
        warnings.push({
          severity: 'warning',
          message: `Source file not found: ${mapping.sourceFile}`,
          sourceMapping: mapping,
        });
        continue;
      }
    }

    // Dispatch based on source file type
    if (isSelfReference(mapping.sourceFile)) {
      // Extract from current decision document (sync - no file I/O)
      result = extractFromDecision(options, mapping);
    } else if (mapping.sourceFile.endsWith('.ts')) {
      // TypeScript file
      result = await extractFromTypeScript(mapping.sourceFile, options, mapping);
    } else if (mapping.sourceFile.endsWith('.feature')) {
      // Gherkin behavior spec
      result = await extractFromBehaviorSpec(mapping.sourceFile, options, mapping);
    } else {
      // Unknown file type
      warnings.push({
        severity: 'warning',
        message: `Unknown source file type: ${mapping.sourceFile}`,
        sourceMapping: mapping,
      });
      continue;
    }

    if (result.ok) {
      // Check for empty content and add info warning
      if (!result.value.content || result.value.content.trim() === '') {
        warnings.push({
          severity: 'info',
          message: `No content extracted from ${mapping.sourceFile} using ${mapping.extractionMethod}`,
          sourceMapping: mapping,
        });
      }
      sections.push(result.value);
    } else {
      warnings.push({
        severity: 'warning',
        message: result.error.message,
        sourceMapping: mapping,
      });
    }
  }

  return {
    sections,
    warnings,
    success: sections.length > 0,
  };
}

/**
 * Validate source mappings before execution
 *
 * Checks all referenced files exist and extraction methods are valid.
 * Does not perform actual extraction.
 *
 * @param sourceMappings - Source mapping entries to validate
 * @param options - Mapper options (only baseDir is required)
 * @returns Array of validation warnings
 */
export async function validateSourceMappings(
  sourceMappings: readonly SourceMappingEntry[],
  options: Pick<SourceMapperOptions, 'baseDir'>
): Promise<ExtractionWarning[]> {
  const warnings: ExtractionWarning[] = [];

  for (const mapping of sourceMappings) {
    // Self-references don't need file validation
    if (isSelfReference(mapping.sourceFile)) {
      continue;
    }

    // Check file exists
    const pathResult = resolveAbsolutePath(mapping.sourceFile, options.baseDir);
    if (!pathResult.ok) {
      warnings.push({
        severity: 'warning',
        message: pathResult.error.message,
        sourceMapping: mapping,
      });
      continue;
    }

    if (!(await fileExists(pathResult.value))) {
      warnings.push({
        severity: 'warning',
        message: `Source file not found: ${mapping.sourceFile}`,
        sourceMapping: mapping,
      });
      continue;
    }

    // Validate extraction method is known
    const method = normalizeExtractionMethod(mapping.extractionMethod);
    if (method === 'unknown') {
      warnings.push({
        severity: 'info',
        message: `Unknown extraction method: ${mapping.extractionMethod}`,
        sourceMapping: mapping,
      });
    }
  }

  return warnings;
}
