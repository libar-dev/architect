/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern DetectChanges
 * @libar-docs-status active
 * @libar-docs-depends-on:DeriveProcessState
 *
 * ## DetectChanges - Git Diff Change Detection
 *
 * Detects changes from git diff including:
 * - Modified, added, deleted files
 * - Status transitions (@libar-docs-status changes)
 * - Deliverable changes in Background tables
 *
 * ### Design Principles
 *
 * - **Parse Git Output**: Uses `git diff --name-status` and `git diff`
 * - **Status Detection**: Regex patterns for @libar-docs-status changes
 * - **Deliverable Detection**: Parses DataTable changes
 *
 * Note: Taxonomy modification detection was removed when taxonomy
 * moved from JSON to TypeScript (src/taxonomy/). TypeScript changes
 * require recompilation, making runtime detection unnecessary.
 *
 * ### When to Use
 *
 * - When validating staged changes (pre-commit)
 * - When validating all changes against main branch
 * - When detecting scope creep (new deliverables)
 */

import { execSync } from 'child_process';
import * as path from 'path';
import type { Result } from '../../types/index.js';
import { Result as R } from '../../types/index.js';
import { PROCESS_STATUS_VALUES, type ProcessStatusValue } from '../../taxonomy/index.js';
import type { ChangeDetection, StatusTransition, DeliverableChange } from './types.js';
import { DEFAULT_TAG_PREFIX } from '../../config/defaults.js';
import type { WithTagRegistry } from '../../validation/types.js';

/**
 * Options for change detection functions.
 *
 * Currently only includes registry from WithTagRegistry, but kept as a
 * separate interface for future extensibility (e.g., adding filter options).
 */
export type ChangeDetectionOptions = WithTagRegistry;

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Detect changes from git staged files.
 *
 * @param baseDir - Repository base directory
 * @param options - Optional change detection options with registry
 * @returns Result containing change detection or error
 *
 * @example
 * ```typescript
 * const result = await detectStagedChanges('/path/to/repo');
 * if (result.ok) {
 *   console.log(`${result.value.modifiedFiles.length} files changed`);
 * }
 * ```
 */
export function detectStagedChanges(
  baseDir: string,
  options?: ChangeDetectionOptions
): Result<ChangeDetection> {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  try {
    // Get list of staged files with status
    const nameStatus = execGit('diff --cached --name-status', baseDir);
    const { modified, added, deleted } = parseNameStatus(nameStatus);

    // Get full diff for content analysis
    const diff = execGit('diff --cached', baseDir);

    // Detect status transitions
    const statusTransitions = detectStatusTransitions(diff, [...modified, ...added], tagPrefix);

    // Detect deliverable changes
    const deliverableChanges = detectDeliverableChanges(diff, [...modified, ...added]);

    return R.ok({
      modifiedFiles: modified,
      addedFiles: added,
      deletedFiles: deleted,
      statusTransitions: new Map(statusTransitions),
      deliverableChanges: new Map(deliverableChanges),
      taxonomyModified: false, // Deprecated: taxonomy is now TypeScript-based
    });
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Detect all changes compared to a base branch.
 *
 * @param baseDir - Repository base directory
 * @param baseBranch - Branch to compare against (default: main)
 * @param options - Optional change detection options with registry
 * @returns Result containing change detection or error
 */
export function detectBranchChanges(
  baseDir: string,
  baseBranch = 'main',
  options?: ChangeDetectionOptions
): Result<ChangeDetection> {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  try {
    // Get merge base
    const mergeBase = execGit(`merge-base ${baseBranch} HEAD`, baseDir).trim();

    // Get list of changed files
    const nameStatus = execGit(`diff --name-status ${mergeBase}`, baseDir);
    const { modified, added, deleted } = parseNameStatus(nameStatus);

    // Get full diff
    const diff = execGit(`diff ${mergeBase}`, baseDir);

    // Detect status transitions
    const statusTransitions = detectStatusTransitions(diff, [...modified, ...added], tagPrefix);

    // Detect deliverable changes
    const deliverableChanges = detectDeliverableChanges(diff, [...modified, ...added]);

    return R.ok({
      modifiedFiles: modified,
      addedFiles: added,
      deletedFiles: deleted,
      statusTransitions: new Map(statusTransitions),
      deliverableChanges: new Map(deliverableChanges),
      taxonomyModified: false, // Deprecated: taxonomy is now TypeScript-based
    });
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Detect changes for specific files.
 *
 * @param baseDir - Repository base directory
 * @param files - Files to analyze
 * @param options - Optional change detection options with registry
 * @returns Result containing change detection or error
 */
export function detectFileChanges(
  baseDir: string,
  files: readonly string[],
  options?: ChangeDetectionOptions
): Result<ChangeDetection> {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  try {
    const modified: string[] = [];
    const added: string[] = [];

    for (const file of files) {
      const fullPath = path.isAbsolute(file) ? file : path.join(baseDir, file);
      const relativePath = path.relative(baseDir, fullPath);

      // Check if file is tracked
      try {
        execGit(`ls-files --error-unmatch ${relativePath}`, baseDir);
        modified.push(relativePath);
      } catch {
        // File not tracked, might be new
        added.push(relativePath);
      }
    }

    // Get diff for modified files
    const diff = modified.length > 0 ? execGit(`diff HEAD -- ${modified.join(' ')}`, baseDir) : '';

    // Detect status transitions
    const statusTransitions = detectStatusTransitions(diff, modified, tagPrefix);

    // Detect deliverable changes
    const deliverableChanges = detectDeliverableChanges(diff, modified);

    return R.ok({
      modifiedFiles: modified,
      addedFiles: added,
      deletedFiles: [],
      statusTransitions: new Map(statusTransitions),
      deliverableChanges: new Map(deliverableChanges),
      taxonomyModified: false, // Deprecated: taxonomy is now TypeScript-based
    });
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(String(error)));
  }
}

// =============================================================================
// Git Helpers
// =============================================================================

/**
 * Execute a git command and return output.
 */
function execGit(command: string, cwd: string): string {
  return execSync(`git ${command}`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

/**
 * Parse git name-status output into file lists.
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
      case 'C':
        // Renamed/Copied: path is "old -> new"
        const newPath = filePath.includes('->') ? filePath.split('->')[1]?.trim() : filePath;
        if (newPath) modified.push(newPath);
        break;
    }
  }

  return { modified, added, deleted };
}

// =============================================================================
// Status Transition Detection
// =============================================================================

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect status transitions from diff content.
 *
 * Looks for lines like:
 * -{tagPrefix}status:roadmap
 * +{tagPrefix}status:active
 *
 * @param diff - Git diff content
 * @param files - List of files to analyze
 * @param tagPrefix - Tag prefix to match (default: "@libar-docs-")
 */
function detectStatusTransitions(
  diff: string,
  files: readonly string[],
  tagPrefix: string = DEFAULT_TAG_PREFIX
): Array<[string, StatusTransition]> {
  const transitions: Array<[string, StatusTransition]> = [];
  let currentFile = '';

  // Build regex pattern with configurable prefix
  const escapedPrefix = escapeRegex(tagPrefix);
  const statusPattern = new RegExp(`${escapedPrefix}status:(\\w+)`);

  for (const line of diff.split('\n')) {
    // Track current file
    if (line.startsWith('diff --git')) {
      const match = /diff --git a\/(.+) b\/(.+)/.exec(line);
      currentFile = match?.[2] ?? '';
      continue;
    }

    // Skip if not a relevant file
    if (!currentFile || !files.includes(currentFile)) continue;

    // Skip generated docs directories - they contain embedded status examples
    // that look like status transitions but are just content, not real tags
    // Common patterns: docs-living/, docs-generated/, docs/generated/
    const generatedDocsPatterns = ['docs-living/', 'docs-generated/', 'docs/generated/'];
    if (
      generatedDocsPatterns.some((p) => currentFile.startsWith(p) || currentFile.includes(`/${p}`))
    )
      continue;

    // Look for status changes
    if (line.startsWith('-') && !line.startsWith('---')) {
      const oldMatch = statusPattern.exec(line);
      if (oldMatch?.[1]) {
        // Found a removed status, look for the added status
        const fromStatus = oldMatch[1].toLowerCase();
        // We'll find the 'to' status in subsequent lines
        const existingTransition = transitions.find(([f]) => f === currentFile);
        if (!existingTransition) {
          // Temporarily store with 'from' only
          transitions.push([
            currentFile,
            {
              from: fromStatus as ProcessStatusValue,
              to: fromStatus as ProcessStatusValue, // Will be updated
            },
          ]);
        }
      }
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      const newMatch = statusPattern.exec(line);
      if (newMatch?.[1]) {
        const toStatus = newMatch[1].toLowerCase();
        // Update the existing transition or create new
        const existingIdx = transitions.findIndex(([f]) => f === currentFile);
        if (existingIdx >= 0) {
          const existing = transitions[existingIdx];
          if (existing) {
            transitions[existingIdx] = [
              currentFile,
              {
                from: existing[1].from,
                to: toStatus as ProcessStatusValue,
              },
            ];
          }
        } else if (PROCESS_STATUS_VALUES.includes(toStatus as ProcessStatusValue)) {
          // New file with status
          transitions.push([
            currentFile,
            {
              from: 'roadmap' as ProcessStatusValue, // Default for new files
              to: toStatus as ProcessStatusValue,
            },
          ]);
        }
      }
    }
  }

  // Filter out transitions where from === to (no actual change)
  return transitions.filter(([, t]) => t.from !== t.to);
}

// =============================================================================
// Deliverable Change Detection
// =============================================================================

/**
 * Detect deliverable changes from diff content.
 *
 * Looks for changes in DataTable rows containing "Deliverable" column.
 *
 * @internal Exported for testing purposes only.
 */
export function detectDeliverableChanges(
  diff: string,
  files: readonly string[]
): Array<[string, DeliverableChange]> {
  const changes: Array<[string, DeliverableChange]> = [];
  let currentFile = '';

  // Regex for DataTable row with Deliverable column
  // Matches: | Deliverable Name | Status | ... |
  const deliverablePattern = /^\s*\|([^|]+)\|([^|]+)\|/;

  const fileChanges = new Map<string, { added: string[]; removed: string[]; modified: string[] }>();

  for (const line of diff.split('\n')) {
    // Track current file
    if (line.startsWith('diff --git')) {
      const match = /diff --git a\/(.+) b\/(.+)/.exec(line);
      currentFile = match?.[2] ?? '';
      if (currentFile && !fileChanges.has(currentFile)) {
        fileChanges.set(currentFile, { added: [], removed: [], modified: [] });
      }
      continue;
    }

    // Skip if not a relevant file
    if (!currentFile || !files.includes(currentFile)) continue;

    // Skip header rows (first row in DataTable)
    if (line.includes('Deliverable') && line.includes('Status')) continue;

    // Look for added deliverables
    if (line.startsWith('+') && line.includes('|')) {
      const match = deliverablePattern.exec(line.substring(1));
      if (match?.[1]) {
        const deliverable = match[1].trim();
        if (deliverable && !deliverable.includes('---')) {
          const fc = fileChanges.get(currentFile);
          if (fc) fc.added.push(deliverable);
        }
      }
    }

    // Look for removed deliverables
    if (line.startsWith('-') && line.includes('|')) {
      const match = deliverablePattern.exec(line.substring(1));
      if (match?.[1]) {
        const deliverable = match[1].trim();
        if (deliverable && !deliverable.includes('---')) {
          const fc = fileChanges.get(currentFile);
          if (fc) fc.removed.push(deliverable);
        }
      }
    }
  }

  // Correlate added/removed to identify modifications (same deliverable, status change)
  // When a deliverable's status changes, git shows it as a line deletion + addition.
  // Deliverables appearing in both lists are modifications, not true additions/removals.
  for (const [, change] of fileChanges) {
    const removedSet = new Set(change.removed);

    for (const deliverable of [...change.added]) {
      if (removedSet.has(deliverable)) {
        // Same deliverable in both = status/path changed, not scope change
        change.modified.push(deliverable);
        change.added = change.added.filter((d) => d !== deliverable);
        change.removed = change.removed.filter((d) => d !== deliverable);
      }
    }
  }

  // Convert to array and filter empty
  for (const [file, change] of fileChanges) {
    if (change.added.length > 0 || change.removed.length > 0 || change.modified.length > 0) {
      changes.push([file, change]);
    }
  }

  return changes;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if any files were modified.
 */
export function hasChanges(detection: ChangeDetection): boolean {
  return (
    detection.modifiedFiles.length > 0 ||
    detection.addedFiles.length > 0 ||
    detection.deletedFiles.length > 0
  );
}

/**
 * Get all changed files (modified + added + deleted).
 */
export function getAllChangedFiles(detection: ChangeDetection): readonly string[] {
  return [...detection.modifiedFiles, ...detection.addedFiles, ...detection.deletedFiles];
}

/**
 * Check if a specific file was modified.
 */
export function fileWasModified(detection: ChangeDetection, relativePath: string): boolean {
  return (
    detection.modifiedFiles.includes(relativePath) || detection.addedFiles.includes(relativePath)
  );
}

/**
 * Get status transition for a file.
 */
export function getStatusTransition(
  detection: ChangeDetection,
  relativePath: string
): StatusTransition | undefined {
  return detection.statusTransitions.get(relativePath);
}

/**
 * Get deliverable changes for a file.
 */
export function getDeliverableChanges(
  detection: ChangeDetection,
  relativePath: string
): DeliverableChange | undefined {
  return detection.deliverableChanges.get(relativePath);
}
