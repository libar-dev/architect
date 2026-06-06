/**
 * The exposed shapes. This file IS the contract — read it, then script freely.
 * No verb hides these; a consumer validates the slice it touches and joins at will.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

export const DATA_DIR = join(import.meta.dirname, 'data');
export const MECH_PATH = join(DATA_DIR, 'mechanical-core.json');
export const AUTHORED_PATH = join(DATA_DIR, 'pattern-graph-core.json');

// ─── Layer 1: the mechanical substrate (derived, exhaustive) ─────────────────
export const SymbolNodeSchema = z.strictObject({
  id: z.string(), //  "<repo-rel file>#<name>"
  file: z.string(),
  name: z.string(),
  kind: z.enum(['function', 'class', 'interface', 'type', 'enum', 'const', 'default', 'reexport']),
  pkg: z.string(),
});
export const ImportEdgeSchema = z.strictObject({
  fromFile: z.string(),
  toFile: z.string(), //  DEFINING file, after following re-export barrels (not the barrel)
  symbol: z.string().nullable(), //  null for namespace/default imports
  kind: z.enum(['named', 'default', 'namespace']),
  typeOnly: z.boolean(),
  crossPkg: z.boolean(),
});
export const MechanicalCoreSchema = z.strictObject({
  version: z.literal('1.0.0'),
  head: z.string(),
  fileCount: z.number(),
  symbols: z.array(SymbolNodeSchema),
  edges: z.array(ImportEdgeSchema),
  unresolved: z.array(z.strictObject({ fromFile: z.string(), spec: z.string() })),
});
export type SymbolNode = z.infer<typeof SymbolNodeSchema>;
export type ImportEdge = z.infer<typeof ImportEdgeSchema>;
export type MechanicalCore = z.infer<typeof MechanicalCoreSchema>;

// ─── Layer 2: the curated graph (authored, sparse) ───────────────────────────
// Loose on purpose: validate only the fields the views touch, leave the fat
// `directive`/`scenarios`/`code` payload untyped so the snapshot shape can drift
// without breaking the playground.
export const AuthoredPatternSchema = z.looseObject({
  name: z.string(),
  status: z.string().default('?'),
  source: z.looseObject({ file: z.string() }).optional(),
});
export const AuthoredEdgeSchema = z.looseObject({
  uses: z.array(z.string()).default([]),
  usedBy: z.array(z.string()).default([]),
  implementedBy: z.array(z.looseObject({ file: z.string().optional() })).default([]),
});
export const AuthoredCoreSchema = z.looseObject({
  patterns: z.array(AuthoredPatternSchema),
  relationshipIndex: z.record(z.string(), AuthoredEdgeSchema),
});
export type AuthoredCore = z.infer<typeof AuthoredCoreSchema>;

// ─── loaders (the trust boundary; parse once) ────────────────────────────────
// `data/` is gitignored and regenerable, so on a fresh checkout these files are
// absent. Turn the raw ENOENT into a clear "how to regenerate" message.
function readSnapshot(path: string, hint: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT')
      throw new Error(`missing data file ${path}\n  → ${hint}`);
    throw e;
  }
}
export function loadMechanical(path = MECH_PATH): MechanicalCore {
  return MechanicalCoreSchema.parse(
    JSON.parse(readSnapshot(path, 'build it: pnpm exec tsx playground/extract.ts')),
  );
}
export function loadAuthored(path = AUTHORED_PATH): AuthoredCore {
  const hint =
    'regenerate: pnpm exec tsx --conditions=source ./scripts/snapshot-pattern-graph.ts --core playground/data/pattern-graph-core.json';
  return AuthoredCoreSchema.parse(JSON.parse(readSnapshot(path, hint)));
}
