#!/usr/bin/env node

/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-lint
 * @libar-docs-pattern LintProcessCLI
 * @libar-docs-status active
 * @libar-docs-depends-on:ProcessGuardModule
 * @libar-docs-extract-shapes ProcessGuardCLIConfig
 *
 * ## LintProcessCLI - Process Guard Linter CLI
 *
 * Validates git changes against delivery process rules.
 * Enforces protection levels, status transitions, and session scope.
 *
 * ### When to Use
 *
 * - Pre-commit hook to validate staged changes
 * - CI/CD to validate all changes against main branch
 * - Development to check specific files
 */

import { printVersionAndExit } from './version.js';
import { handleCliError } from './error-handler.js';
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
  console.log(`
lint-process - Validate changes against delivery process rules

Usage:
  lint-process [options] [files...]

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
  error    completed-protection       Cannot modify completed specs without unlock-reason
  error    invalid-status-transition  Status transition must follow PDR-005 FSM
  error    scope-creep                Cannot add deliverables to active specs
  error    session-excluded           Cannot modify files excluded from session
  warning  session-scope              File not in active session scope
  warning  deliverable-removed        Deliverable was removed (informational)

Examples:
  # Pre-commit hook (default)
  lint-process --staged

  # CI/CD pipeline
  lint-process --all --strict

  # Check specific files
  lint-process --file path/to/spec.feature

  # Debugging - show derived state
  lint-process --staged --show-state
  `);
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
    2
  );
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.version) {
    printVersionAndExit('lint-process');
  }

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  try {
    console.log(`Process Guard: validating ${config.mode} changes...`);
    console.log(`  Base directory: ${config.baseDir}`);

    // Derive process state
    const stateResult = await deriveProcessState({ baseDir: config.baseDir });
    if (!stateResult.ok) {
      throw stateResult.error;
    }
    const state = stateResult.value;

    if (config.showState) {
      console.log('\nDerived Process State:');
      console.log(`  Files: ${state.files.size}`);
      console.log(`  Active Session: ${state.activeSession?.id ?? 'none'}`);
      console.log('');

      // Show file states
      for (const [path, fileState] of state.files) {
        console.log(`  ${path}`);
        console.log(`    Status: ${fileState.status} (${fileState.protection} protection)`);
        if (fileState.deliverables.length > 0) {
          console.log(`    Deliverables: ${fileState.deliverables.length}`);
        }
      }
      console.log('');
    }

    // Detect changes based on mode
    let changesResult;
    switch (config.mode) {
      case 'staged':
        changesResult = detectStagedChanges(config.baseDir);
        break;
      case 'all':
        changesResult = detectBranchChanges(config.baseDir);
        break;
      case 'files':
        if (config.files.length === 0) {
          console.error('Error: No files specified with --files mode');
          printHelp();
          process.exit(1);
        }
        changesResult = detectFileChanges(config.baseDir, config.files);
        break;
    }

    if (!changesResult.ok) {
      throw changesResult.error;
    }
    const changes = changesResult.value;

    // Check if there are any changes
    if (!hasChanges(changes)) {
      console.log('No changes detected.');
      process.exit(0);
    }

    console.log(`  Modified files: ${changes.modifiedFiles.length}`);
    console.log(`  Added files: ${changes.addedFiles.length}`);
    console.log(`  Deleted files: ${changes.deletedFiles.length}`);
    console.log(`  Status transitions: ${changes.statusTransitions.size}`);
    console.log(`  Deliverable changes: ${changes.deliverableChanges.size}`);
    console.log('');

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
      console.log(formatJson(output));
    } else {
      console.log(formatPretty(output));
    }

    // Determine exit code
    const failed = config.strict
      ? hasErrors(output.result) || hasWarnings(output.result)
      : hasErrors(output.result);

    process.exit(failed ? 1 : 0);
  } catch (error) {
    handleCliError(error, 1);
  }
}

// Entry point
void main();
