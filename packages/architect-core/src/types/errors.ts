/**
 * @architect
 * @architect-role:contract
 * @architect-pattern ErrorFactoryTypes
 * @architect-status completed
 * @architect-implements ErrorFactories
 * @architect-product-area CoreTypes
 *
 * ## Error Factories - Type Definitions
 *
 * Structured, discriminated error types with factory functions.
 * Each error type has a unique `type` discriminator for exhaustive pattern matching.
 *
 * **When to Use:** When creating or handling domain-specific errors — use these factory types instead of plain Error for exhaustive matching.
 */

import type { SourceFilePath } from './branded.js';

/**
 * Base error interface all documentation errors extend — carries the
 * discriminator and message common to every error variant.
 *
 * @architect-shape
 */
export interface BaseDocError {
  /** Error type discriminator for pattern matching */
  readonly type: string;
  /** Human-readable error message */
  readonly message: string;
}

/**
 * File system error - file not found, permission denied, etc.
 *
 * @architect-shape
 */
export interface FileSystemError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FILE_SYSTEM_ERROR';
  /** Path of the file the operation failed on. */
  readonly file: string;
  /** Specific failure category. */
  readonly reason: 'NOT_FOUND' | 'NO_PERMISSION' | 'NOT_A_FILE' | 'OTHER';
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}

/**
 * File parsing error - invalid TypeScript, malformed syntax.
 *
 * @architect-shape
 */
export interface FileParseError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FILE_PARSE_ERROR';
  /** Path of the file that failed to parse. */
  readonly file: string;
  /** Description of the parse failure. */
  readonly reason: string;
  /** Line number of the failure, if known. */
  readonly line?: number;
  /** Column number of the failure, if known. */
  readonly column?: number;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}

/**
 * Directive validation error - invalid `@architect-*` format.
 *
 * @architect-shape
 */
export interface DirectiveValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'DIRECTIVE_VALIDATION_ERROR';
  /** Source file containing the invalid directive. */
  readonly file: string;
  /** Line number where the directive was found. */
  readonly line: number;
  /** Why directive validation failed. */
  readonly reason: string;
  /** The offending directive text, if captured. */
  readonly directive?: string;
}

/**
 * Pattern validation error - pattern doesn't conform to schema.
 *
 * @architect-shape
 */
export interface PatternValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'PATTERN_VALIDATION_ERROR';
  /** Source file containing the invalid pattern. */
  readonly file: SourceFilePath;
  /** Name of the pattern that failed validation. */
  readonly patternName: string;
  /** Why pattern validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: string[];
}

/**
 * Registry validation error - invalid registry format or data.
 *
 * @architect-shape
 */
export interface RegistryValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'REGISTRY_VALIDATION_ERROR';
  /** Path of the registry that failed validation. */
  readonly registryPath: string;
  /** Why registry validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: string[];
}

/**
 * Markdown generation error - failed to generate output.
 *
 * @architect-shape
 */
export interface MarkdownGenerationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'MARKDOWN_GENERATION_ERROR';
  /** Identifier of the pattern being rendered. */
  readonly patternId: string;
  /** Why generation failed. */
  readonly reason: string;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}

/**
 * File write error - failed to write markdown or registry.
 *
 * @architect-shape
 */
export interface FileWriteError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FILE_WRITE_ERROR';
  /** Path of the file that failed to write. */
  readonly file: string;
  /** Why the write failed. */
  readonly reason: string;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}

/**
 * Feature file parse error - failed to parse a `.feature` file.
 *
 * @architect-shape
 */
export interface FeatureParseError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'FEATURE_PARSE_ERROR';
  /** Path of the feature file that failed to parse. */
  readonly file: string;
  /** Description of the parse failure. */
  readonly reason: string;
  /** Underlying error, if any. */
  readonly originalError?: unknown;
}

/**
 * Configuration error - invalid scanner or generator config.
 *
 * @architect-shape
 */
export interface ConfigError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'CONFIG_ERROR';
  /** The offending configuration field. */
  readonly field: string;
  /** Why the field is invalid. */
  readonly reason: string;
  /** The invalid value, if available. */
  readonly value?: unknown;
}

/**
 * Process metadata validation error - invalid `@architect-*` tag values.
 *
 * Raised when extracting process metadata from Gherkin feature tags
 * and the values don't conform to ProcessMetadataSchema.
 *
 * @architect-shape
 */
export interface ProcessMetadataValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'PROCESS_METADATA_VALIDATION_ERROR';
  /** Feature file containing the invalid metadata. */
  readonly file: string;
  /** Why validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: readonly string[];
}

/**
 * Deliverable validation error - invalid deliverable table data.
 *
 * Raised when extracting deliverables from Gherkin Background tables
 * and the data doesn't conform to DeliverableSchema.
 *
 * @architect-shape
 */
export interface DeliverableValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'DELIVERABLE_VALIDATION_ERROR';
  /** Feature file containing the invalid deliverable. */
  readonly file: string;
  /** Name of the offending deliverable, if known. */
  readonly deliverableName?: string;
  /** Why validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: readonly string[];
}

/**
 * Gherkin pattern extraction error - pattern failed schema validation.
 *
 * Raised when building ExtractedPattern from Gherkin features and
 * the result doesn't conform to ExtractedPatternSchema.
 *
 * @architect-shape
 */
export interface GherkinPatternValidationError extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'GHERKIN_PATTERN_VALIDATION_ERROR';
  /** Feature file the pattern was built from. */
  readonly file: string;
  /** Name of the pattern that failed validation. */
  readonly patternName: string;
  /** Why validation failed. */
  readonly reason: string;
  /** Specific schema validation errors, if any. */
  readonly validationErrors?: readonly string[];
}

/**
 * Discriminated union of all possible documentation errors.
 *
 * **Benefits**:
 * - Exhaustive pattern matching in switch statements
 * - Type narrowing based on `type` field
 * - Compile-time verification of error handling
 *
 * @architect-shape
 */
export type DocError =
  | FileSystemError
  | FileParseError
  | DirectiveValidationError
  | PatternValidationError
  | RegistryValidationError
  | MarkdownGenerationError
  | FileWriteError
  | FeatureParseError
  | ConfigError
  | ProcessMetadataValidationError
  | DeliverableValidationError
  | GherkinPatternValidationError;

/**
 * Specialized error types for different operations
 */

/**
 * Subset of {@link DocError} that can occur during scanning.
 *
 * @architect-shape
 */
export type ScanError = FileSystemError | FileParseError | DirectiveValidationError;

/**
 * Subset of {@link DocError} that can occur during extraction.
 *
 * @architect-shape
 */
export type ExtractionError =
  | PatternValidationError
  | DirectiveValidationError
  | ProcessMetadataValidationError
  | DeliverableValidationError
  | GherkinPatternValidationError;

/**
 * Subset of {@link DocError} that can occur during generation.
 *
 * @architect-shape
 */
export type GenerationError = MarkdownGenerationError | FileWriteError | RegistryValidationError;

/**
 * Error with collected failures from batch operations.
 *
 * Used when processing multiple files or patterns where some succeed
 * and others fail. Preserves all failure information for reporting.
 *
 * @architect-shape
 */
export interface BatchError<E extends DocError> extends BaseDocError {
  /** Discriminator literal for this error variant. */
  readonly type: 'BATCH_ERROR';
  /** The individual errors collected during the batch. */
  readonly errors: readonly E[];
  /** Count of items that succeeded. */
  readonly successCount: number;
  /** Count of items that failed. */
  readonly failureCount: number;
}

/**
 * Create a FileSystemError
 *
 * @architect-shape
 * @param file - File path that caused the error
 * @param reason - Specific reason for the failure
 * @param originalError - Optional underlying error
 * @returns Structured FileSystemError
 *
 * @example
 * ```typescript
 * const error = createFileSystemError(
 *   '/path/to/file.ts',
 *   'NOT_FOUND',
 *   new Error('ENOENT')
 * );
 * ```
 */
export function createFileSystemError(
  file: string,
  reason: FileSystemError['reason'],
  originalError?: unknown,
): FileSystemError {
  const reasonMessages: Record<FileSystemError['reason'], string> = {
    NOT_FOUND: `File not found: ${file}`,
    NO_PERMISSION: `Permission denied: ${file}`,
    NOT_A_FILE: `Not a file: ${file}`,
    OTHER: `File system error: ${file}`,
  };

  return {
    type: 'FILE_SYSTEM_ERROR',
    message: reasonMessages[reason],
    file,
    reason,
    ...(originalError !== undefined && { originalError }),
  };
}

/**
 * Create a FileParseError
 *
 * @architect-shape
 * @param file - File path that failed to parse
 * @param reason - Description of parsing failure
 * @param location - Optional line/column information
 * @param originalError - Optional underlying error
 * @returns Structured FileParseError
 *
 * @example
 * ```typescript
 * const error = createFileParseError(
 *   '/path/to/file.ts',
 *   'Unexpected token',
 *   { line: 42, column: 10 },
 *   originalError
 * );
 * ```
 */
export function createFileParseError(
  file: string,
  reason: string,
  location?: { line: number; column: number },
  originalError?: unknown,
): FileParseError {
  const locationStr = location
    ? ` at line ${String(location.line)}, column ${String(location.column)}`
    : '';

  return {
    type: 'FILE_PARSE_ERROR',
    message: `Failed to parse ${file}${locationStr}: ${reason}`,
    file,
    reason,
    ...(location && { line: location.line, column: location.column }),
    ...(originalError !== undefined && { originalError }),
  };
}

/**
 * Create a DirectiveValidationError
 *
 * @architect-shape
 * @param file - Source file containing invalid directive
 * @param line - Line number where directive was found
 * @param reason - Why validation failed
 * @param directive - Optional directive text snippet
 * @returns Structured DirectiveValidationError
 *
 * @example
 * ```typescript
 * const error = createDirectiveValidationError(
 *   'src/utils.ts',
 *   42,
 *   'Missing required tags',
 *   '@architect-'
 * );
 * ```
 */
export function createDirectiveValidationError(
  file: string,
  line: number,
  reason: string,
  directive?: string,
): DirectiveValidationError {
  return {
    type: 'DIRECTIVE_VALIDATION_ERROR',
    message: `Directive validation failed at ${file}:${String(line)}: ${reason}`,
    file,
    line,
    reason,
    ...(directive !== undefined && { directive }),
  };
}

/**
 * Create a PatternValidationError
 *
 * @architect-shape
 * @param file - Source file containing invalid pattern
 * @param patternName - Name of the invalid pattern
 * @param reason - Why validation failed
 * @param validationErrors - Specific validation errors from schema
 * @returns Structured PatternValidationError
 *
 * @example
 * ```typescript
 * const error = createPatternValidationError(
 *   asSourceFilePath('src/types.ts'),
 *   'User Schema',
 *   'Invalid pattern structure',
 *   ['tags: Required', 'description: Must be non-empty']
 * );
 * ```
 */
export function createPatternValidationError(
  file: SourceFilePath,
  patternName: string,
  reason: string,
  validationErrors?: string[],
): PatternValidationError {
  return {
    type: 'PATTERN_VALIDATION_ERROR',
    message: `Pattern validation failed for "${patternName}" in ${file}: ${reason}`,
    file,
    patternName,
    reason,
    ...(validationErrors !== undefined && { validationErrors }),
  };
}

/**
 * Create a FeatureParseError
 *
 * @architect-shape
 * @param file - Feature file path that failed to parse
 * @param reason - Description of parsing failure
 * @param originalError - Optional underlying error
 * @returns Structured FeatureParseError
 *
 * @example
 * ```typescript
 * const error = createFeatureParseError(
 *   '/path/to/test.feature',
 *   'Invalid Gherkin syntax',
 *   originalError
 * );
 * ```
 */
export function createFeatureParseError(
  file: string,
  reason: string,
  originalError?: unknown,
): FeatureParseError {
  return {
    type: 'FEATURE_PARSE_ERROR',
    message: `Failed to parse feature file ${file}: ${reason}`,
    file,
    reason,
    ...(originalError !== undefined && { originalError }),
  };
}

/**
 * Create a ProcessMetadataValidationError
 *
 * @architect-shape
 * @param file - Feature file path containing invalid process metadata
 * @param reason - Description of validation failure
 * @param validationErrors - Specific Zod validation errors
 * @returns Structured ProcessMetadataValidationError
 *
 * @example
 * ```typescript
 * const error = createProcessMetadataValidationError(
 *   '/path/to/test.feature',
 *   'Schema validation failed',
 *   ['status: Invalid enum value', 'phase: Expected number']
 * );
 * ```
 */
export function createProcessMetadataValidationError(
  file: string,
  reason: string,
  validationErrors?: readonly string[],
): ProcessMetadataValidationError {
  return {
    type: 'PROCESS_METADATA_VALIDATION_ERROR',
    message: `Process metadata validation failed in ${file}: ${reason}`,
    file,
    reason,
    ...(validationErrors !== undefined && { validationErrors }),
  };
}

/**
 * Create a DeliverableValidationError
 *
 * @architect-shape
 * @param file - Feature file path containing invalid deliverable
 * @param reason - Description of validation failure
 * @param deliverableName - Optional name of the invalid deliverable
 * @param validationErrors - Specific Zod validation errors
 * @returns Structured DeliverableValidationError
 *
 * @example
 * ```typescript
 * const error = createDeliverableValidationError(
 *   '/path/to/test.feature',
 *   'Invalid deliverable data',
 *   'MyDeliverable',
 *   ['name: Required', 'tests: Expected number']
 * );
 * ```
 */
export function createDeliverableValidationError(
  file: string,
  reason: string,
  deliverableName?: string,
  validationErrors?: readonly string[],
): DeliverableValidationError {
  const nameStr = deliverableName ? ` "${deliverableName}"` : '';
  return {
    type: 'DELIVERABLE_VALIDATION_ERROR',
    message: `Deliverable${nameStr} validation failed in ${file}: ${reason}`,
    file,
    reason,
    ...(deliverableName !== undefined && { deliverableName }),
    ...(validationErrors !== undefined && { validationErrors }),
  };
}

/**
 * Create a GherkinPatternValidationError
 *
 * @architect-shape
 * @param file - Feature file path containing invalid pattern
 * @param patternName - Name of the pattern that failed validation
 * @param reason - Description of validation failure
 * @param validationErrors - Specific Zod validation errors
 * @returns Structured GherkinPatternValidationError
 *
 * @example
 * ```typescript
 * const error = createGherkinPatternValidationError(
 *   '/path/to/test.feature',
 *   'MyPattern',
 *   'Pattern schema validation failed',
 *   ['id: Required', 'category: Invalid enum']
 * );
 * ```
 */
export function createGherkinPatternValidationError(
  file: string,
  patternName: string,
  reason: string,
  validationErrors?: readonly string[],
): GherkinPatternValidationError {
  return {
    type: 'GHERKIN_PATTERN_VALIDATION_ERROR',
    message: `Gherkin pattern "${patternName}" validation failed in ${file}: ${reason}`,
    file,
    patternName,
    reason,
    ...(validationErrors !== undefined && { validationErrors }),
  };
}
