/**
 * @architect
 * @architect-pattern CoverageAnalyzerImpl
 * @architect-status active
 * @architect-implements DataAPIArchitectureQueries
 * @architect-uses Pattern Scanner, MasterDataset
 * @architect-used-by ProcessAPICLIImpl
 * @architect-arch-role service
 * @architect-arch-context api
 * @architect-arch-layer application
 *
 * ## CoverageAnalyzer — Annotation Coverage and Taxonomy Gap Detection
 *
 * Reports annotation completeness by comparing scannable files (from glob)
 * against annotated patterns in MasterDataset. Uses independent glob via
 * findFilesToScan() — cheap (~1ms) and avoids changing buildPipeline().
 *
 * **When to Use:** When checking annotation completeness or finding unannotated files via `arch coverage` or `unannotated` CLI subcommands.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { findFilesToScan, hasFileOptIn } from '../scanner/pattern-scanner.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnusedTaxonomyReport {
  readonly unusedCategories: readonly string[];
  readonly unusedRoles: readonly string[];
  readonly unusedLayers: readonly string[];
  readonly unusedStatuses: readonly string[];
}

export interface CoverageReport {
  readonly annotatedFileCount: number;
  readonly totalScannableFiles: number;
  readonly coveragePercentage: number;
  readonly unannotatedFiles: readonly string[];
  readonly unusedTaxonomy: UnusedTaxonomyReport;
}

// ---------------------------------------------------------------------------
// findUnusedTaxonomy
// ---------------------------------------------------------------------------

export function findUnusedTaxonomy(
  dataset: MasterDataset,
  registry: TagRegistry
): UnusedTaxonomyReport {
  // Collect used values from patterns
  const usedCategories = new Set<string>();
  const usedRoles = new Set<string>();
  const usedLayers = new Set<string>();
  const usedStatuses = new Set<string>();

  for (const p of dataset.patterns) {
    usedCategories.add(String(p.category));
    if (p.archRole !== undefined) usedRoles.add(p.archRole);
    if (p.archLayer !== undefined) usedLayers.add(p.archLayer);
    if (p.status !== undefined) usedStatuses.add(p.status);
  }

  // Get defined values from registry
  const definedCategories = registry.categories.map((c) => c.tag);

  // Find arch-role and arch-layer enum values from metadataTags
  let definedRoles: readonly string[] = [];
  let definedLayers: readonly string[] = [];
  let definedStatuses: readonly string[] = [];

  for (const tag of registry.metadataTags) {
    if (tag.tag === 'arch-role' && tag.values !== undefined) {
      definedRoles = tag.values;
    } else if (tag.tag === 'arch-layer' && tag.values !== undefined) {
      definedLayers = tag.values;
    } else if (tag.tag === 'status' && tag.values !== undefined) {
      definedStatuses = tag.values;
    }
  }

  return {
    unusedCategories: definedCategories.filter((c) => !usedCategories.has(c)),
    unusedRoles: definedRoles.filter((r) => !usedRoles.has(r)),
    unusedLayers: definedLayers.filter((l) => !usedLayers.has(l)),
    unusedStatuses: definedStatuses.filter((s) => !usedStatuses.has(s)),
  };
}

// ---------------------------------------------------------------------------
// findUnannotatedFiles
// ---------------------------------------------------------------------------

export async function findUnannotatedFiles(
  inputGlobs: readonly string[],
  baseDir: string,
  registry: TagRegistry,
  pathFilter?: string
): Promise<readonly string[]> {
  const patterns = pathFilter !== undefined ? [pathFilter] : [...inputGlobs];
  const allFiles = await findFilesToScan({ patterns, baseDir });
  const resolvedBaseDir = path.resolve(baseDir);

  const unannotated: string[] = [];
  for (const filePath of allFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    if (!hasFileOptIn(content, registry)) {
      // Return relative paths
      const relative = path.relative(resolvedBaseDir, filePath);
      unannotated.push(relative);
    }
  }

  return unannotated.sort();
}

// ---------------------------------------------------------------------------
// analyzeCoverage
// ---------------------------------------------------------------------------

export async function analyzeCoverage(
  dataset: MasterDataset,
  inputGlobs: readonly string[],
  baseDir: string,
  registry: TagRegistry
): Promise<CoverageReport> {
  const allFiles = await findFilesToScan({ patterns: [...inputGlobs], baseDir });
  const resolvedBaseDir = path.resolve(baseDir);

  // Collect annotated file paths (normalized to absolute)
  const annotatedFiles = new Set<string>();
  for (const p of dataset.patterns) {
    const filePath = p.source.file;
    // Normalize: resolve relative paths against baseDir
    const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(resolvedBaseDir, filePath);
    annotatedFiles.add(absolute);
  }

  // Find unannotated files
  const unannotatedFiles: string[] = [];
  for (const filePath of allFiles) {
    if (!annotatedFiles.has(filePath)) {
      unannotatedFiles.push(path.relative(resolvedBaseDir, filePath));
    }
  }
  unannotatedFiles.sort();

  const totalScannableFiles = allFiles.length;
  const annotatedFileCount = totalScannableFiles - unannotatedFiles.length;
  const coveragePercentage =
    totalScannableFiles > 0 ? Math.round((annotatedFileCount / totalScannableFiles) * 100) : 0;

  const unusedTaxonomy = findUnusedTaxonomy(dataset, registry);

  return {
    annotatedFileCount,
    totalScannableFiles,
    coveragePercentage,
    unannotatedFiles,
    unusedTaxonomy,
  };
}
