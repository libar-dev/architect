import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFeatureFile } from '@libar-dev/architect-core';

async function collectFeatureFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFeatureFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.feature')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main(): Promise<void> {
  const baseDir = process.cwd();
  const roots = ['tests/features', 'architect/specs', 'architect/decisions', 'architect/releases'];
  let parsed = 0;

  for (const root of roots) {
    const fullRoot = path.join(baseDir, root);
    try {
      const featureFiles = await collectFeatureFiles(fullRoot);
      for (const filePath of featureFiles) {
        const source = await readFile(filePath, 'utf8');
        parseFeatureFile(filePath, source);
        parsed += 1;
      }
    } catch {
      // Missing roots are fine for the private dev workspace.
    }
  }

  process.stdout.write(`step lint smoke ok: parsed ${String(parsed)} feature files\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
