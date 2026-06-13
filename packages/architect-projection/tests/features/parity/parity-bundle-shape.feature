@projection
@parity
Feature: Bundle shape parity — cross-context references and file-count drop

  Background:
    Given a parity projection context with three patterns across two packages

  Rule: Requirement bundles carry references, not embedded BusinessRule fragments

    **Invariant:** RequirementDigest entries carry BusinessRuleReference arrays; the bundle's children map contains zero BusinessRule fragments.
    **Rationale:** Cross-context references resolve at render time; embedding produces duplicate truth.
    **Verified by:** cross-context reference parity scenarios

    Scenario: Requirement bundle children carry zero BusinessRule fragments
      When I project the requirements-executable bundle
      Then no child fragment is a BusinessRule
      And every RequirementDigest carries a businessRuleReferences array
      And every BusinessRuleReference carries a populated ownerRouteId

  Rule: Default-disclosure business-rules bundle stays compact

    **Invariant:** At default disclosure, the business-rules bundle emits one root file plus one child per configured package — no per-rule files.
    **Rationale:** Committed docs stay grep-friendly; the per-rule explosion was the campaign's primary motivation.
    **Verified by:** file-count parity scenarios

    Scenario: Markdown output has one root plus one child per package
      When I project the business-rules bundle grouped by package
      And I render the bundle to markdown
      Then the rendered file map has at most one root file
      And the rendered file map has one child file per configured package
      And no rendered file path matches a business-rule-*.md pattern
