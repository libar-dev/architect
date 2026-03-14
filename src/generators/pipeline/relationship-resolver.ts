/**
 * @libar-docs
 * @libar-docs-pattern RelationshipResolver
 * @libar-docs-status active
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-used-by TransformDataset
 * @libar-docs-uses ExtractedPattern, RelationshipEntry, ImplementationRef, PatternHelpers
 *
 * ## RelationshipResolver - Reverse Lookup and Dangling Reference Detection
 *
 * Computes reverse relationship lookups (implementedBy, extendedBy, enables, usedBy)
 * and detects dangling references in the pattern graph. These are the 2nd and 3rd
 * passes of the MasterDataset transformation pipeline.
 */

import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type {
  RelationshipEntry,
  ImplementationRef,
} from '../../validation-schemas/master-dataset.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import type { DanglingReference } from './transform-types.js';

/**
 * Build reverse lookups for relationship index entries.
 *
 * Iterates over patterns to compute:
 * - implementedBy: which patterns implement this pattern (with file + description)
 * - extendedBy: which patterns extend this pattern
 * - enables: which patterns depend on this pattern (reverse of dependsOn)
 * - usedBy: which patterns use this pattern (reverse of uses)
 *
 * Mutates the `relationshipIndex` entries in place, then sorts reverse-computed
 * arrays for consistent output ordering.
 *
 * @param patterns - All extracted patterns
 * @param relationshipIndex - Mutable relationship index (entries are mutated)
 */
export function buildReverseLookups(
  patterns: readonly ExtractedPattern[],
  relationshipIndex: Record<string, RelationshipEntry>
): void {
  for (const pattern of patterns) {
    const patternKey = getPatternName(pattern);
    const entry = relationshipIndex[patternKey];
    if (!entry) continue;

    // Build implementedBy reverse lookup with full ImplementationRef
    for (const implemented of entry.implementsPatterns) {
      const target = relationshipIndex[implemented];
      if (target) {
        const alreadyAdded = target.implementedBy.some(
          (impl: ImplementationRef) => impl.name === patternKey
        );
        if (!alreadyAdded) {
          const desc = pattern.directive.description;
          const firstLine = desc ? desc.split('\n')[0]?.trim() : undefined;
          const description =
            firstLine && firstLine.length > 0
              ? firstLine.slice(0, 100) + (firstLine.length > 100 ? '...' : '')
              : undefined;

          target.implementedBy.push({
            name: patternKey,
            file: pattern.source.file,
            description,
          });
        }
      }
    }

    // Build extendedBy reverse lookup
    if (entry.extendsPattern) {
      const target = relationshipIndex[entry.extendsPattern];
      if (target && !target.extendedBy.includes(patternKey)) {
        target.extendedBy.push(patternKey);
      }
    }

    // Build enables reverse lookup (dependsOn -> enables)
    for (const dep of entry.dependsOn) {
      const target = relationshipIndex[dep];
      if (target && !target.enables.includes(patternKey)) {
        target.enables.push(patternKey);
      }
    }

    // Build usedBy reverse lookup (uses -> usedBy)
    for (const used of entry.uses) {
      const target = relationshipIndex[used];
      if (target && !target.usedBy.includes(patternKey)) {
        target.usedBy.push(patternKey);
      }
    }
  }

  // Sort reverse-computed arrays for consistent output
  for (const entry of Object.values(relationshipIndex)) {
    entry.implementedBy.sort((a: ImplementationRef, b: ImplementationRef) =>
      a.file.localeCompare(b.file)
    );
    entry.extendedBy.sort((a, b) => a.localeCompare(b));
    entry.enables.sort((a, b) => a.localeCompare(b));
    entry.usedBy.sort((a, b) => a.localeCompare(b));
  }
}

/**
 * Detect dangling references in pattern relationship fields.
 *
 * Checks uses, dependsOn, implementsPatterns, extendsPattern, and seeAlso
 * fields for references to patterns that don't exist in the dataset.
 *
 * @param patterns - All extracted patterns
 * @param allPatternNames - Set of all valid pattern names
 * @returns Array of dangling references found
 */
export function detectDanglingReferences(
  patterns: readonly ExtractedPattern[],
  allPatternNames: ReadonlySet<string>
): DanglingReference[] {
  const danglingReferences: DanglingReference[] = [];

  for (const pattern of patterns) {
    const patternKey = getPatternName(pattern);

    for (const ref of pattern.uses ?? []) {
      if (!allPatternNames.has(ref)) {
        danglingReferences.push({ pattern: patternKey, field: 'uses', missing: ref });
      }
    }

    for (const ref of pattern.dependsOn ?? []) {
      if (!allPatternNames.has(ref)) {
        danglingReferences.push({ pattern: patternKey, field: 'dependsOn', missing: ref });
      }
    }

    for (const ref of pattern.implementsPatterns ?? []) {
      if (!allPatternNames.has(ref)) {
        danglingReferences.push({ pattern: patternKey, field: 'implementsPatterns', missing: ref });
      }
    }

    if (pattern.extendsPattern && !allPatternNames.has(pattern.extendsPattern)) {
      danglingReferences.push({
        pattern: patternKey,
        field: 'extendsPattern',
        missing: pattern.extendsPattern,
      });
    }

    for (const ref of pattern.seeAlso ?? []) {
      if (!allPatternNames.has(ref)) {
        danglingReferences.push({ pattern: patternKey, field: 'seeAlso', missing: ref });
      }
    }
  }

  return danglingReferences;
}
