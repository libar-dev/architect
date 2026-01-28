/**
 * Metadata loading and validation.
 *
 * @module @libar-dev/modular-claude-md/builder/loader
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Metadata, ValidationResult } from "../types.js";

/**
 * Load metadata from a JSON file.
 *
 * @param metadataPath - Path to metadata.json
 * @returns Parsed metadata
 * @throws Error if file not found or invalid JSON
 */
export function loadMetadata(metadataPath: string): Metadata {
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata file not found: ${metadataPath}`);
  }

  const content = fs.readFileSync(metadataPath, "utf-8");
  const metadata = JSON.parse(content) as Metadata;

  // Basic validation
  if (!metadata.document?.title) {
    throw new Error("Metadata missing document.title");
  }
  if (!Array.isArray(metadata.sections)) {
    throw new Error("Metadata missing sections array");
  }
  if (!Array.isArray(metadata.variations)) {
    throw new Error("Metadata missing variations array");
  }

  return metadata;
}

/**
 * Read a module file's content.
 *
 * @param baseDir - Base directory containing modules
 * @param filePath - Relative path to module file
 * @returns File content trimmed
 */
export function readModule(baseDir: string, filePath: string): string {
  const fullPath = path.join(baseDir, filePath);
  return fs.readFileSync(fullPath, "utf-8").trim();
}

/**
 * Check if a module file exists.
 *
 * @param baseDir - Base directory containing modules
 * @param filePath - Relative path to module file
 * @returns Whether the file exists
 */
export function moduleExists(baseDir: string, filePath: string): boolean {
  const fullPath = path.join(baseDir, filePath);
  return fs.existsSync(fullPath);
}

/**
 * Validate metadata configuration.
 *
 * @param metadata - Metadata to validate
 * @param baseDir - Base directory for module files
 * @param projectRoot - Project root for variation paths
 * @returns Validation result with errors and warnings
 */
export function validateMetadata(
  metadata: Metadata,
  baseDir: string,
  projectRoot: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate variation names
  const names = new Set<string>();
  for (const variation of metadata.variations) {
    if (names.has(variation.name)) {
      errors.push(`Duplicate variation name: ${variation.name}`);
    }
    names.add(variation.name);
  }

  // Check additive variation names don't conflict
  if (metadata.additive_variations) {
    for (const layer of metadata.additive_variations) {
      if (names.has(layer.name)) {
        errors.push(`Additive variation name conflicts with complete variation: ${layer.name}`);
      }
      names.add(layer.name);
    }
  }

  // Check all module files exist
  for (const section of metadata.sections) {
    for (const subsection of section.subsections) {
      if (!moduleExists(baseDir, subsection.path)) {
        errors.push(`Module not found: ${subsection.path}`);
      }
    }
  }

  // Check variation output paths exist
  for (const variation of metadata.variations) {
    const varPath = variation.path === "/" ? projectRoot : path.join(projectRoot, variation.path);
    if (!fs.existsSync(varPath)) {
      warnings.push(`Variation "${variation.name}": output path not found (${variation.path})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
