@architect
@behavior @extraction
@architect-pattern:DualSourceExtractorTesting
@architect-implements:DualSourceExtractor
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Annotation
Feature: Dual-Source Extraction
  Extracts and combines pattern metadata from both TypeScript code stubs
  (@architect-*) and Gherkin feature files (@libar-process-*), validates
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

    **Invariant:** A feature file must have both @pattern and @phase tags to produce valid process metadata; missing either yields null.
    **Rationale:** Pattern name and phase are the minimum identifiers for placing a pattern in the roadmap — without both, the pattern cannot be tracked.
    **Verified by:** Complete process metadata extraction, Minimal required tags extraction, Missing pattern tag returns null, Missing phase tag returns null

    @happy-path
    Scenario: Complete process metadata extraction
      Given a feature with process tags:
        | tag                                    |
        | pattern:MyPattern        |
        | phase:15                 |
        | status:active            |
        | quarter:Q1-2024          |
        | effort:medium            |
      When extracting process metadata
      Then metadata is extracted successfully
      And the pattern name is "MyPattern"
      And the phase is 15
      And the status is "active"

    @happy-path
    Scenario: Minimal required tags extraction
      Given a feature with process tags:
        | tag                             |
        | pattern:MinPattern|
        | phase:01          |
      When extracting process metadata
      Then metadata is extracted successfully
      And the status defaults to "roadmap"

    @edge-case
    Scenario: Missing pattern tag returns null
      Given a feature with process tags:
        | tag                    |
        | phase:10 |
      When extracting process metadata
      Then no metadata is extracted

    @edge-case
    Scenario: Missing phase tag returns null
      Given a feature with process tags:
        | tag                            |
        | pattern:NoPhase  |
      When extracting process metadata
      Then no metadata is extracted

  # ==========================================================================
  # Deliverables Extraction
  # ==========================================================================

  Rule: Deliverables are extracted from Background tables

    **Invariant:** Deliverables are sourced exclusively from Background tables; features without a Background produce an empty deliverable list.
    **Rationale:** The Background table is the single source of truth for deliverable tracking — extracting from other locations would create ambiguity.
    **Verified by:** Standard deliverables table extraction, Extended deliverables with Finding and Release, Feature without background returns empty, Tests column handles various formats

    @happy-path
    Scenario: Standard deliverables table extraction
      Given a feature with background deliverables:
        | Deliverable    | Status   | Tests | Location           |
        | Implement API  | complete | 5     | src/api/handler.ts |
        | Write docs     | complete | Yes   | docs/README.md     |
      When extracting deliverables
      Then 2 deliverables are extracted
      And deliverable "Implement API" has status "complete"
      And deliverable "Implement API" has 5 tests

    @happy-path
    Scenario: Extended deliverables with Finding and Release
      Given a feature with background deliverables:
        | Deliverable | Status | Tests | Location | Finding  | Release |
        | Fix bug     | complete | 3     | src/fix  | CODE-001 | v0.2.0  |
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
        | Test Yes    | complete | Yes   | src/     |
        | Test No     | complete | No    | src/     |
        | Test Number | complete | 10    | src/     |
        | Test Empty  | complete |       | src/     |
      When extracting deliverables
      Then the test counts are correctly parsed

  # ==========================================================================
  # Source Combination
  # ==========================================================================

  Rule: Code and feature patterns are combined into dual-source patterns

    **Invariant:** A combined pattern is produced only when both a code stub and a feature file exist for the same pattern name; unmatched sources are tracked separately as code-only or feature-only.
    **Rationale:** Dual-source combination ensures documentation reflects both implementation intent (code) and specification (Gherkin) — mismatches signal inconsistency.
    **Verified by:** Matching code and feature are combined, Code-only pattern has no matching feature, Feature-only pattern has no matching code, Phase mismatch creates validation error, Pattern name collision merges sources

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

    **Invariant:** Cross-source validation reports errors for metadata mismatches and warnings for orphaned patterns that are still in roadmap status.
    **Rationale:** Inconsistencies between code stubs and feature files indicate drift — errors catch conflicts while warnings surface missing counterparts that may be intentional.
    **Verified by:** Clean results have no errors, Cross-validation errors are reported, Orphaned roadmap code stubs produce warnings, Feature-only roadmap patterns produce warnings

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

  # ==========================================================================
  # Include Tag Extraction
  # ==========================================================================

  Rule: Include tags are extracted from Gherkin feature tags

    **Invariant:** Include tags are parsed as comma-separated values; absence of the tag means the pattern has no includes.
    **Rationale:** Include tags control which patterns appear in scoped diagrams — incorrect parsing drops patterns from diagrams or includes unrelated ones.
    **Verified by:** Single include tag is extracted, CSV include tag produces multiple values, Feature without include tag has no include field

    @happy-path
    Scenario: Single include tag is extracted
      Given a feature with process tags:
        | tag                                           |
        | architect                      |
        | pattern:IncludeTest            |
        | status:roadmap                 |
        | phase:01                       |
        | include:reference-sample       |
      When extracting Gherkin patterns
      Then the extracted pattern has include "reference-sample"

    @happy-path
    Scenario: CSV include tag produces multiple values
      Given a feature with process tags:
        | tag                                               |
        | architect                       |
        | pattern:MultiInclude            |
        | status:roadmap                  |
        | phase:01                        |
        | include:doc-a,doc-b             |
      When extracting Gherkin patterns
      Then the extracted pattern has include "doc-a"
      And the extracted pattern has include "doc-b"

    @edge-case
    Scenario: Feature without include tag has no include field
      Given a feature with process tags:
        | tag                                      |
        | architect                 |
        | pattern:NoInclude         |
        | status:roadmap            |
        | phase:01                  |
      When extracting Gherkin patterns
      Then the extracted pattern has no include field
