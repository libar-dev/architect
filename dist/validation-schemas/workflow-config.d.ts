/**
 * @libar-docs
 * @libar-docs-validation @libar-docs-config
 * @libar-docs-pattern WorkflowConfigSchema
 * @libar-docs-status completed
 * @libar-docs-used-by WorkflowLoader, ConfigurableWorkflows
 *
 * ## WorkflowConfigSchema - Workflow Configuration Validation
 *
 * Zod schemas for validating workflow configuration files that define
 * status models, phase definitions, and artifact mappings.
 *
 * ### When to Use
 *
 * - When loading workflow configs from catalogue/workflows/
 * - When validating custom workflow configurations
 * - When creating new workflow definitions
 */
import { z } from 'zod';
/**
 * Status definition within a workflow
 *
 * Each status has a name, display emoji, and optional transition rules.
 */
export declare const WorkflowStatusSchema: z.ZodObject<{
    name: z.ZodString;
    emoji: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    transitionsTo: z.ZodOptional<z.ZodArray<z.ZodString>>;
    terminal: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;
/**
 * Artifact mapping for a workflow phase
 *
 * Defines which artifacts are read/written during each phase.
 */
export declare const PhaseArtifactsSchema: z.ZodObject<{
    reads: z.ZodOptional<z.ZodArray<z.ZodString>>;
    writes: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type PhaseArtifacts = z.infer<typeof PhaseArtifactsSchema>;
/**
 * Phase definition within a workflow
 *
 * Phases are the stages of work delivery (e.g., Inception, Construction).
 */
export declare const WorkflowPhaseSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    statusOnEntry: z.ZodOptional<z.ZodString>;
    artifacts: z.ZodOptional<z.ZodObject<{
        reads: z.ZodOptional<z.ZodArray<z.ZodString>>;
        writes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type WorkflowPhase = z.infer<typeof WorkflowPhaseSchema>;
/**
 * Complete workflow configuration
 *
 * Defines a delivery workflow with statuses, phases, and metadata.
 * Multiple workflows can be defined (e.g., 6-phase-standard, 3-phase-minimal).
 */
export declare const WorkflowConfigSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    statuses: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        emoji: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        transitionsTo: z.ZodOptional<z.ZodArray<z.ZodString>>;
        terminal: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    phases: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        statusOnEntry: z.ZodOptional<z.ZodString>;
        artifacts: z.ZodOptional<z.ZodObject<{
            reads: z.ZodOptional<z.ZodArray<z.ZodString>>;
            writes: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        order: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    defaultStatus: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        author: z.ZodOptional<z.ZodString>;
        lastUpdated: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strict>;
export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
/**
 * Loaded workflow with computed lookup maps
 *
 * Runtime representation that includes fast status/phase lookup.
 */
export interface LoadedWorkflow {
    /** Original config */
    readonly config: WorkflowConfig;
    /** Status lookup by name (case-insensitive) */
    readonly statusMap: Map<string, WorkflowStatus>;
    /** Phase lookup by name (case-insensitive) */
    readonly phaseMap: Map<string, WorkflowPhase>;
}
/**
 * Create a LoadedWorkflow from a WorkflowConfig
 *
 * Builds lookup maps for efficient status/phase resolution.
 *
 * @param config - Validated workflow configuration
 * @returns LoadedWorkflow with lookup maps
 */
export declare function createLoadedWorkflow(config: WorkflowConfig): LoadedWorkflow;
/**
 * Runtime type guard for WorkflowConfig
 *
 * @param value - Value to check
 * @returns True if value conforms to WorkflowConfigSchema
 */
export declare function isWorkflowConfig(value: unknown): value is WorkflowConfig;
//# sourceMappingURL=workflow-config.d.ts.map