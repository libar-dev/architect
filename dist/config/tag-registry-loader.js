/**
 * @libar-docs
 * @libar-docs-config
 * @libar-docs-pattern TagRegistryLoader
 * @libar-docs-status completed
 * @libar-docs-uses TagRegistrySchema, CodecUtils
 * @libar-docs-used-by LintEngine, GeneratorOrchestrator
 *
 * ## TagRegistryLoader - External Configuration Loading
 *
 * Loads and validates tag registry configuration from external JSON files.
 * Supports auto-discovery, deep merging with defaults, and comprehensive error handling.
 *
 * ### When to Use
 *
 * - Use at CLI startup to load tag taxonomy configuration
 * - Use when validating custom tag registry files
 * - Use when auto-discovering tag-registry.json in standard locations
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { TagRegistrySchema, createDefaultTagRegistry, mergeTagRegistries, } from '../validation-schemas/tag-registry.js';
import { createJsonInputCodec } from '../validation-schemas/codec-utils.js';
/**
 * Codec for parsing and validating tag registry configuration JSON
 */
const TagRegistryCodec = createJsonInputCodec(TagRegistrySchema);
/**
 * Load tag registry from file or auto-discover
 *
 * @deprecated Since v1.0.0 - Use `loadConfig()` from `config-loader.ts` instead.
 * This function loads from JSON files, while the preferred approach is TypeScript
 * configuration via `delivery-process.config.ts` files.
 *
 * Loading strategy:
 * 1. If configPath is provided, load from that path (error if not found)
 * 2. If configPath is null, auto-discover in standard locations:
 *    - `./tag-registry.json` (current directory)
 *    - `docs/architecture/tag-registry.json` (recommended monorepo location)
 * 3. If no config found, return default registry
 * 4. If config found, parse with Zod, merge with defaults, return merged registry
 *
 * @param configPath - Path to tag registry JSON file, or null for auto-discovery
 * @param baseDir - Base directory for resolving relative paths
 * @returns Result with loaded registry or error details
 *
 * @example
 * ```typescript
 * // DEPRECATED - Use loadConfig() instead:
 * import { loadConfig } from "./config-loader.js";
 * const result = await loadConfig(baseDir);
 * const registry = result.ok ? result.value.instance.registry : null;
 * ```
 */
export async function loadTagRegistry(configPath, baseDir) {
    const defaultRegistry = createDefaultTagRegistry();
    // If no path provided, try auto-discovery
    if (!configPath) {
        const candidates = [
            path.join(baseDir, 'tag-registry.json'),
            path.join(baseDir, 'docs/architecture/tag-registry.json'),
        ];
        for (const candidate of candidates) {
            try {
                await fs.access(candidate);
                configPath = candidate;
                break;
            }
            catch {
                // Continue to next candidate
            }
        }
    }
    // If still no config found after auto-discovery, return default
    if (!configPath) {
        return { ok: true, value: defaultRegistry };
    }
    // Resolve path (make absolute if relative)
    const absolutePath = path.isAbsolute(configPath) ? configPath : path.join(baseDir, configPath);
    // Read file
    let content;
    try {
        content = await fs.readFile(absolutePath, 'utf-8');
    }
    catch (error) {
        // Handle file read errors
        if (error instanceof Error && 'code' in error) {
            const nodeError = error;
            if (nodeError.code === 'ENOENT') {
                return {
                    ok: false,
                    error: {
                        type: 'tag-registry-load-error',
                        path: absolutePath,
                        message: `Tag registry file not found: ${absolutePath}`,
                    },
                };
            }
            if (nodeError.code === 'EACCES') {
                return {
                    ok: false,
                    error: {
                        type: 'tag-registry-load-error',
                        path: absolutePath,
                        message: `Permission denied reading tag registry: ${absolutePath}`,
                    },
                };
            }
        }
        const message = error instanceof Error ? error.message : String(error);
        return {
            ok: false,
            error: {
                type: 'tag-registry-load-error',
                path: absolutePath,
                message: `Failed to load tag registry: ${message}`,
            },
        };
    }
    // Parse and validate using codec (handles $schema stripping automatically)
    const parseResult = TagRegistryCodec.parse(content, absolutePath);
    if (!parseResult.ok) {
        const error = {
            type: 'tag-registry-load-error',
            path: absolutePath,
            message: parseResult.error.message,
        };
        if (parseResult.error.validationErrors) {
            error.validationErrors = parseResult.error.validationErrors;
        }
        return { ok: false, error };
    }
    // Merge with defaults (deep merge)
    const mergedRegistry = mergeTagRegistries(defaultRegistry, parseResult.value);
    return { ok: true, value: mergedRegistry };
}
/**
 * Format tag registry error for console display
 *
 * @param error - Tag registry load error
 * @returns Formatted error message for console output
 *
 * @example
 * ```typescript
 * const result = await loadTagRegistry("bad.json", "/project");
 * if (!result.ok) {
 *   console.error(formatTagRegistryError(result.error));
 *   process.exit(1);
 * }
 * ```
 */
export function formatTagRegistryError(error) {
    const lines = [`Tag registry error: ${error.message}`, `  Path: ${error.path}`];
    if (error.validationErrors && error.validationErrors.length > 0) {
        lines.push('  Validation errors:');
        lines.push(...error.validationErrors);
    }
    return lines.join('\n');
}
//# sourceMappingURL=tag-registry-loader.js.map