/**
 * @architect
 * @architect-validation
 * @architect-pattern DoDValidator
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:validation
 * @architect-uses DoDValidationTypes, PatternGraph
 *
 * ## DoDValidator - Definition of Done Validation
 *
 * Validates that completed phases meet Definition of Done criteria:
 * 1. All deliverables must be in a terminal state (complete, n/a, or superseded)
 * 2. At least one @acceptance-criteria scenario must exist
 *
 * ### When to Use
 *
 * - Pre-release validation to ensure phases are truly complete
 * - CI pipeline checks to prevent premature "done" declarations
 * - Manual DoD checks during code review
 */

import type { Deliverable, ExtractedPattern } from '@libar-dev/architect-core';
import type { RuntimePatternGraph } from '@libar-dev/architect-core';
import type { DoDValidationResult, DoDValidationSummary } from './types.js';
import {
  getPatternName,
  isDeliverableStatusComplete,
  isDeliverableStatusTerminal,
  isPatternComplete,
} from '@libar-dev/architect-core';

/**
 * Check if a deliverable has "complete" status.
 *
 * This checks for the literal 'complete' status value only.
 * For DoD validation (which also accepts 'n/a' and 'superseded'),
 * see isDeliverableStatusTerminal().
 *
 * @param deliverable - The deliverable to check
 * @returns True if the deliverable status is 'complete'
 */
export function isDeliverableComplete(deliverable: Deliverable): boolean {
  return isDeliverableStatusComplete(deliverable.status);
}

/**
 * Check if a feature has @acceptance-criteria scenarios
 *
 * Scans scenarios for the @acceptance-criteria tag, which indicates
 * BDD-driven acceptance tests.
 *
 * @param pattern - The extracted Gherkin pattern to check
 * @returns True if at least one @acceptance-criteria scenario exists
 */
export function hasAcceptanceCriteria(pattern: ExtractedPattern): boolean {
  return (pattern.scenarios ?? []).some((scenario) => {
    const semanticMatch = scenario.semanticTags.some(
      (tag) => tag.toLowerCase() === 'acceptance-criteria',
    );
    const tagMatch = scenario.tags.some((tag) => tag.toLowerCase() === 'acceptance-criteria');
    return semanticMatch || tagMatch;
  });
}

/**
 * Extract acceptance criteria scenario names from a feature
 *
 * @param pattern - The extracted Gherkin pattern
 * @returns Array of scenario names with @acceptance-criteria tag
 */
export function extractAcceptanceCriteriaScenarios(pattern: ExtractedPattern): readonly string[] {
  return (pattern.scenarios ?? [])
    .filter((scenario) => {
      const semanticMatch = scenario.semanticTags.some(
        (tag) => tag.toLowerCase() === 'acceptance-criteria',
      );
      const tagMatch = scenario.tags.some((tag) => tag.toLowerCase() === 'acceptance-criteria');
      return semanticMatch || tagMatch;
    })
    .map((scenario) => scenario.scenarioName);
}

/**
 * Validate DoD for a single phase/pattern
 *
 * Checks:
 * 1. All deliverables must be in a terminal state (complete, n/a, superseded)
 * 2. At least one @acceptance-criteria scenario exists
 *
 * @param patternName - Name of the pattern being validated
 * @param phase - Phase number being validated
 * @param pattern - The extracted Gherkin pattern with deliverables and scenarios
 * @returns DoD validation result
 */
export function validateDoDForPhase(
  patternName: string,
  phase: number,
  pattern: ExtractedPattern,
): DoDValidationResult {
  const deliverables = pattern.deliverables ?? [];
  const messages: string[] = [];

  // Check deliverables — terminal states (complete, n/a, superseded) pass DoD
  const incompleteDeliverables = deliverables.filter((d) => !isDeliverableStatusTerminal(d.status));
  const allDeliverablesComplete = incompleteDeliverables.length === 0;

  if (deliverables.length === 0) {
    messages.push(`No deliverables defined for phase ${String(phase)}`);
  } else if (!allDeliverablesComplete) {
    messages.push(
      `${String(incompleteDeliverables.length)}/${String(deliverables.length)} deliverables incomplete`,
    );
    for (const d of incompleteDeliverables) {
      messages.push(`  - "${d.name}" (status: ${d.status})`);
    }
  }

  // Check acceptance criteria
  const missingAcceptanceCriteria = !hasAcceptanceCriteria(pattern);
  if (missingAcceptanceCriteria) {
    messages.push('No @acceptance-criteria scenarios found');
  }

  const isDoDMet = allDeliverablesComplete && !missingAcceptanceCriteria && deliverables.length > 0;

  if (isDoDMet) {
    messages.push(
      `DoD met: ${String(deliverables.length)} deliverables complete, AC scenarios present`,
    );
  }

  return {
    patternName,
    phase,
    isDoDMet,
    deliverables,
    incompleteDeliverables,
    missingAcceptanceCriteria,
    messages,
  };
}

/**
 * Get completed Gherkin patterns that participate in the deliverables workflow.
 *
 * Patterns without a phase do not participate in roadmap/DoD validation even if
 * they are completed (for example ADRs and executable behavior specs).
 *
 * @param dataset - Runtime PatternGraph with extracted Gherkin patterns
 * @param phaseFilter - Optional array of phase numbers to include
 * @returns Completed phased Gherkin patterns from the canonical read model
 */
export function getDeliverableWorkflowPatterns(
  dataset: RuntimePatternGraph,
  phaseFilter: readonly number[] = [],
): readonly ExtractedPattern[] {
  const shouldFilterPhases = phaseFilter.length > 0;

  return dataset.bySourceType.gherkin.filter((pattern) => {
    if (pattern.phase === undefined) return false;

    const isCompleted = isPatternComplete(pattern.status);
    return shouldFilterPhases ? phaseFilter.includes(pattern.phase) : isCompleted;
  });
}

/**
 * Validate DoD across multiple phases
 *
 * Filters to completed phases and validates each against DoD criteria.
 * Optionally filter to specific phases using phaseFilter.
 *
 * @param dataset - Runtime PatternGraph with extracted Gherkin patterns
 * @param phaseFilter - Optional array of phase numbers to validate (validates all if empty)
 * @returns Aggregate DoD validation summary
 *
 * @example
 * ```typescript
 * // Validate all completed phases
 * const summary = validateDoD(dataset);
 *
 * // Validate specific phase
 * const summary = validateDoD(dataset, [14]);
 * ```
 */
export function validateDoD(
  dataset: RuntimePatternGraph,
  phaseFilter: readonly number[] = [],
): DoDValidationSummary {
  const results: DoDValidationResult[] = [];

  for (const pattern of getDeliverableWorkflowPatterns(dataset, phaseFilter)) {
    if (pattern.phase === undefined) continue;

    const result = validateDoDForPhase(getPatternName(pattern), pattern.phase, pattern);
    results.push(result);
  }

  const passedPhases = results.filter((r) => r.isDoDMet).length;
  const failedPhases = results.filter((r) => !r.isDoDMet).length;

  return {
    results,
    totalPhases: results.length,
    passedPhases,
    failedPhases,
  };
}

/**
 * Format DoD validation summary for console output
 *
 * @param summary - DoD validation summary to format
 * @returns Multi-line string for pretty printing
 */
export function formatDoDSummary(summary: DoDValidationSummary): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('DoD Validation Summary');
  lines.push('======================');
  lines.push('');
  lines.push(`Total phases validated: ${String(summary.totalPhases)}`);
  lines.push(`Passed: ${String(summary.passedPhases)}`);
  lines.push(`Failed: ${String(summary.failedPhases)}`);
  lines.push('');

  if (summary.results.length === 0) {
    lines.push('No completed phases found to validate.');
    return lines.join('\n');
  }

  // Group by pass/fail
  const passed = summary.results.filter((r) => r.isDoDMet);
  const failed = summary.results.filter((r) => !r.isDoDMet);

  if (failed.length > 0) {
    lines.push('Failed Phases:');
    for (const result of failed) {
      lines.push(`  [FAIL] Phase ${String(result.phase)}: ${result.patternName}`);
      for (const msg of result.messages) {
        if (!msg.startsWith('DoD met')) {
          lines.push(`         ${msg}`);
        }
      }
    }
    lines.push('');
  }

  if (passed.length > 0) {
    lines.push('Passed Phases:');
    for (const result of passed) {
      const deliverableCount = result.deliverables.length;
      lines.push(
        `  [PASS] Phase ${String(result.phase)}: ${result.patternName} (${String(deliverableCount)} deliverables)`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}
