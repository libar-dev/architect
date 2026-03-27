@architect
@architect-pattern:TraceabilityGenerator
@architect-status:roadmap
@architect-phase:18
@architect-effort:2d
@architect-product-area:Generation
Feature: Traceability Generator - Rule-to-Scenario Coverage via Codec

  **Problem:**
  The existing TraceabilityCodec in `src/renderable/codecs/reporting.ts` only checks
  timeline-to-behavior file coverage (does a pattern have an associated .feature file?).
  It does NOT cross-reference `**Verified by:**` annotations against actual scenario names.
  This means rules can claim verification by scenarios that do not exist, and orphan
  scenarios (not referenced by any rule) go undetected.

  **Solution:**
  Extend the existing TraceabilityCodec (ADR-005 codec architecture) to add
  Rule-to-Scenario traceability. The `parseBusinessRuleAnnotations()` helper in
  `src/renderable/codecs/helpers.ts` already extracts `verifiedBy` strings from Rule
  descriptions. The remaining work is:
  1. Cross-reference those strings against actual scenario names in MasterDataset
  2. Build a traceability matrix section showing Rule-to-Scenario mappings
  3. Detect coverage gaps (unverified rules, orphan scenarios, dangling references)
  4. Wire the codec output into `docs:all` via config and npm script

  **Architecture:**
  | Component | Location | Status |
  | Annotation parser | `src/renderable/codecs/helpers.ts` parseBusinessRuleAnnotations() | Exists |
  | TraceabilityCodec | `src/renderable/codecs/reporting.ts` | Exists (timeline coverage only) |
  | Codec registry | `src/renderable/generate.ts` | Registered as 'traceability' |
  | Config wiring | `architect.config.ts` | NOT wired |
  | npm script | `package.json` docs:traceability | NOT wired |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Traceability extractor | superseded | src/renderable/codecs/helpers.ts | Yes | unit |
      | CLI integration | complete | src/renderable/generate.ts | Yes | unit |
      | Rule-to-Scenario cross-reference | pending | src/renderable/codecs/reporting.ts | Yes | unit |
      | Coverage gap detection | pending | src/renderable/codecs/reporting.ts | Yes | unit |
      | Config pipeline wiring | pending | architect.config.ts | No | - |
      | docs:traceability npm script | pending | package.json | No | - |

  # ===========================================================================
  # RULE 1: Rule-to-Scenario traceability matrix
  # ===========================================================================

  Rule: Cross-references Verified by annotations against actual scenarios

    **Invariant:** Every `verifiedBy` string extracted from a Rule description is
    matched against scenario names in the MasterDataset. The traceability matrix
    shows each Rule with its verification status: verified (all references resolve),
    partially verified (some resolve), or unverified (none resolve or no annotation).

    **Rationale:** `parseBusinessRuleAnnotations()` already extracts `verifiedBy`
    arrays from Rule descriptions. Without cross-referencing against actual scenario
    names, the traceability report cannot distinguish between claimed and actual
    test coverage. A dangling reference (scenario name that does not exist) is worse
    than no annotation because it creates false confidence.

    **Verified by:** Cross-references verified-by against scenarios, Reports dangling references, Shows verification status per rule

    @acceptance-criteria @happy-path
    Scenario: Cross-references verified-by against scenarios
      Given a Rule with Verified by annotation:
        """gherkin
        Rule: Reservations prevent race conditions
          **Verified by:** Concurrent reservations, Expired reservation cleanup
        """
      And the MasterDataset contains scenarios:
        | Scenario Name |
        | Concurrent reservations |
        | Expired reservation cleanup |
      When the TraceabilityCodec decodes the dataset
      Then the matrix should show the Rule as "verified" with 2 matched scenarios

    @acceptance-criteria @validation
    Scenario: Reports dangling references
      Given a Rule references scenario "Non-existent test" in Verified by
      And no scenario with that name exists in the MasterDataset
      When the TraceabilityCodec decodes the dataset
      Then a "Dangling References" section should list "Non-existent test"
      And the Rule should show status "partially verified" or "unverified"

    @acceptance-criteria @happy-path
    Scenario: Shows verification status per rule
      Given Rules with varying coverage:
        | Rule | Verified by scenarios | Matched |
        | Rule A | Scenario X, Scenario Y | both exist |
        | Rule B | Scenario Z | does not exist |
        | Rule C | (none) | no annotation |
      When the TraceabilityCodec decodes the dataset
      Then the matrix should show:
        | Rule | Status |
        | Rule A | verified |
        | Rule B | unverified |
        | Rule C | unverified |

  # ===========================================================================
  # RULE 2: Coverage gap detection
  # ===========================================================================

  Rule: Detects orphan scenarios and unverified rules

    **Invariant:** Orphan scenarios (acceptance-criteria scenarios not referenced by
    any Rule's Verified by annotation) and unverified rules (Rules without a Verified
    by annotation or with zero matched scenarios) are listed in dedicated sections of
    the traceability output.

    **Rationale:** Coverage gaps indicate either missing traceability annotations or
    actual missing test coverage. Orphan scenarios may be valuable tests that lack
    traceability links, or dead tests that should be removed. Unverified rules are
    business constraints with no demonstrated test coverage.

    **Verified by:** Reports orphan scenarios, Reports unverified rules

    @acceptance-criteria @happy-path
    Scenario: Reports orphan scenarios not linked to any rule
      Given acceptance-criteria scenarios exist:
        | Scenario | Referenced by any Rule |
        | Concurrent reservations | Yes |
        | Random utility test | No |
        | Internal helper scenario | No |
      When the TraceabilityCodec decodes the dataset
      Then output should include an "Orphan Scenarios" section
      And the section should list "Random utility test"
      And the section should list "Internal helper scenario"
      And the section should NOT list "Concurrent reservations"

    @acceptance-criteria @happy-path
    Scenario: Reports unverified rules
      Given Rules exist:
        | Rule | Has Verified by |
        | Reservations prevent race conditions | Yes |
        | Legacy rule without annotation | No |
      When the TraceabilityCodec decodes the dataset
      Then output should include an "Unverified Rules" section
      And the section should list "Legacy rule without annotation"
      And the section should NOT list "Reservations prevent race conditions"

  # ===========================================================================
  # RULE 3: Traceability output wired into production pipeline
  # ===========================================================================

  Rule: Traceability output is wired into the docs pipeline

    **Invariant:** The TraceabilityCodec output is generated as part of `pnpm docs:all`
    via a `docs:traceability` npm script backed by a ReferenceDocConfig entry in
    `architect.config.ts`. The output file lands in `docs-live/TRACEABILITY.md`.

    **Rationale:** The TraceabilityCodec is registered in the CodecRegistry but not
    wired into `architect.config.ts` or `package.json`. Without config wiring,
    the codec is only usable programmatically or via tests. Adding it to the docs
    pipeline makes traceability output a first-class generated artifact alongside
    CHANGELOG.md, OVERVIEW.md, and other reporting codecs.

    **Verified by:** Config entry generates traceability output, npm script runs codec

    @acceptance-criteria @happy-path
    Scenario: Config entry generates traceability output
      Given a ReferenceDocConfig entry for traceability in architect.config.ts
      When running `pnpm docs:traceability`
      Then `docs-live/TRACEABILITY.md` should be generated
      And it should contain a "Coverage Statistics" section
      And it should contain a "Rule-to-Scenario Traceability" section

    @acceptance-criteria @happy-path
    Scenario: npm script runs codec via generate-docs CLI
      Given `package.json` has script `docs:traceability`
      And `docs:all` includes `pnpm docs:traceability`
      When running `pnpm docs:all`
      Then traceability output is generated alongside other docs
