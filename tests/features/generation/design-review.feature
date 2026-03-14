@architect
@architect-pattern:DesignReviewGenerationTests
@architect-status:active
@architect-product-area:Generation
@behavior @design-review
Feature: Design Review Generation Pipeline

  Tests the full design review generation pipeline: sequence annotations are
  extracted from patterns with business rules, pre-computed into a SequenceIndex
  on MasterDataset, then rendered through DesignReviewCodec into markdown with
  Mermaid sequence diagrams, component diagrams, type definition tables, and
  design question templates.

  Background:
    Given a design review test context

  Rule: SequenceIndex pre-computes ordered steps from annotated rules

    **Invariant:** buildSequenceIndexEntry produces a SequenceIndexEntry with steps sorted by stepNumber, participants deduplicated with orchestrator first, and data flow types collected from Input/Output annotations.
    **Rationale:** Pre-computing in the transform pass avoids repeated parsing in the codec. ADR-006 mandates the MasterDataset as the sole read model.
    **Verified by:** SequenceIndex populated for annotated pattern, Steps sorted by step number, Patterns without sequence annotations have no entry

    @acceptance-criteria @happy-path
    Scenario: SequenceIndex populated for annotated pattern
      Given a pattern with orchestrator "init-cli" and 3 sequence-step rules
      When building the sequence index entry
      Then the entry has orchestrator "init-cli"
      And the entry has 3 steps

    @acceptance-criteria @happy-path
    Scenario: Steps sorted by step number
      Given rules with step numbers 3 and 1 and 2
      When building the sequence index entry
      Then step 1 has stepNumber 1
      And step 2 has stepNumber 2
      And step 3 has stepNumber 3

    @acceptance-criteria @validation
    Scenario: Patterns without sequence annotations have no entry
      Given rules with no sequence-step tags
      When building the sequence index entry
      Then the entry is undefined

  Rule: Participants are deduplicated with orchestrator first

    **Invariant:** The participants array starts with the orchestrator, followed by module names in first-appearance step order, with no duplicates.
    **Rationale:** Sequence diagram participant declarations must be ordered and unique. The orchestrator is always the first participant as the entry point.
    **Verified by:** Participants ordered with orchestrator first

    @acceptance-criteria @happy-path
    Scenario: Participants ordered with orchestrator first
      Given a pattern with orchestrator "main" and modules "alpha" then "beta" then "alpha"
      When building the sequence index entry
      Then participants are "main" then "alpha" then "beta"

  Rule: Data flow types are extracted from Input and Output annotations

    **Invariant:** The dataFlowTypes array contains distinct type names parsed from Input and Output annotation strings using the "TypeName -- fields" format.
    **Rationale:** Data flow types are used by the component diagram to render hexagon nodes and by the type definitions table to show producers and consumers.
    **Verified by:** Data flow types collected from annotations, Prose outputs are excluded from data flow types

    @acceptance-criteria @happy-path
    Scenario: Data flow types collected from annotations
      Given a rule with Input "ProjectContext -- packageJson, tsconfigExists" and Output "InitConfig -- preset, sources"
      When building the sequence index entry
      Then data flow types include "ProjectContext" and "InitConfig"

    @acceptance-criteria @validation
    Scenario: Prose outputs are excluded from data flow types
      Given a rule with Input "ProjectContext" and Output "package.json updated with process and docs scripts"
      When building the sequence index entry
      Then data flow types include "ProjectContext"
      And data flow types do not include "package.json updated with process and docs scripts"

  Rule: DesignReviewCodec produces sequence diagram with correct participant count

    **Invariant:** The rendered sequence diagram participant list includes User plus all participants from the SequenceIndexEntry. The count equals 1 (User) plus the number of unique participants.
    **Rationale:** Correct participant count proves the codec reads SequenceIndex data correctly and maps it to Mermaid syntax.
    **Verified by:** Sequence diagram has correct participant count

    @acceptance-criteria @happy-path
    Scenario: Sequence diagram has correct participant count
      Given a dataset with a pattern having orchestrator and 2 distinct modules
      When generating the design review document
      Then the sequence diagram declares 4 participants

  Rule: Error scenarios produce alt blocks in sequence diagrams

    **Invariant:** Each error scenario name from a step's errorScenarios array produces an alt block in the Mermaid sequence diagram with the scenario name as the condition text.
    **Rationale:** Alt blocks make error handling visible in the sequence diagram, enabling design review verification of error path completeness.
    **Verified by:** Error scenarios produce alt blocks in output

    @acceptance-criteria @happy-path
    Scenario: Error scenarios produce alt blocks in output
      Given a step with error scenarios "Config not found" and "Invalid preset"
      When generating the design review document
      Then the rendered markdown contains:
        """
        alt Config not found
        alt Invalid preset
        """

  Rule: Component diagram groups modules by shared input type

    **Invariant:** Contiguous steps sharing the same Input type annotation are grouped into a single subgraph in the component diagram. Non-contiguous steps with the same input become separate subgraphs.
    **Rationale:** Grouping by input type reveals natural phase boundaries in the orchestration flow, making data flow architecture visible.
    **Verified by:** Modules with same input grouped together

    @acceptance-criteria @happy-path
    Scenario: Modules with same input grouped together
      Given 2 steps both with Input "InitConfig"
      When generating the design review document
      Then the component diagram contains a subgraph labeled "InitConfig"

  Rule: Component diagram module nodes are scoped per phase

    **Invariant:** Repeated modules in non-contiguous phases render with distinct Mermaid node IDs, while repeated use of the same module inside one phase reuses a single declaration.
    **Rationale:** Mermaid node IDs are global across the diagram. Reusing raw module IDs causes later phases to collapse into earlier declarations and misrepresent the orchestration flow.
    **Verified by:** Repeated module in non-contiguous phases gets distinct node ids, Repeated module in one phase is declared once

    @acceptance-criteria @happy-path
    Scenario: Repeated module in non-contiguous phases gets distinct node ids
      Given a pattern with the same module in non-contiguous phases
      When generating the design review document
      Then the rendered markdown contains phase-scoped node id "phase_1_shared_mod"
      And the rendered markdown contains phase-scoped node id "phase_3_shared_mod"
      And the rendered markdown routes first phase input "InputA" to phase node "phase_1_shared_mod"
      And the rendered markdown routes later phase input "InputC" to phase node "phase_3_shared_mod"

    @acceptance-criteria @validation
    Scenario: Repeated module in one phase is declared once
      Given 2 contiguous steps in the same phase using the same module
      When generating the design review document
      Then phase node "phase_1_shared_mod" is declared 1 time in the rendered markdown

  Rule: Type hexagons show field definitions from Output annotations

    **Invariant:** Output annotations with the "TypeName -- field1, field2" format produce hexagon nodes in the component diagram containing the type name and field names separated by newlines.
    **Rationale:** Type hexagons make central data contracts visible, enabling design reviewers to verify interface completeness.
    **Verified by:** Type hexagon rendered with fields

    @acceptance-criteria @happy-path
    Scenario: Type hexagon rendered with fields
      Given a step with Output "SetupResult -- success, patternCount, diagnostics"
      When generating the design review document
      Then the component diagram contains a hexagon for "SetupResult" with fields

  Rule: Mermaid-sensitive text is escaped across rendered labels

    **Invariant:** Participant aliases, subgraph labels, type hexagon text, and edge labels escape Mermaid-sensitive characters such as quotes, pipes, and comment markers before rendering.
    **Rationale:** Design review diagrams are generated directly from annotations. Valid annotation text must not break Mermaid parsing when rendered into different label positions.
    **Verified by:** Mermaid-sensitive text is escaped in rendered markdown

    @acceptance-criteria @validation
    Scenario: Mermaid-sensitive text is escaped in rendered markdown
      Given a rule with Mermaid-sensitive annotations
      When generating the design review document
      Then the rendered markdown contains "module&#124;&quot;alpha.ts"
      And the rendered markdown contains "Config &quot;Draft&quot; &#124; Preview % % comment"
      And the rendered markdown also contains "SetupResult&#124;&quot;Quoted&quot;"
      And the rendered markdown does not contain "%% comment"

  Rule: Design questions table includes auto-computed metrics

    **Invariant:** The Design Questions section contains a table with auto-computed step count, type count, and error path count drawn from the SequenceIndexEntry data.
    **Rationale:** Auto-computed metrics reduce manual counting during design reviews and highlight coverage gaps (e.g., 0 error paths).
    **Verified by:** Design questions table has correct metrics

    @acceptance-criteria @happy-path
    Scenario: Design questions table has correct metrics
      Given a dataset with 3 steps and 2 types and 1 error path
      When generating the design review document
      Then the design questions mention "3 steps" and "2 distinct types" and "1 error paths"

  Rule: Invalid sequence annotations are skipped with validation warnings

    **Invariant:** Patterns with ambiguous sequence-step numbering or empty sequence-module tags are excluded from sequenceIndex and reported through malformedPatterns.
    **Rationale:** Design reviews should never render misleading diagrams from malformed annotations. The transform pass is the correct place to validate and suppress bad sequence entries.
    **Verified by:** Duplicate step numbers are reported as malformed, Sequence step without modules is reported as malformed

    @acceptance-criteria @validation
    Scenario: Duplicate step numbers are reported as malformed
      Given a pattern with duplicate sequence-step values
      When transforming the pattern with validation
      Then validation issues contain "Duplicate @architect-sequence-step:1"
      And sequenceIndex does not contain the pattern

    @acceptance-criteria @validation
    Scenario: Sequence step without modules is reported as malformed
      Given a pattern with a sequence step but no sequence modules
      When transforming the pattern with validation
      Then validation issues contain "has @architect-sequence-step:1 but no @architect-sequence-module values"
      And sequenceIndex does not contain the pattern

  Rule: Process API sequence lookup resolves pattern names case-insensitively

    **Invariant:** The sequence subcommand resolves pattern names with the same case-insensitive matching behavior as other pattern-oriented process-api queries.
    **Rationale:** Design review consumers should not need exact display-name casing when querying sequence data from the CLI.
    **Verified by:** Sequence lookup accepts lowercase pattern name

    @acceptance-criteria @happy-path
    Scenario: Sequence lookup accepts lowercase pattern name
      Given a dataset with sequence data for pattern "SetupCommand"
      When resolving sequence data for pattern name "setupcommand"
      Then the resolved sequence entry exists
      And the resolved sequence entry has orchestrator "init-cli"
