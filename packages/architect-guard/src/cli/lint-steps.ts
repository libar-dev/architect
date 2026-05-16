#!/usr/bin/env node

/**
 * CLI for vitest-cucumber step/feature compatibility linting.
 *
 * Detects common vitest-cucumber traps statically — before tests run.
 * Catches mismatches between .feature files and .steps.ts files that
 * cause cryptic runtime failures.
 */

// ─── Error Convention ───────────────────────────────────────────────────
// CLI modules use throw/catch + process.exit(). Pipeline modules use Result<T,E>.
// See src/cli/error-handler.ts for the unified handler.
// ────────────────────────────────────────────────────────────────────────

import { printVersionAndExit, handleCliError, isDirectCliEntrypoint } from './shared.js';
import { runStepLint } from '../lint/steps/index.js';
import { formatPretty, formatJson, hasFailures } from '../lint/engine.js';

/**
 * CLI configuration
 */
export interface LintStepsCLIConfig {
  /** Treat warnings as errors */
  strict: boolean;
  /** Base directory for relative paths */
  baseDir: string;
  /** Explicit feature-file glob overrides */
  featureGlobs: string[];
  /** Explicit step-file glob overrides */
  stepGlobs: string[];
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
export function parseArgs(argv: string[] = process.argv.slice(2)): LintStepsCLIConfig {
  const config: LintStepsCLIConfig = {
    strict: false,
    baseDir: process.cwd(),
    featureGlobs: [],
    stepGlobs: [],
    format: 'pretty',
    help: false,
    version: false,
  };

  let parsingFlags = true;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // Handle -- separator from pnpm
    if (arg === '--') {
      parsingFlags = false;
      continue;
    }

    if (!parsingFlags) {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--version' || arg === '-v') {
      config.version = true;
    } else if (arg === '--strict') {
      config.strict = true;
    } else if (arg === '--base-dir' || arg === '-b') {
      const nextArg = argv[++i];
      if (nextArg === undefined) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.baseDir = nextArg;
    } else if (arg === '--feature-glob') {
      const nextArg = argv[++i];
      if (nextArg === undefined) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.featureGlobs.push(nextArg);
    } else if (arg === '--step-glob') {
      const nextArg = argv[++i];
      if (nextArg === undefined) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      config.stepGlobs.push(nextArg);
    } else if (arg === '--format') {
      const nextArg = argv[++i];
      if (nextArg === undefined) {
        throw new Error(`Missing value for ${arg} flag`);
      }
      if (nextArg !== 'pretty' && nextArg !== 'json') {
        throw new Error(`Invalid format: ${nextArg}. Use "pretty" or "json"`);
      }
      config.format = nextArg;
    } else if (arg?.startsWith('-') === true) {
      console.warn(`Warning: Unknown flag '${arg}' ignored`);
    }
  }

  return config;
}

/**
 * Print usage information
 */
export function printHelp(): void {
  process.stdout.write(`
architect-lint-steps - Validate vitest-cucumber feature/step compatibility

Detects common traps statically before tests run:
  - {string} function params inside ScenarioOutline (should use variables)
  - Missing And destructuring (causes StepAbleUnknowStepError)
  - Missing Rule() wrapper (causes step matching failures)
  - # in descriptions (terminates Gherkin parser context)
  - Regex step patterns (not supported)
  - {phrase} usage (not supported)
  - Duplicate And step text (causes matching failures)
  - $ in step text (causes matching issues)

Usage:
  architect-lint-steps [options]

Options:
  --strict              Treat warnings as errors (exit 1 on warnings)
  --format <type>       Output format: "pretty" (default) or "json"
  -b, --base-dir <dir>  Base directory for paths (default: cwd)
  --feature-glob <glob> Add a feature-file glob override (repeatable)
  --step-glob <glob>    Add a step-file glob override (repeatable)
  -h, --help            Show this help message
  -v, --version         Show version number

Exit Codes:
  0  No errors (warnings allowed unless --strict)
  1  Errors found (or warnings with --strict)

Scan Scope:
  Default feature files: tests/features/**/*.feature
  Default step files:    tests/steps/**/*.steps.ts
  Repo verification may widen scope with repeated --feature-glob / --step-glob flags

Rules:
  error    hash-in-description                  # at line start in description context
  error    duplicate-and-step                    Multiple And with same text in scenario
  warning  dollar-in-step-text                   $ character in step text
  error    regex-step-pattern                    Regex pattern in step definition
  error    unsupported-phrase-type               {phrase} in step string
  error    scenario-outline-function-params      Function params in ScenarioOutline
  error    missing-and-destructuring             And steps but no And destructured
  error    missing-rule-wrapper                  Rule: blocks but no Rule() wrapper
  warning  hash-in-step-text                    Mid-line # in step text silently truncates
  error    keyword-in-description               Description line starts with Given/When/Then/And/But
  warning  outline-quoted-values                 Quoted values in Outline suggest wrong pattern
  error    repeated-step-pattern                 Same step pattern registered twice in scenario

Examples:
  # Standard check
  architect-lint-steps

  # Strict mode (warnings are errors)
  architect-lint-steps --strict

  # JSON output for CI
  architect-lint-steps --format json

  # Repo-wide split-package scan
  architect-lint-steps --base-dir . --feature-glob "packages/foo/tests/features/**/*.feature" --step-glob "packages/foo/tests/steps/**/*.steps.ts"
  \n`);
}

/**
 * Main CLI function
 */
function main(): void {
  const config = parseArgs();

  if (config.version) {
    printVersionAndExit('architect-lint-steps');
  }

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  try {
    process.stdout.write('Step Lint: checking vitest-cucumber compatibility...\n');

    const summary = runStepLint({
      baseDir: config.baseDir,
      ...(config.featureGlobs.length > 0 ? { featureGlobs: config.featureGlobs } : {}),
      ...(config.stepGlobs.length > 0 ? { stepGlobs: config.stepGlobs } : {}),
    });

    // Format and output results
    if (config.format === 'json') {
      const result = formatJson(summary);
      if (result.ok) {
        process.stdout.write(`${result.value}\n`);
      } else {
        console.error(`Output formatting error: ${result.error.message}`);
        process.exit(1);
      }
    } else {
      process.stdout.write(`${formatPretty(summary)}\n`);
    }

    // Determine exit code
    const failed = hasFailures(summary, config.strict);
    process.exit(failed ? 1 : 0);
  } catch (error) {
    handleCliError(error, 1);
  }
}

// Entry point
export function runLintStepsCli(argv: string[] = process.argv.slice(2)): void {
  process.argv = [process.argv[0] ?? 'node', process.argv[1] ?? 'architect-lint-steps', ...argv];
  main();
}

if (isDirectCliEntrypoint(import.meta.url)) {
  main();
}
