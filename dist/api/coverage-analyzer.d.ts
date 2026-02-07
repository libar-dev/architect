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
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
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
export declare function findUnusedTaxonomy(dataset: MasterDataset, registry: TagRegistry): UnusedTaxonomyReport;
export declare function findUnannotatedFiles(inputGlobs: readonly string[], baseDir: string, registry: TagRegistry, pathFilter?: string): Promise<readonly string[]>;
export declare function analyzeCoverage(dataset: MasterDataset, inputGlobs: readonly string[], baseDir: string, registry: TagRegistry): Promise<CoverageReport>;
//# sourceMappingURL=coverage-analyzer.d.ts.map