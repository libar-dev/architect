/**
 * @architect
 * @architect-pattern BuildPipeline
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:pipeline
 * @architect-uses PatternScanner, GherkinScanner, DocExtractor, GherkinExtractor, PatternGraph, ExtractionDiagnostics
 * @architect-decision core-deps
 *
 * ## Shared Pipeline Factory Responsibilities
 *
 * **Invariant:** `buildPatternGraph()` is the shared factory for steps 1-8 of
 * the architecture pipeline and is the single graph-construction entrypoint for
 * query, validation, and CLI consumers.
 *
 * **Rationale:** Keeping graph construction in one factory prevents host and
 * generator consumers from drifting into subtly different scan/extract/transform
 * semantics.
 *
 * **Decision (`core-deps`):** `glob` stays in core because core owns source
 * discovery, `@typescript-eslint/typescript-estree` stays in core because core
 * owns TypeScript annotation parsing, `@cucumber/gherkin` stays in core because
 * core owns feature/spec extraction, and `zod` stays in core because core owns
 * runtime validation for configs, registries, and graph inputs. Those runtime
 * dependencies belong here because every higher package relies on the same
 * foundational scan → parse → validate → merge pipeline.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
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
import type { ExtractionDiagnostic } from '../../extractor/extraction-diagnostics.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import { createFeatureParseError } from '../../types/errors.js';
import type { TagRegistry } from '../../config/tag-registry-contract.js';
import type { PatternParseFailure } from '../../validation-schemas/pattern-graph.js';
import type { RuntimePatternGraph, ValidationSummary } from './transform-types.js';
import type { ContextInferenceRule } from './context-inference.js';

export interface PipelineOptions {
  readonly input: readonly string[];
  readonly features: readonly string[];
  readonly baseDir: string;
  readonly mergeConflictStrategy: 'fatal' | 'concatenate';
  readonly exclude?: readonly string[];
  readonly workflowPath?: string;
  readonly contextInferenceRules?: readonly ContextInferenceRule[];
  readonly includeValidation?: boolean;
  readonly failOnScanErrors?: boolean;
  readonly tagRegistry?: TagRegistry;
}

export interface PipelineError {
  readonly step: string;
  readonly message: string;
}

export interface PipelineWarningDetail {
  readonly file: string;
  readonly line?: number;
  readonly column?: number;
  readonly message: string;
}

export interface PipelineWarning {
  readonly type: 'scan' | 'extraction' | 'gherkin-parse';
  readonly message: string;
  readonly count?: number;
  readonly details?: readonly PipelineWarningDetail[];
}

export interface ScanMetadata {
  readonly scannedFileCount: number;
  readonly scanErrorCount: number;
  readonly skippedDirectiveCount: number;
  readonly gherkinErrorCount: number;
}

export interface BuildResult {
  readonly graph: RuntimePatternGraph;
  readonly validation: ValidationSummary;
  readonly warnings: readonly PipelineWarning[];
  readonly scanMetadata: ScanMetadata;
  readonly diagnostics: readonly ExtractionDiagnostic[];
}

function normalizeFeaturePath(baseDir: string, filePath: string): string {
  return path.relative(baseDir, filePath).split(path.sep).join('/');
}

function formatGherkinParseReason(error: {
  readonly message: string;
  readonly line?: number | undefined;
  readonly column?: number | undefined;
}): string {
  const location =
    error.line !== undefined
      ? ` at line ${String(error.line)}${error.column !== undefined ? `, column ${String(error.column)}` : ''}`
      : '';

  return `${error.message}${location}`;
}

export async function buildPatternGraph(
  options: PipelineOptions,
): Promise<Result<BuildResult, PipelineError>> {
  const baseDir = path.resolve(options.baseDir);
  const warnings: PipelineWarning[] = [];
  const allDiagnostics: ExtractionDiagnostic[] = [];

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

  const scanResult = await scanPatterns(
    {
      patterns: options.input,
      baseDir,
      ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
    },
    registry,
  );
  if (!scanResult.ok) {
    return Result.err({
      step: 'scan-typescript',
      message: String(scanResult.error),
    });
  }
  const { files: scannedFiles, errors: scanErrors, skippedDirectives } = scanResult.value;

  if (options.failOnScanErrors === true && scanErrors.length > 0) {
    return Result.err({
      step: 'scan-typescript',
      message: `${String(scanErrors.length)} file${scanErrors.length === 1 ? '' : 's'} failed to scan`,
    });
  }

  if (scanErrors.length > 0) {
    warnings.push({
      type: 'scan',
      message: `Failed to scan ${String(scanErrors.length)} files (syntax errors)`,
      count: scanErrors.length,
    });
  }
  if (skippedDirectives.length > 0) {
    warnings.push({
      type: 'scan',
      message: `Skipped ${String(skippedDirectives.length)} invalid directives`,
      count: skippedDirectives.length,
    });
  }

  const extraction = extractPatterns(scannedFiles, baseDir, registry);
  if (extraction.errors.length > 0) {
    warnings.push({
      type: 'extraction',
      message: `${String(extraction.errors.length)} TypeScript patterns had errors`,
      count: extraction.errors.length,
    });
  }
  if (extraction.diagnostics.length > 0) {
    allDiagnostics.push(...extraction.diagnostics);
  }

  let gherkinPatterns: readonly ExtractedPattern[] = [];
  let featureParseFailures: readonly PatternParseFailure[] = [];
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

      if (gherkinErrors.length > 0) {
        featureParseFailures = gherkinErrors.flatMap((error) => {
          if (error.patternName === undefined) return [];

          const relativePath = normalizeFeaturePath(baseDir, error.file);
          const reason = formatGherkinParseReason(error.error);
          return [
            {
              kind: 'spec-parse-failed' as const,
              patternName: error.patternName,
              path: relativePath,
              message: reason,
              parseError: createFeatureParseError(relativePath, reason),
            },
          ];
        });
        warnings.push({
          type: 'gherkin-parse',
          message: `Failed to parse ${String(gherkinErrors.length)} feature file${gherkinErrors.length === 1 ? '' : 's'}`,
          count: gherkinErrors.length,
          details: gherkinErrors.map((error) => ({
            file: normalizeFeaturePath(baseDir, error.file),
            ...(error.error.line !== undefined && { line: error.error.line }),
            ...(error.error.column !== undefined && { column: error.error.column }),
            message: error.error.message,
          })),
        });
      }

      const gherkinResult = extractPatternsFromGherkin(gherkinFiles, {
        baseDir,
        tagRegistry: registry,
        scenariosAsUseCases: true,
      });
      gherkinPatterns = gherkinResult.patterns;

      if (gherkinResult.diagnostics.length > 0) {
        allDiagnostics.push(...gherkinResult.diagnostics);
      }

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
  }

  const mergeResult = mergePatterns(extraction.patterns, gherkinPatterns);
  let allMerged: readonly ExtractedPattern[];

  if (mergeResult.ok) {
    allMerged = mergeResult.value;
  } else if (options.mergeConflictStrategy === 'concatenate') {
    warnings.push({
      type: 'scan',
      message: `Pattern merge conflicts detected but concatenated per strategy: ${mergeResult.error}`,
    });
    allMerged = [...extraction.patterns, ...gherkinPatterns];
  } else {
    return Result.err({
      step: 'merge',
      message: mergeResult.error,
    });
  }

  const allPatterns = computeHierarchyChildren(allMerged);

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

  const scanMetadata: ScanMetadata = {
    scannedFileCount: scannedFiles.length,
    scanErrorCount: scanErrors.length,
    skippedDirectiveCount: skippedDirectives.length,
    gherkinErrorCount,
  };

  const contextInferenceRules = options.contextInferenceRules ?? DEFAULT_CONTEXT_INFERENCE_RULES;

  const rawDataset = {
    patterns: allPatterns,
    tagRegistry: registry,
    workflow,
    contextInferenceRules,
    featureParseFailures,
  };

  if (options.includeValidation === false) {
    const dataset = transformToPatternGraph(rawDataset);
    return Result.ok({
      graph: dataset,
      validation: {
        totalPatterns: allPatterns.length,
        malformedPatterns: [],
        danglingReferences: [],
        unknownStatuses: [],
        warningCount: 0,
      },
      warnings,
      scanMetadata,
      diagnostics: allDiagnostics,
    });
  }

  const { dataset, validation } = transformToPatternGraphWithValidation(rawDataset);
  return Result.ok({
    graph: dataset,
    validation,
    warnings,
    scanMetadata,
    diagnostics: allDiagnostics,
  });
}
