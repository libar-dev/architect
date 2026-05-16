@architect
@architect-pattern:TraceabilityMatrixProjectionExecutableTests
@architect-implements:TraceabilityMatrixProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting traceability matrix projection

  **Business Value:** Consumers receive a `TraceabilityMatrix` bundle linking
  each phased Gherkin pattern to its tests, specs, and deliverables — the
  root carries every row for a `TRACEABILITY.md` export and the children
  split one file per pattern so audits can deep-link to a single row.

  **How It Works:** The projection filters the graph's Gherkin source patterns
  down to those with a phase, sorts them by phase and name, and derives each
  row's tests from the pattern's executable specs plus behaviour file, specs
  from its source file, and deliverables from the deduplicated deliverable
  locations. Child routing uses a deterministic slug per pattern under
  `traceability/`.

  Background:
    Given the Delivery Reporting traceability projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/delivery-reporting/traceability-matrix.feature |

  Rule: Traceability rows stay projection-shaped and deterministic

    **Invariant:** Every row exposes `pattern`, `status`, `tests`, `specs`,
    and `deliverables` arrays; only phased Gherkin-sourced patterns appear;
    rows are sorted by phase then pattern name; test/deliverable lists are
    deduplicated; child keys are deterministic slugs of the pattern name.

    **Rationale:** Downstream renderers and CI artifacts rely on stable row
    ordering and lossless coverage metadata; leaking non-phased or
    non-Gherkin patterns would pollute the matrix with untested entries.

    **Verified by:** projecting the traceability matrix from timeline specs

    @acceptance-criteria
    Scenario: projecting the traceability matrix from timeline specs
      Given a traceability projection context with gherkin and non-gherkin patterns
      When I project the traceability matrix
      Then the traceability matrix should include only phased gherkin rows
      And the traceability child keys should be deterministic
