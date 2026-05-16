/**
 * @architect
 * @architect-lint
 * @architect-pattern LintRules
 * @architect-status completed
 * @architect-role:service
 * @architect-bounded-context:lint
 *
 * ## LintRules - Annotation Quality Rules
 *
 * Defines lint rules that check @architect-* directives for completeness
 * and quality. Rules include: missing-pattern-name, missing-status,
 * missing-when-to-use, tautological-description, and missing-relationships.
 *
 * ### When to Use
 *
 * - Use `defaultRules` for standard quality checks
 * - Use `filterRulesBySeverity()` to customize which rules apply
 * - Use individual rules for targeted validation
 */

import type { DocDirective, HierarchyLevel } from '@libar-dev/architect-core';
import type { LintSeverity, LintViolation } from '@libar-dev/architect-core';
import type { TagRegistry } from '@libar-dev/architect-core';
import { ACCEPTED_STATUS_VALUES, VALID_ACCEPTED_STATUS_SET } from '@libar-dev/architect-core';
import { DEFAULT_TAG_PREFIX } from '@libar-dev/architect-core';

/**
 * Closed hierarchy-level rank. Lower index = higher in the hierarchy.
 * Used by hierarchy-parent-level-mismatch.
 */
const HIERARCHY_LEVEL_RANK: Record<HierarchyLevel, number> = {
  epic: 0,
  phase: 1,
  task: 2,
  slice: 3,
};

/**
 * Default rank for declarers that lack an authored `@architect-level`.
 * Treated as `task` so that hierarchy-parent-level-mismatch accepts the
 * common shape: an idea/candidate at no-level pointing at a parent epic.
 */
const DEFAULT_DECLARER_RANK = HIERARCHY_LEVEL_RANK.task;

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
  /**
   * Map of pattern name → authored `@architect-level`. Populated by the
   * lint driver. Used by `hierarchy-parent-level-mismatch` to verify that
   * `@architect-parent X` resolves to a pattern carrying `@architect-level`
   * at a strictly higher level than the declarer.
   */
  readonly patternLevels?: ReadonlyMap<string, HierarchyLevel>;
}

/**
 * Multiplier for determining if description has "substantial content" beyond the pattern name.
 * If description length > name length * this multiplier, it's considered substantial.
 */
const SUBSTANTIAL_CONTENT_MULTIPLIER = 2;

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
  check: (
    directive: DocDirective,
    file: string,
    line: number,
    context?: LintContext
  ) => LintViolation | LintViolation[] | null;
}

/**
 * Create a lint violation
 */
function violation(
  rule: string,
  severity: LintSeverity,
  message: string,
  file: string,
  line: number
): LintViolation {
  return { rule, severity, message, file, line };
}

/**
 * Get the tag prefix from context or use default.
 */
function getTagPrefix(context?: LintContext): string {
  return context?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
}

/**
 * Rule: missing-pattern-name
 *
 * Patterns must have an explicit name via the pattern tag.
 * Without a name, the pattern can't be referenced in relationships
 * or indexed properly.
 */
export const missingPatternName: LintRule = {
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
      return violation(
        'missing-pattern-name',
        'error',
        `Pattern missing explicit name. Add ${tagPrefix}pattern YourPatternName`,
        file,
        line
      );
    }
    return null;
  },
};

/**
 * Rule: missing-status
 *
 * Patterns should have an explicit status (completed, active, roadmap, deferred).
 * This helps readers understand if the pattern is ready for use.
 */
export const missingStatus: LintRule = {
  id: 'missing-status',
  severity: 'warning',
  description: 'Pattern should have status tag (roadmap|active|completed|deferred)',
  check: (directive, file, line, context) => {
    if (!directive.status) {
      const tagPrefix = getTagPrefix(context);
      return violation(
        'missing-status',
        'warning',
        `No ${tagPrefix}status found. Add: ${tagPrefix}status roadmap|active|completed|deferred`,
        file,
        line
      );
    }
    return null;
  },
};

/**
 * Rule: invalid-status
 *
 * Status values must be valid accepted status values (FSM states + candidate).
 */
export const invalidStatus: LintRule = {
  id: 'invalid-status',
  severity: 'error',
  description: 'Status must be a valid value (candidate, roadmap, active, completed, deferred)',
  check: (directive, file, line) => {
    // Skip if no status (handled by missing-status rule)
    if (!directive.status) {
      return null;
    }

    if (!VALID_ACCEPTED_STATUS_SET.has(directive.status.toLowerCase())) {
      return violation(
        'invalid-status',
        'error',
        `Invalid status '${directive.status}'. Valid values: ${ACCEPTED_STATUS_VALUES.join(', ')}.`,
        file,
        line
      );
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
export const missingWhenToUse: LintRule = {
  id: 'missing-when-to-use',
  severity: 'warning',
  description: 'Pattern should have "When to Use" section in description',
  check: (directive, file, line) => {
    // whenToUse is now an array of bullet points
    if (!directive.whenToUse || directive.whenToUse.length === 0) {
      return violation(
        'missing-when-to-use',
        'warning',
        'No "When to Use" section found. Add ### When to Use or **When to use:** in description',
        file,
        line
      );
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
export const tautologicalDescription: LintRule = {
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
      return violation(
        'tautological-description',
        'error',
        `Description repeats pattern name "${directive.patternName}". Provide meaningful context.`,
        file,
        line
      );
    }
    return null;
  },
};

/**
 * Rule: missing-relationships
 *
 * Patterns should declare their relationships (uses) for
 * dependency tracking. This is informational only.
 */
export const missingRelationships: LintRule = {
  id: 'missing-relationships',
  severity: 'info',
  description: 'Consider adding uses and used-by tags',
  check: (directive, file, line, context) => {
    const hasUses = (directive.uses?.length ?? 0) > 0;
    if (!hasUses) {
      const tagPrefix = getTagPrefix(context);
      return violation(
        'missing-relationships',
        'info',
        `Consider adding relationship tags: ${tagPrefix}uses`,
        file,
        line
      );
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
 * a pattern that it also implements. Having both @architect-pattern X
 * AND @architect-implements X on the same file is a conflict.
 *
 * However, a file CAN have both tags when they reference DIFFERENT patterns:
 * - @architect-pattern SubPattern (defines its own identity)
 * - @architect-implements ParentSpec (links to parent spec)
 *
 * This supports the sub-pattern hierarchy where implementation files can be
 * named patterns that also implement a larger spec (e.g., MockPaymentActions
 * implementing DurableEventsIntegration).
 */
export const patternConflictInImplements: LintRule = {
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
        return violation(
          'pattern-conflict-in-implements',
          'error',
          `Pattern '${patternName}' cannot implement itself. ` +
            `Remove either ${tagPrefix}pattern or ${tagPrefix}implements for this pattern.`,
          file,
          line
        );
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
 * knownPatterns is provided.
 *
 * This is a context-aware rule that requires access to the pattern registry.
 */
export const missingRelationshipTarget: LintRule = {
  id: 'missing-relationship-target',
  severity: 'error',
  description: 'Relationship targets must reference existing patterns',
  check: (directive, file, line, context) => {
    // Skip if no context provided.
    if (!context?.knownPatterns) {
      return null;
    }

    const violations: LintViolation[] = [];

    // Check uses targets
    for (const target of directive.uses ?? []) {
      if (!context.knownPatterns.has(target)) {
        violations.push(
          violation(
            'missing-relationship-target',
            'error',
            `Relationship target '${target}' not found in known patterns`,
            file,
            line
          )
        );
      }
    }

    // Check implements targets
    for (const target of directive.implements ?? []) {
      if (!context.knownPatterns.has(target)) {
        violations.push(
          violation(
            'missing-relationship-target',
            'error',
            `Implementation target '${target}' not found in known patterns`,
            file,
            line
          )
        );
      }
    }

    return violations.length > 0 ? violations : null;
  },
};

/**
 * Rule: hierarchy-parent-level-mismatch
 *
 * Wave 2.5 narrowed `@architect-parent` to the hierarchy axis. The target
 * of `@architect-parent X` MUST resolve to a pattern carrying
 * `@architect-level` at a strictly-higher level than the declaring file
 * (where missing-level on the declarer is treated as `task`).
 *
 * Skipped when `patternLevels` is not provided (single-file invocations
 * without a pattern registry cannot evaluate cross-pattern targets).
 * Skipped for unresolved targets — `missing-relationship-target` covers
 * the unknown-pattern case.
 */
export const hierarchyParentLevelMismatch: LintRule = {
  id: 'hierarchy-parent-level-mismatch',
  severity: 'error',
  description: '@architect-parent target must carry @architect-level at a strictly higher level',
  check: (directive, file, line, context) => {
    const parentName = directive.parent;
    if (parentName === undefined || parentName === '') {
      return null;
    }

    if (!context?.patternLevels) {
      return null;
    }

    const targetLevel = context.patternLevels.get(parentName);
    if (targetLevel === undefined) {
      // Two cases collapse here: (1) the parent target carries no
      // `@architect-level`, which is itself a hierarchy mismatch;
      // (2) the parent target is unknown, which `missing-relationship-target`
      // already reports. Distinguish via `knownPatterns`.
      if (context.knownPatterns.has(parentName)) {
        return violation(
          'hierarchy-parent-level-mismatch',
          'error',
          `@architect-parent target '${parentName}' is missing @architect-level. Hierarchy parents must declare a level (epic|phase|task|slice).`,
          file,
          line
        );
      }
      return null;
    }

    const declarerLevel = directive.level;
    const declarerRank =
      declarerLevel !== undefined ? HIERARCHY_LEVEL_RANK[declarerLevel] : DEFAULT_DECLARER_RANK;
    const targetRank = HIERARCHY_LEVEL_RANK[targetLevel];

    if (targetRank >= declarerRank) {
      const declarerLabel = declarerLevel ?? 'task (default for missing level)';
      return violation(
        'hierarchy-parent-level-mismatch',
        'error',
        `@architect-parent '${parentName}' has @architect-level '${targetLevel}' which is not strictly higher than declarer level '${declarerLabel}'. Hierarchy is epic > phase > task > slice.`,
        file,
        line
      );
    }

    return null;
  },
};

/**
 * All default lint rules
 *
 * Order matters for output - errors first, then warnings, then info.
 */
export const defaultRules: readonly LintRule[] = [
  missingPatternName,
  tautologicalDescription,
  invalidStatus,
  patternConflictInImplements, // PatternRelationshipModel rule
  missingRelationshipTarget, // Context-aware relationship validation
  hierarchyParentLevelMismatch, // Wave 2.5 hierarchy-axis rule
  missingStatus,
  missingWhenToUse,
  missingRelationships,
] as const;

/**
 * Severity ordering for sorting and filtering
 * Exported for use by lint engine to avoid duplication
 */
export const severityOrder: Record<LintSeverity, number> = {
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
export function filterRulesBySeverity(
  rules: readonly LintRule[],
  minSeverity: LintSeverity
): LintRule[] {
  const minLevel = severityOrder[minSeverity];
  return rules.filter((rule) => severityOrder[rule.severity] <= minLevel);
}
