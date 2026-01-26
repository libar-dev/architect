/**
 * BDD Test World - Shared Types for delivery-process Tests
 *
 * This module defines shared types and interfaces used across all BDD step definitions.
 * It follows the vitest-cucumber pattern of module-level state that gets reset per scenario.
 *
 * @libar-docs
 */

import type { Result } from "../../src/types/result.js";
import type { DocDirective, ExtractedPattern } from "../../src/types/index.js";
import type { LintViolation, LintResult } from "../../src/lint/index.js";
import type { ScanResults } from "../../src/scanner/index.js";

// =============================================================================
// Common Types
// =============================================================================

/**
 * Type for vitest-cucumber DataTable rows.
 * Gherkin tables can have any column headers, so this is a generic key-value mapping.
 * Column headers become keys, cell values become string values.
 */
export type DataTableRow = Record<string, string>;

/**
 * Convert vitest-cucumber DataTable rows with `field` and `value` columns to a key-value object.
 * This helper is for the common pattern of tables like:
 *   | field | value |
 *   | name  | Test  |
 */
export function tableRowsToObject(
  rows: Array<{ field: string; value: string }>
): Record<string, string> {
  return rows.reduce(
    (acc, row) => {
      acc[row.field] = row.value;
      return acc;
    },
    {} as Record<string, string>
  );
}

// =============================================================================
// Lint Domain State
// =============================================================================

/**
 * Scenario state for lint rule tests.
 */
export interface LintScenarioState {
  directive: DocDirective | null;
  directives: DocDirective[];
  violation: LintViolation | null;
  violations: LintViolation[];
  result: LintResult | null;
}

/**
 * Initialize fresh lint scenario state.
 */
export function initLintState(): LintScenarioState {
  return {
    directive: null,
    directives: [],
    violation: null,
    violations: [],
    result: null,
  };
}

// =============================================================================
// Scanner Domain State
// =============================================================================

/**
 * Scenario state for scanner tests (scanPatterns integration).
 */
export interface ScannerScenarioState {
  tempDir: string | null;
  files: Map<string, string>;
  result: Result<ScanResults, never> | null;
  patterns: string[];
  baseDir: string;
}

/**
 * Initialize fresh scanner scenario state.
 */
export function initScannerState(): ScannerScenarioState {
  return {
    tempDir: null,
    files: new Map(),
    result: null,
    patterns: [],
    baseDir: "",
  };
}

// =============================================================================
// AST Parser Domain State
// =============================================================================

import type { ExportInfo } from "../../src/types/index.js";

/**
 * Parsed directive result from AST parser.
 */
export interface ParsedDirectiveResult {
  directive: DocDirective;
  code: string;
  exports: readonly ExportInfo[];
}

/**
 * Scenario state for AST parser tests (parseFileDirectives).
 */
export interface AstParserScenarioState {
  tempDir: string | null;
  cleanup: (() => Promise<void>) | null;
  filePath: string | null;
  fileContent: string;
  directives: ParsedDirectiveResult[];
  parseError: { file: string; message: string } | null;
}

/**
 * Initialize fresh AST parser scenario state.
 */
export function initAstParserState(): AstParserScenarioState {
  return {
    tempDir: null,
    cleanup: null,
    filePath: null,
    fileContent: "",
    directives: [],
    parseError: null,
  };
}

// =============================================================================
// Extractor Domain State
// =============================================================================

/**
 * Scenario state for extractor tests.
 */
export interface ExtractorScenarioState {
  directive: DocDirective | null;
  directives: DocDirective[];
  pattern: ExtractedPattern | null;
  patterns: ExtractedPattern[];
  code: string;
  filePath: string;
}

/**
 * Initialize fresh extractor scenario state.
 */
export function initExtractorState(): ExtractorScenarioState {
  return {
    directive: null,
    directives: [],
    pattern: null,
    patterns: [],
    code: "",
    filePath: "",
  };
}

// =============================================================================
// Generator Domain State
// =============================================================================

/**
 * Scenario state for generator/section tests.
 */
export interface GeneratorScenarioState {
  patterns: ExtractedPattern[];
  output: string;
  config: Record<string, unknown>;
}

/**
 * Initialize fresh generator scenario state.
 */
export function initGeneratorState(): GeneratorScenarioState {
  return {
    patterns: [],
    output: "",
    config: {},
  };
}

// =============================================================================
// Fragment Domain State
// =============================================================================

/**
 * Scenario state for fragment tests.
 */
export interface FragmentScenarioState {
  template: string;
  data: Record<string, unknown>;
  resolved: string;
  fragmentName: string;
}

/**
 * Initialize fresh fragment scenario state.
 */
export function initFragmentState(): FragmentScenarioState {
  return {
    template: "",
    data: {},
    resolved: "",
    fragmentName: "",
  };
}

// =============================================================================
// Validation Domain State
// =============================================================================

/**
 * Scenario state for validation/config tests.
 */
export interface ValidationScenarioState {
  input: unknown;
  result: Result<unknown, Error> | null;
  error: Error | null;
}

/**
 * Initialize fresh validation scenario state.
 */
export function initValidationState(): ValidationScenarioState {
  return {
    input: null,
    result: null,
    error: null,
  };
}

// =============================================================================
// CLI Domain State
// =============================================================================

/**
 * Scenario state for CLI tests.
 */
export interface CLIScenarioState {
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  cwd: string;
}

/**
 * Initialize fresh CLI scenario state.
 */
export function initCLIState(): CLIScenarioState {
  return {
    args: [],
    exitCode: 0,
    stdout: "",
    stderr: "",
    cwd: "",
  };
}
