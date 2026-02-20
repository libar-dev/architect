/**
 * @libar-docs
 * @libar-docs-core @libar-docs-infra
 * @libar-docs-pattern Documentation Generation Orchestrator
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-uses Pattern Scanner, Doc Extractor, Gherkin Scanner, Gherkin Extractor, Generator Registry, JSON Output Codec
 * @libar-docs-used-by CLI, Programmatic API
 * @libar-docs-usecase "When running full documentation generation pipeline"
 * @libar-docs-usecase "When merging TypeScript and Gherkin patterns"
 *
 * ## Documentation Generation Orchestrator - Full Pipeline Coordination
 *
 * Orchestrates the complete documentation generation pipeline:
 * Scanner → Extractor → Generators → File Writer
 *
 * Extracts business logic from CLI for programmatic use and testing.
 *
 * ### When to Use
 *
 * - Running complete documentation generation programmatically
 * - Integrating doc generation into build scripts
 * - Testing the full pipeline without CLI overhead
 *
 * ### Key Concepts
 *
 * - **Dual-Source Merging**: Combines TypeScript and Gherkin patterns
 * - **Generator Registry**: Looks up registered generators by name
 * - **Result Monad**: Returns detailed errors for partial failures
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import { createJsonOutputCodec, RegistryMetadataOutputSchema, } from '../validation-schemas/index.js';
import { mergeSourcesForGenerator } from '../config/merge-sources.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../config/defaults.js';
import { generatorRegistry } from './registry.js';
import { Result as R } from '../types/index.js';
import { buildMasterDataset } from './pipeline/index.js';
import { detectBranchChanges, getAllChangedFiles } from '../lint/process-guard/detect-changes.js';
import { registerReferenceGenerators } from './built-in/reference-generators.js';
/**
 * Codec for serializing registry metadata to JSON
 */
const RegistryMetadataCodec = createJsonOutputCodec(RegistryMetadataOutputSchema);
/**
 * Validate that a file path resolves within a base directory.
 *
 * Prevents path traversal attacks where a malicious file path like "../../../etc/passwd"
 * could escape the intended output directory.
 *
 * @param filePath - Relative file path to validate
 * @param baseDir - Base directory that the path must stay within
 * @returns true if resolved path is within baseDir, false otherwise
 */
function isPathWithinDir(filePath, baseDir) {
    const resolvedPath = path.resolve(baseDir, filePath);
    const normalizedBase = path.resolve(baseDir) + path.sep;
    return resolvedPath.startsWith(normalizedBase) || resolvedPath === path.resolve(baseDir);
}
/**
 * Generate documentation from TypeScript source code
 *
 * Orchestrates the complete pipeline:
 * 1. Load tag registry
 * 2. Scan source files for @libar-docs directives
 * 3. Extract patterns from directives
 * 4. Run specified generators
 * 5. Write output files
 *
 * @param options - Generation options
 * @returns Result with patterns, files, and any errors/warnings
 *
 * @example
 * ```typescript
 * import { generateDocumentation } from '@libar-dev/delivery-process/generators';
 * import '@libar-dev/delivery-process/generators/built-in';
 *
 * const result = await generateDocumentation({
 *   input: ['src/**\/*.ts'],
 *   baseDir: process.cwd(),
 *   outputDir: 'docs',
 *   generators: ['patterns'],
 *   overwrite: true
 * });
 *
 * console.log(`Generated ${result.files.length} files`);
 * console.log(`Extracted ${result.patterns.length} patterns`);
 * ```
 */
export async function generateDocumentation(options) {
    const errors = [];
    const warnings = [];
    const generatedFiles = [];
    // Resolve base directory
    const baseDir = path.resolve(options.baseDir);
    // DD-6: Normalize features (string | string[] | null → string[])
    const features = options.features === null || options.features === undefined
        ? []
        : typeof options.features === 'string'
            ? [options.features]
            : options.features;
    // Merge context inference rules: user rules take precedence (prepended to defaults)
    const mergedContextRules = options.contextInferenceRules
        ? [...options.contextInferenceRules, ...DEFAULT_CONTEXT_INFERENCE_RULES]
        : undefined; // let factory use defaults
    // DD-6: Delegate 8-step pipeline to shared factory
    const pipelineResult = await buildMasterDataset({
        input: options.input,
        features,
        baseDir,
        mergeConflictStrategy: 'fatal',
        ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
        ...(options.workflowPath !== null && options.workflowPath !== undefined
            ? { workflowPath: options.workflowPath }
            : {}),
        ...(mergedContextRules !== undefined ? { contextInferenceRules: mergedContextRules } : {}),
        includeValidation: false, // DD-3: orchestrator doesn't need validation
        failOnScanErrors: false, // DD-5: orchestrator collects errors as warnings
    });
    if (!pipelineResult.ok) {
        return R.err(`Pipeline error [${pipelineResult.error.step}]: ${pipelineResult.error.message}`);
    }
    // DD-6: Extract values from pipeline result
    const { dataset: masterDataset } = pipelineResult.value;
    const allPatterns = masterDataset.patterns;
    const registry = masterDataset.tagRegistry;
    const workflow = masterDataset.workflow;
    // DD-1: Map PipelineWarning[] → GenerationWarning[]
    for (const pw of pipelineResult.value.warnings) {
        warnings.push({
            type: pw.type === 'gherkin-parse' ? 'scan' : pw.type,
            message: pw.message,
            ...(pw.count !== undefined ? { count: pw.count } : {}),
            ...(pw.details !== undefined ? { details: [...pw.details] } : {}),
        });
    }
    // Step 9: Build codec options
    // Start with user-provided options, then overlay computed options
    let codecOptions = options.codecOptions;
    // Compute PR Changes options if that generator is requested
    if (options.generators.some((g) => g.trim() === 'pr-changes')) {
        // Use explicit changedFiles if provided, otherwise detect from git
        let changedFiles = options.changedFiles;
        if (!changedFiles && options.gitDiffBase) {
            const detectionResult = detectBranchChanges(baseDir, options.gitDiffBase);
            if (detectionResult.ok) {
                // Filter for relevant file types (source, tests, specs, features)
                changedFiles = getAllChangedFiles(detectionResult.value).filter((f) => f.endsWith('.ts') ||
                    f.endsWith('.tsx') ||
                    f.endsWith('.feature') ||
                    f.endsWith('.feature.md'));
            }
            else {
                warnings.push({
                    type: 'config',
                    message: `Git diff detection failed: ${detectionResult.error.message}. PR Changes will show all patterns.`,
                });
            }
        }
        codecOptions = {
            ...codecOptions,
            'pr-changes': {
                changedFiles: changedFiles ?? [],
                releaseFilter: options.releaseFilter ?? '',
                includeDeliverables: true,
                includeReviewChecklist: true,
                includeDependencies: true,
                includeBusinessValue: true,
                sortBy: 'phase',
            },
        };
    }
    // Step 10: Run generators
    for (const generatorName of options.generators) {
        const trimmedName = generatorName.trim();
        // Get generator from registry
        const generator = generatorRegistry.get(trimmedName);
        if (!generator) {
            errors.push({
                type: 'generator',
                message: `Unknown generator: "${trimmedName}". Available: ${generatorRegistry.available().join(', ')}`,
                generator: trimmedName,
            });
            continue; // Skip this generator, try others
        }
        // Build generator context with pre-computed masterDataset and codec options
        const context = {
            baseDir,
            outputDir: options.outputDir,
            registry,
            masterDataset,
            ...(workflow !== undefined ? { workflow } : {}),
            ...(codecOptions !== undefined ? { codecOptions } : {}),
        };
        // Generate files with merged patterns (TypeScript + Gherkin)
        let output;
        try {
            output = await generator.generate(allPatterns, context);
        }
        catch (error) {
            errors.push({
                type: 'generator',
                message: `Generator "${trimmedName}" failed: ${error instanceof Error ? error.message : String(error)}`,
                generator: trimmedName,
            });
            continue; // Skip this generator
        }
        // Write files
        for (const file of output.files) {
            const fullPath = path.join(options.outputDir, file.path);
            // Security: Validate path stays within output directory (prevent path traversal)
            if (!isPathWithinDir(file.path, options.outputDir)) {
                errors.push({
                    type: 'file-write',
                    message: `Path traversal attempt blocked: ${file.path}`,
                    filePath: file.path,
                    generator: trimmedName,
                });
                continue;
            }
            const dir = path.dirname(fullPath);
            // Check if file exists and overwrite is disabled
            let fileExists = false;
            try {
                await fs.access(fullPath);
                fileExists = true;
            }
            catch {
                // File doesn't exist
            }
            if (fileExists && options.overwrite !== true) {
                // Skip writing, but record in result
                generatedFiles.push({
                    path: file.path,
                    fullPath,
                    content: file.content,
                    generator: trimmedName,
                    written: false,
                });
                warnings.push({
                    type: 'overwrite-skipped',
                    message: `Skipped ${file.path} (exists, use overwrite: true to replace)`,
                    filePath: file.path,
                });
                continue;
            }
            // Write file
            try {
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(fullPath, file.content, 'utf-8');
                generatedFiles.push({
                    path: file.path,
                    fullPath,
                    content: file.content,
                    generator: trimmedName,
                    written: true,
                });
            }
            catch (error) {
                errors.push({
                    type: 'file-write',
                    message: `Failed to write ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
                    filePath: file.path,
                    generator: trimmedName,
                });
            }
        }
        // Write metadata (registry.json) if provided
        if (output.metadata) {
            const metadataPath = path.join(options.outputDir, 'registry.json');
            // Serialize using codec for type-safe validation
            const serializeResult = RegistryMetadataCodec.serialize(output.metadata, 'registry.json');
            if (!serializeResult.ok) {
                errors.push({
                    type: 'file-write',
                    message: `Failed to serialize registry.json: ${serializeResult.error.message}`,
                    filePath: 'registry.json',
                    generator: trimmedName,
                });
            }
            else {
                try {
                    await fs.writeFile(metadataPath, serializeResult.value, 'utf-8');
                    generatedFiles.push({
                        path: 'registry.json',
                        fullPath: metadataPath,
                        content: serializeResult.value,
                        generator: trimmedName,
                        written: true,
                    });
                }
                catch (error) {
                    errors.push({
                        type: 'file-write',
                        message: `Failed to write registry.json: ${error instanceof Error ? error.message : String(error)}`,
                        filePath: 'registry.json',
                        generator: trimmedName,
                    });
                }
            }
        }
        // Handle file cleanup (for session file lifecycle management)
        if (output.filesToDelete && output.filesToDelete.length > 0) {
            for (const fileToDelete of output.filesToDelete) {
                // Security: Validate path stays within output directory (prevent path traversal)
                if (!isPathWithinDir(fileToDelete, options.outputDir)) {
                    warnings.push({
                        type: 'cleanup',
                        message: `Path traversal blocked in cleanup: ${fileToDelete}`,
                        filePath: fileToDelete,
                    });
                    continue;
                }
                const fullPath = path.join(options.outputDir, fileToDelete);
                try {
                    await fs.unlink(fullPath);
                    // Track deletion as a warning for visibility
                    warnings.push({
                        type: 'cleanup',
                        message: `Cleaned up orphaned file: ${fileToDelete}`,
                        filePath: fileToDelete,
                    });
                }
                catch (unlinkError) {
                    // ENOENT is not an error - file was already deleted
                    if (unlinkError.code !== 'ENOENT') {
                        warnings.push({
                            type: 'cleanup',
                            message: `Failed to clean up ${fileToDelete}: ${unlinkError instanceof Error ? unlinkError.message : String(unlinkError)}`,
                            filePath: fileToDelete,
                        });
                    }
                }
            }
        }
    }
    // Clean up orphaned session files after generation
    // Identify session files that were written (to preserve them)
    const sessionFileRegex = /^sessions\/phase-\d+[a-z]?\.md$/;
    const writtenSessionFiles = new Set(generatedFiles
        .filter((f) => f.written && sessionFileRegex.test(f.path))
        .map((f) => path.basename(f.path)));
    // If any session files were written, clean up orphaned ones
    if (writtenSessionFiles.size > 0 || options.generators.some((g) => g.includes('session'))) {
        const cleanupResult = await cleanupOrphanedSessionFiles(options.outputDir, 'sessions/', writtenSessionFiles);
        // Add cleanup results to warnings for visibility
        for (const deletedFile of cleanupResult.deleted) {
            warnings.push({
                type: 'scan',
                message: `Cleaned up orphaned session file: ${deletedFile}`,
                filePath: deletedFile,
            });
        }
        for (const cleanupError of cleanupResult.errors) {
            warnings.push({
                type: 'scan',
                message: `Session cleanup warning: ${cleanupError}`,
            });
        }
    }
    // Return result with merged patterns
    return R.ok({
        patterns: allPatterns,
        files: generatedFiles,
        registry,
        errors,
        warnings,
    });
}
/**
 * Clean up orphaned session files in a directory.
 *
 * Deletes session files (phase-*.md) that are not in the preserve list.
 * This is used to clean up stale session files when phases complete.
 *
 * @param outputDir - Base output directory
 * @param sessionsDir - Subdirectory containing session files (e.g., "sessions/")
 * @param preserveFiles - Set of file basenames to preserve (e.g., "phase-39.md")
 * @returns Result with deleted files and any errors
 *
 * @example
 * ```typescript
 * const result = await cleanupOrphanedSessionFiles(
 *   "/output",
 *   "sessions/",
 *   new Set(["phase-39.md"])  // Keep active phase
 * );
 * console.log(`Deleted ${result.deleted.length} orphaned files`);
 * ```
 */
export async function cleanupOrphanedSessionFiles(outputDir, sessionsDir, preserveFiles) {
    const dirPath = path.join(outputDir, sessionsDir);
    const deleted = [];
    const errors = [];
    try {
        const existingFiles = await fs.readdir(dirPath);
        for (const file of existingFiles) {
            // Only process session files matching phase-*.md pattern
            if (!/^phase-\d+[a-z]?\.md$/.test(file)) {
                continue;
            }
            // Skip files in preserve list
            if (preserveFiles.has(file)) {
                continue;
            }
            // Delete orphaned file
            const fullPath = path.join(dirPath, file);
            try {
                await fs.unlink(fullPath);
                deleted.push(path.join(sessionsDir, file));
            }
            catch (unlinkError) {
                errors.push(`Failed to delete ${file}: ${unlinkError instanceof Error ? unlinkError.message : String(unlinkError)}`);
            }
        }
    }
    catch (readdirError) {
        // Directory doesn't exist - nothing to clean (not an error)
        if (readdirError.code !== 'ENOENT') {
            errors.push(`Failed to read ${sessionsDir}: ${readdirError instanceof Error ? readdirError.message : String(readdirError)}`);
        }
    }
    return { deleted, errors };
}
/**
 * Groups generators by their effective source config and output directory.
 *
 * Generators that share the same resolved sources (after applying per-generator
 * overrides) AND the same output directory are batched together to minimize
 * redundant pipeline scans.
 *
 * @param generatorNames - Names of generators to group
 * @param baseSources - Base resolved sources from project config
 * @param baseOutput - Base resolved output config
 * @param overrides - Per-generator source and output overrides
 * @returns Array of generator groups, each runnable as a single pipeline call
 */
function groupGenerators(generatorNames, baseSources, baseOutput, overrides) {
    const groupMap = new Map();
    for (const name of generatorNames) {
        const effective = mergeSourcesForGenerator(baseSources, name, overrides);
        const outputDir = overrides[name]?.outputDirectory ?? baseOutput.directory;
        const key = JSON.stringify({ sources: effective, outputDir });
        const existing = groupMap.get(key);
        if (existing !== undefined) {
            existing.generators.push(name);
        }
        else {
            groupMap.set(key, { generators: [name], sources: effective, outputDirectory: outputDir });
        }
    }
    return [...groupMap.values()];
}
/**
 * Merges results from multiple pipeline runs into a single GenerateResult.
 *
 * Patterns and files are concatenated from all runs. The registry from
 * the first run is used (all runs share the same config, so registries
 * are identical). Errors and warnings are aggregated.
 *
 * @param results - Array of GenerateResult from individual pipeline runs
 * @returns A single merged GenerateResult
 */
function mergeGenerateResults(results) {
    // Caller guarantees results.length >= 2, so first element always exists
    const firstResult = results[0];
    if (firstResult === undefined) {
        // Unreachable: only called with 2+ results, but satisfies strictNullChecks
        throw new Error('mergeGenerateResults called with empty results array');
    }
    return {
        patterns: results.flatMap((r) => r.patterns),
        files: results.flatMap((r) => r.files),
        registry: firstResult.registry,
        errors: results.flatMap((r) => r.errors),
        warnings: results.flatMap((r) => r.warnings),
    };
}
/**
 * Generate documentation from a fully resolved config.
 *
 * Groups generators by their effective source config, then calls
 * `generateDocumentation()` once per group. This reuses all existing
 * pipeline logic while minimizing redundant file scans.
 *
 * @param config - Fully resolved configuration (from `loadProjectConfig()`)
 * @param options - Optional overrides for generators, git diff, and release filter
 * @returns Result with merged patterns, files, errors, and warnings from all groups
 *
 * @example
 * ```typescript
 * import { generateFromConfig } from '@libar-dev/delivery-process/generators';
 * import { loadProjectConfig } from '@libar-dev/delivery-process/config';
 *
 * const config = await loadProjectConfig(process.cwd());
 * const result = await generateFromConfig(config, {
 *   generators: ['patterns', 'roadmap'],
 * });
 * ```
 */
export async function generateFromConfig(config, options) {
    const generatorNames = options?.generators ?? config.project.generators;
    if (generatorNames.length === 0) {
        return R.err('No generators specified');
    }
    // Register reference generators from config (explicit opt-in).
    // Done here (not at import time) because configs are user-provided.
    // Check both meta-generators: configs are partitioned by productArea presence.
    if (config.project.referenceDocConfigs.length > 0 &&
        !generatorRegistry.has('reference-docs') &&
        !generatorRegistry.has('product-area-docs')) {
        registerReferenceGenerators(generatorRegistry, config.project.referenceDocConfigs);
    }
    // Group generators by effective source config to minimize scans.
    // Generators sharing the same sources and output directory are batched
    // into one generateDocumentation() call.
    const groups = groupGenerators(generatorNames, config.project.sources, config.project.output, config.project.generatorOverrides);
    // Run each group through the existing pipeline
    const allResults = [];
    for (const group of groups) {
        // Merge codec options: config-level → runtime options (runtime takes precedence)
        const mergedCodecOptions = config.project.codecOptions !== undefined || options?.codecOptions !== undefined
            ? { ...config.project.codecOptions, ...options?.codecOptions }
            : undefined;
        const generateOptions = {
            input: [...group.sources.typescript],
            baseDir: process.cwd(),
            outputDir: group.outputDirectory,
            generators: [...group.generators],
            overwrite: config.project.output.overwrite,
            ...(group.sources.features.length > 0 && { features: [...group.sources.features] }),
            ...(group.sources.exclude.length > 0 && { exclude: [...group.sources.exclude] }),
            ...(config.project.workflowPath !== null && { workflowPath: config.project.workflowPath }),
            contextInferenceRules: [...config.project.contextInferenceRules],
            ...(options?.gitDiffBase !== undefined && { gitDiffBase: options.gitDiffBase }),
            ...(options?.changedFiles !== undefined && { changedFiles: [...options.changedFiles] }),
            ...(options?.releaseFilter !== undefined && { releaseFilter: options.releaseFilter }),
            ...(mergedCodecOptions !== undefined && { codecOptions: mergedCodecOptions }),
        };
        const result = await generateDocumentation(generateOptions);
        if (!result.ok) {
            return result;
        }
        allResults.push(result.value);
    }
    // Merge results from all groups
    // allResults is guaranteed non-empty because generatorNames.length > 0
    // and each group produces exactly one result (or we return early on error)
    if (allResults.length === 1) {
        const singleResult = allResults[0];
        if (singleResult === undefined) {
            return R.err('Unexpected empty results after successful generation');
        }
        return R.ok(singleResult);
    }
    return R.ok(mergeGenerateResults(allResults));
}
//# sourceMappingURL=orchestrator.js.map