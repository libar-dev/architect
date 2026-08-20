@architect
@architect-pattern:OneSourceMultipleAudiences
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: OneSourceMultipleAudiences - one source materializes into audience-shaped read models

  **User Story:** As a maintainer, I want to author the description of a topic once in source and have it materialize into multiple audience-shaped read models — a terse, trigger-shaped agent-context skill and a navigable, normative human document — so that the two audiences never read separately-authored claims about the same topic and each pays only the cost their shape implies.

  **Resolved (per the taxonomy skill shape — born-accepted after the build, the ADR-010 pattern; the taxonomy skill is the family that exercised these. Re-open per future audience shape — the graph-handle skill, the MCP tool list — if it needs a different budget rule than the taxonomy skill established):**
  - **Agent-context budget is a soft preference, audience-shaped via progressive disclosure — not a hard byte ceiling the renderer enforces.** The skill shape embeds only the facts whose value justifies the agent-context cost (the drift-prone role enum + the live count) and selects disclosure depth per audience; it does not embed the full enumeration. The "budget" is a disclosure-depth choice, not a numeric limit. (The taxonomy skill shipped exactly this: two small generated regions, everything else authored or linked.)
  - **Over budget → link out to the richer read model.** When the agent shape would exceed its budget it links to live data / the reference shape for the rest rather than inlining a deeper fragment; inline-on-demand stays a sink affordance, never a projection concern (a projection is a pure function of the read model — the epic's purity rule). The taxonomy skill links for the full enumeration instead of embedding it.
  - **Audience-specific bits are authored in the audience's own colocated source aggregate (the skill body), consumed by the projection — not a separate adapter layer.** The skill body is the canonical source for its trigger phrases and framing voice (`SourceCanonical`: a skill body is a colocated generation target); the shared *generatable* facts are projected into it. So no audience-side adapter sits between the source and the projection.

  Rule: Shared content across audience-shaped read models traces to one source
    **Invariant:** For any topic that ships both an agent-skill read model and a human-document read model, the content shared between them traces to one source aggregate; no claim appears in both read models authored independently in each.

  @acceptance-criteria @happy-path
  Scenario: one source materializes into two audience-shaped read models
    Given a topic source declares content at multiple disclosure depths
    When projection runs
    Then the agent-skill read model emits only the lower-depth sections and links to the human-document read model for the rest
    And the human-document read model emits every depth

  @acceptance-criteria @happy-path
  Scenario: the tag registry materializes into three audience-shaped read models
    Given the tag registry is the single source for taxonomy content
    When the documentation projection runs
    Then the agent-skill read model emits the taxonomy model plus a link to live data, not the full enumeration
    And the reference read model emits the full enumerated tag tables
    And the formal-spec read model emits the full enumeration inside its normative framing

  Rule: The agent-context shape embeds only budget-justified facts and links out for the rest
    **Invariant:** The agent-context (skill) read model embeds only the facts whose value justifies its agent-context cost and links to a richer read model for the rest; the budget is a per-audience disclosure-depth choice, not a hard byte ceiling enforced by the renderer, and the shape never inlines the full enumeration a reference or human read model carries. Over-budget depth is reached by linking out, never by making the projection stateful for the agent sink.

    @acceptance-criteria @happy-path
    Scenario: the agent shape links out rather than inlining beyond its budget
      Given a topic whose full enumeration exceeds the agent shape's disclosure depth
      When the agent-skill read model is projected
      Then it emits only the budget-justified facts (drift-prone enums and counts)
      And it links to the richer read model for the full enumeration instead of inlining it
