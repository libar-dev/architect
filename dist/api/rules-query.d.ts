/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern RulesQueryModule
 * @libar-docs-status completed
 * @libar-docs-implements ProcessAPILayeredExtraction
 * @libar-docs-product-area DataAPI
 * @libar-docs-uses BusinessRulesCodec, CodecHelpers
 *
 * ## RulesQueryModule - Business Rules Domain Query
 *
 * Pure query function for business rules extracted from Gherkin Rule: blocks.
 * Groups rules by product area, phase, and feature pattern.
 *
 * Target: src/api/rules-query.ts
 * See: DD-4 (ProcessAPILayeredExtraction)
 */
import type { RuntimeMasterDataset } from '../generators/pipeline/index.js';
export interface RulesFilters {
    productArea: string | null;
    patternName: string | null;
    onlyInvariants: boolean;
}
export interface RuleOutput {
    readonly name: string;
    readonly invariant: string | undefined;
    readonly rationale: string | undefined;
    readonly verifiedBy: readonly string[];
    readonly scenarioCount: number;
}
export interface RulesQueryResult {
    readonly productAreas: ReadonlyArray<{
        readonly productArea: string;
        readonly ruleCount: number;
        readonly invariantCount: number;
        readonly phases: ReadonlyArray<{
            readonly phase: string;
            readonly features: ReadonlyArray<{
                readonly pattern: string;
                readonly source: string;
                readonly rules: readonly RuleOutput[];
            }>;
        }>;
    }>;
    readonly totalRules: number;
    readonly totalInvariants: number;
    readonly allRuleNames: readonly string[];
    readonly hint?: string;
}
/**
 * Query business rules from the MasterDataset, grouped by product area,
 * phase, and feature pattern.
 *
 * DD-4: Pure function taking RuntimeMasterDataset and RulesFilters.
 * All Map/Set construction lives here, not in the CLI handler.
 */
export declare function queryBusinessRules(dataset: RuntimeMasterDataset, filters: RulesFilters): RulesQueryResult;
//# sourceMappingURL=rules-query.d.ts.map