#!/usr/bin/env node

/**
 * @architect
 * @architect-pattern CLIErrorHandler
 * @architect-cli
 * @architect-status completed
 * @architect-role:utility
 * @architect-bounded-context:cli
 * @architect-uses ErrorFactoryTypes
 * ValidatePatternsCLI, DocumentationGeneratorCLI
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

import {
  exitWithErrorMessage,
  exitWithProcessError,
  type DocError,
} from '@libar-dev/architect-core';

function stringifyJsonValue(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }

  return JSON.stringify(value);
}

function isReadonlyStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

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
  if (error === null || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { type?: unknown; message?: unknown };

  // Check for required DocError properties
  if (typeof maybeError.type !== 'string' || typeof maybeError.message !== 'string') {
    return false;
  }

  // Verify type is one of the known DocError discriminators
  const knownTypes = [
    'FILE_SYSTEM_ERROR',
    'FILE_PARSE_ERROR',
    'DIRECTIVE_VALIDATION_ERROR',
    'PATTERN_VALIDATION_ERROR',
    'REGISTRY_VALIDATION_ERROR',
    'MARKDOWN_GENERATION_ERROR',
    'FILE_WRITE_ERROR',
    'FEATURE_PARSE_ERROR',
    'CONFIG_ERROR',
    'PROCESS_METADATA_VALIDATION_ERROR',
    'DELIVERABLE_VALIDATION_ERROR',
    'GHERKIN_PATTERN_VALIDATION_ERROR',
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
    case 'FILE_SYSTEM_ERROR':
    case 'FILE_PARSE_ERROR':
    case 'FILE_WRITE_ERROR':
    case 'FEATURE_PARSE_ERROR':
      if ('file' in error) {
        lines.push(`  File: ${error.file}`);
      }
      if ('line' in error && typeof error.line === 'number') {
        lines.push(`  Line: ${String(error.line)}`);
      }
      break;

    case 'DIRECTIVE_VALIDATION_ERROR':
      lines.push(`  File: ${error.file}`);
      lines.push(`  Line: ${String(error.line)}`);
      if (error.directive) {
        lines.push(`  Directive: ${error.directive}`);
      }
      break;

    case 'PATTERN_VALIDATION_ERROR':
    case 'GHERKIN_PATTERN_VALIDATION_ERROR':
      lines.push(`  File: ${error.file}`);
      lines.push(`  Pattern: ${error.patternName}`);
      if (
        'validationErrors' in error &&
        isReadonlyStringArray(error.validationErrors) &&
        error.validationErrors.length > 0
      ) {
        lines.push('  Validation errors:');
        for (const ve of error.validationErrors) {
          lines.push(`    - ${ve}`);
        }
      }
      break;

    case 'REGISTRY_VALIDATION_ERROR':
      lines.push(`  Registry: ${error.registryPath}`);
      if (error.validationErrors !== undefined && error.validationErrors.length > 0) {
        lines.push('  Validation errors:');
        for (const ve of error.validationErrors) {
          lines.push(`    - ${ve}`);
        }
      }
      break;

    case 'PROCESS_METADATA_VALIDATION_ERROR':
    case 'DELIVERABLE_VALIDATION_ERROR':
      lines.push(`  File: ${error.file}`);
      if ('deliverableName' in error && error.deliverableName) {
        lines.push(`  Deliverable: ${error.deliverableName}`);
      }
      if (
        'validationErrors' in error &&
        isReadonlyStringArray(error.validationErrors) &&
        error.validationErrors.length > 0
      ) {
        lines.push('  Validation errors:');
        for (const ve of error.validationErrors) {
          lines.push(`    - ${ve}`);
        }
      }
      break;

    case 'CONFIG_ERROR':
      lines.push(`  Field: ${error.field}`);
      if (error.value !== undefined) {
        lines.push(`  Value: ${stringifyJsonValue(error.value)}`);
      }
      break;

    case 'MARKDOWN_GENERATION_ERROR':
      lines.push(`  Pattern ID: ${error.patternId}`);
      break;
  }

  return lines.join('\n');
}

/**
 * Whether the invocation selected `--format json`.
 *
 * Read straight off `argv` rather than the parsed args: an error can be thrown
 * from argument parsing itself (before a `ParsedArgs` exists) and the top-level
 * `main().catch` has no `format` in scope. The CLI parses `--format json` as the
 * space-separated form; the `=` form is accepted defensively.
 */
function argvSelectsJsonFormat(argv: readonly string[]): boolean {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--format=json') {
      return true;
    }
    if (arg === '--format' && argv[index + 1] === 'json') {
      return true;
    }
  }
  return false;
}

/**
 * The structured `{ success: false, error }` envelope for `--format json` mode,
 * mirroring the success envelope's `success` discriminant. A DocError contributes
 * its `type`; the message already carries any enumerated accepted-value set.
 */
function toErrorEnvelope(error: unknown): {
  success: false;
  error: { message: string; type?: string };
} {
  if (isDocError(error)) {
    return { success: false, error: { type: error.type, message: error.message } };
  }
  return {
    success: false,
    error: { message: error instanceof Error ? error.message : String(error) },
  };
}

/**
 * Unified CLI error handler that formats and exits
 *
 * Handles both DocError instances and generic Error/unknown values.
 * Outputs structured error information and exits with specified code.
 *
 * Under `--format json`, the error is emitted as a `{ success: false, error }`
 * JSON envelope on **stderr** (never stdout — the success-path pipe invariant
 * keeps stdout clean for `jq`), exit code unchanged. A consumer that merges
 * streams (`… 2>&1 | jq`) then parses the envelope instead of hitting the
 * plain-text `Error:` line. Text mode keeps the human-readable stderr output.
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
  if (argvSelectsJsonFormat(process.argv.slice(2))) {
    return exitWithErrorMessage(JSON.stringify(toErrorEnvelope(error), null, 2), exitCode);
  }

  if (isDocError(error)) {
    return exitWithErrorMessage(formatDocError(error), exitCode);
  }

  return exitWithProcessError(error, exitCode);
}
