/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern SequenceTransformUtils
 * @libar-docs-status active
 * @libar-docs-implements DesignReviewGeneration
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-include pipeline-stages
 * @libar-docs-uses MasterDataset, ExtractedPattern
 * @libar-docs-product-area:Generation
 *
 * ## SequenceTransformUtils - Sequence Index Builder
 *
 * Builds pre-computed SequenceIndexEntry objects from patterns that have
 * sequence diagram annotations. Used during the single-pass transform to
 * populate MasterDataset.sequenceIndex.
 *
 * ### Layer Boundary
 *
 * This module intentionally duplicates the Input/Output/Invariant regex
 * patterns from parseBusinessRuleAnnotations (renderable/codecs/helpers.ts)
 * to avoid a cross-layer dependency from pipeline → codec. The regexes are
 * simple (3 patterns) and stable.
 */

import type { BusinessRule } from '../../validation-schemas/extracted-pattern.js';
import type { SequenceStep, SequenceIndexEntry } from '../../validation-schemas/master-dataset.js';

// =============================================================================
// Tag Parsing (simple string split — no dependency on extractPatternTags)
// =============================================================================

interface RuleSequenceTags {
  readonly step: number | undefined;
  readonly modules: readonly string[];
}

/**
 * Parse sequence-step and sequence-module from a rule's tag array.
 *
 * Tags arrive normalized (without @libar-docs- prefix) from the scanner.
 */
function parseRuleSequenceTags(tags: readonly string[]): RuleSequenceTags {
  let step: number | undefined;
  const modules: string[] = [];
  for (const tag of tags) {
    if (tag.startsWith('sequence-step:')) {
      const parsed = parseInt(tag.split(':')[1] ?? '', 10);
      if (!Number.isNaN(parsed)) {
        step = parsed;
      }
    } else if (tag.startsWith('sequence-module:')) {
      const value = tag.split(':')[1] ?? '';
      modules.push(
        ...value
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
      );
    }
  }
  return { step, modules };
}

// =============================================================================
// Annotation Parsing (lightweight — 3 fields only)
// =============================================================================

interface SequenceAnnotations {
  readonly input: string | undefined;
  readonly output: string | undefined;
  readonly invariant: string | undefined;
}

/**
 * Extract Input, Output, and Invariant from a rule description.
 *
 * Duplicates the regex patterns from parseBusinessRuleAnnotations in
 * renderable/codecs/helpers.ts to avoid a cross-layer import.
 */
function parseSequenceAnnotations(description: string): SequenceAnnotations {
  let input: string | undefined;
  let output: string | undefined;
  let invariant: string | undefined;

  const invariantPattern = /\*\*Invariant:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const invariantMatch = invariantPattern.exec(description);
  if (invariantMatch?.[1]) {
    invariant = invariantMatch[1]
      .replace(/\n\s*\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const inputPattern = /\*\*Input:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const inputMatch = inputPattern.exec(description);
  if (inputMatch?.[1]) {
    input = inputMatch[1]
      .replace(/\n\s*\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const outputPattern = /\*\*Output:\*\*\s*([\s\S]*?)(?=\*\*[A-Z]|\*\*$|$)/i;
  const outputMatch = outputPattern.exec(description);
  if (outputMatch?.[1]) {
    output = outputMatch[1]
      .replace(/\n\s*\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return { input, output, invariant };
}

// =============================================================================
// Data Flow Type Extraction
// =============================================================================

/**
 * Extract the type name from an Input or Output annotation string.
 *
 * Format: "TypeName -- field1, field2, field3" → "TypeName"
 * Or just: "TypeName" → "TypeName"
 */
function extractTypeName(annotation: string): string {
  const dashIndex = annotation.indexOf('--');
  if (dashIndex >= 0) {
    return annotation.slice(0, dashIndex).trim();
  }
  return annotation.trim();
}

/**
 * Decide whether an annotation should contribute to dataFlowTypes.
 *
 * Keeps structured type declarations (`TypeName -- fields`), bare identifiers,
 * and type-ish parameter signatures such as `targetDir: string`, while excluding
 * prose outputs like "package.json updated with process and docs scripts".
 */
function extractDataFlowTypeName(annotation: string): string | undefined {
  const trimmed = annotation.trim();
  if (trimmed.length === 0) return undefined;

  if (trimmed.includes('--')) {
    return extractTypeName(trimmed);
  }

  if (!/\s/.test(trimmed)) {
    return trimmed;
  }

  return /[:<>{}\[\]|&()]/.test(trimmed) ? trimmed : undefined;
}

// =============================================================================
// Index Builder
// =============================================================================

/**
 * Build a SequenceIndexEntry from a pattern's orchestrator and business rules.
 *
 * Returns undefined if no rules have sequence-step tags (the pattern has an
 * orchestrator annotation but no step-annotated rules).
 */
export function buildSequenceIndexEntry(
  orchestrator: string,
  rules: readonly BusinessRule[]
): SequenceIndexEntry | undefined {
  const steps: SequenceStep[] = [];

  for (const rule of rules) {
    if (!rule.tags || rule.tags.length === 0) continue;

    const { step, modules } = parseRuleSequenceTags(rule.tags);
    if (step === undefined) continue;

    const annotations = parseSequenceAnnotations(rule.description);

    steps.push({
      stepNumber: step,
      ruleName: rule.name,
      modules,
      input: annotations.input,
      output: annotations.output,
      invariant: annotations.invariant,
      errorScenarios: rule.errorScenarioNames ?? [],
    });
  }

  if (steps.length === 0) return undefined;

  // Sort by step number
  steps.sort((a, b) => a.stepNumber - b.stepNumber);

  // Deduplicate participants: orchestrator first, then modules in step order
  const seen = new Set<string>([orchestrator]);
  const participants: string[] = [orchestrator];
  for (const step of steps) {
    for (const mod of step.modules) {
      if (!seen.has(mod)) {
        seen.add(mod);
        participants.push(mod);
      }
    }
  }

  // Collect all error scenario names
  const errorPaths = steps.flatMap((s) => s.errorScenarios);

  // Collect distinct data flow type names from Input/Output
  const typeNames = new Set<string>();
  for (const step of steps) {
    if (step.input) {
      const inputType = extractDataFlowTypeName(step.input);
      if (inputType) {
        typeNames.add(inputType);
      }
    }
    if (step.output) {
      const outputType = extractDataFlowTypeName(step.output);
      if (outputType) {
        typeNames.add(outputType);
      }
    }
  }
  const dataFlowTypes = [...typeNames];

  return {
    orchestrator,
    steps,
    participants,
    errorPaths,
    dataFlowTypes,
  };
}
