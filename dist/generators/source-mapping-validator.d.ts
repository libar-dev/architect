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
import { Result } from '../types/result.js';
import { type SourceMappingEntry } from '../renderable/codecs/decision-doc.js';
import type { Warning, WarningCollector } from './warning-collector.js';
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
/**
 * Valid extraction methods for reference
 */
export declare const VALID_EXTRACTION_METHODS: readonly string[];
/**
 * Validate that a source file exists
 *
 * @param mapping - The source mapping entry to validate
 * @param baseDir - Base directory for resolving relative paths
 * @returns Result with void on success, ValidationError on failure
 */
export declare function validateFileExists(mapping: SourceMappingEntry, baseDir: string): Result<void, ValidationError>;
/**
 * Validate that an extraction method is valid
 *
 * @param method - The extraction method string
 * @returns Result with normalized method on success, ValidationError on failure
 */
export declare function validateExtractionMethod(method: string): Result<string, ValidationError>;
/**
 * Validate that an extraction method is compatible with the file type
 *
 * @param mapping - The source mapping entry to validate
 * @returns Result with void on success, ValidationError on failure
 */
export declare function validateMethodFileCompatibility(mapping: SourceMappingEntry): Result<void, ValidationError>;
/**
 * Validate table format has required columns
 *
 * @param columns - Array of column names from the table header
 * @returns Result with column mapping on success, ValidationError on failure
 */
export declare function validateTableFormat(columns: string[]): Result<Record<string, string>, ValidationError>;
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
export declare function validateSourceMappingTable(mappings: readonly SourceMappingEntry[], options: ValidatorOptions): ValidationResult;
//# sourceMappingURL=source-mapping-validator.d.ts.map