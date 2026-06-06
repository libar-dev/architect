/**
 * Load a PatternGraph snapshot from disk into a Zod-validated, typed `PatternGraph`
 * for offline experimentation.
 *
 * Decodes through `createJsonInputCodec(PatternGraphSchema)` — the same Zod-backed
 * codec contract `snapshot-pattern-graph.ts` encodes with — so a snapshot that
 * loads is provably a valid read model (ADR-006). Import `loadPatternGraphSnapshot`
 * to get a `PatternGraph` you can poke at; or run the file directly for a summary.
 *
 * Usage:
 *   import { loadPatternGraphSnapshot } from './scripts/load-pattern-graph.js';
 *   const graph = await loadPatternGraphSnapshot();            // default snapshot path
 *   const graph = await loadPatternGraphSnapshot('path.json'); // explicit path
 *
 *   pnpm exec tsx --conditions=source ./scripts/load-pattern-graph.ts [inPath]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  PatternGraphSchema,
  createJsonInputCodec,
  type PatternGraph,
} from '@libar-dev/architect-core';

export const DEFAULT_SNAPSHOT_PATH = '.scratch/pattern-graph-snapshot.json';

const graphCodec = createJsonInputCodec(PatternGraphSchema);

/**
 * Read a snapshot file and decode it into a validated `PatternGraph`.
 * Throws with the formatted codec error if the file is missing, not JSON, or
 * does not satisfy `PatternGraphSchema`.
 */
export async function loadPatternGraphSnapshot(
  filePath: string = DEFAULT_SNAPSHOT_PATH,
): Promise<PatternGraph> {
  const resolved = path.resolve(process.cwd(), filePath);
  const content = await fs.readFile(resolved, 'utf8');
  const result = graphCodec.parse(content, resolved);
  if (!result.ok) {
    const { error } = result;
    const detail = (error.validationErrors ?? []).join('\n');
    throw new Error(
      `Failed to load PatternGraph snapshot: ${error.message}` +
        (detail.length > 0 ? `\n${detail}` : ''),
    );
  }
  return result.value;
}

async function main(): Promise<void> {
  const inPath = process.argv[2] ?? DEFAULT_SNAPSHOT_PATH;
  const graph = await loadPatternGraphSnapshot(inPath);

  // Prove the typed graph round-trips and is queryable in-process.
  const byStatus = Object.fromEntries(
    Object.entries(graph.byStatus).map(([status, patterns]) => [status, patterns.length]),
  );
  const topFanIn = Object.entries(graph.relationshipIndex)
    .map(([name, entry]) => ({ name, usedBy: entry.usedBy.length }))
    .sort((a, b) => b.usedBy - a.usedBy)
    .slice(0, 5);

  process.stdout.write(
    [
      `Loaded validated PatternGraph from ${inPath}`,
      `  patterns:   ${String(graph.patterns.length)}`,
      `  byStatus:   ${JSON.stringify(byStatus)}`,
      `  roleCount:  ${String(graph.roleCount)}`,
      `  most depended-on (usedBy):`,
      ...topFanIn.map((p) => `    ${p.name} ← ${String(p.usedBy)}`),
      '',
    ].join('\n'),
  );
}

// Run as a script only when invoked directly (not when imported).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
