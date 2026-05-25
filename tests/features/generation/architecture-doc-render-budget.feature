# Tooling regression guard — intentionally NOT an @architect pattern (it has no
# domain identity; it guards the generated artifact, not a behaviour of the
# system). The architecture-splitting behaviour itself is specified by
# DocumentationCompositionProjectionExecutableTests (config-documentation.feature).
Feature: Generated architecture document stays within Mermaid's render budget

  **Business Value:** ARCHITECTURE.md is the entry point for understanding the
  repo. If any Mermaid block exceeds the renderer's maximum text size it fails
  to render with "Maximum text size in diagram exceeded", leaving readers with
  no diagram at all. The architecture projection splits the view into many
  bounded diagrams precisely to stay under that budget (see DECISIONS D-14).

  Rule: No single Mermaid block in the generated architecture document exceeds the renderer limit

    Scenario: every mermaid block in the generated architecture document is renderable
      Given the generated architecture document at "docs-live/ARCHITECTURE.md"
      When I extract its fenced mermaid blocks
      Then it should contain more than one mermaid block
      And every mermaid block should be smaller than 50000 characters
