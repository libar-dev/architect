/**
 * @libar-docs
 * @libar-docs-pattern GitHelpers
 * @libar-docs-status active
 * @libar-docs-arch-role utility
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-used-by GitBranchDiff, DetectChanges
 *
 * ## GitHelpers - Shared Git Command Utilities
 *
 * Low-level helpers for safe git command execution and input sanitization.
 * Used by both the generators layer (branch-diff) and the lint layer
 * (detect-changes) to avoid duplicating security-critical code.
 */

import { execFileSync } from 'child_process';

/**
 * Maximum buffer size for git command output (50MB).
 * Large enough to handle staging entire dist/ folders with source maps.
 * Prevents ENOBUFS errors when diff output exceeds Node.js default (~1MB).
 */
export const GIT_MAX_BUFFER = 50 * 1024 * 1024;

/**
 * Execute a git subcommand safely using execFileSync (no shell interpolation).
 *
 * Uses execFileSync to bypass shell interpretation entirely, preventing
 * metacharacter injection vulnerabilities.
 *
 * @param subcommand - Git subcommand (e.g., 'merge-base', 'diff', 'ls-files')
 * @param args - Array of arguments (never interpolated into a shell command)
 * @param cwd - Working directory
 * @returns Command output as string
 */
export function execGitSafe(subcommand: string, args: readonly string[], cwd: string): string {
  return execFileSync('git', [subcommand, ...args], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: GIT_MAX_BUFFER,
  });
}

/**
 * Validate and sanitize a git branch name to prevent command injection.
 *
 * Allows only alphanumeric characters, dots, hyphens, underscores, and forward slashes.
 * This matches the valid git branch name character set per git-check-ref-format.
 * Excludes shell metacharacters: ; | & $ ` ( ) { } [ ] < > ! ~ ^ * ? " ' \
 *
 * @param branch - Branch name to validate
 * @returns The validated branch name (unchanged if valid)
 * @throws Error if branch name contains invalid characters or path traversal
 */
export function sanitizeBranchName(branch: string): string {
  if (!/^[a-zA-Z0-9._\-/]+$/.test(branch)) {
    throw new Error(`Invalid branch name: ${branch}`);
  }
  // Prevent path traversal attempts in branch names
  if (branch.includes('..')) {
    throw new Error(`Invalid branch name (contains ..): ${branch}`);
  }
  return branch;
}
