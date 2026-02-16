/**
 * @libar-docs
 * @libar-docs-config
 * @libar-docs-pattern WorkflowLoader
 * @libar-docs-status completed
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-arch-context config
 * @libar-docs-arch-role infrastructure
 * @libar-docs-uses WorkflowConfigSchema, CodecUtils
 * @libar-docs-used-by GeneratorOrchestrator, SectionHelpers
 *
 * ## WorkflowLoader - Workflow Configuration Loading
 *
 * Provides the default 6-phase workflow as an inline constant and loads
 * custom workflow overrides from JSON files via `--workflow <path>`.
 *
 * ### When to Use
 *
 * - Use `loadDefaultWorkflow()` at pipeline startup (synchronous, infallible)
 * - Use `loadWorkflowFromPath()` for custom `--workflow <file>` overrides
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
 * Returns the standard USDP 6-phase workflow from an inline constant.
 * Synchronous and infallible — no file I/O, no error handling needed.
 *
 * DD-4: Returns LoadedWorkflow synchronously (not Promise).
 *
 * @returns LoadedWorkflow for 6-phase-standard
 *
 * @example
 * ```typescript
 * const workflow = loadDefaultWorkflow();
 * const emoji = workflow.statusMap.get("completed")?.emoji; // "\u2705"
 * ```
 */
export declare function loadDefaultWorkflow(): LoadedWorkflow;
/**
 * Format workflow load error for console display
 *
 * @param error - Workflow load error
 * @returns Formatted error message for console output
 *
 * @example
 * ```typescript
 * const result = await loadWorkflowFromPath("/path/to/custom.json");
 * if (!result.ok) {
 *   console.error(formatWorkflowLoadError(result.error));
 *   process.exit(1);
 * }
 * ```
 */
export declare function formatWorkflowLoadError(error: WorkflowLoadError): string;
export type { LoadedWorkflow, WorkflowConfig };
//# sourceMappingURL=workflow-loader.d.ts.map