/**
 * Cross-file lint checks for vitest-cucumber compatibility.
 *
 * These checks compare a .feature file with its corresponding .steps.ts
 * file to detect mismatches in structure (Rule/And/ScenarioOutline patterns).
 */

import type { LintViolation } from '../../validation-schemas/lint.js';
import { STEP_LINT_RULES } from './types.js';
import { countBraceBalance } from './utils.js';

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

  // Check if step file destructures And anywhere.
  // NOTE: This regex matches And inside ANY curly brace pair, including object
  // literals with an `And` property. This is a theoretical false negative (would
  // pass when it should flag), which is the safe direction. In practice, step
  // files don't have object literals with `And` keys.
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
 * Step keyword pattern for matching step lines in feature files.
 */
const FEATURE_STEP_LINE = /^\s+(Given|When|Then|And|But)\s+(.+)$/;

/**
 * Extract column names from Examples tables belonging to a Scenario Outline.
 *
 * Scans forward from the given start index (the Scenario Outline line) until
 * the next section boundary. Collects column names from every Examples table
 * header row found within that range.
 */
function extractOutlineExamplesColumns(
  lines: readonly string[],
  outlineStartIndex: number
): ReadonlySet<string> {
  const columns = new Set<string>();
  let inExamples = false;
  let seenExamplesHeader = false;

  for (let i = outlineStartIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Stop at next section boundary (another Scenario, Rule, Feature, Background)
    if (
      /^\s*(Scenario Outline|Scenario Template|Scenario:|Feature:|Rule:|Background:)/.test(line)
    ) {
      break;
    }

    // Enter Examples block
    if (/^\s*Examples:/.test(line)) {
      inExamples = true;
      seenExamplesHeader = false;
      continue;
    }

    // Inside Examples: first table row is the header with column names
    if (inExamples && !seenExamplesHeader && /^\s*\|/.test(line)) {
      seenExamplesHeader = true;
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      for (const cell of cells) {
        columns.add(cell);
      }
    }
  }

  return columns;
}

/**
 * Check 12: Detect quoted values in Scenario Outline steps (feature-file side).
 *
 * When a Scenario Outline's steps use quoted values (e.g., "foo") instead of
 * angle-bracket placeholders (e.g., <column>), this suggests the author is
 * using the Scenario pattern (Cucumber expression matching) instead of the
 * ScenarioOutline pattern (variable substitution). This is the feature-file
 * side of the Two-Pattern Problem — the step-file side is caught by
 * scenario-outline-function-params.
 *
 * Detection: Find Scenario Outline sections in the feature file, extract the
 * Examples table column names, then check if step lines within those sections
 * contain quoted values whose content matches a column name. Only those are
 * flagged — constant quoted values (e.g., "error") that don't correspond to
 * any Examples column are intentionally literal and should not be placeholders.
 *
 * This is a cross-file check because it's only meaningful when a paired step
 * file exists (roadmap specs without implementations shouldn't be flagged).
 * The _stepContent parameter is unused but maintains the cross-check signature.
 */
export function checkOutlineQuotedValues(
  featureContent: string,
  _stepContent: string,
  stepFilePath: string,
  featurePath?: string
): readonly LintViolation[] {
  // Only check if the feature actually has Scenario Outline
  if (!/^\s*(Scenario Outline|Scenario Template):/m.test(featureContent)) {
    return [];
  }

  const violations: LintViolation[] = [];
  const lines = featureContent.split('\n');

  let inOutlineSection = false;
  let currentOutlineColumns: ReadonlySet<string> = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Enter Scenario Outline section
    if (/^\s*(Scenario Outline|Scenario Template):/.test(line)) {
      inOutlineSection = true;
      currentOutlineColumns = extractOutlineExamplesColumns(lines, i);
      continue;
    }

    // Exit on new section boundary (but not Examples, which is part of Outline)
    if (/^\s*(Scenario:|Feature:|Rule:|Background:)/.test(line)) {
      inOutlineSection = false;
      continue;
    }

    if (!inOutlineSection) continue;

    // Check step lines within the Outline section
    const stepMatch = FEATURE_STEP_LINE.exec(line);
    if (stepMatch !== null) {
      const stepText = stepMatch[2] ?? '';

      // Skip steps that already use placeholders — the author clearly knows
      // about the ScenarioOutline pattern and chose to keep quoted values literal
      const hasPlaceholders = /<\w+>/.test(stepText);
      if (hasPlaceholders) continue;

      // Extract all quoted values from the step
      const quotedValues: string[] = [];
      const doubleQuoteMatches = stepText.matchAll(/"([^"]*)"/g);
      for (const m of doubleQuoteMatches) {
        if (m[1] !== undefined) quotedValues.push(m[1]);
      }
      const singleQuoteMatches = stepText.matchAll(/'([^']*)'/g);
      for (const m of singleQuoteMatches) {
        if (m[1] !== undefined) quotedValues.push(m[1]);
      }

      // Only flag if at least one quoted value matches an Examples column name
      const matchesColumn = quotedValues.some((val) => currentOutlineColumns.has(val));
      if (matchesColumn) {
        violations.push({
          rule: STEP_LINT_RULES.outlineQuotedValues.id,
          severity: STEP_LINT_RULES.outlineQuotedValues.severity,
          message: `Scenario Outline step uses quoted values instead of <placeholder> syntax — this suggests the Scenario pattern (Cucumber expressions) rather than ScenarioOutline pattern (variable substitution)`,
          file: featurePath ?? stepFilePath,
          line: i + 1,
        });
      }
    }
  }

  return violations;
}

/**
 * Run all cross-file checks on a paired feature + step file.
 */
export function runCrossChecks(
  featureContent: string,
  stepContent: string,
  stepFilePath: string,
  featurePath?: string
): readonly LintViolation[] {
  return [
    ...checkScenarioOutlineFunctionParams(featureContent, stepContent, stepFilePath),
    ...checkMissingAndDestructuring(featureContent, stepContent, stepFilePath),
    ...checkMissingRuleWrapper(featureContent, stepContent, stepFilePath),
    ...checkOutlineQuotedValues(featureContent, stepContent, stepFilePath, featurePath),
  ];
}
