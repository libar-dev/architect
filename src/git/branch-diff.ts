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

import type { Result } from '../types/index.js';
import { Result as R } from '../types/index.js';
import { execGitSafe, sanitizeBranchName } from './helpers.js';
import { parseGitNameStatus } from './name-status.js';

/**
 * Get all files changed relative to a base branch (excludes deleted files).
 *
 * This is a lightweight alternative to detectBranchChanges from lint/process-guard
 * that returns only the file list without domain-specific parsing (status transitions,
 * deliverable changes). Used by the orchestrator for PR-scoped generation.
 *
 * Deleted files are excluded because the consumer (orchestrator) uses this list
 * to scope generation to files that still exist on the current branch.
 *
 * @param baseDir - Repository base directory
 * @param baseBranch - Branch to compare against (default: main)
 * @returns Result containing array of changed file paths (modified + added), or error
 */
export function getChangedFilesList(
  baseDir: string,
  baseBranch = 'main'
): Result<readonly string[]> {
  try {
    const safeBranch = sanitizeBranchName(baseBranch);
    const mergeBase = execGitSafe('merge-base', [safeBranch, 'HEAD'], baseDir).trim();
    const nameStatus = execGitSafe('diff', ['--name-status', '-z', mergeBase], baseDir);
    const { modified, added } = parseGitNameStatus(nameStatus);
    return R.ok([...modified, ...added]);
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(String(error)));
  }
}
