@libar-docs
@libar-docs-pattern:ContextAssemblerTests
@libar-docs-status:active
Feature: Context Assembler - Session-Oriented Context Bundle Builder

  Tests for assembleContext(), buildDepTree(), buildFileReadingList(), and
  buildOverview() pure functions that operate on MasterDataset.

  Rule: assembleContext produces session-tailored context bundles

    @acceptance-criteria @happy-path
    Scenario: Design session includes stubs, consumers, and architecture
      Given a pattern "OrderSaga" with status "roadmap" in phase 22
      And the pattern has dependencies "EventStore" and "Workpool"
      And the pattern has stubs in the relationship index
      And the pattern has architecture context "orders"
      When I assemble context for "OrderSaga" with session "design"
      Then the bundle contains metadata for "OrderSaga"
      And the bundle contains spec files
      And the bundle contains stubs
      And the bundle contains dependencies
      And the bundle contains architecture neighbors
      And the bundle does NOT contain deliverables
      And the bundle does NOT contain FSM context

    @acceptance-criteria @happy-path
    Scenario: Planning session includes only metadata and dependencies
      Given a pattern "OrderSaga" with status "roadmap" in phase 22
      And the pattern has dependencies "EventStore" and "Workpool"
      When I assemble context for "OrderSaga" with session "planning"
      Then the bundle contains metadata for "OrderSaga"
      And the bundle contains dependencies
      And the bundle does NOT contain spec files
      And the bundle does NOT contain stubs
      And the bundle does NOT contain architecture neighbors

    @acceptance-criteria @happy-path
    Scenario: Implement session includes deliverables and FSM
      Given a pattern "ProcessGuard" with status "active" in phase 14
      And the pattern has deliverables
      When I assemble context for "ProcessGuard" with session "implement"
      Then the bundle contains metadata for "ProcessGuard"
      And the bundle contains spec files
      And the bundle contains deliverables
      And the bundle contains FSM context with status "active"
      And the bundle does NOT contain stubs
      And the bundle does NOT contain consumers

    @acceptance-criteria @happy-path
    Scenario: Multi-pattern context merges metadata from both patterns
      Given a pattern "OrderSaga" with status "roadmap" in phase 22 depending on "EventStore"
      And a second pattern "PaymentSaga" with status "roadmap" in phase 22 depending on "EventStore"
      And a shared dependency pattern "EventStore" with status "completed"
      When I assemble context for both patterns with session "design"
      Then the bundle contains metadata for "OrderSaga"
      And the bundle contains metadata for "PaymentSaga"
      And the bundle lists "EventStore" as a shared dependency

    @acceptance-criteria @validation
    Scenario: Pattern not found returns error with suggestion
      Given a pattern "OrderSaga" exists in the dataset
      When I assemble context for "NonExistent" with session "design"
      Then an error is thrown with code "PATTERN_NOT_FOUND"

  Rule: buildDepTree walks dependency chains with cycle detection

    @acceptance-criteria @happy-path
    Scenario: Dependency tree shows chain with status markers
      Given a dependency chain: "Root" completed -> "Middle" active -> "Leaf" roadmap
      When I build a dep-tree for "Leaf" with depth 3
      Then the tree root is "Root"
      And the focal node "Leaf" is marked with isFocal

    @acceptance-criteria @happy-path
    Scenario: Depth limit truncates branches
      Given a dependency chain: "A" completed -> "B" active -> "C" roadmap -> "D" roadmap
      When I build a dep-tree for "D" with depth 2
      Then truncated branches are indicated

    @acceptance-criteria @validation
    Scenario: Circular dependencies are handled safely
      Given patterns "A" depends on "B" and "B" depends on "A"
      When I build a dep-tree for "A" with depth 5
      Then the tree does not infinitely recurse

    @edge-case
    Scenario: Standalone pattern returns single-node tree
      Given a standalone pattern "Standalone" with no dependencies
      When I build a dep-tree for "Standalone" with depth 3
      Then the tree root is "Standalone"
      And the tree has no children

  Rule: buildOverview provides executive project summary

    @acceptance-criteria @happy-path
    Scenario: Overview shows progress, active phases, and blocking
      Given a dataset with phased patterns including dependencies
      When I build the overview
      Then the progress shows completed, active, and planned counts
      And at least one active phase is listed with pattern counts
      And blocking entries include patterns with incomplete dependencies

    @acceptance-criteria @validation
    Scenario: Empty dataset returns zero-state overview
      Given an empty dataset with 0 patterns
      When I build the overview
      Then the progress shows total 0 with 0 percent
      And no active phases are listed
      And no blocking is reported

  Rule: buildFileReadingList returns paths by relevance

    @acceptance-criteria @happy-path
    Scenario: File list includes primary and related files
      Given a pattern "OrderSaga" with dependencies
      When I build the file reading list with related
      Then primary files include the spec file
      And completed dependency files are listed
      And roadmap dependency files are listed

    @acceptance-criteria @happy-path
    Scenario: File list includes implementation files for completed dependencies
      Given a pattern "Feature" that depends on "CompletedLib"
      And "CompletedLib" is completed and implemented by "src/lib/completed-lib.ts"
      When I build the file reading list for "Feature" with related
      Then completed dependency files include "src/lib/completed-lib.ts"

    @acceptance-criteria @happy-path
    Scenario: File list without related returns only primary
      Given a pattern "OrderSaga" with dependencies
      When I build the file reading list without related
      Then primary files include the spec file
      And no dependency files are listed
