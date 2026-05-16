import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, '..');
const srcRoot = resolve(packageRoot, 'src');
const projectionsRoot = resolve(srcRoot, 'projections');
const rootBarrelPath = resolve(srcRoot, 'index.ts');
const projectionsBarrelPath = resolve(projectionsRoot, 'index.ts');

const exportBlockPattern = /export\s+(?:type\s+)?\{([\s\S]*?)\}/gu;
const directOptionsSchemaPattern =
  /export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][A-Za-z0-9_$]*OptionsSchema)\b/gu;

function collectExportedNames(sourceText) {
  const exportedNames = new Set();

  for (const blockMatch of sourceText.matchAll(exportBlockPattern)) {
    for (const entry of blockMatch[1].split(',')) {
      const normalizedEntry = entry.replace(/\s+/gu, ' ').trim();
      if (!normalizedEntry) {
        continue;
      }

      const exportedName = normalizedEntry.split(/\s+as\s+/u).at(-1)?.trim();
      if (exportedName?.endsWith('OptionsSchema')) {
        exportedNames.add(exportedName);
      }
    }
  }

  for (const directMatch of sourceText.matchAll(directOptionsSchemaPattern)) {
    exportedNames.add(directMatch[1]);
  }

  return exportedNames;
}

async function collectSubtreeIndexFiles(rootDirectory) {
  const entries = await readdir(rootDirectory, { withFileTypes: true });
  const indexFiles = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const indexPath = resolve(rootDirectory, entry.name, 'index.ts');
    try {
      await readFile(indexPath, 'utf8');
      indexFiles.push(indexPath);
    } catch {
      continue;
    }
  }

  return indexFiles.sort();
}

export async function auditProjectionOptionsSchemaBarrel() {
  const [rootBarrelSource, projectionsBarrelSource] = await Promise.all([
    readFile(rootBarrelPath, 'utf8'),
    readFile(projectionsBarrelPath, 'utf8'),
  ]);

  const subtreeIndexFiles = await collectSubtreeIndexFiles(projectionsRoot);
  const publicOptionsSchemaExports = new Set();

  for (const indexFile of subtreeIndexFiles) {
    const sourceText = await readFile(indexFile, 'utf8');
    for (const exportedName of collectExportedNames(sourceText)) {
      publicOptionsSchemaExports.add(exportedName);
    }
  }

  const rootOptionsSchemaExports = collectExportedNames(projectionsBarrelSource);
  const rootBarrelHasProjectionAggregate = rootBarrelSource.includes(
    "export * from './projections/index.js';"
  );

  const missingExports = [...publicOptionsSchemaExports].filter(
    (exportedName) => !rootOptionsSchemaExports.has(exportedName)
  );
  const unexpectedExports = [...rootOptionsSchemaExports].filter(
    (exportedName) => !publicOptionsSchemaExports.has(exportedName)
  );

  return {
    rootBarrelHasProjectionAggregate,
    publicOptionsSchemaExports: [...publicOptionsSchemaExports].sort(),
    rootOptionsSchemaExports: [...rootOptionsSchemaExports].sort(),
    missingExports: missingExports.sort(),
    unexpectedExports: unexpectedExports.sort(),
  };
}

function formatFailure(summary) {
  return [
    'Projection options-schema barrel audit failed.',
    `- root barrel aggregates projections: ${summary.rootBarrelHasProjectionAggregate}`,
    `- public subtree exports: ${summary.publicOptionsSchemaExports.join(', ') || '(none)'}`,
    `- root barrel exports: ${summary.rootOptionsSchemaExports.join(', ') || '(none)'}`,
    `- missing exports: ${summary.missingExports.join(', ') || '(none)'}`,
    `- unexpected exports: ${summary.unexpectedExports.join(', ') || '(none)'}`,
  ].join('\n');
}

async function main() {
  const summary = await auditProjectionOptionsSchemaBarrel();

  if (!summary.rootBarrelHasProjectionAggregate) {
    throw new Error(formatFailure(summary));
  }

  if (summary.missingExports.length > 0 || summary.unexpectedExports.length > 0) {
    throw new Error(formatFailure(summary));
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
