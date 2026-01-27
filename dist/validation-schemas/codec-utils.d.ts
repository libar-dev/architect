/**
 * @libar-docs
 * @libar-docs-validation @libar-docs-core
 * @libar-docs-pattern CodecUtils
 * @libar-docs-status completed
 * @libar-docs-uses Zod
 * @libar-docs-used-by TagRegistryLoader, ArtefactSetLoader, WorkflowLoader, Orchestrator
 * @libar-docs-usecase "When loading JSON config files with type-safe validation"
 * @libar-docs-usecase "When serializing typed objects to formatted JSON"
 *
 * ## CodecUtils - Type-Safe JSON Codec Factories
 *
 * Provides factory functions for creating type-safe JSON parsing and serialization
 * pipelines using Zod schemas. Replaces manual JSON.parse/stringify with single-step
 * validated operations.
 *
 * ### When to Use
 *
 * - Use when loading JSON configuration files
 * - Use when writing JSON output files with schema validation
 * - Use when you want better error messages with file path context
 *
 * ### Key Concepts
 *
 * - **Input Codec**: Parses JSON string → validates → returns typed object
 * - **Output Codec**: Validates object → serializes → returns formatted JSON string
 * - **Error Context**: Adds file path and validation details to error messages
 */
import type { ZodType } from 'zod';
import type { Result } from '../types/index.js';
/**
 * Error details for codec operations
 */
export interface CodecError {
    /** Error type identifier */
    type: 'codec-error';
    /** Operation that failed: 'parse' or 'serialize' */
    operation: 'parse' | 'serialize';
    /** Optional source identifier (file path, URL, etc.) */
    source?: string | undefined;
    /** Human-readable error message */
    message: string;
    /** Detailed validation errors if schema validation failed */
    validationErrors?: string[] | undefined;
}
/**
 * JSON Input Codec - parses and validates JSON strings
 *
 * Combines JSON.parse and Zod schema validation into a single operation.
 */
export interface JsonInputCodec<T> {
    /**
     * Parse JSON string to typed object
     *
     * @param content - JSON string to parse
     * @param source - Optional source identifier for error messages
     * @returns Result with typed value or error
     */
    parse(content: string, source?: string): Result<T, CodecError>;
    /**
     * Safely parse JSON, returning undefined on failure
     *
     * @param content - JSON string to parse
     * @returns Typed value or undefined
     */
    safeParse(content: string): T | undefined;
}
/**
 * JSON Output Codec - validates and serializes objects to JSON
 *
 * Combines Zod validation and JSON.stringify into a single operation.
 */
export interface JsonOutputCodec<T> {
    /**
     * Serialize typed object to JSON string
     *
     * @param data - Object to serialize
     * @param source - Optional source identifier for error messages
     * @returns Result with JSON string or error
     */
    serialize(data: T, source?: string): Result<string, CodecError>;
    /**
     * Serialize with options
     *
     * @param data - Object to serialize
     * @param options - Serialization options
     * @returns Result with JSON string or error
     */
    serializeWithOptions(data: T, options: {
        indent?: number | undefined;
        source?: string | undefined;
    }): Result<string, CodecError>;
}
/**
 * Create a JSON input codec from a Zod schema
 *
 * The codec handles:
 * - JSON parsing with syntax error handling
 * - Zod schema validation
 * - $schema field stripping (for JSON Schema references)
 * - Detailed error messages with source context
 *
 * @param schema - Zod schema to validate against
 * @returns JsonInputCodec instance
 *
 * @example
 * ```typescript
 * const WorkflowCodec = createJsonInputCodec(WorkflowConfigSchema);
 *
 * // Load and validate in one step
 * const content = await fs.readFile("workflow.json", "utf-8");
 * const result = WorkflowCodec.parse(content, "workflow.json");
 *
 * if (result.ok) {
 *   // result.value is typed as WorkflowConfig
 *   console.log(result.value.name);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export declare function createJsonInputCodec<T>(schema: ZodType<T>): JsonInputCodec<T>;
/**
 * Create a JSON output codec from a Zod schema
 *
 * The codec handles:
 * - Zod schema validation before serialization
 * - Formatted JSON output with configurable indentation
 * - Detailed error messages with source context
 *
 * @param schema - Zod schema to validate against
 * @param defaultIndent - Default indentation spaces (default: 2)
 * @returns JsonOutputCodec instance
 *
 * @example
 * ```typescript
 * const RegistryCodec = createJsonOutputCodec(PatternRegistrySchema);
 *
 * const registry = { patterns: [...], metadata: {...} };
 * const result = RegistryCodec.serialize(registry, "registry.json");
 *
 * if (result.ok) {
 *   await fs.writeFile("registry.json", result.value, "utf-8");
 * }
 * ```
 */
export declare function createJsonOutputCodec<T>(schema: ZodType<T>, defaultIndent?: number): JsonOutputCodec<T>;
/**
 * Format codec error for console display
 *
 * @param error - Codec error
 * @returns Formatted error message
 *
 * @example
 * ```typescript
 * const result = codec.parse(content, "config.json");
 * if (!result.ok) {
 *   console.error(formatCodecError(result.error));
 *   process.exit(1);
 * }
 * ```
 */
export declare function formatCodecError(error: CodecError): string;
/**
 * Create a file loader that uses a codec for validation
 *
 * Combines file reading with codec parsing for a complete loading pipeline.
 * This is a helper for the common pattern of reading a file and parsing it.
 *
 * @param codec - JsonInputCodec to use for parsing
 * @param readFile - File reading function (e.g., fs.readFile)
 * @returns Async function that loads and parses a file
 *
 * @example
 * ```typescript
 * import * as fs from "fs/promises";
 *
 * const WorkflowCodec = createJsonInputCodec(WorkflowConfigSchema);
 * const loadWorkflow = createFileLoader(WorkflowCodec, (p) => fs.readFile(p, "utf-8"));
 *
 * const result = await loadWorkflow("config/workflow.json");
 * if (result.ok) {
 *   console.log(result.value.phases);
 * }
 * ```
 */
export declare function createFileLoader<T>(codec: JsonInputCodec<T>, readFile: (path: string) => Promise<string>): (path: string) => Promise<Result<T, CodecError>>;
//# sourceMappingURL=codec-utils.d.ts.map