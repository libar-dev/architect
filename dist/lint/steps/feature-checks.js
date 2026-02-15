/**
 * Feature-only lint checks for vitest-cucumber compatibility.
 *
 * These checks scan raw .feature file text without needing the Gherkin parser
 * (which would fail on some of the very issues we're detecting).
 */
import { STEP_LINT_RULES } from './types.js';
import { stripQuotedContent } from './utils.js';
/**
 * Gherkin keywords that terminate a description context.
 * When one of these appears at the expected indentation, the description is over.
 */
const DESCRIPTION_TERMINATORS = /^\s*(Background:|Scenario:|Scenario Outline:|Rule:|@\S|Examples:|\||Given |When |Then |And |But )/;
/**
 * Keywords that start a description context.
 */
const DESCRIPTION_STARTERS = /^\s*(Feature:|Rule:)\s/;
/**
 * Step keywords at the start of a line (after whitespace).
 */
const STEP_LINE = /^(\s+)(Given|When|Then|And|But)\s+(.+)$/;
/**
 * Scenario boundary markers (for grouping steps by scenario).
 */
const SCENARIO_BOUNDARY = /^\s*(Scenario:|Scenario Outline:|Examples:|Rule:|Feature:)/;
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
export function checkHashInDescription(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    let inDescription = false;
    let inPseudoCodeBlock = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined)
            continue;
        // Start of description context
        if (DESCRIPTION_STARTERS.test(line)) {
            inDescription = true;
            inPseudoCodeBlock = false;
            continue;
        }
        // End of description context
        if (inDescription && DESCRIPTION_TERMINATORS.test(line)) {
            inDescription = false;
            inPseudoCodeBlock = false;
            continue;
        }
        if (!inDescription)
            continue;
        // Track """ pseudo-code-block boundaries within description
        if (/^\s*"""/.test(line)) {
            inPseudoCodeBlock = !inPseudoCodeBlock;
            continue;
        }
        // Only flag # inside """ pseudo-code-blocks — those are the dangerous ones
        if (inPseudoCodeBlock && /^\s*#/.test(line)) {
            violations.push({
                rule: STEP_LINT_RULES.hashInDescription.id,
                severity: STEP_LINT_RULES.hashInDescription.severity,
                message: `Line starts with # inside """ block in description — Gherkin parser will treat this as a comment, breaking the code example. Move to a step DocString or remove the #`,
                file: filePath,
                line: i + 1,
            });
        }
    }
    return violations;
}
/**
 * Check 7: Detect multiple And steps with identical text in the same scenario.
 *
 * vitest-cucumber fails when the same And step text appears twice in one scenario.
 * The fix is to consolidate into a single step with a DataTable or DocString.
 */
export function checkDuplicateAndSteps(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    let currentScenarioAndSteps = new Map();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined)
            continue;
        // New scenario boundary resets the And step collection
        if (SCENARIO_BOUNDARY.test(line)) {
            currentScenarioAndSteps = new Map();
            continue;
        }
        // Check for And steps
        const stepMatch = /^\s+And\s+(.+)$/.exec(line);
        if (stepMatch !== null) {
            const stepText = stepMatch[1]?.trim() ?? '';
            if (stepText === '')
                continue;
            const previousLine = currentScenarioAndSteps.get(stepText);
            if (previousLine !== undefined) {
                violations.push({
                    rule: STEP_LINT_RULES.duplicateAndStep.id,
                    severity: STEP_LINT_RULES.duplicateAndStep.severity,
                    message: `Duplicate And step text "${stepText}" — first seen at line ${previousLine}. Consolidate into a single step with DataTable`,
                    file: filePath,
                    line: i + 1,
                });
            }
            else {
                currentScenarioAndSteps.set(stepText, i + 1);
            }
        }
    }
    return violations;
}
/**
 * Check 8: Detect $ in Given/When/Then/And step text.
 *
 * The $ character causes matching issues in vitest-cucumber's
 * step expression parser.
 */
export function checkDollarInStepText(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined)
            continue;
        const stepMatch = STEP_LINE.exec(line);
        if (stepMatch !== null) {
            const stepText = stepMatch[3];
            if (stepText !== undefined && stripQuotedContent(stepText).includes('$')) {
                violations.push({
                    rule: STEP_LINT_RULES.dollarInStepText.id,
                    severity: STEP_LINT_RULES.dollarInStepText.severity,
                    message: `Step text contains $ character which causes matching issues in vitest-cucumber`,
                    file: filePath,
                    line: i + 1,
                });
            }
        }
    }
    return violations;
}
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
export function checkHashInStepText(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined)
            continue;
        const stepMatch = STEP_LINE.exec(line);
        if (stepMatch !== null) {
            const stepText = stepMatch[3];
            if (stepText !== undefined && stripQuotedContent(stepText).includes('#')) {
                violations.push({
                    rule: STEP_LINT_RULES.hashInStepText.id,
                    severity: STEP_LINT_RULES.hashInStepText.severity,
                    message: `Step text contains # outside quoted strings which may be interpreted as a comment, silently truncating the step`,
                    file: filePath,
                    line: i + 1,
                });
            }
        }
    }
    return violations;
}
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
export function checkKeywordInDescription(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    let inDescription = false;
    let inStepDocString = false;
    /** Keywords that break the parser when at the start of a description line */
    const KEYWORD_AT_LINE_START = /^\s*(Given|When|Then|And|But)\s/;
    /** Matches a """ delimiter line (with optional language hint) */
    const DOCSTRING_DELIMITER = /^\s*"""/;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined)
            continue;
        // Track step DocString boundaries (""" blocks outside description context).
        // Inside a step DocString, Feature:/Rule: are just quoted text — skip them.
        if (DOCSTRING_DELIMITER.test(line)) {
            if (!inDescription) {
                inStepDocString = !inStepDocString;
            }
            continue;
        }
        // While inside a step DocString, skip all other checks
        if (inStepDocString)
            continue;
        // Start of description context
        if (DESCRIPTION_STARTERS.test(line)) {
            inDescription = true;
            continue;
        }
        if (!inDescription)
            continue;
        // IMPORTANT: This keyword check MUST come before the DESCRIPTION_TERMINATORS
        // check below. The keyword IS what terminates the description (it's also in
        // DESCRIPTION_TERMINATORS), but we need to flag it as a violation FIRST
        // before exiting the description context. Reordering these blocks would
        // cause keywords to silently exit the description without being flagged.
        if (KEYWORD_AT_LINE_START.test(line)) {
            // But only flag if we're still in description context —
            // actual step lines inside Scenario blocks are fine
            violations.push({
                rule: STEP_LINT_RULES.keywordInDescription.id,
                severity: STEP_LINT_RULES.keywordInDescription.severity,
                message: `Description line starts with a Gherkin keyword — this breaks the parser. Rephrase to not start with Given/When/Then/And/But`,
                file: filePath,
                line: i + 1,
            });
            inDescription = false;
            continue;
        }
        // End of description context (non-keyword terminators)
        if (DESCRIPTION_TERMINATORS.test(line)) {
            inDescription = false;
            continue;
        }
    }
    return violations;
}
/**
 * Run all feature-only checks on a single file.
 */
export function runFeatureChecks(content, filePath) {
    return [
        ...checkHashInDescription(content, filePath),
        ...checkDuplicateAndSteps(content, filePath),
        ...checkDollarInStepText(content, filePath),
        ...checkHashInStepText(content, filePath),
        ...checkKeywordInDescription(content, filePath),
    ];
}
//# sourceMappingURL=feature-checks.js.map