/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern LintRules
 * @libar-docs-status completed
 * @libar-docs-arch-context lint
 * @libar-docs-arch-layer application
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
import type { DocDirective } from '../validation-schemas/doc-directive.js';
import type { LintSeverity, LintViolation } from '../validation-schemas/lint.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
/**
 * Context for lint rules that need access to the full pattern registry.
 * Used for "strict mode" validation where relationships are checked
 * against known patterns.
 */
export interface LintContext {
    /** Set of known pattern names for relationship validation */
    readonly knownPatterns: ReadonlySet<string>;
    /** Tag registry for prefix-aware error messages (optional) */
    readonly registry?: TagRegistry;
}
/**
 * A lint rule that checks a parsed directive
 */
export interface LintRule {
    /** Unique rule ID */
    readonly id: string;
    /** Default severity level */
    readonly severity: LintSeverity;
    /** Human-readable rule description */
    readonly description: string;
    /**
     * Check function that returns violation(s) or null if rule passes
     *
     * @param directive - Parsed directive to check
     * @param file - Source file path
     * @param line - Line number in source
     * @param context - Optional context with pattern registry for relationship validation
     * @returns Violation(s) if rule fails, null if passes. Array for rules that can detect multiple issues.
     */
    check: (directive: DocDirective, file: string, line: number, context?: LintContext) => LintViolation | LintViolation[] | null;
}
/**
 * Rule: missing-pattern-name
 *
 * Patterns must have an explicit name via the pattern tag.
 * Without a name, the pattern can't be referenced in relationships
 * or indexed properly.
 */
export declare const missingPatternName: LintRule;
/**
 * Rule: missing-status
 *
 * Patterns should have an explicit status (completed, active, roadmap).
 * This helps readers understand if the pattern is ready for use.
 */
export declare const missingStatus: LintRule;
/**
 * Rule: invalid-status
 *
 * Status values must be valid PDR-005 FSM states or recognized legacy aliases.
 *
 * Valid FSM values: roadmap, active, completed, deferred
 * Accepted legacy aliases: implemented → completed, partial → active, in-progress → active, planned → planned
 */
export declare const invalidStatus: LintRule;
/**
 * Rule: missing-when-to-use
 *
 * Patterns should have a "When to Use" section for LLM-friendly guidance.
 * This helps developers understand when the pattern applies.
 */
export declare const missingWhenToUse: LintRule;
/**
 * Rule: tautological-description
 *
 * The description should not simply repeat the pattern name.
 * A tautological description provides no useful information.
 */
export declare const tautologicalDescription: LintRule;
/**
 * Rule: missing-relationships
 *
 * Patterns should declare their relationships (uses/usedBy) for
 * dependency tracking. This is informational only.
 */
export declare const missingRelationships: LintRule;
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
export declare const patternConflictInImplements: LintRule;
/**
 * Rule: missing-relationship-target
 *
 * Validates that relationship targets (uses, implements) reference
 * patterns that actually exist. Only triggers when a LintContext with
 * knownPatterns is provided (strict mode).
 *
 * This is a context-aware rule that requires access to the pattern registry.
 */
export declare const missingRelationshipTarget: LintRule;
/**
 * All default lint rules
 *
 * Order matters for output - errors first, then warnings, then info.
 */
export declare const defaultRules: readonly LintRule[];
/**
 * Severity ordering for sorting and filtering
 * Exported for use by lint engine to avoid duplication
 */
export declare const severityOrder: Record<LintSeverity, number>;
/**
 * Get rules filtered by minimum severity
 *
 * @param rules - Rules to filter
 * @param minSeverity - Minimum severity to include
 * @returns Filtered rules
 */
export declare function filterRulesBySeverity(rules: readonly LintRule[], minSeverity: LintSeverity): LintRule[];
//# sourceMappingURL=rules.d.ts.map