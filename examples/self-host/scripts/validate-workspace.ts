import {
  applyProjectSourceDefaults,
  buildPatternGraph,
  formatConfigError,
  loadProjectConfig,
  resolveWorkspaceSources,
  WORKSPACE_TAG_REGISTRY,
} from '@libar-dev/architect-core';

async function main(): Promise<void> {
  const baseDir = process.cwd();
  const workspaceSources = resolveWorkspaceSources(baseDir);
  const input = [...workspaceSources.input];
  const features = [...workspaceSources.features];
  const isWorkspace = input.length > 0 && features.length > 0;

  if (!isWorkspace) {
    const config = await loadProjectConfig(baseDir);

    if (!config.ok) {
      throw new Error(formatConfigError(config.error));
    }

    await applyProjectSourceDefaults({ baseDir, input, features });
  }

  const result = await buildPatternGraph({
    input,
    features,
    baseDir,
    mergeConflictStrategy: 'fatal',
    ...(isWorkspace ? { tagRegistry: WORKSPACE_TAG_REGISTRY } : {}),
  });

  if (!result.ok) {
    throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
  }

  const warnings = result.value.warnings.length;
  const diagnostics = result.value.diagnostics.length;
  process.stdout.write(
    `workspace validate ok: ${result.value.graph.patterns.length} patterns, ${warnings} warnings, ${diagnostics} diagnostics\n`
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
