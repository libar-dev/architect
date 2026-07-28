/**
 * @architect
 * @architect-pattern:HierarchyLevelDomain
 * @architect-status:completed
 * @architect-role:contract
 * @architect-bounded-context:domain
 *
 * ## HierarchyLevelDomain — Pattern Hierarchy Axis Vocabulary
 *
 * The canonical closed set of `@architect-level` values (`epic · phase · task ·
 * slice`) plus the default — the hierarchy axis independent of maturity/status.
 * Consumed by the Gherkin AST parser, registry builder, dual-source validation,
 * and guard lint rules. A domain root primitive: fan-in is its weight, no
 * outbound deps by design.
 *
 * **When to Use:** wherever a hierarchy level is parsed, validated, or defaulted
 * — this enum is the single source for the level vocabulary.
 */

export const HIERARCHY_LEVELS = ['epic', 'phase', 'task', 'slice'] as const;

export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];

export const DEFAULT_HIERARCHY_LEVEL: HierarchyLevel = 'phase';
