@projection
@parity
Feature: Renderer reuse parity — single fragment family across markdown, JSON, and UI

  Background:
    Given a parity projection context with three patterns across two packages

  Rule: A single BusinessRuleSet bundle drives all three renderers

    **Invariant:** The same projection bundle renders to markdown, JSON, and UI without re-projecting source data per consumer.
    **Rationale:** Fragment reuse is the campaign's keystone — the renderer never reaches back into the graph.
    **Verified by:** parity scenarios across renderers

    Scenario: Fragment reuse across markdown, JSON, and UI
      When I project the business-rules bundle grouped by package
      And I render the bundle with markdown, JSON, and UI
      Then the markdown output groups rules under each configured package heading
      And the JSON output exposes the BusinessRule fields verbatim
      And the UI output is structured with one section per child route
      And no domain projection function ran more than once

  Rule: JSON output is invariant across disclosure levels

    **Invariant:** Rendering the same bundle to JSON at any disclosure level produces byte-identical output.
    **Rationale:** Disclosure shapes only the markdown surface; structural transports are stable.
    **Verified by:** disclosure invariance scenarios

    Scenario Outline: JSON is byte-identical across disclosure levels
      When I project the business-rules bundle at disclosure "essential"
      Then the JSON output at disclosure "<level>" matches the JSON output at disclosure "essential"

      Examples:
        | level     |
        | important |
        | useful    |
        | advanced  |

  Rule: UI output is structurally identical across disclosure levels

    **Invariant:** Rendering the same bundle to UI at any disclosure level produces a structurally identical document tree.
    **Rationale:** UI consumers stay stable when CLI users change disclosure flags.
    **Verified by:** disclosure invariance scenarios

    Scenario Outline: UI output is structurally identical across disclosure levels
      When I project the business-rules bundle at disclosure "essential"
      Then the UI output at disclosure "<level>" has the same section structure as the UI output at disclosure "essential"

      Examples:
        | level     |
        | important |
        | useful    |
        | advanced  |
