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
// Loose on purpose where it counts: still `looseObject` so the fat `code` payload
// rides untyped, but we now TYPE the Gherkin (scenarios/rules) + taxonomy-bearing
// `directive`. The prior playground left these untyped and the richest half of the
// data went invisible — an agent reading the contract concluded scenarios didn't
// exist. For an AI-native surface the type IS the discovery surface; type what you
// want found.

// A parsed Gherkin scenario — already in the snapshot, one per `Scenario:` block.
export const ScenarioSchema = z.looseObject({
  featureFile: z.string(),
  featureName: z.string().optional(),
  scenarioName: z.string().default(''),
  steps: z.array(z.looseObject({ keyword: z.string(), text: z.string() })).default([]),
  tags: z.array(z.string()).default([]),
  semanticTags: z.array(z.string()).default([]),
  layer: z.string().optional(),
  line: z.number().optional(),
});
// A `Rule:` block — the *invariant* carrier. `description` holds the `**Invariant:**`
// (and sometimes `**Rationale:**`) prose verbatim.
export const RuleSchema = z.looseObject({
  name: z.string(),
  description: z.string().default(''),
  scenarioCount: z.number().default(0),
  scenarioNames: z.array(z.string()).default([]),
});
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Rule = z.infer<typeof RuleSchema>;

export const AuthoredPatternSchema = z.looseObject({
  name: z.string(),
  status: z.string().default('?'),
  source: z.looseObject({ file: z.string() }).optional(),
  // role / bounded-context are STRUCTURED top-level fields (the extractor already
  // peeled the value off the JSDoc tag): populated on 195 / 176 of 293 patterns.
  // `directive.tags` only carries the bare key `@architect-role` for TS patterns —
  // reading the value from there silently drops ~167 of them. Read the field.
  role: z.string().optional(),
  boundedContext: z.string().optional(),
  // directive still typed for `description` + the value-form tags some .feature
  // patterns carry (a fallback, not the primary source).
  directive: z
    .looseObject({ tags: z.array(z.string()).default([]), description: z.string().optional() })
    .optional(),
  whenToUse: z.array(z.string()).default([]),
  productArea: z.string().optional(),
  scenarios: z.array(ScenarioSchema).default([]),
  rules: z.array(RuleSchema).default([]),
});
export type AuthoredPattern = z.infer<typeof AuthoredPatternSchema>;
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

// ─── the maturity axis (a REQUIREMENT, not a stored field) ───────────────────
// `@architect-maturity` is authored at exactly one tier (idea) and otherwise
// DERIVED from status (four-tier ladder + ADR-007). The snapshot stores 0 of these
// as a field — so the handle derives it. An explicit `@architect-maturity:` tag in
// directive.tags always wins (`formal-spec/04` "explicit always wins").
export const MATURITIES = ['idea', 'plan', 'design', 'executable'] as const;
export type Maturity = (typeof MATURITIES)[number];
export const MATURITY_BY_STATUS: Record<string, Maturity> = {
  candidate: 'idea', // idea + candidate tiers both → consideration track
  roadmap: 'plan',
  active: 'design',
  completed: 'executable',
};
// Provenance answers a different question than maturity: is this spec a LIVE TEST
// (`tests/features/**`) or an AUTHORED working-spec (`architect/specs|decisions/**`)?
// "Specs of any maturity, both implemented and non-implemented" = report both axes,
// drop neither.
export type Provenance = 'executable' | 'authored';

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
