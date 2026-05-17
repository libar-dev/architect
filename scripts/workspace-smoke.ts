import { execFileSync } from 'node:child_process';

import {
  buildPatternGraph,
  resolveWorkspaceSources,
  WORKSPACE_TAG_REGISTRY,
} from '@libar-dev/architect-core';

function ensureCoreArtifacts(): void {
  execFileSync('pnpm', ['--filter', '@libar-dev/architect-core', 'build', '--force'], {
    stdio: 'inherit',
  });
}

async function main(): Promise<void> {
  ensureCoreArtifacts();
  const baseDir = process.cwd();
  const workspaceSources = resolveWorkspaceSources(baseDir);
  const input = [...workspaceSources.input];
  const features = [...workspaceSources.features];

  const result = await buildPatternGraph({
    input,
    features,
    baseDir,
    mergeConflictStrategy: 'fatal',
    tagRegistry: WORKSPACE_TAG_REGISTRY,
  });

  if (!result.ok) {
    throw new Error(`Pipeline error [${result.error.step}]: ${result.error.message}`);
  }

  process.stdout.write(
    `workspace smoke ok: ${result.value.graph.patterns.length} patterns, ${result.value.diagnostics.length} diagnostics\n`,
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
