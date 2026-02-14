/**
 * Step-definition-only lint checks for vitest-cucumber compatibility.
 *
 * These checks scan .steps.ts files for patterns that vitest-cucumber
 * does not support, without needing the corresponding .feature file.
 */

import type { LintViolation } from '../../validation-schemas/lint.js';
import { STEP_LINT_RULES } from './types.js';

/**
 * Matches step registration calls using regex patterns instead of strings.
 * Pattern: Given(/ or When(/ or Then(/ or And(/ — with optional whitespace.
 *
 * Excludes:
 * - Comment lines (// Given(/...))
 * - String arguments that happen to contain a forward slash
 */
const REGEX_STEP_PATTERN = /^\s*(?!\/\/)(Given|When|Then|And|But)\s*\(\s*\//;

/**
 * Matches step strings containing {phrase} — an unsupported Cucumber expression type.
 * Looks for step registration calls with a string argument containing {phrase}.
 */
const PHRASE_IN_STEP = /(?:Given|When|Then|And|But)\s*\(\s*['"][^'"]*\{phrase\}[^'"]*['"]/;

/**
 * Check 5: Detect regex patterns in step definitions.
 *
 * vitest-cucumber only supports string patterns with {string}/{int}.
 * Using regex patterns (e.g., Given(/pattern/, ...)) throws
 * StepAbleStepExpressionError.
 */
export function checkRegexStepPatterns(
  content: string,
  filePath: string
): readonly LintViolation[] {
  const violations: LintViolation[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    if (REGEX_STEP_PATTERN.test(line)) {
      violations.push({
        rule: STEP_LINT_RULES.regexStepPattern.id,
        severity: STEP_LINT_RULES.regexStepPattern.severity,
        message: `Regex step pattern detected — vitest-cucumber only supports string patterns with {string}/{int}`,
        file: filePath,
        line: i + 1,
      });
    }
  }

  return violations;
}

/**
 * Check 6: Detect {phrase} usage in step definition strings.
 *
 * vitest-cucumber does not support the {phrase} Cucumber expression type.
 * Use {string} (with quoted values in the feature file) instead.
 */
export function checkPhraseUsage(content: string, filePath: string): readonly LintViolation[] {
  const violations: LintViolation[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    if (PHRASE_IN_STEP.test(line)) {
      violations.push({
        rule: STEP_LINT_RULES.unsupportedPhraseType.id,
        severity: STEP_LINT_RULES.unsupportedPhraseType.severity,
        message: `{phrase} is not supported by vitest-cucumber — use {string} with quoted values in the feature file`,
        file: filePath,
        line: i + 1,
      });
    }
  }

  return violations;
}

/**
 * Run all step-only checks on a single file.
 */
export function runStepChecks(content: string, filePath: string): readonly LintViolation[] {
  return [...checkRegexStepPatterns(content, filePath), ...checkPhraseUsage(content, filePath)];
}
