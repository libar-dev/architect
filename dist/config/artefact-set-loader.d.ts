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
import { type ArtefactSet } from '../validation-schemas/artefact-set.js';
import type { Result } from '../types/index.js';
/**
 * Error type for artefact set loading failures
 */
export interface ArtefactSetLoadError {
    /** Error type identifier */
    type: 'artefact-set-load-error';
    /** Name of the artefact set that failed to load */
    name: string;
    /** Path where the file was expected */
    path: string;
    /** Human-readable error message */
    message: string;
    /** Detailed Zod validation errors if schema validation failed */
    validationErrors?: string[];
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
export declare function loadArtefactSet(name: string): Promise<Result<ArtefactSet, ArtefactSetLoadError>>;
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
export declare function listAvailableArtefactSets(): Promise<string[]>;
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
export declare function formatArtefactSetError(error: ArtefactSetLoadError): string;
//# sourceMappingURL=artefact-set-loader.d.ts.map