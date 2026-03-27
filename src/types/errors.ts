/**
 * @architect
 * @architect-core
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
 * Base error interface for all documentation errors
 *
 * @architect-shape
 * @architect-include core-types
 */
export interface BaseDocError {
  /** Error type discriminator for pattern matching */
  readonly type: string;
  /** Human-readable error message */
  readonly message: string;
}

/**
 * File system error - file not found, permission denied, etc.
 */
export interface FileSystemError extends BaseDocError {
  readonly type: 'FILE_SYSTEM_ERROR';
  readonly file: string;
  readonly reason: 'NOT_FOUND' | 'NO_PERMISSION' | 'NOT_A_FILE' | 'OTHER';
  readonly originalError?: unknown;
}

/**
 * File parsing error - invalid TypeScript, malformed syntax
 */
export interface FileParseError extends BaseDocError {
  readonly type: 'FILE_PARSE_ERROR';
  readonly file: string;
  readonly reason: string;
  readonly line?: number;
  readonly column?: number;
  readonly originalError?: unknown;
}

/**
 * Directive validation error - invalid @architect-* format
 */
export interface DirectiveValidationError extends BaseDocError {
  readonly type: 'DIRECTIVE_VALIDATION_ERROR';
  readonly file: string;
  readonly line: number;
  readonly reason: string;
  readonly directive?: string;
}

/**
 * Pattern validation error - pattern doesn't conform to schema
 */
export interface PatternValidationError extends BaseDocError {
  readonly type: 'PATTERN_VALIDATION_ERROR';
  readonly file: SourceFilePath;
  readonly patternName: string;
  readonly reason: string;
  readonly validationErrors?: string[];
}

/**
 * Registry validation error - invalid registry format or data
 */
export interface RegistryValidationError extends BaseDocError {
  readonly type: 'REGISTRY_VALIDATION_ERROR';
  readonly registryPath: string;
  readonly reason: string;
  readonly validationErrors?: string[];
}

/**
 * Markdown generation error - failed to generate output
 */
export interface MarkdownGenerationError extends BaseDocError {
  readonly type: 'MARKDOWN_GENERATION_ERROR';
  readonly patternId: string;
  readonly reason: string;
  readonly originalError?: unknown;
}

/**
 * File write error - failed to write markdown or registry
 */
export interface FileWriteError extends BaseDocError {
  readonly type: 'FILE_WRITE_ERROR';
  readonly file: string;
  readonly reason: string;
  readonly originalError?: unknown;
}

/**
 * Feature file parse error - failed to parse .feature file
 */
export interface FeatureParseError extends BaseDocError {
  readonly type: 'FEATURE_PARSE_ERROR';
  readonly file: string;
  readonly reason: string;
  readonly originalError?: unknown;
}

/**
 * Configuration error - invalid scanner or generator config
 */
export interface ConfigError extends BaseDocError {
  readonly type: 'CONFIG_ERROR';
  readonly field: string;
  readonly reason: string;
  readonly value?: unknown;
}

/**
 * Process metadata validation error - invalid @architect-* tag values
 *
 * Raised when extracting process metadata from Gherkin feature tags
 * and the values don't conform to ProcessMetadataSchema.
 */
export interface ProcessMetadataValidationError extends BaseDocError {
  readonly type: 'PROCESS_METADATA_VALIDATION_ERROR';
  readonly file: string;
  readonly reason: string;
  readonly validationErrors?: readonly string[];
}

/**
 * Deliverable validation error - invalid deliverable table data
 *
 * Raised when extracting deliverables from Gherkin Background tables
 * and the data doesn't conform to DeliverableSchema.
 */
export interface DeliverableValidationError extends BaseDocError {
  readonly type: 'DELIVERABLE_VALIDATION_ERROR';
  readonly file: string;
  readonly deliverableName?: string;
  readonly reason: string;
  readonly validationErrors?: readonly string[];
}

/**
 * Gherkin pattern extraction error - pattern failed schema validation
 *
 * Raised when building ExtractedPattern from Gherkin features and
 * the result doesn't conform to ExtractedPatternSchema.
 */
export interface GherkinPatternValidationError extends BaseDocError {
  readonly type: 'GHERKIN_PATTERN_VALIDATION_ERROR';
  readonly file: string;
  readonly patternName: string;
  readonly reason: string;
  readonly validationErrors?: readonly string[];
}

/**
 * Discriminated union of all possible errors
 *
 * **Benefits**:
 * - Exhaustive pattern matching in switch statements
 * - Type narrowing based on `type` field
 * - Compile-time verification of error handling
 *
 * @architect-shape
 * @architect-include core-types
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

/** Errors that can occur during scanning */
export type ScanError = FileSystemError | FileParseError | DirectiveValidationError;

/** Errors that can occur during extraction */
export type ExtractionError =
  | PatternValidationError
  | DirectiveValidationError
  | ProcessMetadataValidationError
  | DeliverableValidationError
  | GherkinPatternValidationError;

/** Errors that can occur during generation */
export type GenerationError = MarkdownGenerationError | FileWriteError | RegistryValidationError;

/**
 * Error with collected failures from batch operations
 *
 * Used when processing multiple files or patterns where some succeed
 * and others fail. Preserves all failure information for reporting.
 */
export interface BatchError<E extends DocError> extends BaseDocError {
  readonly type: 'BATCH_ERROR';
  readonly errors: readonly E[];
  readonly successCount: number;
  readonly failureCount: number;
}

/**
 * Create a FileSystemError
 *
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
  originalError?: unknown
): FileSystemError {
  const reasonMessages: Record<FileSystemError['reason'], string> = {
    NOT_FOUND: `File not found: ${file}`,
    NO_PERMISSION: `Permission denied: ${file}`,
    NOT_A_FILE: `Not a file: ${file}`,
    OTHER: `File system error: ${file}`,
  };

  // Use spread to conditionally include optional fields
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
  originalError?: unknown
): FileParseError {
  const locationStr = location ? ` at line ${location.line}, column ${location.column}` : '';

  // Use spread to conditionally include optional fields
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
  directive?: string
): DirectiveValidationError {
  // Use spread to conditionally include optional fields
  return {
    type: 'DIRECTIVE_VALIDATION_ERROR',
    message: `Directive validation failed at ${file}:${line}: ${reason}`,
    file,
    line,
    reason,
    ...(directive !== undefined && { directive }),
  };
}

/**
 * Create a PatternValidationError
 *
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
  validationErrors?: string[]
): PatternValidationError {
  // Use spread to conditionally include optional fields
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
  originalError?: unknown
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
  validationErrors?: readonly string[]
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
  validationErrors?: readonly string[]
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
  validationErrors?: readonly string[]
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
