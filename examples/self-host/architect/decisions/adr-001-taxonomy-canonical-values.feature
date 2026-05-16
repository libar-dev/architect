@architect
@architect-adr:001
@architect-adr-status:accepted
@architect-adr-category:process
@architect-pattern:ADR001TaxonomyCanonicalValues
@architect-status:completed
@architect-product-area:Process
@architect-see-also:ADR007CoordinatedTaxonomyRedesign
Feature: ADR-001 - Taxonomy Canonical Values and Process Constants

  > **Snapshot of pre-Wave-1 taxonomy.** Some example tags referenced in
  > this ADR (e.g. `@architect-phase`) have been cut by Waves 1-4. The ADR
  > is retained as the historical decision record for the canonical-values
  > principle; for the live tag set consult `pnpm pkg:query -- taxonomy`
  > or `packages/architect-core/src/taxonomy/registry-builder.ts`.

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

    **Invariant:** ProductAreas are an organizational dimension for documentation
    grouping — purely project-specific vocabulary, not a structural taxonomy.
    The 8 values below are this package's choice (`ARCHITECT_PACKAGE_PRODUCT_AREAS`).
    Other projects may use entirely different vocabulary (components, subsystems,
    packages, etc.) by declaring their own list in `architect.config.ts`. Projects
    with no list configured leave `@architect-product-area` unconstrained — the
    tag accepts any value and no extraction diagnostic fires.
    **Rationale:** Organizational vocabulary varies per project. The package's
    list reflects its own subdomains; imposing a universal default would force
    other projects to either adopt foreign vocabulary or override it. D-8 in
    .full-review-execution/DECISIONS.md captures the "configurable, no universal
    default" model in detail.
    **Verified by:** Canonical values are enforced (when configured)

    | Value | Reader Question | Covers |
    | Annotation | How do I annotate code? | Scanning, extraction, tag parsing, dual-source |
    | Configuration | How do I configure the tool? | Config loading, roles, resolution |
    | Generation | How does code become docs? | Codecs, generators, rendering, diagrams |
    | Validation | How is the workflow enforced? | FSM, DoD, anti-patterns, process guard, lint |
    | DataAPI | How do I query process state? | Process state API, stubs, context assembly, CLI |
    | CoreTypes | What foundational types exist? | Result monad, error factories, string utils |
    | Process | How does the session workflow work? | Session lifecycle, handoffs, conventions |
    | Projection | How is the graph projected to outputs? | Fragments, projections, renderers, blocks |

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

    **Invariant:** The FSM governs 4 delivery states with defined protection
    levels, enforced by Process Guard at commit time. A 5th value (candidate)
    is accepted at the extraction boundary and enters the PatternGraph but is
    exempt from FSM enforcement and has no protection level. See ADR-007 for
    the type separation design (AcceptedStatusValue vs ProcessStatusValue).
    **Rationale:** Without protection levels, active specs accumulate scope creep and completed specs get silently modified, undermining delivery process integrity.
    **Verified by:** Canonical values are enforced

    | Status | Protection | Can Add Deliverables | Allowed Actions |
    | roadmap | None | Yes | Full editing |
    | active | Scope-locked | No | Edit existing deliverables only |
    | completed | Hard-locked | No | Requires unlock-reason tag |
    | deferred | None | Yes | Full editing |
    | candidate | Exempt | Yes | Exempt from FSM enforcement |

  # ===========================================================================
  # RULE 4: Valid FSM Transitions
  # ===========================================================================

  Rule: Valid FSM transitions

    **Invariant:** Only these FSM transitions are valid. All others are
    rejected by Process Guard. Candidate-to-roadmap is not an FSM
    transition — it is a promotion (lifecycle gate preceding the FSM),
    validated separately. See EnforcementConfiguration Rule 4.
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
    | flag | Boolean presence, no value | @architect-role:core |
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

    | Tag | Tag Type | Correct Source | Wrong Source | Rationale |
    | uses | relationship | TypeScript | Feature files | TS owns runtime dependencies |
    | depends-on | relationship | Feature files | TypeScript | Gherkin owns planning dependencies |
    | quarter | feature-metadata | Feature files | TypeScript | Gherkin owns timeline metadata |
    | team | feature-metadata | Feature files | TypeScript | Gherkin owns ownership metadata |

    The canonical minimum feature-only tag set carried by every project is
    `quarter` and `team` — exported as `CANONICAL_FEATURE_ONLY_TAG_SUFFIXES`
    from `@libar-dev/architect-core`. Projects with richer requirement-doc
    vocabulary may extend the feature-only set in their own taxonomy module.
    For example, this package adds `effort`, `workflow`, `completed`, and
    `effort-actual` (exported as `ARCHITECT_PACKAGE_FEATURE_ONLY_TAG_SUFFIXES`)
    to enrich generated requirement documentation. Per-instance extensions
    never narrow the canonical minimum; they only add to it. The sync test
    asserts the canonical minimum matches this table; per-package extensions
    are not sync-tested against any single ADR table because they are
    project-specific by design.

    Source-ownership *violation detection* — flagging `@architect-uses` in
    `.feature` files, or `@architect-depends-on` in TypeScript JSDoc — is
    graph-health work tracked under `DataAPIRelationshipGraph` (see
    `packages/architect/architect/specs/data-api-relationship-graph.feature`),
    not the guard pipeline. The right substrate for bidirectional anti-pattern
    detection is the relationship graph that already designs dangling-reference
    and orphan-pattern checks (Pkg-D-5 deferral).

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
  # RULE 10: Canonical Role Values
  # ===========================================================================

  Rule: Canonical role values

    **Invariant:** The role tag uses one of these 8 canonical values for the
    architect package self-hosting registry. Each value names a kind of
    pattern that the architect runtime packages annotate. Other projects
    declare their own role list — `DEFAULT_ROLES` mirrors the same Wave 1
    locked vocabulary (`projection, service, decider, read-model, codec,
    contract, barrel, utility`) and is applied when a config omits `roles`.
    **Rationale:** A typed, finite role set is the source of truth for
    `@architect-role:X` validation. Removing a role from the registry must
    surface as `Unrecognized value 'X' for @architect-role` at extraction
    time so dead vocabulary cannot accumulate. The list is intentionally
    short — only roles that the package source actually annotates appear
    here. Decision rationale lives in this ADR; the TypeScript constant
    `DEFAULT_ROLES` and the inline list in
    `packages/architect/architect.config.ts` are projections of this table.
    **Verified by:** Canonical values are enforced, ADR table matches DEFAULT_ROLES constant

    | Tag | Domain | Priority | Description |
    | projection | Projection | 1 | Fragment projection functions deriving outputs from PatternGraph |
    | service | Service | 2 | Application and domain services |
    | decider | Decider | 3 | FSM and rule deciders enforcing process integrity |
    | read-model | Read Model | 4 | Query-oriented read views over the graph |
    | codec | Codec | 5 | Serialization, parsing, and rendering codec surfaces |
    | contract | Contract | 6 | Published schemas and contract-bearing surfaces |
    | barrel | Barrel | 7 | Re-export surfaces and curated entrypoints |
    | utility | Utility | 8 | Shared helpers and narrowly focused utilities |

    The `DEFAULT_ROLES` constant exported from `@libar-dev/architect-core`
    is the same Wave 1 locked vocabulary listed in the table above. Projects
    that omit a `roles` entry in their config inherit it. Projects with
    their own vocabulary declare a role list inline in their config or via
    a per-project ADR rule.

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria
  Scenario: Canonical values are enforced
    Given the taxonomy defines canonical values for product-area and status
    When a pattern uses a non-canonical value
    Then validation reports the violation
