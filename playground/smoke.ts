/**
 * smoke — a minimal regression check over the live graph handle.
 *
 *   pnpm playground:smoke    (= tsx --conditions=source playground/smoke.ts)
 *
 * Not a determinism gate and NOT a snapshot. The handle builds the graph LIVE, so
 * the mechanical numbers (348 / 65% / 80%) DRIFT as annotations grow — and the north
 * star says those numbers are insignificant. So this asserts INVARIANTS that stay
 * true regardless of annotation growth, never frozen counts. Asserting `=== 348`
 * would smuggle back the determinism gate the playground deliberately refuses.
 *
 * Each check prints `✓`/`✗ name — reason`; exits 1 if ANY check fails, 0 if all pass.
 * CI-excluded by doctrine: opt-in only, never wired into `ci:verify` or any gate.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { loadGraph } from './graph.ts';
import { type AtRiskSpec, type Graph, type Invariant } from './graph.ts';
import { REPO_ROOT } from './repo-root.ts';

interface Check {
  name: string;
  run: () => void; // throws (or returns) — a throw is a failure with its message as the reason
}

const checks: Check[] = [];
const check = (name: string, run: () => void): void => {
  checks.push({ name, run });
};
// tiny assert: a failed expectation throws, which the runner records as ✗ name — reason.
// `asserts cond` so a guard like `assert(x !== undefined, …)` narrows the type for
// strict-TS (e.g. the `byFile(mappedTs)` call below), not just at runtime.
function assert(cond: boolean, reason: string): asserts cond {
  if (!cond) throw new Error(reason);
}

// ─── q.ts round-trip helper — shell out with EXPLICIT input (never bare: G8) ──
// `pnpm playground:q` bakes `--conditions=source`; we call tsx directly with the
// flag + an explicit argv expression/body so stdin is never read (the bare-no-arg
// no-EOF hang). cwd is REPO_ROOT so the front door resolves the repo.
function runQ(argvScript: string): string {
  // Capture the child's stderr (`stdio[2]='pipe'`) instead of letting it inherit the
  // parent console — otherwise the deliberate compile error in `q-roundtrip-error-path`
  // leaks a scary stack into the middle of a PASSING run. On a non-zero exit
  // execFileSync still attaches the captured stderr to the thrown error (`e.stderr`),
  // which is exactly what that check asserts on. stdin is `ignore` (we always pass an
  // explicit argv, never stdin), so q.ts never blocks on fd 0.
  return execFileSync(
    'pnpm',
    ['exec', 'tsx', '--conditions=source', 'playground/q.ts', argvScript],
    { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}

const g: Graph = await loadGraph();

// 1 ─ Load sanity: a generous floor, never an equality. 0 is the silent-failure-to-
//     zero trap the annotation fleet hit — a graph that built but joined nothing.
check('load-sanity', () => {
  assert(g.patterns.length > 300, `expected >300 patterns, got ${g.patterns.length}`);
});

// 2 ─ Drift = 0: the real cleanup invariant (target code gone). Trends monotonically
//     to zero as the deletion completes; a non-zero here means a stale curated edge.
check('drift-zero', () => {
  const { dangling, orphanedSource } = g.driftFlags((f) => existsSync(join(REPO_ROOT, f)));
  assert(
    dangling.length === 0 && orphanedSource.length === 0,
    `drift: ${dangling.length} dangling, ${orphanedSource.length} orphaned-source (expected 0/0)`,
  );
});

// 3 ─ F2 coherence (the fixed bug must stay fixed): the maturity⟺provenance coherence
//     rule. NO spec may be `executable` provenance without `executable` maturity, and
//     NO `authored` spec may claim the `executable` realization rung. Gather every
//     Invariant + AtRiskSpec across ALL patterns and assert both violation counts are 0.
check('f2-coherence', () => {
  const names = g.patterns.map((p) => p.name);
  const invariants: Invariant[] = names.flatMap((n) => g.invariantsOf(n));
  const atRisk: AtRiskSpec[] = g.specsReverifying(names);
  const labeled: { provenance: string; maturity: string }[] = [...invariants, ...atRisk];

  const execNotExecutable = labeled.filter(
    (s) => s.provenance === 'executable' && s.maturity !== 'executable',
  ).length;
  const authoredAtExecutable = labeled.filter(
    (s) => s.provenance === 'authored' && s.maturity === 'executable',
  ).length;
  assert(
    execNotExecutable === 0 && authoredAtExecutable === 0,
    `coherence: ${execNotExecutable} exec-but-not-executable, ${authoredAtExecutable} authored-at-executable (expected 0/0)`,
  );
});

// 4 ─ Entry adapters non-empty (the grep-replacement bridge works): a known core
//     symbol resolves to a definition; a known concept ranks patterns; a real mapped
//     `.ts` file (discovered at runtime, not a fragile hardcoded path) maps to a node.
check('entry-adapters', () => {
  const sym = g.bySymbol('PatternGraph');
  assert(sym.definedIn.length > 0, "bySymbol('PatternGraph').definedIn is empty");
  const concept = g.findByConcept('taxonomy');
  assert(concept.length > 0, "findByConcept('taxonomy') returned no hits");
  const mappedTs = g.patterns.find((p) => p.sourceFile?.endsWith('.ts'))?.sourceFile;
  assert(mappedTs !== undefined, 'no pattern with a .ts sourceFile to probe byFile');
  const bf = g.byFile(mappedTs);
  assert(bf.mapped === true, `byFile(${mappedTs}).mapped is not true`);
});

// 5 ─ Spec bridge works: the Gherkin join is alive — at least one pattern surfaces a
//     non-empty invariant set. Found dynamically (no frozen pattern name).
check('spec-bridge', () => {
  const withInv = g.patterns.find((p) => g.invariantsOf(p.name).length > 0);
  assert(
    withInv !== undefined,
    'no pattern returned any invariants — the Gherkin (implementedBy) join is dead',
  );
});

// 6 ─ q.ts round-trips (the front door + the G1 multi-statement fix must hold). Three
//     sub-checks, all with EXPLICIT argv input (G8: a bare no-arg q.ts hangs on stdin).
check('q-roundtrip-expression', () => {
  const out = runQ('g.patterns.length');
  assert(/^\d+$/.test(out) && Number(out) > 0, `expected a positive integer, got: ${out}`);
});
check('q-roundtrip-multistatement', () => {
  // The G1 fix: a multi-statement argv body must compile + return (regression-guards
  // the critical metric-3 ergonomics fix). Same integer as the bare expression.
  const out = runQ('const n = g.patterns.length; return n');
  assert(/^\d+$/.test(out) && Number(out) > 0, `expected a positive integer, got: ${out}`);
});
check('q-roundtrip-error-path', () => {
  // A deliberately broken argv must exit non-zero with a `q:` error on stderr —
  // execFileSync throws on a non-zero exit, so the THROW is the pass condition.
  let threw = false;
  let stderr = '';
  try {
    runQ('g.(');
  } catch (e) {
    threw = true;
    stderr = String((e as { stderr?: unknown }).stderr ?? '');
  }
  assert(threw, 'a broken argv (`g.(`) exited 0 — the error path is swallowed');
  assert(
    /q:/.test(stderr),
    `broken argv exited non-zero but printed no \`q:\` error; stderr: ${stderr}`,
  );
});

// ─── run ──────────────────────────────────────────────────────────────────────
let failed = 0;
for (const c of checks) {
  try {
    c.run();
    console.log(`✓ ${c.name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${c.name} — ${(e as Error).message}`);
  }
}

// 7 ─ Informational, NOT asserted: the live census line so a human eyeballs drift.
//     (Numbers drift by design — printed, never gated.)
const cen = g.census();
const core = cen.nodeCoverage.find((r) => r.pkg === 'architect-core');
const proj = cen.nodeCoverage.find((r) => r.pkg === 'architect-projection');
console.log(
  `\ncensus (informational): ${cen.patternCount} patterns · ` +
    `core ${core ? `${core.pct}% (${core.mapped}/${core.total})` : 'n/a'} · ` +
    `projection ${proj ? `${proj.pct}% (${proj.mapped}/${proj.total})` : 'n/a'}`,
);

console.log(
  `\n${failed === 0 ? '✓ all' : `✗ ${failed}/${checks.length}`} ` +
    `smoke checks ${failed === 0 ? 'passed' : 'FAILED'} (${checks.length - failed}/${checks.length}).`,
);
process.exit(failed === 0 ? 0 : 1);
