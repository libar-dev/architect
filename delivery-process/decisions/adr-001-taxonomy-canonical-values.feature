@libar-docs
@libar-docs-adr:001
@libar-docs-adr-status:accepted
@libar-docs-adr-category:process
@libar-docs-pattern:ADR001TaxonomyCanonicalValues
@libar-docs-status:roadmap
@libar-docs-product-area:Process
@libar-docs-convention:taxonomy-rules
@libar-docs-include:reference-sample
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
  - (+) Generated docs group into coherent sections
  - (+) FSM enforcement has clear, auditable state definitions
  - (+) Source ownership prevents cross-domain tag confusion
  - (-) Migration effort for existing specs with non-canonical values

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Decision spec | complete | delivery-process/decisions/adr-001 |
      | Migrate executable spec product-area tags | complete | tests/features/**/*.feature |
      | Migrate tier 1 spec product-area tags | complete | delivery-process/specs/*.feature |
      | Fix adr-category on existing decisions | pending | delivery-process/decisions/*.feature |

  Rule: Product area canonical values

    **Invariant:** The product-area tag uses one of 7 canonical values.
    Each value represents a reader-facing documentation section, not a
    source module.

    | Value | Reader Question | Covers |
    | Annotation | How do I annotate code? | Scanning, extraction, tag parsing, dual-source |
    | Configuration | How do I configure the tool? | Config loading, presets, resolution |
    | Generation | How does code become docs? | Codecs, generators, rendering, diagrams |
    | Validation | How is the workflow enforced? | FSM, DoD, anti-patterns, process guard, lint |
    | DataAPI | How do I query process state? | Process state API, stubs, context assembly, CLI |
    | CoreTypes | What foundational types exist? | Result monad, error factories, string utils |
    | Process | How does the session workflow work? | Session lifecycle, handoffs, conventions |

  Rule: ADR category canonical values

    **Invariant:** The adr-category tag uses one of 4 values.

    | Value | Purpose |
    | architecture | System structure, component design, data flow |
    | process | Workflow, conventions, annotation rules |
    | testing | Test strategy, verification approach |
    | documentation | Documentation generation, content structure |

  Rule: FSM status values and protection levels

    **Invariant:** Pattern status uses exactly 4 values with defined
    protection levels. These are enforced by Process Guard at commit time.

    | Status | Protection | Can Add Deliverables | Allowed Actions |
    | roadmap | None | Yes | Full editing |
    | active | Scope-locked | No | Edit existing deliverables only |
    | completed | Hard-locked | No | Requires unlock-reason tag |
    | deferred | None | Yes | Full editing |

  Rule: Valid FSM transitions

    **Invariant:** Only these transitions are valid. All others are
    rejected by Process Guard.

    | From | To | Trigger |
    | roadmap | active | Start work |
    | roadmap | deferred | Postpone |
    | active | completed | All deliverables done |
    | active | roadmap | Blocked/regressed |
    | deferred | roadmap | Resume planning |

    Completed is a terminal state. Modifications require
    `@libar-docs-unlock-reason` escape hatch.

  Rule: Tag format types

    **Invariant:** Every tag has one of 6 format types that determines
    how its value is parsed.

    | Format | Parsing | Example |
    | flag | Boolean presence, no value | @libar-docs-core |
    | value | Simple string | @libar-docs-pattern MyPattern |
    | enum | Constrained to predefined list | @libar-docs-status completed |
    | csv | Comma-separated values | @libar-docs-uses A, B, C |
    | number | Numeric value | @libar-docs-phase 15 |
    | quoted-value | Preserves spaces | @libar-docs-brief:'Multi word' |

  Rule: Source ownership

    **Invariant:** Relationship tags have defined ownership by source type.
    Anti-pattern detection enforces these boundaries.

    | Tag | Correct Source | Wrong Source | Rationale |
    | uses | TypeScript | Feature files | TS owns runtime dependencies |
    | depends-on | Feature files | TypeScript | Gherkin owns planning dependencies |
    | quarter | Feature files | TypeScript | Gherkin owns timeline metadata |
    | team | Feature files | TypeScript | Gherkin owns ownership metadata |

  Rule: Quarter format convention

    **Invariant:** The quarter tag uses `YYYY-QN` format (e.g., `2026-Q1`).
    ISO-year-first sorting works lexicographically.

  Rule: Deliverable status canonical values

    **Invariant:** Deliverable status (distinct from pattern FSM status)
    uses exactly 6 values, enforced by Zod schema at parse time.

    | Value | Meaning |
    | complete | Work is done |
    | in-progress | Work is ongoing |
    | pending | Work has not started |
    | deferred | Work postponed |
    | superseded | Replaced by another |
    | n/a | Not applicable |

  @acceptance-criteria
  Scenario: Canonical values are enforced
    Given the taxonomy defines canonical values for product-area and status
    When a pattern uses a non-canonical value
    Then validation reports the violation
