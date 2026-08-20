/**
 * @architect
 * @architect-pattern CLIContextBuilder
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-uses CLIContextTypes, ConfigLoader, ArchitectWorkspaceSources, BuildPipeline
 *
 * ## CLIContextBuilder - Live CLI graph composition
 *
 * Resolves the active source plan and delegates graph construction to the
 * canonical pipeline, preserving one CLI context shape for handle and command consumers.
 *
 * **When to Use:** Use at CLI composition roots that need a live graph and its
 * resolved build context.
 */
import {
  buildPatternGraph,
  findConfigFile,
  formatConfigError,
  loadProjectConfig,
  resolveWorkspaceSources,
  WORKSPACE_TAG_REGISTRY,
} from '@libar-dev/architect-core';
import type { BuildContextArgs, CliContext, SourcePlan } from './cli-types.js';

async function resolveSourcePlan(args: BuildContextArgs): Promise<SourcePlan> {
  const workspaceSources = resolveWorkspaceSources(args.baseDir);
  const hasWorkspaceSources =
    workspaceSources.input.length > 0 || workspaceSources.features.length > 0;
  const configPath = await findConfigFile(args.baseDir);
  const configResult = await loadProjectConfig(args.baseDir);

  if (!configResult.ok && configPath !== null && !hasWorkspaceSources) {
    throw new Error(formatConfigError(configResult.error));
  }

  const config = configResult.ok ? configResult.value : undefined;
  const input = [...args.input];
  const features = [...args.features];

  if (input.length === 0) {
    if (hasWorkspaceSources) {
      input.push(...workspaceSources.input);
    } else if (config !== undefined) {
      input.push(...config.project.sources.typescript);
    }
  }

  if (features.length === 0) {
    if (hasWorkspaceSources) {
      features.push(...workspaceSources.features);
    } else if (config !== undefined) {
      features.push(...config.project.sources.features);
    }
  }

  if (input.length === 0) {
    throw new Error(
      'No source files specified. Provide --input <glob> or configure architect.config.* sources.',
    );
  }

  return {
    baseDir: args.baseDir,
    input,
    features,
    exclude: config?.project.sources.exclude ?? [],
    tagRegistry:
      config?.instance.registry ?? (hasWorkspaceSources ? WORKSPACE_TAG_REGISTRY : undefined),
    packages: config?.project.packages ?? [],
  };
}

export async function buildCliContext(args: BuildContextArgs): Promise<CliContext> {
  const sourcePlan = await resolveSourcePlan(args);

  const result = await buildPatternGraph({
    input: [...sourcePlan.input],
    features: [...sourcePlan.features],
    baseDir: sourcePlan.baseDir,
    mergeConflictStrategy: 'fatal',
    ...(sourcePlan.exclude.length > 0 ? { exclude: [...sourcePlan.exclude] } : {}),
    ...(sourcePlan.tagRegistry !== undefined ? { tagRegistry: sourcePlan.tagRegistry } : {}),
    ...(sourcePlan.packages.length > 0 ? { packages: sourcePlan.packages } : {}),
  });

  if (!result.ok) {
    throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
  }

  return {
    build: result.value,
    graph: result.value.graph,
  };
}
