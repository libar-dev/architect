/**
 * @architect
 * @architect-pattern SessionStateReader
 * @architect-lint
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:process-guard
 * @architect-implements ProcessGuardLinter
 * @architect-implements ProcessGuardPatternGraphMigration
 * @architect-uses GherkinScanner
 *
 * ## SessionStateReader - Read ProcessGuard Session State
 *
 * Reads active session metadata from `sessions/*.feature` files. Session files are
 * ephemeral workflow state, not architectural patterns, so they intentionally stay
 * outside the PatternGraph read model.
 *
 * ### When to Use
 *
 * - When deriving active session scope for Process Guard validation
 * - When interpreting `@architect-session-*` tags from session feature files
 * - When keeping session parsing isolated from PatternGraph-backed file-state projection
 */

import * as fs from 'fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';
import type { Result } from '@libar-dev/architect-core';
import { Result as R } from '@libar-dev/architect-core';
import { scanGherkinFiles } from '@libar-dev/architect-core';
import type { GherkinBackground } from '@libar-dev/architect-core';
import type { ProcessState, SessionState, SessionStatus } from './types.js';

export interface SessionStateReaderConfig {
  /** Base directory for resolving session file paths */
  readonly baseDir: string;
  /** Path to the sessions directory */
  readonly sessionsDir?: string;
}

export function resolveSessionsDir(baseDir: string, sessionsDir?: string): string {
  return sessionsDir ?? path.join(baseDir, 'sessions');
}

/**
 * Find the currently active session, if one exists.
 */
export async function readActiveSession(
  config: SessionStateReaderConfig
): Promise<Result<SessionState | undefined>> {
  const { baseDir } = config;
  const sessionsDir = resolveSessionsDir(baseDir, config.sessionsDir);

  try {
    try {
      await fs.access(sessionsDir);
    } catch {
      return R.ok(undefined);
    }

    const sessionFiles = (
      await glob('*.feature', {
        cwd: sessionsDir,
        absolute: true,
      })
    ).sort();

    for (const sessionFile of sessionFiles) {
      const sessionResult = await parseSessionFile(sessionFile, baseDir);
      if (!sessionResult.ok) {
        // Skip malformed/non-session files — one bad ephemeral file must not
        // disable session derivation for all others.
        continue;
      }

      const session = sessionResult.value;
      if (session?.status === 'active') {
        return R.ok(session);
      }
    }

    return R.ok(undefined);
  } catch (error) {
    return R.err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Check if a file is in the active session scope.
 */
export function isInSessionScope(
  state: Pick<ProcessState, 'activeSession'>,
  relativePath: string
): boolean {
  if (!state.activeSession) {
    return true;
  }

  const normalizedPath = path.normalize(relativePath);
  for (const spec of state.activeSession.scopedSpecs) {
    if (matchesSpec(normalizedPath, spec)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a file is explicitly excluded from the active session.
 */
export function isSessionExcluded(
  state: Pick<ProcessState, 'activeSession'>,
  relativePath: string
): boolean {
  if (!state.activeSession) {
    return false;
  }

  const normalizedPath = path.normalize(relativePath);
  for (const spec of state.activeSession.excludedSpecs) {
    if (matchesSpec(normalizedPath, spec)) {
      return true;
    }
  }

  return false;
}

async function parseSessionFile(
  filePath: string,
  baseDir: string
): Promise<Result<SessionState | undefined>> {
  const scanResult = await scanGherkinFiles({
    patterns: [filePath],
    baseDir,
  });

  if (!scanResult.ok) {
    return R.err(new Error(`Failed to read session file "${filePath}".`));
  }

  if (scanResult.value.errors.length > 0) {
    const firstError = scanResult.value.errors[0];
    return R.err(
      new Error(
        `Failed to parse session file "${filePath}": ${firstError?.error.message ?? 'Unknown parse error'}`
      )
    );
  }

  if (scanResult.value.files.length === 0) {
    return R.err(new Error(`Session file "${filePath}" did not yield a parsed feature.`));
  }

  const file = scanResult.value.files[0];
  if (!file) {
    return R.err(new Error(`Session file "${filePath}" did not yield a parsed feature.`));
  }

  const tags = file.feature.tags;
  const sessionId = extractTagValue(tags, 'session-id');
  if (!sessionId) {
    return R.ok(undefined);
  }

  const sessionStatusRaw = extractTagValue(tags, 'session-status');
  const sessionStatus: SessionStatus =
    sessionStatusRaw === 'active' || sessionStatusRaw === 'closed' ? sessionStatusRaw : 'draft';

  const scopedSpecs = extractScopedSpecs(file.background);
  const excludedSpecs = extractExcludedSpecs(file.background);

  return R.ok({
    id: sessionId,
    status: sessionStatus,
    scopedSpecs,
    excludedSpecs,
    sessionFile: filePath,
  });
}

function extractTagValue(tags: readonly string[], key: string): string | undefined {
  for (const tag of tags) {
    const pattern = new RegExp(`^${key}:["']?([^"'\\s]+)["']?$`);
    const match = tag.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return undefined;
}

function extractScopedSpecs(background: GherkinBackground | undefined): readonly string[] {
  return extractDataTableColumnValues(background, ['spec', 'Spec']);
}

function extractExcludedSpecs(background: GherkinBackground | undefined): readonly string[] {
  return extractDataTableColumnValues(background, [
    'excludedSpec',
    'Excluded Spec',
    'excluded-spec',
    'exclude',
  ]);
}

function extractDataTableColumnValues(
  background: GherkinBackground | undefined,
  columnKeys: readonly string[]
): readonly string[] {
  if (background === undefined) {
    return [];
  }

  const values: string[] = [];
  for (const step of background.steps) {
    const rows = step.dataTable?.rows;
    if (!rows) continue;

    for (const row of rows) {
      const value = columnKeys.map((key) => row[key]).find((candidate) => candidate !== undefined);
      if (value) {
        values.push(value);
      }
    }
  }

  return values;
}

function matchesSpec(normalizedPath: string, spec: string): boolean {
  const normalizedSpec = path.normalize(spec);

  if (spec.includes('/') || spec.includes(path.sep)) {
    return (
      normalizedPath === normalizedSpec || normalizedPath.startsWith(normalizedSpec + path.sep)
    );
  }

  return normalizedPath.includes(spec);
}
