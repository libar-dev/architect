@architect
@architect-pattern:EnforcementConfiguration
@architect-status:roadmap
@architect-product-area:Validation
@architect-bounded-context:lint
@architect-see-also:ADR007CoordinatedTaxonomyRedesign
Feature: EnforcementConfiguration

  **Problem:**
  ProcessGuard has no user-facing configuration. The 5 rules are hardcoded with fixed
  severity levels. There is no mechanism to:
  - Exclude statuses from enforcement (e.g., treat candidate patterns as freely editable)
  - Override rule severity per-project (e.g., downgrade scope-creep to warning in early dev)
  - Configure promotion validation (candidate-to-roadmap lifecycle gate)
  - Distinguish enforcement behavior by lifecycle zone (pre-delivery vs delivery vs post-delivery)

  Additionally, candidate promotion (candidate to roadmap) and demotion rejection
  (roadmap to candidate) are lifecycle gates that need explicit validation separate
  from the FSM transition matrix. The FSM has no `candidate` state -- these are
  lifecycle operations that precede the FSM.

  **Solution:**
  Introduce `EnforcementConfig` with three fields: `excludedStatuses` (statuses exempt
  from enforcement), `ruleOverrides` (per-rule severity overrides for the 6 existing
  ProcessGuard rules), and `validatePromotions` (boolean for promotion gate). Define
  three enforcement zones (pre-delivery, delivery, post-delivery) that govern which
  rules apply. Add promotion/demotion helper validation in `src/validation/promotion.ts`
  -- these are lifecycle gates called BEFORE ProcessGuard, not configurable ProcessGuard
  rules. `isValidPromotion()` validates candidate-to-roadmap. `isDemotion()` rejects
  delivery-to-candidate regression (always active, not configurable). The config is an
  optional field on `ArchitectProjectConfig` -- when absent, defaults apply for backward
  compatibility.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | EnforcementConfig types | pending | src/config/enforcement-config.ts |
      | Enforcement zone determination | pending | src/validation/enforcement-zone.ts |
      | Promotion and demotion validation | pending | src/validation/promotion.ts |
      | ProcessGuard zone check and promotion integration -- decider calls deriveEnforcementZone() first; if zone is pre-delivery, skip all rules and return zero violations; if a status change involves candidate, call isValidPromotion() and isDemotion() BEFORE standard rule evaluation; then apply standard rules with enforcement config overrides | pending | src/lint/process-guard/decider.ts |
      | ProcessGuard state derivation widened -- derive-state.ts handles AcceptedStatusValue (including candidate) and sets FileState.zone by calling deriveEnforcementZone(status) during state derivation; FileState type gains a zone: EnforcementZone field | pending | src/lint/process-guard/derive-state.ts |
      | DetectChanges accepts candidate | pending | src/lint/process-guard/detect-changes.ts |
      | FileState type widened plus zone field | pending | src/lint/process-guard/types.ts |
      | Enforcement field in project config | pending | src/config/project-config.ts |
      | Config schema enforcement validation | pending | src/config/project-config-schema.ts |

  # ===========================================================================
  # RULE 1: Three Enforcement Zones
  # ===========================================================================

  Rule: Three enforcement zones govern rule applicability

    **Input:** AcceptedStatusValue
    **Output:** EnforcementZone -- pre-delivery, delivery, post-delivery

    **Invariant:** The lifecycle divides into three enforcement zones:
    pre-delivery (candidate status, protection none, enforcement skipped entirely),
    delivery (roadmap/active/deferred, full FSM enforcement with scope/none
    protection), post-delivery (completed, hard protection requiring unlock).
    The zone is derived from status -- it is a structural property of the lifecycle,
    not a configurable setting.

    **Rationale:** In DDD/ES terms, the enforcement zone is the aggregate boundary.
    Candidates are outside the aggregate -- they are projectable but not enforceable.
    Delivery patterns are inside the aggregate -- the Decider validates their state
    transitions. Completed patterns are in a terminal aggregate state -- modifications
    require explicit unlock.

    **Verified by:** Candidate pattern falls in pre-delivery zone,
    Roadmap pattern falls in delivery zone,
    Active pattern falls in delivery zone,
    Deferred pattern falls in delivery zone,
    Completed pattern falls in post-delivery zone,
    Pre-delivery zone skips all standard rules

    @acceptance-criteria @happy-path
    Scenario: Candidate pattern falls in pre-delivery zone
      Given a pattern with @architect-status:candidate
      When deriveEnforcementZone is called
      Then the result is "pre-delivery"
      And the pattern's protection level is "none"

    @acceptance-criteria @happy-path
    Scenario: Roadmap pattern falls in delivery zone
      Given a pattern with @architect-status:roadmap
      When deriveEnforcementZone is called
      Then the result is "delivery"

    @acceptance-criteria @happy-path
    Scenario: Active pattern falls in delivery zone
      Given a pattern with @architect-status:active
      When deriveEnforcementZone is called
      Then the result is "delivery"
      And the pattern's protection level is "scope"

    @acceptance-criteria @happy-path
    Scenario: Deferred pattern falls in delivery zone
      Given a pattern with @architect-status:deferred
      When deriveEnforcementZone is called
      Then the result is "delivery"
      And the pattern's protection level is "none"

    @acceptance-criteria @happy-path
    Scenario: Completed pattern falls in post-delivery zone
      Given a pattern with @architect-status:completed
      When deriveEnforcementZone is called
      Then the result is "post-delivery"
      And the pattern's protection level is "hard"

    @acceptance-criteria @validation
    Scenario: Pre-delivery zone skips all standard rules
      Given a candidate pattern being modified with new deliverables and restructured rules
      When ProcessGuard evaluates the changes
      Then no completed-protection violations are produced
      And no scope-creep violations are produced
      And no invalid-status-transition violations are produced
      And no session-scope violations are produced

  # ===========================================================================
  # RULE 2: Candidate Bypass
  # ===========================================================================

  Rule: Candidate patterns bypass ProcessGuard entirely

    **Input:** EnforcementZone, FileState
    **Output:** DeciderOutput (zero violations)

    **Invariant:** Patterns with `status:candidate` bypass ALL ProcessGuard rules:
    completed-protection, scope-creep, invalid-status-transition, session-scope,
    session-excluded, deliverable-removed. Candidates are freely editable
    pre-acceptance artifacts. No violations of any kind are produced for candidate
    pattern modifications.

    **Rationale:** Candidates are exploratory specs under refinement. Enforcing FSM
    rules on pre-acceptance work would block the natural refinement process. The bypass
    is implicit (via enforcement zone), not special-cased -- the decider checks the zone
    before applying any rules.

    **Verified by:** Candidate edits produce zero violations,
    Adding deliverables to candidate allowed,
    Removing deliverables from candidate allowed

    @acceptance-criteria @happy-path
    Scenario: Candidate edits produce zero violations
      Given a candidate spec being modified with arbitrary changes
      When ProcessGuard evaluates the changes
      Then zero violations are produced
      And zero warnings are produced

    @acceptance-criteria @happy-path
    Scenario: Adding deliverables to candidate allowed
      Given a candidate spec with 3 deliverables
      When 2 new deliverables are added
      Then ProcessGuard produces no scope-creep violation

    @acceptance-criteria @edge-case
    Scenario: Removing deliverables from candidate allowed
      Given a candidate spec with 5 deliverables
      When 2 deliverables are removed
      Then ProcessGuard produces no deliverable-removed violation

  # ===========================================================================
  # RULE 3: EnforcementConfig
  # ===========================================================================

  Rule: Enforcement config supports excluded statuses and rule overrides

    **Input:** ArchitectProjectConfig
    **Output:** EnforcementConfig -- excludedStatuses, ruleOverrides, validatePromotions

    **Invariant:** `EnforcementConfig` has three optional fields:
    `excludedStatuses` (string[], default ['candidate']) -- statuses exempt from
    enforcement; `ruleOverrides` (Record<ProcessGuardRuleId, RuleOverride>, default
    {}) -- per-rule severity overrides for the 6 ProcessGuard rules;
    `validatePromotions` (boolean, default true) -- whether to validate
    candidate-to-roadmap promotions via the `isValidPromotion()` helper. When the
    config is absent from `architect.config.ts`, defaults apply for backward
    compatibility. Promotion/demotion validation is separate from ruleOverrides --
    demotion rejection is always active and not configurable.

    **Rationale:** Different projects need different enforcement strictness. Early
    development may want scope-creep as a warning. CI pipelines may want all rules
    as errors. The config surface is intentionally narrow -- 3 fields covering the
    most common customization needs without exposing FSM internals.

    **Verified by:** Default enforcement when no config,
    excludedStatuses skips those patterns,
    Rule override changes severity,
    Rule override off disables rule

    @acceptance-criteria @happy-path
    Scenario: Default enforcement when no config provided
      Given an architect.config.ts with no enforcement field
      When ProcessGuard initializes
      Then candidate patterns are excluded from enforcement
      And all rules are at their default severity
      And promotion validation is enabled

    @acceptance-criteria @happy-path
    Scenario: excludedStatuses skips those patterns
      Given an enforcement config with excludedStatuses set to candidate and deferred
      When a deferred pattern is modified
      Then ProcessGuard produces no violations for the deferred pattern

    @acceptance-criteria @happy-path
    Scenario: Rule override changes severity
      Given an enforcement config with scope-creep overridden to warning severity
      When scope creep is detected on an active pattern
      Then a warning is produced instead of an error

    @acceptance-criteria @validation
    Scenario: Rule override off disables rule
      Given an enforcement config with deliverable-removed overridden to off
      When a deliverable is removed from an active pattern
      Then no violation is produced for the removed deliverable

  # ===========================================================================
  # RULE 4: Promotion Validation
  # ===========================================================================

  Rule: Promotion and demotion validated as pre-guard lifecycle gates

    **Input:** AcceptedStatusValue (from, to)
    **Output:** boolean (isValidPromotion/isDemotion)

    **Invariant:** `isValidPromotion(from, to)` returns true only for
    candidate-to-roadmap. `isDemotion(from, to)` returns true when any delivery
    state (roadmap, active, completed, deferred) changes to candidate. These are
    lifecycle gates in `src/validation/promotion.ts` called BEFORE ProcessGuard
    rule evaluation -- they are NOT ProcessGuard rules and NOT configurable via
    `ruleOverrides`. ProcessGuard calls these helpers when it detects a status
    change involving `candidate`. The promotion gate can be disabled via
    `validatePromotions: false` in EnforcementConfig. Demotion rejection is
    always active because it protects process integrity.

    **Rationale:** The FSM transition matrix has no `candidate` entry. Adding
    candidate to the FSM would require defining transitions that do not match
    delivery lifecycle semantics. Promotion is an acceptance decision that precedes
    the FSM -- it bridges the pre-delivery zone to the delivery zone. Demoting
    to `candidate` means uncommitting work -- the correct action is `deferred`
    (keeps the commitment, parks the work) or deletion. Allowing demotion would
    create a path to bypass scope-lock and completed-protection by round-tripping
    through candidate.

    **Verified by:** Candidate to roadmap accepted as promotion,
    Candidate to active rejected,
    Candidate to completed rejected,
    Roadmap to candidate rejected as demotion,
    Active to candidate rejected as demotion,
    Completed to candidate rejected as demotion,
    Deferred to candidate rejected as demotion,
    Promotion disabled when validatePromotions is false,
    Demotion rejection active even when validatePromotions is false

    @acceptance-criteria @happy-path
    Scenario: Candidate to roadmap accepted as promotion
      Given a spec changes from @architect-status:candidate to @architect-status:roadmap
      When ProcessGuard evaluates the change
      Then the change is accepted via the isValidPromotion helper
      And no transition error is produced

    @acceptance-criteria @validation
    Scenario: Candidate to active rejected by promotion validation
      Given a spec changes from @architect-status:candidate to @architect-status:active
      When ProcessGuard evaluates the change
      Then an error is produced indicating candidates must be promoted to roadmap first

    @acceptance-criteria @validation
    Scenario: Candidate to completed rejected by promotion validation
      Given a spec changes from @architect-status:candidate to @architect-status:completed
      When ProcessGuard evaluates the change
      Then an error is produced indicating candidates cannot skip to completed

    @acceptance-criteria @happy-path
    Scenario: Roadmap to candidate rejected as demotion
      Given a spec changes from @architect-status:roadmap to @architect-status:candidate
      When ProcessGuard evaluates the change
      Then an error is produced by the isDemotion helper
      And the error message suggests using deferred to park committed work

    @acceptance-criteria @validation
    Scenario: Active to candidate rejected as demotion
      Given a spec changes from @architect-status:active to @architect-status:candidate
      When ProcessGuard evaluates the change
      Then an error is produced by the isDemotion helper

    @acceptance-criteria @validation
    Scenario: Completed to candidate rejected as demotion
      Given a spec changes from @architect-status:completed to @architect-status:candidate
      When ProcessGuard evaluates the change
      Then an error is produced by the isDemotion helper

    @acceptance-criteria @validation
    Scenario: Deferred to candidate rejected as demotion
      Given a spec changes from @architect-status:deferred to @architect-status:candidate
      When ProcessGuard evaluates the change
      Then an error is produced by the isDemotion helper

    @acceptance-criteria @edge-case
    Scenario: Promotion disabled when validatePromotions is false
      Given an enforcement config with validatePromotions set to false
      And a spec changes from @architect-status:candidate to @architect-status:roadmap
      When ProcessGuard evaluates the change
      Then the promotion is accepted without validation
      And no promotion-related checks are performed

    @acceptance-criteria @edge-case
    Scenario: Demotion rejection active even when validatePromotions is false
      Given an enforcement config with validatePromotions set to false
      And a spec changes from @architect-status:roadmap to @architect-status:candidate
      When ProcessGuard evaluates the change
      Then an error is produced by the isDemotion helper
      And demotion rejection is not affected by validatePromotions setting

  # ===========================================================================
  # RULE 5: Rule Severity Overrides
  # ===========================================================================

  Rule: Rule severity can be overridden per-project

    **Input:** ProcessGuardRuleId, RuleOverride
    **Output:** Violation at overridden severity

    **Invariant:** `ruleOverrides` maps `ProcessGuardRuleId` to
    `{ severity: 'error' | 'warning' | 'off' }`. Only the 6 existing
    ProcessGuard rule IDs are accepted: completed-protection,
    invalid-status-transition, scope-creep, deliverable-removed, session-scope,
    session-excluded. Promotion/demotion validation is NOT a configurable rule
    -- it is controlled separately via `validatePromotions` (promotion) and is
    always active (demotion). An invalid rule ID produces a config validation
    error at load time. An override of `off` disables the rule entirely. Strict
    mode still promotes overridden warnings to errors.

    **Rationale:** Different project phases need different enforcement strictness.
    Early development benefits from scope-creep as a warning. CI pipelines may
    want all rules as errors. Rule overrides provide this flexibility without
    requiring custom ProcessGuard implementations.

    **Verified by:** Scope-creep downgraded to warning,
    Deliverable-removed disabled,
    Invalid rule ID rejected at config validation,
    Strict mode still promotes overridden warnings

    @acceptance-criteria @happy-path
    Scenario: Scope-creep downgraded to warning
      Given an enforcement config with scope-creep severity overridden to warning
      When scope creep is detected on an active pattern
      Then a warning is produced instead of an error
      And the DeciderOutput contains the warning in the warnings array

    @acceptance-criteria @happy-path
    Scenario: Deliverable-removed disabled via off override
      Given an enforcement config with deliverable-removed severity overridden to off
      When a deliverable is removed from an active pattern
      Then no violation is produced for the deliverable-removed rule

    @acceptance-criteria @validation
    Scenario: Invalid rule ID rejected at config validation
      Given an enforcement config with a rule override for "nonexistent-rule"
      When the config is validated
      Then a config validation error is produced
      And the error lists the valid ProcessGuardRuleId values

    @acceptance-criteria @edge-case
    Scenario: Strict mode still promotes overridden warnings
      Given an enforcement config with scope-creep overridden to warning
      And ProcessGuard is running in strict mode
      When scope creep is detected on an active pattern
      Then an error is produced because strict mode promotes warnings to errors

  # ===========================================================================
  # RULE 6: Config Integration
  # ===========================================================================

  Rule: Enforcement config loaded from architect.config.ts

    **Input:** architect.config.ts
    **Output:** ResolvedEnforcementConfig -- enforcement parsed from config, defaults applied when absent

    **Invariant:** `enforcement` is an optional field on `ArchitectProjectConfig`.
    The field is parsed and validated at config load time using Zod schema
    validation. The resolved EnforcementConfig is passed to ProcessGuard via
    the DeciderInput. When the field is absent, DEFAULT_ENFORCEMENT applies.

    **Rationale:** Enforcement configuration belongs in `architect.config.ts`
    alongside other project-specific settings (sources, output, roles). Validating
    at load time catches invalid rule IDs and malformed overrides before any
    ProcessGuard invocation.

    **Verified by:** Config with enforcement field parsed,
    Config without enforcement uses defaults,
    Invalid enforcement config rejected

    @acceptance-criteria @happy-path
    Scenario: Config with enforcement field parsed
      Given an architect.config.ts with an enforcement object specifying excludedStatuses and ruleOverrides
      When the config is loaded and validated
      Then the enforcement field is available on the resolved config
      And the excludedStatuses and ruleOverrides are properly typed

    @acceptance-criteria @happy-path
    Scenario: Config without enforcement uses defaults
      Given an architect.config.ts with no enforcement field
      When the config is loaded
      Then DEFAULT_ENFORCEMENT is used
      And candidate is excluded by default

    @acceptance-criteria @validation
    Scenario: Invalid enforcement config rejected
      Given an architect.config.ts with enforcement.ruleOverrides containing an unknown severity value
      When the config is validated
      Then a Zod validation error is produced
      And the error identifies the invalid severity value

  # Step definitions live in the dedicated step-stubs file for this pattern.
