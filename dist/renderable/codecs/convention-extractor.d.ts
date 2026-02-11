/**
 * Convention Extractor
 *
 * Filters MasterDataset for decision records tagged with
 * `@libar-docs-convention` and extracts their Rule block content
 * as structured data for reference codec composition.
 *
 * @see CodecDrivenReferenceGeneration spec
 */
import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
/**
 * Structured content extracted from a decision record Rule block.
 */
export interface ConventionRuleContent {
    /** Rule name from the Gherkin Rule: block */
    readonly ruleName: string;
    /** Invariant statement if present */
    readonly invariant?: string;
    /** Rationale statement if present */
    readonly rationale?: string;
    /** Verified-by references if present */
    readonly verifiedBy?: readonly string[];
    /** Tables found in the Rule block description */
    readonly tables: readonly ConventionTable[];
    /** Free-text content (non-table, non-structured) */
    readonly narrative: string;
}
/**
 * A table extracted from a Rule block.
 */
export interface ConventionTable {
    readonly headers: readonly string[];
    readonly rows: ReadonlyArray<Record<string, string>>;
}
/**
 * All convention content for a given tag value.
 */
export interface ConventionBundle {
    /** The convention tag value (e.g., "fsm-rules") */
    readonly conventionTag: string;
    /** Source decision records that contributed */
    readonly sourceDecisions: readonly string[];
    /** Extracted Rule block content, ordered by source */
    readonly rules: readonly ConventionRuleContent[];
}
/**
 * Extracts convention content from MasterDataset.
 *
 * Filters patterns for decision records tagged with `@libar-docs-convention`
 * matching the requested tag values. Extracts Rule block content as
 * structured data.
 *
 * @param dataset - The MasterDataset containing all extracted patterns
 * @param conventionTags - Convention tag values to filter by
 * @returns Array of ConventionBundles, one per requested tag value
 *
 * @example
 * ```typescript
 * const conventions = extractConventions(dataset, ['fsm-rules', 'testing-policy']);
 * // conventions[0].conventionTag === 'fsm-rules'
 * // conventions[0].rules[0].ruleName === 'FSM Transitions'
 * // conventions[0].rules[0].tables[0].headers === ['From', 'To', 'Condition']
 * ```
 */
export declare function extractConventions(dataset: MasterDataset, conventionTags: readonly string[]): ConventionBundle[];
//# sourceMappingURL=convention-extractor.d.ts.map