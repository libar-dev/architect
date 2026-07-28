/**
 * @architect
 * @architect-cli
 * @architect-pattern GraphHandleShapes
 * @architect-status completed
 * @architect-role:contract
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-usecase Read this file first when scripting the graph handle — the exposed shapes ARE the discovery surface.
 *
 * ## GraphHandleShapes — the exposed shapes of the two-surface graph handle
 *
 * This file IS the contract — read it, then script freely. No verb hides these;
 * a consumer validates the slice it touches and joins at will.
 *
 * Pure shapes only — no IO, no cli-runtime coupling. The two cores are BUILT, not
 * read: `buildMechanicalCore()` (extract.ts) and `buildAuthoredCore()` (authored.ts).
 * The handle reads NO dump — both cores build fresh in-process per `loadGraph()`.
 *
 * **Deliberate looseness (sanctioned exception to strictObject doctrine):** the
 * authored-side schemas use `looseObject` because they DECODE an already-validated
 * in-process graph (the trust boundary was `buildPatternGraph`, ADR-009 parse-once) —
 * they type what an agent should FIND, they do not gate what may exist. Under-typing
 * a shape hides a capability from an agent reading the contract; over-strictness
 * breaks the handle every time the upstream graph grows a field. The mechanical
 * side stays `strictObject` (this package owns that shape end-to-end).
 */
import { z } from 'zod';

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
// Loose on purpose where it counts (see header): the fat `code` payload rides
// untyped, but the Gherkin (scenarios/rules) + taxonomy-bearing `directive` are
// TYPED. An earlier iteration left these untyped and the richest half of the data
// went invisible — an agent reading the contract concluded scenarios didn't exist.
// For an AI-native surface the type IS the discovery surface; type what you want found.

// A parsed Gherkin scenario — already in the built core, one per `Scenario:` block.
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
  // peeled the value off the JSDoc tag). `directive.tags` only carries the bare key
  // `@architect-role` for TS patterns — reading the value from there silently drops
  // most TS patterns. Read the field.
  role: z.string().optional(),
  boundedContext: z.string().optional(),
  // hierarchy axis (`@architect-level` / `@architect-parent`). `parent` is the
  // epic→member membership backbone — it rides on the PATTERN here (NOT as a
  // relationshipIndex edge), so an agent that only reads relationshipIndex sees an
  // epic's members as orphans. Typed here so the handle can surface it + its inverse.
  level: z.string().optional(),
  parent: z.string().optional(),
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
  // The architectural-SIGNIFICANCE signals a curation pass needs: does this pattern
  // realize another (`implementsPatterns`), and does it enforce a decision
  // (`enforcesDecisions`)? Untyped, they were invisible to an agent reading the
  // contract — so a naive "is this noise?" filter over uses/usedBy alone
  // false-positived genuine realizers. Type → surface → the filter gets safe.
  implementsPatterns: z.array(z.string()).default([]),
  enforcesDecisions: z.array(z.string()).default([]),
});
export const AuthoredCoreSchema = z.looseObject({
  patterns: z.array(AuthoredPatternSchema),
  relationshipIndex: z.record(z.string(), AuthoredEdgeSchema),
});
export type AuthoredCore = z.infer<typeof AuthoredCoreSchema>;

// ─── the maturity axis (a REQUIREMENT, not a stored field) ───────────────────
// `@architect-maturity` is authored at exactly one tier (idea) and otherwise
// DERIVED from status (four-tier ladder + ADR-007). The built core stores 0 of these
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

// Builders (not loaders): the two cores are constructed fresh in-process, never
// read from disk. `buildMechanicalCore()` → extract.ts (tsc walk). `buildAuthoredCore()`
// → authored.ts (buildCliContext, the live PatternGraph). `loadGraph()` (graph.ts) joins them.
