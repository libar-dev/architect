/**
 * @architect
 * @architect-pattern EnforcementConfig
 * @architect-status roadmap
 * @architect-implements EnforcementConfiguration
 * @architect-target src/config/enforcement-config.ts
 * @architect-product-area:Validation
 *
 * ## EnforcementConfiguration -- Enforcement Config Types
 *
 * User-facing configuration for ProcessGuard enforcement behavior. Controls
 * which statuses are exempt, per-rule severity overrides, and promotion
 * validation toggle.
 *
 * ### Design Decisions
 * AD-1: excludedStatuses uses string[] not AcceptedStatusValue[] for forward
 *   compatibility -- new status values can be excluded without updating the type.
 * AD-2: Default excludes only candidate -- delivery patterns always enforced
 *   unless explicitly overridden by the project config.
 * AD-3: ProcessGuardRuleId is a closed set of 6 IDs -- config validation
 *   rejects unknown rule IDs at load time, not at enforcement time.
 *   Promotion/demotion validation is separate from ruleOverrides -- these
 *   are pre-guard helper functions, not configurable ProcessGuard rules.
 *
 * ### When to Use
 * - architect.config.ts: set the enforcement field
 * - ProcessGuard decider: read config to determine rule behavior
 * - Config schema: validate enforcement field structure
 *
 * See ADR-007: architect/decisions/adr-007-coordinated-taxonomy-redesign.feature
 * See: architect/specs/enforcement-configuration.feature Rules 3, 5, 6
 */

// ---------------------------------------------------------------------------
// Rule Identity
// ---------------------------------------------------------------------------

/**
 * Closed set of ProcessGuard rule identifiers (6 total).
 * Promotion/demotion validation is handled by separate helper functions
 * in src/validation/promotion.ts, NOT as configurable ProcessGuard rules.
 */
export declare type ProcessGuardRuleId =
  | 'completed-protection'
  | 'invalid-status-transition'
  | 'scope-creep'
  | 'deliverable-removed'
  | 'session-scope'
  | 'session-excluded';

// ---------------------------------------------------------------------------
// Rule Override
// ---------------------------------------------------------------------------

/**
 * Per-rule severity override.
 * - 'error': rule violations are errors (default for most rules)
 * - 'warning': rule violations are warnings (downgraded)
 * - 'off': rule is disabled entirely
 */
export declare interface RuleOverride {
  readonly severity: 'error' | 'warning' | 'off';
}

// ---------------------------------------------------------------------------
// Enforcement Config
// ---------------------------------------------------------------------------

/**
 * User-facing enforcement configuration.
 * Optional field on ArchitectProjectConfig.
 */
export declare interface EnforcementConfig {
  /**
   * Statuses excluded from ProcessGuard enforcement.
   * Patterns with these statuses bypass all rules.
   * Default: ['candidate']
   */
  readonly excludedStatuses?: readonly string[];

  /**
   * Per-rule severity overrides.
   * Only valid ProcessGuardRuleId keys accepted.
   * Default: {} (all rules at default severity)
   */
  readonly ruleOverrides?: Partial<Readonly<Record<ProcessGuardRuleId, RuleOverride>>>;

  /**
   * Whether to validate promotions (non-FSM transitions like candidate to roadmap).
   * Default: true
   */
  readonly validatePromotions?: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Default enforcement configuration. Applied when architect.config.ts
 * omits the enforcement field.
 */
export declare const DEFAULT_ENFORCEMENT: Readonly<Required<EnforcementConfig>>;
// Value: { excludedStatuses: ['candidate'], ruleOverrides: {}, validatePromotions: true }
