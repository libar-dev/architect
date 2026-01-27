/**
 * @libar-docs
 * @libar-docs-config
 * @libar-docs-pattern WorkflowLoader
 * @libar-docs-status completed
 * @libar-docs-uses WorkflowConfigSchema, CodecUtils
 * @libar-docs-used-by GeneratorOrchestrator, SectionHelpers
 *
 * ## WorkflowLoader - Workflow Configuration Loading
 *
 * Loads and validates workflow configuration from JSON files in the catalogue.
 * Supports loading by name from catalogue/workflows/ or by explicit path.
 *
 * ### When to Use
 *
 * - Use at pipeline startup to load workflow configuration
 * - Use when validating custom workflow configuration files
 * - Use when loading default 6-phase-standard workflow
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Result } from '../types/result.js';
import { WorkflowConfigSchema, createLoadedWorkflow, } from '../validation-schemas/workflow-config.js';
import { createJsonInputCodec } from '../validation-schemas/codec-utils.js';
/**
 * Codec for parsing and validating workflow configuration JSON
 */
const WorkflowConfigCodec = createJsonInputCodec(WorkflowConfigSchema);
/** Default workflow name */
const DEFAULT_WORKFLOW_NAME = '6-phase-standard';
/**
 * Get the path to the catalogue/workflows directory
 *
 * Resolves relative to this module's location in the package.
 */
function getCatalogueWorkflowsPath() {
    // Handle both ESM and CJS module resolution
    const currentFile = fileURLToPath(import.meta.url);
    const packageRoot = path.resolve(path.dirname(currentFile), '../..');
    return path.join(packageRoot, 'catalogue', 'workflows');
}
/**
 * Load workflow configuration by name from catalogue
 *
 * Loads from catalogue/workflows/{name}.json. The name should not include
 * the .json extension.
 *
 * @param name - Workflow name (e.g., "6-phase-standard", "3-phase-minimal")
 * @returns Result with LoadedWorkflow or error details
 *
 * @example
 * ```typescript
 * const result = loadWorkflowConfig("6-phase-standard");
 * if (result.ok) {
 *   const workflow = result.value;
 *   const emoji = workflow.statusMap.get("completed")?.emoji;
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function loadWorkflowConfig(name) {
    const cataloguePath = getCatalogueWorkflowsPath();
    const configPath = path.join(cataloguePath, `${name}.json`);
    return loadWorkflowFromPath(configPath, name);
}
/**
 * Load workflow configuration from a specific file path
 *
 * @param configPath - Absolute or relative path to workflow JSON file
 * @param source - Source identifier for error messages (defaults to path)
 * @returns Result with LoadedWorkflow or error details
 *
 * @example
 * ```typescript
 * const result = await loadWorkflowFromPath("/path/to/custom-workflow.json");
 * if (result.ok) {
 *   const workflow = result.value;
 * }
 * ```
 */
export async function loadWorkflowFromPath(configPath, source) {
    const errorSource = source ?? configPath;
    // Read file
    let content;
    try {
        content = await fs.readFile(configPath, 'utf-8');
    }
    catch (error) {
        // Handle file read errors
        if (error instanceof Error && 'code' in error) {
            const nodeError = error;
            if (nodeError.code === 'ENOENT') {
                return Result.err({
                    type: 'workflow-load-error',
                    source: errorSource,
                    message: `Workflow file not found: ${configPath}`,
                });
            }
            if (nodeError.code === 'EACCES') {
                return Result.err({
                    type: 'workflow-load-error',
                    source: errorSource,
                    message: `Permission denied reading workflow: ${configPath}`,
                });
            }
        }
        const message = error instanceof Error ? error.message : String(error);
        return Result.err({
            type: 'workflow-load-error',
            source: errorSource,
            message: `Failed to load workflow: ${message}`,
        });
    }
    // Parse and validate using codec (handles $schema stripping automatically)
    const parseResult = WorkflowConfigCodec.parse(content, errorSource);
    if (!parseResult.ok) {
        const error = {
            type: 'workflow-load-error',
            source: errorSource,
            message: parseResult.error.message,
        };
        if (parseResult.error.validationErrors) {
            error.validationErrors = parseResult.error.validationErrors;
        }
        return Result.err(error);
    }
    // Create LoadedWorkflow with lookup maps
    const workflow = createLoadedWorkflow(parseResult.value);
    return Result.ok(workflow);
}
/**
 * Load the default workflow (6-phase-standard)
 *
 * Returns the standard USDP 6-phase workflow from the catalogue.
 * This function throws if the default workflow cannot be loaded,
 * as this indicates a package installation issue.
 *
 * @returns LoadedWorkflow for 6-phase-standard
 * @throws Error if default workflow cannot be loaded
 *
 * @example
 * ```typescript
 * const workflow = await loadDefaultWorkflow();
 * const emoji = workflow.statusMap.get("completed")?.emoji; // "\u2705"
 * ```
 */
export async function loadDefaultWorkflow() {
    const result = await loadWorkflowConfig(DEFAULT_WORKFLOW_NAME);
    if (!result.ok) {
        throw new Error(`Failed to load default workflow (${DEFAULT_WORKFLOW_NAME}): ${result.error.message}`);
    }
    return result.value;
}
/**
 * Format workflow load error for console display
 *
 * @param error - Workflow load error
 * @returns Formatted error message for console output
 *
 * @example
 * ```typescript
 * const result = await loadWorkflowConfig("non-existent");
 * if (!result.ok) {
 *   console.error(formatWorkflowLoadError(result.error));
 *   process.exit(1);
 * }
 * ```
 */
export function formatWorkflowLoadError(error) {
    const lines = [`Workflow error: ${error.message}`, `  Source: ${error.source}`];
    if (error.validationErrors && error.validationErrors.length > 0) {
        lines.push('  Validation errors:');
        lines.push(...error.validationErrors);
    }
    return lines.join('\n');
}
/**
 * Get status emoji from loaded workflow
 *
 * Provides a convenient way to look up emoji for a status from a LoadedWorkflow.
 * Returns empty string if status not found.
 *
 * @param workflow - LoadedWorkflow instance
 * @param status - Status name to look up
 * @returns Emoji string or empty string if not found
 *
 * @example
 * ```typescript
 * const workflow = await loadDefaultWorkflow();
 * const emoji = getWorkflowStatusEmoji(workflow, "completed"); // "✅"
 * ```
 */
export function getWorkflowStatusEmoji(workflow, status) {
    if (!status)
        return '';
    const statusDef = workflow.statusMap.get(status.toLowerCase());
    return statusDef?.emoji ?? '';
}
/**
 * Get status label from loaded workflow
 *
 * Returns the human-readable label for a status, or the capitalized
 * status name if no label is defined.
 *
 * @param workflow - LoadedWorkflow instance
 * @param status - Status name to look up
 * @returns Label string
 *
 * @example
 * ```typescript
 * const workflow = await loadDefaultWorkflow();
 * const label = getWorkflowStatusLabel(workflow, "roadmap"); // "Planned"
 * ```
 */
export function getWorkflowStatusLabel(workflow, status) {
    if (!status)
        return 'Unknown';
    const statusDef = workflow.statusMap.get(status.toLowerCase());
    if (statusDef?.label) {
        return statusDef.label;
    }
    // Capitalize status name as fallback
    return status.charAt(0).toUpperCase() + status.slice(1);
}
//# sourceMappingURL=workflow-loader.js.map