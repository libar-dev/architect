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
 * - When validating workflow configuration (inline defaults or custom files)
 * - When validating custom workflow configurations
 * - When creating new workflow definitions
 */

import { z } from 'zod';

/**
 * Status definition within a workflow
 *
 * Each status has a name, display emoji, and optional transition rules.
 */
export const WorkflowStatusSchema = z
  .object({
    /** Status identifier (e.g., "roadmap", "active", "completed") */
    name: z.string().min(1),

    /** Display emoji for this status */
    emoji: z.string().min(1),

    /** Human-readable label (optional, defaults to capitalized name) */
    label: z.string().optional(),

    /** Human-readable description of what this status means */
    description: z.string().optional(),

    /** Status IDs this status can transition to (for validation) */
    transitionsTo: z.array(z.string()).optional(),

    /** Whether this is a terminal status (no further transitions) */
    terminal: z.boolean().optional(),
  })
  .strict();

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

/**
 * Artifact mapping for a workflow phase
 *
 * Defines which artifacts are read/written during each phase.
 */
export const PhaseArtifactsSchema = z
  .object({
    /** Artifacts read during this phase */
    reads: z.array(z.string()).optional(),

    /** Artifacts produced during this phase */
    writes: z.array(z.string()).optional(),
  })
  .strict();

export type PhaseArtifacts = z.infer<typeof PhaseArtifactsSchema>;

/**
 * Phase definition within a workflow
 *
 * Phases are the stages of work delivery (e.g., Inception, Construction).
 */
export const WorkflowPhaseSchema = z
  .object({
    /** Phase name (e.g., "Inception", "Construction") */
    name: z.string().min(1),

    /** Human-readable description of this phase */
    description: z.string().optional(),

    /** Status assigned when entering this phase */
    statusOnEntry: z.string().optional(),

    /** Artifact read/write mappings for this phase */
    artifacts: PhaseArtifactsSchema.optional(),

    /** Order index for sorting phases (lower = earlier) */
    order: z.number().int().nonnegative().optional(),
  })
  .strict();

export type WorkflowPhase = z.infer<typeof WorkflowPhaseSchema>;

/**
 * Complete workflow configuration
 *
 * Defines a delivery workflow with statuses, phases, and metadata.
 * Multiple workflows can be defined (e.g., 6-phase-standard, 3-phase-minimal).
 */
export const WorkflowConfigSchema = z
  .object({
    /** Workflow name (e.g., "6-phase-standard") */
    name: z.string().min(1),

    /** Semantic version for config compatibility */
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format'),

    /** Human-readable description */
    description: z.string().optional(),

    /** Status definitions for this workflow */
    statuses: z.array(WorkflowStatusSchema).min(1),

    /** Phase definitions for this workflow */
    phases: z.array(WorkflowPhaseSchema).min(1),

    /** Default status for new items */
    defaultStatus: z.string().optional(),

    /** Metadata for this workflow config */
    metadata: z
      .object({
        /** Author or team who created this workflow */
        author: z.string().optional(),

        /** When this config was last updated */
        lastUpdated: z.string().optional(),

        /** Tags for categorization */
        tags: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .strict();

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
export function createLoadedWorkflow(config: WorkflowConfig): LoadedWorkflow {
  const statusMap = new Map<string, WorkflowStatus>();
  for (const status of config.statuses) {
    statusMap.set(status.name.toLowerCase(), status);
  }

  const phaseMap = new Map<string, WorkflowPhase>();
  for (const phase of config.phases) {
    phaseMap.set(phase.name.toLowerCase(), phase);
  }

  return {
    config,
    statusMap,
    phaseMap,
  };
}

/**
 * Runtime type guard for WorkflowConfig
 *
 * @param value - Value to check
 * @returns True if value conforms to WorkflowConfigSchema
 */
export function isWorkflowConfig(value: unknown): value is WorkflowConfig {
  return WorkflowConfigSchema.safeParse(value).success;
}
