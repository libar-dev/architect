/**
 * @libar-docs
 * @libar-docs-pattern GitBranchDiff
 * @libar-docs-status active
 * @libar-docs-arch-role utility
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-used-by Orchestrator
 *
 * ## GitBranchDiff - Pure Git Change Detection
 *
 * Provides lightweight git diff operations for determining which files changed
 * relative to a base branch. This module exists to decouple the generators
 * layer from the lint layer — the orchestrator needs file change lists for
 * PR-scoped generation, but should not depend on Process Guard's domain-specific
 * change detection (status transitions, deliverable changes).
 *
 * ### When to Use
 *
 * - When you need a list of changed files relative to a base branch
 * - When orchestrating generation for only changed patterns
 *
 * ### When NOT to Use
 *
 * - For Process Guard validation — use detectBranchChanges from lint/process-guard
 * - For status transition detection — use detectStagedChanges/detectBranchChanges
 */

import { execFileSync } from 'child_process';
import type { Result } from '../types/index.js';
import { Result as R } from '../types/index.js';

/**
 * Maximum buffer size for git command output (50MB).
 * Large enough to handle staging entire dist/ folders with source maps.
 */
const GIT_MAX_BUFFER = 50 * 1024 * 1024;

/**
 * Execute a git subcommand safely using execFileSync (no shell interpolation).
 */
function execGitSafe(subcommand: string, args: readonly string[], cwd: string): string {
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
 */
function sanitizeBranchName(branch: string): string {
  if (!/^[a-zA-Z0-9._\-/]+$/.test(branch)) {
    throw new Error(`Invalid branch name: ${branch}`);
  }
  if (branch.includes('..')) {
    throw new Error(`Invalid branch name (contains ..): ${branch}`);
  }
  return branch;
}

/**
 * Parse git diff --name-status output into categorized file lists.
 */
function parseNameStatus(output: string): {
  modified: string[];
  added: string[];
  deleted: string[];
} {
  const modified: string[] = [];
  const added: string[] = [];
  const deleted: string[] = [];

  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const [status, ...pathParts] = trimmed.split(/\s+/);
    const filePath = pathParts.join(' ');

    if (!filePath) continue;

    switch (status) {
      case 'M':
        modified.push(filePath);
        break;
      case 'A':
        added.push(filePath);
        break;
      case 'D':
        deleted.push(filePath);
        break;
      case 'R':
      case 'C': {
        const newPath = filePath.includes('->') ? filePath.split('->')[1]?.trim() : filePath;
        if (newPath) modified.push(newPath);
        break;
      }
    }
  }

  return { modified, added, deleted };
}

/**
 * Get all files changed relative to a base branch.
 *
 * This is a lightweight alternative to detectBranchChanges from lint/process-guard
 * that returns only the file list without domain-specific parsing (status transitions,
 * deliverable changes). Used by the orchestrator for PR-scoped generation.
 *
 * @param baseDir - Repository base directory
 * @param baseBranch - Branch to compare against (default: main)
 * @returns Result containing array of changed file paths, or error
 */
export function getChangedFilesList(
  baseDir: string,
  baseBranch = 'main'
): Result<readonly string[]> {
  try {
    const safeBranch = sanitizeBranchName(baseBranch);
    const mergeBase = execGitSafe('merge-base', [safeBranch, 'HEAD'], baseDir).trim();
    const nameStatus = execGitSafe('diff', ['--name-status', mergeBase], baseDir);
    const { modified, added, deleted } = parseNameStatus(nameStatus);
    return R.ok([...modified, ...added, ...deleted]);
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(String(error)));
  }
}
