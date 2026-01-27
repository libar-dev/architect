/**
 * Content rendering for CLAUDE.md files.
 *
 * @module @libar-dev/modular-claude-md/builder/renderer
 */

import type { Metadata, Variation, AdditiveVariation } from "../types.js";
import { readModule, moduleExists } from "./loader.js";
import { sectionHasMatchingContent, getMatchingSubsections } from "./matcher.js";
import { transformPaths, transformAdditiveLayerPaths } from "./transformer.js";
import { log } from "../utils/colors.js";

/**
 * Build CLAUDE.md content for a complete variation.
 *
 * @param metadata - The metadata configuration
 * @param variation - The variation to build
 * @param baseDir - Base directory containing module files
 * @returns Generated CLAUDE.md content
 */
export function buildVariationContent(
  metadata: Metadata,
  variation: Variation,
  baseDir: string
): string {
  const parts: string[] = [];

  // Header
  parts.push(`# ${metadata.document.title}`);
  if (metadata.document.description) {
    parts.push("");
    parts.push(`> **${metadata.document.description}**`);
  }
  parts.push("");
  parts.push("---");
  parts.push("");

  // Preamble with critical rules (if defined)
  if (metadata.preamble) {
    if (metadata.preamble.tagline) {
      parts.push(`## ${metadata.preamble.tagline}`);
      parts.push("");
    }
    if (metadata.preamble.critical_rules && metadata.preamble.critical_rules.length > 0) {
      parts.push("### Key Rules");
      parts.push("");
      for (const rule of metadata.preamble.critical_rules) {
        parts.push(`- **${rule}**`);
      }
      parts.push("");
      parts.push("---");
      parts.push("");
    }
  }

  // Process each section that has matching content for this variation
  for (const section of metadata.sections) {
    if (!sectionHasMatchingContent(section, variation.tags)) {
      continue;
    }

    const matchingSubsections = getMatchingSubsections(section, variation.tags);
    if (matchingSubsections.length === 0) {
      continue;
    }

    // Add section header
    parts.push(`## ${section.title}`);
    parts.push("");

    // Add module contents from matching subsections
    for (const subsection of matchingSubsections) {
      if (moduleExists(baseDir, subsection.path)) {
        const rawContent = readModule(baseDir, subsection.path);
        // Transform relative paths based on variation's output location
        const content = transformPaths(rawContent, variation.path);
        parts.push(content);
        parts.push("");
      } else {
        log(`  Warning: Module not found: ${subsection.path}`, "yellow");
      }
    }

    parts.push("---");
    parts.push("");
  }

  return parts.join("\n").trim() + "\n";
}

/**
 * Build CLAUDE.md content for an additive layer.
 * Unlike complete variations, additive layers have a simplified header
 * and only contain content specific to that layer.
 *
 * @param metadata - The metadata configuration
 * @param layer - The additive layer to build
 * @param baseDir - Base directory containing module files
 * @returns Generated CLAUDE.md content for the layer
 */
export function buildAdditiveContent(
  metadata: Metadata,
  layer: AdditiveVariation,
  baseDir: string
): string {
  const parts: string[] = [];

  // Simplified header for additive layers
  parts.push(`# ${layer.name} Context`);
  parts.push("");
  if (layer.description) {
    parts.push(`> ${layer.description}`);
    parts.push("");
  }
  parts.push(
    `> **Note:** This is an additive layer. Load with: \`claude --add-dir ${layer.output_dir}\``
  );
  parts.push("");
  parts.push("---");
  parts.push("");

  // Process each section that has matching content for this layer
  for (const section of metadata.sections) {
    if (!sectionHasMatchingContent(section, layer.tags)) {
      continue;
    }

    const matchingSubsections = getMatchingSubsections(section, layer.tags);
    if (matchingSubsections.length === 0) {
      continue;
    }

    // Add section header
    parts.push(`## ${section.title}`);
    parts.push("");

    // Add module contents from matching subsections
    for (const subsection of matchingSubsections) {
      if (moduleExists(baseDir, subsection.path)) {
        const rawContent = readModule(baseDir, subsection.path);
        // Transform relative paths based on layer's output location
        const content = transformAdditiveLayerPaths(rawContent, layer.output_dir);
        parts.push(content);
        parts.push("");
      } else {
        log(`  Warning: Module not found: ${subsection.path}`, "yellow");
      }
    }

    parts.push("---");
    parts.push("");
  }

  return parts.join("\n").trim() + "\n";
}
