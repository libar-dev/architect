/**
 * @libar-docs
 * @libar-docs-core @libar-docs-infra
 * @libar-docs-pattern Documentation Generation Orchestrator
 * @libar-docs-status completed
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
import { loadConfig, formatConfigError } from '../config/config-loader.js';
import { scanPatterns } from '../scanner/index.js';
import { extractPatterns } from '../extractor/doc-extractor.js';
import { scanGherkinFiles } from '../scanner/gherkin-scanner.js';
import { extractPatternsFromGherkin, computeHierarchyChildren, } from '../extractor/gherkin-extractor.js';
import { generatorRegistry } from './registry.js';
import { Result as R } from '../types/index.js';
import { loadDefaultWorkflow, loadWorkflowFromPath, } from '../config/workflow-loader.js';
import { transformToMasterDataset } from './pipeline/index.js';
import { detectBranchChanges, getAllChangedFiles } from '../lint/process-guard/detect-changes.js';
/**
 * Codec for serializing registry metadata to JSON
 */
const RegistryMetadataCodec = createJsonOutputCodec(RegistryMetadataOutputSchema);
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
    // Step 1: Load configuration (discovers delivery-process.config.ts)
    const configResult = await loadConfig(baseDir);
    if (!configResult.ok) {
        return R.err(`Failed to load config: ${formatConfigError(configResult.error)}`);
    }
    const registry = configResult.value.instance.registry;
    // Step 2: Scan source files
    const scanResult = await scanPatterns({
        patterns: options.input,
        exclude: options.exclude,
        baseDir,
    }, registry);
    if (!scanResult.ok) {
        return R.err('Failed to scan source files');
    }
    const { files: scannedFiles, errors: scanErrors, skippedDirectives } = scanResult.value;
    // Record scan warnings
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
    // Step 4: Scan and extract patterns from Gherkin feature files (if provided)
    let gherkinPatterns = [];
    if (options.features !== null && options.features !== undefined && options.features.length > 0) {
        const gherkinScanResult = await scanGherkinFiles({
            patterns: options.features,
            baseDir,
            ...(options.exclude && { exclude: options.exclude }),
        });
        if (gherkinScanResult.ok) {
            const { files: gherkinFiles, errors: gherkinErrors } = gherkinScanResult.value;
            if (gherkinErrors.length > 0) {
                warnings.push({
                    type: 'scan',
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
                baseDir: options.baseDir,
                tagRegistry: registry,
                scenariosAsUseCases: true,
            });
            gherkinPatterns = gherkinResult.patterns;
            // Report Gherkin extraction errors as warnings (partial success)
            if (gherkinResult.errors.length > 0) {
                for (const error of gherkinResult.errors) {
                    // Include validation error details if available
                    const details = error.validationErrors && error.validationErrors.length > 0
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
    // Step 5: Merge patterns and detect conflicts
    const mergeResult = mergePatterns(extraction.patterns, gherkinPatterns);
    if (!mergeResult.ok) {
        return R.err(mergeResult.error);
    }
    // Step 6: Compute hierarchy relationships (parent → children)
    // This populates the `children` field on each pattern based on `parent` references
    const allPatterns = computeHierarchyChildren(mergeResult.value);
    // Step 7: Load workflow configuration
    let workflow;
    if (options.workflowPath) {
        const workflowResult = await loadWorkflowFromPath(options.workflowPath);
        if (!workflowResult.ok) {
            return R.err(`Failed to load workflow: ${workflowResult.error.message}`);
        }
        workflow = workflowResult.value;
    }
    else {
        // Load default workflow
        try {
            workflow = await loadDefaultWorkflow();
        }
        catch (error) {
            // Default workflow load failure is not fatal - continue without workflow
            warnings.push({
                type: 'config',
                message: `Could not load default workflow: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }
    // Step 8: Transform patterns into MasterDataset with pre-computed views
    // This is a single-pass transformation that computes all derived views:
    // byStatus, byPhase, byQuarter, byCategory, bySource, counts, relationships
    const masterDataset = transformToMasterDataset({
        patterns: allPatterns,
        tagRegistry: registry,
        workflow,
    });
    // Step 9: Build codec options for PR-scoped generators
    // Only compute if PR Changes generator is requested
    let codecOptions;
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
            ...(workflow && { workflow }),
            ...(codecOptions && { codecOptions }),
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
 * Merge patterns from TypeScript and Gherkin sources with conflict detection
 *
 * Exported for testing purposes - allows direct unit testing of merge logic
 * without running the full pipeline.
 *
 * @param tsPatterns - Patterns extracted from TypeScript files
 * @param gherkinPatterns - Patterns extracted from Gherkin feature files
 * @returns Result containing merged patterns or error if conflicts detected
 */
export function mergePatterns(tsPatterns, gherkinPatterns) {
    // Check for conflicts (same pattern name in both sources)
    const conflicts = [];
    const tsPatternNames = new Set(tsPatterns.map((p) => p.patternName ?? p.name));
    for (const gherkinPattern of gherkinPatterns) {
        const patternName = gherkinPattern.patternName ?? gherkinPattern.name;
        if (tsPatternNames.has(patternName)) {
            conflicts.push(patternName);
        }
    }
    if (conflicts.length > 0) {
        return R.err(`Pattern conflicts detected: ${conflicts.join(', ')}. ` +
            `These patterns are defined in both TypeScript and Gherkin sources. ` +
            `Each pattern should only be defined in one source.`);
    }
    // No conflicts - merge patterns
    return R.ok([...tsPatterns, ...gherkinPatterns]);
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
//# sourceMappingURL=orchestrator.js.map