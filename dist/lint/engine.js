/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern LintEngine
 * @libar-docs-status completed
 * @libar-docs-uses LintRules, CodecUtils
 * @libar-docs-used-by LintPatternsCLI
 *
 * ## LintEngine - Rule Execution Orchestrator
 *
 * Orchestrates lint rule execution against parsed directives.
 * Takes scanned @libar-docs-* directives and runs quality rules against them,
 * collecting violations and computing summary statistics for CI enforcement.
 *
 * ### When to Use
 *
 * - Use when validating annotation quality across multiple files
 * - Use when building CI pipelines for documentation standards
 * - Use for formatting lint results (pretty or JSON output)
 */
import { severityOrder, } from './rules.js';
import { createJsonOutputCodec, LintOutputSchema, } from '../validation-schemas/index.js';
/**
 * Codec for serializing lint output to JSON
 */
const LintOutputCodec = createJsonOutputCodec(LintOutputSchema);
/**
 * Run lint rules against a single directive
 *
 * @param directive - Parsed directive to check
 * @param file - Source file path
 * @param line - Line number in source
 * @param rules - Rules to apply
 * @param context - Optional context for rules that need pattern registry
 * @returns Array of violations (empty if all rules pass)
 */
export function lintDirective(directive, file, line, rules, context) {
    const violations = [];
    for (const rule of rules) {
        const result = rule.check(directive, file, line, context);
        if (result !== null) {
            // Handle both single violation and array of violations
            if (Array.isArray(result)) {
                violations.push(...result);
            }
            else {
                violations.push(result);
            }
        }
    }
    return violations;
}
/**
 * Run lint rules against multiple files with directives
 *
 * @param files - Map of file path to directives in that file
 * @param rules - Rules to apply
 * @param context - Optional context for rules that need pattern registry
 * @returns Summary with results and statistics
 */
export function lintFiles(files, rules, context) {
    const results = [];
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let directivesChecked = 0;
    for (const [file, directives] of files) {
        const fileViolations = [];
        for (const { directive, line } of directives) {
            directivesChecked++;
            const violations = lintDirective(directive, file, line, rules, context);
            fileViolations.push(...violations);
        }
        // Count by severity
        for (const violation of fileViolations) {
            switch (violation.severity) {
                case 'error':
                    errorCount++;
                    break;
                case 'warning':
                    warningCount++;
                    break;
                case 'info':
                    infoCount++;
                    break;
            }
        }
        // Only include files with violations
        if (fileViolations.length > 0) {
            results.push({
                file,
                violations: fileViolations,
            });
        }
    }
    return {
        results,
        errorCount,
        warningCount,
        infoCount,
        filesScanned: files.size,
        directivesChecked,
    };
}
/**
 * Check if lint summary indicates failure based on mode
 *
 * @param summary - Lint summary to check
 * @param strict - Whether to treat warnings as errors
 * @returns True if there are failures (exit code should be 1)
 */
export function hasFailures(summary, strict) {
    if (summary.errorCount > 0) {
        return true;
    }
    if (strict && summary.warningCount > 0) {
        return true;
    }
    return false;
}
/**
 * Sort violations by severity (errors first, then warnings, then info)
 */
export function sortViolationsBySeverity(violations) {
    return [...violations].sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0)
            return severityDiff;
        // Within same severity, sort by line number
        return a.line - b.line;
    });
}
/**
 * Format lint summary as pretty-printed text
 *
 * @param summary - Lint summary to format
 * @param options - Formatting options
 * @returns Formatted string for console output
 */
export function formatPretty(summary, options = {}) {
    const lines = [];
    for (const result of summary.results) {
        const sorted = sortViolationsBySeverity(result.violations);
        // Filter based on quiet mode
        const filtered = options.quiet === true ? sorted.filter((v) => v.severity === 'error') : sorted;
        if (filtered.length === 0)
            continue;
        lines.push(result.file);
        for (const v of filtered) {
            const severityColor = getSeverityPrefix(v.severity);
            lines.push(`  ${v.line}:1  ${severityColor}  ${v.rule}  ${v.message}`);
        }
        lines.push(''); // Blank line between files
    }
    // Summary line
    const parts = [];
    if (summary.errorCount > 0) {
        parts.push(`${summary.errorCount} error${summary.errorCount === 1 ? '' : 's'}`);
    }
    if (summary.warningCount > 0 && options.quiet !== true) {
        parts.push(`${summary.warningCount} warning${summary.warningCount === 1 ? '' : 's'}`);
    }
    if (summary.infoCount > 0 && options.quiet !== true) {
        parts.push(`${summary.infoCount} info`);
    }
    if (parts.length > 0) {
        const icon = summary.errorCount > 0 ? '\u2717' : summary.warningCount > 0 ? '\u26a0' : '\u2713';
        lines.push(`${icon} ${parts.join(', ')}`);
    }
    else {
        lines.push(`\u2713 No issues found (${summary.directivesChecked} directives checked)`);
    }
    return lines.join('\n');
}
/**
 * Get severity prefix for output
 */
function getSeverityPrefix(severity) {
    switch (severity) {
        case 'error':
            return 'error  ';
        case 'warning':
            return 'warning';
        case 'info':
            return 'info   ';
    }
}
/**
 * Format lint summary as JSON
 *
 * Uses LintOutputCodec for type-safe serialization.
 * Returns Result type per project guidelines (no exceptions thrown).
 *
 * @param summary - Lint summary to format
 * @returns Result with JSON string on success, Error on serialization failure
 */
export function formatJson(summary) {
    const output = {
        results: summary.results.map((r) => ({
            file: r.file,
            violations: r.violations.map((v) => ({
                rule: v.rule,
                severity: v.severity,
                message: v.message,
                line: v.line,
            })),
        })),
        summary: {
            errors: summary.errorCount,
            warnings: summary.warningCount,
            info: summary.infoCount,
            filesScanned: summary.filesScanned,
            directivesChecked: summary.directivesChecked,
        },
    };
    const result = LintOutputCodec.serialize(output);
    if (!result.ok) {
        return {
            ok: false,
            error: new Error(`Lint output serialization failed: ${result.error.message}`),
        };
    }
    return { ok: true, value: result.value };
}
//# sourceMappingURL=engine.js.map