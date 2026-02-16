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
import * as fs from 'fs/promises';
import { Result } from '../types/result.js';
import { WorkflowConfigSchema, createLoadedWorkflow, } from '../validation-schemas/workflow-config.js';
import { createJsonInputCodec } from '../validation-schemas/codec-utils.js';
/**
 * Codec for parsing and validating workflow configuration JSON
 */
const WorkflowConfigCodec = createJsonInputCodec(WorkflowConfigSchema);
/**
 * Default workflow configuration (6-phase USDP standard)
 *
 * Inline constant using the 4 canonical statuses from ADR-001.
 * Replaces the deleted catalogue/workflows/6-phase-standard.json.
 *
 * DD-1: Inline constant in workflow-loader.ts, not preset integration.
 * DD-2: Satisfies existing WorkflowConfig type — no new types needed.
 */
const DEFAULT_WORKFLOW_CONFIG = {
    name: '6-phase-standard',
    version: '1.0.0',
    statuses: [
        { name: 'roadmap', emoji: '\u{1F4CB}' },
        { name: 'active', emoji: '\u{1F6A7}' },
        { name: 'completed', emoji: '\u2705' },
        { name: 'deferred', emoji: '\u23F8\uFE0F' },
    ],
    phases: [
        { name: 'Inception', order: 1 },
        { name: 'Elaboration', order: 2 },
        { name: 'Session', order: 3 },
        { name: 'Construction', order: 4 },
        { name: 'Validation', order: 5 },
        { name: 'Retrospective', order: 6 },
    ],
    defaultStatus: 'roadmap',
};
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
export function loadDefaultWorkflow() {
    return createLoadedWorkflow(DEFAULT_WORKFLOW_CONFIG);
}
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
export function formatWorkflowLoadError(error) {
    const lines = [`Workflow error: ${error.message}`, `  Source: ${error.source}`];
    if (error.validationErrors && error.validationErrors.length > 0) {
        lines.push('  Validation errors:');
        lines.push(...error.validationErrors);
    }
    return lines.join('\n');
}
//# sourceMappingURL=workflow-loader.js.map