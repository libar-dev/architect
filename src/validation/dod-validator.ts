/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DoDValidator
 * @libar-docs-status completed
 * @libar-docs-uses DoDValidationTypes, GherkinTypes, DualSourceExtractor
 *
 * ## DoDValidator - Definition of Done Validation
 *
 * Validates that completed phases meet Definition of Done criteria:
 * 1. All deliverables must have "complete" status
 * 2. At least one @acceptance-criteria scenario must exist
 *
 * ### When to Use
 *
 * - Pre-release validation to ensure phases are truly complete
 * - CI pipeline checks to prevent premature "done" declarations
 * - Manual DoD checks during code review
 */

import type { Deliverable, ScannedGherkinFile } from '../validation-schemas/index.js';
import { extractProcessMetadata, extractDeliverables } from '../extractor/dual-source-extractor.js';
import { normalizeStatus } from '../taxonomy/index.js';
import type { DoDValidationResult, DoDValidationSummary } from './types.js';
import { COMPLETION_PATTERNS } from './types.js';

/**
 * Check if a deliverable status indicates completion
 *
 * Matches various completion patterns including text ("Complete", "Done")
 * and symbols (✓, ✅, ☑).
 *
 * @param deliverable - The deliverable to check
 * @returns True if the deliverable is complete
 *
 * @example
 * ```typescript
 * isDeliverableComplete({ name: "Feature X", status: "Complete", tests: 5, location: "src/" })
 * // => true
 *
 * isDeliverableComplete({ name: "Feature Y", status: "In Progress", tests: 0, location: "src/" })
 * // => false
 * ```
 */
export function isDeliverableComplete(deliverable: Deliverable): boolean {
  const status = deliverable.status.toLowerCase().trim();

  for (const pattern of COMPLETION_PATTERNS) {
    if (status === pattern.toLowerCase() || status.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a feature has @acceptance-criteria scenarios
 *
 * Scans scenarios for the @acceptance-criteria tag, which indicates
 * BDD-driven acceptance tests.
 *
 * @param feature - The scanned feature file to check
 * @returns True if at least one @acceptance-criteria scenario exists
 */
export function hasAcceptanceCriteria(feature: ScannedGherkinFile): boolean {
  return feature.scenarios.some((scenario) =>
    scenario.tags.some((tag) => tag.toLowerCase() === 'acceptance-criteria')
  );
}

/**
 * Extract acceptance criteria scenario names from a feature
 *
 * @param feature - The scanned feature file
 * @returns Array of scenario names with @acceptance-criteria tag
 */
export function extractAcceptanceCriteriaScenarios(feature: ScannedGherkinFile): readonly string[] {
  return feature.scenarios
    .filter((scenario) => scenario.tags.some((tag) => tag.toLowerCase() === 'acceptance-criteria'))
    .map((scenario) => scenario.name);
}

/**
 * Validate DoD for a single phase/pattern
 *
 * Checks:
 * 1. All deliverables have "complete" status
 * 2. At least one @acceptance-criteria scenario exists
 *
 * @param patternName - Name of the pattern being validated
 * @param phase - Phase number being validated
 * @param feature - The scanned feature file with deliverables and scenarios
 * @returns DoD validation result
 */
export function validateDoDForPhase(
  patternName: string,
  phase: number,
  feature: ScannedGherkinFile
): DoDValidationResult {
  const deliverables = extractDeliverables(feature);
  const messages: string[] = [];

  // Check deliverables completion
  const incompleteDeliverables = deliverables.filter((d) => !isDeliverableComplete(d));
  const allDeliverablesComplete = incompleteDeliverables.length === 0;

  if (deliverables.length === 0) {
    messages.push(`No deliverables defined for phase ${phase}`);
  } else if (!allDeliverablesComplete) {
    messages.push(
      `${incompleteDeliverables.length}/${deliverables.length} deliverables incomplete`
    );
    for (const d of incompleteDeliverables) {
      messages.push(`  - "${d.name}" (status: ${d.status})`);
    }
  }

  // Check acceptance criteria
  const missingAcceptanceCriteria = !hasAcceptanceCriteria(feature);
  if (missingAcceptanceCriteria) {
    messages.push('No @acceptance-criteria scenarios found');
  }

  const isDoDMet = allDeliverablesComplete && !missingAcceptanceCriteria && deliverables.length > 0;

  if (isDoDMet) {
    messages.push(`DoD met: ${deliverables.length} deliverables complete, AC scenarios present`);
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
 * Validate DoD across multiple phases
 *
 * Filters to completed phases and validates each against DoD criteria.
 * Optionally filter to specific phases using phaseFilter.
 *
 * @param features - Array of scanned feature files
 * @param phaseFilter - Optional array of phase numbers to validate (validates all if empty)
 * @returns Aggregate DoD validation summary
 *
 * @example
 * ```typescript
 * // Validate all completed phases
 * const summary = validateDoD(features);
 *
 * // Validate specific phase
 * const summary = validateDoD(features, [14]);
 * ```
 */
export function validateDoD(
  features: readonly ScannedGherkinFile[],
  phaseFilter: readonly number[] = []
): DoDValidationSummary {
  const results: DoDValidationResult[] = [];
  const shouldFilterPhases = phaseFilter.length > 0;

  for (const feature of features) {
    const metadata = extractProcessMetadata(feature);
    if (!metadata) continue;

    // Only validate completed phases (or phases matching filter)
    const status = normalizeStatus(metadata.status);
    const isCompleted = status === 'completed';

    // If phase filter specified, validate those specific phases
    // Otherwise, only validate completed phases
    const shouldValidate = shouldFilterPhases ? phaseFilter.includes(metadata.phase) : isCompleted;

    if (!shouldValidate) continue;

    const result = validateDoDForPhase(metadata.pattern, metadata.phase, feature);
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
  lines.push(`Total phases validated: ${summary.totalPhases}`);
  lines.push(`Passed: ${summary.passedPhases}`);
  lines.push(`Failed: ${summary.failedPhases}`);
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
      lines.push(`  [FAIL] Phase ${result.phase}: ${result.patternName}`);
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
        `  [PASS] Phase ${result.phase}: ${result.patternName} (${deliverableCount} deliverables)`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}
