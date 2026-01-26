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
export function createFileSystemError(file, reason, originalError) {
    const reasonMessages = {
        NOT_FOUND: `File not found: ${file}`,
        NO_PERMISSION: `Permission denied: ${file}`,
        NOT_A_FILE: `Not a file: ${file}`,
        OTHER: `File system error: ${file}`,
    };
    // Use spread to conditionally include optional fields
    return {
        type: "FILE_SYSTEM_ERROR",
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
export function createFileParseError(file, reason, location, originalError) {
    const locationStr = location ? ` at line ${location.line}, column ${location.column}` : "";
    // Use spread to conditionally include optional fields
    return {
        type: "FILE_PARSE_ERROR",
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
 *   '@libar-docs-'
 * );
 * ```
 */
export function createDirectiveValidationError(file, line, reason, directive) {
    // Use spread to conditionally include optional fields
    return {
        type: "DIRECTIVE_VALIDATION_ERROR",
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
export function createPatternValidationError(file, patternName, reason, validationErrors) {
    // Use spread to conditionally include optional fields
    return {
        type: "PATTERN_VALIDATION_ERROR",
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
export function createFeatureParseError(file, reason, originalError) {
    return {
        type: "FEATURE_PARSE_ERROR",
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
export function createProcessMetadataValidationError(file, reason, validationErrors) {
    return {
        type: "PROCESS_METADATA_VALIDATION_ERROR",
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
export function createDeliverableValidationError(file, reason, deliverableName, validationErrors) {
    const nameStr = deliverableName ? ` "${deliverableName}"` : "";
    return {
        type: "DELIVERABLE_VALIDATION_ERROR",
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
export function createGherkinPatternValidationError(file, patternName, reason, validationErrors) {
    return {
        type: "GHERKIN_PATTERN_VALIDATION_ERROR",
        message: `Gherkin pattern "${patternName}" validation failed in ${file}: ${reason}`,
        file,
        patternName,
        reason,
        ...(validationErrors !== undefined && { validationErrors }),
    };
}
//# sourceMappingURL=errors.js.map