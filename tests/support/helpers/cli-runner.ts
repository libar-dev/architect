/**
 * CLI Runner Helper for BDD Tests
 *
 * Provides utilities for executing CLI commands via subprocess
 * and capturing their output for assertion in tests.
 *
 * @libar-docs
 */

import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of a CLI execution.
 */
export interface CLIResult {
  /** Exit code (0 = success, non-zero = failure) */
  exitCode: number;
  /** Captured stdout output */
  stdout: string;
  /** Captured stderr output */
  stderr: string;
}

/**
 * Options for CLI execution.
 */
export interface CLIOptions {
  /** Working directory for the CLI command */
  cwd?: string;
  /** Environment variables to set */
  env?: NodeJS.ProcessEnv;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Data to pipe to stdin (closes stdin after writing) */
  stdin?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT = 30000;

/**
 * Path to the project root directory.
 * CLI sources are located relative to this.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// =============================================================================
// CLI Runner
// =============================================================================

/**
 * Get the path to a CLI source file.
 *
 * @param cliName - Name of the CLI (e.g., 'generate-docs', 'lint-patterns')
 * @returns Absolute path to the CLI source file
 */
export function getCLIPath(cliName: string): string {
  return path.join(PROJECT_ROOT, 'src', 'cli', `${cliName}.ts`);
}

/**
 * Run a CLI command via subprocess.
 *
 * Uses `tsx` to execute TypeScript sources directly, consistent with
 * the project's package.json scripts.
 *
 * @param cliName - Name of the CLI to run (e.g., 'generate-docs')
 * @param args - Command line arguments to pass
 * @param options - Execution options (cwd, env, timeout)
 * @returns Promise resolving to CLI execution result
 *
 * @example
 * ```typescript
 * const result = await runCLI('generate-docs', ['-g', 'patterns', '-o', 'docs'], {
 *   cwd: '/path/to/project'
 * });
 * expect(result.exitCode).toBe(0);
 * expect(result.stdout).toContain('Generated');
 * ```
 */
export async function runCLI(
  cliName: string,
  args: string[],
  options: CLIOptions = {}
): Promise<CLIResult> {
  const {
    cwd = process.cwd(),
    env = process.env,
    timeout = DEFAULT_TIMEOUT,
    stdin: stdinData,
  } = options;

  const cliPath = getCLIPath(cliName);

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', cliPath, ...args], {
      cwd,
      env: { ...env, FORCE_COLOR: '0' }, // Disable color codes for easier assertion
      shell: true,
    });

    // Pipe stdin data if provided, then close stdin
    if (stdinData !== undefined) {
      child.stdin.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code !== 'EPIPE') {
          reject(error);
        }
      });
      child.stdin.end(stdinData);
    }

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeout);

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      if (timedOut) {
        resolve({
          exitCode: 124, // Standard timeout exit code
          stdout,
          stderr: stderr + `\nProcess timed out after ${timeout}ms`,
        });
        return;
      }

      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Parse a CLI command string into command name and arguments.
 *
 * @param commandString - Full command string (e.g., "generate-docs -g patterns -o docs")
 * @returns Parsed command name and arguments
 *
 * @example
 * ```typescript
 * const { command, args } = parseCommand('lint-patterns -i "src/test.ts" --strict');
 * // command = 'lint-patterns'
 * // args = ['-i', 'src/test.ts', '--strict']
 * ```
 */
export function parseCommand(commandString: string): { command: string; args: string[] } {
  // Handle quoted strings properly
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (const char of commandString) {
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  const [command, ...args] = tokens;
  return { command: command || '', args };
}

/**
 * Run a CLI from a full command string.
 *
 * Convenience wrapper that parses a command string and executes it.
 *
 * @param commandString - Full command string
 * @param options - Execution options
 * @returns Promise resolving to CLI execution result
 *
 * @example
 * ```typescript
 * const result = await runCommand('generate-docs -g patterns -o docs', {
 *   cwd: state.tempDir
 * });
 * ```
 */
export async function runCommand(
  commandString: string,
  options: CLIOptions = {}
): Promise<CLIResult> {
  const { command, args } = parseCommand(commandString);
  return runCLI(command, args, options);
}
