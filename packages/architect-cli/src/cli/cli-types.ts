/**
 * @architect
 * @architect-pattern CLIContextTypes
 * @architect-status completed
 * @architect-role:contract
 * @architect-bounded-context:cli
 * @architect-uses PatternGraphApi, PackageMatcherContract, PipelineDatasetContract, BuildPipeline, TagRegistrySchemas
 *
 * ## CLIContextTypes — Shared CLI pipeline contracts
 *
 * The cross-cutting type and schema contract for live PatternGraph construction:
 * `BuildContextArgs` (the slim input to `buildCliContext`), `SourcePlan` (resolved
 * input/feature globs + package config), and `CliContext` (graph + API + the
 * build's validation summary). Wires handle / dangling bootstrap to the
 * architect-core read API.
 *
 * **When to Use:** when building a live PatternGraph for the handle, the dangling
 * gate, or any other composition-root consumer of `buildCliContext`.
 */

import { z } from 'zod';
import type {
  BuildResult,
  PackageConfig,
  PatternGraphAPI,
  RuntimePatternGraph,
  TagRegistry,
} from '@libar-dev/architect-core';

/**
 * Minimal args for `buildCliContext`. Empty `input` / `features` lets the runtime
 * resolve workspace sources.
 */
export const BuildContextArgsSchema = z
  .strictObject({
    baseDir: z.string(),
    input: z.array(z.string()).readonly(),
    features: z.array(z.string()).readonly(),
  })
  .readonly();

export type BuildContextArgs = z.output<typeof BuildContextArgsSchema>;

export interface SourcePlan {
  readonly baseDir: string;
  readonly input: readonly string[];
  readonly features: readonly string[];
  readonly exclude: readonly string[];
  readonly tagRegistry: TagRegistry | undefined;
  readonly packages: readonly PackageConfig[];
}

export interface CliContext {
  readonly build: BuildResult;
  readonly graph: RuntimePatternGraph;
  readonly api: PatternGraphAPI;
}
