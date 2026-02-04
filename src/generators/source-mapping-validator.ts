/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SourceMappingValidator
 * @libar-docs-status roadmap
 * @libar-docs-phase 28
 *
 * ## Source Mapping Validator - Pre-flight Validation
 *
 * Performs pre-flight checks on source mapping tables before extraction begins.
 * Validates file existence, extraction method validity, and format correctness
 * to fail fast with clear errors rather than producing incomplete output.
 *
 * ### When to Use
 *
 * - Before document generation from source mappings
 * - When validating decision document source tables
 * - When checking extraction method compatibility
 *
 * ### Validation Checks
 *
 * 1. **File existence**: Source files must exist and be files (not directories)
 * 2. **Method validity**: Extraction methods must be recognized
 * 3. **Compatibility**: Extraction methods must match file types
 * 4. **Table format**: Required columns must be present
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Result } from '../types/result.js';
import {
  isSelfReference,
  normalizeExtractionMethod,
  EXTRACTION_METHODS,
  type SourceMappingEntry,
} from '../renderable/codecs/decision-doc.js';
import type { Warning, WarningCollector } from './warning-collector.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Validation error with context
 */
export interface ValidationError {
  /** Error message describing the issue */
  message: string;

  /** The source mapping row that caused the error (if applicable) */
  row?: SourceMappingEntry;

  /** Suggested alternatives or fixes */
  suggestions?: string[];
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  isValid: boolean;

  /** Validation errors (validation fails if any exist) */
  errors: ValidationError[];

  /** Non-fatal warnings */
  warnings: Warning[];
}

/**
 * Options for the validator
 */
export interface ValidatorOptions {
  /** Base directory for resolving relative paths */
  baseDir: string;

  /** Optional warning collector for non-fatal issues */
  warningCollector?: WarningCollector;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Valid extraction methods for reference
 */
export const VALID_EXTRACTION_METHODS: readonly string[] = Object.values(EXTRACTION_METHODS);

/**
 * Methods that only work with TypeScript files
 */
const TYPESCRIPT_ONLY_METHODS = new Set([
  '@extract-shapes tag',
  'JSDoc section',
  'createViolation() patterns',
]);

/**
 * Methods that only work with Gherkin feature files
 */
const GHERKIN_ONLY_METHODS = new Set(['Rule blocks', 'Scenario Outline Examples']);

/**
 * Methods that only work with self-reference (THIS DECISION)
 */
const SELF_REFERENCE_ONLY_METHODS = new Set(['Decision rule description', 'Fenced code block']);

/**
 * Required columns for source mapping tables
 */
const REQUIRED_COLUMNS = ['Section', 'Source File', 'Extraction Method'] as const;

/**
 * Column name aliases
 */
const COLUMN_ALIASES: Record<string, string> = {
  Source: 'Source File',
  How: 'Extraction Method',
  Extraction: 'Extraction Method',
};

// =============================================================================
// Individual Validators
// =============================================================================

/**
 * Validate that a source file exists
 *
 * @param mapping - The source mapping entry to validate
 * @param baseDir - Base directory for resolving relative paths
 * @returns Result with void on success, ValidationError on failure
 */
export function validateFileExists(
  mapping: SourceMappingEntry,
  baseDir: string
): Result<void, ValidationError> {
  // Skip validation for self-references (THIS DECISION markers)
  if (isSelfReference(mapping.sourceFile)) {
    return Result.ok(undefined);
  }

  const fullPath = path.resolve(baseDir, mapping.sourceFile);

  // Check if path exists
  if (!fs.existsSync(fullPath)) {
    return Result.err({
      message: `File not found: ${mapping.sourceFile}`,
      row: mapping,
    });
  }

  // Check if it's a file (not a directory)
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return Result.err({
        message: `Expected file, got directory: ${mapping.sourceFile}`,
        row: mapping,
      });
    }
  } catch {
    return Result.err({
      message: `Unable to read file: ${mapping.sourceFile}`,
      row: mapping,
    });
  }

  return Result.ok(undefined);
}

/**
 * Additional aliases for extraction methods
 * Maps normalized (lowercase, underscore-to-space) forms to canonical method keys
 */
const METHOD_ALIASES: Record<string, keyof typeof EXTRACTION_METHODS> = {
  'rule blocks': 'RULE_BLOCKS',
  rule_blocks: 'RULE_BLOCKS',
  ruleblocks: 'RULE_BLOCKS',
  '@extract-shapes tag': 'EXTRACT_SHAPES',
  'extract-shapes': 'EXTRACT_SHAPES',
  'extract shapes': 'EXTRACT_SHAPES',
  'decision rule description': 'DECISION_RULE_DESCRIPTION',
  decision_rule_description: 'DECISION_RULE_DESCRIPTION',
  'jsdoc section': 'JSDOC_SECTION',
  jsdoc_section: 'JSDOC_SECTION',
  'createviolation() patterns': 'CREATE_VIOLATION_PATTERNS',
  'createviolation patterns': 'CREATE_VIOLATION_PATTERNS',
  create_violation_patterns: 'CREATE_VIOLATION_PATTERNS',
  'fenced code block': 'FENCED_CODE_BLOCK',
  fenced_code_block: 'FENCED_CODE_BLOCK',
  'scenario outline examples': 'SCENARIO_OUTLINE_EXAMPLES',
  scenario_outline_examples: 'SCENARIO_OUTLINE_EXAMPLES',
};

/**
 * Normalize a method string by lowercasing and replacing underscores with spaces
 */
function normalizeMethodString(method: string): string {
  return method.toLowerCase().trim().replace(/_/g, ' ');
}

/**
 * Validate that an extraction method is valid
 *
 * @param method - The extraction method string
 * @returns Result with normalized method on success, ValidationError on failure
 */
export function validateExtractionMethod(method: string): Result<string, ValidationError> {
  // Check for empty method
  if (!method || method.trim() === '') {
    return Result.err({
      message: 'Extraction method is required',
    });
  }

  // First, try using the built-in normalization
  const normalizedKey = normalizeExtractionMethod(method);

  if (normalizedKey !== 'unknown') {
    // Return the canonical form of the method
    return Result.ok(EXTRACTION_METHODS[normalizedKey]);
  }

  // Try our extended aliases
  const normalizedString = normalizeMethodString(method);
  const aliasKey = METHOD_ALIASES[normalizedString];

  if (aliasKey) {
    return Result.ok(EXTRACTION_METHODS[aliasKey]);
  }

  // Check if it's close to a known method for suggestions
  const suggestions = findSimilarMethods(method);

  return Result.err({
    message: `Unknown extraction method: ${method}`,
    suggestions,
  });
}

/**
 * Validate that an extraction method is compatible with the file type
 *
 * @param mapping - The source mapping entry to validate
 * @returns Result with void on success, ValidationError on failure
 */
export function validateMethodFileCompatibility(
  mapping: SourceMappingEntry
): Result<void, ValidationError> {
  const { sourceFile, extractionMethod } = mapping;

  // Skip compatibility check for self-references with self-reference-only methods
  if (isSelfReference(sourceFile)) {
    // Self-references can use any method, but primarily use self-reference methods
    return Result.ok(undefined);
  }

  // Normalize the method for comparison
  const normalizedKey = normalizeExtractionMethod(extractionMethod);
  if (normalizedKey === 'unknown') {
    // Method validation will catch this
    return Result.ok(undefined);
  }

  const normalizedMethod = EXTRACTION_METHODS[normalizedKey];
  const ext = path.extname(sourceFile).toLowerCase();

  // Check TypeScript-only methods against feature files
  if (TYPESCRIPT_ONLY_METHODS.has(normalizedMethod)) {
    if (ext === '.feature') {
      const alternatives = Array.from(GHERKIN_ONLY_METHODS);
      return Result.err({
        message: `Method "${normalizedMethod}" cannot be used with .feature files`,
        row: mapping,
        suggestions: alternatives,
      });
    }
  }

  // Check Gherkin-only methods against TypeScript files
  if (GHERKIN_ONLY_METHODS.has(normalizedMethod)) {
    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
      return Result.err({
        message: `Method "${normalizedMethod}" requires .feature file`,
        row: mapping,
      });
    }
  }

  // Check self-reference-only methods against actual files
  if (SELF_REFERENCE_ONLY_METHODS.has(normalizedMethod)) {
    if (!isSelfReference(sourceFile)) {
      return Result.err({
        message: `Method "${normalizedMethod}" can only be used with THIS DECISION`,
        row: mapping,
      });
    }
  }

  return Result.ok(undefined);
}

/**
 * Validate table format has required columns
 *
 * @param columns - Array of column names from the table header
 * @returns Result with column mapping on success, ValidationError on failure
 */
export function validateTableFormat(
  columns: string[]
): Result<Record<string, string>, ValidationError> {
  const columnMapping: Record<string, string> = {};
  const normalizedColumns = new Set<string>();

  // Process each column, applying aliases
  for (const col of columns) {
    const trimmed = col.trim();
    const mapped = COLUMN_ALIASES[trimmed] ?? trimmed;
    columnMapping[trimmed] = mapped;
    normalizedColumns.add(mapped);
  }

  // Check for required columns
  for (const required of REQUIRED_COLUMNS) {
    if (!normalizedColumns.has(required)) {
      return Result.err({
        message: `Missing required column: ${required}`,
      });
    }
  }

  return Result.ok(columnMapping);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find extraction methods similar to the given string
 */
function findSimilarMethods(method: string): string[] {
  const methodLower = method.toLowerCase();
  const suggestions: string[] = [];

  // Check for partial matches
  for (const validMethod of VALID_EXTRACTION_METHODS) {
    const validLower = validMethod.toLowerCase();

    // Check if any word in the valid method appears in the input
    const validWords = validLower.split(/[\s-]+/);
    const inputWords = methodLower.split(/[\s-]+/);

    const hasCommonWord = validWords.some(
      (vw) => inputWords.some((iw) => vw.includes(iw) || iw.includes(vw)) && vw.length > 2
    );

    if (hasCommonWord) {
      suggestions.push(validMethod);
    }
  }

  // If no suggestions found, provide the most common ones
  if (suggestions.length === 0) {
    suggestions.push('@extract-shapes tag', 'Rule blocks');
  }

  return suggestions;
}

// =============================================================================
// Main Validation Function
// =============================================================================

/**
 * Validate a complete source mapping table
 *
 * Performs all validation checks and collects all errors rather than
 * stopping at the first one.
 *
 * @param mappings - Array of source mapping entries to validate
 * @param options - Validation options including base directory
 * @returns ValidationResult with all errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateSourceMappingTable(mappings, {
 *   baseDir: process.cwd(),
 *   warningCollector: createWarningCollector()
 * });
 *
 * if (!result.isValid) {
 *   for (const error of result.errors) {
 *     console.error(error.message);
 *   }
 * }
 * ```
 */
export function validateSourceMappingTable(
  mappings: readonly SourceMappingEntry[],
  options: ValidatorOptions
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const mapping of mappings) {
    // 1. Validate file existence
    const fileResult = validateFileExists(mapping, options.baseDir);
    if (!fileResult.ok) {
      errors.push(fileResult.error);
    }

    // 2. Validate extraction method
    const methodResult = validateExtractionMethod(mapping.extractionMethod);
    if (!methodResult.ok) {
      errors.push({
        ...methodResult.error,
        row: mapping,
      });
    }

    // 3. Validate method-file compatibility (only if method is valid)
    if (methodResult.ok) {
      const compatResult = validateMethodFileCompatibility(mapping);
      if (!compatResult.ok) {
        errors.push(compatResult.error);
      }
    }
  }

  // Note: Validation is pass/fail per row, no warnings are generated.
  // The warnings array is kept in the interface for future extensibility.
  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}
