@projection
Feature: Projection package scaffold
  The projection package provides the shared foundations for later schema and renderer waves.

  Background:
    Given the projection scaffold state is initialized

  Rule: Canonical block vocabulary is available in the new package

    **Invariant:** The new package must expose the canonical 9-block vocabulary and explicit context typing without relying on ambient module-level state.
    **Rationale:** Wave 1 creates the stable base that later fragment schemas and renderers will build on, so the package needs a working test pipeline and the copied block surface up front.
    **Verified by:** Canonical blocks parse and explicit projection context can be created

    @happy-path
    Scenario: Canonical blocks parse and explicit projection context can be created
      Given all canonical block builders are used
      When the blocks are validated against the canonical schema
      And an explicit projection context is created
      Then every canonical block should validate successfully
      And the projection context should keep runtime inputs local
