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
import { Result as R } from '../types/index.js';
/**
 * Format Zod validation errors for display
 *
 * @param error - Zod error object
 * @returns Array of formatted error strings
 */
function formatZodErrors(error) {
    return error.issues.map((issue) => {
        const pathStr = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `  - ${pathStr}: ${issue.message}`;
    });
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
export function createJsonInputCodec(schema) {
    return {
        parse(content, source) {
            // Step 1: Parse JSON
            let data;
            try {
                data = JSON.parse(content);
            }
            catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                return R.err({
                    type: 'codec-error',
                    operation: 'parse',
                    source,
                    message: source ? `Invalid JSON in ${source}: ${message}` : `Invalid JSON: ${message}`,
                });
            }
            // Step 2: Strip $schema field if present (JSON Schema references)
            const configData = typeof data === 'object' && data !== null && '$schema' in data
                ? (({ $schema: _, ...rest }) => rest)(data)
                : data;
            // Step 3: Validate with Zod
            const parseResult = schema.safeParse(configData);
            if (!parseResult.success) {
                const validationErrors = formatZodErrors(parseResult.error);
                return R.err({
                    type: 'codec-error',
                    operation: 'parse',
                    source,
                    message: source ? `Schema validation failed for ${source}` : 'Schema validation failed',
                    validationErrors,
                });
            }
            return R.ok(parseResult.data);
        },
        safeParse(content) {
            const result = this.parse(content);
            return result.ok ? result.value : undefined;
        },
    };
}
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
export function createJsonOutputCodec(schema, defaultIndent = 2) {
    return {
        serialize(data, source) {
            return this.serializeWithOptions(data, { source, indent: defaultIndent });
        },
        serializeWithOptions(data, options = {}) {
            const { indent = defaultIndent, source } = options;
            // Validate before serialization
            const parseResult = schema.safeParse(data);
            if (!parseResult.success) {
                const validationErrors = formatZodErrors(parseResult.error);
                return R.err({
                    type: 'codec-error',
                    operation: 'serialize',
                    source,
                    message: source
                        ? `Schema validation failed before serializing ${source}`
                        : 'Schema validation failed before serialization',
                    validationErrors,
                });
            }
            // Serialize to JSON
            try {
                const jsonString = JSON.stringify(parseResult.data, null, indent);
                return R.ok(jsonString);
            }
            catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                return R.err({
                    type: 'codec-error',
                    operation: 'serialize',
                    source,
                    message: source
                        ? `JSON serialization failed for ${source}: ${message}`
                        : `JSON serialization failed: ${message}`,
                });
            }
        },
    };
}
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
export function formatCodecError(error) {
    const lines = [`Codec error (${error.operation}): ${error.message}`];
    if (error.validationErrors && error.validationErrors.length > 0) {
        lines.push('Validation errors:');
        lines.push(...error.validationErrors);
    }
    return lines.join('\n');
}
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
export function createFileLoader(codec, readFile) {
    return async (path) => {
        try {
            const content = await readFile(path);
            return codec.parse(content, path);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            // Check for common file errors
            if (e instanceof Error && 'code' in e) {
                const nodeError = e;
                if (nodeError.code === 'ENOENT') {
                    return R.err({
                        type: 'codec-error',
                        operation: 'parse',
                        source: path,
                        message: `File not found: ${path}`,
                    });
                }
                if (nodeError.code === 'EACCES') {
                    return R.err({
                        type: 'codec-error',
                        operation: 'parse',
                        source: path,
                        message: `Permission denied: ${path}`,
                    });
                }
            }
            return R.err({
                type: 'codec-error',
                operation: 'parse',
                source: path,
                message: `Failed to read file ${path}: ${message}`,
            });
        }
    };
}
//# sourceMappingURL=codec-utils.js.map