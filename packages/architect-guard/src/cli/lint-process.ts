#!/usr/bin/env node

/**
 * @architect
 * @architect-pattern LintProcessCLI
 * @architect-cli
 * @architect-lint
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:process-guard
 * @architect-uses ProcessGuardLinter
 *
 * ## LintProcessCLI - Process Guard Linter CLI
 *
 * Validates git changes against workflow rules.
 * Enforces protection levels, status transitions, and session scope.
 *
 * ### When to Use
 *
 * - Pre-commit hook to validate staged changes
 * - CI/CD to validate all changes against main branch
 * - Development to check specific files
 */

// ─── Error Convention ───────────────────────────────────────────────────
// CLI modules use throw/catch + process.exit(). Pipeline modules use Result<T,E>.
// See src/cli/error-handler.ts for the unified handler.
// ────────────────────────────────────────────────────────────────────────

import {
  buildPatternGraph,
  exitWithProcessError,
  formatConfigError,
  loadProjectConfig,
} from '@libar-dev/architect-core';
import { printVersionAndExit, isDirectCliEntrypoint } from './shared.js';
import {
  deriveProcessState,
  detectStagedChanges,
  detectBranchChanges,
  detectFileChanges,
  validateChanges,
  hasChanges,
  hasErrors,
  hasWarnings,
  summarizeResult,
  type ValidationMode,
} from '../lint/process-guard/index.js';

/**
 * CLI configuration
 */
export interface ProcessGuardCLIConfig {
  /** Validation mode */
  mode: ValidationMode;
  /** Specific files to validate (when mode is 'files') */
  files: string[];
  /** Treat warnings as errors */
  strict: boolean;
  /** Ignore session scope rules */
  ignoreSession: boolean;
  /** Show derived process state (debugging) */
  showState: boolean;
  /** Base directory for relative paths */
  baseDir: string;
  /** Output format */
  format: 'pretty' | 'json';
  /** Show help */
  help: boolean;
  /** Show version */
  version: boolean;
}

/**
 * Parse command line arguments
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): ProcessGuardCLIConfig {
  const config: ProcessGuardCLIConfig = {
    mode: 'staged',
    files: [],
    strict: false,
    ignoreSession: false,
    showState: false,
    baseDir: process.cwd(),
    format: 'pretty',
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--staged') {
      config.mode = 'staged';
    } else if (arg === '--all') {
      config.mode = 'all';
    } else if (arg === '--files') {
      config.mode = 'files';
    } else if (arg === '--file' || arg === '-f') {
      const nextArg = argv[++i];
      if (nextArg === undefined) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.files.push(nextArg);
      config.mode = 'files';
    } else if (arg === '--strict') {
      config.strict = true;
    } else if (arg === '--ignore-session') {
      config.ignoreSession = true;
    } else if (arg === '--show-state') {
      config.showState = true;
    } else if (arg === '--base-dir' || arg === '-b') {
      const nextArg = argv[++i];
      if (nextArg === undefined) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.baseDir = nextArg;
    } else if (arg === '--format') {
      const nextArg = argv[++i];
      if (nextArg === undefined) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      if (nextArg !== 'pretty' && nextArg !== 'json') {
        throw new Error(`Invalid format: ${nextArg}. Use "pretty" or "json"`);
      }
      config.format = nextArg;
    } else if (arg === '--version' || arg === '-v') {
      config.version = true;
    } else if (arg?.startsWith('-') === true) {
      console.warn(`Warning: Unknown flag '${arg}' ignored`);
    } else if (arg !== undefined) {
      // Positional argument treated as file
      config.files.push(arg);
      config.mode = 'files';
    }
  }

  return config;
}

/**
 * Print usage information
 */
export function printHelp(): void {
  process.stdout.write(`
architect-guard - Validate changes against workflow rules

Usage:
  architect-guard [options] [files...]

Modes:
  --staged            Validate staged changes (default, for pre-commit)
  --all               Validate all changes compared to main branch
  --files             Validate specific files (use with --file or positional args)

Options:
  -f, --file <path>   File to validate (repeatable, implies --files mode)
  -b, --base-dir <dir>  Base directory for paths (default: cwd)
  --strict            Treat warnings as errors (exit 1 on warnings)
  --ignore-session    Ignore session scope rules
  --show-state        Show derived process state (debugging)
  --format <type>     Output format: "pretty" (default) or "json"
  -h, --help          Show this help message
  -v, --version       Show version number

Exit Codes:
  0  No errors (warnings allowed unless --strict)
  1  Errors found (or warnings with --strict)

Rules Checked:
  warning  completed-protection       Modifying a completed spec (advisory; unlock-reason suppresses)
  error    invalid-status-transition  Status transition must follow the FSM
  warning  scope-creep                Adding pending scope to an active spec (advisory; unlock-reason suppresses)
  error    session-excluded           Cannot modify files excluded from session
  warning  session-scope              File not in active session scope
  warning  deliverable-removed        Deliverable was removed (advisory; unlock-reason suppresses)

Examples:
  # Pre-commit hook (default)
  architect-guard --staged

  # CI/CD pipeline
  architect-guard --all --strict

  # Check specific files
  architect-guard --file path/to/spec.feature

  # Debugging - show derived state
  architect-guard --staged --show-state
  \n`);
}

/**
 * Format validation result for pretty output
 */
function formatPretty(output: ReturnType<typeof validateChanges>): string {
  const { result } = output;
  const lines: string[] = [];

  lines.push(summarizeResult(result));
  lines.push('');

  if (result.violations.length > 0) {
    lines.push('Errors:');
    for (const v of result.violations) {
      lines.push(`  [${v.rule}] ${v.file}`);
      lines.push(`    ${v.message}`);
      if (v.suggestion !== undefined) {
        lines.push(`    Fix: ${v.suggestion}`);
      }
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of result.warnings) {
      lines.push(`  [${w.rule}] ${w.file}`);
      lines.push(`    ${w.message}`);
      if (w.suggestion !== undefined) {
        lines.push(`    Fix: ${w.suggestion}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format validation result for JSON output
 */
function formatJson(output: ReturnType<typeof validateChanges>): string {
  const { result, events } = output;
  return JSON.stringify(
    {
      valid: result.valid,
      violations: result.violations,
      warnings: result.warnings,
      events,
    },
    null,
    2,
  );
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  try {
    const config = parseArgs();

    if (config.version) {
      printVersionAndExit('architect-guard');
    }

    if (config.help) {
      printHelp();
      process.exit(0);
    }

    process.stdout.write(`Process Guard: validating ${config.mode} changes...\n`);
    process.stdout.write(`  Base directory: ${config.baseDir}\n`);

    const configResult = await loadProjectConfig(config.baseDir);
    if (!configResult.ok) {
      throw new Error(formatConfigError(configResult.error));
    }

    const projectConfig = configResult.value;
    const featurePatterns = projectConfig.project.sources.features;
    const exclude = projectConfig.project.sources.exclude;
    const pipelineResult = await buildPatternGraph({
      input: projectConfig.project.sources.typescript,
      features: featurePatterns,
      baseDir: config.baseDir,
      mergeConflictStrategy: 'concatenate',
      ...(exclude.length > 0 ? { exclude } : {}),
    });
    if (!pipelineResult.ok) {
      throw new Error(
        `Pipeline error [${pipelineResult.error.step}]: ${pipelineResult.error.message}`,
      );
    }

    // Derive process state
    const stateResult = await deriveProcessState(pipelineResult.value.graph, {
      baseDir: config.baseDir,
    });
    if (!stateResult.ok) {
      throw stateResult.error;
    }
    const state = stateResult.value;

    if (config.showState) {
      process.stdout.write('\nDerived Process State:\n');
      process.stdout.write(`  Files: ${String(state.files.size)}\n`);
      process.stdout.write(`  Active Session: ${state.activeSession?.id ?? 'none'}\n`);
      process.stdout.write('\n');

      // Show file states
      for (const [path, fileState] of state.files) {
        process.stdout.write(`  ${path}\n`);
        process.stdout.write(
          `    Status: ${fileState.status} (${fileState.protection} protection)\n`,
        );
        if (fileState.deliverables.length > 0) {
          process.stdout.write(`    Deliverables: ${String(fileState.deliverables.length)}\n`);
        }
      }
      process.stdout.write('\n');
    }

    // Detect changes based on mode
    let changesResult: ReturnType<typeof detectStagedChanges>;
    switch (config.mode) {
      case 'staged':
        changesResult = detectStagedChanges(config.baseDir, {
          registry: projectConfig.instance.registry,
          featurePatterns,
          exclude,
        });
        break;
      case 'all':
        changesResult = detectBranchChanges(config.baseDir, 'main', {
          registry: projectConfig.instance.registry,
          featurePatterns,
          exclude,
        });
        break;
      case 'files':
        if (config.files.length === 0) {
          console.error('Error: No files specified with --files mode');
          printHelp();
          process.exit(1);
        }
        changesResult = detectFileChanges(config.baseDir, config.files, {
          registry: projectConfig.instance.registry,
          featurePatterns,
          exclude,
        });
        break;
    }

    if (!changesResult.ok) {
      throw changesResult.error;
    }
    const changes = changesResult.value;

    // Check if there are any changes
    if (!hasChanges(changes)) {
      process.stdout.write('No changes detected.\n');
      process.exit(0);
    }

    process.stdout.write(`  Modified files: ${String(changes.modifiedFiles.length)}\n`);
    process.stdout.write(`  Added files: ${String(changes.addedFiles.length)}\n`);
    process.stdout.write(`  Deleted files: ${String(changes.deletedFiles.length)}\n`);
    process.stdout.write(`  Status transitions: ${String(changes.statusTransitions.size)}\n`);
    process.stdout.write(`  Deliverable changes: ${String(changes.deliverableChanges.size)}\n`);
    process.stdout.write('\n');

    // Validate changes
    const output = validateChanges({
      state,
      changes,
      options: {
        strict: config.strict,
        ignoreSession: config.ignoreSession,
      },
    });

    // Format and output results
    if (config.format === 'json') {
      process.stdout.write(`${formatJson(output)}\n`);
    } else {
      process.stdout.write(`${formatPretty(output)}\n`);
    }

    // Determine exit code
    const failed = config.strict
      ? hasErrors(output.result) || hasWarnings(output.result)
      : hasErrors(output.result);

    process.exit(failed ? 1 : 0);
  } catch (error) {
    exitWithProcessError(error, 1);
  }
}

// Entry point
export async function runLintProcessCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  process.argv = [process.argv[0] ?? 'node', process.argv[1] ?? 'architect-guard', ...argv];
  await main();
}

if (isDirectCliEntrypoint(import.meta.url)) {
  void main();
}
