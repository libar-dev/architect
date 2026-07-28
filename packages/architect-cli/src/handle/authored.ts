/**
 * @architect
 * @architect-cli
 * @architect-pattern AuthoredCoreBuilder
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-uses GraphHandleShapes, CLIContextTypes
 * @architect-enforces-decision:ADR006SingleReadModelArchitecture
 * @architect-usecase Use to build the curated core LIVE from annotated source — never from a snapshot on disk.
 *
 * ## AuthoredCoreBuilder — Layer 2 builder (the curated core, built LIVE from source)
 *
 * `buildCliContext` is this package's own pipeline entry, so the graph here is
 * byte-identical to what the docs generator and every projection consumes
 * (ADR-006: the single read model). We take only the two fields the handle joins
 * on — `patterns` + `relationshipIndex` — and decode them through the handle's
 * own discovery-surface schema.
 *
 * ── Freshness (non-negotiable) ────────────────────────────────────────────────
 *   `noCache: true` forces a fresh scan of the working tree, so a just-saved
 *   annotation is reflected on the very next `loadGraph()`. There is NO dump on
 *   disk; both cores build in-process each call. When running from workspace
 *   source (dogfood), invoke with `--conditions=source` so `@libar-dev/*`
 *   resolves live `src/*.ts` instead of stale compiled `dist/` — the root
 *   `architect:q` / `architect:graph` scripts bake the flag in.
 */
import type { PatternGraphAPI } from '@libar-dev/architect-core';

import { buildCliContext } from '../cli/pattern-graph-cli-runtime.js';
import type { ParsedArgs } from '../cli/pattern-graph-cli-types.js';

import { type AuthoredCore, AuthoredCoreSchema } from './schema.js';

// Minimal ParsedArgs: empty input/features lets the runtime resolve workspace
// sources exactly as every other consumer does; noCache forces a fresh build.
const liveArgs = (baseDir: string): ParsedArgs => ({
  baseDir,
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
});

/**
 * Build the authored core fresh from the live PatternGraph rooted at `baseDir`,
 * together with the canonical PatternGraphAPI over the same build (the handle's
 * deterministic-read escape hatch). Async because the pipeline is async. Parses
 * the live objects directly (they are the post-transform graph — no JSON
 * round-trip; proven against the canonical contract upstream).
 */
export async function buildAuthoredContext(
  baseDir: string,
): Promise<{ core: AuthoredCore; api: PatternGraphAPI }> {
  const ctx = await buildCliContext(liveArgs(baseDir));
  return {
    core: AuthoredCoreSchema.parse({
      patterns: ctx.graph.patterns,
      relationshipIndex: ctx.graph.relationshipIndex,
    }),
    api: ctx.api,
  };
}

/** The pure-core convenience form — same live build, only the decoded core. */
export async function buildAuthoredCore(baseDir: string): Promise<AuthoredCore> {
  return (await buildAuthoredContext(baseDir)).core;
}
