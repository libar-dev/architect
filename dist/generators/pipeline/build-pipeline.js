/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-infra
 * @libar-docs-pattern PipelineFactory
 * @libar-docs-status active
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
import * as path from 'path';
import { scanPatterns } from '../../scanner/index.js';
import { extractPatterns } from '../../extractor/doc-extractor.js';
import { scanGherkinFiles } from '../../scanner/gherkin-scanner.js';
import { extractPatternsFromGherkin, computeHierarchyChildren, } from '../../extractor/gherkin-extractor.js';
import { mergePatterns } from '../orchestrator.js';
import { loadConfig, formatConfigError } from '../../config/config-loader.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../../config/defaults.js';
import { loadDefaultWorkflow, loadWorkflowFromPath } from '../../config/workflow-loader.js';
import { transformToMasterDatasetWithValidation } from './transform-dataset.js';
import { Result } from '../../types/result.js';
// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Factory
// ═══════════════════════════════════════════════════════════════════════════
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
export async function buildMasterDataset(options) {
    const baseDir = path.resolve(options.baseDir);
    // Step 1: Load configuration
    const configResult = await loadConfig(baseDir);
    if (!configResult.ok) {
        return Result.err({
            step: 'config',
            message: formatConfigError(configResult.error),
        });
    }
    const registry = configResult.value.instance.registry;
    // Step 2: Scan TypeScript source files
    const scanResult = await scanPatterns({ patterns: options.input, baseDir }, registry);
    if (!scanResult.ok) {
        return Result.err({
            step: 'scan-typescript',
            message: String(scanResult.error),
        });
    }
    const { files: scannedFiles } = scanResult.value;
    // Step 3: Extract patterns from TypeScript
    const extraction = extractPatterns(scannedFiles, baseDir, registry);
    // Step 4: Scan and extract Gherkin patterns
    let gherkinPatterns = [];
    if (options.features.length > 0) {
        const gherkinScanResult = await scanGherkinFiles({
            patterns: options.features,
            baseDir,
        });
        if (gherkinScanResult.ok) {
            const gherkinResult = extractPatternsFromGherkin(gherkinScanResult.value.files, {
                baseDir,
                tagRegistry: registry,
                scenariosAsUseCases: true,
            });
            gherkinPatterns = gherkinResult.patterns;
        }
        // Non-fatal: Gherkin scan failure is a warning — continue with empty
        // gherkin patterns (matches process-api.ts original behavior)
    }
    // Step 5: Merge patterns (DD-2: conflict handling per strategy)
    const mergeResult = mergePatterns(extraction.patterns, gherkinPatterns);
    let allMerged;
    if (mergeResult.ok) {
        allMerged = mergeResult.value;
    }
    else if (options.mergeConflictStrategy === 'concatenate') {
        // Validator behavior: fall back to concatenation on conflict (DD-2)
        allMerged = [...extraction.patterns, ...gherkinPatterns];
    }
    else {
        // Fatal behavior: return error on conflict (DD-2)
        return Result.err({
            step: 'merge',
            message: mergeResult.error,
        });
    }
    // Step 6: Compute hierarchy children
    const allPatterns = computeHierarchyChildren(allMerged);
    // Step 7: Load workflow configuration
    let workflow;
    if (options.workflowPath !== undefined) {
        const workflowResult = await loadWorkflowFromPath(options.workflowPath);
        if (!workflowResult.ok) {
            return Result.err({
                step: 'workflow',
                message: workflowResult.error.message,
            });
        }
        workflow = workflowResult.value;
    }
    else {
        workflow = loadDefaultWorkflow();
    }
    // Step 8: Transform to MasterDataset
    const contextInferenceRules = options.contextInferenceRules ?? DEFAULT_CONTEXT_INFERENCE_RULES;
    const { dataset, validation } = transformToMasterDatasetWithValidation({
        patterns: allPatterns,
        tagRegistry: registry,
        workflow,
        contextInferenceRules,
    });
    return Result.ok({ dataset, validation });
}
//# sourceMappingURL=build-pipeline.js.map