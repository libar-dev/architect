/**
 * @libar-docs
 * @libar-docs-pattern ContextAssemblerImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIContextAssembly
 * @libar-docs-uses ProcessStateAPI, MasterDataset, PatternSummarizerImpl, FuzzyMatcherImpl, StubResolverImpl
 * @libar-docs-used-by ProcessAPICLIImpl, ContextFormatterImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## ContextAssembler — Session-Oriented Context Bundle Builder
 *
 * Pure function composition over MasterDataset. Reads from 5 pre-computed
 * views (patterns, relationshipIndex, archIndex, deliverables, FSM) and
 * assembles them into a ContextBundle tailored to the session type.
 *
 * The assembler does NOT format output. It produces structured data that
 * the ContextFormatter renders as plain text (see ADR-008).
 */
import type { ProcessStateAPI } from './process-state.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import { type DeliverableStatus } from '../taxonomy/index.js';
import type { NeighborEntry } from './types.js';
export type SessionType = 'planning' | 'design' | 'implement';
export declare function isValidSessionType(value: string): value is SessionType;
export interface ContextOptions {
    readonly patterns: readonly string[];
    readonly sessionType: SessionType;
    readonly baseDir: string;
}
export interface DepTreeOptions {
    readonly pattern: string;
    readonly maxDepth: number;
    readonly includeImplementationDeps: boolean;
}
export interface PatternContextMeta {
    readonly name: string;
    readonly status: string | undefined;
    readonly phase: number | undefined;
    readonly category: string;
    readonly file: string;
    readonly summary: string;
}
export interface StubRef {
    readonly stubFile: string;
    readonly targetPath: string;
    readonly name: string;
}
export interface DepEntry {
    readonly name: string;
    readonly status: string | undefined;
    readonly file: string;
    readonly kind: 'planning' | 'implementation';
}
export interface DeliverableEntry {
    readonly name: string;
    readonly status: DeliverableStatus;
    readonly location: string;
}
export interface FsmContext {
    readonly currentStatus: string;
    readonly validTransitions: readonly string[];
    readonly protectionLevel: 'none' | 'scope' | 'hard';
}
export interface ContextBundle {
    readonly patterns: readonly string[];
    readonly sessionType: SessionType;
    readonly metadata: readonly PatternContextMeta[];
    readonly specFiles: readonly string[];
    readonly stubs: readonly StubRef[];
    readonly dependencies: readonly DepEntry[];
    readonly sharedDependencies: readonly string[];
    readonly consumers: readonly DepEntry[];
    readonly architectureNeighbors: readonly NeighborEntry[];
    readonly deliverables: readonly DeliverableEntry[];
    readonly fsm: FsmContext | undefined;
    readonly testFiles: readonly string[];
}
export interface DepTreeNode {
    readonly name: string;
    readonly status: string | undefined;
    readonly phase: number | undefined;
    readonly isFocal: boolean;
    readonly truncated: boolean;
    readonly children: readonly DepTreeNode[];
}
export interface FileReadingList {
    readonly pattern: string;
    readonly primary: readonly string[];
    readonly completedDeps: readonly string[];
    readonly roadmapDeps: readonly string[];
    readonly architectureNeighbors: readonly string[];
}
export interface ProgressSummary {
    readonly total: number;
    readonly completed: number;
    readonly active: number;
    readonly planned: number;
    readonly percentage: number;
}
export interface ActivePhaseSummary {
    readonly phase: number;
    readonly name: string | undefined;
    readonly patternCount: number;
    readonly activeCount: number;
}
export interface BlockingEntry {
    readonly pattern: string;
    readonly status: string | undefined;
    readonly blockedBy: readonly string[];
}
export interface OverviewSummary {
    readonly progress: ProgressSummary;
    readonly activePhases: readonly ActivePhaseSummary[];
    readonly blocking: readonly BlockingEntry[];
}
export declare function assembleContext(dataset: MasterDataset, api: ProcessStateAPI, options: ContextOptions): ContextBundle;
export declare function buildDepTree(dataset: MasterDataset, options: DepTreeOptions): DepTreeNode;
export declare function buildFileReadingList(dataset: MasterDataset, patternName: string, includeRelated: boolean): FileReadingList;
export declare function buildOverview(dataset: MasterDataset): OverviewSummary;
//# sourceMappingURL=context-assembler.d.ts.map