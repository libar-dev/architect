@architect
@architect-pattern:UiRendererExecutableTests
@architect-implements:UiRenderer
@architect-status:active
@architect-role:projection
@projection
Feature: renderUi returns Studio-oriented structured UI documents
  The UI renderer should keep bundle structure intact while reshaping fragments into predictable pure-data sections for Studio consumption.

  Background:
    Given the renderUi test state is initialized

  Rule: PatternDetail stays the native UI shape

    @routed-documentation
    Scenario: PatternDetail renders structured UI sections
      Given a PatternDetail bundle fixture with sibling children and child references
      When I render the bundle as UI data
      Then the UI document should preserve the PatternDetail section hierarchy
      And child bundle entries should stay addressable by their normalized child keys

  Rule: PatternDetail uses a deterministic section order

    @pattern-detail
    Scenario: PatternDetail renders overview-first sections for Studio detail pages
      Given a PatternDetail fixture with deliverables relationships rules and stubs
      When I render the fragment as UI data
      Then the PatternDetail UI sections should follow the deterministic detail order

  Rule: Bundle traversal keeps the full nested UI tree

    @bundle
    Scenario: Projection bundles become root documents with keyed children
      Given a bundle fixture with two named child fragments
      When I render the bundle as UI data
      Then the UI document should expose a nested children map keyed by child name
