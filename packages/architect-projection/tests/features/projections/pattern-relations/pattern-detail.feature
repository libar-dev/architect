@architect
@architect-pattern:PatternDetailProjectionExecutableTests
@architect-implements:PatternDetailProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Pattern detail projection

  **Business Value:** Consumers get a single bundle describing one pattern —
  summary fields, description, deliverables, normalized relationships, rules
  with invariant metadata, stub references, and a deliverable manifest —
  ready to drive detail views, context packs, and every renderer (compact
  text, JSON, Markdown, UI) without extra queries.

  **How It Works:** The projection resolves the pattern, builds the
  `PatternSummary` fragment, extracts a description from its directive,
  normalizes deliverables with resolved test refs, walks the relationship
  index (falling back to raw pattern arrays when missing), maps rules through
  the business-rule annotation parser, and resolves stub references from
  implementedBy entries whose file lives under `/stubs/`. Empty collections
  are emitted as explicit empty arrays.

  Background:
    Given the Pattern Relations pattern detail state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/pattern-relations/pattern-detail.feature |

  Rule: Pattern details compose normalized sub-shapes only

    **Invariant:** A `PatternDetail` always carries `summary + description +
    deliverables + relationships + rules + stubs + deliverableManifest`, with
    relationships normalized to the stable shape (falling back to raw pattern
    arrays when the relationship index is missing), empty collections emitted
    as empty arrays, and the deliverable manifest pointing at the same
    pattern name. The bundle contains no child fragments.

    **Rationale:** Detail views and context packs must render deterministically
    across every renderer, even for sparse patterns, without consumers probing
    graph internals or compensating for missing indices.

    **Verified by:** projecting a full pattern detail bundle, detail relationships fall back to raw pattern arrays when the relationship index is missing, detail projection keeps empty arrays explicit, detail projection preserves hierarchy metadata, detail projection extracts open questions from normalized prose

    @acceptance-criteria
    Scenario: projecting a full pattern detail bundle
      Given a rich pattern detail projection context
      When I project the pattern detail for "PatternGraphAPI"
      And I render the pattern detail bundle through every renderer
      Then the pattern detail bundle should include normalized relationships, deliverables, rules, and stubs
      And the renderer outputs should stay non-empty and type-valid

    Scenario: detail relationships fall back to raw pattern arrays when the relationship index is missing
      Given a pattern detail context without a relationship index
      When I project the pattern detail for "FallbackPattern"
      Then the pattern detail should fall back to raw relationship arrays

    Scenario: detail projection keeps empty arrays explicit
      Given a pattern detail context with no deliverables, rules, or stub refs
      When I project the pattern detail for "EmptyPattern"
      Then the pattern detail should keep empty arrays and an empty manifest

    Scenario: detail projection preserves hierarchy metadata
      Given a pattern detail context with hierarchy metadata
      When I project the pattern detail for "LifecycleMvpEpic"
      Then the pattern detail should preserve hierarchy metadata

    Scenario: detail projection extracts open questions from normalized prose
      Given a pattern detail context with open questions prose
      When I project the pattern detail for "QuestionedPattern"
      Then the pattern detail should include the extracted open questions
