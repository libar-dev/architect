import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function getPackageRoot() {
  return path.dirname(new URL(import.meta.url).pathname);
}

function resolveBuiltEntrypoint(relativePath) {
  const packageRoot = getPackageRoot();
  const distPath = path.join(packageRoot, 'dist', relativePath);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Missing runtime artifact: ${relativePath}. Run "pnpm --filter @libar-dev/architect-cli build" first.`
    );
  }

  return pathToFileURL(distPath);
}

export async function runArchitectCliEntrypoint(relativePath) {
  await import(resolveBuiltEntrypoint(relativePath).href);
}
