@behavior @extraction
@libar-docs-pattern:DualSourceExtractor
@libar-docs-product-area:Extraction
Feature: Dual-Source Extraction
  Extracts and combines pattern metadata from both TypeScript code stubs
  (@libar-docs-*) and Gherkin feature files (@libar-process-*), validates
  consistency, and composes unified pattern data for documentation.

  **Problem:**
  - Pattern data split across code stubs and feature files
  - Need to validate consistency between sources
  - Deliverables defined in Background tables need extraction
  - Pattern name collisions need handling

  **Solution:**
  - extractProcessMetadata() extracts tags from features
  - extractDeliverables() parses Background tables
  - combineSources() merges code + features into dual-source patterns
  - validateDualSource() checks cross-source consistency

  # ==========================================================================
  # Process Metadata Extraction
  # ==========================================================================

  Rule: Process metadata is extracted from feature tags

    @happy-path
    Scenario: Complete process metadata extraction
      Given a feature with process tags:
        | tag                                    |
        | libar-process-pattern:MyPattern        |
        | libar-process-phase:15                 |
        | libar-process-status:active            |
        | libar-process-quarter:Q1-2024          |
        | libar-process-effort:medium            |
      When extracting process metadata
      Then metadata is extracted successfully
      And the pattern name is "MyPattern"
      And the phase is 15
      And the status is "active"

    @happy-path
    Scenario: Minimal required tags extraction
      Given a feature with process tags:
        | tag                             |
        | libar-process-pattern:MinPattern|
        | libar-process-phase:01          |
      When extracting process metadata
      Then metadata is extracted successfully
      And the status defaults to "roadmap"

    @edge-case
    Scenario: Missing pattern tag returns null
      Given a feature with process tags:
        | tag                    |
        | libar-process-phase:10 |
      When extracting process metadata
      Then no metadata is extracted

    @edge-case
    Scenario: Missing phase tag returns null
      Given a feature with process tags:
        | tag                            |
        | libar-process-pattern:NoPhase  |
      When extracting process metadata
      Then no metadata is extracted

  # ==========================================================================
  # Deliverables Extraction
  # ==========================================================================

  Rule: Deliverables are extracted from Background tables

    @happy-path
    Scenario: Standard deliverables table extraction
      Given a feature with background deliverables:
        | Deliverable    | Status   | Tests | Location           |
        | Implement API  | Complete | 5     | src/api/handler.ts |
        | Write docs     | Done     | Yes   | docs/README.md     |
      When extracting deliverables
      Then 2 deliverables are extracted
      And deliverable "Implement API" has status "Complete"
      And deliverable "Implement API" has 5 tests

    @happy-path
    Scenario: Extended deliverables with Finding and Release
      Given a feature with background deliverables:
        | Deliverable | Status | Tests | Location | Finding  | Release |
        | Fix bug     | Done   | 3     | src/fix  | CODE-001 | v0.2.0  |
      When extracting deliverables
      Then deliverable "Fix bug" has finding "CODE-001"
      And deliverable "Fix bug" has release "v0.2.0"

    @edge-case
    Scenario: Feature without background returns empty
      Given a feature without background
      When extracting deliverables
      Then no deliverables are extracted

    @edge-case
    Scenario: Tests column handles various formats
      Given a feature with background deliverables:
        | Deliverable | Status | Tests | Location |
        | Test Yes    | Done   | Yes   | src/     |
        | Test No     | Done   | No    | src/     |
        | Test Number | Done   | 10    | src/     |
        | Test Empty  | Done   |       | src/     |
      When extracting deliverables
      Then the test counts are correctly parsed

  # ==========================================================================
  # Source Combination
  # ==========================================================================

  Rule: Code and feature patterns are combined into dual-source patterns

    @happy-path
    Scenario: Matching code and feature are combined
      Given a code pattern "MyPattern" with phase 15
      And a feature file for pattern "MyPattern" with phase 15
      When combining sources
      Then 1 combined pattern is produced
      And combined pattern "MyPattern" has process metadata
      And 0 code-only patterns exist
      And 0 feature-only patterns exist

    @edge-case
    Scenario: Code-only pattern has no matching feature
      Given a code pattern "CodeOnly" with phase 10
      And no feature files
      When combining sources
      Then 0 combined patterns are produced
      And 1 code-only patterns exist

    @edge-case
    Scenario: Feature-only pattern has no matching code
      Given no code patterns
      And a feature file for pattern "FeatureOnly" with phase 20
      When combining sources
      Then 0 combined patterns are produced
      And 1 feature-only patterns exist

    @edge-case
    Scenario: Phase mismatch creates validation error
      Given a code pattern "Mismatch" with phase 10
      And a feature file for pattern "Mismatch" with phase 20
      When combining sources
      Then 1 combined pattern is produced
      And 1 validation error exists
      And the error mentions phase mismatch

    @integration
    Scenario: Pattern name collision merges sources
      Given code patterns:
        | patternName | phase | category  | dependsOn |
        | ServiceX    | 15    | core      | PatternA  |
        | ServiceX    | 15    | ddd       | PatternB  |
      And a feature file for pattern "ServiceX" with phase 15
      When combining sources
      Then 1 combined pattern is produced
      And 1 warning about collision exists
      And combined pattern "ServiceX" has merged dependencies

  # ==========================================================================
  # Dual-Source Validation
  # ==========================================================================

  Rule: Dual-source results are validated for consistency

    @happy-path
    Scenario: Clean results have no errors
      Given dual-source results with no issues
      When validating dual-source
      Then validation passes
      And there are no errors
      And there are no warnings

    @edge-case
    Scenario: Cross-validation errors are reported
      Given dual-source results with validation errors:
        | codeName | featureName | message                       |
        | PatternA | PatternA    | Phase mismatch: code 10, feat 20 |
      When validating dual-source
      Then validation fails
      And 1 error is reported

    @edge-case
    Scenario: Orphaned roadmap code stubs produce warnings
      Given dual-source results with code-only patterns:
        | patternName | status  |
        | OrphanA     | roadmap |
        | OrphanB     | completed |
      When validating dual-source
      Then validation passes
      And 1 warning about missing feature file exists

    @edge-case
    Scenario: Feature-only roadmap patterns produce warnings
      Given dual-source results with feature-only patterns:
        | pattern      | phase | status  |
        | FeatureOnlyA | 10    | roadmap |
        | FeatureOnlyB | 20    | active  |
      When validating dual-source
      Then validation passes
      And 1 warning about missing code stub exists
