/**
 * Layer 2 builder — the curated (authored) core, built LIVE from source.
 *
 * This is the wire that makes the sandbox never-stale. `buildCliContext` is the
 * CLI's own pipeline entry, so the graph here is byte-identical to what every
 * `pnpm architect:query` verb, codec, and renderer consumes (ADR-006: the single
 * read model). We take only the two fields the handle joins on — `patterns` +
 * `relationshipIndex` — and validate them through the sandbox's own loose schema.
 *
 * ── Two non-negotiables (see CONTEXT.md §"staleness") ────────────────────────
 *   1. `noCache: true` — force a fresh scan of the working tree, so a just-saved
 *      annotation is reflected on the very next loadGraph().
 *   2. RUN WITH `--conditions=source`. This file imports `@libar-dev/architect-*`
 *      transitively; without the source export-condition, Node resolves the stale
 *      COMPILED `dist/` instead of live `src/*.ts`. The dump was one staleness
 *      source; `dist/` is the other. `--conditions=source` kills the second.
 *      → pnpm exec tsx --conditions=source playground/<file>.ts
 */
import { buildCliContext } from '../packages/architect-cli/src/cli/pattern-graph-cli-runtime.js';
import type { ParsedArgs } from '../packages/architect-cli/src/cli/pattern-graph-cli-types.js';

import { REPO_ROOT } from './repo-root.ts';
import { type AuthoredCore, AuthoredCoreSchema } from './schema.ts';

// Minimal ParsedArgs: empty input/features lets the runtime resolve workspace
// sources exactly as `pnpm architect:query` does; noCache forces a fresh build.
// baseDir is anchored to the repo root (repo-root.ts), NOT process.cwd() — so the
// entrypoint is location-stable (run it from any subdir, or outside the repo).
const LIVE_ARGS: ParsedArgs = {
  baseDir: REPO_ROOT,
  input: [],
  features: [],
  command: null,
  commandArgs: [],
  help: false,
  version: false,
  dryRun: false,
  noCache: true,
  format: 'json',
  sessionType: 'planning',
  sessionTypeExplicit: false,
  depth: 1,
};

/**
 * Build the authored core fresh from the live PatternGraph. Async because the
 * pipeline is async. Parses the live objects directly (they are the post-transform
 * graph — no JSON round-trip needed; proven against the canonical contract upstream).
 */
export async function buildAuthoredCore(): Promise<AuthoredCore> {
  const ctx = await buildCliContext(LIVE_ARGS);
  return AuthoredCoreSchema.parse({
    patterns: ctx.graph.patterns,
    relationshipIndex: ctx.graph.relationshipIndex,
  });
}
