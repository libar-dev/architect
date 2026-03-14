/**
 * @architect
 * @architect-core
 * @architect-pattern SequenceTransformUtils
 * @architect-status active
 * @architect-implements DesignReviewGeneration
 * @architect-arch-role service
 * @architect-arch-context generator
 * @architect-arch-layer application
 * @architect-include pipeline-stages
 * @architect-uses MasterDataset, ExtractedPattern
 * @architect-product-area:Generation
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
 * Tags arrive normalized (without @architect- prefix) from the scanner.
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

interface ParsedSequenceRule {
  readonly stepNumber: number;
  readonly ruleName: string;
  readonly modules: readonly string[];
  readonly annotations: SequenceAnnotations;
  readonly errorScenarios: readonly string[];
}

export interface SequenceIndexBuildResult {
  readonly entry: SequenceIndexEntry | undefined;
  readonly issues: readonly string[];
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
  return buildSequenceIndexEntryWithValidation(orchestrator, rules).entry;
}

/**
 * Build a SequenceIndexEntry and collect validation issues for malformed annotations.
 *
 * Returns:
 * - `entry` when the sequence annotations are valid
 * - `issues` when step-tagged rules are ambiguous or incomplete
 * - no entry and no issues when no rules have sequence-step tags
 */
export function buildSequenceIndexEntryWithValidation(
  orchestrator: string,
  rules: readonly BusinessRule[]
): SequenceIndexBuildResult {
  const steps: SequenceStep[] = [];
  const parsedRules: ParsedSequenceRule[] = [];
  const stepNumbers = new Map<number, string[]>();
  const issues: string[] = [];

  for (const rule of rules) {
    if (!rule.tags || rule.tags.length === 0) continue;

    const { step, modules } = parseRuleSequenceTags(rule.tags);
    if (step === undefined) continue;

    if (modules.length === 0) {
      issues.push(
        `Rule "${rule.name}" has @architect-sequence-step:${String(step)} but no @architect-sequence-module values`
      );
      continue;
    }

    const annotations = parseSequenceAnnotations(rule.description);
    const rulesForStep = stepNumbers.get(step) ?? [];
    rulesForStep.push(rule.name);
    stepNumbers.set(step, rulesForStep);

    parsedRules.push({
      stepNumber: step,
      ruleName: rule.name,
      modules,
      annotations,
      errorScenarios: rule.errorScenarioNames ?? [],
    });
  }

  for (const [stepNumber, ruleNames] of stepNumbers.entries()) {
    if (ruleNames.length > 1) {
      issues.push(
        `Duplicate @architect-sequence-step:${String(stepNumber)} used by rules: ${ruleNames.join(', ')}`
      );
    }
  }

  if (issues.length > 0) {
    return { entry: undefined, issues };
  }

  if (parsedRules.length === 0) {
    return { entry: undefined, issues: [] };
  }

  for (const parsedRule of parsedRules) {
    steps.push({
      stepNumber: parsedRule.stepNumber,
      ruleName: parsedRule.ruleName,
      modules: [...parsedRule.modules],
      input: parsedRule.annotations.input,
      output: parsedRule.annotations.output,
      invariant: parsedRule.annotations.invariant,
      errorScenarios: [...parsedRule.errorScenarios],
    });
  }

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
    entry: {
      orchestrator,
      steps,
      participants,
      errorPaths,
      dataFlowTypes,
    },
    issues: [],
  };
}
