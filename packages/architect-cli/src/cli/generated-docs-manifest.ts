import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const GENERATED_DOCS_MANIFEST_FILENAME = '.generated-docs-manifest.json';

export type GeneratedDocRole = 'root' | 'progressive-child';
export type GeneratedDocAudience = 'published' | 'ui-only' | 'transient';
export type GeneratedDocTracking = 'commit' | 'ignore';

export interface GeneratedDocManifestEntry {
  readonly path: string;
  readonly role: GeneratedDocRole;
  readonly audience: GeneratedDocAudience;
  readonly tracking: GeneratedDocTracking;
  readonly parentPath?: string;
}

export interface GeneratedDocManifestGenerator {
  readonly generatorName: string;
  readonly kind: 'projection' | 'index';
  readonly documentType?: string;
  readonly rootPath: string;
  readonly entries: readonly GeneratedDocManifestEntry[];
}

export interface GeneratedDocsManifest {
  readonly version: 1;
  readonly updatedAt: string;
  readonly generators: Record<string, GeneratedDocManifestGenerator>;
}

export interface UpsertGeneratedDocManifestOptions {
  readonly outputDir: string;
  readonly generatorName: string;
  readonly kind: 'projection' | 'index';
  readonly rootPath: string;
  readonly entries: readonly GeneratedDocManifestEntry[];
  readonly documentType?: string;
  readonly pruneStaleFiles?: boolean;
}

export async function loadGeneratedDocsManifest(
  outputDir: string
): Promise<GeneratedDocsManifest | null> {
  const manifestPath = resolveGeneratedDocsManifestPath(outputDir);

  try {
    const raw = await readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as GeneratedDocsManifest;
    if (!isGeneratedDocsManifest(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function upsertGeneratedDocsManifest(
  options: UpsertGeneratedDocManifestOptions
): Promise<void> {
  const existing = (await loadGeneratedDocsManifest(options.outputDir)) ?? {
    version: 1 as const,
    updatedAt: new Date(0).toISOString(),
    generators: {},
  };

  const previousEntries = existing.generators[options.generatorName]?.entries ?? [];
  if (options.pruneStaleFiles === true) {
    await pruneStaleGeneratedFiles(options.outputDir, previousEntries, options.entries);
  }

  const next: GeneratedDocsManifest = {
    version: 1,
    updatedAt: new Date().toISOString(),
    generators: {
      ...existing.generators,
      [options.generatorName]: {
        generatorName: options.generatorName,
        kind: options.kind,
        rootPath: options.rootPath,
        entries: [...options.entries].sort((left, right) => left.path.localeCompare(right.path)),
        ...(options.documentType !== undefined ? { documentType: options.documentType } : {}),
      },
    },
  };

  const manifestPath = resolveGeneratedDocsManifestPath(options.outputDir);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

export function createPublishedEntries(
  rootPath: string,
  filePaths: readonly string[]
): GeneratedDocManifestEntry[] {
  return [...new Set(filePaths)]
    .sort((left, right) => left.localeCompare(right))
    .map((filePath) =>
      filePath === rootPath
        ? {
            path: filePath,
            role: 'root' as const,
            audience: 'published' as const,
            tracking: 'commit' as const,
          }
        : {
            path: filePath,
            role: 'progressive-child' as const,
            audience: 'published' as const,
            tracking: 'commit' as const,
            parentPath: rootPath,
          }
    );
}

export function resolveGeneratedDocsManifestPath(outputDir: string): string {
  return path.resolve(outputDir, GENERATED_DOCS_MANIFEST_FILENAME);
}

async function pruneStaleGeneratedFiles(
  outputDir: string,
  previousEntries: readonly GeneratedDocManifestEntry[],
  nextEntries: readonly GeneratedDocManifestEntry[]
): Promise<void> {
  const nextPaths = new Set(nextEntries.map((entry) => entry.path));
  const stale = previousEntries
    .map((entry) => entry.path)
    .filter((filePath) => !nextPaths.has(filePath))
    .sort((left, right) => right.localeCompare(left));

  for (const relativePath of stale) {
    const absolutePath = path.resolve(outputDir, relativePath);
    try {
      await rm(absolutePath, { force: true });
      await pruneEmptyParents(outputDir, path.dirname(absolutePath));
    } catch {
      // Ignore missing files and non-empty directories during cleanup.
    }
  }
}

async function pruneEmptyParents(outputDir: string, startDir: string): Promise<void> {
  const rootDir = path.resolve(outputDir);
  let current = path.resolve(startDir);

  while (current.startsWith(rootDir) && current !== rootDir) {
    try {
      await rm(current, { recursive: false });
    } catch {
      return;
    }
    current = path.dirname(current);
  }
}

function isGeneratedDocsManifest(value: unknown): value is GeneratedDocsManifest {
  if (!isRecord(value) || value['version'] !== 1 || !isRecord(value['generators'])) {
    return false;
  }

  return Object.values(value['generators']).every((entry) => isGeneratorManifest(entry));
}

function isGeneratorManifest(value: unknown): value is GeneratedDocManifestGenerator {
  return (
    isRecord(value) &&
    typeof value['generatorName'] === 'string' &&
    (value['kind'] === 'projection' || value['kind'] === 'index') &&
    typeof value['rootPath'] === 'string' &&
    Array.isArray(value['entries']) &&
    value['entries'].every((entry) => isManifestEntry(entry))
  );
}

function isManifestEntry(value: unknown): value is GeneratedDocManifestEntry {
  return (
    isRecord(value) &&
    typeof value['path'] === 'string' &&
    (value['role'] === 'root' || value['role'] === 'progressive-child') &&
    (value['audience'] === 'published' ||
      value['audience'] === 'ui-only' ||
      value['audience'] === 'transient') &&
    (value['tracking'] === 'commit' || value['tracking'] === 'ignore') &&
    (value['parentPath'] === undefined || typeof value['parentPath'] === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
