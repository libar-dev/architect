/**
 * @libar-docs
 * @libar-docs-pattern HandoffGeneratorImpl
 * @libar-docs-status completed
 * @libar-docs-implements DataAPIDesignSessionSupport
 * @libar-docs-uses ProcessStateAPI, MasterDataset, ContextFormatterImpl
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-target src/api/handoff-generator.ts
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## HandoffGenerator — Session-End State Summary
 *
 * Pure function that assembles a handoff document from ProcessStateAPI
 * and MasterDataset. Captures everything the next session needs to
 * continue work without context loss.
 */
import type { SessionType } from './context-assembler.js';
import type { ProcessStateAPI } from './process-state.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
/** Handoff supports 'review' in addition to standard session types (DD-3). */
export type HandoffSessionType = SessionType | 'review';
export interface HandoffOptions {
    readonly patternName: string;
    readonly sessionType?: HandoffSessionType;
    readonly modifiedFiles?: readonly string[];
}
export interface HandoffSection {
    readonly title: string;
    readonly items: readonly string[];
}
export interface HandoffDocument {
    readonly pattern: string;
    readonly sessionType: HandoffSessionType;
    readonly date: string;
    readonly status: string | undefined;
    readonly sections: readonly HandoffSection[];
}
export declare function generateHandoff(api: ProcessStateAPI, _dataset: MasterDataset, // _dataset reserved for future use per design stub
options: HandoffOptions): HandoffDocument;
export declare function formatHandoff(doc: HandoffDocument): string;
//# sourceMappingURL=handoff-generator.d.ts.map