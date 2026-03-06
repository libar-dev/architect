@libar-docs
@libar-docs-pattern:ArchitectureDocRefactoringTesting
@libar-docs-status:active
@libar-docs-product-area:Generation
@integration
Feature: Architecture Doc Refactoring Coverage

  Validates that ARCHITECTURE.md retains its full reference content and that
  generated documents in docs-live/ coexist alongside it, covering equivalent
  content from annotated sources.

  Background:
    Given ARCHITECTURE.md on the filesystem

  Rule: Product area sections coexist with generated documents

    @happy-path
    Scenario: Configuration Architecture section retained and generated doc exists
      When reading the "Configuration Architecture" section
      Then the section has content
      And file "docs-live/product-areas/CONFIGURATION.md" contains "config resolution"
      And file "docs-live/product-areas/CONFIGURATION.md" also contains "preset"

    @happy-path
    Scenario: Source Systems section retained and annotation product area exists
      When reading the "Source Systems" section
      Then the section has content
      And file "docs-live/product-areas/ANNOTATION.md" contains "scanner"
      And file "docs-live/product-areas/ANNOTATION.md" also contains "tag dispatch"

    @happy-path
    Scenario: Workflow Integration section retained and process product area exists
      When reading the "Workflow Integration" section
      Then the section has content
      And file "docs-live/product-areas/PROCESS.md" contains "FSM lifecycle"
      And file "docs-live/product-areas/PROCESS.md" also contains "session"

  Rule: Four-Stage Pipeline section retains annotation format examples

    @happy-path
    Scenario: Annotation format examples appear before Source Systems
      When reading the "Four-Stage Pipeline" section
      Then the section contains "@libar-docs-shape"
      And the section also contains "extract-shapes"
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

  Rule: Full sections coexist with generated equivalents in docs-live

    @happy-path
    Scenario: Unified Transformation Architecture section retained and ARCHITECTURE-TYPES exists
      When reading the "Unified Transformation Architecture" section
      Then the section contains "MasterDataset"
      And file "docs-live/reference/ARCHITECTURE-TYPES.md" exists

    @happy-path
    Scenario: Data Flow Diagrams section retained and ARCHITECTURE-TYPES exists
      When reading the "Data Flow Diagrams" section
      Then the section has content
      And file "docs-live/reference/ARCHITECTURE-TYPES.md" exists

    @happy-path
    Scenario: Quick Reference section retained and ARCHITECTURE-CODECS exists
      When reading the "Quick Reference" section
      Then the section has content
      And file "docs-live/reference/ARCHITECTURE-CODECS.md" exists

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
    Scenario: Unified Transformation section has full MasterDataset content
      When reading the "Unified Transformation Architecture" section
      Then the section contains "MasterDataset"
      And the section also contains "RuntimeMasterDataset"

  Rule: Pipeline architecture convention appears in generated reference

    @happy-path
    Scenario: Orchestrator source file has pipeline-architecture convention tag
      When reading file "src/generators/orchestrator.ts"
      Then the file contains "pipeline-architecture"

    @happy-path
    Scenario: Build-pipeline source file has pipeline-architecture convention tag
      When reading file "src/generators/pipeline/build-pipeline.ts"
      Then the file contains "pipeline-architecture"

  Rule: Full ARCHITECTURE.md retains all sections with substantial content

    @happy-path
    Scenario: Programmatic Usage section exists in ARCHITECTURE.md
      Then section "Programmatic Usage" exists in ARCHITECTURE.md

    @happy-path
    Scenario: Extending the System section exists in ARCHITECTURE.md
      Then section "Extending the System" exists in ARCHITECTURE.md

    @happy-path
    Scenario: Key Design Patterns section has design pattern content
      When reading the "Key Design Patterns" section
      Then the section contains "Result"

    @happy-path
    Scenario: ARCHITECTURE.md is under 1700 lines as full reference
      Then ARCHITECTURE.md has fewer than 1700 lines
