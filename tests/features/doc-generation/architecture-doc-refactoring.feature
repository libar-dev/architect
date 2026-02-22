@libar-docs
@libar-docs-pattern:ArchitectureDocRefactoringTesting
@libar-docs-status:active
@libar-docs-product-area:Generation
@integration
Feature: Architecture Doc Refactoring Coverage

  Validates that ARCHITECTURE.md section replacements from docs consolidation
  still point to covering generated documents and preserve required pipeline
  annotation examples.

  Background:
    Given ARCHITECTURE.md on the filesystem

  Rule: Product area pointer replacements link to covering documents

    @happy-path
    Scenario: Configuration Architecture pointer links to covering document
      When reading the "Configuration Architecture" section
      Then the section contains "See [CONFIGURATION.md](../docs-live/product-areas/CONFIGURATION.md)"
      And file "docs-live/product-areas/CONFIGURATION.md" contains "config resolution"
      And file "docs-live/product-areas/CONFIGURATION.md" also contains "preset"

    @happy-path
    Scenario: Source Systems pointer links to annotation product area
      When reading the "Source Systems" section
      Then the section contains "See [ANNOTATION.md](../docs-live/product-areas/ANNOTATION.md)"
      And file "docs-live/product-areas/ANNOTATION.md" contains "scanner"
      And file "docs-live/product-areas/ANNOTATION.md" also contains "tag dispatch"

    @happy-path
    Scenario: Workflow Integration pointer links to process product area
      When reading the "Workflow Integration" section
      Then the section contains "See [PROCESS.md](../docs-live/product-areas/PROCESS.md)"
      And file "docs-live/product-areas/PROCESS.md" contains "FSM lifecycle"
      And file "docs-live/product-areas/PROCESS.md" also contains "session"

  Rule: Annotation examples remain in Four-Stage Pipeline section

    @happy-path
    Scenario: Annotation format examples appear before Source Systems
      When reading the "Four-Stage Pipeline" section
      Then the section contains "@libar-docs-core"
      And the section also contains "@libar-docs-shape"
      And section "Four-Stage Pipeline" appears before section "Source Systems"
