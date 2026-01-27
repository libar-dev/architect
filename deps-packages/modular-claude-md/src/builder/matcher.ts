/**
 * Tag matching logic for filtering content.
 *
 * @module @libar-dev/modular-claude-md/builder/matcher
 */

import type { Subsection, Section, Variation, AdditiveVariation } from "../types.js";

/**
 * Check if a subsection matches a variation's tags.
 * A subsection matches if it shares ANY tag with the variation (OR logic).
 *
 * @param subsection - The subsection to check
 * @param tags - Tags to match against
 * @returns Whether the subsection matches
 */
export function subsectionMatchesTags(subsection: Subsection, tags: string[]): boolean {
  return subsection.tags.some((tag) => tags.includes(tag));
}

/**
 * Check if a subsection matches a complete variation.
 */
export function subsectionMatchesVariation(subsection: Subsection, variation: Variation): boolean {
  return subsectionMatchesTags(subsection, variation.tags);
}

/**
 * Check if a subsection matches an additive layer.
 */
export function subsectionMatchesAdditive(
  subsection: Subsection,
  layer: AdditiveVariation
): boolean {
  return subsectionMatchesTags(subsection, layer.tags);
}

/**
 * Check if a section has any matching subsections for given tags.
 */
export function sectionHasMatchingContent(section: Section, tags: string[]): boolean {
  return section.subsections.some((sub) => subsectionMatchesTags(sub, tags));
}

/**
 * Get matching subsections for a section given tags.
 */
export function getMatchingSubsections(section: Section, tags: string[]): Subsection[] {
  return section.subsections.filter((sub) => subsectionMatchesTags(sub, tags));
}

/**
 * Count total modules that match given tags.
 */
export function countMatchingModules(sections: Section[], tags: string[]): number {
  let count = 0;
  for (const section of sections) {
    count += getMatchingSubsections(section, tags).length;
  }
  return count;
}
