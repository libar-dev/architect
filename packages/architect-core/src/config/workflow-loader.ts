import * as fs from 'fs/promises';

import { Result } from '../types/result.js';
import {
  WorkflowConfigSchema,
  createLoadedWorkflow,
  type LoadedWorkflow,
  type WorkflowConfig,
} from '../validation-schemas/workflow-config.js';
import { createJsonInputCodec } from '../validation-schemas/codec-utils.js';

const WorkflowConfigCodec = createJsonInputCodec(WorkflowConfigSchema);

export interface WorkflowLoadError {
  type: 'workflow-load-error';
  source: string;
  message: string;
  validationErrors?: string[];
}

/**
 * Canonical USDP phases per ADR-001 Rule 8.
 *
 * Edit the ADR-001 Rule 8 markdown table and this constant together. The
 * canonical-values-sync test asserts equality between both surfaces.
 *
 * NOTE: This is the *workflow* phase abstraction (Inception → Retrospective,
 * ordinals 1-6). It is distinct from the `@architect-phase` annotation tag,
 * which uses arbitrary roadmap phase numbers (1-100+) and is NOT validated
 * against this list. See SESSION-REPORTS-AND-LEARNINGS.md (Session 2, D2-A)
 * for the semantic-mismatch finding deferred to the holistic review.
 */
export const CANONICAL_PHASES = [
  { ordinal: 1, name: 'Inception', purpose: 'Problem framing, scope definition' },
  { ordinal: 2, name: 'Elaboration', purpose: 'Design decisions, architecture exploration' },
  { ordinal: 3, name: 'Session', purpose: 'Planning and design session work' },
  { ordinal: 4, name: 'Construction', purpose: 'Implementation, testing, integration' },
  { ordinal: 5, name: 'Validation', purpose: 'Verification, acceptance criteria confirmation' },
  { ordinal: 6, name: 'Retrospective', purpose: 'Review, lessons learned, documentation' },
] as const;

export const CANONICAL_PHASE_NAMES = CANONICAL_PHASES.map((p) => p.name);
export const CANONICAL_PHASE_ORDINALS = CANONICAL_PHASES.map((p) => p.ordinal);

const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = Object.freeze({
  name: '6-phase-standard',
  version: '1.0.0',
  statuses: [
    { name: 'roadmap', emoji: '📋' },
    { name: 'active', emoji: '🚧' },
    { name: 'completed', emoji: '✅' },
    { name: 'deferred', emoji: '⏸️' },
  ],
  phases: CANONICAL_PHASES.map((p) => ({ name: p.name, order: p.ordinal })),
  defaultStatus: 'roadmap',
});

const DEFAULT_LOADED_WORKFLOW: LoadedWorkflow = createLoadedWorkflow(DEFAULT_WORKFLOW_CONFIG);

export async function loadWorkflowFromPath(
  configPath: string,
  source?: string,
): Promise<Result<LoadedWorkflow, WorkflowLoadError>> {
  const errorSource = source ?? configPath;

  let content: string;
  try {
    content = await fs.readFile(configPath, 'utf-8');
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const nodeError = error as NodeJS.ErrnoException;
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

  const parseResult = WorkflowConfigCodec.parse(content, errorSource);

  if (!parseResult.ok) {
    const error: WorkflowLoadError = {
      type: 'workflow-load-error',
      source: errorSource,
      message: parseResult.error.message,
    };
    if (parseResult.error.validationErrors) {
      error.validationErrors = parseResult.error.validationErrors;
    }
    return Result.err(error);
  }

  const workflow = createLoadedWorkflow(parseResult.value);
  return Result.ok(workflow);
}

export function loadDefaultWorkflow(): LoadedWorkflow {
  return DEFAULT_LOADED_WORKFLOW;
}

export function formatWorkflowLoadError(error: WorkflowLoadError): string {
  const lines = [`Workflow error: ${error.message}`, `  Source: ${error.source}`];

  if (error.validationErrors && error.validationErrors.length > 0) {
    lines.push('  Validation errors:');
    lines.push(...error.validationErrors);
  }

  return lines.join('\n');
}

export type { LoadedWorkflow, WorkflowConfig };
