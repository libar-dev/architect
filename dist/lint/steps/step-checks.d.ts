/**
 * Step-definition-only lint checks for vitest-cucumber compatibility.
 *
 * These checks scan .steps.ts files for patterns that vitest-cucumber
 * does not support, without needing the corresponding .feature file.
 */
import type { LintViolation } from '../../validation-schemas/lint.js';
/**
 * Check 5: Detect regex patterns in step definitions.
 *
 * vitest-cucumber only supports string patterns with {string}/{int}.
 * Using regex patterns (e.g., Given(/pattern/, ...)) throws
 * StepAbleStepExpressionError.
 */
export declare function checkRegexStepPatterns(content: string, filePath: string): readonly LintViolation[];
/**
 * Check 6: Detect {phrase} usage in step definition strings.
 *
 * vitest-cucumber does not support the {phrase} Cucumber expression type.
 * Use {string} (with quoted values in the feature file) instead.
 */
export declare function checkPhraseUsage(content: string, filePath: string): readonly LintViolation[];
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
export declare function checkRepeatedStepPattern(content: string, filePath: string): readonly LintViolation[];
/**
 * Run all step-only checks on a single file.
 */
export declare function runStepChecks(content: string, filePath: string): readonly LintViolation[];
//# sourceMappingURL=step-checks.d.ts.map