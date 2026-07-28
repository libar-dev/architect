/**
 * q — the eval entry. The sandbox front door for an agent.
 *
 * Builds the live graph ONCE, then evaluates agent-supplied JS with `g` (the Graph
 * handle) in scope and inspect-prints the result. Two forms:
 *
 *   # one-off expression (argv)
 *   pnpm exec tsx --conditions=source playground/q.ts 'g.invariantsOf("Foo").length'
 *
 *   # multi-line script (stdin) — may console.log itself and/or `return` a value
 *   pnpm exec tsx --conditions=source playground/q.ts < playground/scratch/cut.ts
 *
 * `--conditions=source` is REQUIRED (see live.ts): without it the authored core
 * resolves stale compiled dist/ instead of live src/.
 *
 * eval() here is deliberate and safe: dev-only, READ-ONLY over the graph, the
 * agent's own code, in a CI-excluded sandbox. This shape is for the AGENT sink
 * only — never a product surface (that is what the typed handle / verbs are for).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isatty } from 'node:tty';
import { inspect } from 'node:util';

import { loadGraph } from './graph.ts';
import { REPO_ROOT } from './repo-root.ts';

// Run every script with cwd at the repo root, so cwd-relative shell-outs (git, file
// reads) in a piped scratch script are stable no matter where q.ts was invoked.
// (loadGraph is already cwd-independent; this covers the AGENT's own script.)
process.chdir(REPO_ROOT);

const argvExpr = process.argv.slice(2).join(' ').trim();
// Detect a TTY via isatty(0), NOT process.stdin.isTTY. Touching process.stdin
// instantiates the stream and flips fd 0 to NON-BLOCKING, which makes the
// readFileSync(0) below throw EAGAIN on any non-trivial PIPE (`… | q.ts`) — the
// natural multi-line form. isatty(0) is a pure fd check: fd 0 stays blocking, so
// both `q.ts < file` and `cat file | q.ts` read reliably at any size.
const stdinBody = !argvExpr && !isatty(0) ? readFileSync(0, 'utf8').trim() : '';

if (!argvExpr && !stdinBody) {
  console.log(
    [
      'usage:',
      "  pnpm exec tsx --conditions=source playground/q.ts 'g.<expr>'",
      '  pnpm exec tsx --conditions=source playground/q.ts < playground/scratch/cut.ts',
      '',
      'in-scope: g (live Graph handle), inspect (node:util), execFileSync (node:child_process), REPO_ROOT (repo-root abs path; cwd is already set here).',
      'surface + examples: playground/USAGE.md   ·   recipes: playground/recipes.md',
    ].join('\n'),
  );
  process.exit(0);
}

// Everything compiles to an async FUNCTION BODY. Two source shapes feed it:
//   • stdin  — already a raw function body (may `console.log` and/or `return`).
//   • argv   — usually a single expression (`g.patterns.length`), but a natural
//     `const x = …; return x` is a multi-statement body. Try the expression-wrap
//     first; if that won't compile, retry the argv text AS a raw statement body so
//     both forms work from argv. (stdin is always raw — never expression-wrapped.)
type EvalFn = (
  g: unknown,
  inspect: unknown,
  execFileSync: unknown,
  REPO_ROOT: unknown,
) => Promise<unknown>;
const compile = (fnBody: string): EvalFn =>
  new Function(
    'g',
    'inspect',
    'execFileSync',
    'REPO_ROOT',
    `return (async () => { ${fnBody} })();`,
  ) as EvalFn;

// Compile separately from run so the two failure modes get distinct, useful messages.
function compileEntry(): EvalFn {
  if (!argvExpr) return compile(stdinBody); // stdin is always a raw function body
  try {
    return compile(`return ( ${argvExpr} );`); // argv: try the expression-wrap first
  } catch {
    return compile(argvExpr); // …else retry it as a raw statement body (`const x=…; return x`)
  }
}
let fn: EvalFn;
try {
  fn = compileEntry();
} catch (e) {
  console.error(`q: could not compile your script — ${(e as Error).message}`);
  console.error(hint());
  process.exit(1);
}

// Hint at the two real causes. Multi-statement argv now works, so the old "import is
// illegal" line is no longer the whole story — name the actual failure modes.
function hint(): string {
  return (
    'hint: a bare-expression argv must be a single expression — `const`/`let`/multiple statements\n' +
    '      are fine now in an argv too, but for anything larger pipe a script via stdin:\n' +
    '        pnpm exec tsx --conditions=source playground/q.ts < playground/scratch/your-cut.ts\n' +
    '      scripts run as a function body, so top-level `import`/`export` are still illegal —\n' +
    '      use the injected globals (g, inspect, execFileSync, REPO_ROOT) instead of importing.'
  );
}

const g = await loadGraph();
let out: unknown;
try {
  out = await fn(g, inspect, execFileSync, REPO_ROOT);
} catch (e) {
  console.error(`q: script threw — ${(e as Error).stack ?? String(e)}`);
  process.exit(1);
}
if (out !== undefined)
  console.log(
    typeof out === 'string' ? out : inspect(out, { colors: false, depth: 4, maxArrayLength: 200 }),
  );
