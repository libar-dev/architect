@libar-docs-adr:002
@libar-docs-adr-status:accepted
@libar-docs-adr-category:architecture
@libar-docs-pattern:ADR002ProgressiveDisclosureArchitecture
@libar-docs-phase:43
@libar-docs-status:completed
@libar-docs-completed:2026-01-07
@libar-docs-product-area:Generators
Feature: ADR-002 - Progressive Disclosure Information Architecture

  **Context:**
  Single-file PRD documentation became unwieldy at scale.
  - PRODUCT-REQUIREMENTS.md grew to 2143 lines
  - Stakeholders overwhelmed by inline acceptance criteria
  - Navigation difficult without table of contents
  - Large product areas dominated the document
  - Hard to find specific features in massive single file

  **Decision:**
  Implement progressive disclosure pattern for generated documentation:
  - Executive summary with product area navigation in main file
  - Detail files per product area (always created when enabled)
  - Binary toggle: enabled creates all detail files, disabled inlines all
  - No thresholds - consistent behavior regardless of item count
  - Multi-file output via context.additionalFiles API

  **Update 2026-01-18:** Removed threshold-based splitting. Original design used
  splitThreshold to inline small categories, but this created inconsistent behavior.
  Patterns and Requirements codecs used binary generateDetailFiles, while ADR codec
  had threshold logic. Unified to binary pattern for consistency.

  **Consequences:**
  - (+) Main PRD becomes scannable executive summary
  - (+) Stakeholders can navigate to specific areas
  - (+) Consistent behavior: enabled = all files, disabled = all inline
  - (+) Progressive detail: summary → full specs
  - (+) Pattern reusable for other generators (ADRs, etc.)
  - (+) Simpler API - no threshold configuration needed
  - (-) Multiple files to maintain
  - (-) Small categories also get their own files (acceptable trade-off)
  - (-) Requires INDEX.md to explain file organization

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location | Release |
      | Progressive disclosure schema | Complete | Yes | src/validation-schemas/generator-config.ts | v0.3.0 |
      | PrdFeaturesSection split logic | Complete | Yes | src/generators/sections/prd-features.ts | v0.3.0 |
      | Multi-file output via additionalFiles | Complete | Yes | src/generators/sections/prd-features.ts | v0.3.0 |

  @acceptance-criteria
  Scenario: All product areas split to detail files when enabled
    Given any product area with features
    When generating PRD with progressive disclosure enabled
    Then requirements/[ProductArea].md is created for each area
    And main PRD links to detail file
