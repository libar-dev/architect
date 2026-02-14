/**
 * Cross-file lint checks for vitest-cucumber compatibility.
 *
 * These checks compare a .feature file with its corresponding .steps.ts
 * file to detect mismatches in structure (Rule/And/ScenarioOutline patterns).
 */

import type { LintViolation } from '../../validation-schemas/lint.js';
import { STEP_LINT_RULES } from './types.js';

/**
 * Check 1: Detect function params used inside ScenarioOutline blocks.
 *
 * In vitest-cucumber, ScenarioOutline step callbacks receive values via a
 * `variables` object — NOT via function parameters. Using (_ctx, value: string)
 * as callback args is the #1 trap: the value will be undefined at runtime.
 *
 * Detection: Find ScenarioOutline/RuleScenarioOutline blocks in step files,
 * then within those blocks look for step callbacks with a second positional
 * parameter after _ctx.
 *
 * The heuristic is conservative: we only flag when we see an explicit second
 * positional parameter pattern. False negatives are acceptable; false positives
 * are not.
 */
export function checkScenarioOutlineFunctionParams(
  featureContent: string,
  stepContent: string,
  stepFilePath: string
): readonly LintViolation[] {
  // Only check if the feature actually has Scenario Outline
  if (!/^\s*(Scenario Outline|Scenario Template):/m.test(featureContent)) {
    return [];
  }

  const violations: LintViolation[] = [];
  const lines = stepContent.split('\n');

  // Track whether we're inside a ScenarioOutline block using brace depth
  let inOutlineBlock = false;
  let braceDepth = 0;
  let outlineStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Detect ScenarioOutline( or RuleScenarioOutline( call
    if (!inOutlineBlock && /(?:Scenario|RuleScenario)Outline\s*\(/.test(line)) {
      inOutlineBlock = true;
      outlineStartLine = i + 1;
      // Count opening braces on this line to start depth tracking
      braceDepth = countBraceBalance(line);
      continue;
    }

    if (inOutlineBlock) {
      braceDepth += countBraceBalance(line);

      // Check for step callbacks with function params: Given('text', (_ctx, value: type) =>
      // The pattern: a step keyword, string arg, then a callback with 2+ params
      const paramMatch =
        /(?:Given|When|Then|And|But)\s*\(\s*['"][^'"]*['"]\s*,\s*\(\s*_?ctx\s*(?::\s*\w+)?\s*,\s*(\w+)/.exec(
          line
        );
      if (paramMatch !== null) {
        const paramName = paramMatch[1] ?? 'unknown';
        violations.push({
          rule: STEP_LINT_RULES.scenarioOutlineFunctionParams.id,
          severity: STEP_LINT_RULES.scenarioOutlineFunctionParams.severity,
          message: `Step callback inside ScenarioOutline uses function param "${paramName}" — use variables object instead (ScenarioOutline started at line ${outlineStartLine})`,
          file: stepFilePath,
          line: i + 1,
        });
      }

      // End of ScenarioOutline block
      if (braceDepth <= 0) {
        inOutlineBlock = false;
        braceDepth = 0;
      }
    }
  }

  return violations;
}

/**
 * Count the net brace balance on a line: +1 for {, -1 for }.
 * Ignores braces inside string literals (single/double/backtick quotes).
 */
function countBraceBalance(line: string): number {
  let balance = 0;
  let inString: string | null = null;
  let escaped = false;

  for (const ch of line) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (inString !== null) {
      if (ch === inString) {
        inString = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '{') balance++;
    if (ch === '}') balance--;
  }

  return balance;
}

/**
 * Check 2: Detect missing And destructuring.
 *
 * If a feature file has And steps, the step definition must destructure And
 * from the scenario callback. Using Then(...) for And steps causes
 * StepAbleUnknowStepError at runtime.
 */
export function checkMissingAndDestructuring(
  featureContent: string,
  stepContent: string,
  stepFilePath: string
): readonly LintViolation[] {
  // Check if feature has any And steps
  const hasAndSteps = /^\s+And\s+/m.test(featureContent);
  if (!hasAndSteps) {
    return [];
  }

  // Check if step file destructures And anywhere
  // Patterns: { Given, When, Then, And } or { And, Given, ... } etc.
  const destructuresAnd = /\{\s*[^}]*\bAnd\b[^}]*\}/.test(stepContent);
  if (destructuresAnd) {
    return [];
  }

  // Find the line of the describeFeature call for context
  const lines = stepContent.split('\n');
  let describeLine = 1;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln !== undefined && /describeFeature\s*\(/.test(ln)) {
      describeLine = i + 1;
      break;
    }
  }

  return [
    {
      rule: STEP_LINT_RULES.missingAndDestructuring.id,
      severity: STEP_LINT_RULES.missingAndDestructuring.severity,
      message: `Feature has And steps but step definition does not destructure And — add And to the destructuring pattern ({ Given, When, Then, And })`,
      file: stepFilePath,
      line: describeLine,
    },
  ];
}

/**
 * Check 3: Detect missing Rule() wrapper.
 *
 * If a feature file has Rule: blocks, the step definition must destructure
 * Rule from describeFeature and wrap scenarios with Rule('name', ...).
 * Using top-level Scenario() instead of RuleScenario() causes step
 * matching failures.
 */
export function checkMissingRuleWrapper(
  featureContent: string,
  stepContent: string,
  stepFilePath: string
): readonly LintViolation[] {
  // Check if feature has any Rule: blocks
  const hasRuleBlocks = /^\s*Rule:\s/m.test(featureContent);
  if (!hasRuleBlocks) {
    return [];
  }

  // Check if step file destructures Rule from describeFeature
  // Pattern: describeFeature(feature, ({ ... Rule ... }) =>
  // We look for Rule in any destructuring pattern, since it could appear anywhere
  const destructuresRule = /describeFeature\s*\([^,]*,\s*\(\s*\{[^}]*\bRule\b[^}]*\}/.test(
    stepContent
  );
  if (destructuresRule) {
    return [];
  }

  // Find the line of the describeFeature call for context
  const lines = stepContent.split('\n');
  let describeLine = 1;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln !== undefined && /describeFeature\s*\(/.test(ln)) {
      describeLine = i + 1;
      break;
    }
  }

  return [
    {
      rule: STEP_LINT_RULES.missingRuleWrapper.id,
      severity: STEP_LINT_RULES.missingRuleWrapper.severity,
      message: `Feature has Rule: blocks but step definition does not destructure Rule from describeFeature — use Rule('name', ({ RuleScenario }) => { ... })`,
      file: stepFilePath,
      line: describeLine,
    },
  ];
}

/**
 * Run all cross-file checks on a paired feature + step file.
 */
export function runCrossChecks(
  featureContent: string,
  stepContent: string,
  stepFilePath: string
): readonly LintViolation[] {
  return [
    ...checkScenarioOutlineFunctionParams(featureContent, stepContent, stepFilePath),
    ...checkMissingAndDestructuring(featureContent, stepContent, stepFilePath),
    ...checkMissingRuleWrapper(featureContent, stepContent, stepFilePath),
  ];
}
