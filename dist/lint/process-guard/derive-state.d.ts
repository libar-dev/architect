/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern DeriveProcessState
 * @libar-docs-status active
 * @libar-docs-depends-on:GherkinScanner,FSMValidator
 *
 * ## DeriveProcessState - Extract Process State from File Annotations
 *
 * Derives process state from @libar-docs-* annotations in files.
 * State is computed on-demand, not stored separately.
 *
 * ### Design Principles
 *
 * - **Derived, Not Stored**: State comes from file annotations
 * - **Reuses Scanner**: Builds on existing gherkin-scanner infrastructure
 * - **Pure Functions**: No side effects, testable
 *
 * ### When to Use
 *
 * - When validating changes against process rules
 * - When computing protection levels for files
 * - When determining session scope
 */
import type { Result } from '../../types/index.js';
import { type ProtectionLevel } from '../../validation/fsm/index.js';
import type { ProcessState, FileState } from './types.js';
/**
 * Configuration for deriving process state.
 */
export interface DeriveStateConfig {
    /** Base directory for file resolution */
    readonly baseDir: string;
    /** Glob patterns for spec files */
    readonly specPatterns?: readonly string[];
    /** Path to sessions directory */
    readonly sessionsDir?: string;
}
/**
 * Derive complete process state from file annotations.
 *
 * Scans spec files and extracts:
 * - Status from @libar-docs-status tags
 * - Deliverables from Background tables
 * - Session state from active session files
 *
 * @param config - Configuration for state derivation
 * @returns Result containing ProcessState or error
 *
 * @example
 * ```typescript
 * const result = await deriveProcessState({
 *   baseDir: '/path/to/project',
 * });
 * if (result.ok) {
 *   const state = result.value;
 *   console.log(`Found ${state.files.size} spec files`);
 * }
 * ```
 */
export declare function deriveProcessState(config: DeriveStateConfig): Promise<Result<ProcessState>>;
/**
 * Get file state from process state.
 */
export declare function getFileState(state: ProcessState, relativePath: string): FileState | undefined;
/**
 * Get all files with a specific protection level.
 */
export declare function getFilesByProtection(state: ProcessState, protection: ProtectionLevel): readonly FileState[];
/**
 * Check if a file is in the active session scope.
 */
export declare function isInSessionScope(state: ProcessState, relativePath: string): boolean;
/**
 * Check if a file is explicitly excluded from session.
 */
export declare function isSessionExcluded(state: ProcessState, relativePath: string): boolean;
//# sourceMappingURL=derive-state.d.ts.map