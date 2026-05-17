/**
 * @architect-bounded-context:execution-context
 */
/**
 * Builds the scope-readiness checks and verdicts for design and implement sessions.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import {
  ScopeTypeSchema,
  VALID_PROCESS_STATUS_SET,
  VALID_TRANSITIONS,
  findPatternByName,
  isPatternComplete,
} from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import {
  type ScopeReadinessCheck,
  type ScopeReadinessReport,
} from '../../fragments/execution-context/index.js';
import {
  getPatternName,
  getRelationships,
  normalizeDeliverables,
  requirePattern,
} from '../_shared/pattern-helpers.internal.js';

export const ScopeReadinessOptionsSchema = z
  .strictObject({
    pattern: z.string(),
    sessionType: ScopeTypeSchema,
    strict: z.boolean().optional(),
  })
  .readonly();

export type ScopeReadinessOptions = z.infer<typeof ScopeReadinessOptionsSchema>;

export function buildScopeReadinessReport(
  context: ProjectionContext,
  options: ScopeReadinessOptions,
): ScopeReadinessReport {
  const pattern = requirePattern(context, options.pattern);
  const patternName = getPatternName(pattern);

  const checks =
    options.sessionType === 'implement'
      ? [
          buildDependenciesCompletedCheck(context, patternName),
          buildDeliverablesDefinedCheck(pattern),
          buildFsmAllowsTransitionCheck(pattern),
          buildDesignDecisionsRecordedCheck(context, patternName),
          buildExecutableSpecsSetCheck(pattern),
        ]
      : [buildDependencyStubCheck(context, pattern)];

  const report: ScopeReadinessReport = {
    kind: 'ScopeReadinessReport',
    pattern: patternName,
    sessionType: options.sessionType,
    checks,
    verdict: deriveScopeVerdict(checks),
  };

  return options.strict === true ? promoteStrictScopeReadiness(report) : report;
}

function buildDependenciesCompletedCheck(
  context: ProjectionContext,
  patternName: string,
): ScopeReadinessCheck {
  const relationships = getRelationships(context, patternName);
  const dependencies = relationships?.dependsOn ?? [];

  if (dependencies.length === 0) {
    return createScopeReadinessCheck({
      checkId: 'dependencies-completed',
      label: 'Dependencies completed',
      severity: 'info',
      passed: true,
      details: 'No dependencies',
    });
  }

  const blockers = dependencies
    .map((dependencyName) => {
      const dependencyPattern = findPatternByName(context.graph, dependencyName);
      return {
        name: dependencyName,
        status: dependencyPattern?.status ?? 'unknown',
        complete: isPatternComplete(dependencyPattern?.status),
      };
    })
    .filter((dependency) => !dependency.complete)
    .map((dependency) => `${dependency.name} (${dependency.status})`);

  if (blockers.length === 0) {
    return createScopeReadinessCheck({
      checkId: 'dependencies-completed',
      label: 'Dependencies completed',
      severity: 'info',
      passed: true,
      details: `${String(dependencies.length)}/${String(dependencies.length)} completed`,
    });
  }

  return createScopeReadinessCheck({
    checkId: 'dependencies-completed',
    label: 'Dependencies completed',
    severity: 'error',
    passed: false,
    details:
      `${String(dependencies.length - blockers.length)}/${String(dependencies.length)} completed.` +
      ` Blockers: ${blockers.join(', ')}`,
  });
}

function buildDeliverablesDefinedCheck(pattern: ExtractedPattern): ScopeReadinessCheck {
  const deliverables = normalizeDeliverables(pattern);
  if (deliverables.length > 0) {
    return createScopeReadinessCheck({
      checkId: 'deliverables-defined',
      label: 'Deliverables defined',
      severity: 'info',
      passed: true,
      details: `${String(deliverables.length)} deliverable(s) found`,
    });
  }

  return createScopeReadinessCheck({
    checkId: 'deliverables-defined',
    label: 'Deliverables defined',
    severity: 'error',
    passed: false,
    details: 'No deliverables found in Background table',
  });
}

function buildFsmAllowsTransitionCheck(pattern: ExtractedPattern): ScopeReadinessCheck {
  const status = pattern.status;

  if (status === 'candidate') {
    return createScopeReadinessCheck({
      checkId: 'fsm-allows-transition',
      label: 'FSM allows transition',
      severity: 'error',
      passed: false,
      details:
        'candidate → active is not valid. Promote to roadmap first (candidate → roadmap → active)',
    });
  }

  if (!VALID_PROCESS_STATUS_SET.has(status)) {
    return createScopeReadinessCheck({
      checkId: 'fsm-allows-transition',
      label: 'FSM allows transition',
      severity: 'error',
      passed: false,
      details: `Unknown status: ${status}`,
    });
  }

  const processStatus = status;

  if (status === 'active') {
    return createScopeReadinessCheck({
      checkId: 'fsm-allows-transition',
      label: 'FSM allows transition',
      severity: 'info',
      passed: true,
      details: 'Already active — no transition needed',
    });
  }

  if (VALID_TRANSITIONS[processStatus].includes('active')) {
    return createScopeReadinessCheck({
      checkId: 'fsm-allows-transition',
      label: 'FSM allows transition',
      severity: 'info',
      passed: true,
      details: `${status} → active is valid`,
    });
  }

  const validAlternatives = VALID_TRANSITIONS[processStatus];
  return createScopeReadinessCheck({
    checkId: 'fsm-allows-transition',
    label: 'FSM allows transition',
    severity: 'error',
    passed: false,
    details:
      `${status} → active is not valid.` +
      (validAlternatives.length > 0 ? ` Valid from: ${validAlternatives.join(', ')}` : ''),
  });
}

function buildDesignDecisionsRecordedCheck(
  context: ProjectionContext,
  patternName: string,
): ScopeReadinessCheck {
  const stubPatterns = findStubPatterns(context, patternName);
  const decisionCount = stubPatterns.reduce(
    (count, stubPattern) =>
      count + extractDecisionReferences(stubPattern.directive.description).length,
    0,
  );

  if (decisionCount > 0) {
    return createScopeReadinessCheck({
      checkId: 'design-decisions-recorded',
      label: 'Design decisions recorded',
      severity: 'info',
      passed: true,
      details: `${String(decisionCount)} decision(s) found in ${String(stubPatterns.length)} stub(s)`,
    });
  }

  return createScopeReadinessCheck({
    checkId: 'design-decisions-recorded',
    label: 'Design decisions recorded',
    severity: 'warning',
    passed: false,
    details: 'No PDR/AD references found in stubs',
  });
}

function buildExecutableSpecsSetCheck(pattern: ExtractedPattern): ScopeReadinessCheck {
  if (pattern.executableSpecs !== undefined && pattern.executableSpecs.length > 0) {
    return createScopeReadinessCheck({
      checkId: 'executable-specs-set',
      label: 'Executable specs location set',
      severity: 'info',
      passed: true,
      details: pattern.executableSpecs.join(', '),
    });
  }

  if (pattern.behaviorFile !== undefined) {
    return createScopeReadinessCheck({
      checkId: 'executable-specs-set',
      label: 'Executable specs location set',
      severity: 'info',
      passed: true,
      details: pattern.behaviorFile,
    });
  }

  return createScopeReadinessCheck({
    checkId: 'executable-specs-set',
    label: 'Executable specs location set',
    severity: 'warning',
    passed: false,
    details: 'No @executable-specs tag found',
  });
}

function buildDependencyStubCheck(
  context: ProjectionContext,
  pattern: ExtractedPattern,
): ScopeReadinessCheck {
  const dependencies =
    getRelationships(context, getPatternName(pattern))?.dependsOn ?? pattern.uses ?? [];
  if (dependencies.length === 0) {
    return createScopeReadinessCheck({
      checkId: 'stubs-from-deps-exist',
      label: 'Stubs from dependencies exist',
      severity: 'info',
      passed: true,
      details: 'No dependencies to check',
    });
  }

  const missingDependencies = dependencies.filter((dependencyName) => {
    const stubPatterns = findStubPatterns(context, dependencyName);
    return stubPatterns.length === 0;
  });

  if (missingDependencies.length === 0) {
    return createScopeReadinessCheck({
      checkId: 'stubs-from-deps-exist',
      label: 'Stubs from dependencies exist',
      severity: 'info',
      passed: true,
      details: `All ${String(dependencies.length)} dependencies have stubs`,
    });
  }

  return createScopeReadinessCheck({
    checkId: 'stubs-from-deps-exist',
    label: 'Stubs from dependencies exist',
    severity: 'warning',
    passed: false,
    details:
      `${String(missingDependencies.length)}/${String(dependencies.length)} dependencies lack stubs.` +
      ` Missing: ${missingDependencies.join(', ')}`,
  });
}

function createScopeReadinessCheck(check: Omit<ScopeReadinessCheck, 'kind'>): ScopeReadinessCheck {
  return {
    kind: 'ScopeReadinessCheck',
    ...check,
  };
}

function deriveScopeVerdict(
  checks: readonly ScopeReadinessCheck[],
): ScopeReadinessReport['verdict'] {
  if (checks.some((check) => !check.passed && check.severity === 'error')) {
    return 'BLOCKED';
  }

  if (checks.some((check) => !check.passed && check.severity === 'warning')) {
    return 'WARN';
  }

  return 'PASS';
}

function promoteStrictScopeReadiness(report: ScopeReadinessReport): ScopeReadinessReport {
  const checks = report.checks.map((check) =>
    !check.passed && check.severity === 'warning'
      ? { ...check, severity: 'error' as const }
      : check,
  );

  return {
    ...report,
    checks,
    verdict: deriveScopeVerdict(checks),
  };
}

function findStubPatterns(
  context: ProjectionContext,
  implementedPattern: string,
): ExtractedPattern[] {
  const lowerImplementedPattern = implementedPattern.toLowerCase();
  return context.graph.patterns.filter(
    (pattern) =>
      pattern.source.file.includes('/stubs/') &&
      (pattern.implementsPatterns ?? []).some(
        (entry) => entry.toLowerCase() === lowerImplementedPattern,
      ),
  );
}

function extractDecisionReferences(description: string): readonly string[] {
  return [...description.matchAll(/\b(?:ADR|PDR|DD)-[A-Za-z0-9-]+\b/g)].map((match) => match[0]);
}
