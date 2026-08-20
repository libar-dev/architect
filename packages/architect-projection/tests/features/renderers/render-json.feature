@architect
@architect-pattern:JsonRendererExecutableTests
@architect-implements:JsonRenderer
@architect-status:active
@architect-role:projection
@projection
Feature: renderJson produces stable JSON-safe projection output
  The JSON renderer should preserve fragment identity while producing deterministic JSON-safe output for fragments and bundles.

  Background:
    Given the renderJson test state is initialized

  Rule: Stable ordering and identity stay explicit in JSON output

    @stable-order
    Scenario: Stable key ordering is applied at every object depth by default
      Given a SessionContextBundle fixture with intentionally unsorted keys
      When I render the fragment as JSON twice
      Then the JSON object output should keep a stable alphabetical key order at every depth

    @round-trip
    Scenario: Fragment output round-trips through the fragment schema without losing identity
      Given a PatternSummary fixture
      When I render the fragment as JSON
      Then the JSON object output should round-trip through the PatternSummary schema
      And the JSON object output should equal the original fragment fixture

    @pretty
    Scenario: Pretty mode returns a formatted JSON string
      Given a PatternSummary fixture for pretty JSON output
      When I render the fragment as pretty JSON
      Then the pretty JSON output should be a formatted string

  Rule: Bundle output stays structured and JSON-safe

    @bundle
    Scenario: Bundle output keeps root, children, and JSON-safe routing metadata
      Given a routed JSON bundle fixture with two child fragments
      When I render the bundle as JSON
      Then the JSON bundle output should keep the root, children, and routing metadata

    @bundle
    Scenario: Progressive-disclosure bundles stay root-plus-children structured
      Given a progressive disclosure JSON bundle fixture with routed child documents
      When I render the progressive disclosure bundle as JSON
      Then the JSON bundle output should preserve root and child documents separately

  Rule: Non-JSON-safe runtime values are rejected explicitly

    @errors
    Scenario: Forbidden runtime values produce descriptive path errors
      Given fragment candidates containing forbidden runtime values
      When I attempt to render each invalid fragment as JSON
      Then each invalid fragment should fail with a descriptive path error

    @errors
    Scenario: Malformed bundle-like input fails loudly instead of being treated as a bundle
      Given a malformed bundle-like candidate with a non-fragment child
      When I attempt to render the malformed bundle-like input as JSON
      Then the malformed bundle-like input should not be identified as a bundle
      And rendering the malformed bundle-like input should fail loudly

  Rule: Plain-object checks stay shared and strict

    **Invariant:** The shared plain-object helper accepts plain objects and null-prototype objects, but rejects class instances and polluted-prototype carriers.
    **Rationale:** JSON rendering and bundle discrimination must stay aligned on what counts as safe object shape.
    **Verified by:** render-json helper scenarios and bundle-discrimination scenarios

    @plain-object
    Scenario: Shared plain-object checks allow safe records and reject unsafe object carriers
      Given plain-object helper candidates covering safe and unsafe object shapes
      When I evaluate the shared plain-object helper for each candidate
      Then the helper should accept the plain object candidate
      And the helper should accept the null-prototype candidate
      And the helper should reject the class instance candidate
      And the helper should reject the polluted-prototype candidate
