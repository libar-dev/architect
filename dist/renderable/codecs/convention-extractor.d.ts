/**
 * Convention Extractor
 *
 * Filters MasterDataset for patterns tagged with `@libar-docs-convention`
 * and extracts convention content as structured data for reference codec
 * composition. Supports two sources:
 *
 * - **Gherkin**: Extracts from `Rule:` blocks on the pattern's `rules` array
 * - **TypeScript**: Decomposes JSDoc `directive.description` by `## Heading`
 *   sections, parsing each section for structured annotations
 *
 * Both sources produce the same `ConventionRuleContent` output, enabling
 * Gherkin and TypeScript convention content to merge in the same bundle.
 *
 * @see CodecDrivenReferenceGeneration spec
 * @see ReferenceDocShowcase spec
 */
import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../validation-schemas/extracted-pattern.js';
import type { SectionBlock } from '../schema.js';
/**
 * Structured content extracted from a decision record Rule block.
 */
export interface ConventionRuleContent {
    /** Rule name (from Gherkin Rule: block or TypeScript ## heading) */
    readonly ruleName: string;
    /** Invariant statement if present */
    readonly invariant?: string;
    /** Rationale statement if present */
    readonly rationale?: string;
    /** Verified-by references if present */
    readonly verifiedBy?: readonly string[];
    /** Tables found in the Rule block description */
    readonly tables: readonly ConventionTable[];
    /** Code examples extracted from DocStrings in the rule description (includes mermaid diagrams) */
    readonly codeExamples?: readonly SectionBlock[];
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
 * Filters patterns tagged with `@libar-docs-convention` matching the
 * requested tag values. For Gherkin-sourced patterns, extracts from
 * Rule: blocks. For TypeScript-sourced patterns (no rules array),
 * decomposes the JSDoc description by ## headings.
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
/**
 * Extract convention bundles from pre-filtered patterns.
 *
 * DD-1 (CrossCuttingDocumentInclusion): Used by the include-tag pass to
 * build convention content from patterns selected by include tag rather
 * than by conventionTags filter. Groups output by each pattern's convention
 * tag values.
 *
 * @param patterns - Pre-filtered patterns that have convention content
 * @returns Array of ConventionBundles
 */
export declare function extractConventionsFromPatterns(patterns: readonly ExtractedPattern[]): ConventionBundle[];
//# sourceMappingURL=convention-extractor.d.ts.map