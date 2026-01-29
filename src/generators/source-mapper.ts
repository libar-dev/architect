/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SourceMapper
 * @libar-docs-status completed
 * @libar-docs-phase 27
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
import * as path from 'node:path';
import type { Result } from '../types/result.js';
import { Result as R } from '../types/result.js';
import {
  type SourceMappingEntry,
  type DecisionDocContent,
  type ExtractedDocString,
  isSelfReference,
  parseSelfReference,
  normalizeExtractionMethod,
  findRuleByName,
  extractDocStrings,
} from '../renderable/codecs/decision-doc.js';
import { extractShapes, renderShapesAsMarkdown } from '../extractor/shape-extractor.js';
import type { ExtractedShape } from '../validation-schemas/extracted-shape.js';
import { parseFeatureFile } from '../scanner/gherkin-ast-parser.js';
import type { GherkinRule, GherkinScenario } from '../validation-schemas/feature.js';

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
 * Read file content synchronously with error handling
 */
function readFileSync(filePath: string): Result<string> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return R.ok(content);
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(`Failed to read file: ${filePath}`));
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// =============================================================================
// Extraction Helpers
// =============================================================================

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
        const allRules = [
          ...decisionContent.rules.context,
          ...decisionContent.rules.decision,
          ...decisionContent.rules.consequences,
          ...decisionContent.rules.other,
        ];
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
      const allRules = [
        ...decisionContent.rules.context,
        ...decisionContent.rules.decision,
        ...decisionContent.rules.consequences,
        ...decisionContent.rules.other,
      ];

      const rule = findRuleByName(allRules, ruleName);
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
export function extractFromTypeScript(
  filePath: string,
  options: SourceMapperOptions,
  sourceMapping: SourceMappingEntry
): Result<ExtractedSection> {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(options.baseDir, filePath);

  const fileResult = readFileSync(absolutePath);
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

      const result = extractShapes(sourceCode, shapeNames);
      shapes = result.shapes;
      content = renderShapesAsMarkdown(result.shapes, { includeJsDoc: true });
    } else {
      // No @extract-shapes tag found - extract all exported types
      // This is a fallback for files without explicit shape tags
      return R.err(new Error(`No @libar-docs-extract-shapes tag found in ${filePath}`));
    }
  } else if (method === 'JSDOC_SECTION') {
    // Extract JSDoc markdown from the file's main JSDoc block
    const jsDocMatch = /\/\*\*\s*\n([\s\S]*?)\*\//m.exec(sourceCode);
    if (jsDocMatch?.[1]) {
      // Extract markdown content from JSDoc (after ## header)
      const jsDocContent = jsDocMatch[1];
      const markdownMatch = /##\s+.+?\n([\s\S]*?)(?=\n\s*\*\s*@|\n\s*\*\/|$)/m.exec(jsDocContent);
      content =
        markdownMatch?.[1]?.replace(/^\s*\*\s?/gm, '').trim() ??
        jsDocContent.replace(/^\s*\*\s?/gm, '').trim();
    }
  } else if (method === 'CREATE_VIOLATION_PATTERNS') {
    // Extract error message patterns from createViolation() calls
    const violationPattern = /createViolation\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const violations: string[] = [];
    let match;
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
export function extractFromBehaviorSpec(
  filePath: string,
  options: SourceMapperOptions,
  sourceMapping: SourceMappingEntry
): Result<ExtractedSection> {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(options.baseDir, filePath);

  const fileResult = readFileSync(absolutePath);
  if (!fileResult.ok) {
    return R.err(fileResult.error);
  }

  const parseResult = parseFeatureFile(fileResult.value, absolutePath);
  if (!parseResult.ok) {
    return R.err(new Error(parseResult.error.error.message));
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
    // Extract Examples tables from Scenario Outlines
    content = extractScenarioOutlineExamples(parsed.scenarios);
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
 * Extract Examples tables from Scenario Outlines as markdown tables
 */
function extractScenarioOutlineExamples(scenarios: readonly GherkinScenario[]): string {
  const tables: string[] = [];

  for (const scenario of scenarios) {
    // Check if scenario has steps with DataTables (common pattern for examples)
    for (const step of scenario.steps) {
      if (step.dataTable) {
        const { headers, rows } = step.dataTable;
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
 * const result = executeSourceMapping(decisionContent.sourceMappings, {
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
export function executeSourceMapping(
  sourceMappings: readonly SourceMappingEntry[],
  options: SourceMapperOptions
): AggregatedContent {
  const sections: ExtractedSection[] = [];
  const warnings: ExtractionWarning[] = [];

  for (const mapping of sourceMappings) {
    let result: Result<ExtractedSection>;

    // Dispatch based on source file type
    if (isSelfReference(mapping.sourceFile)) {
      // Extract from current decision document
      result = extractFromDecision(options, mapping);
    } else if (mapping.sourceFile.endsWith('.ts')) {
      // TypeScript file - check if it exists first
      const absolutePath = path.isAbsolute(mapping.sourceFile)
        ? mapping.sourceFile
        : path.join(options.baseDir, mapping.sourceFile);

      if (!fileExists(absolutePath)) {
        warnings.push({
          severity: 'warning',
          message: `Source file not found: ${mapping.sourceFile}`,
          sourceMapping: mapping,
        });
        continue;
      }

      result = extractFromTypeScript(mapping.sourceFile, options, mapping);
    } else if (mapping.sourceFile.endsWith('.feature')) {
      // Gherkin behavior spec - check if it exists first
      const absolutePath = path.isAbsolute(mapping.sourceFile)
        ? mapping.sourceFile
        : path.join(options.baseDir, mapping.sourceFile);

      if (!fileExists(absolutePath)) {
        warnings.push({
          severity: 'warning',
          message: `Source file not found: ${mapping.sourceFile}`,
          sourceMapping: mapping,
        });
        continue;
      }

      result = extractFromBehaviorSpec(mapping.sourceFile, options, mapping);
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
export function validateSourceMappings(
  sourceMappings: readonly SourceMappingEntry[],
  options: Pick<SourceMapperOptions, 'baseDir'>
): ExtractionWarning[] {
  const warnings: ExtractionWarning[] = [];

  for (const mapping of sourceMappings) {
    // Self-references don't need file validation
    if (isSelfReference(mapping.sourceFile)) {
      continue;
    }

    // Check file exists
    const absolutePath = path.isAbsolute(mapping.sourceFile)
      ? mapping.sourceFile
      : path.join(options.baseDir, mapping.sourceFile);

    if (!fileExists(absolutePath)) {
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
