/**
 * Feature-only lint checks for vitest-cucumber compatibility.
 *
 * These checks scan raw .feature file text without needing the Gherkin parser
 * (which would fail on some of the very issues we're detecting).
 */
import { STEP_LINT_RULES } from './types.js';
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
            if (stepText?.includes('$') === true) {
                // Skip <placeholder> patterns in ScenarioOutline — those are valid
                // and the $ might be in an Examples table value, not the step text itself
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
 * Run all feature-only checks on a single file.
 */
export function runFeatureChecks(content, filePath) {
    return [
        ...checkHashInDescription(content, filePath),
        ...checkDuplicateAndSteps(content, filePath),
        ...checkDollarInStepText(content, filePath),
    ];
}
//# sourceMappingURL=feature-checks.js.map