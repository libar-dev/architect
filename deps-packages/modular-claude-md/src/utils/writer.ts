/**
 * File writing utilities.
 *
 * @module @libar-dev/modular-claude-md/utils/writer
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { BuildResult, Variation, AdditiveVariation } from "../types.js";
import { log, formatStatus } from "./colors.js";
import { estimateTokens } from "./tokens.js";

/**
 * Write a variation's content to disk.
 *
 * @param outputPath - The path to write to
 * @param content - The content to write
 * @param budget - Token budget for reporting
 * @param preview - If true, don't write files
 */
export function writeVariationFile(
  outputPath: string,
  content: string,
  budget: number,
  preview: boolean
): void {
  const tokens = estimateTokens(content);
  const status = formatStatus(tokens, budget);

  if (preview) {
    log(`  Would write: ${outputPath}`, "dim");
    log(`  Tokens: ~${tokens} / ${budget} ${status.text}`, status.color);
    log(`  Size: ${content.length} bytes`);
  } else {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content, "utf-8");
    log(`  Written: ${outputPath}`, "green");
    log(`  Tokens: ~${tokens} / ${budget} ${status.text}`, status.color);
  }
}

/**
 * Calculate output path for a complete variation.
 */
export function getVariationOutputPath(variation: Variation, projectRoot: string): string {
  return variation.path === "/"
    ? path.join(projectRoot, "CLAUDE.md")
    : path.join(projectRoot, variation.path, "CLAUDE.md");
}

/**
 * Calculate output path for an additive layer.
 */
export function getAdditiveOutputPath(layer: AdditiveVariation, projectRoot: string): string {
  return path.join(projectRoot, layer.output_dir, "CLAUDE.md");
}

/**
 * Create a BuildResult from content.
 */
export function createBuildResult(
  variation: Variation | AdditiveVariation,
  content: string,
  outputPath: string,
  budget: number
): BuildResult {
  const tokens = estimateTokens(content);
  return {
    variation,
    content,
    outputPath,
    tokens,
    withinBudget: tokens <= budget,
  };
}
