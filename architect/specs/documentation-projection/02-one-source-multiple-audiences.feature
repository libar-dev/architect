@architect
@architect-pattern:OneSourceMultipleAudiences
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: OneSourceMultipleAudiences - one source materializes into audience-shaped read models

  **User Story:** As a maintainer, I want to author the description of a topic once in source and have it materialize into multiple audience-shaped read models — a terse, trigger-shaped agent-context skill and a navigable, normative human document — so that the two audiences never read separately-authored claims about the same topic and each pays only the cost their shape implies.

  **Open Questions:**
  - What is the size budget for the agent-context read-model shape — a hard line limit, a soft preference, or audience-derived from the harness context window?
  - When the agent read model needs more depth than its budget allows on a given visit, does it link out to the human read model, inline a deeper fragment on demand, or both?
  - Audience-specific bits that have no equivalent in the other shape (skill frontmatter / trigger phrases vs. human navigation) — are they authored in the same source aggregate as the shared content, or in audience-side adapters that the projection consumes?

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
