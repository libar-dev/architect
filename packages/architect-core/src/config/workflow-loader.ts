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

const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = Object.freeze({
  name: 'fsm-status-standard',
  version: '1.0.0',
  statuses: [
    { name: 'roadmap', emoji: '📋' },
    { name: 'active', emoji: '🚧' },
    { name: 'completed', emoji: '✅' },
    { name: 'deferred', emoji: '⏸️' },
  ],
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
