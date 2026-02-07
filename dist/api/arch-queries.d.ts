/**
 * @libar-docs
 * @libar-docs-pattern ArchQueriesImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIArchitectureQueries
 * @libar-docs-uses ProcessStateAPI, MasterDataset
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer domain
 *
 * ## ArchQueries — Neighborhood, Comparison, Tags, Sources
 *
 * Pure functions over MasterDataset for deep architecture exploration.
 * No I/O — all data comes from pre-computed views.
 */
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import type { NeighborEntry } from './types.js';
export interface NeighborhoodResult {
    readonly pattern: string;
    readonly context: string | undefined;
    readonly role: string | undefined;
    readonly layer: string | undefined;
    readonly uses: readonly NeighborEntry[];
    readonly usedBy: readonly NeighborEntry[];
    readonly dependsOn: readonly NeighborEntry[];
    readonly enables: readonly NeighborEntry[];
    readonly sameContext: readonly NeighborEntry[];
    readonly implements: readonly string[];
    readonly implementedBy: readonly string[];
}
export interface ContextSummary {
    readonly name: string;
    readonly patternCount: number;
    readonly patterns: readonly string[];
    readonly allDependencies: readonly string[];
}
export interface IntegrationPoint {
    readonly from: string;
    readonly fromContext: string;
    readonly to: string;
    readonly toContext: string;
    readonly relationship: string;
}
export interface ContextComparison {
    readonly context1: ContextSummary;
    readonly context2: ContextSummary;
    readonly sharedDependencies: readonly string[];
    readonly uniqueToContext1: readonly string[];
    readonly uniqueToContext2: readonly string[];
    readonly integrationPoints: readonly IntegrationPoint[];
}
export interface TagValueCount {
    readonly value: string;
    readonly count: number;
}
export interface TagUsageEntry {
    readonly tag: string;
    readonly count: number;
    readonly values: readonly TagValueCount[] | null;
}
export interface TagUsageReport {
    readonly tags: readonly TagUsageEntry[];
    readonly patternCount: number;
}
export interface SourceTypeEntry {
    readonly type: string;
    readonly count: number;
    readonly locationPattern: string;
    readonly files: readonly string[];
}
export interface SourceInventory {
    readonly types: readonly SourceTypeEntry[];
    readonly totalFiles: number;
}
export declare function computeNeighborhood(name: string, dataset: MasterDataset): NeighborhoodResult | undefined;
export declare function compareContexts(ctx1: string, ctx2: string, dataset: MasterDataset): ContextComparison | undefined;
export declare function aggregateTagUsage(dataset: MasterDataset): TagUsageReport;
export declare function buildSourceInventory(dataset: MasterDataset): SourceInventory;
//# sourceMappingURL=arch-queries.d.ts.map