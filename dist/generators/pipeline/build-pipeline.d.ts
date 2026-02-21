/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-infra
 * @libar-docs-pattern PipelineFactory
 * @libar-docs-status completed
 * @libar-docs-implements ProcessAPILayeredExtraction
 * @libar-docs-product-area DataAPI
 * @libar-docs-uses PatternScanner, GherkinScanner, DocExtractor, GherkinExtractor, MasterDataset
 *
 * ## PipelineFactory - Shared Pipeline Orchestration
 *
 * Shared factory that executes the 8-step scan-extract-merge-transform pipeline.
 * Replaces inline pipeline orchestration in CLI consumers.
 *
 * Target: src/generators/pipeline/build-pipeline.ts
 * See: ADR-006 (Single Read Model Architecture)
 * See: DD-1, DD-2 (ProcessAPILayeredExtraction)
 */
import { Result } from '../../types/result.js';
import type { RuntimeMasterDataset, ValidationSummary, ContextInferenceRule } from './transform-dataset.js';
/**
 * Options for building a MasterDataset via the shared pipeline.
 *
 * DD-1: Factory lives at src/generators/pipeline/build-pipeline.ts.
 * DD-2: mergeConflictStrategy controls per-consumer conflict handling.
 * DD-3: exclude, contextInferenceRules support future orchestrator
 *        migration without breaking changes.
 */
export interface PipelineOptions {
    readonly input: readonly string[];
    readonly features: readonly string[];
    readonly baseDir: string;
    readonly mergeConflictStrategy: 'fatal' | 'concatenate';
    readonly exclude?: readonly string[];
    readonly workflowPath?: string;
    readonly contextInferenceRules?: readonly ContextInferenceRule[];
    /** DD-3: When false, skip validation pass (default true). */
    readonly includeValidation?: boolean;
    /** DD-5: When true, return error on individual scan failures (default false). */
    readonly failOnScanErrors?: boolean;
}
/**
 * Structured error from the pipeline factory.
 * Includes the step that failed so callers can provide targeted diagnostics.
 */
export interface PipelineError {
    readonly step: string;
    readonly message: string;
}
/**
 * DD-1: Detail for a pipeline warning (file-level diagnostic).
 */
export interface PipelineWarningDetail {
    readonly file: string;
    readonly line?: number;
    readonly column?: number;
    readonly message: string;
}
/**
 * DD-1: Structured pipeline warning replacing flat strings.
 * Consumers can read `.message` for human-readable text.
 */
export interface PipelineWarning {
    readonly type: 'scan' | 'extraction' | 'gherkin-parse';
    readonly message: string;
    readonly count?: number;
    readonly details?: readonly PipelineWarningDetail[];
}
/**
 * DD-4: Aggregate scan counts for reporting.
 * Avoids exposing raw ScannedFile[] arrays.
 */
export interface ScanMetadata {
    readonly scannedFileCount: number;
    readonly scanErrorCount: number;
    readonly skippedDirectiveCount: number;
    readonly gherkinErrorCount: number;
}
/**
 * Successful pipeline result containing the dataset and validation summary.
 */
export interface PipelineResult {
    readonly dataset: RuntimeMasterDataset;
    readonly validation: ValidationSummary;
    readonly warnings: readonly PipelineWarning[];
    readonly scanMetadata: ScanMetadata;
}
/**
 * Build a MasterDataset by executing the 8-step extraction pipeline.
 *
 * Returns Result<PipelineResult, PipelineError> so each consumer maps errors
 * to its own strategy (process.exit, throw, etc.). Does not call process.exit
 * or log to console.
 *
 * Steps:
 * 1. Load configuration (discovers delivery-process.config.ts)
 * 2. Scan TypeScript source files
 * 3. Extract patterns from TypeScript
 * 4. Scan and extract Gherkin patterns
 * 5. Merge patterns (conflict handling per mergeConflictStrategy)
 * 6. Compute hierarchy children
 * 7. Load workflow configuration
 * 8. Transform to MasterDataset with validation
 */
export declare function buildMasterDataset(options: PipelineOptions): Promise<Result<PipelineResult, PipelineError>>;
//# sourceMappingURL=build-pipeline.d.ts.map