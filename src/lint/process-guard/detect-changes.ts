/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern DetectChanges
 * @libar-docs-status active
 * @libar-docs-uses DeriveProcessState
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

import { execSync, execFileSync } from 'child_process';
import * as path from 'path';
import type { Result } from '../../types/index.js';
import { Result as R } from '../../types/index.js';
import { PROCESS_STATUS_VALUES, type ProcessStatusValue } from '../../taxonomy/index.js';
import type {
  ChangeDetection,
  StatusTransition,
  DeliverableChange,
  StatusTagLocation,
} from './types.js';
import { DEFAULT_TAG_PREFIX } from '../../config/defaults.js';
import type { WithTagRegistry } from '../../validation/types.js';

/**
 * Maximum buffer size for git command output (50MB).
 * Large enough to handle staging entire dist/ folders with source maps.
 * Prevents ENOBUFS errors when diff output exceeds Node.js default (~1MB).
 */
const GIT_MAX_BUFFER = 50 * 1024 * 1024;

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
    // Validate branch name to prevent command injection
    const safeBranch = sanitizeBranchName(baseBranch);

    // Get merge base using safe execution (array args, no shell interpolation)
    const mergeBase = execGitSafe('merge-base', [safeBranch, 'HEAD'], baseDir).trim();

    // Get list of changed files
    const nameStatus = execGitSafe('diff', ['--name-status', mergeBase], baseDir);
    const { modified, added, deleted } = parseNameStatus(nameStatus);

    // Get full diff
    const diff = execGitSafe('diff', [mergeBase], baseDir);

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

      // Check if file is tracked (use -- to separate path from options)
      try {
        execGitSafe('ls-files', ['--error-unmatch', '--', relativePath], baseDir);
        modified.push(relativePath);
      } catch {
        // File not tracked, might be new
        added.push(relativePath);
      }
    }

    // Get diff for modified files (use -- to separate paths from options)
    const diff =
      modified.length > 0 ? execGitSafe('diff', ['HEAD', '--', ...modified], baseDir) : '';

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
 *
 * @deprecated Use execGitSafe for user-controlled inputs to prevent command injection.
 * This function is kept for simple hardcoded commands like 'diff --cached'.
 */
function execGit(command: string, cwd: string): string {
  return execSync(`git ${command}`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: GIT_MAX_BUFFER,
  });
}

/**
 * Execute a git command safely using execFileSync to prevent command injection.
 *
 * Uses array-based arguments instead of string interpolation to avoid shell
 * metacharacter injection vulnerabilities.
 *
 * @param subcommand - Git subcommand (e.g., 'merge-base', 'diff', 'ls-files')
 * @param args - Array of arguments (never interpolated into a shell command)
 * @param cwd - Working directory
 * @returns Command output as string
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
 *
 * @param branch - Branch name to validate
 * @returns The validated branch name (unchanged if valid)
 * @throws Error if branch name contains invalid characters
 */
function sanitizeBranchName(branch: string): string {
  // Git branch names: alphanumeric, dots, hyphens, underscores, forward slashes
  // Excludes shell metacharacters: ; | & $ ` ( ) { } [ ] < > ! ~ ^ * ? " ' \
  if (!/^[a-zA-Z0-9._\-/]+$/.test(branch)) {
    throw new Error(`Invalid branch name: ${branch}`);
  }
  // Prevent path traversal attempts in branch names
  if (branch.includes('..')) {
    throw new Error(`Invalid branch name (contains ..): ${branch}`);
  }
  return branch;
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
 * Check if a file path is in a generated docs directory.
 * These directories contain embedded status examples that look like transitions.
 */
function isGeneratedDocsPath(filePath: string): boolean {
  const patterns = ['docs-living/', 'docs-generated/', 'docs/generated/'];
  return patterns.some((p) => filePath.startsWith(p) || filePath.includes(`/${p}`));
}

/**
 * State for tracking parsing context within a git diff file section.
 */
interface DiffFileParseState {
  /** Current line number in the new file version (from hunk headers) */
  newLineNumber: number;
  /** Are we inside a docstring (between """ markers)? */
  insideDocstring: boolean;
  /** All status tags found with their locations (for debugging) */
  foundTags: StatusTagLocation[];
  /** The first valid (non-docstring) added status tag */
  validAddedTag: StatusTagLocation | null;
  /** The removed status tag (for modified files) */
  removedTag: StatusTagLocation | null;
}

/**
 * Detect status transitions from diff content.
 *
 * This function is docstring-aware: it tracks `"""` boundaries and only
 * captures status tags that appear OUTSIDE docstrings. For new files,
 * the FIRST valid status tag is used (not the last).
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

  // Build regex patterns
  const escapedPrefix = escapeRegex(tagPrefix);
  const statusPattern = new RegExp(`${escapedPrefix}status:(\\w+)`);
  const hunkHeaderPattern = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

  // Parse state per file
  const fileStates = new Map<string, DiffFileParseState>();

  for (const line of diff.split('\n')) {
    // Track current file from diff headers
    if (line.startsWith('diff --git')) {
      const match = /diff --git a\/(.+) b\/(.+)/.exec(line);
      const file = match?.[2] ?? '';
      currentFile = file;

      // Initialize state for relevant files
      if (file && files.includes(file) && !isGeneratedDocsPath(file)) {
        fileStates.set(file, {
          newLineNumber: 0,
          insideDocstring: false,
          foundTags: [],
          validAddedTag: null,
          removedTag: null,
        });
      }
      continue;
    }

    // Get current file state
    const state = currentFile ? fileStates.get(currentFile) : undefined;
    if (!state) continue;

    // Track line numbers from hunk headers (@@ -old,count +new,count @@)
    const hunkMatch = hunkHeaderPattern.exec(line);
    if (hunkMatch?.[1]) {
      // Hunk header gives starting line; we'll increment as we see lines
      state.newLineNumber = parseInt(hunkMatch[1], 10) - 1;
      // Reset docstring state at each hunk (conservative approach)
      state.insideDocstring = false;
      continue;
    }

    // Track line numbers: increment for context and added lines, not for removed
    if (!line.startsWith('-') || line.startsWith('---')) {
      state.newLineNumber++;
    }

    // Track docstring boundaries (""" in Gherkin/Python)
    // Check both added and context lines for docstring markers
    const lineContent = line.startsWith('+') || line.startsWith('-') ? line.substring(1) : line;
    if (/^\s*"""/.test(lineContent)) {
      state.insideDocstring = !state.insideDocstring;
    }

    // Look for removed status tags (old value for modified files)
    if (line.startsWith('-') && !line.startsWith('---')) {
      const oldMatch = statusPattern.exec(line);
      if (oldMatch?.[1]) {
        const location: StatusTagLocation = {
          lineNumber: state.newLineNumber,
          insideDocstring: state.insideDocstring,
          rawLine: line,
        };
        state.foundTags.push(location);

        // Capture removed tag if not inside docstring (first one wins)
        if (!state.removedTag && !state.insideDocstring) {
          state.removedTag = location;
        }
      }
    }

    // Look for added status tags (new value)
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const newMatch = statusPattern.exec(line);
      if (newMatch?.[1]) {
        const toStatus = newMatch[1].toLowerCase();
        if (PROCESS_STATUS_VALUES.includes(toStatus as ProcessStatusValue)) {
          const location: StatusTagLocation = {
            lineNumber: state.newLineNumber,
            insideDocstring: state.insideDocstring,
            rawLine: line,
          };
          state.foundTags.push(location);

          // Capture FIRST valid added tag (not inside docstring)
          if (!state.validAddedTag && !state.insideDocstring) {
            state.validAddedTag = location;
          }
        }
      }
    }
  }

  // Build transitions from parsed state
  for (const [file, state] of fileStates) {
    // Skip if no valid added tag found
    if (!state.validAddedTag) continue;

    // Extract status values
    const toMatch = statusPattern.exec(state.validAddedTag.rawLine);
    const toStatusRaw = toMatch?.[1]?.toLowerCase();
    if (!toStatusRaw) continue;
    const toStatus = toStatusRaw as ProcessStatusValue;

    const isNewFile = state.removedTag === null;
    let fromStatus: ProcessStatusValue;

    if (state.removedTag === null) {
      // New file defaults from 'roadmap'
      fromStatus = 'roadmap';
    } else {
      // state.removedTag is guaranteed to exist here
      const fromMatch = statusPattern.exec(state.removedTag.rawLine);
      const fromStatusRaw = fromMatch?.[1]?.toLowerCase();
      fromStatus = fromStatusRaw ? (fromStatusRaw as ProcessStatusValue) : 'roadmap';
    }

    // Skip if no actual change
    if (fromStatus === toStatus) continue;

    // Build transition with debug metadata
    const transition: StatusTransition = {
      from: fromStatus,
      to: toStatus,
      isNewFile,
      toLocation: state.validAddedTag,
      // Include all detected tags if there were multiple (helps debug false positives)
      ...(state.foundTags.length > 1 ? { allDetectedTags: state.foundTags } : {}),
    };

    transitions.push([file, transition]);
  }

  return transitions;
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
