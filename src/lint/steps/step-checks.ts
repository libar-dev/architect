/**
 * Step-definition-only lint checks for vitest-cucumber compatibility.
 *
 * These checks scan .steps.ts files for patterns that vitest-cucumber
 * does not support, without needing the corresponding .feature file.
 */

import type { LintViolation } from '../../validation-schemas/lint.js';
import { STEP_LINT_RULES } from './types.js';
import { countBraceBalance } from './utils.js';

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
 * Matches the start of a scenario block in step definitions.
 * Captures: Scenario(, ScenarioOutline(, RuleScenario(, RuleScenarioOutline(
 */
const SCENARIO_BLOCK_START = /(?:Rule)?Scenario(?:Outline)?\s*\(/;

/**
 * Matches step registration calls and captures the pattern string.
 * Group 1: keyword (Given/When/Then/And/But)
 * Group 2: opening quote character (' or ")
 * Group 3: the pattern string (inside quotes)
 *
 * Uses a backreference (\2) to match the closing quote of the same type
 * as the opening quote. This correctly handles embedded quotes:
 *   And('it should include category "api"')  → captures full pattern
 *   And("it should include category 'api'")  → captures full pattern
 */
const STEP_REGISTRATION = /^\s*(Given|When|Then|And|But)\s*\(\s*(['"])(.*?)\2/;

/**
 * Check 11: Detect repeated step patterns within the same scenario block.
 *
 * When the same step pattern (e.g., Given('a state', ...)) is registered
 * twice in one Scenario block, vitest-cucumber overwrites the first
 * registration. Only the last callback runs, causing silent test failures
 * where assertions appear to pass but the setup was wrong.
 *
 * Detection: Track scenario blocks using brace-depth counting, collect
 * step registration patterns within each block, and flag duplicates.
 * The same pattern in different scenario blocks is fine — each block
 * has its own scope.
 */
export function checkRepeatedStepPattern(
  content: string,
  filePath: string
): readonly LintViolation[] {
  const violations: LintViolation[] = [];
  const lines = content.split('\n');

  let inScenarioBlock = false;
  let braceDepth = 0;
  // Map from "keyword:pattern" to first-seen line number
  let patternsInBlock = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Detect start of a new scenario block
    if (!inScenarioBlock && SCENARIO_BLOCK_START.test(line)) {
      inScenarioBlock = true;
      braceDepth = countBraceBalance(line);
      patternsInBlock = new Map();
      continue;
    }

    if (inScenarioBlock) {
      braceDepth += countBraceBalance(line);

      // Check for step registration
      const stepMatch = STEP_REGISTRATION.exec(line);
      if (stepMatch !== null) {
        const keyword = stepMatch[1] ?? '';
        const pattern = stepMatch[3] ?? '';
        const key = `${keyword}:${pattern}`;

        const previousLine = patternsInBlock.get(key);
        if (previousLine !== undefined) {
          violations.push({
            rule: STEP_LINT_RULES.repeatedStepPattern.id,
            severity: STEP_LINT_RULES.repeatedStepPattern.severity,
            message: `Step pattern ${keyword}('${pattern}') registered twice in this scenario — first at line ${previousLine}. Second registration overwrites the first`,
            file: filePath,
            line: i + 1,
          });
        } else {
          patternsInBlock.set(key, i + 1);
        }
      }

      // End of scenario block
      if (braceDepth <= 0) {
        inScenarioBlock = false;
        braceDepth = 0;
        patternsInBlock = new Map();
      }
    }
  }

  return violations;
}

/**
 * Run all step-only checks on a single file.
 */
export function runStepChecks(content: string, filePath: string): readonly LintViolation[] {
  return [
    ...checkRegexStepPatterns(content, filePath),
    ...checkPhraseUsage(content, filePath),
    ...checkRepeatedStepPattern(content, filePath),
  ];
}
