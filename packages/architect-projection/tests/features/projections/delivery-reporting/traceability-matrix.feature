@architect
@architect-pattern:TraceabilityMatrixProjectionExecutableTests
@architect-implements:TraceabilityMatrixProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting traceability matrix projection

  **Business Value:** Consumers receive a `TraceabilityMatrix` bundle linking
  each production pattern to the executable features/steps that realize it —
  the root carries every row for a `TRACEABILITY.md` export and the children
  split one file per pattern so audits can deep-link to a single row.

  **How It Works:** The projection iterates the graph's patterns and keeps only
  those whose relationship index carries one or more `implementedBy`
  realization edges. Each row's tests are the deduplicated executable
  `.feature` realization files (production TS implementers on the same edge are
  excluded), specs is the pattern's own source file, and deliverables are the
  deduplicated deliverable locations. Rows are sorted by pattern name and child
  routing uses a deterministic slug per pattern under `traceability/`.

  Background:
    Given the Delivery Reporting traceability projection state is initialized

  Rule: Traceability rows are sourced from realization edges and stay deterministic

    **Invariant:** Every row exposes `pattern`, `status`, `tests`, `specs`, and
    `deliverables` arrays; exactly one row appears per pattern that carries at
    least one `implementedBy` realization edge; patterns with no realization
    edge are excluded; `tests` are the deduplicated, sorted executable
    `.feature` realization files only (production TS implementers on the same
    `implementedBy` edge are excluded); `specs` is the pattern's own source
    file; child keys are deterministic slugs of the pattern name.

    **Rationale:** The doctrine traceability matrix is the prod-pattern ↔
    implementing-feature realization edge; sourcing rows from the never-
    populated phase dimension produced a silent-empty matrix, a trust failure
    on a view that advertises itself as THE traceability surface. The `tests`
    column is the executable-spec realization surface, so a TS source that
    realizes a pattern (a `.ts` `implementedBy` ref) must not masquerade as a
    test.

    **Verified by:** projecting the traceability matrix from realization edges, the tests column excludes production TS realizers

    @acceptance-criteria
    Scenario: projecting the traceability matrix from realization edges
      Given a traceability projection context with realized and unrealized patterns
      When I project the traceability matrix
      Then the traceability matrix should include only patterns with realization edges
      And each row's tests should be the realizing source files
      And the traceability child keys should be deterministic

    @acceptance-criteria
    Scenario: the tests column excludes production TS realizers
      Given a traceability projection context with a TS and a feature realizer on one pattern
      When I project the traceability matrix
      Then the row's tests should contain only the executable feature file
