/**
 * @architect
 * @architect-pattern ScopeValidatorImpl
 * @architect-status completed
 * @architect-implements DataAPIDesignSessionSupport
 * @architect-uses ProcessStateAPI, MasterDataset, StubResolverImpl
 * @architect-used-by ProcessAPICLIImpl
 * @architect-target src/api/scope-validator.ts
 * @architect-arch-role service
 * @architect-arch-context api
 * @architect-arch-layer application
 *
 * ## ScopeValidator — Pre-flight Session Readiness Checker
 *
 * Pure function composition over ProcessStateAPI and MasterDataset.
 * Runs a checklist of prerequisite validations before starting a
 * design or implementation session.
 *
 * **When to Use:** When running pre-flight checks before a session via the `scope-validate` CLI subcommand.
 */

import type { ProcessStateAPI } from './process-state.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import { QueryApiError } from './types.js';
import { getPatternName, findPatternByName, firstImplements } from './pattern-helpers.js';
import { findStubPatterns, resolveStubs, extractDecisionItems } from './stub-resolver.js';
import { VALID_PROCESS_STATUS_SET } from '../taxonomy/index.js';
import { isPatternComplete } from '../taxonomy/normalized-status.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckSeverity = 'PASS' | 'BLOCKED' | 'WARN';

export type ScopeCheckId =
  | 'dependencies-completed'
  | 'stubs-from-deps-exist'
  | 'deliverables-defined'
  | 'fsm-allows-transition'
  | 'design-decisions-recorded'
  | 'executable-specs-set';

export interface ValidationCheck {
  readonly id: ScopeCheckId;
  readonly label: string;
  readonly severity: CheckSeverity;
  readonly detail: string;
  readonly blockerNames?: readonly string[];
}

export type ScopeType = 'implement' | 'design';

export interface ScopeValidationOptions {
  readonly patternName: string;
  readonly scopeType: ScopeType;
  readonly baseDir: string;
  /** When true, WARN checks are promoted to BLOCKED (DD-4, matches lint-process --strict). */
  readonly strict?: boolean;
}

export interface ScopeValidationResult {
  readonly pattern: string;
  readonly scopeType: ScopeType;
  readonly checks: readonly ValidationCheck[];
  readonly verdict: 'ready' | 'blocked' | 'warnings';
  readonly blockerCount: number;
  readonly warnCount: number;
}

// ---------------------------------------------------------------------------
// Valid statuses for FSM transition checks
// ---------------------------------------------------------------------------

const VALID_STATUSES = VALID_PROCESS_STATUS_SET;

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

export function validateScope(
  api: ProcessStateAPI,
  dataset: MasterDataset,
  options: ScopeValidationOptions
): ScopeValidationResult {
  const { patternName, scopeType, baseDir, strict } = options;

  const pattern = api.getPattern(patternName);
  if (pattern === undefined) {
    throw new QueryApiError('PATTERN_NOT_FOUND', `Pattern not found: "${patternName}"`);
  }

  const rawChecks: ValidationCheck[] = [];

  if (scopeType === 'implement') {
    rawChecks.push(checkDependenciesCompleted(api, patternName));
    rawChecks.push(checkDeliverablesDefined(api, patternName));
    rawChecks.push(checkFsmAllowsTransition(api, patternName));
    rawChecks.push(checkDesignDecisionsRecorded(dataset, patternName));
    rawChecks.push(checkExecutableSpecsSet(api, patternName));
  } else {
    rawChecks.push(checkStubsFromDepsExist(dataset, patternName, baseDir));
  }

  // DD-4: --strict promotes WARN → BLOCKED
  const checks: readonly ValidationCheck[] =
    strict === true
      ? rawChecks.map((c) => (c.severity === 'WARN' ? { ...c, severity: 'BLOCKED' as const } : c))
      : rawChecks;

  const blockerCount = checks.filter((c) => c.severity === 'BLOCKED').length;
  const warnCount = checks.filter((c) => c.severity === 'WARN').length;

  let verdict: 'ready' | 'blocked' | 'warnings';
  if (blockerCount > 0) {
    verdict = 'blocked';
  } else if (warnCount > 0) {
    verdict = 'warnings';
  } else {
    verdict = 'ready';
  }

  return {
    pattern: getPatternName(pattern),
    scopeType,
    checks,
    verdict,
    blockerCount,
    warnCount,
  };
}

// ---------------------------------------------------------------------------
// Text Formatter (co-located per PDR-002 DD-7)
// ---------------------------------------------------------------------------

export function formatScopeValidation(result: ScopeValidationResult): string {
  const sections: string[] = [];

  sections.push(`=== SCOPE VALIDATION: ${result.pattern} (${result.scopeType}) ===`);

  const checkLines = result.checks.map((c) => {
    const blockers =
      c.blockerNames !== undefined && c.blockerNames.length > 0
        ? `\n    Blockers: ${c.blockerNames.join(', ')}`
        : '';
    return `[${c.severity}] ${c.label}: ${c.detail}${blockers}`;
  });
  sections.push('=== CHECKLIST ===\n' + checkLines.join('\n'));

  let verdictText: string;
  if (result.verdict === 'blocked') {
    const blockerDetails = result.checks
      .filter((c) => c.severity === 'BLOCKED')
      .map((c) => `- ${c.label}: ${c.detail}`);
    verdictText =
      `BLOCKED: ${result.blockerCount} blocker(s) prevent ${result.scopeType} session` +
      '\n' +
      blockerDetails.join('\n');
  } else if (result.verdict === 'warnings') {
    verdictText = `READY (with ${result.warnCount} warning(s)): ${result.scopeType} session can proceed`;
  } else {
    verdictText = `READY: All checks passed for ${result.scopeType} session`;
  }
  sections.push('=== VERDICT ===\n' + verdictText);

  return sections.join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// Composable Check Functions — Implementation Session
// ---------------------------------------------------------------------------

export function checkDependenciesCompleted(
  api: ProcessStateAPI,
  patternName: string
): ValidationCheck {
  const deps = api.getPatternDependencies(patternName);
  const dependsOn = deps?.dependsOn ?? [];

  if (dependsOn.length === 0) {
    return {
      id: 'dependencies-completed',
      label: 'Dependencies completed',
      severity: 'PASS',
      detail: 'No dependencies',
    };
  }

  const blockers: string[] = [];
  for (const depName of dependsOn) {
    const depPattern = api.getPattern(depName);
    const status = depPattern?.status ?? 'unknown';
    if (!isPatternComplete(depPattern?.status)) {
      blockers.push(`${depName} (${status})`);
    }
  }

  if (blockers.length === 0) {
    return {
      id: 'dependencies-completed',
      label: 'Dependencies completed',
      severity: 'PASS',
      detail: `${dependsOn.length}/${dependsOn.length} completed`,
    };
  }

  return {
    id: 'dependencies-completed',
    label: 'Dependencies completed',
    severity: 'BLOCKED',
    detail: `${dependsOn.length - blockers.length}/${dependsOn.length} completed`,
    blockerNames: blockers,
  };
}

export function checkDeliverablesDefined(
  api: ProcessStateAPI,
  patternName: string
): ValidationCheck {
  const deliverables = api.getPatternDeliverables(patternName);

  if (deliverables.length > 0) {
    return {
      id: 'deliverables-defined',
      label: 'Deliverables defined',
      severity: 'PASS',
      detail: `${deliverables.length} deliverable(s) found`,
    };
  }

  return {
    id: 'deliverables-defined',
    label: 'Deliverables defined',
    severity: 'BLOCKED',
    detail: 'No deliverables found in Background table',
  };
}

export function checkFsmAllowsTransition(
  api: ProcessStateAPI,
  patternName: string
): ValidationCheck {
  const pattern = api.getPattern(patternName);
  const status = pattern?.status;

  if (status === undefined || !VALID_STATUSES.has(status)) {
    return {
      id: 'fsm-allows-transition',
      label: 'FSM allows transition',
      severity: 'BLOCKED',
      detail: `Unknown status: ${status ?? 'undefined'}`,
    };
  }

  // Pattern is already active — no transition needed for implement session
  if (status === 'active') {
    return {
      id: 'fsm-allows-transition',
      label: 'FSM allows transition',
      severity: 'PASS',
      detail: 'Already active — no transition needed',
    };
  }

  const isValid = api.isValidTransition(status, 'active');

  if (isValid) {
    return {
      id: 'fsm-allows-transition',
      label: 'FSM allows transition',
      severity: 'PASS',
      detail: `${status} → active is valid`,
    };
  }

  const check = api.checkTransition(status, 'active');
  const alternatives = check.validAlternatives ?? [];
  const altText = alternatives.length > 0 ? ` Valid from: ${alternatives.join(', ')}` : '';

  return {
    id: 'fsm-allows-transition',
    label: 'FSM allows transition',
    severity: 'BLOCKED',
    detail: `${status} → active is not valid.${altText}`,
  };
}

export function checkDesignDecisionsRecorded(
  dataset: MasterDataset,
  patternName: string
): ValidationCheck {
  const stubs = findStubPatterns(dataset);
  const lowerName = patternName.toLowerCase();

  const patternStubs = stubs.filter((s) => {
    const implName = firstImplements(s);
    return implName?.toLowerCase() === lowerName;
  });

  let totalDecisions = 0;
  for (const stub of patternStubs) {
    const decisions = extractDecisionItems(stub.directive.description);
    totalDecisions += decisions.length;
  }

  if (totalDecisions > 0) {
    return {
      id: 'design-decisions-recorded',
      label: 'Design decisions recorded',
      severity: 'PASS',
      detail: `${totalDecisions} decision(s) found in ${patternStubs.length} stub(s)`,
    };
  }

  return {
    id: 'design-decisions-recorded',
    label: 'Design decisions recorded',
    severity: 'WARN',
    detail: 'No PDR/AD references found in stubs',
  };
}

export function checkExecutableSpecsSet(
  api: ProcessStateAPI,
  patternName: string
): ValidationCheck {
  const pattern = api.getPattern(patternName);

  if (pattern?.behaviorFile !== undefined) {
    return {
      id: 'executable-specs-set',
      label: 'Executable specs location set',
      severity: 'PASS',
      detail: pattern.behaviorFile,
    };
  }

  return {
    id: 'executable-specs-set',
    label: 'Executable specs location set',
    severity: 'WARN',
    detail: 'No @executable-specs tag found',
  };
}

// ---------------------------------------------------------------------------
// Composable Check Functions — Design Session
// ---------------------------------------------------------------------------

export function checkStubsFromDepsExist(
  dataset: MasterDataset,
  patternName: string,
  baseDir: string
): ValidationCheck {
  const pattern = findPatternByName(dataset.patterns, patternName);
  const dependsOn = pattern?.dependsOn ?? [];

  if (dependsOn.length === 0) {
    return {
      id: 'stubs-from-deps-exist',
      label: 'Stubs from dependencies exist',
      severity: 'PASS',
      detail: 'No dependencies to check',
    };
  }

  const allStubs = findStubPatterns(dataset);
  const depsWithoutStubs: string[] = [];

  for (const depName of dependsOn) {
    const lowerDep = depName.toLowerCase();
    const depStubs = allStubs.filter((s) => {
      const implName = firstImplements(s);
      return implName?.toLowerCase() === lowerDep;
    });

    if (depStubs.length === 0) {
      depsWithoutStubs.push(depName);
      continue;
    }

    const resolved = resolveStubs(depStubs, baseDir);
    const anyExists = resolved.some((r) => r.targetExists);
    if (!anyExists) {
      depsWithoutStubs.push(depName);
    }
  }

  if (depsWithoutStubs.length === 0) {
    return {
      id: 'stubs-from-deps-exist',
      label: 'Stubs from dependencies exist',
      severity: 'PASS',
      detail: `All ${dependsOn.length} dependencies have stubs`,
    };
  }

  return {
    id: 'stubs-from-deps-exist',
    label: 'Stubs from dependencies exist',
    severity: 'WARN',
    detail: `${depsWithoutStubs.length}/${dependsOn.length} dependencies lack stubs`,
    blockerNames: depsWithoutStubs,
  };
}
