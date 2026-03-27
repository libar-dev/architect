/**
 * @architect
 * @architect-cli
 * @architect-pattern ReplMode
 * @architect-status active
 * @architect-implements DataAPICLIErgonomics
 * @architect-arch-role service
 * @architect-arch-context cli
 * @architect-arch-layer application
 * @architect-uses PipelineFactory, ProcessStateAPI
 *
 * ## REPL Mode - Interactive Multi-Query Pipeline Session
 *
 * Loads the pipeline once and accepts multiple queries on stdin.
 * Eliminates per-query pipeline overhead for design sessions with 10-20
 * exploratory queries in sequence.
 *
 * ### Special Commands
 *
 * - `quit` / `exit` — exit the REPL
 * - `reload` — rebuild the pipeline from fresh sources
 * - `help` — list available subcommands
 */

// ─── Error Convention ───────────────────────────────────────────────────
// CLI modules use throw/catch + process.exit(). Pipeline modules use Result<T,E>.
// See src/cli/error-handler.ts for the unified handler.
// ────────────────────────────────────────────────────────────────────────

import * as readline from 'node:readline/promises';
import * as path from 'path';
import {
  buildMasterDataset,
  type PipelineResult,
  type RuntimeMasterDataset,
  type ValidationSummary,
} from '../generators/pipeline/index.js';
import { createProcessStateAPI } from '../api/process-state.js';
import type { ProcessStateAPI } from '../api/process-state.js';
import { QueryApiError, createSuccess, createError } from '../api/types.js';
import { formatOutput } from './output-pipeline.js';
import {
  assembleContext,
  buildDepTree,
  buildOverview,
  isValidSessionType,
  type SessionType,
} from '../api/context-assembler.js';
import { formatContextBundle, formatDepTree, formatOverview } from '../api/context-formatter.js';

// =============================================================================
// Types
// =============================================================================

export interface ReplOptions {
  readonly input: readonly string[];
  readonly features: readonly string[];
  readonly baseDir: string;
  readonly workflowPath: string | null;
}

interface ReplState {
  api: ProcessStateAPI;
  dataset: RuntimeMasterDataset;
  validation: ValidationSummary;
}

// =============================================================================
// Pipeline Loading
// =============================================================================

async function loadPipeline(opts: ReplOptions): Promise<PipelineResult> {
  const result = await buildMasterDataset({
    input: opts.input,
    features: opts.features,
    baseDir: opts.baseDir,
    mergeConflictStrategy: 'fatal',
    ...(opts.workflowPath !== null ? { workflowPath: opts.workflowPath } : {}),
  });
  if (!result.ok) {
    throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
  }
  return result.value;
}

// =============================================================================
// Command Dispatch
// =============================================================================

function dispatchCommand(line: string, state: ReplState, opts: ReplOptions): string {
  const parts = line.trim().split(/\s+/);
  const subcommand = parts[0];
  const subArgs = parts.slice(1);

  if (subcommand === undefined || subcommand === '') {
    return '';
  }

  switch (subcommand) {
    case 'status': {
      const data = {
        counts: state.api.getStatusCounts(),
        completionPercentage: state.api.getCompletionPercentage(),
      };
      return formatOutput(createSuccess(data, state.dataset.counts.total), 'json');
    }

    case 'overview': {
      const bundle = buildOverview(state.dataset);
      return formatOverview(bundle);
    }

    case 'context': {
      const patternArg = subArgs[0];
      if (patternArg === undefined) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Usage: context <pattern> [--session <type>]');
      }
      let sessionType: SessionType = 'planning';
      const sessionIdx = subArgs.indexOf('--session');
      const sessionVal = sessionIdx !== -1 ? subArgs[sessionIdx + 1] : undefined;
      if (sessionVal !== undefined && isValidSessionType(sessionVal)) {
        sessionType = sessionVal;
      }
      const baseDir = path.resolve(opts.baseDir);
      const bundle = assembleContext(state.dataset, state.api, {
        patterns: [patternArg],
        sessionType,
        baseDir,
      });
      return formatContextBundle(bundle);
    }

    case 'dep-tree': {
      const patternArg = subArgs[0];
      if (patternArg === undefined) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Usage: dep-tree <pattern> [--depth N]');
      }
      let depth = 3;
      const depthIdx = subArgs.indexOf('--depth');
      const depthVal = depthIdx !== -1 ? subArgs[depthIdx + 1] : undefined;
      if (depthVal !== undefined) {
        const parsed = parseInt(depthVal, 10);
        if (!isNaN(parsed) && parsed > 0) {
          depth = parsed;
        }
      }
      const tree = buildDepTree(state.dataset, {
        pattern: patternArg,
        maxDepth: depth,
        includeImplementationDeps: false,
      });
      return formatDepTree(tree);
    }

    case 'pattern': {
      const patternArg = subArgs[0];
      if (patternArg === undefined) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Usage: pattern <name>');
      }
      const data = state.api.getPattern(patternArg);
      return formatOutput(createSuccess(data, state.dataset.counts.total), 'json');
    }

    case 'list': {
      const data = state.api.getPatternsByNormalizedStatus('planned');
      return formatOutput(
        createSuccess(
          data.map((p) => p.patternName ?? 'unknown'),
          state.dataset.counts.total
        ),
        'json'
      );
    }

    default:
      return `Unknown REPL command: ${subcommand}\nAvailable: status, overview, context, dep-tree, pattern, list, reload, help, quit`;
  }
}

// =============================================================================
// REPL Entry Point
// =============================================================================

/**
 * Start the interactive REPL. Loads the pipeline once and accepts queries on stdin.
 *
 * When stdin is a pipe (non-TTY), all lines are buffered and processed sequentially.
 * The `reload` command is async, so we collect all lines upfront when piped to
 * avoid losing buffered input during async operations.
 */
export async function startRepl(opts: ReplOptions): Promise<void> {
  console.error('Loading pipeline...');
  const pipeline = await loadPipeline(opts);
  const state: ReplState = {
    api: createProcessStateAPI(pipeline.dataset),
    dataset: pipeline.dataset,
    validation: pipeline.validation,
  };
  console.error(
    `Pipeline loaded: ${state.dataset.counts.total} patterns ` +
      `(${state.dataset.counts.completed} completed, ` +
      `${state.dataset.counts.active} active, ` +
      `${state.dataset.counts.planned} planned)`
  );

  if (process.stdin.isTTY) {
    await runInteractiveRepl(state, opts);
  } else {
    await runPipedRepl(state, opts);
  }
}

/**
 * Interactive REPL with prompts (TTY mode).
 */
async function runInteractiveRepl(state: ReplState, opts: ReplOptions): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    prompt: 'architect> ',
  });

  rl.prompt();

  for await (const line of rl) {
    const shouldExit = await processLine(line.trim(), state, opts);
    if (shouldExit) break;
    rl.prompt();
  }

  rl.close();
}

/**
 * Piped REPL (non-TTY mode). Collects all lines first, then processes sequentially.
 * This prevents losing buffered lines during async operations like reload.
 */
async function runPipedRepl(state: ReplState, opts: ReplOptions): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];

  for await (const line of rl) {
    lines.push(line.trim());
  }

  rl.close();

  for (const trimmed of lines) {
    const shouldExit = await processLine(trimmed, state, opts);
    if (shouldExit) break;
  }
}

/**
 * Process a single REPL input line. Returns true if the REPL should exit.
 */
async function processLine(trimmed: string, state: ReplState, opts: ReplOptions): Promise<boolean> {
  if (trimmed === 'quit' || trimmed === 'exit') {
    return true;
  }

  if (trimmed === 'reload') {
    console.error('Reloading pipeline...');
    try {
      const fresh = await loadPipeline(opts);
      state.api = createProcessStateAPI(fresh.dataset);
      state.dataset = fresh.dataset;
      state.validation = fresh.validation;
      console.error(`Reloaded: ${state.dataset.counts.total} patterns`);
    } catch (err) {
      console.error(`Reload failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    return false;
  }

  if (trimmed === 'help') {
    console.log('Available commands: status, overview, context, dep-tree, pattern, list');
    console.log('Special: reload, help, quit/exit');
    return false;
  }

  if (trimmed === '') {
    return false;
  }

  try {
    const output = dispatchCommand(trimmed, state, opts);
    if (output !== '') {
      console.log(output);
    }
  } catch (err) {
    if (err instanceof QueryApiError) {
      console.log(formatOutput(createError(err.code, err.message), 'json'));
    } else {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return false;
}
