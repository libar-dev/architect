#!/usr/bin/env node

/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern CLIErrorHandler
 * @libar-docs-status completed
 * @libar-docs-uses DocError
 * @libar-docs-used-by LintPatternsCLI, ValidatePatternsCLI, DocumentationGeneratorCLI
 *
 * ## CLIErrorHandler - Unified CLI Error Handling Utilities
 *
 * Provides type-safe error handling for all CLI commands using the
 * DocError discriminated union pattern. Ensures structured error
 * context is preserved and formatted consistently.
 *
 * ### When to Use
 *
 * - In catch blocks of CLI main functions
 * - When formatting DocError for console output
 * - When checking if an unknown error is a DocError
 */

import type { DocError } from "../types/errors.js";

/**
 * Type guard to check if an unknown value is a DocError
 *
 * Uses the discriminated union `type` property to identify DocError instances.
 * All DocError variants have a `type` string property that uniquely identifies them.
 *
 * @param error - Unknown error value to check
 * @returns True if the error is a DocError with recognized type
 *
 * @example
 * ```typescript
 * try {
 *   await scanPatterns(config);
 * } catch (error) {
 *   if (isDocError(error)) {
 *     // TypeScript knows error is DocError here
 *     console.log(error.type, error.message);
 *   }
 * }
 * ```
 */
export function isDocError(error: unknown): error is DocError {
  if (error === null || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { type?: unknown; message?: unknown };

  // Check for required DocError properties
  if (typeof maybeError.type !== "string" || typeof maybeError.message !== "string") {
    return false;
  }

  // Verify type is one of the known DocError discriminators
  const knownTypes = [
    "FILE_SYSTEM_ERROR",
    "FILE_PARSE_ERROR",
    "DIRECTIVE_VALIDATION_ERROR",
    "PATTERN_VALIDATION_ERROR",
    "REGISTRY_VALIDATION_ERROR",
    "MARKDOWN_GENERATION_ERROR",
    "FILE_WRITE_ERROR",
    "FEATURE_PARSE_ERROR",
    "CONFIG_ERROR",
    "PROCESS_METADATA_VALIDATION_ERROR",
    "DELIVERABLE_VALIDATION_ERROR",
    "GHERKIN_PATTERN_VALIDATION_ERROR",
  ];

  return knownTypes.includes(maybeError.type);
}

/**
 * Format a DocError for console output with structured context
 *
 * Extracts file paths, line numbers, and validation errors from the
 * DocError structure and formats them for human-readable output.
 *
 * @param error - DocError to format
 * @returns Formatted error string with context
 *
 * @example
 * ```typescript
 * const error = createFileParseError('/path/to/file.ts', 'Syntax error', { line: 42 });
 * console.error(formatDocError(error));
 * // Output: "FILE_PARSE_ERROR: Failed to parse /path/to/file.ts at line 42: Syntax error"
 * ```
 */
export function formatDocError(error: DocError): string {
  const lines: string[] = [];

  // Main error message with type prefix
  lines.push(`[${error.type}] ${error.message}`);

  // Add structured context based on error type
  switch (error.type) {
    case "FILE_SYSTEM_ERROR":
    case "FILE_PARSE_ERROR":
    case "FILE_WRITE_ERROR":
    case "FEATURE_PARSE_ERROR":
      if ("file" in error) {
        lines.push(`  File: ${error.file}`);
      }
      if ("line" in error && typeof error.line === "number") {
        lines.push(`  Line: ${error.line}`);
      }
      break;

    case "DIRECTIVE_VALIDATION_ERROR":
      lines.push(`  File: ${error.file}`);
      lines.push(`  Line: ${error.line}`);
      if (error.directive) {
        lines.push(`  Directive: ${error.directive}`);
      }
      break;

    case "PATTERN_VALIDATION_ERROR":
    case "GHERKIN_PATTERN_VALIDATION_ERROR":
      lines.push(`  File: ${error.file}`);
      lines.push(`  Pattern: ${error.patternName}`);
      if (
        "validationErrors" in error &&
        Array.isArray(error.validationErrors) &&
        error.validationErrors.length > 0
      ) {
        lines.push("  Validation errors:");
        for (const ve of error.validationErrors) {
          lines.push(`    - ${ve}`);
        }
      }
      break;

    case "REGISTRY_VALIDATION_ERROR":
      lines.push(`  Registry: ${error.registryPath}`);
      if (error.validationErrors !== undefined && error.validationErrors.length > 0) {
        lines.push("  Validation errors:");
        for (const ve of error.validationErrors) {
          lines.push(`    - ${ve}`);
        }
      }
      break;

    case "PROCESS_METADATA_VALIDATION_ERROR":
    case "DELIVERABLE_VALIDATION_ERROR":
      lines.push(`  File: ${error.file}`);
      if ("deliverableName" in error && error.deliverableName) {
        lines.push(`  Deliverable: ${error.deliverableName}`);
      }
      if (
        "validationErrors" in error &&
        Array.isArray(error.validationErrors) &&
        error.validationErrors.length > 0
      ) {
        lines.push("  Validation errors:");
        for (const ve of error.validationErrors) {
          lines.push(`    - ${ve}`);
        }
      }
      break;

    case "CONFIG_ERROR":
      lines.push(`  Field: ${error.field}`);
      if (error.value !== undefined) {
        lines.push(`  Value: ${JSON.stringify(error.value)}`);
      }
      break;

    case "MARKDOWN_GENERATION_ERROR":
      lines.push(`  Pattern ID: ${error.patternId}`);
      break;
  }

  return lines.join("\n");
}

/**
 * Unified CLI error handler that formats and exits
 *
 * Handles both DocError instances and generic Error/unknown values.
 * Outputs structured error information and exits with specified code.
 *
 * @param error - Error to handle (DocError, Error, or unknown)
 * @param exitCode - Process exit code (default: 1)
 * @returns Never - always calls process.exit
 *
 * @example
 * ```typescript
 * async function main(): Promise<void> {
 *   try {
 *     await doWork();
 *   } catch (error) {
 *     handleCliError(error, 1);
 *   }
 * }
 * ```
 */
export function handleCliError(error: unknown, exitCode = 1): never {
  if (isDocError(error)) {
    // Structured DocError - format with full context
    console.error(formatDocError(error));
  } else if (error instanceof Error) {
    // Standard Error - use message and optionally stack
    console.error("Error:", error.message);
    if (process.env["DEBUG"]) {
      console.error("Stack trace:", error.stack);
    }
  } else {
    // Unknown error type - stringify
    console.error("Error:", String(error));
  }

  process.exit(exitCode);
}
