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
import { Result } from '../types/result.js';
import { type LoadedWorkflow, type WorkflowConfig } from '../validation-schemas/workflow-config.js';
/**
 * Workflow load error
 *
 * Describes why workflow loading failed, with detailed validation errors
 * if the failure was due to invalid schema.
 */
export interface WorkflowLoadError {
    /** Error type identifier */
    type: 'workflow-load-error';
    /** Path or name of the workflow that failed to load */
    source: string;
    /** Human-readable error message */
    message: string;
    /** Detailed Zod validation errors if schema validation failed */
    validationErrors?: string[];
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
export declare function loadWorkflowConfig(name: string): Promise<Result<LoadedWorkflow, WorkflowLoadError>>;
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
export declare function loadWorkflowFromPath(configPath: string, source?: string): Promise<Result<LoadedWorkflow, WorkflowLoadError>>;
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
export declare function loadDefaultWorkflow(): Promise<LoadedWorkflow>;
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
export declare function formatWorkflowLoadError(error: WorkflowLoadError): string;
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
export declare function getWorkflowStatusEmoji(workflow: LoadedWorkflow, status: string | undefined): string;
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
export declare function getWorkflowStatusLabel(workflow: LoadedWorkflow, status: string | undefined): string;
export type { LoadedWorkflow, WorkflowConfig };
//# sourceMappingURL=workflow-loader.d.ts.map