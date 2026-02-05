/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern LintRules
 * @libar-docs-status completed
 * @libar-docs-implements PatternRelationshipModel
 * @libar-docs-used-by LintEngine
 * @libar-docs-extract-shapes LintRule, LintContext, defaultRules, severityOrder, filterRulesBySeverity, missingPatternName, missingStatus, invalidStatus, missingWhenToUse, tautologicalDescription, missingRelationships, patternConflictInImplements, missingRelationshipTarget
 *
 * ## LintRules - Annotation Quality Rules
 *
 * Defines lint rules that check @libar-docs-* directives for completeness
 * and quality. Rules include: missing-pattern-name, missing-status,
 * missing-when-to-use, tautological-description, and missing-relationships.
 *
 * ### When to Use
 *
 * - Use `defaultRules` for standard quality checks
 * - Use `filterRulesBySeverity()` to customize which rules apply
 * - Use individual rules for targeted validation
 */
import { STATUS_NORMALIZATION_MAP, PROCESS_STATUS_VALUES } from '../taxonomy/index.js';
import { DEFAULT_TAG_PREFIX } from '../config/defaults.js';
/**
 * Multiplier for determining if description has "substantial content" beyond the pattern name.
 * If description length > name length * this multiplier, it's considered substantial.
 */
const SUBSTANTIAL_CONTENT_MULTIPLIER = 2;
/**
 * Create a lint violation
 */
function violation(rule, severity, message, file, line) {
    return { rule, severity, message, file, line };
}
/**
 * Get the tag prefix from context or use default.
 */
function getTagPrefix(context) {
    return context?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
}
/**
 * Rule: missing-pattern-name
 *
 * Patterns must have an explicit name via the pattern tag.
 * Without a name, the pattern can't be referenced in relationships
 * or indexed properly.
 */
export const missingPatternName = {
    id: 'missing-pattern-name',
    severity: 'error',
    description: 'Pattern must have explicit pattern name tag',
    check: (directive, file, line, context) => {
        // Skip if this is an implementation-only file (has implements tag)
        // Implementation files realize patterns defined elsewhere and don't need their own name
        const hasImplements = (directive.implements?.length ?? 0) > 0;
        if (hasImplements) {
            return null;
        }
        if (!directive.patternName || directive.patternName.trim() === '') {
            const tagPrefix = getTagPrefix(context);
            return violation('missing-pattern-name', 'error', `Pattern missing explicit name. Add ${tagPrefix}pattern YourPatternName`, file, line);
        }
        return null;
    },
};
/**
 * Rule: missing-status
 *
 * Patterns should have an explicit status (completed, active, roadmap).
 * This helps readers understand if the pattern is ready for use.
 */
export const missingStatus = {
    id: 'missing-status',
    severity: 'warning',
    description: 'Pattern should have status tag (completed|active|roadmap)',
    check: (directive, file, line, context) => {
        if (!directive.status) {
            const tagPrefix = getTagPrefix(context);
            return violation('missing-status', 'warning', `No ${tagPrefix}status found. Add: ${tagPrefix}status completed|active|roadmap`, file, line);
        }
        return null;
    },
};
/**
 * Rule: invalid-status
 *
 * Status values must be valid PDR-005 FSM states or recognized legacy aliases.
 *
 * Valid FSM values: roadmap, active, completed, deferred
 * Accepted legacy aliases: implemented → completed, partial → active, in-progress → active, planned → planned
 */
export const invalidStatus = {
    id: 'invalid-status',
    severity: 'error',
    description: 'Status must be a valid FSM state (roadmap, active, completed, deferred) or legacy alias',
    check: (directive, file, line) => {
        // Skip if no status (handled by missing-status rule)
        if (!directive.status) {
            return null;
        }
        // Check if status is in the normalization map (includes both FSM and legacy values)
        const normalizedStatus = STATUS_NORMALIZATION_MAP[directive.status.toLowerCase()];
        if (!normalizedStatus) {
            const validValues = [
                ...PROCESS_STATUS_VALUES,
                'implemented',
                'partial',
                'in-progress',
                'planned',
            ];
            return violation('invalid-status', 'error', `Invalid status '${directive.status}'. Valid values: ${validValues.join(', ')}.`, file, line);
        }
        return null;
    },
};
/**
 * Rule: missing-when-to-use
 *
 * Patterns should have a "When to Use" section for LLM-friendly guidance.
 * This helps developers understand when the pattern applies.
 */
export const missingWhenToUse = {
    id: 'missing-when-to-use',
    severity: 'warning',
    description: 'Pattern should have "When to Use" section in description',
    check: (directive, file, line) => {
        // whenToUse is now an array of bullet points
        if (!directive.whenToUse || directive.whenToUse.length === 0) {
            return violation('missing-when-to-use', 'warning', 'No "When to Use" section found. Add ### When to Use or **When to use:** in description', file, line);
        }
        return null;
    },
};
/**
 * Rule: tautological-description
 *
 * The description should not simply repeat the pattern name.
 * A tautological description provides no useful information.
 */
export const tautologicalDescription = {
    id: 'tautological-description',
    severity: 'error',
    description: 'Description should not simply repeat the pattern name',
    check: (directive, file, line) => {
        if (!directive.patternName || !directive.description) {
            return null;
        }
        // Get first meaningful line of description (skip empty lines and headings)
        const lines = directive.description.split('\n');
        const firstLine = lines
            .map((l) => l.trim())
            .find((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('**When'));
        if (!firstLine) {
            return null;
        }
        // Normalize for comparison (lowercase, remove punctuation)
        const normalizedName = directive.patternName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedDesc = firstLine.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Check if description starts with or equals the pattern name
        if (normalizedDesc === normalizedName || normalizedDesc.startsWith(normalizedName)) {
            // Allow if there's substantial content after the name
            if (normalizedDesc.length > normalizedName.length * SUBSTANTIAL_CONTENT_MULTIPLIER) {
                return null;
            }
            return violation('tautological-description', 'error', `Description repeats pattern name "${directive.patternName}". Provide meaningful context.`, file, line);
        }
        return null;
    },
};
/**
 * Rule: missing-relationships
 *
 * Patterns should declare their relationships (uses/usedBy) for
 * dependency tracking. This is informational only.
 */
export const missingRelationships = {
    id: 'missing-relationships',
    severity: 'info',
    description: 'Consider adding uses and used-by tags',
    check: (directive, file, line, context) => {
        const hasUses = (directive.uses?.length ?? 0) > 0;
        const hasUsedBy = (directive.usedBy?.length ?? 0) > 0;
        if (!hasUses && !hasUsedBy) {
            const tagPrefix = getTagPrefix(context);
            return violation('missing-relationships', 'info', `Consider adding relationship tags: ${tagPrefix}uses and/or ${tagPrefix}used-by`, file, line);
        }
        return null;
    },
};
// ═══════════════════════════════════════════════════════════════════════════
// Relationship Validation Rules (PatternRelationshipModel)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Rule: pattern-conflict-in-implements
 *
 * Validates that a file doesn't create a circular reference by defining
 * a pattern that it also implements. Having both @libar-docs-pattern X
 * AND @libar-docs-implements X on the same file is a conflict.
 *
 * However, a file CAN have both tags when they reference DIFFERENT patterns:
 * - @libar-docs-pattern SubPattern (defines its own identity)
 * - @libar-docs-implements ParentSpec (links to parent spec)
 *
 * This supports the sub-pattern hierarchy where implementation files can be
 * named patterns that also implement a larger spec (e.g., MockPaymentActions
 * implementing DurableEventsIntegration).
 */
export const patternConflictInImplements = {
    id: 'pattern-conflict-in-implements',
    severity: 'error',
    description: 'Pattern cannot implement itself (circular reference)',
    check: (directive, file, line, context) => {
        const hasImplements = (directive.implements?.length ?? 0) > 0;
        const patternName = directive.patternName;
        if (hasImplements && patternName !== undefined) {
            // Only error if pattern name matches any implements target (circular reference)
            const patternNameLower = patternName.toLowerCase();
            const implementsTargets = directive.implements?.map((i) => i.toLowerCase()) ?? [];
            if (implementsTargets.includes(patternNameLower)) {
                const tagPrefix = getTagPrefix(context);
                return violation('pattern-conflict-in-implements', 'error', `Pattern '${patternName}' cannot implement itself. ` +
                    `Remove either ${tagPrefix}pattern or ${tagPrefix}implements for this pattern.`, file, line);
            }
            // Different patterns: OK - this is a sub-pattern implementing a parent spec
        }
        return null;
    },
};
/**
 * Rule: missing-relationship-target
 *
 * Validates that relationship targets (uses, implements) reference
 * patterns that actually exist. Only triggers when a LintContext with
 * knownPatterns is provided (strict mode).
 *
 * This is a context-aware rule that requires access to the pattern registry.
 */
export const missingRelationshipTarget = {
    id: 'missing-relationship-target',
    severity: 'warning',
    description: 'Relationship targets must reference existing patterns',
    check: (directive, file, line, context) => {
        // Skip if no context provided (non-strict mode)
        if (!context?.knownPatterns) {
            return null;
        }
        const violations = [];
        // Check uses targets
        for (const target of directive.uses ?? []) {
            if (!context.knownPatterns.has(target)) {
                violations.push(violation('missing-relationship-target', 'warning', `Relationship target '${target}' not found in known patterns`, file, line));
            }
        }
        // Check implements targets
        for (const target of directive.implements ?? []) {
            if (!context.knownPatterns.has(target)) {
                violations.push(violation('missing-relationship-target', 'warning', `Implementation target '${target}' not found in known patterns`, file, line));
            }
        }
        return violations.length > 0 ? violations : null;
    },
};
/**
 * All default lint rules
 *
 * Order matters for output - errors first, then warnings, then info.
 */
export const defaultRules = [
    missingPatternName,
    tautologicalDescription,
    invalidStatus,
    patternConflictInImplements, // PatternRelationshipModel rule
    missingRelationshipTarget, // Context-aware relationship validation
    missingStatus,
    missingWhenToUse,
    missingRelationships,
];
/**
 * Severity ordering for sorting and filtering
 * Exported for use by lint engine to avoid duplication
 */
export const severityOrder = {
    error: 0,
    warning: 1,
    info: 2,
};
/**
 * Get rules filtered by minimum severity
 *
 * @param rules - Rules to filter
 * @param minSeverity - Minimum severity to include
 * @returns Filtered rules
 */
export function filterRulesBySeverity(rules, minSeverity) {
    const minLevel = severityOrder[minSeverity];
    return rules.filter((rule) => severityOrder[rule.severity] <= minLevel);
}
//# sourceMappingURL=rules.js.map