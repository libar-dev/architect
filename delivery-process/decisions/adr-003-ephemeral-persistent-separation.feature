@libar-docs
@libar-docs-adr:003
@libar-docs-adr-status:accepted
@libar-docs-adr-category:architecture
@libar-docs-pattern:ADR003EphemeralPersistentSeparation
@libar-docs-phase:43
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-convention-tag-for-codec-reference-gen
@libar-docs-convention:session-workflow
@libar-docs-completed:2026-01-07
@libar-docs-product-area:Generators
Feature: ADR-003 - Ephemeral vs Persistent Documentation Separation

  **Context:**
  Generated documentation mixed session-specific content with persistent docs.
  - PR-CHANGES.md regenerated frequently but lived alongside persistent files
  - Confusing which files should be committed vs ephemeral
  - CURRENT-WORK.md and SESSION-CONTEXT.md are session-specific
  - No clear organization for working documents
  - Risk of committing ephemeral content to version control

  **Decision:**
  Separate ephemeral (session/PR) content into working/ subdirectory:
  - working/PR-CHANGES.md for PR-specific content
  - Clear visual distinction between persistent and ephemeral
  - INDEX.md explains the distinction
  - Ephemeral files regenerated per session
  - Persistent files regenerated on demand

  **Consequences:**
  - (+) Clear separation of ephemeral and persistent documentation
  - (+) Reduces confusion about what to commit
  - (+) Working directory can be gitignored if desired
  - (+) INDEX.md provides clear documentation map
  - (-) Additional directory to maintain
  - (-) Slightly more complex file organization

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location | Release |
      | Create docs-living/working/ directory | complete | No | docs-living/working/ | v0.3.0 |
      | Move PR-CHANGES to working/ subfolder | complete | No | src/generators/built-in/self-docs.ts | v0.3.0 |
      | INDEX.md explaining file organization | complete | No | docs-living/INDEX.md | v0.3.0 |

  @acceptance-criteria
  Scenario: PR-CHANGES generated to working/ subfolder
    Given the docs-living/working/ directory exists
    When running pnpm docs:self-pr-changes
    Then working/PR-CHANGES.md is created
    And root-level PR-CHANGES.md is not created
