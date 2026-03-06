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

  Rule: Convention extraction produces ARCHITECTURE-CODECS reference document

    @happy-path
    Scenario: Session codecs file produces multiple convention sections
      When reading file "docs-live/reference/ARCHITECTURE-CODECS.md"
      Then the file contains each of the following:
        """
        SessionContextCodec
        RemainingWorkCodec
        CurrentWorkCodec
        """

    @happy-path
    Scenario: Convention sections include output file references
      When reading file "docs-live/reference/ARCHITECTURE-CODECS.md"
      Then the file contains "SESSION-CONTEXT.md"
      And the file also contains "CURRENT-WORK.md"

    @happy-path
    Scenario: ARCHITECTURE-CODECS document has substantial content from all codec files
      When reading file "docs-live/reference/ARCHITECTURE-CODECS.md"
      Then the file has more than 400 lines

    @happy-path
    Scenario: Session codec source file has structured JSDoc headings
      When reading file "src/renderable/codecs/session.ts"
      Then the file contains each of the following:
        """
        ## SessionContextCodec
        **Purpose:**
        **Output Files:**
        """

    @happy-path
    Scenario: Convention rule titles match source heading text in generated output
      When reading file "docs-live/reference/ARCHITECTURE-CODECS.md"
      Then the file contains "ValidationRulesCodec"
      And the file also contains "PatternsDocumentCodec"

  Rule: Section disposition routes content to generated equivalents

    @happy-path
    Scenario: Unified Transformation Architecture section is a pointer to ARCHITECTURE-TYPES
      When reading the "Unified Transformation Architecture" section
      Then the section contains "ARCHITECTURE-TYPES.md"
      And the section does not contain "MasterDatasetSchema"

    @happy-path
    Scenario: Data Flow Diagrams section is a pointer
      When reading the "Data Flow Diagrams" section
      Then the section contains "ARCHITECTURE-TYPES.md"

    @happy-path
    Scenario: Quick Reference section points to ARCHITECTURE-CODECS
      When reading the "Quick Reference" section
      Then the section contains "ARCHITECTURE-CODECS.md"

  Rule: MasterDataset shapes appear in ARCHITECTURE-TYPES reference

    @happy-path
    Scenario: Core MasterDataset types appear in ARCHITECTURE-TYPES
      When reading file "docs-live/reference/ARCHITECTURE-TYPES.md"
      Then the file contains each of the following:
        """
        MasterDataset
        RuntimeMasterDataset
        RawDataset
        """

    @happy-path
    Scenario: Pipeline types appear in ARCHITECTURE-TYPES reference
      When reading file "docs-live/reference/ARCHITECTURE-TYPES.md"
      Then the file contains "PipelineOptions"
      And the file also contains "PipelineResult"

    @happy-path
    Scenario: Unified Transformation section replaced with pointer and narrative
      When reading the "Unified Transformation Architecture" section
      Then the section contains "MasterDataset types"
      And the section also contains "ARCHITECTURE-TYPES.md"

  Rule: Pipeline architecture convention appears in generated reference

    @happy-path
    Scenario: Orchestrator source file has pipeline-architecture convention tag
      When reading file "src/generators/orchestrator.ts"
      Then the file contains "pipeline-architecture"

    @happy-path
    Scenario: Build-pipeline source file has pipeline-architecture convention tag
      When reading file "src/generators/pipeline/build-pipeline.ts"
      Then the file contains "pipeline-architecture"

  Rule: Editorial trimming removes tutorial sections and reduces file size

    @happy-path
    Scenario: Programmatic Usage section removed from ARCHITECTURE.md
      Then section "Programmatic Usage" is absent from ARCHITECTURE.md

    @happy-path
    Scenario: Extending the System section removed from ARCHITECTURE.md
      Then section "Extending the System" is absent from ARCHITECTURE.md

    @happy-path
    Scenario: Key Design Patterns section has pointer to CORE-TYPES
      When reading the "Key Design Patterns" section
      Then the section contains "CORE-TYPES.md"

    @happy-path
    Scenario: ARCHITECTURE.md is under 400 lines after editorial trimming
      Then ARCHITECTURE.md has fewer than 400 lines
