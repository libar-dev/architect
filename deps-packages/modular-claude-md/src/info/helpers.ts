/**
 * Info Command Helpers
 *
 * Helper functions for the info command to analyze module structure,
 * extract headings, and validate module organization.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Metadata } from "../types.js";

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Heading info extracted from a module.
 */
export interface HeadingInfo {
  level: number; // 2 = ##, 3 = ###, 4 = ####
  text: string;
  line: number;
}

/**
 * Structure issue found in a module.
 */
export interface StructureIssue {
  module: string;
  issue: string;
  severity: "error" | "warning";
  details?: string;
}

// =============================================================================
// Module Analysis Functions
// =============================================================================

/**
 * Get line count for a module file.
 */
export function getModuleLines(baseDir: string, modulePath: string): number {
  const filePath = path.join(baseDir, modulePath);
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, "utf-8").split("\n").length;
}

/**
 * Extract headings from a module file.
 * Matches ## through #### (not # which is typically doc title).
 */
export function getModuleHeadings(baseDir: string, modulePath: string): HeadingInfo[] {
  const filePath = path.join(baseDir, modulePath);
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headings: HeadingInfo[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    // Match ## through #### (not # which is typically doc title)
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match && match[1] && match[2]) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: i + 1,
      });
    }
  }

  return headings;
}

// =============================================================================
// Tag Collection Functions
// =============================================================================

/**
 * Collect all unique tags from metadata.
 */
export function collectAllTags(metadata: Metadata): string[] {
  const tags = new Set<string>();
  for (const section of metadata.sections) {
    section.tags.forEach((t) => tags.add(t));
    for (const sub of section.subsections) {
      sub.tags.forEach((t) => tags.add(t));
    }
  }
  return [...tags].sort();
}

/**
 * Get modules matching a set of tags.
 */
export function getMatchingModules(
  metadata: Metadata,
  tags: string[]
): { path: string; tags: string[] }[] {
  const modules: { path: string; tags: string[] }[] = [];
  for (const section of metadata.sections) {
    for (const sub of section.subsections) {
      if (sub.tags.some((t) => tags.includes(t))) {
        modules.push({ path: sub.path, tags: sub.tags });
      }
    }
  }
  return modules;
}

// =============================================================================
// Structure Validation Functions
// =============================================================================

/**
 * Validate module heading structure.
 *
 * Rules:
 * - First heading should be ### (level 3) because section headers use ## (level 2)
 * - No heading should skip levels (e.g., ### directly to #####)
 * - Modules should have at least one heading
 */
export function validateModuleStructure(
  modulePath: string,
  headings: HeadingInfo[]
): StructureIssue[] {
  const issues: StructureIssue[] = [];
  const fileName = modulePath.split("/").pop() || modulePath;

  if (headings.length === 0) {
    issues.push({
      module: fileName,
      issue: "no-headings",
      severity: "warning",
      details: "Module has no headings",
    });
    return issues;
  }

  // Check first heading level - modules should start with ### (H3)
  // because the renderer outputs ## Section Title for each section
  const firstHeading = headings[0];
  if (firstHeading && firstHeading.level !== 3) {
    issues.push({
      module: fileName,
      issue: firstHeading.level < 3 ? "shallow-start" : "deep-start",
      severity: "error",
      details: `Starts with ${"#".repeat(firstHeading.level)} (should be ###): "${firstHeading.text}"`,
    });
  }

  // Check for level skips
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (prev && curr && curr.level > prev.level + 1) {
      issues.push({
        module: fileName,
        issue: "level-skip",
        severity: "warning",
        details: `Line ${curr.line}: ${"#".repeat(curr.level)} after ${"#".repeat(prev.level)} (skipped level)`,
      });
    }
  }

  return issues;
}
