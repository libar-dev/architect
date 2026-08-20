/**
 * @architect
 * @architect-cli
 * @architect-pattern GraphHandle
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-uses GraphHandleShapes, GraphHandleViews, AuthoredCoreBuilder, MechanicalSubstrateExtractor, PatternGraphApi
 * @architect-enforces-decision:ADR006SingleReadModelArchitecture
 * @architect-usecase Use as the agent read surface over the PatternGraph — load once, script cuts in-process, return conclusions not firehoses.
 *
 * ## GraphHandle — the AI-native read surface
 *
 * One typed in-memory object. Load it once; the joins and the encoded-taxonomy
 * decode happen at construction, behind need-shaped accessors. An agent reads the
 * method list and sees the whole surface; every method returns PLAIN composable
 * data (no envelopes), so the agent scripts the rest in-process — the ~⅕-context
 * win, kept, with the sharp edges (load-both, peel `directive.tags`, the 2-hop
 * `implementedBy` join) removed.
 *
 * Design rule held here: the PUBLIC types below are shaped by what an agent NEEDS
 * (a pattern's role/maturity, its invariants, what reverifies). The built core's
 * shape — tag-encoding, the implementedBy hop, the `rule:<slug>` linkage — is
 * decode detail, hidden. Needs drive the surface, not storage. The handle freezes
 * only irreducible cross-source joins (entry adapters, the spec bridge, the
 * firehose); everything else stays a script the agent writes.
 *
 * Primary surface is the `architect` bin (ADR-014), not a published package export:
 *   pnpm architect:q 'g.invariantsOf("packages/architect-core/src/foo.ts")'
 *   pnpm architect:q 'g.specsReverifying(changedFiles)'
 *
 * Dogfood / workspace scripts may import relatively:
 *   import { loadGraph } from '../../packages/architect-cli/src/handle/graph.ts';
 *   const g = await loadGraph(baseDir);                     // async: builds live from source
 */
import type { PatternGraphAPI } from '@libar-dev/architect-core';

import { buildAuthoredContext } from './authored.js';
import { buildMechanicalCore } from './extract.js';
import {
  type AuthoredCore,
  type AuthoredPattern,
  type Maturity,
  MATURITY_BY_STATUS,
  MATURITIES,
  type MechanicalCore,
  type Provenance,
  type Rule,
  type Scenario,
} from './schema.js';
import {
  blastRadius as blastRadiusView,
  byFile as byFileView,
  bySymbol as bySymbolView,
  census as censusView,
  driftFlags as driftFlagsView,
  fanInCandidates as fanInView,
  findByConcept as findByConceptView,
  graphDiff as graphDiffView,
} from './views.js';

// ═══ PUBLIC, need-shaped types ════════════════════════════════════════════════
// What an agent asks for — not what the JSON happens to store.

export interface PatternNode {
  name: string;
  status: string;
  maturity: Maturity; // derived (explicit tag wins) — the axis the built core omits
  role?: string | undefined;
  boundedContext?: string | undefined;
  productArea?: string | undefined;
  sourceFile?: string | undefined;
  level?: string | undefined; // @architect-level — epic / phase / task / slice (the hierarchy axis)
  parent?: string; // @architect-parent — the membership backbone
  children: string[]; // inverse of parent (computed) — an epic's members, first-class
  uses: string[];
  usedBy: string[];
  implementedBy: string[]; // realizing .feature files — a live test here ⇒ proven
  implements: string[]; // patterns this realizes (@architect-implements) — is-a-realizer signal
  enforcesDecisions: string[]; // ADRs this enforces — an architectural-significance signal
  ruleCount: number;
  scenarioCount: number;
}

/** An asserted invariant + how much we should trust it (maturity) and whether a live test proves it (provenance). */
export interface Invariant {
  rule: string; // the `Rule:` block name
  text: string; // the `**Invariant:**` prose, distilled
  pattern: string; // owning pattern (the realizing-feature pattern when reached via a realization edge)
  maturity: Maturity;
  provenance: Provenance; // executable test vs authored working-spec
  featureFile: string;
  provenByScenarios: string[]; // scenarios that exercise it (decoded join)
  // When this invariant is reached through a `.feature` that realizes MORE THAN ONE
  // pattern, the source attributes the Rule to the whole cohort, not to your query —
  // there is no per-Rule pattern tag to disambiguate. Present so the agent never reads
  // a sibling pattern's guarantee as the queried pattern's. Omitted when the realizing
  // feature is 1:1 (the result is then precise to `pattern`).
  cohort?: string[];
}

/** A spec that re-verifies when something upstream changes — labeled by maturity + provenance. */
export interface AtRiskSpec {
  scenario: string;
  pattern: string;
  featureFile: string;
  line?: number;
  maturity: Maturity;
  provenance: Provenance;
  semanticTags: string[]; // happy-path / validation — behavioral class
  // Same caveat as Invariant.cohort: the realizing `.feature` covers >1 pattern, so this
  // scenario re-verifies the cohort, not your single query target. Omitted when 1:1.
  cohort?: string[];
}

// ═══ decode helpers (core → need-shaped) ══════════════════════════════════════
const tagValue = (tags: string[], prefix: string): string | undefined => {
  for (const t of tags) if (t.startsWith(prefix)) return t.slice(prefix.length);
  return undefined;
};
const isMaturity = (v: string | undefined): v is Maturity =>
  !!v && (MATURITIES as readonly string[]).includes(v);

function deriveMaturity(status: string, tags: string[]): Maturity {
  const explicit = tagValue(tags, '@architect-maturity:'); // explicit always wins
  if (isMaturity(explicit)) return explicit;
  return MATURITY_BY_STATUS[status] ?? 'idea';
}
const provenanceOf = (featureFile: string): Provenance =>
  featureFile.includes('tests/features') ? 'executable' : 'authored';

// The coherence rule between the two axes. `executable` is the REALIZATION rung, and
// "a live verifier binds this" is exactly what executable provenance records — so
// `executable` maturity ⟺ `executable` provenance, by construction:
//   • a live test (executable provenance) sits AT the realization rung — never `idea`;
//   • an authored spec (no live test) is capped just BELOW it at `design` — never claims
//     the realization rung it hasn't reached.
// The honest signal this stops fabricating — a live-test-backed pattern whose own design
// status still lags — is a separate query (realized ∧ status<completed), not a maturity tag.
const specMaturity = (owner: Maturity, provenance: Provenance): Maturity =>
  provenance === 'executable' ? 'executable' : owner === 'executable' ? 'design' : owner;

// pull the `**Invariant:**` clause out of a Rule description; fall back to the lead.
function distillInvariant(description: string): string {
  const m = /\*\*Invariant:\*\*\s*([\s\S]*?)(?:\n\s*\*\*|$)/.exec(description);
  const text = (m?.[1] ?? description).replace(/\s+/g, ' ').trim();
  return text.length > 240 ? text.slice(0, 237) + '…' : text;
}
const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ═══ the handle ═══════════════════════════════════════════════════════════════
interface FeatureEntry {
  scenarios: Scenario[];
  rules: Rule[];
  ownerPattern?: string;
  maturity: Maturity;
  provenance: Provenance;
}

export class Graph {
  readonly mech: MechanicalCore;
  readonly authored: AuthoredCore;
  /**
   * The canonical PatternGraphAPI (ADR-006 read side) over the same live graph —
   * the deterministic-read escape hatch. Everything the retired verb CLI could
   * answer about pattern state is one method call here: `g.api.getPattern(name)`,
   * `g.api.isValidTransition(from, to)`, `g.api.getStatusCounts()`, …
   */
  readonly api: PatternGraphAPI;

  // private indices — built once, the joins the agent no longer re-derives
  #nodes = new Map<string, PatternNode>();
  #raw = new Map<string, AuthoredPattern>();
  #fileToPattern = new Map<string, string>();
  #implementedBy = new Map<string, string[]>(); // pattern → realizing .feature paths
  #featureCohort = new Map<string, string[]>(); // realizing .feature → ALL patterns it realizes (>1 ⇒ ambiguous)
  #features = new Map<string, FeatureEntry>(); // featureFile → its scenarios + rules

  constructor(mech: MechanicalCore, authored: AuthoredCore, api: PatternGraphAPI) {
    this.mech = mech;
    this.authored = authored;
    this.api = api;

    // 1. decode every pattern into a need-shaped node + index the raw record
    for (const p of authored.patterns) {
      this.#raw.set(p.name, p);
      const tags = p.directive?.tags ?? [];
      const rel = authored.relationshipIndex[p.name];
      const impl = (rel?.implementedBy ?? [])
        .map((i) => i.file)
        .filter((f): f is string => !!f && f.endsWith('.feature'));
      const node: PatternNode = {
        name: p.name,
        status: p.status,
        maturity: deriveMaturity(p.status, tags),
        // structured field first; tag-peel only as a fallback for any .feature
        // pattern that carries the value-form tag but no structured field.
        role: p.role ?? tagValue(tags, '@architect-role:'),
        boundedContext: p.boundedContext ?? tagValue(tags, '@architect-bounded-context:'),
        productArea: p.productArea,
        sourceFile: p.source?.file,
        level: p.level ?? tagValue(tags, '@architect-level:'),
        ...(p.parent ? { parent: p.parent } : {}), // exactOptionalPropertyTypes: omit when absent
        children: [], // filled by the inverse pass below, once every node exists
        uses: rel?.uses ?? [],
        usedBy: rel?.usedBy ?? [],
        implementedBy: impl, // realizing .feature files (the live-test-proven signal)
        implements: rel?.implementsPatterns ?? [],
        enforcesDecisions: rel?.enforcesDecisions ?? [],
        ruleCount: p.rules.length,
        scenarioCount: p.scenarios.length,
      };
      this.#nodes.set(p.name, node);
      if (p.source?.file.endsWith('.ts')) this.#fileToPattern.set(p.source.file, p.name);
      if (impl.length) this.#implementedBy.set(p.name, impl);
    }

    // 1a. invert `parent` → `children`. The membership edge lives on the pattern, not
    // the relationshipIndex, so an epic's members were orphans on the decoded surface.
    // Now `g.pattern(epic).children` IS the member set (a first-class read, no escape hatch).
    for (const node of this.#nodes.values())
      if (node.parent) this.#nodes.get(node.parent)?.children.push(node.name);
    for (const node of this.#nodes.values()) node.children.sort();

    // 1b. invert implementedBy → the cohort each realizing feature covers. A feature that
    // realizes >1 pattern attributes its Rule blocks to the whole cohort (no per-Rule tag
    // exists), so the spec-bridge must label that ambiguity rather than imply precision.
    for (const [pattern, feats] of this.#implementedBy)
      for (const f of feats) {
        let c = this.#featureCohort.get(f);
        if (!c) this.#featureCohort.set(f, (c = []));
        c.push(pattern);
      }
    for (const c of this.#featureCohort.values()) c.sort();

    // 2. index Gherkin by feature file (scenarios grouped; rules from the .feature-sourced pattern)
    for (const p of authored.patterns) {
      const node = this.#nodes.get(p.name);
      if (!node) continue;
      for (const sc of p.scenarios) {
        const e = this.#feature(sc.featureFile, node);
        e.scenarios.push(sc);
      }
      if (p.source?.file.endsWith('.feature') && p.rules.length) {
        const e = this.#feature(p.source.file, node);
        e.rules.push(...p.rules);
        e.ownerPattern = p.name;
      }
    }
  }

  #feature(file: string, owner: PatternNode): FeatureEntry {
    let e = this.#features.get(file);
    if (!e) {
      // Store the RAW owning-pattern maturity here; the coherence rule (executable
      // maturity ⟺ executable provenance) is applied uniformly at every emit site via
      // `specMaturity`, so it cannot be bypassed by the direct-scenario path.
      e = { scenarios: [], rules: [], maturity: owner.maturity, provenance: provenanceOf(file) };
      this.#features.set(file, e);
    }
    return e;
  }

  // ─── orient ────────────────────────────────────────────────────────────────
  pattern(name: string): PatternNode | undefined {
    return this.#nodes.get(name);
  }
  get patterns(): PatternNode[] {
    return [...this.#nodes.values()];
  }
  fileToPattern(file: string): string | undefined {
    return this.#fileToPattern.get(file);
  }

  // ─── entry adapters (the grep→graph bridge — delegate to the proven views) ───
  findByConcept(query: string, opts?: { limit?: number }) {
    return findByConceptView(this.authored, query, opts);
  }
  byFile(filePath: string) {
    return byFileView(this.authored, this.mech, filePath);
  }
  bySymbol(symbolName: string) {
    return bySymbolView(this.mech, this.authored, symbolName);
  }

  // ─── invariants of a pattern or file — ANY maturity, labeled ────────────────
  // "What does this guarantee?" Gathers Rule blocks the pattern carries directly
  // (working-specs / executable features that ARE the source) AND those reached
  // through its realizing features. Each invariant is tagged maturity + provenance
  // so an executable-proven invariant and an idea-tier aspiration are never flattened.
  //
  // EMPTY ≠ "guarantees nothing" — and an agent scripting the handle must not read it
  // that way. `[]` collapses three very different cases, which you disambiguate in one
  // cheap follow-up:
  //   • code-originated CONTRACT (`role:contract`/`codec`, a `.ts` sourceFile) — its
  //     guarantee is its TypeScript TYPE, not a Gherkin Rule. Check
  //     `g.pattern(x)?.sourceFile?.endsWith('.ts')` → go read the type there.
  //   • a real pattern that genuinely carries no invariants yet (a `.feature` source, [] rules).
  //   • an unresolved name/file (`g.pattern(x)` / `g.fileToPattern(x)` is undefined).
  // The `invariants` CLI command renders this note; the handle returns the raw [] so
  // script filters (`.length`/`.every`) stay simple — disambiguation is one line.
  invariantsOf(patternOrFile: string): Invariant[] {
    const seed = this.#resolvePatterns(patternOrFile);
    const out: Invariant[] = [];
    const seen = new Set<string>();
    for (const name of seed) {
      const raw = this.#raw.get(name);
      const node = this.#nodes.get(name);
      if (!raw || !node) continue;
      // direct rules (pattern source is a .feature)
      const directFile = raw.source?.file;
      if (directFile && raw.rules.length)
        for (const r of raw.rules)
          this.#pushInvariant(out, seen, r, name, directFile, node.maturity);
      // rules reached via realizing features
      for (const feat of this.#implementedBy.get(name) ?? []) {
        const e = this.#features.get(feat);
        if (!e) continue;
        for (const r of e.rules)
          this.#pushInvariant(out, seen, r, e.ownerPattern ?? name, feat, e.maturity);
      }
    }
    return out.sort((a, b) => a.pattern.localeCompare(b.pattern) || a.rule.localeCompare(b.rule));
  }

  #pushInvariant(
    out: Invariant[],
    seen: Set<string>,
    r: Rule,
    pattern: string,
    featureFile: string,
    maturity: Maturity,
  ): void {
    const key = `${featureFile}#${r.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    const cohort = this.#featureCohort.get(featureFile);
    const provenance = provenanceOf(featureFile);
    out.push({
      rule: r.name,
      text: distillInvariant(r.description),
      pattern,
      maturity: specMaturity(maturity, provenance),
      provenance,
      featureFile,
      provenByScenarios: this.#scenariosForRule(featureFile, r),
      ...(cohort && cohort.length > 1 ? { cohort } : {}),
    });
  }

  #scenariosForRule(featureFile: string, r: Rule): string[] {
    if (r.scenarioNames.length) return r.scenarioNames; // populated on most rules — trust the field
    const want = `rule:${slug(r.name)}`; // else decode the scenario `rule:<slug>` tag
    const e = this.#features.get(featureFile);
    return (e?.scenarios ?? [])
      .filter((sc) => sc.tags.some((t) => slug(t) === slug(want)))
      .map((sc) => sc.scenarioName);
  }

  // ─── specs that re-verify when these change — ANY maturity ──────────────────
  // Accepts changed files OR pattern names. Walks each seed pattern's own scenarios
  // + its realizing features' scenarios. The maturity/provenance label is the point:
  // a touched `completed` pattern surfaces executable specs; a touched `roadmap`
  // working-spec surfaces its authored-only scenarios — both, never just the tests.
  specsReverifying(filesOrPatterns: string[]): AtRiskSpec[] {
    const seed = new Set<string>();
    for (const x of filesOrPatterns) {
      const p = this.#fileToPattern.get(x) ?? (this.#nodes.has(x) ? x : undefined);
      if (p) seed.add(p);
    }
    return this.#specsForPatterns(seed);
  }

  #specsForPatterns(patterns: Set<string>): AtRiskSpec[] {
    const out: AtRiskSpec[] = [];
    const seen = new Set<string>();
    const emit = (sc: Scenario, pattern: string, maturity: Maturity) => {
      const key = `${sc.featureFile}#${sc.scenarioName}`;
      if (seen.has(key)) return;
      seen.add(key);
      const cohort = this.#featureCohort.get(sc.featureFile);
      const provenance = provenanceOf(sc.featureFile);
      out.push({
        scenario: sc.scenarioName,
        pattern,
        featureFile: sc.featureFile,
        ...(sc.line !== undefined ? { line: sc.line } : {}),
        maturity: specMaturity(maturity, provenance),
        provenance,
        semanticTags: sc.semanticTags,
        ...(cohort && cohort.length > 1 ? { cohort } : {}),
      });
    };
    for (const name of patterns) {
      const raw = this.#raw.get(name);
      const node = this.#nodes.get(name);
      if (!raw || !node) continue;
      for (const sc of raw.scenarios) emit(sc, name, node.maturity);
      for (const feat of this.#implementedBy.get(name) ?? []) {
        const e = this.#features.get(feat);
        if (e) for (const sc of e.scenarios) emit(sc, e.ownerPattern ?? name, e.maturity);
      }
    }
    return out.sort(
      (a, b) => a.featureFile.localeCompare(b.featureFile) || a.scenario.localeCompare(b.scenario),
    );
  }

  // NB: there is deliberately NO `maturityLadder()` method. The spread of patterns
  // across the axis is `groupBy(g.patterns, p => p.maturity)` — a 3-line script over
  // the already-exposed `maturity` field, not an irreducible join. Putting it on the
  // handle would be the first brick of a rebuilt verb wall. It lives inline in the CLI.

  // ─── impact / curation-assist (delegate to the proven pure views) ────────────
  // blastRadius gains scenario reach: feed its full downstream pattern set to the
  // maturity-aware spec walker so at-risk specs span tiers AND reach dark files.
  blastRadius(changedFiles: string[]) {
    const r = blastRadiusView(this.mech, this.authored, changedFiles);
    const atRisk = this.#specsForPatterns(new Set(r.mechPatterns));
    return { ...r, atRiskSpecs: atRisk };
  }
  fanInCandidates(opts?: { min?: number; limit?: number }) {
    return fanInView(this.mech, this.authored, opts);
  }
  graphDiff() {
    return graphDiffView(this.mech, this.authored);
  }
  driftFlags(existsOnDisk: (file: string) => boolean) {
    return driftFlagsView(this.authored, existsOnDisk);
  }
  census() {
    return censusView(this.mech, this.authored);
  }

  // ─── internal: resolve a name-or-file to the pattern set it touches ──────────
  #resolvePatterns(patternOrFile: string): string[] {
    if (this.#nodes.has(patternOrFile)) return [patternOrFile];
    const direct = this.#fileToPattern.get(patternOrFile);
    return direct ? [direct] : [];
  }
}

// ─── the one entry point — build both cores LIVE, join, parse once ───────────
// Async because the authored core is built from the live pipeline (buildCliContext).
// Each call reflects the working tree (~1.5s): no dump. When running from
// workspace source, run with `--conditions=source` (see authored.ts) or the
// authored side resolves stale dist/.
export async function loadGraph(baseDir: string): Promise<Graph> {
  const { core, api } = await buildAuthoredContext(baseDir);
  return new Graph(buildMechanicalCore(baseDir), core, api);
}
