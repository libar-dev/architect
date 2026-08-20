/**
 * @architect
 * @architect-cli
 * @architect-pattern AuthoredCoreBuilder
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-uses CLIContextTypes
 * @architect-enforces-decision:ADR006SingleReadModelArchitecture
 * @architect-usecase Use to build the curated core LIVE from annotated source — never from a snapshot on disk.
 *
 * ## AuthoredCoreBuilder — Layer 2 builder (the curated core, built LIVE from source)
 *
 * `buildCliContext` is this package's own pipeline entry, so the graph here is
 * byte-identical to what the docs generator and every projection consumes
 * (ADR-006: the single read model). The core Graph decodes the discovery shapes;
 * this CLI-owned builder only resolves sources and returns the live canonical value.
 *
 * ── Freshness (non-negotiable) ────────────────────────────────────────────────
 *   Each `loadGraph()` scans the working tree. There is no dump on disk; both
 *   cores build in-process each call. When running from workspace source
 *   (dogfood), invoke with `--conditions=source` so `@libar-dev/*` resolves live
 *   `src/*.ts` instead of stale compiled `dist/` — the root `architect:q` /
 *   `architect:graph` scripts bake the flag in.
 */
import type { PatternGraph } from '@libar-dev/architect-core/graph';

import { buildCliContext } from '../cli/cli-runtime.js';
import type { BuildContextArgs } from '../cli/cli-types.js';

// Empty input/features lets the runtime resolve workspace sources exactly as
// every other consumer does.
const liveArgs = (baseDir: string): BuildContextArgs => ({
  baseDir,
  input: [],
  features: [],
});

/** Build the canonical graph fresh from the live PatternGraph rooted at `baseDir`. */
export async function buildAuthoredGraph(baseDir: string): Promise<PatternGraph> {
  return (await buildCliContext(liveArgs(baseDir))).graph;
}
