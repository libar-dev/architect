/**
 * @architect
 * @architect-cli
 * @architect-pattern GraphHandleCli
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-uses GraphHandle, GraphHandleViews, AuthoredCoreBuilder, MechanicalSubstrateExtractor, CLIRuntimePaths, CLIContextTypes
 * @architect-enforces-decision:ADR014AgentReadSurface
 * @architect-usecase The `architect` bin — the agent read surface: `architect q '<js>'` evals against the live graph handle; named commands are thin demos; `architect dangling` is the CI graph-integrity gate.
 *
 * ## GraphHandleCli — the `architect` bin (agent read surface + the one machine gate)
 *
 * Replaces the retired verb CLI (ADR-014): instead of pre-computed per-question
 * envelopes, agents script the live graph handle (`g`) in plain JS and only the
 * conclusion returns. Two kinds of command live here, deliberately:
 *
 *   • `q` + the named demo commands — the AGENT surface. Nothing here is a machine
 *     contract; the demos are runnable documentation over the handle, and any cut
 *     they don't pre-bake is one `q` script away.
 *   • `dangling` — the ONE machine contract (CI graph-integrity gate). It has a
 *     second machine consumer (`ci:verify`), so it is frozen here by the
 *     second-caller bar; everything else stays scriptable.
 *
 * eval() in `q` is deliberate: dev-only, the caller's own code, same trust level
 * as the shell that invoked it (like `node -e`). The graph is read-only state.
 *
 * When running from workspace source (dogfood), invoke with `--conditions=source`
 * so `@libar-dev/*` resolves live `src/*.ts` — the root `architect:q` /
 * `architect:graph` scripts bake the flag in. The published bin runs compiled
 * dist/ and needs no flag.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { isatty } from 'node:tty';
import { Script } from 'node:vm';
import { inspect } from 'node:util';

import {
  compareDanglingBaseline,
  DANGLING_BASELINE_SOURCE_PATH,
  writeDanglingBaseline,
} from '@libar-dev/architect-guard';
import { z } from 'zod';

import { buildCliContext } from './cli-runtime.js';
import type { BuildContextArgs } from './cli-types.js';
import { readCliPackageMetadata, resolveCliBaseDirArg } from './runtime-helpers.js';
import { loadGraph } from '../handle/graph.js';
import { MATURITIES } from '../handle/schema.js';

// ─── argv: [--base-dir <dir>] <command> [args…] ──────────────────────────────
// Zod-first boundary: the flag values this bin consumes are validated through
// strict schemas before use (`q` bodies are CODE — the sanctioned exception).
const GlobalFlagsSchema = z.strictObject({ baseDir: z.string().min(1) });
const rawArgs = process.argv.slice(2);
let baseDirInput = '.';
const rest: string[] = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--base-dir') {
    const v = rawArgs[i + 1];
    if (v === undefined) fail('--base-dir requires a value');
    baseDirInput = v;
    i++;
  } else if (a !== undefined) rest.push(a);
}
const BASE_DIR = resolveCliBaseDirArg(GlobalFlagsSchema.parse({ baseDir: baseDirInput }).baseDir);
const cmd = rest[0] ?? 'help';
const cmdArgs = rest.slice(1);

function fail(msg: string): never {
  console.error(`architect: ${msg}`);
  process.exit(1);
}

const USAGE = [
  'architect — the graph-handle CLI (agent read surface over the PatternGraph)',
  '',
  'usage: architect [--base-dir <dir>] <command> [args]',
  '',
  'the front door:',
  "  q '<js>'              eval JS with `g` (the live graph handle) in scope; argv may be",
  '                        an expression or a statement body ending in `return …`',
  '  q < script.js         multi-line script from stdin (plain JS function body)',
  '',
  'named demos (each is a script over the handle — runnable documentation):',
  '  census                node/edge annotation coverage per package',
  '  diff                  mechanical ⋈ authored edges: shared / dark / aspirational',
  '  blast [ref]           impact of `git diff <ref>`: downstream + at-risk specs',
  '  fan-in [min]          curation assist: load-bearing modules with no pattern node',
  '  drift                 scoped drift: dangling uses / orphaned source (→ 0)',
  '  maturity              the maturity ladder (patterns + direct invariants per tier)',
  '  find <concept>        E1: fuzzy concept → ranked curated patterns',
  '  file <path>           E2: file → owning pattern + neighborhood (dark → mechanical)',
  '  symbol <name>         E3: exported symbol → defining pattern + importers',
  '  invariants <target>   what does this pattern/file guarantee? (labeled by tier)',
  '  specs [ref]           specs re-verifying `git diff <ref>`, labeled by tier',
  '',
  'the machine gate (the one frozen contract — CI consumes it):',
  '  dangling [--baseline <path>] [--write-baseline] [--strict]',
  '                        dangling-reference report; with --baseline compares and',
  '                        (--strict) exits 1 on drift; --write-baseline updates it',
  '',
  'in q scope: g (the handle — see g.api for the canonical PatternGraphAPI), inspect,',
  '            execFileSync, REPO_ROOT (the resolved base dir; cwd is set there).',
].join('\n');

// ─── untrusted git-ref hygiene (three layers; see ADR-009 posture) ────────────
// 1. shell injection            → execFileSync (no shell).
// 2. option injection           → charset guard (no leading `-`) + `--end-of-options`.
// 3. pathspec semantic injection → resolve the input to a VERIFIED 40-hex commit SHA
//    first (`^{commit}` peels, `--verify` rejects non-commits), then diff that SHA
//    with a trailing `--` so the pathspec slot is provably empty.
function assertSafeRef(ref: string): string {
  if (!/^[A-Za-z0-9][\w./~^@{}:-]*$/.test(ref))
    fail(`unsafe git ref ${JSON.stringify(ref)} — must start alphanumeric, ref-safe chars only`);
  return ref;
}
function resolveCommit(ref: string): string {
  assertSafeRef(ref);
  try {
    return execFileSync(
      'git',
      ['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`],
      { encoding: 'utf8', cwd: BASE_DIR },
    ).trim();
  } catch {
    fail(`not a commit: ${JSON.stringify(ref)} (refusing to treat CLI input as a pathspec)`);
  }
}
function changedFilesOf(refLabel: string): { sha: string; changed: string[] } {
  const sha = resolveCommit(refLabel);
  const changed = execFileSync('git', ['diff', '--name-only', '--end-of-options', sha, '--'], {
    encoding: 'utf8',
    cwd: BASE_DIR,
  })
    .split('\n')
    .filter(Boolean);
  return { sha, changed };
}

// ─── q: the eval front door ───────────────────────────────────────────────────
async function q(): Promise<void> {
  const argvExpr = cmdArgs.join(' ').trim();
  // Detect a TTY via isatty(0), NOT process.stdin.isTTY. Touching process.stdin
  // instantiates the stream and flips fd 0 to NON-BLOCKING, which makes the
  // readFileSync(0) below throw EAGAIN on any non-trivial PIPE — the natural
  // multi-line form. isatty(0) is a pure fd check: fd 0 stays blocking, so both
  // `architect q < file` and `cat file | architect q` read reliably at any size.
  const stdinBody = !argvExpr && !isatty(0) ? readFileSync(0, 'utf8').trim() : '';

  if (!argvExpr && !stdinBody) {
    console.log(USAGE);
    return;
  }

  // Everything compiles to an async FUNCTION BODY. Two source shapes feed it:
  //   • stdin  — already a raw function body (may `console.log` and/or `return`).
  //   • argv   — usually a single expression (`g.patterns.length`), but a natural
  //     `const x = …; return x` is a multi-statement body. Try the expression-wrap
  //     first; if that won't compile, retry the argv text AS a raw statement body.
  type EvalFn = (
    g: unknown,
    inspectFn: unknown,
    execFileSyncFn: unknown,
    repoRoot: unknown,
  ) => Promise<unknown>;
  // node:vm compiles the body without string-eval'ing in this scope; it is NOT a
  // security boundary (documented above) — it is the honest compiler for caller code.
  const compile = (fnBody: string): EvalFn =>
    new Script(`(async (g, inspect, execFileSync, REPO_ROOT) => { ${fnBody} })`, {
      filename: 'q-script',
    }).runInThisContext() as EvalFn;
  const compileEntry = (): EvalFn => {
    if (!argvExpr) return compile(stdinBody); // stdin is always a raw function body
    try {
      return compile(`return ( ${argvExpr} );`); // argv: try the expression-wrap first
    } catch {
      return compile(argvExpr); // …else retry as a raw statement body (`const x=…; return x`)
    }
  };
  const hint = [
    'hint: a bare-expression argv must be a single expression — `const`/`let`/multiple statements',
    '      are fine in an argv too, but for anything larger pipe a script via stdin:',
    '        pnpm architect:q < playground/scratch/your-cut.ts',
    '      scripts run as a function body, so top-level `import`/`export` are illegal —',
    '      use the injected globals (g, inspect, execFileSync, REPO_ROOT) instead of importing.',
  ].join('\n');

  let fn: EvalFn;
  try {
    fn = compileEntry();
  } catch (e) {
    console.error(`q: could not compile your script — ${(e as Error).message}`);
    console.error(hint);
    process.exit(1);
  }

  // Run the script with cwd at the base dir, so cwd-relative shell-outs (git, file
  // reads) in a piped script are stable no matter where the bin was invoked.
  process.chdir(BASE_DIR);
  const g = await loadGraph(BASE_DIR);
  let out: unknown;
  try {
    out = await fn(g, inspect, execFileSync, BASE_DIR);
  } catch (e) {
    console.error(`q: script threw — ${(e as Error).stack ?? String(e)}`);
    process.exit(1);
  }
  if (out !== undefined)
    console.log(
      typeof out === 'string'
        ? out
        : inspect(out, { colors: false, depth: 4, maxArrayLength: 200 }),
    );
}

// ─── named demo commands (scripts over the handle, printed) ───────────────────
const PROV = { executable: '✓exec', authored: '○auth' } as const;

async function censusCmd(): Promise<void> {
  const g = await loadGraph(BASE_DIR);
  const r = g.census();
  console.log(`\nnode coverage (non-barrel src → pattern node):`);
  for (const c of r.nodeCoverage)
    console.log(`  ${c.pkg.padEnd(22)} ${String(c.mapped)}/${String(c.total)} (${String(c.pct)}%)`);
  console.log(`\nedge density (of ${String(r.patternCount)} patterns):`);
  for (const [k, v] of Object.entries(r.edgeDensity))
    console.log(
      `  ${k.padEnd(16)} ${String(v)} (${String(Math.round((v / r.patternCount) * 100))}%)`,
    );
  console.log(
    `  fully edge-dark: ${String(r.edgeDark)} (${String(Math.round((r.edgeDark / r.patternCount) * 100))}%)`,
  );
}

async function diffCmd(): Promise<void> {
  const g = await loadGraph(BASE_DIR);
  const r = g.graphDiff();
  console.log(`\nmechanical pattern→pattern edges: ${String(r.mechEdges)}`);
  console.log(`authored   pattern→pattern edges: ${String(r.authEdges)}`);
  console.log(`  shared (curated selection of the firehose): ${String(r.shared.length)}`);
  console.log(`  dark   (import, no intent — editorial silence): ${String(r.dark.length)}`);
  console.log(
    `  aspirational (intent, no import — conceptual / drift): ${String(r.aspirational.length)}`,
  );
  console.log(
    `  Jaccard similarity: ${String(r.jaccard)}%  ← curation is a ~${String(r.jaccard)}% overlap with the import graph, by design`,
  );
  console.log('\n  sample dark (correctly-omitted real deps):');
  for (const s of r.dark.slice(0, 8)) console.log(`    ${s}`);
}

async function blastCmd(): Promise<void> {
  const label = cmdArgs[0] ?? 'HEAD';
  const { sha, changed } = changedFilesOf(label);
  const g = await loadGraph(BASE_DIR);
  const r = g.blastRadius(changed);
  console.log(`\nblast radius of \`git diff ${label}\` (${sha.slice(0, 9)}):`);
  console.log(
    `  changed src files: ${String(r.changedSrc.length)}  (${String(r.mappedSeed.length)} map to a pattern)`,
  );
  console.log(`  authored-graph downstream:   ${String(r.authoredDownstream.length)} patterns`);
  console.log(
    `  mechanical-graph downstream: ${String(r.mechFiles)} files → ${String(r.mechPatterns.length)} patterns`,
  );
  console.log(`  RECOVERED (curated graph missed): ${String(r.recovered.length)}`);
  for (const n of r.recovered.slice(0, 20)) console.log(`    + ${n}`);
  if (r.recovered.length > 20) console.log(`    … +${String(r.recovered.length - 20)}`);
  console.log(`  at-risk specs: ${String(r.atRiskSpecs.length)}`);
  for (const s of r.atRiskSpecs.slice(0, 10))
    console.log(`    [${PROV[s.provenance]} · ${s.maturity}] ${s.scenario}  (${s.pattern})`);
  if (r.atRiskSpecs.length > 10) console.log(`    … +${String(r.atRiskSpecs.length - 10)}`);
}

async function fanInCmd(): Promise<void> {
  const g = await loadGraph(BASE_DIR);
  let min = 4;
  if (cmdArgs[0] !== undefined) {
    const parsed = Number(cmdArgs[0]);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      fail('usage: architect fan-in [min]  (min must be a positive integer)');
    }
    min = parsed;
  }
  const r = g.fanInCandidates({ min });
  console.log(
    `\ncuration candidates — load-bearing modules with NO pattern node (top ${String(r.length)}):`,
  );
  for (const c of r) console.log(`  ${String(c.fanIn).padStart(3)} importers  ${c.file}`);
}

async function driftCmd(): Promise<void> {
  const g = await loadGraph(BASE_DIR);
  const r = g.driftFlags((f) => existsSync(join(BASE_DIR, f)));
  console.log(`\nscoped drift (target code gone — should trend to zero as cleanup completes):`);
  console.log(`  dangling \`uses\` (target not in graph): ${String(r.dangling.length)}`);
  for (const d of r.dangling.slice(0, 15)) console.log(`    ${d.from} → ${d.to}`);
  console.log(`  orphaned source (pattern file deleted): ${String(r.orphanedSource.length)}`);
  for (const o of r.orphanedSource.slice(0, 15)) console.log(`    ${o.pattern}  (${o.file})`);
}

async function findCmd(): Promise<void> {
  const query = cmdArgs.join(' ').trim();
  if (!query) fail('usage: architect find <concept>');
  const g = await loadGraph(BASE_DIR);
  const r = g.findByConcept(query);
  console.log(`\nfindByConcept(${JSON.stringify(query)}) — top ${String(r.length)} (curated):`);
  if (!r.length) {
    console.log('  (no matches)');
    return;
  }
  for (const h of r) {
    const role = h.role ?? '—';
    const bc = h.boundedContext ?? '—';
    console.log(
      `  ${String(h.score).padStart(3)}  ${h.name.padEnd(44)} [${h.status}] role=${role} ctx=${bc}`,
    );
    console.log(`       matched on: ${h.matchedOn.join(', ')}`);
  }
}

async function fileCmd(): Promise<void> {
  const p = cmdArgs[0];
  if (!p) fail('usage: architect file <repo-relative-path>');
  const g = await loadGraph(BASE_DIR);
  const r = g.byFile(p);
  console.log(`\nbyFile(${JSON.stringify(p)}):`);
  if (r.mapped) {
    console.log(`  owning pattern: ${r.pattern}  (role=${r.role ?? '—'})`);
    console.log(`  curated neighborhood:`);
    console.log(
      `    uses (${String(r.curated.uses.length)}):          ${r.curated.uses.join(', ') || '—'}`,
    );
    console.log(
      `    usedBy (${String(r.curated.usedBy.length)}):        ${r.curated.usedBy.join(', ') || '—'}`,
    );
    console.log(
      `    implementedBy specs (${String(r.curated.implementedBy.length)}): ${r.curated.implementedBy.join(', ') || '—'}`,
    );
  } else {
    console.log(`  owning pattern: (UNMAPPED — dark file; mechanical neighborhood below)`);
  }
  const fmt = (n: { file: string; pattern?: string }) =>
    `${n.file}${n.pattern ? `  → ${n.pattern}` : ''}`;
  const m = r.mechanical;
  console.log(`  mechanical imports OUT (${String(m.imports.length)}):`);
  for (const n of m.imports.slice(0, 15)) console.log(`    ${fmt(n)}`);
  if (m.imports.length > 15) console.log(`    … +${String(m.imports.length - 15)}`);
  console.log(`  mechanical importers IN (${String(m.importedBy.length)}):`);
  for (const n of m.importedBy.slice(0, 15)) console.log(`    ${fmt(n)}`);
  if (m.importedBy.length > 15) console.log(`    … +${String(m.importedBy.length - 15)}`);
}

async function symbolCmd(): Promise<void> {
  const name = cmdArgs[0];
  if (!name) fail('usage: architect symbol <ExportedSymbolName>');
  const g = await loadGraph(BASE_DIR);
  const r = g.bySymbol(name);
  console.log(`\nbySymbol(${JSON.stringify(name)}):`);
  console.log(`  defined in (${String(r.definedIn.length)}):`);
  if (!r.definedIn.length) console.log(`    (no definition found in substrate)`);
  for (const d of r.definedIn)
    console.log(
      `    ${d.file}  [${d.kind}, ${d.pkg}]${d.pattern ? `  → ${d.pattern}` : '  (dark)'}`,
    );
  console.log(
    `  imported by ${String(r.importedByFiles.length)} file(s), ${String(r.importedByPatterns.length)} pattern(s):`,
  );
  for (const n of r.importedByPatterns.slice(0, 20)) console.log(`    pattern: ${n}`);
  if (r.importedByPatterns.length > 20)
    console.log(`    … +${String(r.importedByPatterns.length - 20)} patterns`);
  for (const f of r.importedByFiles.slice(0, 15)) console.log(`    file: ${f}`);
  if (r.importedByFiles.length > 15)
    console.log(`    … +${String(r.importedByFiles.length - 15)} files`);
}

async function invariantsCmd(): Promise<void> {
  const target = cmdArgs.join(' ').trim();
  if (!target) fail('usage: architect invariants <PatternName | path/to/file.ts>');
  const g = await loadGraph(BASE_DIR);
  const inv = g.invariantsOf(target);
  console.log(`\ninvariantsOf(${JSON.stringify(target)}) — ${String(inv.length)} invariant(s):`);
  if (!inv.length) {
    // Empty ≠ "guarantees nothing". Many patterns are code-originated contracts whose
    // guarantee is their TS TYPE, not a Gherkin Rule block. Distinguish that honest case
    // (a real, located, structural contract) from a target that simply doesn't exist —
    // returning [] is the correct handle shape; only the PRESENTATION must not mislead.
    const node = g.pattern(target) ?? g.pattern(g.fileToPattern(target) ?? '');
    if (node?.sourceFile?.endsWith('.ts')) {
      console.log(
        `  no Gherkin invariants — \`${node.name}\` is a \`${node.role ?? 'code'}\` whose contract is its\n` +
          `  TypeScript type at ${node.sourceFile}. Its guarantee is STRUCTURAL (the type), not a Rule block.`,
      );
      return;
    }
    console.log(
      '  (none — no Rule blocks reach this pattern/file, and no code-originated contract matches)',
    );
    return;
  }
  const ambiguous = inv.filter((i) => i.cohort).length;
  for (const i of inv) {
    console.log(`  [${PROV[i.provenance]} · ${i.maturity}] ${i.rule}  (${i.pattern})`);
    console.log(`      ${i.text}`);
    if (i.cohort)
      console.log(
        `      ⚠ cohort-wide: realizing feature covers ${String(i.cohort.length)} patterns (${i.cohort.join(', ')}) — not specific to your query`,
      );
    if (i.provenByScenarios.length)
      console.log(
        `      proven by: ${i.provenByScenarios.slice(0, 3).join(' · ')}${i.provenByScenarios.length > 3 ? ' …' : ''}`,
      );
  }
  if (ambiguous)
    console.log(
      `\n  note: ${String(ambiguous)}/${String(inv.length)} invariant(s) come from a multi-pattern feature — the source attributes them to the cohort, not your single target.`,
    );
}

async function specsCmd(): Promise<void> {
  const label = cmdArgs[0] ?? 'HEAD';
  const { sha, changed } = changedFilesOf(label);
  const g = await loadGraph(BASE_DIR);
  const r = g.blastRadius(changed);
  const at = r.atRiskSpecs;
  const exec = at.filter((s) => s.provenance === 'executable').length;
  console.log(`\nspecs re-verifying \`git diff ${label}\` (${sha.slice(0, 9)}):`);
  console.log(
    `  downstream patterns: ${String(r.mechPatterns.length)}  → at-risk specs: ${String(at.length)} (${String(exec)} executable, ${String(at.length - exec)} authored-only)`,
  );
  for (const s of at.slice(0, 20))
    console.log(`  [${PROV[s.provenance]} · ${s.maturity}] ${s.scenario}  (${s.pattern})`);
  if (at.length > 20) console.log(`  … +${String(at.length - 20)}`);
}

// maturity — a SCRIPT over the handle's exposed `maturity` field, not a handle
// method — exactly the "agent scripts the rest" boundary. Anything expressible as a
// few lines of groupBy stays here; only irreducible joins go on the handle.
async function maturityCmd(): Promise<void> {
  const g = await loadGraph(BASE_DIR);
  const rows = MATURITIES.map((m) => {
    const ps = g.patterns.filter((p) => p.maturity === m);
    // KNOWN SCOPE EDGE (intentional): counts only Rule blocks the pattern carries
    // DIRECTLY (`ruleCount`). A production pattern whose invariants live in a *realizing*
    // feature reads as 0 here. The per-pattern realized view is `g.invariantsOf(name)`,
    // which DOES follow the implementedBy hop; this ladder is a coarse direct-carry tally.
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

// ─── dangling — the CI graph-integrity gate (the one frozen machine contract) ──
// Reproduces the retired `arch dangling` contract bit-for-bit: JSON report of
// current dangling references; with a baseline, a comparison response; --strict
// exits 1 on drift; --write-baseline updates the committed baseline.
const DanglingFlagsSchema = z.strictObject({
  baseline: z.string().min(1).optional(),
  writeBaseline: z.boolean().optional(),
  strict: z.boolean().optional(),
});

async function danglingCmd(): Promise<void> {
  // Collect argv into a raw record, then let the strict schema be the single
  // parse-and-validate point — unknown keys are rejected by Zod, not ad hoc.
  const raw: Record<string, unknown> = {};
  for (let i = 0; i < cmdArgs.length; i++) {
    const a = cmdArgs[i];
    if (a === undefined) continue;
    if (a === '--baseline') {
      const v = cmdArgs[i + 1];
      if (v === undefined) fail('--baseline requires a value');
      raw['baseline'] = v;
      i++;
    } else if (a === '--write-baseline') raw['writeBaseline'] = true;
    else if (a === '--strict') raw['strict'] = true;
    else if (a.startsWith('--')) raw[a.replace(/^--/, '')] = true;
    else fail(`unexpected dangling argument: ${a}`);
  }
  let flags: z.infer<typeof DanglingFlagsSchema>;
  try {
    flags = DanglingFlagsSchema.parse(raw);
  } catch (e) {
    fail(`invalid dangling flags — ${(e as Error).message}`);
  }
  const baseline = flags.baseline;
  const writeBaseline = flags.writeBaseline === true;
  const strict = flags.strict === true;

  const liveArgs: BuildContextArgs = {
    baseDir: BASE_DIR,
    input: [],
    features: [],
  };
  const context = await buildCliContext(liveArgs);
  const current = context.build.validation.danglingReferences;
  const baselineRequested = baseline !== undefined || writeBaseline || strict;

  if (!baselineRequested) {
    console.log(JSON.stringify(current, null, 2));
    return;
  }

  const baselinePath =
    baseline === undefined
      ? undefined
      : path.isAbsolute(baseline)
        ? baseline
        : path.resolve(BASE_DIR, baseline);
  if (writeBaseline)
    await writeDanglingBaseline(current, {
      ...(baselinePath !== undefined ? { baselinePath } : {}),
    });
  const comparison = await compareDanglingBaseline(current, {
    ...(baselinePath !== undefined ? { baselinePath } : {}),
  });
  const drift = comparison.newEntries.length > 0 || comparison.removedEntries.length > 0;
  const response = {
    baselinePath: baselinePath ?? DANGLING_BASELINE_SOURCE_PATH,
    written: writeBaseline,
    strict,
    drift,
    baselineCount: comparison.baseline.length,
    currentCount: comparison.current.length,
    addedCount: comparison.newEntries.length,
    removedCount: comparison.removedEntries.length,
    added: comparison.newEntries,
    removed: comparison.removedEntries,
    current: comparison.current,
  };
  if (strict && drift) process.exitCode = 1;
  console.log(JSON.stringify(response, null, 2));
}

// ─── dispatch ─────────────────────────────────────────────────────────────────
const table: Record<string, () => Promise<void> | void> = {
  q,
  census: censusCmd,
  diff: diffCmd,
  blast: blastCmd,
  'fan-in': fanInCmd,
  drift: driftCmd,
  find: findCmd,
  file: fileCmd,
  symbol: symbolCmd,
  invariants: invariantsCmd,
  specs: specsCmd,
  maturity: maturityCmd,
  dangling: danglingCmd,
  help: () => {
    console.log(USAGE);
  },
  version: () => {
    console.log(readCliPackageMetadata().version);
  },
};

const ALIAS: Record<string, string> = {
  '--help': 'help',
  '-h': 'help',
  '--version': 'version',
  '-v': 'version',
};
const run = table[cmd] ?? table[ALIAS[cmd] ?? ''];
if (!run) {
  console.error(`architect: unknown command ${JSON.stringify(cmd)}\n`);
  console.error(USAGE);
  process.exit(1);
}
try {
  await run();
} catch (e) {
  console.error(`architect ${cmd}: ${(e as Error).stack ?? String(e)}`);
  process.exit(1);
}
