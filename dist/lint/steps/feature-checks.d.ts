/**
 * Feature-only lint checks for vitest-cucumber compatibility.
 *
 * These checks scan raw .feature file text without needing the Gherkin parser
 * (which would fail on some of the very issues we're detecting).
 */
import type { LintViolation } from '../../validation-schemas/lint.js';
/**
 * Check 4: Detect # at line start inside a """ pseudo-code-block in description context.
 *
 * The @cucumber/gherkin parser treats # as a comment even inside
 * Feature/Rule descriptions. When authors embed code examples using
 * """ delimiters in descriptions, they expect those to act as code blocks.
 * But """ in descriptions is NOT a DocString — it's plain text. Any #
 * inside will terminate the description and cause cryptic parse errors.
 *
 * Plain # comments outside """ blocks are intentional Gherkin comments
 * and are NOT flagged (they gracefully terminate descriptions).
 *
 * Detection: State machine tracks description context AND whether we're
 * inside a """ pseudo-code-block within that description.
 */
export declare function checkHashInDescription(content: string, filePath: string): readonly LintViolation[];
/**
 * Check 7: Detect multiple And steps with identical text in the same scenario.
 *
 * vitest-cucumber fails when the same And step text appears twice in one scenario.
 * The fix is to consolidate into a single step with a DataTable or DocString.
 */
export declare function checkDuplicateAndSteps(content: string, filePath: string): readonly LintViolation[];
/**
 * Check 8: Detect $ in Given/When/Then/And step text.
 *
 * The $ character causes matching issues in vitest-cucumber's
 * step expression parser.
 */
export declare function checkDollarInStepText(content: string, filePath: string): readonly LintViolation[];
/**
 * Run all feature-only checks on a single file.
 */
export declare function runFeatureChecks(content: string, filePath: string): readonly LintViolation[];
//# sourceMappingURL=feature-checks.d.ts.map