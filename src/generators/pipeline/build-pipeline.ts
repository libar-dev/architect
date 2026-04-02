/**
 * @architect
 * @architect-generator @architect-infra
 * @architect-pattern PipelineFactory
 * @architect-status completed
 * @architect-implements PatternGraphLayeredExtraction
 * @architect-product-area DataAPI
 * @architect-uses PatternScanner, GherkinScanner, DocExtractor, GherkinExtractor, PatternGraph
 * @architect-convention pipeline-architecture
 *
 * ## Shared Pipeline Factory Responsibilities
 *
 * **Invariant:** `buildPatternGraph()` is the shared factory for Steps 1-8 of the
 * architecture pipeline and returns `Result<PipelineResult, PipelineError>` without
 * process-level side effects.
 *
 * **Rationale:** Centralizing scan/extract/merge/transform flow prevents divergence
 * between CLI consumers and preserves a single ADR-006 read-model path.
 *
 * ## 8-Step Dataset Build Flow
 *
 * The factory owns: configuration load, TypeScript scan + extraction, Gherkin scan +
 * extraction, merge conflict handling, hierarchy child derivation, workflow load,
 * and `transformToPatternGraph` with validation summary.
 *
 * ## Consumer Architecture and PipelineOptions Differentiation
 *
 * Three consumers share this factory: `pattern-graph-cli`, `validate-patterns`, and the
 * generation orchestrator. `PipelineOptions` differentiates behavior by
 * `mergeConflictStrategy` (`fatal` vs `concatenate`), `includeValidation` toggles,
 * and `failOnScanErrors` policy without forking pipeline logic.
 *
 * ### When to Use
 *
 * - Any consumer needs a PatternGraph without rewriting scan/extract/merge flow
 * - CLI consumers require differentiated conflict strategy and validation behavior
 * - Orchestrator needs a shared steps 1-8 implementation before codec/file execution
 */

import * as path from 'path';

import { scanPatterns } from '../../scanner/index.js';
import { extractPatterns } from '../../extractor/doc-extractor.js';
import { scanGherkinFiles } from '../../scanner/gherkin-scanner.js';
import {
  extractPatternsFromGherkin,
  computeHierarchyChildren,
} from '../../extractor/gherkin-extractor.js';
import { mergePatterns } from './merge-patterns.js';
import { loadConfig, formatConfigError } from '../../config/config-loader.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../../config/defaults.js';
import { loadDefaultWorkflow, loadWorkflowFromPath } from '../../config/workflow-loader.js';
import type { LoadedWorkflow } from '../../config/workflow-loader.js';
import {
  transformToPatternGraph,
  transformToPatternGraphWithValidation,
} from './transform-dataset.js';
import { Result } from '../../types/result.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { TagRegistry } from '../../validation-schemas/tag-registry.js';
import type { RuntimePatternGraph, ValidationSummary } from './transform-types.js';
import type { ContextInferenceRule } from './context-inference.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for building a PatternGraph via the shared pipeline.
 *
 * DD-1: Factory lives at src/generators/pipeline/build-pipeline.ts.
 * DD-2: mergeConflictStrategy controls per-consumer conflict handling.
 * DD-3: exclude, contextInferenceRules support future orchestrator
 *        migration without breaking changes.
 *
 * @architect-shape pattern-graph
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
  /** Pre-loaded tag registry. When provided, skips internal config load (Step 1). */
  readonly tagRegistry?: TagRegistry;
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
 *
 * @architect-shape pattern-graph
 */
export interface PipelineResult {
  readonly dataset: RuntimePatternGraph;
  readonly validation: ValidationSummary;
  readonly warnings: readonly PipelineWarning[];
  readonly scanMetadata: ScanMetadata;
}

// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Factory
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a PatternGraph by executing the 8-step extraction pipeline.
 *
 * Returns Result<PipelineResult, PipelineError> so each consumer maps errors
 * to its own strategy (process.exit, throw, etc.). Does not call process.exit
 * or log to console.
 *
 * Steps:
 * 1. Load configuration (discovers architect.config.ts)
 * 2. Scan TypeScript source files
 * 3. Extract patterns from TypeScript
 * 4. Scan and extract Gherkin patterns
 * 5. Merge patterns (conflict handling per mergeConflictStrategy)
 * 6. Compute hierarchy children
 * 7. Load workflow configuration
 * 8. Transform to PatternGraph with validation
 */
export async function buildPatternGraph(
  options: PipelineOptions
): Promise<Result<PipelineResult, PipelineError>> {
  const baseDir = path.resolve(options.baseDir);
  const warnings: PipelineWarning[] = [];

  // Step 1: Get tag registry (pre-loaded or from config)
  let registry: TagRegistry;
  if (options.tagRegistry !== undefined) {
    registry = options.tagRegistry;
  } else {
    const configResult = await loadConfig(baseDir);
    if (!configResult.ok) {
      return Result.err({
        step: 'config',
        message: formatConfigError(configResult.error),
      });
    }
    registry = configResult.value.instance.registry;
  }

  // Step 2: Scan TypeScript source files
  const scanResult = await scanPatterns(
    {
      patterns: options.input,
      baseDir,
      ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
    },
    registry
  );
  if (!scanResult.ok) {
    return Result.err({
      step: 'scan-typescript',
      message: String(scanResult.error),
    });
  }
  const { files: scannedFiles, errors: scanErrors, skippedDirectives } = scanResult.value;

  // DD-5: failOnScanErrors — return error on individual file parse failures
  if (options.failOnScanErrors === true && scanErrors.length > 0) {
    return Result.err({
      step: 'scan-typescript',
      message: `${scanErrors.length} file${scanErrors.length === 1 ? '' : 's'} failed to scan`,
    });
  }

  // DD-1: Collect structured scan warnings
  if (scanErrors.length > 0) {
    warnings.push({
      type: 'scan',
      message: `Failed to scan ${scanErrors.length} files (syntax errors)`,
      count: scanErrors.length,
    });
  }
  if (skippedDirectives.length > 0) {
    warnings.push({
      type: 'scan',
      message: `Skipped ${skippedDirectives.length} invalid directives`,
      count: skippedDirectives.length,
    });
  }

  // Step 3: Extract patterns from TypeScript
  const extraction = extractPatterns(scannedFiles, baseDir, registry);

  if (extraction.errors.length > 0) {
    warnings.push({
      type: 'extraction',
      message: `${extraction.errors.length} TypeScript patterns had errors`,
      count: extraction.errors.length,
    });
  }

  // Step 4: Scan and extract Gherkin patterns
  let gherkinPatterns: readonly ExtractedPattern[] = [];
  let gherkinErrorCount = 0;
  if (options.features.length > 0) {
    const gherkinScanResult = await scanGherkinFiles({
      patterns: options.features,
      baseDir,
      ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
    });
    if (gherkinScanResult.ok) {
      const { files: gherkinFiles, errors: gherkinErrors } = gherkinScanResult.value;
      gherkinErrorCount = gherkinErrors.length;

      // DD-1: Gherkin parse errors with file/line/column detail
      if (gherkinErrors.length > 0) {
        warnings.push({
          type: 'gherkin-parse',
          message: `Failed to parse ${gherkinErrors.length} feature file${gherkinErrors.length === 1 ? '' : 's'}`,
          count: gherkinErrors.length,
          details: gherkinErrors.map((e) => ({
            file: e.file,
            // Use spread pattern for optional properties (exactOptionalPropertyTypes)
            ...(e.error.line !== undefined && { line: e.error.line }),
            ...(e.error.column !== undefined && { column: e.error.column }),
            message: e.error.message,
          })),
        });
      }

      // Extract patterns from Gherkin
      const gherkinResult = extractPatternsFromGherkin(gherkinFiles, {
        baseDir,
        tagRegistry: registry,
        scenariosAsUseCases: true,
      });
      gherkinPatterns = gherkinResult.patterns;

      // DD-1: Gherkin extraction errors per pattern
      if (gherkinResult.errors.length > 0) {
        for (const error of gherkinResult.errors) {
          const details =
            error.validationErrors !== undefined && error.validationErrors.length > 0
              ? ` [${error.validationErrors.join('; ')}]`
              : '';
          warnings.push({
            type: 'extraction',
            message: `${error.file}: ${error.patternName} - ${error.reason}${details}`,
          });
        }
      }
    }
    // Note: scanGherkinFiles returns Result<T, never> so it always succeeds
    // Individual file errors are collected in gherkinScanResult.value.errors
  }

  // Step 5: Merge patterns (DD-2: conflict handling per strategy)
  const mergeResult = mergePatterns(extraction.patterns, gherkinPatterns);
  let allMerged: readonly ExtractedPattern[];

  if (mergeResult.ok) {
    allMerged = mergeResult.value;
  } else if (options.mergeConflictStrategy === 'concatenate') {
    // Validator behavior: fall back to concatenation on conflict (DD-2)
    warnings.push({
      type: 'scan',
      message: `Pattern merge conflicts detected but concatenated per strategy: ${mergeResult.error}`,
    });
    allMerged = [...extraction.patterns, ...gherkinPatterns];
  } else {
    // Fatal behavior: return error on conflict (DD-2)
    return Result.err({
      step: 'merge',
      message: mergeResult.error,
    });
  }

  // Step 6: Compute hierarchy children
  const allPatterns = computeHierarchyChildren(allMerged);

  // Step 7: Load workflow configuration
  let workflow: LoadedWorkflow;
  if (options.workflowPath !== undefined) {
    const workflowResult = await loadWorkflowFromPath(options.workflowPath);
    if (!workflowResult.ok) {
      return Result.err({
        step: 'workflow',
        message: workflowResult.error.message,
      });
    }
    workflow = workflowResult.value;
  } else {
    workflow = loadDefaultWorkflow();
  }

  // DD-4: Build scan metadata for reporting
  const scanMetadata: ScanMetadata = {
    scannedFileCount: scannedFiles.length,
    scanErrorCount: scanErrors.length,
    skippedDirectiveCount: skippedDirectives.length,
    gherkinErrorCount,
  };

  // Step 8: Transform to PatternGraph
  // DD-3: includeValidation controls which transform path to use
  const contextInferenceRules = options.contextInferenceRules ?? DEFAULT_CONTEXT_INFERENCE_RULES;
  const rawDataset = {
    patterns: allPatterns,
    tagRegistry: registry,
    workflow,
    contextInferenceRules,
  };

  if (options.includeValidation === false) {
    const dataset = transformToPatternGraph(rawDataset);
    return Result.ok({
      dataset,
      validation: {
        totalPatterns: allPatterns.length,
        malformedPatterns: [],
        danglingReferences: [],
        unknownStatuses: [],
        warningCount: 0,
      },
      warnings,
      scanMetadata,
    });
  }

  const { dataset, validation } = transformToPatternGraphWithValidation(rawDataset);
  return Result.ok({ dataset, validation, warnings, scanMetadata });
}
