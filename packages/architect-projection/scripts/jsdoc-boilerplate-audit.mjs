import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, '..');
const srcRoot = resolve(packageRoot, 'src');
const boilerplatePhrases = [
  'As a typed contract',
  'data shape consumed by projection or render layers',
  'Private helpers used exclusively',
];

async function collectSourceFiles(rootDirectory) {
  const entries = await readdir(rootDirectory, { withFileTypes: true });
  const sourceFiles = [];

  for (const entry of entries) {
    const entryPath = resolve(rootDirectory, entry.name);
    if (entry.isDirectory()) {
      sourceFiles.push(...(await collectSourceFiles(entryPath)));
      continue;
    }

    if (entry.name.endsWith('.ts')) {
      sourceFiles.push(entryPath);
    }
  }

  return sourceFiles.sort();
}

export async function auditJsdocBoilerplate() {
  const sourceFiles = await collectSourceFiles(srcRoot);
  const flaggedFiles = [];

  for (const filePath of sourceFiles) {
    const sourceText = await readFile(filePath, 'utf8');
    const matchedPhrases = boilerplatePhrases.filter((phrase) => sourceText.includes(phrase));
    if (matchedPhrases.length > 0) {
      flaggedFiles.push({ filePath, matchedPhrases });
    }
  }

  return {
    sourceFileCount: sourceFiles.length,
    flaggedFiles,
  };
}

function formatFailure(summary) {
  return [
    'JSDoc boilerplate audit failed.',
    `- scanned source files: ${summary.sourceFileCount}`,
    `- flagged files: ${summary.flaggedFiles.map((entry) => entry.filePath).join(', ') || '(none)'}`,
    ...summary.flaggedFiles.flatMap((entry) =>
      entry.matchedPhrases.map((phrase) => `- ${entry.filePath}: ${phrase}`)
    ),
  ].join('\n');
}

async function main() {
  const summary = await auditJsdocBoilerplate();

  if (summary.flaggedFiles.length > 0) {
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
