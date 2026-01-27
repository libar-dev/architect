@libar-docs
@libar-docs-pattern:GeneratorInfrastructureTesting
@libar-docs-status:roadmap
@libar-docs-phase:104
@libar-docs-effort:2d
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:ensure-generator-orchestration-works-correctly
@libar-docs-priority:high
@libar-docs-executable-specs:tests/features/generators
Feature: Generator Infrastructure Testing

  **Problem:**
  Core generator infrastructure lacks behavior specs:
  - `src/generators/orchestrator.ts` (~420 lines) - Main entry point, untested
  - `src/generators/registry.ts` - Registry pattern, untested
  - `src/generators/codec-based.ts` - Adapter pattern, untested

  These components orchestrate all document generation but have no executable tests.

  **Solution:**
  Create behavior specs for:
  - Orchestrator integration (dual-source merging, error handling)
  - Registry operations (register, get, list)
  - CodecBasedGenerator adapter (delegation, error handling)

  **Business Value:**
  | Benefit | How |
  | Pipeline Reliability | Generation orchestration works correctly |
  | Error Visibility | Failures produce clear error messages |
  | Extension Safety | New generators integrate correctly |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Test Type | Location |
      | orchestrator.feature | planned | Yes | integration | tests/features/generators/orchestrator.feature |
      | registry.feature | planned | Yes | unit | tests/features/generators/registry.feature |
      | codec-based.feature | planned | Yes | unit | tests/features/generators/codec-based.feature |
      | orchestrator.steps.ts | planned | Yes | - | tests/steps/generators/orchestrator.steps.ts |
      | registry.steps.ts | planned | Yes | - | tests/steps/generators/registry.steps.ts |
      | codec-based.steps.ts | planned | Yes | - | tests/steps/generators/codec-based.steps.ts |

  # ============================================================================
  # RULE 1: Generator Orchestrator
  # ============================================================================

  Rule: Orchestrator coordinates full documentation generation pipeline

    **Invariant:** Orchestrator merges TypeScript and Gherkin patterns,
    handles conflicts, and produces requested document types.

    **API:** See `src/generators/orchestrator.ts`

    **Verified by:** Dual-source merging, Conflict detection, Generator selection

    @acceptance-criteria @happy-path
    Scenario: Orchestrator merges TypeScript and Gherkin patterns
      Given TypeScript files with 5 patterns
      And feature files with 3 patterns (2 overlap)
      When generateDocumentation is called
      Then merged dataset has 6 unique patterns
      And overlapping patterns have combined metadata

    @acceptance-criteria @validation
    Scenario: Orchestrator detects pattern name conflicts
      Given TypeScript pattern "MyFeature" with status "completed"
      And Gherkin pattern "MyFeature" with status "roadmap"
      When generateDocumentation is called
      Then conflict is reported for "MyFeature"
      And generation continues with warning

    @acceptance-criteria @happy-path
    Scenario: Orchestrator generates requested document types
      Given source files with pattern metadata
      When generateDocumentation with generators ["patterns", "roadmap"]
      Then PATTERNS.md and ROADMAP.md are generated
      And other document types are not generated

    @acceptance-criteria @validation
    Scenario: Unknown generator name fails gracefully
      When generateDocumentation with generators ["invalid-gen"]
      Then error is returned
      And available generators are listed

    @acceptance-criteria @validation
    Scenario: Partial success when some generators fail
      Given source files with pattern metadata
      And one generator has internal error
      When generateDocumentation is called
      Then successful generators produce output
      And failed generator is reported with error

  # ============================================================================
  # RULE 2: Generator Registry
  # ============================================================================

  Rule: Registry manages generator registration and retrieval

    **Invariant:** Registry prevents duplicate names, returns undefined for
    unknown generators, and lists available generators alphabetically.

    **API:** See `src/generators/registry.ts`

    **Verified by:** Registration, Retrieval, Listing

    @acceptance-criteria @happy-path
    Scenario: Register generator with unique name
      Given empty registry
      When registering generator "my-generator"
      Then registration succeeds
      And registry has generator "my-generator"

    @acceptance-criteria @validation
    Scenario: Duplicate registration throws error
      Given registry with generator "patterns"
      When registering generator "patterns" again
      Then error is thrown
      And error message contains "already registered"

    @acceptance-criteria @happy-path
    Scenario: Get registered generator
      Given registry with generators ["patterns", "roadmap"]
      When getting generator "patterns"
      Then generator is returned
      And generator name is "patterns"

    @acceptance-criteria @validation
    Scenario: Get unknown generator returns undefined
      Given registry with generators ["patterns"]
      When getting generator "unknown"
      Then undefined is returned

    @acceptance-criteria @happy-path
    Scenario: Available returns sorted list
      Given registry with generators ["roadmap", "patterns", "changelog"]
      When calling available()
      Then list is ["changelog", "patterns", "roadmap"]

  # ============================================================================
  # RULE 3: Codec-Based Generator
  # ============================================================================

  Rule: CodecBasedGenerator adapts codecs to generator interface

    **Invariant:** Generator delegates to underlying codec for transformation.
    Missing MasterDataset produces descriptive error.

    **API:** See `src/generators/codec-based.ts`

    **Verified by:** Delegation, Error handling

    @acceptance-criteria @happy-path
    Scenario: Generator delegates to codec
      Given CodecBasedGenerator wrapping PatternsDocumentCodec
      And context with MasterDataset
      When generator.generate() is called
      Then codec.decode() is invoked with dataset
      And RenderableDocument is returned

    @acceptance-criteria @validation
    Scenario: Missing MasterDataset returns error
      Given CodecBasedGenerator for patterns
      And context WITHOUT MasterDataset
      When generator.generate() is called
      Then error file is returned
      And error message indicates missing dataset

    @acceptance-criteria @happy-path
    Scenario: Codec options are passed through
      Given CodecBasedGenerator with codecOptions
      And context with MasterDataset
      When generator.generate() is called
      Then codec receives codecOptions

  # ============================================================================
  # RULE 4: PR Changes Options
  # ============================================================================

  Rule: Orchestrator supports PR changes generation options

    **Invariant:** PR changes can filter by git diff, changed files, or release version.

    **API:** See `src/generators/orchestrator.ts` prChangesOptions

    **Verified by:** Git diff filtering, Changed files filtering, Release filtering

    @acceptance-criteria @happy-path
    Scenario: PR changes filters to git diff base
      Given source files with patterns
      And gitDiffBase is "main"
      When generating pr-changes
      Then only patterns changed since main are included

    @acceptance-criteria @happy-path
    Scenario: PR changes filters to explicit file list
      Given source files with 10 patterns
      And changedFiles lists 3 feature files
      When generating pr-changes
      Then only patterns from those 3 files are included

    @acceptance-criteria @happy-path
    Scenario: PR changes filters by release version
      Given patterns with releases v0.1.0, v0.2.0, unreleased
      And releaseFilter is "v0.2.0"
      When generating pr-changes
      Then only v0.2.0 patterns are included

