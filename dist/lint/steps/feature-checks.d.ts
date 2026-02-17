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
 * Check 9: Detect # character inside step text (mid-line), outside quoted strings.
 *
 * Some Gherkin parsers interpret # as a comment delimiter even when it
 * appears in the middle of a step line, silently truncating the step text.
 * For example, "Given a file with # inside" becomes "Given a file with".
 *
 * However, # inside quoted string values (e.g. `"## DDD Patterns"`) is
 * safe — the Gherkin parser treats it as part of the string literal and
 * does not interpret it as a comment. Only unquoted # is flagged.
 *
 * This is distinct from hash-in-description (which catches # inside """
 * pseudo-code-blocks in descriptions). This check catches # in actual
 * Given/When/Then/And/But step lines.
 *
 * Pure comment lines (starting with #) do not match STEP_LINE, so they
 * are not flagged.
 */
export declare function checkHashInStepText(content: string, filePath: string): readonly LintViolation[];
/**
 * Check 10: Detect Gherkin keywords at the start of description lines.
 *
 * When a Feature or Rule description line starts with Given, When, Then,
 * And, or But, the Gherkin parser interprets it as a step definition
 * rather than description text. This terminates the description context
 * and causes parse errors on subsequent description lines.
 *
 * Detection uses a state machine to track description context — after
 * Feature: or Rule: lines, before Background:/Scenario:/etc. terminators.
 * Within that context, lines starting with step keywords are flagged.
 *
 * Step DocStrings (""" blocks after Given/When/Then steps) are tracked
 * separately. Feature:/Rule: appearing inside step DocStrings must NOT
 * trigger description mode — they are just quoted text content.
 */
export declare function checkKeywordInDescription(content: string, filePath: string): readonly LintViolation[];
/**
 * Run all feature-only checks on a single file.
 */
export declare function runFeatureChecks(content: string, filePath: string): readonly LintViolation[];
//# sourceMappingURL=feature-checks.d.ts.map