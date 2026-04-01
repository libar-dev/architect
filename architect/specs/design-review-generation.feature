@architect
@architect-pattern:DesignReviewGeneration
@architect-status:active
@architect-phase:46
@architect-product-area:Generation
@architect-effort:2d
@architect-priority:high
@architect-depends-on:MermaidDiagramUtils
Feature: Design Review Diagram Generation

  **Problem:**
  Design reviews require manual creation of sequence and component diagrams that
  duplicate information already captured in spec annotations. When the spec changes,
  the diagrams drift. When a new pattern needs a design review, the author must
  copy-paste from a reference document and manually adapt. This process takes 30-45
  minutes per pattern and produces artifacts that are stale by the next spec edit.

  **Solution:**
  A generation pipeline that reads sequence annotations (`architect-sequence-*`) from
  feature files and produces design review documents with Mermaid sequence and component
  diagrams. The pipeline fits into the existing codec/generator architecture: sequence
  data is pre-computed in a SequenceIndex view on PatternGraph, then a standalone
  DesignReviewCodec renders the diagrams and supporting tables. Output goes to
  architect/design-reviews/.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable                     | Status   | Location                                          |
      | SequenceIndex schema            | complete | src/validation-schemas/pattern-graph.ts           |
      | Sequence transform utilities    | complete | src/generators/pipeline/sequence-utils.ts          |
      | Transform dataset integration   | complete | src/generators/pipeline/transform-dataset.ts       |
      | BusinessRule errorScenarioNames | complete | src/validation-schemas/extracted-pattern.ts        |
      | DesignReviewCodec               | complete | src/renderable/codecs/design-review.ts             |
      | Design review generator         | complete | src/generators/built-in/design-review-generator.ts |
      | Process API sequence subcommand | complete | src/cli/process-api.ts                             |
      | Config wiring                   | complete | architect.config.ts                         |

  Rule: SequenceIndex pre-computes ordered steps from rule-level tags

    **Invariant:** The PatternGraph sequenceIndex contains one entry per pattern that has the `architect-sequence-orchestrator` tag and at least one rule with the `architect-sequence-step` tag. Steps are sorted by stepNumber. Participants are deduplicated and ordered with orchestrator first.

    **Rationale:** Pre-computing in the transform pass avoids repeated parsing
    in the codec. ADR-006 mandates the PatternGraph as the sole read model.
    Downstream consumers (codec, process API) read structured data, not raw tags.

    **Verified by:** SequenceIndex populated for annotated pattern,
    Patterns without sequence annotations excluded

    @acceptance-criteria @happy-path
    Scenario: SequenceIndex populated for annotated pattern
      Given a pattern with @architect-sequence-orchestrator and 6 @architect-sequence-step rules
      When the pattern is transformed to PatternGraph
      Then sequenceIndex contains an entry for the pattern
      And the entry has 6 ordered steps with modules and data flow types

    @acceptance-criteria @validation
    Scenario: Patterns without sequence annotations excluded
      Given a pattern with no @architect-sequence-orchestrator tag
      When the pattern is transformed to PatternGraph
      Then sequenceIndex does not contain an entry for the pattern

  Rule: DesignReviewCodec generates sequence diagrams from ordered steps

    **Invariant:** The sequence diagram contains participants derived from `@architect-sequence-module` tags, Note blocks from Rule names, call arrows from Input/Output markers, and alt blocks from `@architect-sequence-error` scenarios. Participant order follows step order with User and orchestrator first.

    **Rationale:** Sequence diagrams verify interaction ordering and error
    handling completeness. Auto-generation ensures diagrams stay synchronized
    with spec annotations. Manual diagrams drift within days of a spec edit.

    **Verified by:** Sequence diagram has correct participants,
    Error scenarios produce alt blocks

    @acceptance-criteria @happy-path
    Scenario: Sequence diagram has correct participants
      Given a pattern with orchestrator and 7 distinct modules
      When the design review is generated
      Then the sequence diagram declares 9 participants
      And participant order matches step order

    @acceptance-criteria @validation
    Scenario: Error scenarios produce alt blocks
      Given a step with 2 scenarios tagged @architect-sequence-error
      When the design review is generated
      Then the sequence diagram contains 2 alt blocks for that step

  Rule: DesignReviewCodec generates component diagrams from data flow types

    **Invariant:** The component diagram groups modules into subgraphs by
    shared Input type, renders distinct Output types as hexagon nodes with
    field lists, and draws directed edges showing data flow through the
    orchestrator. No circular edges exist in the generated diagram.

    **Rationale:** Component diagrams verify unidirectional data flow and
    interface completeness. Type hexagon nodes make the central contracts
    visible, informing stub creation with exact field lists.

    **Verified by:** Modules grouped by shared input type,
    Type nodes rendered as hexagons with fields

    @acceptance-criteria @happy-path
    Scenario: Modules grouped by shared input type
      Given 4 modules that all take InitConfig as input
      When the design review is generated
      Then those 4 modules appear in the same subgraph

    @acceptance-criteria @happy-path
    Scenario: Type nodes rendered as hexagons with fields
      Given a step with Output annotation containing type name and fields
      When the design review is generated
      Then the component diagram contains a hexagon node with the type name and fields

  Rule: Process API exposes sequence data via subcommand

    **Invariant:** The sequence subcommand with no args lists all patterns
    with sequence annotations. With a pattern name, it returns the full
    SequenceIndexEntry including steps, participants, and data flow types.

    **Rationale:** The Process API is the primary query interface for AI
    sessions. Exposing sequence data enables design review analysis without
    regenerating the full document or reading generated markdown.

    **Verified by:** Sequence subcommand lists annotated patterns,
    Sequence subcommand returns entry for named pattern

    @acceptance-criteria @happy-path
    Scenario: Sequence subcommand lists annotated patterns
      Given SetupCommand has sequence annotations
      When querying sequence with no args
      Then the response lists SetupCommand

    @acceptance-criteria @happy-path
    Scenario: Sequence subcommand returns entry for named pattern
      Given SetupCommand has sequence annotations
      When querying sequence SetupCommand
      Then the response contains 6 steps and orchestrator init-cli
