/**
 * @architect
 * @architect-lint
 * @architect-pattern DetectChanges
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:process-guard
 * @architect-implements ProcessGuardLinter
 * @architect-uses DeriveProcessState, GitNameStatusParser
 *
 * ## DetectChanges - Git Diff Change Detection
 *
 * Detects changes from git diff including:
 * - Modified, added, deleted files
 * - Status transitions (@architect-status changes)
 * - Deliverable changes in Background tables
 *
 * ### Design Principles
 *
 * - **Parse Git Output**: Uses `git diff --name-status` and `git diff`
 * - **Status Detection**: Regex patterns for @architect-status changes
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

import * as fs from 'node:fs';
import * as path from 'path';
import { globSync } from 'glob';
import type { Result } from '@libar-dev/architect-core';
import { Result as R } from '@libar-dev/architect-core';
import {
  BoundaryParseError,
  DEFAULT_STATUS,
  ProcessStatusSchema,
  parseAtBoundary,
  type ProcessStatusValue,
} from '@libar-dev/architect-core';
import { execGitSafe, sanitizeBranchName, parseGitNameStatus } from '../../git/index.js';
import type {
  ChangeDetection,
  StatusTransition,
  DeliverableChange,
  StatusTagLocation,
} from './types.js';
import { DEFAULT_TAG_PREFIX } from '@libar-dev/architect-core';
import type { WithTagRegistry } from '../../validation/types.js';
import { DEFAULT_PROCESS_GUARD_SPEC_PATTERNS } from './derive-state.js';

/**
 * Options for change detection functions.
 *
 * Includes registry and optional feature globs so diff parsing can be
 * scoped to the same workflow-authoritative files used for state derivation.
 */
export type ChangeDetectionOptions = WithTagRegistry & {
  readonly featurePatterns?: readonly string[];
  readonly exclude?: readonly string[];
};

function tryParseProcessStatusValue(rawValue: string | undefined): ProcessStatusValue | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  try {
    return parseAtBoundary(
      ProcessStatusSchema,
      rawValue.toLowerCase(),
      `Invalid process status value in git diff: ${rawValue}`,
    );
  } catch (error: unknown) {
    if (error instanceof BoundaryParseError) {
      return undefined;
    }
    throw error;
  }
}

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
  options?: ChangeDetectionOptions,
): Result<ChangeDetection> {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  try {
    // Get list of staged files with status
    const nameStatus = execGitSafe('diff', ['--cached', '--name-status', '-z'], baseDir);
    const { modified, added, deleted } = parseGitNameStatus(nameStatus);

    // Get full diff for content analysis
    const diff = execGitSafe('diff', ['--cached'], baseDir);
    const featureFiles = filterFeatureScopedFiles(baseDir, [...modified, ...added], options);

    // Detect status transitions
    const statusTransitions = detectStatusTransitions(diff, featureFiles, tagPrefix);

    // Detect deliverable changes
    const deliverableChanges = detectDeliverableChanges(diff, featureFiles);

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
  options?: ChangeDetectionOptions,
): Result<ChangeDetection> {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  try {
    // Validate branch name to prevent command injection
    const safeBranch = sanitizeBranchName(baseBranch);

    // Get merge base using safe execution (array args, no shell interpolation)
    const mergeBase = execGitSafe('merge-base', [safeBranch, 'HEAD'], baseDir).trim();

    // Get list of changed files
    const nameStatus = execGitSafe('diff', ['--name-status', '-z', mergeBase], baseDir);
    const { modified, added, deleted } = parseGitNameStatus(nameStatus);

    // Get full diff
    const diff = execGitSafe('diff', [mergeBase], baseDir);
    const featureFiles = filterFeatureScopedFiles(baseDir, [...modified, ...added], options);

    // Detect status transitions
    const statusTransitions = detectStatusTransitions(diff, featureFiles, tagPrefix);

    // Detect deliverable changes
    const deliverableChanges = detectDeliverableChanges(diff, featureFiles);

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
  options?: ChangeDetectionOptions,
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

    const diffParts: string[] = [];
    if (modified.length > 0) {
      diffParts.push(execGitSafe('diff', ['HEAD', '--', ...modified], baseDir));
    }
    for (const file of added) {
      diffParts.push(buildSyntheticAddedFileDiff(baseDir, file));
    }

    const diff = diffParts.filter((part) => part.length > 0).join('\n');
    const featureFiles = filterFeatureScopedFiles(baseDir, [...modified, ...added], options);

    // Detect status transitions
    const statusTransitions = detectStatusTransitions(diff, featureFiles, tagPrefix);

    // Detect deliverable changes
    const deliverableChanges = detectDeliverableChanges(diff, featureFiles);

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

function buildSyntheticAddedFileDiff(baseDir: string, relativePath: string): string {
  const absolutePath = path.join(baseDir, relativePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.split('\n');

  return [
    `diff --git a/${relativePath} b/${relativePath}`,
    'new file mode 100644',
    '--- /dev/null',
    `+++ b/${relativePath}`,
    `@@ -0,0 +1,${String(lines.length)} @@`,
    lines.map((line) => `+${line}`).join('\n'),
  ].join('\n');
}

// =============================================================================
// =============================================================================
// Status Transition Detection
// =============================================================================

function getProcessGuardFeaturePatterns(options?: ChangeDetectionOptions): readonly string[] {
  return options?.featurePatterns ?? DEFAULT_PROCESS_GUARD_SPEC_PATTERNS;
}

function filterFeatureScopedFiles(
  baseDir: string,
  files: readonly string[],
  options?: ChangeDetectionOptions,
): string[] {
  const featurePatterns = getProcessGuardFeaturePatterns(options);
  if (featurePatterns.length === 0) {
    return [];
  }

  const matchedFiles = new Set(
    globSync([...featurePatterns], {
      cwd: baseDir,
      nodir: true,
      ignore: options?.exclude ? [...options.exclude] : [],
    }).map((file) => path.normalize(file)),
  );

  return files.filter((file) => matchedFiles.has(path.normalize(file)));
}

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
  const patterns = ['docs-living/', 'docs-generated/', 'docs/generated/', 'docs-live/'];
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
  /** Whether the diff contains an unlock-reason tag */
  hasUnlockReason: boolean;
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
 * @param tagPrefix - Tag prefix to match (default: "@architect-")
 */
function detectStatusTransitions(
  diff: string,
  files: readonly string[],
  tagPrefix: string = DEFAULT_TAG_PREFIX,
): [string, StatusTransition][] {
  const transitions: [string, StatusTransition][] = [];
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
          hasUnlockReason: false,
        });
      }
      continue;
    }

    // Get current file state
    const state = currentFile ? fileStates.get(currentFile) : undefined;
    if (!state) continue;

    // Track line numbers from hunk headers (@@ -old,count +new,count @@)
    const hunkMatch = hunkHeaderPattern.exec(line);
    if (hunkMatch?.[1] !== undefined) {
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

    // Detect unlock-reason tags in added lines
    if (line.startsWith('+') && line.includes('unlock-reason')) {
      state.hasUnlockReason = true;
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
        const toStatus = tryParseProcessStatusValue(newMatch[1]);
        if (toStatus !== undefined) {
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
    const toStatus = tryParseProcessStatusValue(toMatch?.[1]);
    if (toStatus === undefined) continue;

    const isNewFile = state.removedTag === null;
    let fromStatus: ProcessStatusValue;

    if (state.removedTag === null) {
      // New file defaults from DEFAULT_STATUS
      fromStatus = DEFAULT_STATUS;
    } else {
      // state.removedTag is guaranteed to exist here
      const fromMatch = statusPattern.exec(state.removedTag.rawLine);
      fromStatus = tryParseProcessStatusValue(fromMatch?.[1]) ?? DEFAULT_STATUS;
    }

    // Skip if no actual change
    if (fromStatus === toStatus) continue;

    // Build transition with debug metadata
    const transition: StatusTransition = {
      from: fromStatus,
      to: toStatus,
      isNewFile,
      ...(state.hasUnlockReason ? { hasUnlockReason: true } : {}),
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
 * Only matches table rows that appear within a deliverable table context,
 * identified by a preceding header row containing both "Deliverable" and "Status".
 * This prevents false positives from Examples tables, DocString-embedded tables,
 * and other non-deliverable table content.
 *
 * @internal Exported for testing purposes only.
 */
export function detectDeliverableChanges(
  diff: string,
  files: readonly string[],
): [string, DeliverableChange][] {
  const changes: [string, DeliverableChange][] = [];
  let currentFile = '';
  let inDeliverableTable = false;

  // Regex for DataTable row with Deliverable column
  // Matches: | Deliverable Name | Status | ... |
  const deliverablePattern = /^\s*\|([^|]+)\|([^|]+)\|/;

  const fileChanges = new Map<string, { added: string[]; removed: string[]; modified: string[] }>();

  for (const line of diff.split('\n')) {
    // Track current file
    if (line.startsWith('diff --git')) {
      const match = /diff --git a\/(.+) b\/(.+)/.exec(line);
      currentFile = match?.[2] ?? '';
      inDeliverableTable = false;
      if (currentFile && !fileChanges.has(currentFile)) {
        fileChanges.set(currentFile, { added: [], removed: [], modified: [] });
      }
      continue;
    }

    // Reset deliverable table context at hunk boundaries
    if (line.startsWith('@@')) {
      inDeliverableTable = false;
      continue;
    }

    // Skip if not a relevant file
    if (!currentFile || !files.includes(currentFile)) continue;

    // Strip diff prefix (+/-/space) to get raw content
    const content = line.startsWith('+') || line.startsWith('-') ? line.substring(1) : line;

    // Detect deliverable table header — sets context for subsequent rows
    if (content.includes('Deliverable') && content.includes('Status') && content.includes('|')) {
      inDeliverableTable = true;
      continue;
    }

    // Exit deliverable table context on non-table or blank lines
    if (inDeliverableTable) {
      const trimmed = content.trim();
      if (trimmed !== '' && !trimmed.startsWith('|')) {
        inDeliverableTable = false;
        continue;
      }
      if (trimmed === '') {
        inDeliverableTable = false;
        continue;
      }
    }

    // Only process rows within a deliverable table
    if (!inDeliverableTable) continue;

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
  relativePath: string,
): StatusTransition | undefined {
  return detection.statusTransitions.get(relativePath);
}

/**
 * Get deliverable changes for a file.
 */
export function getDeliverableChanges(
  detection: ChangeDetection,
  relativePath: string,
): DeliverableChange | undefined {
  return detection.deliverableChanges.get(relativePath);
}
