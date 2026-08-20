#!/usr/bin/env node
/**
 * Out-of-band guard for the no-BC suppression-comment doctrine.
 *
 * Mirrors the ESLint `architect-local/no-suppression-comments` rule but runs
 * standalone, so file-only commits and partial CI lanes still gate the
 * doctrine. Scans `packages/*\/src/` for `eslint-disable`, `@ts-ignore`,
 * `@ts-expect-error`, and `@ts-nocheck` markers and compares the result to
 * `scripts/guard-no-suppressions.baseline.json`.
 *
 * Regenerate the baseline only with `ALLOW_SUPPRESSION_BASELINE_REGEN=1
 * pnpm guard:no-suppressions -- --regenerate-baseline` after a deliberate
 * doctrine carve-out.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, 'scripts/guard-no-suppressions.baseline.json');
const SEARCH_ROOTS = ['packages'];
const SOURCE_SEGMENT = `${path.sep}src${path.sep}`;
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx']);
const SUPPRESSION_PATTERN = /eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck/u;
const BASELINE_REGEN_ENV = 'ALLOW_SUPPRESSION_BASELINE_REGEN';

export function createSuppressionTextHash(match) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        file: match.file,
        line: match.line,
        text: match.text,
      }),
    )
    .digest('hex');
}

export function toBaselineEntries(matches) {
  return sortBaselineEntries(
    matches.map((match) => ({
      file: match.file,
      line: match.line,
      textHash: createSuppressionTextHash(match),
    })),
  );
}

export function sortBaselineEntries(entries) {
  return [...entries].sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.textHash.localeCompare(right.textHash),
  );
}

export function compareSuppressionBaseline(matches, baselineEntries) {
  const actualEntries = toBaselineEntries(matches);
  const actualSet = new Set(actualEntries.map(formatBaselineKey));
  const baselineSet = new Set(baselineEntries.map(formatBaselineKey));

  return {
    actualEntries,
    additions: matches.filter((match) => !baselineSet.has(formatBaselineKey(matchToEntry(match)))),
    removals: baselineEntries.filter((entry) => !actualSet.has(formatBaselineKey(entry))),
  };
}

export async function readSuppressionBaseline(baselinePath) {
  const parsed = JSON.parse(await readFile(baselinePath, 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid suppression baseline in ${baselinePath}: expected an array`);
  }

  return sortBaselineEntries(
    parsed.map((entry) => {
      if (
        entry === null ||
        typeof entry !== 'object' ||
        typeof entry.file !== 'string' ||
        !Number.isInteger(entry.line) ||
        entry.line < 1 ||
        typeof entry.textHash !== 'string' ||
        entry.textHash.length === 0
      ) {
        throw new Error(`Invalid suppression baseline entry in ${baselinePath}`);
      }

      return {
        file: entry.file,
        line: entry.line,
        textHash: entry.textHash,
      };
    }),
  );
}

export async function writeSuppressionBaseline(baselinePath, entries) {
  await writeFile(
    baselinePath,
    `${JSON.stringify(sortBaselineEntries(entries), null, 2)}\n`,
    'utf8',
  );
}

export async function collectSuppressionMatches({
  root = ROOT,
  searchRoots = SEARCH_ROOTS,
  sourceSegment = SOURCE_SEGMENT,
} = {}) {
  const matchesByRoot = await Promise.all(
    searchRoots.map((searchRoot) =>
      walk(path.join(root, searchRoot), {
        root,
        sourceSegment,
      }),
    ),
  );
  const matches = matchesByRoot.flat();

  matches.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
  return matches;
}

export async function runSuppressionGuard({
  root = ROOT,
  baselinePath = BASELINE_PATH,
  searchRoots = SEARCH_ROOTS,
  regenerateBaseline = false,
  allowBaselineRegeneration = process.env[BASELINE_REGEN_ENV] === '1',
} = {}) {
  const matches = await collectSuppressionMatches({ root, searchRoots });
  const actualEntries = toBaselineEntries(matches);

  if (regenerateBaseline) {
    if (!allowBaselineRegeneration) {
      return {
        ok: false,
        matches,
        actualEntries,
        additions: [],
        removals: [],
        message: `Refusing to regenerate suppression baseline without ${BASELINE_REGEN_ENV}=1.`,
      };
    }

    await writeSuppressionBaseline(baselinePath, actualEntries);
    return {
      ok: true,
      matches,
      actualEntries,
      additions: [],
      removals: [],
      message: `No-BC guard baseline regenerated with ${matches.length} suppression marker(s).`,
    };
  }

  const baselineEntries = await readSuppressionBaseline(baselinePath);
  const comparison = compareSuppressionBaseline(matches, baselineEntries);
  const ok = comparison.additions.length === 0 && comparison.removals.length === 0;

  return {
    ok,
    matches,
    actualEntries: comparison.actualEntries,
    additions: comparison.additions,
    removals: comparison.removals,
    message: ok
      ? `No-BC guard passed: found ${matches.length} suppression marker(s), all match the path-aware baseline.`
      : `No-BC guard failed: found ${comparison.additions.length} added and ${comparison.removals.length} removed suppression marker(s).`,
  };
}

async function walk(directory, options) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const matchesByEntry = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        return [];
      }

      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walk(absolutePath, options);
      }

      if (!entry.isFile() || !TARGET_EXTENSIONS.has(path.extname(entry.name))) {
        return [];
      }

      if (!absolutePath.includes(options.sourceSegment)) {
        return [];
      }

      return scanFile(absolutePath, options.root);
    }),
  );

  return matchesByEntry.flat();
}

async function scanFile(absolutePath, root) {
  const content = await readFile(absolutePath, 'utf8');
  const relativePath = path.relative(root, absolutePath);
  const lines = content.split(/\r?\n/u);
  const matches = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = SUPPRESSION_PATTERN.exec(line);
    if (match) {
      matches.push({
        file: relativePath,
        line: index + 1,
        column: match.index + 1,
        text: line,
      });
    }
  }

  return matches;
}

function matchToEntry(match) {
  return {
    file: match.file,
    line: match.line,
    textHash: createSuppressionTextHash(match),
  };
}

function formatBaselineKey(entry) {
  return `${entry.file}:${String(entry.line)}:${entry.textHash}`;
}

function printGuardResult(result) {
  if (result.ok) {
    console.log(result.message);
    return;
  }

  console.error(result.message);

  if (result.additions.length > 0) {
    console.error('Added suppressions:');
    for (const match of result.additions) {
      console.error(`${match.file}:${match.line}:${match.column}: ${match.text.trim()}`);
    }
  }

  if (result.removals.length > 0) {
    console.error('Removed or moved baseline suppressions:');
    for (const entry of result.removals) {
      console.error(`${entry.file}:${entry.line}: ${entry.textHash}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runSuppressionGuard({
    regenerateBaseline: process.argv.includes('--regenerate-baseline'),
  });

  printGuardResult(result);
  if (!result.ok) {
    process.exit(1);
  }
}
