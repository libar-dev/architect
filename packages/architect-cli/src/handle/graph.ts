/**
 * @architect
 * @architect-cli
 * @architect-pattern GraphHandle
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 * @architect-uses AuthoredCoreBuilder, MechanicalSubstrateExtractor
 * @architect-enforces-decision:ADR006SingleReadModelArchitecture
 * @architect-usecase Use as the agent read surface over the live PatternGraph.
 *
 * ## GraphHandle - live CLI composition
 *
 * The public, pure Graph implementation lives in `@libar-dev/architect-core/graph`.
 * This CLI-owned entry point performs the source and TypeScript IO needed to build
 * its canonical and mechanical inputs fresh for each invocation.
 */
import { createGraph, type Graph } from '@libar-dev/architect-core/graph';

import { buildAuthoredGraph } from './authored.js';
import { buildMechanicalCore } from './extract.js';

/** Build both graph inputs from the current working tree and join them in the core Graph. */
export async function loadGraph(baseDir: string): Promise<Graph> {
  const graph = await buildAuthoredGraph(baseDir);
  return createGraph(graph, buildMechanicalCore(baseDir));
}
