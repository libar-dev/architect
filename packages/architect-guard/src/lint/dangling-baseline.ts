import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type { DanglingReference } from '@libar-dev/architect-core';
import { z } from 'zod';

const DanglingBaselineEntrySchema = z.strictObject({
  pattern: z.string(),
  field: z.string(),
  missing: z.string(),
});

const DanglingBaselineSchema = z.array(DanglingBaselineEntrySchema).readonly();

export type DanglingBaselineEntry = z.infer<typeof DanglingBaselineEntrySchema>;

export interface DanglingBaselineComparison {
  readonly baseline: readonly DanglingBaselineEntry[];
  readonly current: readonly DanglingBaselineEntry[];
  readonly newEntries: readonly DanglingBaselineEntry[];
  readonly removedEntries: readonly DanglingBaselineEntry[];
}

export interface DanglingBaselineFileOptions {
  readonly baselinePath?: string;
}

const BASELINE_FILE_URL = new URL('./dangling-baseline.json', import.meta.url);
const SOURCE_BASELINE_FILE_URL = new URL('../../src/lint/dangling-baseline.json', import.meta.url);
const BASELINE_RESOURCE_PATH = fileURLToPath(BASELINE_FILE_URL);
const SOURCE_BASELINE_RESOURCE_PATH = fileURLToPath(SOURCE_BASELINE_FILE_URL);
export const DANGLING_BASELINE_SOURCE_PATH =
  'packages/architect-guard/src/lint/dangling-baseline.json';

async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function resolveWritableBaselinePaths(): Promise<readonly string[]> {
  if (SOURCE_BASELINE_RESOURCE_PATH === BASELINE_RESOURCE_PATH) {
    return [BASELINE_RESOURCE_PATH];
  }

  if (await pathExists(SOURCE_BASELINE_RESOURCE_PATH)) {
    return [SOURCE_BASELINE_RESOURCE_PATH, BASELINE_RESOURCE_PATH];
  }

  return [BASELINE_RESOURCE_PATH];
}

function compareDanglingEntries(left: DanglingBaselineEntry, right: DanglingBaselineEntry): number {
  return (
    left.pattern.localeCompare(right.pattern) ||
    left.field.localeCompare(right.field) ||
    left.missing.localeCompare(right.missing)
  );
}

function createDanglingEntryKey(entry: DanglingBaselineEntry): string {
  return `${entry.pattern}\u0000${entry.field}\u0000${entry.missing}`;
}

export function normalizeDanglingBaselineEntries(
  entries: readonly DanglingReference[],
): DanglingBaselineEntry[] {
  return entries
    .map((entry) => ({
      pattern: entry.pattern,
      field: entry.field,
      missing: entry.missing,
    }))
    .sort(compareDanglingEntries);
}

export async function readDanglingBaseline(
  options: DanglingBaselineFileOptions = {},
): Promise<readonly DanglingBaselineEntry[]> {
  let content: string;
  const baselinePath = options.baselinePath ?? BASELINE_RESOURCE_PATH;

  try {
    content = await fs.readFile(baselinePath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Dangling baseline file not found at ${baselinePath}. Run architect-validate --base-dir . --update-baseline to create it.`,
      );
    }

    throw error;
  }

  const parsed = JSON.parse(content) as unknown;
  return DanglingBaselineSchema.parse(parsed).slice().sort(compareDanglingEntries);
}

export async function writeDanglingBaseline(
  entries: readonly DanglingReference[],
  options: DanglingBaselineFileOptions = {},
): Promise<readonly DanglingBaselineEntry[]> {
  const normalized = normalizeDanglingBaselineEntries(entries);
  const nextContent = `${JSON.stringify(normalized, null, 2)}\n`;
  const writablePaths =
    options.baselinePath !== undefined
      ? [options.baselinePath]
      : await resolveWritableBaselinePaths();
  await Promise.all(writablePaths.map((path) => fs.writeFile(path, nextContent, 'utf8')));
  return normalized;
}

export async function compareDanglingBaseline(
  entries: readonly DanglingReference[],
  options: DanglingBaselineFileOptions = {},
): Promise<DanglingBaselineComparison> {
  const baseline = await readDanglingBaseline(options);
  const current = normalizeDanglingBaselineEntries(entries);
  const baselineKeys = new Set(baseline.map(createDanglingEntryKey));
  const currentKeys = new Set(current.map(createDanglingEntryKey));
  const newEntries = current.filter((entry) => !baselineKeys.has(createDanglingEntryKey(entry)));
  const removedEntries = baseline.filter(
    (entry) => !currentKeys.has(createDanglingEntryKey(entry)),
  );

  return {
    baseline,
    current,
    newEntries,
    removedEntries,
  };
}
