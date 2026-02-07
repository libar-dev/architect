/**
 * @libar-docs
 * @libar-docs-pattern CoverageAnalyzerImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIArchitectureQueries
 * @libar-docs-uses Pattern Scanner, MasterDataset
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## CoverageAnalyzer — Annotation Coverage and Taxonomy Gap Detection
 *
 * Reports annotation completeness by comparing scannable files (from glob)
 * against annotated patterns in MasterDataset. Uses independent glob via
 * findFilesToScan() — cheap (~1ms) and avoids changing buildPipeline().
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { findFilesToScan, hasFileOptIn } from '../scanner/pattern-scanner.js';
// ---------------------------------------------------------------------------
// findUnusedTaxonomy
// ---------------------------------------------------------------------------
export function findUnusedTaxonomy(dataset, registry) {
    // Collect used values from patterns
    const usedCategories = new Set();
    const usedRoles = new Set();
    const usedLayers = new Set();
    const usedStatuses = new Set();
    for (const p of dataset.patterns) {
        usedCategories.add(String(p.category));
        if (p.archRole !== undefined)
            usedRoles.add(p.archRole);
        if (p.archLayer !== undefined)
            usedLayers.add(p.archLayer);
        if (p.status !== undefined)
            usedStatuses.add(p.status);
    }
    // Get defined values from registry
    const definedCategories = registry.categories.map((c) => c.tag);
    // Find arch-role and arch-layer enum values from metadataTags
    let definedRoles = [];
    let definedLayers = [];
    let definedStatuses = [];
    for (const tag of registry.metadataTags) {
        if (tag.tag === 'arch-role' && tag.values !== undefined) {
            definedRoles = tag.values;
        }
        else if (tag.tag === 'arch-layer' && tag.values !== undefined) {
            definedLayers = tag.values;
        }
        else if (tag.tag === 'status' && tag.values !== undefined) {
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
export async function findUnannotatedFiles(inputGlobs, baseDir, registry, pathFilter) {
    const patterns = pathFilter !== undefined ? [pathFilter] : [...inputGlobs];
    const allFiles = await findFilesToScan({ patterns, baseDir });
    const resolvedBaseDir = path.resolve(baseDir);
    const unannotated = [];
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
export async function analyzeCoverage(dataset, inputGlobs, baseDir, registry) {
    const allFiles = await findFilesToScan({ patterns: [...inputGlobs], baseDir });
    const resolvedBaseDir = path.resolve(baseDir);
    // Collect annotated file paths (normalized to absolute)
    const annotatedFiles = new Set();
    for (const p of dataset.patterns) {
        const filePath = p.source.file;
        // Normalize: resolve relative paths against baseDir
        const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(resolvedBaseDir, filePath);
        annotatedFiles.add(absolute);
    }
    // Find unannotated files
    const unannotatedFiles = [];
    for (const filePath of allFiles) {
        if (!annotatedFiles.has(filePath)) {
            unannotatedFiles.push(path.relative(resolvedBaseDir, filePath));
        }
    }
    unannotatedFiles.sort();
    const totalScannableFiles = allFiles.length;
    const annotatedFileCount = totalScannableFiles - unannotatedFiles.length;
    const coveragePercentage = totalScannableFiles > 0 ? Math.round((annotatedFileCount / totalScannableFiles) * 100) : 0;
    const unusedTaxonomy = findUnusedTaxonomy(dataset, registry);
    return {
        annotatedFileCount,
        totalScannableFiles,
        coveragePercentage,
        unannotatedFiles,
        unusedTaxonomy,
    };
}
//# sourceMappingURL=coverage-analyzer.js.map