@architect
@architect-adr:001
@architect-adr-status:accepted
@architect-adr-category:process
@architect-pattern:ADR001TaxonomyCanonicalValues
@architect-status:roadmap
@architect-product-area:Process
@architect-convention:taxonomy-rules
@architect-include:reference-sample,process-workflow
Feature: ADR-001 - Taxonomy Canonical Values and Process Constants

  **Context:**
  The annotation system requires well-defined canonical values for taxonomy
  tags, FSM status lifecycle, and source ownership rules. Without canonical
  values, organic growth produces drift (Generator vs Generators, Process
  vs DeliveryProcess) and inconsistent grouping in generated documentation.

  **Decision:**
  Define canonical values for all taxonomy enums, FSM states with protection
  levels, valid transitions, tag format types, and source ownership rules.
  These are the durable constants of the delivery process.

  **Consequences:**
  | Type | Impact |
  | Positive | Generated docs group into coherent sections |
  | Positive | FSM enforcement has clear, auditable state definitions |
  | Positive | Source ownership prevents cross-domain tag confusion |
  | Negative | Migration effort for existing specs with non-canonical values |

  # ===========================================================================
  # DELIVERABLES
  # ===========================================================================

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Decision spec | complete | architect/decisions/adr-001 |
      | Migrate executable spec product-area tags | complete | tests/features/**/*.feature |
      | Migrate tier 1 spec product-area tags | complete | architect/specs/*.feature |
      | Fix adr-category on existing decisions | pending | architect/decisions/*.feature |

  # ===========================================================================
  # RULE 1: Product Area Canonical Values
  # ===========================================================================

  Rule: Product area canonical values

    **Invariant:** The product-area tag uses one of 7 canonical values.
    Each value represents a reader-facing documentation section, not a
    source module.
    **Rationale:** Without canonical values, organic drift (e.g., Generator vs Generators) produces inconsistent grouping in generated documentation and fragmented product area pages.
    **Verified by:** Canonical values are enforced

    | Value | Reader Question | Covers |
    | Annotation | How do I annotate code? | Scanning, extraction, tag parsing, dual-source |
    | Configuration | How do I configure the tool? | Config loading, presets, resolution |
    | Generation | How does code become docs? | Codecs, generators, rendering, diagrams |
    | Validation | How is the workflow enforced? | FSM, DoD, anti-patterns, process guard, lint |
    | DataAPI | How do I query process state? | Process state API, stubs, context assembly, CLI |
    | CoreTypes | What foundational types exist? | Result monad, error factories, string utils |
    | Process | How does the session workflow work? | Session lifecycle, handoffs, conventions |

  # ===========================================================================
  # RULE 2: ADR Category Canonical Values
  # ===========================================================================

  Rule: ADR category canonical values

    **Invariant:** The adr-category tag uses one of 4 values.
    **Rationale:** Unbounded category values prevent meaningful grouping of architecture decisions and make cross-cutting queries unreliable.
    **Verified by:** Canonical values are enforced

    | Value | Purpose |
    | architecture | System structure, component design, data flow |
    | process | Workflow, conventions, annotation rules |
    | testing | Test strategy, verification approach |
    | documentation | Documentation generation, content structure |

  # ===========================================================================
  # RULE 3: FSM Status Values
  # ===========================================================================

  Rule: FSM status values and protection levels

    **Invariant:** Pattern status uses exactly 4 values with defined
    protection levels. These are enforced by Process Guard at commit time.
    **Rationale:** Without protection levels, active specs accumulate scope creep and completed specs get silently modified, undermining delivery process integrity.
    **Verified by:** Canonical values are enforced

    | Status | Protection | Can Add Deliverables | Allowed Actions |
    | roadmap | None | Yes | Full editing |
    | active | Scope-locked | No | Edit existing deliverables only |
    | completed | Hard-locked | No | Requires unlock-reason tag |
    | deferred | None | Yes | Full editing |

  # ===========================================================================
  # RULE 4: Valid FSM Transitions
  # ===========================================================================

  Rule: Valid FSM transitions

    **Invariant:** Only these transitions are valid. All others are
    rejected by Process Guard.
    **Rationale:** Allowing arbitrary transitions (e.g., roadmap to completed) bypasses the active phase where scope-lock and deliverable tracking provide quality assurance.
    **Verified by:** Canonical values are enforced

    | From | To | Trigger |
    | roadmap | active | Start work |
    | roadmap | deferred | Postpone |
    | active | completed | All deliverables done |
    | active | roadmap | Blocked/regressed |
    | deferred | roadmap | Resume planning |

    Completed is a terminal state. Modifications require
    `@architect-unlock-reason` escape hatch.

  # ===========================================================================
  # RULE 5: Tag Format Types
  # ===========================================================================

  Rule: Tag format types

    **Invariant:** Every tag has one of 6 format types that determines
    how its value is parsed.
    **Rationale:** Without explicit format types, parsers must guess value structure, leading to silent data corruption when CSV values are treated as single strings or numbers are treated as text.
    **Verified by:** Canonical values are enforced

    | Format | Parsing | Example |
    | flag | Boolean presence, no value | @architect-core |
    | value | Simple string | @architect-pattern MyPattern |
    | enum | Constrained to predefined list | @architect-status completed |
    | csv | Comma-separated values | @architect-uses A, B, C |
    | number | Numeric value | @architect-phase 15 |
    | quoted-value | Preserves spaces | @architect-brief:'Multi word' |

  # ===========================================================================
  # RULE 6: Source Ownership
  # ===========================================================================

  Rule: Source ownership

    **Invariant:** Relationship tags have defined ownership by source type.
    Anti-pattern detection enforces these boundaries.
    **Rationale:** Cross-domain tag placement (e.g., runtime dependencies in Gherkin) creates conflicting sources of truth and breaks the dual-source architecture ownership model.
    **Verified by:** Canonical values are enforced

    | Tag | Correct Source | Wrong Source | Rationale |
    | uses | TypeScript | Feature files | TS owns runtime dependencies |
    | depends-on | Feature files | TypeScript | Gherkin owns planning dependencies |
    | quarter | Feature files | TypeScript | Gherkin owns timeline metadata |
    | team | Feature files | TypeScript | Gherkin owns ownership metadata |

  # ===========================================================================
  # RULE 7: Quarter Format Convention
  # ===========================================================================

  Rule: Quarter format convention

    **Invariant:** The quarter tag uses `YYYY-QN` format (e.g., `2026-Q1`).
    ISO-year-first sorting works lexicographically.
    **Rationale:** Non-standard formats (e.g., Q1-2026) break lexicographic sorting, which roadmap generation and timeline queries depend on for correct ordering.
    **Verified by:** Canonical values are enforced

  # ===========================================================================
  # RULE 8: Canonical Phase Definitions
  # ===========================================================================

  Rule: Canonical phase definitions (6-phase USDP standard)

    **Invariant:** The default workflow defines exactly 6 phases in fixed
    order. These are the canonical phase names and ordinals used by all
    generated documentation.
    **Rationale:** Ad-hoc phase names and ordering produce inconsistent roadmap grouping across packages and make cross-package progress tracking impossible.
    **Verified by:** Canonical values are enforced

    | Order | Phase | Purpose |
    | 1 | Inception | Problem framing, scope definition |
    | 2 | Elaboration | Design decisions, architecture exploration |
    | 3 | Session | Planning and design session work |
    | 4 | Construction | Implementation, testing, integration |
    | 5 | Validation | Verification, acceptance criteria confirmation |
    | 6 | Retrospective | Review, lessons learned, documentation |

  # ===========================================================================
  # RULE 9: Deliverable Status Canonical Values
  # ===========================================================================

  Rule: Deliverable status canonical values

    **Invariant:** Deliverable status (distinct from pattern FSM status)
    uses exactly 6 values, enforced by Zod schema at parse time.
    **Rationale:** Freeform status strings bypass Zod validation and break DoD checks, which rely on terminal status classification to determine pattern completeness.
    **Verified by:** Canonical values are enforced

    | Value | Meaning |
    | complete | Work is done |
    | in-progress | Work is ongoing |
    | pending | Work has not started |
    | deferred | Work postponed |
    | superseded | Replaced by another |
    | n/a | Not applicable |

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria
  Scenario: Canonical values are enforced
    Given the taxonomy defines canonical values for product-area and status
    When a pattern uses a non-canonical value
    Then validation reports the violation
