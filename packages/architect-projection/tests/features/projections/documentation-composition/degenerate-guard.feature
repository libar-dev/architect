@architect
@architect-pattern:GeneratorDegeneracyGuardExecutableTests
@architect-implements:GeneratorDegeneracyGuard
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@documentation-composition
Feature: Documentation generator degeneracy guard

  **Business Value:** A documentation generator that advertises itself as THE
  traceability matrix (or pattern catalog, or release notes) yet renders a
  zero-row collection is a silent-empty trust failure. The degeneracy guard
  turns that into a loud, named build-time error so a degenerate view cannot
  ship unnoticed.

  **How It Works:** `assertGeneratorNotDegenerate(documentType, rootFragment)`
  looks the root fragment's kind up in a per-kind primary-collection map
  (TraceabilityMatrix→rows, RoadmapTimeline→quarters, …) and throws
  `GeneratorDegenerateError` naming the document type when that collection is
  empty. Fragment kinds with no registered primary collection are not
  collection-bearing and pass unconditionally.

  Background:
    Given the generator degeneracy guard state is initialized

  Rule: Collection-bearing generators must not produce a degenerate root

    **Invariant:** When a collection-bearing root fragment's primary collection
    is empty, the guard throws `GeneratorDegenerateError` whose `documentType`
    names the offending generator and whose `reason` reports the empty field;
    when the primary collection has at least one entry, the guard returns
    without throwing.

    **Rationale:** Centralising degeneracy knowledge keyed off the fragment
    kind keeps magic strings out of the docs runner and fails loud at gen time.

    **Verified by:** an empty traceability matrix is rejected, a populated one passes

    @acceptance-criteria
    Scenario: an empty collection-bearing root is rejected
      Given a traceability matrix root fragment with no rows
      When the degeneracy guard inspects the traceability generator
      Then the guard should throw a degenerate error naming the traceability generator

    @acceptance-criteria
    Scenario: a populated collection-bearing root passes
      Given a traceability matrix root fragment with one row
      When the degeneracy guard inspects the traceability generator
      Then the guard should not throw

  Rule: Non-collection-bearing generators are never reported degenerate

    **Invariant:** A root fragment whose kind has no registered primary
    collection passes the guard unconditionally, even when it carries no
    list-shaped payload.

    **Rationale:** The guard only knows row/collection-bearing kinds; single-
    entity documents (e.g. a pattern detail) are legitimately scalar.

    **Verified by:** a non-collection fragment passes the guard

    @acceptance-criteria
    Scenario: a non-collection-bearing root passes
      Given a status distribution root fragment
      When the degeneracy guard inspects the current-work generator
      Then the guard should not throw
