import { z } from 'zod';

export const WorkflowStatusSchema = z.strictObject({
  name: z.string().min(1),
  emoji: z.string().min(1),
  label: z.string().optional(),
  description: z.string().optional(),
  transitionsTo: z.array(z.string()).optional(),
  terminal: z.boolean().optional(),
});

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const PhaseArtifactsSchema = z.strictObject({
  reads: z.array(z.string()).optional(),
  writes: z.array(z.string()).optional(),
});

export type PhaseArtifacts = z.infer<typeof PhaseArtifactsSchema>;

export const WorkflowPhaseSchema = z.strictObject({
  name: z.string().min(1),
  description: z.string().optional(),
  statusOnEntry: z.string().optional(),
  artifacts: PhaseArtifactsSchema.optional(),
  order: z.number().int().nonnegative().optional(),
});

export type WorkflowPhase = z.infer<typeof WorkflowPhaseSchema>;

export const WorkflowConfigSchema = z.strictObject({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format'),
  description: z.string().optional(),
  statuses: z.array(WorkflowStatusSchema).min(1),
  phases: z.array(WorkflowPhaseSchema).min(1),
  defaultStatus: z.string().optional(),
  metadata: z
    .object({
      author: z.string().optional(),
      lastUpdated: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;

export interface LoadedWorkflow {
  readonly config: WorkflowConfig;
  readonly statusMap: Map<string, WorkflowStatus>;
  readonly phaseMap: Map<string, WorkflowPhase>;
}

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

export function isWorkflowConfig(value: unknown): value is WorkflowConfig {
  return WorkflowConfigSchema.safeParse(value).success;
}
