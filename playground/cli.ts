/**
 * Thin demo runner over the view library. The IO lives here (load, git, print);
 * the views stay pure. An agent can skip this entirely and import views.ts directly.
 *
 *   pnpm exec tsx playground/cli.ts <diff|blast|fan-in|drift|census|find|file|symbol> [arg]
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { loadGraph } from './graph.ts';
import { loadAuthored, loadMechanical, MATURITIES } from './schema.ts';
import {
  blastRadius,
  byFile,
  bySymbol,
  census,
  driftFlags,
  fanInCandidates,
  findByConcept,
  graphDiff,
} from './views.ts';

const REPO = resolve(import.meta.dirname, '..');
const cmd = process.argv[2] ?? 'help';
const arg = process.argv[3];

function diff() {
  const r = graphDiff(loadMechanical(), loadAuthored());
  console.log(`\nmechanical pattern→pattern edges: ${r.mechEdges}`);
  console.log(`authored   pattern→pattern edges: ${r.authEdges}`);
  console.log(`  shared (curated selection of the firehose): ${r.shared.length}`);
  console.log(`  dark   (import, no intent — editorial silence): ${r.dark.length}`);
  console.log(`  aspirational (intent, no import — conceptual / drift): ${r.aspirational.length}`);
  console.log(
    `  Jaccard similarity: ${r.jaccard}%  ← curation is a ~${r.jaccard}% overlap with the import graph, by design`,
  );
  console.log('\n  sample dark (correctly-omitted real deps):');
  for (const s of r.dark.slice(0, 8)) console.log(`    ${s}`);
}

// Untrusted CLI input must reduce to a VERIFIED COMMIT before it touches `git diff`.
// Three hazards, three layers:
//   1. shell injection            → execFileSync (no shell).
//   2. option injection           → charset guard (no leading `-`) + `--end-of-options`.
//   3. pathspec semantic injection → `git diff <arg>` reads <arg> as a PATH when it is
//      not a revision (silently changing what "changed" means). Defeat it by resolving
//      the input to a 40-hex commit SHA first — `^{commit}` peels it, `--verify` rejects
//      anything that is not exactly one commit — then diff that SHA with a trailing `--`
//      so the pathspec slot is provably empty.
function assertSafeRef(ref: string): string {
  if (!/^[A-Za-z0-9][\w./~^@{}:-]*$/.test(ref))
    throw new Error(
      `unsafe git ref ${JSON.stringify(ref)} — must start alphanumeric, ref-safe chars only`,
    );
  return ref;
}
function resolveCommit(ref: string): string {
  assertSafeRef(ref);
  try {
    return execFileSync(
      'git',
      ['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`],
      {
        encoding: 'utf8',
      },
    ).trim();
  } catch {
    throw new Error(
      `not a commit: ${JSON.stringify(ref)} (refusing to treat CLI input as a pathspec)`,
    );
  }
}

function blast() {
  const label = arg ?? 'HEAD';
  const sha = resolveCommit(label);
  const changed = execFileSync('git', ['diff', '--name-only', '--end-of-options', sha, '--'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  const r = blastRadius(loadMechanical(), loadAuthored(), changed);
  console.log(`\nblast radius of \`git diff ${label}\` (${sha.slice(0, 9)}):`);
  console.log(
    `  changed src files: ${r.changedSrc.length}  (${r.mappedSeed.length} map to a pattern)`,
  );
  console.log(`  authored-graph downstream:   ${r.authoredDownstream.length} patterns`);
  console.log(
    `  mechanical-graph downstream: ${r.mechFiles} files → ${r.mechPatterns.length} patterns`,
  );
  console.log(`  RECOVERED (curated graph missed): ${r.recovered.length}`);
  for (const n of r.recovered.slice(0, 20)) console.log(`    + ${n}`);
  if (r.recovered.length > 20) console.log(`    … +${r.recovered.length - 20}`);
  console.log(`  at-risk executable specs: ${r.atRiskSpecs.length}`);
  for (const f of r.atRiskSpecs.slice(0, 10)) console.log(`    ${f}`);
}

function fanIn() {
  const r = fanInCandidates(loadMechanical(), loadAuthored(), { min: arg ? Number(arg) : 4 });
  console.log(
    `\ncuration candidates — load-bearing modules with NO pattern node (top ${r.length}):`,
  );
  for (const c of r) console.log(`  ${String(c.fanIn).padStart(3)} importers  ${c.file}`);
}

function drift() {
  const r = driftFlags(loadAuthored(), (f) => existsSync(join(REPO, f)));
  console.log(`\nscoped drift (target code gone — should trend to zero as cleanup completes):`);
  console.log(`  dangling \`uses\` (target not in graph): ${r.dangling.length}`);
  for (const d of r.dangling.slice(0, 15)) console.log(`    ${d.from} → ${d.to}`);
  console.log(`  orphaned source (pattern file deleted): ${r.orphanedSource.length}`);
  for (const o of r.orphanedSource.slice(0, 15)) console.log(`    ${o.pattern}  (${o.file})`);
}

function censusCmd() {
  const r = census(loadMechanical(), loadAuthored());
  console.log(`\nnode coverage (non-barrel src → pattern node):`);
  for (const c of r.nodeCoverage)
    console.log(`  ${c.pkg.padEnd(22)} ${c.mapped}/${c.total} (${c.pct}%)`);
  console.log(`\nedge density (of ${r.patternCount} patterns):`);
  for (const [k, v] of Object.entries(r.edgeDensity))
    console.log(`  ${k.padEnd(16)} ${v} (${Math.round((v / r.patternCount) * 100)}%)`);
  console.log(
    `  fully edge-dark: ${r.edgeDark} (${Math.round((r.edgeDark / r.patternCount) * 100)}%)`,
  );
}

// ─── ENTRY ADAPTERS ───────────────────────────────────────────────────────────
// Inputs below are plain strings used only as match keys / map lookups — they
// never touch a shell or git (the views are pure; this runner only loads + prints).

// E1 — fuzzy concept → ranked patterns. Join trailing args so unquoted multi-word
// (`find blast radius`) works as well as quoted (`find "blast radius"`).
function find() {
  const query = process.argv.slice(3).join(' ').trim();
  if (!query) {
    console.log('usage: tsx playground/cli.ts find <concept>');
    process.exit(1);
  }
  const r = findByConcept(loadAuthored(), query);
  console.log(`\nfindByConcept(${JSON.stringify(query)}) — top ${r.length} (curated, core-only):`);
  if (!r.length) return void console.log('  (no matches)');
  for (const h of r) {
    const role = h.role ?? '—';
    const bc = h.boundedContext ?? '—';
    console.log(
      `  ${String(h.score).padStart(3)}  ${h.name.padEnd(44)} [${h.status}] role=${role} ctx=${bc}`,
    );
    console.log(`       matched on: ${h.matchedOn.join(', ')}`);
  }
}

// E2 — file → owning pattern + neighborhood (curated if mapped, else mechanical).
function file() {
  const path = arg;
  if (!path) {
    console.log('usage: tsx playground/cli.ts file <repo-relative-path>');
    process.exit(1);
  }
  const r = byFile(loadAuthored(), loadMechanical(), path);
  console.log(`\nbyFile(${JSON.stringify(path)}):`);
  if (r.mapped) {
    console.log(`  owning pattern: ${r.pattern}  (role=${r.role ?? '—'})`);
    console.log(`  curated neighborhood:`);
    console.log(
      `    uses (${r.curated.uses.length}):          ${r.curated.uses.join(', ') || '—'}`,
    );
    console.log(
      `    usedBy (${r.curated.usedBy.length}):        ${r.curated.usedBy.join(', ') || '—'}`,
    );
    console.log(
      `    implementedBy specs (${r.curated.implementedBy.length}): ${r.curated.implementedBy.join(', ') || '—'}`,
    );
  } else {
    console.log(`  owning pattern: (UNMAPPED — dark file; mechanical neighborhood below)`);
  }
  const fmt = (n: { file: string; pattern?: string }) =>
    `${n.file}${n.pattern ? `  → ${n.pattern}` : ''}`;
  const m = r.mechanical;
  console.log(`  mechanical imports OUT (${m.imports.length}):`);
  for (const n of m.imports.slice(0, 15)) console.log(`    ${fmt(n)}`);
  if (m.imports.length > 15) console.log(`    … +${m.imports.length - 15}`);
  console.log(`  mechanical importers IN (${m.importedBy.length}):`);
  for (const n of m.importedBy.slice(0, 15)) console.log(`    ${fmt(n)}`);
  if (m.importedBy.length > 15) console.log(`    … +${m.importedBy.length - 15}`);
}

// E3 — export symbol → defining pattern + importedBy.
function symbol() {
  const name = arg;
  if (!name) {
    console.log('usage: tsx playground/cli.ts symbol <ExportedSymbolName>');
    process.exit(1);
  }
  const r = bySymbol(loadMechanical(), loadAuthored(), name);
  console.log(`\nbySymbol(${JSON.stringify(name)}):`);
  console.log(`  defined in (${r.definedIn.length}):`);
  if (!r.definedIn.length) console.log(`    (no definition found in substrate)`);
  for (const d of r.definedIn)
    console.log(
      `    ${d.file}  [${d.kind}, ${d.pkg}]${d.pattern ? `  → ${d.pattern}` : '  (dark)'}`,
    );
  console.log(
    `  imported by ${r.importedByFiles.length} file(s), ${r.importedByPatterns.length} pattern(s):`,
  );
  for (const n of r.importedByPatterns.slice(0, 20)) console.log(`    pattern: ${n}`);
  if (r.importedByPatterns.length > 20)
    console.log(`    … +${r.importedByPatterns.length - 20} patterns`);
  for (const f of r.importedByFiles.slice(0, 15)) console.log(`    file: ${f}`);
  if (r.importedByFiles.length > 15) console.log(`    … +${r.importedByFiles.length - 15} files`);
}

// ─── MATURITY-SPANNING GHERKIN VIEWS (the handle) ─────────────────────────────
// "What does this guarantee?" / "What reverifies if I touch it?" / "Where do the
// non-implemented specs live?" — every result labeled maturity + provenance, so
// executable-proven and authored-only invariants are distinguished, never dropped.

const PROV = { executable: '✓exec', authored: '○auth' } as const;

// invariants <PatternName | repo/rel/file.ts>
function invariants() {
  const target = process.argv.slice(3).join(' ').trim();
  if (!target) {
    console.log('usage: tsx playground/cli.ts invariants <PatternName | path/to/file.ts>');
    process.exit(1);
  }
  const inv = loadGraph().invariantsOf(target);
  console.log(`\ninvariantsOf(${JSON.stringify(target)}) — ${inv.length} invariant(s):`);
  if (!inv.length) return void console.log('  (none — no Rule blocks reach this pattern/file)');
  for (const i of inv) {
    console.log(`  [${PROV[i.provenance]} · ${i.maturity}] ${i.rule}  (${i.pattern})`);
    console.log(`      ${i.text}`);
    if (i.provenByScenarios.length)
      console.log(
        `      proven by: ${i.provenByScenarios.slice(0, 3).join(' · ')}${i.provenByScenarios.length > 3 ? ' …' : ''}`,
      );
  }
}

// specs <git-ref>  — at-risk specs for the blast radius of a diff (any maturity)
function specs() {
  const label = arg ?? 'HEAD';
  const sha = resolveCommit(label);
  const changed = execFileSync('git', ['diff', '--name-only', '--end-of-options', sha, '--'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  const g = loadGraph();
  const r = g.blastRadius(changed);
  const at = r.atRiskSpecs;
  const exec = at.filter((s) => s.provenance === 'executable').length;
  console.log(`\nspecs re-verifying \`git diff ${label}\` (${sha.slice(0, 9)}):`);
  console.log(
    `  downstream patterns: ${r.mechPatterns.length}  → at-risk specs: ${at.length} (${exec} executable, ${at.length - exec} authored-only)`,
  );
  for (const s of at.slice(0, 20))
    console.log(`  [${PROV[s.provenance]} · ${s.maturity}] ${s.scenario}  (${s.pattern})`);
  if (at.length > 20) console.log(`  … +${at.length - 20}`);
}

// maturity  — the ladder. NOTE: this is a SCRIPT over the handle's exposed `maturity`
// field, not a handle method — exactly the "agent scripts the rest" boundary. Anything
// expressible as a few lines of groupBy stays here; only irreducible joins go on the handle.
function maturity() {
  const g = loadGraph();
  const rows = MATURITIES.map((m) => {
    const ps = g.patterns.filter((p) => p.maturity === m);
    const withInv = ps.filter((p) => p.ruleCount > 0);
    return {
      m,
      patterns: ps.length,
      withInvariants: withInv.length,
      invariants: withInv.reduce((n, p) => n + p.ruleCount, 0),
    };
  });
  console.log(`\nmaturity ladder (status-derived; explicit @architect-maturity wins):`);
  console.log(`  ${'maturity'.padEnd(12)} patterns  with-invariants  invariants`);
  for (const r of rows)
    console.log(
      `  ${r.m.padEnd(12)} ${String(r.patterns).padStart(8)}  ${String(r.withInvariants).padStart(14)}  ${String(r.invariants).padStart(10)}`,
    );
  console.log(
    `\n  (maturity = the authored tier ladder. Whether an invariant is a LIVE TEST vs an\n   authored working-spec is the per-invariant provenance axis — see \`invariants\`/\`specs\`.)`,
  );
}

const table: Record<string, () => void> = {
  diff,
  blast,
  'fan-in': fanIn,
  drift,
  census: censusCmd,
  find,
  file,
  symbol,
  invariants,
  specs,
  maturity,
};
const run = table[cmd];
if (!run) {
  console.log(
    'usage: tsx playground/cli.ts <diff|blast [ref]|fan-in [min]|drift|census|find <concept>|file <path>|symbol <name>|invariants <pattern|file>|specs [ref]|maturity>',
  );
  process.exit(cmd === 'help' ? 0 : 1);
}
run();
