# Design Review: EnforcementConfiguration

**Purpose:** Auto-generated design review with sequence and component diagrams
**Detail Level:** Design review artifact from sequence annotations

---

**Pattern:** EnforcementConfiguration | **Phase:** Phase 49 | **Status:** roadmap | **Orchestrator:** decider | **Steps:** 6 | **Participants:** 5

**Source:** `architect/specs/enforcement-configuration.feature`

---

## Annotation Convention

This design review is generated from the following annotations:

| Tag                   | Level    | Format | Purpose                            |
| --------------------- | -------- | ------ | ---------------------------------- |
| sequence-orchestrator | Feature  | value  | Identifies the coordinator module  |
| sequence-step         | Rule     | number | Explicit execution ordering        |
| sequence-module       | Rule     | csv    | Maps Rule to deliverable module(s) |
| sequence-error        | Scenario | flag   | Marks scenario as error/alt path   |

Description markers: `**Input:**` and `**Output:**` in Rule descriptions define data flow types for sequence diagram call arrows and component diagram edges.

---

## Sequence Diagram — Runtime Interaction Flow

Generated from: `@architect-sequence-step`, `@architect-sequence-module`, ``, `**Input:**`/`**Output:**`markers, and`@architect-sequence-orchestrator` on the Feature.

```mermaid
sequenceDiagram
    participant User
    participant decider as "decider.ts"
    participant enforcement_zone as "enforcement-zone.ts"
    participant promotion as "promotion.ts"
    participant enforcement_config as "enforcement-config.ts"
    participant project_config as "project-config.ts"

    User->>decider: invoke

    Note over decider: Rule 1 — The lifecycle divides into three enforcement zones: pre-delivery (candidate status, protection none, enforcement skipped entirely), delivery (roadmap/active/deferred, full FSM enforcement with scope/none protection), post-delivery (completed, hard protection requiring unlock). The zone is derived from status — it is a structural property of the lifecycle, not a configurable setting.

    decider->>+enforcement_zone: AcceptedStatusValue
    enforcement_zone-->>-decider: EnforcementZone

    Note over decider: Rule 2 — `isValidPromotion(from, to)` returns true only for candidate-to-roadmap. `isDemotion(from, to)` returns true when any delivery state (roadmap, active, completed, deferred) changes to candidate. These are lifecycle gates in `src/validation/promotion.ts` called BEFORE ProcessGuard rule evaluation — they are NOT ProcessGuard rules and NOT configurable via `ruleOverrides`. ProcessGuard calls these helpers when it detects a status change involving `candidate`. The promotion gate can be disabled via `validatePromotions: false` in EnforcementConfig. Demotion rejection is always active because it protects process integrity.

    decider->>+promotion: AcceptedStatusValue (from, to)
    promotion-->>-decider: boolean (isValidPromotion/isDemotion)

    alt Candidate to active rejected by promotion validation
        decider-->>User: error
        decider->>decider: exit(1)
    end

    alt Candidate to completed rejected by promotion validation
        decider-->>User: error
        decider->>decider: exit(1)
    end

    alt Roadmap to candidate rejected as demotion
        decider-->>User: error
        decider->>decider: exit(1)
    end

    alt Active to candidate rejected as demotion
        decider-->>User: error
        decider->>decider: exit(1)
    end

    alt Completed to candidate rejected as demotion
        decider-->>User: error
        decider->>decider: exit(1)
    end

    alt Deferred to candidate rejected as demotion
        decider-->>User: error
        decider->>decider: exit(1)
    end

    Note over decider: Rule 3 — `EnforcementConfig` has three optional fields: `excludedStatuses` (string[], default ['candidate']) — statuses exempt from enforcement； `ruleOverrides` (Record⟨ProcessGuardRuleId, RuleOverride⟩, default {}) — per-rule severity overrides for the 6 ProcessGuard rules； `validatePromotions` (boolean, default true) — whether to validate candidate-to-roadmap promotions via the `isValidPromotion()` helper. When the config is absent from `architect.config.ts`, defaults apply for backward compatibility. Promotion/demotion validation is separate from ruleOverrides — demotion rejection is always active and not configurable.

    decider->>+enforcement_config: ArchitectProjectConfig
    enforcement_config-->>-decider: EnforcementConfig

    Note over decider: Rule 4 — Patterns with `status:candidate` bypass ALL ProcessGuard rules: completed-protection, scope-creep, invalid-status-transition, session-scope, session-excluded, deliverable-removed. Candidates are freely editable pre-acceptance artifacts. No violations of any kind are produced for candidate pattern modifications.

    decider->>+decider: EnforcementZone, FileState
    decider-->>-decider: DeciderOutput (zero violations)

    Note over decider: Rule 5 — `ruleOverrides` maps `ProcessGuardRuleId` to `{ severity: 'error' &#124; 'warning' &#124; 'off' }`. Only the 6 existing ProcessGuard rule IDs are accepted: completed-protection, invalid-status-transition, scope-creep, deliverable-removed, session-scope, session-excluded. Promotion/demotion validation is NOT a configurable rule — it is controlled separately via `validatePromotions` (promotion) and is always active (demotion). An invalid rule ID produces a config validation error at load time. An override of `off` disables the rule entirely. Strict mode still promotes overridden warnings to errors.

    decider->>+decider: ProcessGuardRuleId, RuleOverride
    decider-->>-decider: Violation at overridden severity

    alt Invalid rule ID rejected at config validation
        decider-->>User: error
        decider->>decider: exit(1)
    end

    Note over decider: Rule 6 — `enforcement` is an optional field on `ArchitectProjectConfig`. The field is parsed and validated at config load time using Zod schema validation. The resolved EnforcementConfig is passed to ProcessGuard via the DeciderInput. When the field is absent, DEFAULT_ENFORCEMENT applies.

    decider->>+project_config: architect.config.ts
    project_config-->>-decider: ResolvedEnforcementConfig

```

---

## Component Diagram — Types and Data Flow

Generated from: `@architect-sequence-module` (nodes), `**Input:**`/`**Output:**` (edges and type shapes), deliverables table (locations), and `sequence-step` (grouping).

```mermaid
graph LR
    subgraph phase_1["Phase 1: AcceptedStatusValue"]
        phase_1_enforcement_zone["enforcement-zone.ts"]
    end

    subgraph phase_2["Phase 2: AcceptedStatusValue (from, to)"]
        phase_2_promotion["promotion.ts"]
    end

    subgraph phase_3["Phase 3: ArchitectProjectConfig"]
        phase_3_enforcement_config["enforcement-config.ts"]
    end

    subgraph phase_4["Phase 4: EnforcementZone, FileState"]
        phase_4_decider["decider.ts"]
    end

    subgraph phase_5["Phase 5: ProcessGuardRuleId, RuleOverride"]
        phase_5_decider["decider.ts"]
    end

    subgraph phase_6["Phase 6: architect.config.ts"]
        phase_6_project_config["project-config.ts"]
    end

    subgraph orchestrator["Orchestrator"]
        decider["decider.ts"]
    end

    subgraph types["Key Types"]
        EnforcementZone{{"EnforcementZone\n-----------\npre-delivery\ndelivery\npost-delivery"}}
        EnforcementConfig{{"EnforcementConfig\n-----------\nexcludedStatuses\nruleOverrides\nvalidatePromotions"}}
        ResolvedEnforcementConfig{{"ResolvedEnforcementConfig\n-----------\nenforcement parsed from config\ndefaults applied when absent"}}
    end

    phase_1_enforcement_zone -->|"EnforcementZone"| decider
    phase_3_enforcement_config -->|"EnforcementConfig"| decider
    phase_6_project_config -->|"ResolvedEnforcementConfig"| decider
    decider -->|"AcceptedStatusValue"| phase_1_enforcement_zone
    decider -->|"AcceptedStatusValue (from, to)"| phase_2_promotion
    decider -->|"ArchitectProjectConfig"| phase_3_enforcement_config
    decider -->|"EnforcementZone, FileState"| phase_4_decider
    decider -->|"ProcessGuardRuleId, RuleOverride"| phase_5_decider
    decider -->|"architect.config.ts"| phase_6_project_config
```

---

## Key Type Definitions

| Type                        | Fields                                                       | Produced By        | Consumed By |
| --------------------------- | ------------------------------------------------------------ | ------------------ | ----------- |
| `EnforcementZone`           | pre-delivery, delivery, post-delivery                        | enforcement-zone   |             |
| `EnforcementConfig`         | excludedStatuses, ruleOverrides, validatePromotions          | enforcement-config |             |
| `ResolvedEnforcementConfig` | enforcement parsed from config, defaults applied when absent | project-config     |             |

---

## Design Questions

Verify these design properties against the diagrams above:

| #    | Question                             | Auto-Check                      | Diagram   |
| ---- | ------------------------------------ | ------------------------------- | --------- |
| DQ-1 | Is the execution ordering correct?   | 6 steps in monotonic order      | Sequence  |
| DQ-2 | Are all interfaces well-defined?     | 3 distinct types across 6 steps | Component |
| DQ-3 | Is error handling complete?          | 7 error paths identified        | Sequence  |
| DQ-4 | Is data flow unidirectional?         | Review component diagram edges  | Component |
| DQ-5 | Does validation prove the full path? | Review final step               | Both      |

---

## Findings

Record design observations from reviewing the diagrams above. Each finding should reference which diagram revealed it and its impact on the spec.

| #   | Finding                                     | Diagram Source | Impact on Spec |
| --- | ------------------------------------------- | -------------- | -------------- |
| F-1 | (Review the diagrams and add findings here) | —              | —              |

---

## Summary

The EnforcementConfiguration design review covers 6 sequential steps across 5 participants with 3 key data types and 7 error paths.
