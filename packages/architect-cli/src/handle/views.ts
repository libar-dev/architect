/**
 * @architect
 * @architect-cli
 * @architect-pattern GraphHandleViews
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-uses GraphHandleShapes
 * @architect-usecase Use via the Graph handle; import directly only for pure-function composition in scripts.
 *
 * ## GraphHandleViews — the trusted view library
 *
 * Pure functions over the two loaded layers — this is the small, validated core
 * (correctness guaranteed here) that the agent scripts around. Two families:
 *
 *   IMPACT      blastRadius   — exhaustive, draws on Layer 1 (the firehose). Safety.
 *   ARCHITECTURE/ASSIST  graphDiff · fanInCandidates · driftFlags · census
 *                       — read Layer 2 against Layer 1 to surface curation work.
 *
 * None of these mutate the curated graph or derive architecture from code; they
 * answer impact and propose curation, keeping the editorial layer human-owned.
 */
import type { AuthoredCore, MechanicalCore } from './schema.js';

// ─── join primitives ─────────────────────────────────────────────────────────
export function fileToPattern(authored: AuthoredCore): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of authored.patterns)
    if (p.source?.file.endsWith('.ts')) m.set(p.source.file, p.name);
  return m;
}
export function isDecisionPattern(authored: AuthoredCore, name: string): boolean {
  return authored.patterns.find((p) => p.name === name)?.source?.file.endsWith('.feature') === true;
}

// role / bounded-context are STRUCTURED top-level fields (`p.role` / `p.boundedContext`).
// They are ALSO present value-form in some .feature patterns' `directive.tags` — but TS
// patterns store only the bare key `@architect-role` there, so peeling the tag drops most
// of them. Read the field; fall back to the tag only when the field is absent.
function tagValue(p: unknown, prefix: string): string | undefined {
  const tags = (p as { directive?: { tags?: unknown } }).directive?.tags;
  if (!Array.isArray(tags)) return undefined;
  for (const t of tags as string[])
    if (typeof t === 'string' && t.startsWith(prefix) && t.length > prefix.length)
      return t.slice(prefix.length);
  return undefined;
}
export const roleOf = (p: unknown): string | undefined =>
  (p as { role?: string }).role ?? tagValue(p, '@architect-role:');
export const contextOf = (p: unknown): string | undefined =>
  (p as { boundedContext?: string }).boundedContext ?? tagValue(p, '@architect-bounded-context:');

const mechPatternEdges = (mech: MechanicalCore, f2p: Map<string, string>): Set<string> => {
  const s = new Set<string>();
  for (const e of mech.edges) {
    const f = f2p.get(e.fromFile);
    const t = f2p.get(e.toFile);
    if (f && t && f !== t) s.add(`${f}→${t}`);
  }
  return s;
};
const authoredUsesEdges = (authored: AuthoredCore): Set<string> => {
  const s = new Set<string>();
  for (const [n, e] of Object.entries(authored.relationshipIndex))
    for (const u of e.uses) s.add(`${n}→${u}`);
  return s;
};

// ─── VIEW: graphDiff — mechanical (barrel-followed) vs authored `uses` ────────
export function graphDiff(mech: MechanicalCore, authored: AuthoredCore) {
  const f2p = fileToPattern(authored);
  const M = mechPatternEdges(mech, f2p);
  const A = authoredUsesEdges(authored);
  const shared = [...M].filter((p) => A.has(p));
  const dark = [...M].filter((p) => !A.has(p)); // real import, no curated intent (mostly correct editorial silence)
  const aspirational = [...A].filter((p) => !M.has(p)); // curated intent, no import (conceptual, or drift)
  const union = new Set([...M, ...A]).size;
  return {
    mechEdges: M.size,
    authEdges: A.size,
    shared,
    dark,
    aspirational,
    jaccard: Math.round((shared.length / union) * 100),
  };
}

// ─── VIEW: blastRadius — IMPACT, exhaustive over the substrate ────────────────
// "I changed these files — what's downstream and which executable specs re-verify?"
// Draws on Layer 1 so it reaches the src the curated graph deliberately omits.
export function blastRadius(mech: MechanicalCore, authored: AuthoredCore, changedFiles: string[]) {
  const f2p = fileToPattern(authored);
  // KNOWN SCOPE EDGE (intentional): the seed is `.ts` SOURCE files only (f2p is
  // .ts-keyed; this filter drops `.feature`/test files). So "I edited a `.feature`"
  // produces no impact here — code-impact is the designed scope. Reverse-traceability
  // from a spec edit is a separate question, not this view.
  const changedSrc = changedFiles.filter(
    (f) => /^packages\/[^/]+\/src\/.*\.ts$/.test(f) && !/\.(steps|test)\.ts$/.test(f),
  );

  // reverse import index: file → files that import it
  const importedBy = new Map<string, Set<string>>();
  for (const e of mech.edges) {
    let rev = importedBy.get(e.toFile);
    if (!rev) {
      rev = new Set();
      importedBy.set(e.toFile, rev);
    }
    rev.add(e.fromFile);
  }

  // mechanical transitive downstream (file-level — covers dark files)
  const mechFiles = new Set(changedSrc);
  const q = [...changedSrc];
  for (let f = q.shift(); f !== undefined; f = q.shift()) {
    for (const d of importedBy.get(f) ?? []) {
      if (!mechFiles.has(d)) {
        mechFiles.add(d);
        q.push(d);
      }
    }
  }
  const mechPatterns = new Set([...mechFiles].map((f) => f2p.get(f)).filter(Boolean) as string[]);

  // authored transitive downstream (curated `usedBy`), for contrast
  const seed = new Set(changedSrc.map((f) => f2p.get(f)).filter(Boolean) as string[]);
  const authImpact = new Set(seed);
  const q2 = [...seed];
  for (let n = q2.shift(); n !== undefined; n = q2.shift()) {
    for (const d of authored.relationshipIndex[n]?.usedBy ?? []) {
      if (!authImpact.has(d)) {
        authImpact.add(d);
        q2.push(d);
      }
    }
  }

  // Feature-FILE paths (the coarse view answer). NB distinct from the handle's
  // `blastRadius().atRiskSpecs: AtRiskSpec[]` (per-scenario, maturity-labeled) — the
  // names must not collide, since the handle spreads this view then overrides. Named
  // `atRiskFeatureFiles` here so both coexist instead of one silently shadowing.
  const atRiskFeatureFiles = new Set<string>();
  for (const n of mechPatterns)
    for (const impl of authored.relationshipIndex[n]?.implementedBy ?? [])
      if (impl.file?.endsWith('.feature')) atRiskFeatureFiles.add(impl.file);

  const recovered = [...mechPatterns].filter((n) => !authImpact.has(n) && !seed.has(n));
  return {
    changedSrc,
    mappedSeed: [...seed],
    authoredDownstream: [...authImpact].filter((n) => !seed.has(n)),
    mechFiles: mechFiles.size - changedSrc.length,
    mechPatterns: [...mechPatterns],
    recovered, // patterns the curated graph MISSED (the safety delta)
    atRiskFeatureFiles: [...atRiskFeatureFiles].sort(),
  };
}

// ─── VIEW: fanInCandidates — CURATION ASSIST ──────────────────────────────────
// "Which modules are load-bearing (high fan-in) but carry NO pattern node?"
// The shortlist a human should consider annotating — derived proposal, human decides.
export function fanInCandidates(
  mech: MechanicalCore,
  authored: AuthoredCore,
  opts: { min?: number; limit?: number } = {},
) {
  const { min = 4, limit = 30 } = opts;
  const f2p = fileToPattern(authored);
  const fanIn = new Map<string, Set<string>>();
  for (const e of mech.edges) {
    if (e.fromFile === e.toFile) continue;
    let importers = fanIn.get(e.toFile);
    if (!importers) {
      importers = new Set();
      fanIn.set(e.toFile, importers);
    }
    importers.add(e.fromFile);
  }
  return [...fanIn.entries()]
    .map(([file, importers]) => ({
      file,
      fanIn: importers.size,
      pkg: /^packages\/([^/]+)\//.exec(file)?.[1] ?? '(root)',
      annotated: f2p.has(file),
    }))
    .filter((c) => c.fanIn >= min && !c.annotated && !c.file.endsWith('/index.ts')) // barrels excluded: aggregation, not units
    .sort((a, b) => b.fanIn - a.fanIn)
    .slice(0, limit);
}

// ─── VIEW: driftFlags — SCOPED, unambiguous drift (target code gone) ──────────
// Not the fuzzy aspirational bucket — only the two mechanical "code is gone" signals,
// which trend monotonically to zero as cleanup completes.
export function driftFlags(authored: AuthoredCore, existsOnDisk: (file: string) => boolean) {
  const patternNames = new Set(Object.keys(authored.relationshipIndex));
  const dangling: { from: string; to: string }[] = [];
  for (const [n, e] of Object.entries(authored.relationshipIndex))
    for (const u of e.uses) if (!patternNames.has(u)) dangling.push({ from: n, to: u }); // target not in graph → deleted

  const orphanedSource: { pattern: string; file: string }[] = [];
  for (const p of authored.patterns)
    if (p.source?.file.endsWith('.ts') && !existsOnDisk(p.source.file))
      orphanedSource.push({ pattern: p.name, file: p.source.file });

  return { dangling, orphanedSource };
}

// ─── VIEW: census — node + edge annotation coverage (the gap, per package) ────
export function census(mech: MechanicalCore, authored: AuthoredCore) {
  const f2p = fileToPattern(authored);
  const byPkg = new Map<string, { srcFiles: Set<string>; mapped: number }>();
  for (const s of mech.symbols) {
    const pkg = s.pkg;
    const rec = byPkg.get(pkg) ?? { srcFiles: new Set<string>(), mapped: 0 };
    rec.srcFiles.add(s.file);
    byPkg.set(pkg, rec);
  }
  // barrels (index.ts) are excluded from the denominator below: aggregation, not units.
  const nodeCoverage = [...byPkg.entries()]
    .map(([pkg, rec]) => {
      const nonBarrel = [...rec.srcFiles].filter((f) => !f.endsWith('/index.ts'));
      const mapped = nonBarrel.filter((f) => f2p.has(f)).length;
      return {
        pkg,
        mapped,
        total: nonBarrel.length,
        pct: Math.round((mapped / Math.max(nonBarrel.length, 1)) * 100),
      };
    })
    .sort((a, b) => a.pkg.localeCompare(b.pkg));

  const KINDS = ['uses', 'usedBy', 'implementedBy'] as const;
  const N = authored.patterns.length;
  const edgeDensity: Record<string, number> = {};
  let edgeDark = 0;
  for (const e of Object.values(authored.relationshipIndex)) {
    let any = 0;
    for (const k of KINDS) {
      const len = Array.isArray(e[k]) ? e[k].length : 0;
      if (len) edgeDensity[k] = (edgeDensity[k] ?? 0) + 1;
      any += len;
    }
    if (!any) edgeDark++;
  }
  return { nodeCoverage, edgeDensity, edgeDark, patternCount: N };
}

// ═══ ENTRY ADAPTERS ═══════════════════════════════════════════════════════════
// Agents never start from a pattern *name* — they start from a concept string, a
// file, or a symbol, then grep to bridge into the graph. These three ARE that
// bridge. All inputs are used only as match keys / map lookups — never shelled.

// tokenize → lowercased word set (deterministic, no fuzzy lib)
const tokens = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** A ranked findByConcept match — `matchedOn` names the fields that hit. */
export interface ConceptHit {
  name: string;
  role?: string | undefined;
  boundedContext?: string | undefined;
  status: string;
  score: number;
  matchedOn: string[];
}

// ─── E1: findByConcept — CURATED ──────────────────────────────────────────────
// Fuzzy concept string → ranked patterns. Scores case-insensitive substring +
// token-overlap against, in descending weight: name, whenToUse[], productArea,
// directive.description. `matchedOn` reports which fields hit. Default limit 12.
export function findByConcept(
  authored: AuthoredCore,
  query: string,
  opts: { limit?: number } = {},
) {
  const { limit = 12 } = opts;
  const qLower = query.toLowerCase().trim();
  const qTokens = tokens(query);
  if (!qLower) return [];

  // weight per field; full-substring hit beats token-overlap, name beats the rest.
  const FIELDS = [
    { key: 'name', weight: 10 },
    { key: 'whenToUse', weight: 5 },
    { key: 'productArea', weight: 3 },
    { key: 'description', weight: 2 },
  ] as const;

  const out: ConceptHit[] = [];
  for (const p of authored.patterns) {
    const wt = (p as { whenToUse?: unknown }).whenToUse;
    const fields: Record<string, string> = {
      name: (p as { name?: string }).name ?? '',
      whenToUse: (Array.isArray(wt) ? wt.map(String) : []).join(' '),
      productArea: (p as { productArea?: string }).productArea ?? '',
      description: (p as { directive?: { description?: string } }).directive?.description ?? '',
    };
    let score = 0;
    const matchedOn: string[] = [];
    for (const { key, weight } of FIELDS) {
      const hay = (fields[key] ?? '').toLowerCase();
      if (!hay) continue;
      let fieldScore = 0;
      if (hay.includes(qLower)) fieldScore += weight * 2; // whole-query substring: strongest signal
      const hayTokens = new Set(tokens(hay));
      const overlap = qTokens.filter((t) => hayTokens.has(t)).length;
      if (overlap) fieldScore += weight * overlap; // per-token overlap
      if (fieldScore) {
        score += fieldScore;
        matchedOn.push(key);
      }
    }
    if (score > 0)
      out.push({
        name: fields['name'] ?? '',
        role: roleOf(p),
        boundedContext: contextOf(p),
        status: (p as { status?: string }).status ?? '?',
        score,
        matchedOn,
      });
  }
  // rank by score desc, then name for stable/deterministic ordering
  return out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit);
}

// ─── E2: byFile — BOTH surfaces ───────────────────────────────────────────────
// Repo-relative file → owning pattern + CURATED neighborhood (uses/usedBy/specs).
// If unmapped (a "dark" file), still returns value: the MECHANICAL neighborhood
// (imports out / importers in), each neighbor's owning pattern if any.
export function byFile(authored: AuthoredCore, mech: MechanicalCore, filePath: string) {
  const f2p = fileToPattern(authored);
  const pattern = f2p.get(filePath);

  // mechanical neighborhood is always available — the whole point for dark files.
  const importsSeen = new Set<string>();
  const imports: { file: string; pattern?: string }[] = [];
  for (const e of mech.edges)
    if (e.fromFile === filePath && e.toFile !== filePath && !importsSeen.has(e.toFile)) {
      importsSeen.add(e.toFile);
      const owner = f2p.get(e.toFile);
      imports.push({ file: e.toFile, ...(owner !== undefined ? { pattern: owner } : {}) });
    }
  const importedSeen = new Set<string>();
  const importedBy: { file: string; pattern?: string }[] = [];
  for (const e of mech.edges)
    if (e.toFile === filePath && e.fromFile !== filePath && !importedSeen.has(e.fromFile)) {
      importedSeen.add(e.fromFile);
      const owner = f2p.get(e.fromFile);
      importedBy.push({ file: e.fromFile, ...(owner !== undefined ? { pattern: owner } : {}) });
    }
  const sortByFile = (a: { file: string }, b: { file: string }) => a.file.localeCompare(b.file);
  const mechanical = { imports: imports.sort(sortByFile), importedBy: importedBy.sort(sortByFile) };

  if (!pattern) return { file: filePath, mapped: false as const, mechanical };

  // curated neighborhood: the architecture's answer
  const e = authored.relationshipIndex[pattern];
  const curated = {
    uses: (e?.uses ?? []).slice().sort(),
    usedBy: (e?.usedBy ?? []).slice().sort(),
    implementedBy: (e?.implementedBy ?? [])
      .map((i) => i.file)
      .filter((f): f is string => !!f && f.endsWith('.feature'))
      .sort(),
  };
  return {
    file: filePath,
    mapped: true as const,
    pattern,
    role: roleOf(authored.patterns.find((p) => p.name === pattern)),
    curated,
    mechanical,
  };
}

// ─── E3: bySymbol — SUBSTRATE ─────────────────────────────────────────────────
// Exported symbol name → defining file(s) + who imports it. Uses substrate
// symbols[] (definition) and edges[] (usage by `symbol`). Maps file→pattern on
// both ends. Handles 0 matches and multiple definitions cleanly.
export function bySymbol(mech: MechanicalCore, authored: AuthoredCore, symbolName: string) {
  const f2p = fileToPattern(authored);
  const definedIn = mech.symbols
    .filter((s) => s.name === symbolName)
    .map((sym) => {
      const owner = f2p.get(sym.file);
      return {
        file: sym.file,
        kind: sym.kind,
        pkg: sym.pkg,
        ...(owner !== undefined ? { pattern: owner } : {}),
      };
    })
    .sort((a, b) => a.file.localeCompare(b.file));

  // every import edge carrying this symbol → importing file (dedup)
  const fileSet = new Set<string>();
  for (const e of mech.edges) if (e.symbol === symbolName) fileSet.add(e.fromFile);
  const importedByFiles = [...fileSet].sort();
  const importedByPatterns = [
    ...new Set(importedByFiles.map((f) => f2p.get(f)).filter((n): n is string => !!n)),
  ].sort();

  return { symbol: symbolName, definedIn, importedByFiles, importedByPatterns };
}
