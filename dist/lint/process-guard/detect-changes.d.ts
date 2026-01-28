/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern DetectChanges
 * @libar-docs-status active
 * @libar-docs-implements ProcessGuardLinter
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
import type { Result } from '../../types/index.js';
import type { ChangeDetection, StatusTransition, DeliverableChange } from './types.js';
import type { WithTagRegistry } from '../../validation/types.js';
/**
 * Options for change detection functions.
 *
 * Currently only includes registry from WithTagRegistry, but kept as a
 * separate interface for future extensibility (e.g., adding filter options).
 */
export type ChangeDetectionOptions = WithTagRegistry;
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
export declare function detectStagedChanges(baseDir: string, options?: ChangeDetectionOptions): Result<ChangeDetection>;
/**
 * Detect all changes compared to a base branch.
 *
 * @param baseDir - Repository base directory
 * @param baseBranch - Branch to compare against (default: main)
 * @param options - Optional change detection options with registry
 * @returns Result containing change detection or error
 */
export declare function detectBranchChanges(baseDir: string, baseBranch?: string, options?: ChangeDetectionOptions): Result<ChangeDetection>;
/**
 * Detect changes for specific files.
 *
 * @param baseDir - Repository base directory
 * @param files - Files to analyze
 * @param options - Optional change detection options with registry
 * @returns Result containing change detection or error
 */
export declare function detectFileChanges(baseDir: string, files: readonly string[], options?: ChangeDetectionOptions): Result<ChangeDetection>;
/**
 * Detect deliverable changes from diff content.
 *
 * Looks for changes in DataTable rows containing "Deliverable" column.
 *
 * @internal Exported for testing purposes only.
 */
export declare function detectDeliverableChanges(diff: string, files: readonly string[]): Array<[string, DeliverableChange]>;
/**
 * Check if any files were modified.
 */
export declare function hasChanges(detection: ChangeDetection): boolean;
/**
 * Get all changed files (modified + added + deleted).
 */
export declare function getAllChangedFiles(detection: ChangeDetection): readonly string[];
/**
 * Check if a specific file was modified.
 */
export declare function fileWasModified(detection: ChangeDetection, relativePath: string): boolean;
/**
 * Get status transition for a file.
 */
export declare function getStatusTransition(detection: ChangeDetection, relativePath: string): StatusTransition | undefined;
/**
 * Get deliverable changes for a file.
 */
export declare function getDeliverableChanges(detection: ChangeDetection, relativePath: string): DeliverableChange | undefined;
//# sourceMappingURL=detect-changes.d.ts.map