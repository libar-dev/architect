@architect
@architect-adr:007
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-pattern:ADR007CoordinatedTaxonomyRedesign
@architect-status:active
@architect-product-area:Process
@architect-uses:ADR001TaxonomyCanonicalValues,PDR005ProcessGuardFSM
Feature: ADR-007 - Coordinated Taxonomy Redesign

  **Context:**
  Supersedes three independently-designed specs: CandidateStatusExtraction (phase 47),
  TrackTagSupport (phase 47), and TaxonomyPresetArchitecture (phase 48). When reviewed
  together, these specs reveal design overlap — the track tag duplicates lifecycle
  semantics captured by candidate status plus maturity axis, the preset system adds
  complexity better solved by direct role configuration, and overlapping file
  modifications across specs create sequencing hazards.

  Additionally, the extraction pipeline has two silent drops: the gherkin-ast-parser
  enum branch (line 622-625) silently discards unknown status values, and the
  gherkin-extractor (line 349-351) silently skips patterns without a status. Together
  these make candidate specs invisible to the PatternGraph with zero indication of why.

  The category system and arch-role are redundant classifications. 10 of 21 DDD
  categories have zero usage in new-convex-es (a 242K LOC, 400-file project). The
  preset system wraps a single variable (the category list) and the `metadataTags`
  field on `DDD_ES_CQRS_PRESET` is dead code that the factory ignores.

  **Decision:**
  Supersede all three specs with a coordinated five-spec redesign at phase 49:

  | Spec | Scope | Supersedes |
  | StatusMaturityExtraction | Status expansion + maturity axis + diagnostics | CandidateStatusExtraction, TrackTagSupport |
  | UnifiedRoleSystem | Role merge + preset removal | TaxonomyPresetArchitecture |
  | ProcessGuardPatternGraphMigration | Migrate derive-state.ts to PatternGraph (ADR-006) | (new) |
  | ValidatePatternsPipelineConsolidation | Migrate DoDValidator to PatternGraph + eliminate double-scan | (new) |
  | McpOutputSchemaValidation | Zod output schemas for all MCP tool responses (candidate) | (new) |

  Replace the binary track tag with a maturity axis (idea/plan/design/executable) that
  captures the same lifecycle semantics with finer graduation. Replace categories and
  presets with a unified role system. Keep ProcessGuard on the explicit four-state FSM
  contract and finish the remaining phase-49 work on the current projection surface.

  All five changes ship as ONE coordinated breaking change. Three internal consumers,
  no public users, pre-release only. All consumers update simultaneously.

  **Consequences:**
  | Type | Impact |
  | Positive | Eliminates track tag redundancy -- maturity axis subsumes consideration/delivery semantics |
  | Positive | Removes preset system complexity -- role-based configuration is simpler and more flexible |
  | Positive | Coordinated file modifications prevent merge conflicts across overlapping specs |
  | Positive | Diagnostic output eliminates silent extraction failures (the original bug) |
  | Positive | Net simplification -- fewer concepts, more capability |
  | Negative | Supersedes prior design work across three specs |
  | Negative | Larger scope requires more implementation effort in a single phase |
  | Negative | Migration burden for existing arch-context/arch-layer tags across 3 consumers |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | StatusMaturityExtraction spec | complete | architect/specs/status-maturity-extraction.feature |
      | UnifiedRoleSystem spec | complete | architect/specs/unified-role-system.feature |
      | ProcessGuardPatternGraphMigration spec | complete | architect/specs/process-guard-patterngraph-migration.feature |
      | ValidatePatternsPipelineConsolidation spec | complete | architect/specs/validate-patterns-pipeline-consolidation.feature |
      | McpOutputSchemaValidation spec | pending | architect/specs/mcp-output-schema-validation.feature |

  # ===========================================================================
  # DECISION 1: Maturity Axis Subsumes Track Tag
  # ===========================================================================

  Rule: Decision: Maturity axis subsumes the track tag proposal

    **Invariant:** The `@architect-track` tag (consideration/delivery) is not
    implemented. Its lifecycle semantics are captured by the maturity axis:
    `idea` maturity = exploratory/consideration, `plan` maturity =
    committed/delivery. The maturity axis provides four values
    (idea/plan/design/executable) instead of two, enabling finer-grained
    lifecycle discrimination without a separate tag.

    **Rationale:** A binary tag (consideration/delivery) distinguishes only
    "exploring" from "committed." The maturity axis distinguishes four levels of
    refinement: idea (raw exploration), plan (structured commitment), design
    (implementation-ready detail), executable (living tests). One tag covers the
    full lifecycle instead of two tags covering one state.

    **Verified by:** Maturity provides consideration-delivery distinction

    @acceptance-criteria @happy-path
    Scenario: Maturity provides consideration-delivery distinction
      Given the maturity axis with values idea, plan, design, executable
      When comparing to the track tag proposal with values consideration, delivery
      Then candidate with idea maturity is equivalent to consideration track
      And candidate with plan maturity is equivalent to delivery track
      And maturity also serves roadmap, active, completed, and deferred states

  # ===========================================================================
  # DECISION 2: Unified Roles Replace Dual Classification
  # ===========================================================================

  Rule: Decision: Unified roles replace category flags and arch-role

    **Invariant:** CategoryDefinition and `@architect-arch-role` are replaced by a
    single `@architect-role` tag with `RoleDefinition` type. The category flag tags
    (``, `@architect-saga`, etc.) become role value tags
    (``, `@architect-role:saga`). Three orthogonal axes remain:
    role (what kind), context (which bounded context), layer (which arch layer).

    **Rationale:** Categories serve document grouping. Arch-role serves architecture
    diagrams. The same information expressed through two different tag systems creates
    annotation redundancy. In new-convex-es, files tagged `@architect-saga` almost
    always also have `@architect-role:saga`. Merging eliminates this duplication.
    10 of 21 DDD categories have zero usage -- the trimmed 11-role set covers all
    actual usage.

    **Verified by:** Role merge eliminates category-arch-role redundancy

    @acceptance-criteria @happy-path
    Scenario: Role merge eliminates category-arch-role redundancy
      Given a file previously annotated with both @architect-saga and @architect-role:saga
      When migrated to the unified role system
      Then a single @architect-role:saga tag replaces both annotations
      And the pattern graph uses role for grouping, diagrams, and API filtering

  # ===========================================================================
  # DECISION 3: One Coordinated Breaking Change
  # ===========================================================================

  Rule: Decision: The phase-49 redesign ships as one coordinated breaking change

    **Invariant:** The phase-49 redesign is delivered as one coordinated breaking
    change. No spec can be delivered independently because they share modified
    files and depend on each other's type changes. The dependency chain is:
    StatusMaturityExtraction (foundation) -> UnifiedRoleSystem +
    ProcessGuardPatternGraphMigration + ValidatePatternsPipelineConsolidation ->
    McpOutputSchemaValidation.

    **Rationale:** Three internal consumers, no public users, pre-release only.
    The architect package underpins everything Studio builds on. Multi-phase rearchitecting risks
    leaving the package in an intermediate state during the most critical delivery
    window. One branch, merged once.

    **Verified by:** Phase 49 redesign specs share modified files

    @acceptance-criteria @validation
    Scenario: Phase 49 redesign specs share modified files
      Given the coordinated redesign and ADR-006 cleanup specs at phase 49
      When analyzing their deliverable file paths
      Then status-values.ts, registry-builder.ts, and transform-dataset.ts appear in multiple specs
      And no spec can be delivered without its dependencies being present

  # ===========================================================================
  # DECISION 4: Type Separation at Extraction/FSM Boundary
  # ===========================================================================

  Rule: Decision: AcceptedStatusValue is a superset of ProcessStatusValue

    **Invariant:** `AcceptedStatusValue` (5 values: candidate, roadmap, active,
    completed, deferred) is the type used at extraction boundaries. `ProcessStatusValue`
    (4 values: roadmap, active, completed, deferred) is the type used by the FSM
    transition matrix, protection levels, and ProcessGuard enforcement. The FSM does
    not know about `candidate`. Candidate patterns enter the PatternGraph for
    queryability but are exempt from FSM enforcement.

    **Rationale:** A unified 5-state type would require adding `candidate` to every
    `Record<ProcessStatusValue, ...>` -- protection levels, transitions -- and
    special-casing candidate in ProcessGuard. The type separation avoids all of this.
    In DDD/ES terms: `ProcessStatusValue` is the aggregate's state space;
    `AcceptedStatusValue` is the set of events the system accepts for projection.

    **Verified by:** FSM types unchanged while extraction boundary widens

    @acceptance-criteria @validation
    Scenario: FSM types unchanged while extraction boundary widens
      # Primary verification: StatusMaturityExtraction Rule 1, Scenarios
      # "FSM transition matrix remains four-state" and
      # "AcceptedStatusValue used at all extraction boundaries"

  # ===========================================================================
  # DECISION 5: Redesign Document Is the Normative Cross-Spec Reference
  # ===========================================================================

  Rule: Decision: Redesign document is the normative source for shared type definitions

    **Invariant:** `00-architect-redesign.md` is the single normative source for type
    definitions, rule ID sets, configuration shapes, and perspective definitions that
    span multiple specs. Individual specs MUST NOT locally redefine types that the
    redesign document defines. When a spec's type definition conflicts with the
    redesign document, the redesign document wins. Post-implementation, code becomes
    the source of truth for type definitions per ADR-003. This decision governs the
    design-to-implementation transition period.

    Specifically, the redesign document is authoritative for:
    - `ProcessGuardRuleId` (6 values -- specs must not add phantom rule IDs)
    - `AcceptedStatusValue` / `ProcessStatusValue` type boundary
    - `EnforcementConfig` shape and field semantics
    - `RoleDefinition` type and role constant sets
    - `PerspectiveName` set and inclusion criteria
    - `BuildResult` return type shape
    - Pre-computed view names (`byStatus`, `byNormalizedStatus`, `byMaturity`)

    **Rationale:** Four specs sharing 15+ modified files need a single authority for
    cross-cutting type definitions. Without this rule, each spec can locally redefine
    shared types (as happened with ProcessGuardRuleId gaining phantom entries). The
    redesign document resolves conflicts before they reach implementation.

    **Verified by:** Spec type definitions match redesign document

    @acceptance-criteria @validation
    Scenario: Spec type definitions match redesign document
      Given the four redesign specs and the normative redesign document
      When comparing ProcessGuardRuleId definitions across all artifacts
      Then all specs use the same 6-value ProcessGuardRuleId from the redesign document
      And no spec introduces rule IDs not present in the redesign document

  # ===========================================================================
  # CROSS-SPEC CONSISTENCY CHECK (2026-04-06)
  # ===========================================================================
  # ProcessGuardRuleId: 6 values consistent across spec Rule 5 and stub
  # Diagnostic codes: StatusMaturityExtraction owns 6 extraction codes;
  #   UnifiedRoleSystem will extend with 'deprecated-tag' during implementation
  # ADR references: All 4 feature specs have @architect-see-also:ADR007CoordinatedTaxonomyRedesign
  # All 4 feature specs have @architect-executable-specs tags
