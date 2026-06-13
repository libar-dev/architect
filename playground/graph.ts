/**
 * The graph handle — the AI-native read surface.
 *
 * One typed in-memory object. Load it once; the joins and the encoded-taxonomy
 * decode happen at construction, behind need-shaped accessors. An agent reads the
 * method list and sees the whole surface; every method returns PLAIN composable
 * data (no envelopes), so the agent scripts the rest in-process — the ~⅕-context
 * win, kept, with the sharp edges (load-both, peel `directive.tags`, the 2-hop
 * `implementedBy` join) removed.
 *
 * Design rule held here: the PUBLIC types below are shaped by what an agent NEEDS
 * (a pattern's role/maturity, its invariants, what reverifies). The snapshot's
 * shape — tag-encoding, the implementedBy hop, the `rule:<slug>` linkage, the dead
 * `layer` axis — is decode detail, hidden. Needs drive the surface, not storage.
 *
 *   import { loadGraph } from './graph.ts';
 *   const g = loadGraph();
 *   g.invariantsOf('packages/architect-core/src/foo.ts');  // → Invariant[], any maturity
 *   g.specsReverifying(changedFiles);                       // → AtRiskSpec[]
 */
import {
  type AuthoredCore,
  type AuthoredPattern,
  loadAuthored,
  loadMechanical,
  type Maturity,
  MATURITY_BY_STATUS,
  MATURITIES,
  type MechanicalCore,
  type Provenance,
  type Rule,
  type Scenario,
} from './schema.ts';
import {
  blastRadius as blastRadiusView,
  byFile as byFileView,
  bySymbol as bySymbolView,
  census as censusView,
  driftFlags as driftFlagsView,
  fanInCandidates as fanInView,
  findByConcept as findByConceptView,
  graphDiff as graphDiffView,
} from './views.ts';

// ═══ PUBLIC, need-shaped types ════════════════════════════════════════════════
// What an agent asks for — not what the JSON happens to store.

export interface PatternNode {
  name: string;
  status: string;
  maturity: Maturity; // derived (explicit tag wins) — the axis the snapshot omits
  role?: string;
  boundedContext?: string;
  productArea?: string;
  sourceFile?: string;
  uses: string[];
  usedBy: string[];
  ruleCount: number;
  scenarioCount: number;
}

/** An asserted invariant + how much we should trust it (maturity) and whether a live test proves it (provenance). */
export interface Invariant {
  rule: string; // the `Rule:` block name
  text: string; // the `**Invariant:**` prose, distilled
  pattern: string; // owning pattern
  maturity: Maturity;
  provenance: Provenance; // executable test vs authored working-spec
  featureFile: string;
  provenByScenarios: string[]; // scenarios that exercise it (decoded join)
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
}

// ═══ decode helpers (snapshot → need-shaped) ══════════════════════════════════
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

// pull the `**Invariant:**` clause out of a Rule description; fall back to the lead.
function distillInvariant(description: string): string {
  const m = description.match(/\*\*Invariant:\*\*\s*([\s\S]*?)(?:\n\s*\*\*|$)/);
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

  // private indices — built once, the joins the agent no longer re-derives
  #nodes = new Map<string, PatternNode>();
  #raw = new Map<string, AuthoredPattern>();
  #fileToPattern = new Map<string, string>();
  #implementedBy = new Map<string, string[]>(); // pattern → realizing .feature paths
  #features = new Map<string, FeatureEntry>(); // featureFile → its scenarios + rules

  constructor(mech: MechanicalCore, authored: AuthoredCore) {
    this.mech = mech;
    this.authored = authored;

    // 1. decode every pattern into a need-shaped node + index the raw record
    for (const p of authored.patterns) {
      this.#raw.set(p.name, p);
      const tags = p.directive?.tags ?? [];
      const rel = authored.relationshipIndex[p.name];
      const node: PatternNode = {
        name: p.name,
        status: p.status,
        maturity: deriveMaturity(p.status, tags),
        // structured field first (195/176 patterns); tag-peel only as a fallback for
        // any .feature pattern that carries the value-form tag but no structured field.
        role: p.role ?? tagValue(tags, '@architect-role:'),
        boundedContext: p.boundedContext ?? tagValue(tags, '@architect-bounded-context:'),
        productArea: p.productArea,
        sourceFile: p.source?.file,
        uses: rel?.uses ?? [],
        usedBy: rel?.usedBy ?? [],
        ruleCount: p.rules.length,
        scenarioCount: p.scenarios.length,
      };
      this.#nodes.set(p.name, node);
      if (p.source?.file?.endsWith('.ts')) this.#fileToPattern.set(p.source.file, p.name);
      const impl = (rel?.implementedBy ?? [])
        .map((i) => i.file)
        .filter((f): f is string => !!f && f.endsWith('.feature'));
      if (impl.length) this.#implementedBy.set(p.name, impl);
    }

    // 2. index Gherkin by feature file (scenarios grouped; rules from the .feature-sourced pattern)
    for (const p of authored.patterns) {
      const node = this.#nodes.get(p.name)!;
      for (const sc of p.scenarios) {
        const e = this.#feature(sc.featureFile, node);
        e.scenarios.push(sc);
      }
      if (p.source?.file?.endsWith('.feature') && p.rules.length) {
        const e = this.#feature(p.source.file, node);
        e.rules.push(...p.rules);
        e.ownerPattern = p.name;
      }
    }
  }

  #feature(file: string, owner: PatternNode): FeatureEntry {
    let e = this.#features.get(file);
    if (!e) {
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

  // ─── NEW: invariants of a pattern or file — ANY maturity, labeled ────────────
  // "What does this guarantee?" Gathers Rule blocks the pattern carries directly
  // (working-specs / executable features that ARE the source) AND those reached
  // through its realizing features. Each invariant is tagged maturity + provenance
  // so an executable-proven invariant and an idea-tier aspiration are never flattened.
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
    out.push({
      rule: r.name,
      text: distillInvariant(r.description),
      pattern,
      maturity,
      provenance: provenanceOf(featureFile),
      featureFile,
      provenByScenarios: this.#scenariosForRule(featureFile, r),
    });
  }

  #scenariosForRule(featureFile: string, r: Rule): string[] {
    if (r.scenarioNames.length) return r.scenarioNames; // populated 387/431 — trust the field
    const want = `rule:${slug(r.name)}`; // else decode the scenario `rule:<slug>` tag
    const e = this.#features.get(featureFile);
    return (e?.scenarios ?? [])
      .filter((sc) => sc.tags.some((t) => slug(t) === slug(want)))
      .map((sc) => sc.scenarioName);
  }

  // ─── NEW: specs that re-verify when these change — ANY maturity ──────────────
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
      out.push({
        scenario: sc.scenarioName,
        pattern,
        featureFile: sc.featureFile,
        ...(sc.line !== undefined ? { line: sc.line } : {}),
        maturity,
        provenance: provenanceOf(sc.featureFile),
        semanticTags: sc.semanticTags,
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
  // handle would be the first brick of the 50-verb wall. It lives inline in cli.ts.

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

// ─── the one entry point — load both cores, build the handle, parse once ─────
export function loadGraph(): Graph {
  return new Graph(loadMechanical(), loadAuthored());
}
