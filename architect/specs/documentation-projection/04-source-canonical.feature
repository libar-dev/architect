@architect
@architect-pattern:SourceCanonical
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: SourceCanonical - the source aggregate colocates with the artifact it describes

  **User Story:** As a maintainer, I want the source aggregate for every doc claim to live in the same file or package as the code or spec it describes, so that the same commit that changes behavior also changes the source the projection reads — there is no parallel-tree narrative file that can silently diverge from the artifact it claims to describe.

  **Resolved (born-accepted per the ADR-010 pattern — each grounded in a shipped surface or an already-resolved sibling member; the resolutions are the ownership/colocation *rules*, while the projections that retire today's hand-authored restatements are named future work. Re-open per future family if a cross-package or no-code-source topic surfaces a case these rules do not cover):**
  - **Cross-package concept → the read-model implementation that owns the definition is the canonical aggregate.** The premise that the FSM "lives in `architect-guard`" is false: the transition table is defined once in the read-model package (`VALID_TRANSITIONS`, `packages/architect-core/src/validation/fsm/transitions.ts`), the guard imports it one-way for enforcement, and it is already a queryable read-model fact (`query isValidTransition`). So "colocated" for a cross-package concept means colocated with its definition in the owning read-model package. The drift this resolves is real and **still present today**: the formal-spec (`09-delivery-lifecycle.md`) and the `fsm-transitions.md` skill hand-author the transition table — generatable-fact copies the FSM/lifecycle doc family will project away from the owning aggregate, not evidence the projection already feeds them. Pinned by the Rule below. (The ownership + one-way import is exercised by the shipped FSM and its read API; the projection that retires the hand-authored restatements is future work.)
  - **Editorial framing voice colocates in the consuming artifact's own source — there is no separate preamble tree.** Per `OneSourceMultipleAudiences`, audience-specific voice (positioning, "why this exists", trigger phrases) is authored in the artifact's own colocated body (a skill body is the canonical source for its own voice) and consumed by the projection; a generatable fact embedded in that prose is still projected or linked per `MultiSourceComposition`, never paraphrased. The dedicated-preamble-file alternative is rejected — it would be the parallel narrative tree the colocation Rule forbids. (Exercised by the taxonomy skill shape shipped this campaign.)
  - **Decision records are a permitted colocation exception — colocated with the concern they record.** `architect/decisions/` ADRs are the durable rationale aggregate (architect-base §7, the permanent exception to spec-deletion); the projection reads them as a canonical source aggregate (ADRs own rationale per `MultiSourceComposition`'s facet-ownership), colocated with the architectural concern rather than any per-package file. (Exercised by the shipped `documentation decisions` projection.)
  - **No-code-source doctrine → the doctrine body itself is the colocated aggregate, routed not generated.** For a topic with no code source (spec evolution, the four-tier ladder), the hand-authored doctrine body is the canonical colocated aggregate the projection routes (consumes), not an editorial carve-out; any generatable fact embedded within it still projects from its own source — the routing case `MultiSourceComposition` already names. (Grounded in `MultiSourceComposition`'s resolved routing direction; the routed-doctrine emission itself is future work.)

  Rule: Source aggregates colocate with the artifacts they describe
    **Invariant:** Every doc-claim source — annotated JSDoc, Gherkin Rule, Zod description, decision record — lives in the same file or package as the artifact it describes; no parallel-tree narrative file owns claims about shipped behavior the projection then mirrors.

  @acceptance-criteria @happy-path
  Scenario: changing behavior and its source aggregate happens in one commit
    Given a JSDoc-annotated function is modified
    When the maintainer commits the behavior change
    Then the doc-claim source diff is in the same commit, in the same file, as the behavior diff

  Rule: A cross-package concept's canonical source aggregate is the read-model implementation that owns its definition
    **Invariant:** When a concept is defined in one package but described from several — the delivery FSM is defined once in the read-model package (`VALID_TRANSITIONS`, `packages/architect-core/src/validation/fsm/transitions.ts`) yet referenced by the process guard, the formal-spec, and the skills — its canonical source aggregate is the single read-model implementation that owns the definition, not a shared kernel and not the enforcement or consumer package. Consumers import the definition one-way (the guard imports the FSM table from core; the read model never depends on the enforcement layer, ADR-006). Authoritative prose that describes the concept **must** read it from that aggregate's queryable projection (`query isValidTransition`) rather than re-type it; a hand-authored restatement — a transition table re-typed in prose, as the formal-spec (`09-delivery-lifecycle.md`) and the `fsm-transitions.md` skill carry **today** — is generatable-fact drift this rule marks for the owning aggregate's doc family to project away, never a parallel copy to maintain.

    @acceptance-criteria @happy-path
    Scenario: a cross-package concept's doc claim reads from the owning read-model package
      Given a concept defined in one read-model package and referenced from several others
      When the document family that describes the concept is projected
      Then the projected claim is read from the owning package's definition
      And the projected document carries no hand-authored copy of that definition
