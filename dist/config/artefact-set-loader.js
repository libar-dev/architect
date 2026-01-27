/**
 * @libar-docs
 * @libar-docs-config
 * @libar-docs-pattern ArtefactSetLoader
 * @libar-docs-status completed
 * @libar-docs-uses ArtefactSetSchema, Result, CodecUtils
 * @libar-docs-used-by GenerateDocsCLI, Orchestrator
 * @libar-docs-usecase "When loading predefined artefact sets from catalogue"
 * @libar-docs-usecase "When listing available artefact sets for CLI help"
 *
 * ## ArtefactSetLoader - Load Predefined Generator Groupings
 *
 * Loads and validates artefact set configurations from the catalogue directory.
 * Supports loading by name and listing all available sets.
 *
 * ### When to Use
 *
 * - Use when implementing --artefact-set CLI option
 * - Use when listing available artefact sets for user discovery
 * - Use when programmatically selecting generator groups
 *
 * ### Key Concepts
 *
 * - **Catalogue Location**: catalogue/artefact-sets/ in the package root
 * - **Naming Convention**: {name}.json (e.g., full-set.json, minimal-set.json)
 * - **Result Monad**: Returns Result<T, Error> for explicit error handling
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ArtefactSetSchema } from '../validation-schemas/artefact-set.js';
import { Result as R } from '../types/index.js';
import { createJsonInputCodec } from '../validation-schemas/codec-utils.js';
/**
 * Codec for parsing and validating artefact set configuration JSON
 */
const ArtefactSetCodec = createJsonInputCodec(ArtefactSetSchema);
/**
 * Get the path to the artefact-sets catalogue directory
 *
 * @returns Absolute path to catalogue/artefact-sets/
 */
function getCatalogueDir() {
    const currentFile = fileURLToPath(import.meta.url);
    const configDir = path.dirname(currentFile); // .../src/config
    const srcDir = path.dirname(configDir); // .../src
    const packageRoot = path.dirname(srcDir); // .../@libar-dev/delivery-process
    return path.join(packageRoot, 'catalogue', 'artefact-sets');
}
/**
 * Load an artefact set by name
 *
 * Looks for {name}.json in the catalogue/artefact-sets/ directory.
 * Also supports "{name}-set" format for convenience (e.g., "minimal" loads "minimal-set.json").
 *
 * @param name - Name of the artefact set to load (e.g., "full-set", "minimal", "planning")
 * @returns Result with loaded ArtefactSet or ArtefactSetLoadError
 *
 * @example
 * ```typescript
 * const result = await loadArtefactSet("minimal");
 * if (result.ok) {
 *   console.log(`Loaded ${result.value.generators.length} generators`);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function loadArtefactSet(name) {
    const catalogueDir = getCatalogueDir();
    // Normalize name: add "-set" suffix if not present
    const normalizedName = name.endsWith('-set') ? name : `${name}-set`;
    const filePath = path.join(catalogueDir, `${normalizedName}.json`);
    // Read file
    let content;
    try {
        content = await fs.readFile(filePath, 'utf-8');
    }
    catch (error) {
        // Handle file not found
        if (error instanceof Error && 'code' in error) {
            const nodeError = error;
            if (nodeError.code === 'ENOENT') {
                return R.err({
                    type: 'artefact-set-load-error',
                    name,
                    path: filePath,
                    message: `Artefact set "${name}" not found. Use --list-artefact-sets to see available sets.`,
                });
            }
            if (nodeError.code === 'EACCES') {
                return R.err({
                    type: 'artefact-set-load-error',
                    name,
                    path: filePath,
                    message: `Permission denied reading artefact set: ${filePath}`,
                });
            }
        }
        const message = error instanceof Error ? error.message : String(error);
        return R.err({
            type: 'artefact-set-load-error',
            name,
            path: filePath,
            message: `Failed to load artefact set "${name}": ${message}`,
        });
    }
    // Parse and validate using codec (handles $schema stripping automatically)
    const parseResult = ArtefactSetCodec.parse(content, filePath);
    if (!parseResult.ok) {
        const error = {
            type: 'artefact-set-load-error',
            name,
            path: filePath,
            message: parseResult.error.message,
        };
        if (parseResult.error.validationErrors) {
            error.validationErrors = parseResult.error.validationErrors;
        }
        return R.err(error);
    }
    return R.ok(parseResult.value);
}
/**
 * List all available artefact sets in the catalogue
 *
 * Scans the catalogue/artefact-sets/ directory for .json files
 * and returns their names (without extension).
 *
 * @returns Array of available artefact set names (sorted alphabetically)
 *
 * @example
 * ```typescript
 * const sets = await listAvailableArtefactSets();
 * console.log("Available artefact sets:", sets.join(", "));
 * // Output: "full-set, minimal-set, planning-set"
 * ```
 */
export async function listAvailableArtefactSets() {
    const catalogueDir = getCatalogueDir();
    try {
        const files = await fs.readdir(catalogueDir);
        return files
            .filter((file) => file.endsWith('.json'))
            .map((file) => file.replace('.json', ''))
            .sort();
    }
    catch {
        // If directory doesn't exist or can't be read, return empty array
        return [];
    }
}
/**
 * Format artefact set load error for console display
 *
 * @param error - Artefact set load error
 * @returns Formatted error message for console output
 *
 * @example
 * ```typescript
 * const result = await loadArtefactSet("invalid");
 * if (!result.ok) {
 *   console.error(formatArtefactSetError(result.error));
 *   process.exit(1);
 * }
 * ```
 */
export function formatArtefactSetError(error) {
    const lines = [`Artefact set error: ${error.message}`];
    if (error.validationErrors && error.validationErrors.length > 0) {
        lines.push('Validation errors:');
        lines.push(...error.validationErrors);
    }
    return lines.join('\n');
}
//# sourceMappingURL=artefact-set-loader.js.map