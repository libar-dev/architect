@architect
@architect-pattern:ExecutionContextProjectionExecutableTests
@architect-implements:ExecutionContextProjectionSupport,ScopeReadinessProjection,SessionContextProjection,FileReadingListProjection,DeliverableProjection,HandoffProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@execution-context
Feature: Execution Context context and session projections

  **Business Value:** Consumers compose all session-entry artifacts —
  scope-readiness verdicts, per-session context bundles, file reading lists,
  deliverable manifests, and handoff records — from `ProjectionContext` alone,
  so CLI, MCP, and UI surfaces share one verdict, one reading order, and one
  handoff shape per pattern.

  **How It Works:** Each projection parses options through a Zod schema and
  walks pattern metadata, dependencies, stubs, and architecture neighbors on
  the PatternGraph. Implement-session readiness runs the full check suite;
  design-session readiness runs the graph-only stub-coverage check and
  optionally promotes warnings to errors in strict mode. Session bundles vary
  shape by session type; handoff flattens deliverable progress and derives
  blockers from incomplete dependencies.

  Background:
    Given the Execution Context projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/execution-context/context-session.feature |

  Rule: Scope readiness separates implementation blockers from design warnings

    **Invariant:** Implement-session readiness produces `error`-severity checks
    (including `dependencies-completed`) that move the verdict to `BLOCKED`
    when any dependency is incomplete; design-session readiness produces a
    `warning`-severity `stubs-from-deps-exist` check that yields `WARN`
    without requiring baseDir semantics; and when `strict` is true design
    warnings are promoted to errors and the verdict becomes `BLOCKED`.

    **Rationale:** Implementation must not start with unfinished dependencies,
    but design exploration should surface missing stubs as guidance rather than
    blockers unless the caller opts into strict mode.

    **Verified by:** implementation readiness blocks when a dependency is incomplete, design readiness uses graph-only stub coverage without baseDir semantics, strict readiness promotes design warnings to blockers

    @acceptance-criteria
    Scenario: implementation readiness blocks when a dependency is incomplete
      Given a Execution Context scope projection context with an incomplete implementation dependency
      When I project scope readiness for "ProjectionBody" in the implement session
      Then the scope readiness verdict should be "BLOCKED"
      And the scope readiness check "dependencies-completed" should be an error

    Scenario: design readiness uses graph-only stub coverage without baseDir semantics
      Given a Execution Context scope projection context with a missing dependency stub
      When I project scope readiness for "ProjectionBody" in the design session
      Then the scope readiness verdict should be "WARN"
      And the scope readiness check "stubs-from-deps-exist" should be a warning

    Scenario: strict readiness promotes design warnings to blockers
      Given a Execution Context scope projection context with a missing dependency stub
      When I project scope readiness for "ProjectionBody" in the design session with strict mode
      Then the scope readiness verdict should be "BLOCKED"
      And the scope readiness check "stubs-from-deps-exist" should be an error

  Rule: Session context varies by session type

    **Invariant:** `projectSessionContextBundle` shapes its output by session
    type — planning returns minimal metadata only; design adds stubs,
    consumers, and architecture neighbors; implement adds test files and FSM
    data. Every returned bundle root round-trips through the
    `SessionContextBundle` fragment schema, and `parseAndProjectSessionContext`
    rejects session types outside `SessionTypeSchema`.

    **Rationale:** Session consumers pay only for the context their session
    type needs, and invalid session options must fail at the parse boundary
    instead of producing an ambiguous bundle.

    **Verified by:** planning design and implement sessions expose different shapes, parseAndProjectSessionContext rejects invalid session options, parseAndProjectSessionContext rejects extra option properties

    Scenario: planning design and implement sessions expose different shapes
      Given a Execution Context session projection context with metadata stubs neighbors and tests
      When I project session context for the planning design and implement sessions
      Then the planning session context should stay minimal
      And the design session context should include stubs consumers and architecture neighbors
      And the implement session context should include test files and FSM data
      And each projected session bundle root should round-trip through the Fragment schema

    Scenario: parseAndProjectSessionContext rejects invalid session options
      Given a Execution Context session projection context with metadata stubs neighbors and tests
      When I parse-and-project session context with an invalid session type
      Then parsing session context options should fail loudly

    Scenario: parseAndProjectSessionContext rejects extra option properties
      Given a Execution Context session projection context with metadata stubs neighbors and tests
      When I parse-and-project session context with an extra option property
      Then parsing session context options should reject the extra property

  Rule: Reading lists and deliverables stay deterministic

    Scenario: reading-list and deliverable lookups normalize the same graph data
      Given a Execution Context reading-list projection context with completed and roadmap dependencies
      When I project the file reading list and deliverable views for "ProjectionBody"
      Then the file reading list should separate primary completed roadmap and architecture files
      And the deliverable manifest should preserve the declared deliverable order
      And the single deliverable lookup should be case-insensitive

    Scenario: reading-list without related files stays focused on primary sources
      Given a Execution Context reading-list projection context with completed and roadmap dependencies
      When I project the file reading list for "ProjectionBody" without related files
      Then the file reading list should keep only primary files

  Rule: Reverse-trace surfaces the realizing features as specs primary and tests

    **Invariant:** When the focal pattern is a TypeScript pattern realized by a
    `.feature` spec via the derived `implementedBy` reverse edge, design and
    implement session context push the implementing `.feature` paths into
    `specFiles`, implement context also pushes them into `testFiles`, and the
    file reading list lists those `.feature` paths in `primary` (not gated by
    `--related`).

    **Rationale:** The only link from a TS pattern to its behavioral spec is
    `implementedBy` (ADR-002/ADR-003); a reverse-trace question must follow it
    rather than returning an empty spec/test set for the TS focal node.

    **Verified by:** session context follows implementedBy for specs and tests, file reading list lists realizing features as primary

    Scenario: session context follows implementedBy for specs and tests
      Given a Execution Context session projection context where a TS pattern is realized by a feature spec
      When I project session context for the design and implement sessions
      Then the design session context specFiles should include the realizing feature
      And the implement session context testFiles should include the realizing feature

    Scenario: file reading list lists realizing features as primary
      Given a Execution Context session projection context where a TS pattern is realized by a feature spec
      When I project the file reading list for "ReverseTraceBody" without related files
      Then the file reading list primary should include the realizing feature

  Rule: Handoff stays flattened and separate from scope/context bundles

    Scenario: handoff projection derives flattened session state from graph data
      Given a Execution Context handoff projection context with mixed deliverable progress
      When I project handoff for "ProjectionBody" in the implement session
      Then the handoff record should expose flattened completed in-progress discovered blockers and next-session fields
