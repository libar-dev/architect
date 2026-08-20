/**
 * @architect
 * @architect-lint
 * @architect-pattern DeriveProcessState
 * @architect-status active
 * @architect-role:read-model
 * @architect-bounded-context:process-guard
 * @architect-implements ProcessGuardLinter
 * @architect-uses SessionStateReader, FSMValidator
 *
 * ## DeriveProcessState - Extract Process State from File Annotations
 *
 * Derives process state from @architect-* annotations in files.
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

import * as path from 'path';
import type { Result } from '@libar-dev/architect-core';
import { Result as R } from '@libar-dev/architect-core';
import type { RuntimePatternGraph } from '@libar-dev/architect-core';
import { getProtectionLevel, type ProtectionLevel } from '@libar-dev/architect-core';
import { normalizeStatus } from '@libar-dev/architect-core';
import type { ProcessState, FileState } from './types.js';
import { readActiveSession } from './session-state-reader.js';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration for deriving process state.
 */
export interface DeriveStateConfig {
  /** Base directory for file resolution */
  readonly baseDir: string;
  /** Path to sessions directory */
  readonly sessionsDir?: string;
}

/** Default spec patterns - generic defaults that work for package-level usage */
export const DEFAULT_PROCESS_GUARD_SPEC_PATTERNS = [
  'architect/**/*.feature',
  'specs/**/*.feature', // For consumers
] as const;

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Derive complete process state from file annotations.
 *
 * Derives file state from the PatternGraph read model and composes
 * in optional session state from session feature files.
 *
 * @param patternGraph - Built PatternGraph containing extracted feature patterns
 * @param config - Configuration for state derivation
 * @returns Result containing ProcessState or error
 *
 * @example
 * ```typescript
 * const result = await deriveProcessState(patternGraph, {
 *   baseDir: '/path/to/project',
 * });
 * if (result.ok) {
 *   const state = result.value;
 *   console.log(`Found ${state.files.size} spec files`);
 * }
 * ```
 */
export async function deriveProcessState(
  patternGraph: RuntimePatternGraph,
  config: DeriveStateConfig,
): Promise<Result<ProcessState>> {
  // Derive file states
  const filesResult = deriveFileStates(patternGraph, config.baseDir);
  if (!filesResult.ok) {
    return filesResult;
  }

  // Find active session
  const sessionResult = await readActiveSession({
    baseDir: config.baseDir,
    ...(config.sessionsDir !== undefined ? { sessionsDir: config.sessionsDir } : {}),
  });
  if (!sessionResult.ok) {
    return R.err(sessionResult.error);
  }
  const activeSession = sessionResult.value;

  const processState: ProcessState = {
    files: filesResult.value,
    derivedAt: new Date().toISOString(),
    ...(activeSession !== undefined ? { activeSession } : {}),
  };

  return R.ok(processState);
}

/**
 * Derive FileState for all spec files.
 */
export function deriveFileStates(
  patternGraph: RuntimePatternGraph,
  baseDir: string,
): Result<Map<string, FileState>> {
  const fileStates = new Map<string, FileState>();

  for (const pattern of patternGraph.bySourceType.gherkin) {
    const relativePath = pattern.source.file;
    const status = pattern.status;
    const normalizedStatusValue = normalizeStatus(status);
    const protection = status === 'candidate' ? 'none' : getProtectionLevel(status);
    const deliverables = pattern.deliverables?.map((d) => d.name) ?? [];
    const unlockReason = pattern.unlockReason?.trim();

    const fileState: FileState = {
      path: path.resolve(baseDir, relativePath),
      relativePath,
      status,
      normalizedStatus: normalizedStatusValue,
      protection,
      deliverables,
      hasUnlockReason: unlockReason !== undefined && unlockReason.length > 0,
      ...(unlockReason !== undefined && unlockReason.length > 0 ? { unlockReason } : {}),
    };

    fileStates.set(relativePath, fileState);
  }

  return R.ok(fileStates);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get file state from process state.
 */
export function getFileState(state: ProcessState, relativePath: string): FileState | undefined {
  return state.files.get(relativePath);
}

/**
 * Get all files with a specific protection level.
 */
export function getFilesByProtection(
  state: ProcessState,
  protection: ProtectionLevel,
): readonly FileState[] {
  const files: FileState[] = [];
  for (const file of state.files.values()) {
    if (file.protection === protection) {
      files.push(file);
    }
  }
  return files;
}
