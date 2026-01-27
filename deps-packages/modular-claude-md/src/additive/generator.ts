/**
 * Additive layer file generation.
 *
 * @module @libar-dev/modular-claude-md/additive/generator
 */

import type { Metadata, AdditiveVariation, BuildResult } from "../types.js";
import { buildAdditiveContent } from "../builder/renderer.js";
import { countMatchingModules } from "../builder/matcher.js";
import { writeVariationFile, getAdditiveOutputPath, createBuildResult } from "../utils/writer.js";
import { log, logSection } from "../utils/colors.js";

/**
 * Default token budget for additive layers (when not specified).
 */
const DEFAULT_ADDITIVE_BUDGET = 2000;

/**
 * Generate a single additive layer file.
 *
 * @param metadata - The metadata configuration
 * @param layer - The additive layer to generate
 * @param baseDir - Base directory containing module files
 * @param projectRoot - Project root for output
 * @param preview - If true, don't write files
 * @returns Build result
 */
export function generateAdditiveLayer(
  metadata: Metadata,
  layer: AdditiveVariation,
  baseDir: string,
  projectRoot: string,
  preview: boolean = false
): BuildResult {
  const content = buildAdditiveContent(metadata, layer, baseDir);
  const outputPath = getAdditiveOutputPath(layer, projectRoot);
  const budget = layer.budget_tokens ?? DEFAULT_ADDITIVE_BUDGET;

  writeVariationFile(outputPath, content, budget, preview);

  return createBuildResult(layer, content, outputPath, budget);
}

/**
 * Generate all additive layer files.
 *
 * @param metadata - The metadata configuration
 * @param baseDir - Base directory containing module files
 * @param projectRoot - Project root for output
 * @param preview - If true, don't write files
 * @returns Array of build results
 */
export function generateAllAdditiveLayers(
  metadata: Metadata,
  baseDir: string,
  projectRoot: string,
  preview: boolean = false
): BuildResult[] {
  const results: BuildResult[] = [];

  if (!metadata.additive_variations || metadata.additive_variations.length === 0) {
    log("No additive_variations defined in metadata.json", "yellow");
    return results;
  }

  logSection(preview ? "Preview Additive Layers" : "Generating Additive Layers");

  for (const layer of metadata.additive_variations) {
    log(`\n📄 ${layer.name}`, "bright");
    if (layer.description) {
      log(`   ${layer.description}`, "dim");
    }

    const moduleCount = countMatchingModules(metadata.sections, layer.tags);
    log(`   Modules: ${moduleCount} matching [${layer.tags.join(", ")}]`, "dim");

    const result = generateAdditiveLayer(metadata, layer, baseDir, projectRoot, preview);
    results.push(result);
  }

  return results;
}

/**
 * Get a specific additive layer by name.
 *
 * @param metadata - The metadata configuration
 * @param name - Layer name to find
 * @returns The additive layer or undefined
 */
export function getAdditiveLayer(metadata: Metadata, name: string): AdditiveVariation | undefined {
  return metadata.additive_variations?.find((layer) => layer.name === name);
}
