@libar-docs
@libar-docs-pattern:StepDefinitionCompletion
@libar-docs-status:roadmap
@libar-docs-phase:103
@libar-docs-effort:2d
@libar-docs-product-area:Process
@libar-docs-include:process-workflow
@libar-docs-depends-on:ADR002GherkinOnlyTesting
@libar-docs-business-value:make-existing-behavior-specs-executable
@libar-docs-priority:critical
@libar-docs-executable-specs:tests/steps/behavior
Feature: Step Definition Completion

  **Problem:**
  7 feature files in tests/features/behavior/ have complete Gherkin specs
  but NO step definitions. These specs describe expected behavior but are
  NOT executable - they're documentation without tests.

  **Solution:**
  Create step definitions for each existing feature file:
  - pr-changes-generation.feature (12 scenarios)
  - remaining-work-enhancement.feature (7 scenarios)
  - remaining-work-totals.feature (6 scenarios)
  - session-handoffs.feature (9 scenarios)
  - description-headers.feature (6 scenarios)
  - description-quality-foundation.feature (10 scenarios)
  - implementation-links.feature (5 scenarios)

  Additionally, 3 feature files in other directories need step definitions:
  - tests/features/generators/table-extraction.feature
  - tests/features/scanner/docstring-mediatype.feature
  - tests/features/generators/business-rules-codec.feature

  **Business Value:**
  | Benefit | How |
  | Executable Tests | Specs become regression tests |
  | CI Integration | Tests run on every commit |
  | Refactoring Safety | Changes verified against specs |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Test Type | Location |
      | pr-changes-generation.steps.ts | pending | Yes | unit | tests/steps/behavior/pr-changes-generation.steps.ts |
      | remaining-work-enhancement.steps.ts | pending | Yes | unit | tests/steps/behavior/remaining-work-enhancement.steps.ts |
      | remaining-work-totals.steps.ts | pending | Yes | unit | tests/steps/behavior/remaining-work-totals.steps.ts |
      | session-handoffs.steps.ts | pending | Yes | unit | tests/steps/behavior/session-handoffs.steps.ts |
      | description-headers.steps.ts | pending | Yes | unit | tests/steps/behavior/description-headers.steps.ts |
      | description-quality-foundation.steps.ts | pending | Yes | unit | tests/steps/behavior/description-quality-foundation.steps.ts |
      | implementation-links.steps.ts | pending | Yes | unit | tests/steps/behavior/implementation-links.steps.ts |
      | table-extraction.steps.ts | pending | Yes | unit | tests/steps/generators/table-extraction.steps.ts |
      | docstring-mediatype.steps.ts | pending | Yes | unit | tests/steps/scanner/docstring-mediatype.steps.ts |

  # ============================================================================
  # RULE 1: Generator Step Definitions (High Priority)
  # ============================================================================

  Rule: Generator-related specs need step definitions for output validation

    **Invariant:** Step definitions test actual codec output against expected structure.
    Factory functions from tests/fixtures/ should be used for test data.

    **Existing Specs:**
    - `tests/features/behavior/pr-changes-generation.feature` - 12 scenarios
    - `tests/features/behavior/remaining-work-enhancement.feature` - 7 scenarios
    - `tests/features/behavior/remaining-work-totals.feature` - 6 scenarios
    - `tests/features/behavior/session-handoffs.feature` - 9 scenarios

    **Implementation Notes:**
    - Use createExtractedPattern() from tests/fixtures/pattern-factories.ts
    - Use createMasterDataset() from tests/fixtures/dataset-factories.ts
    - Import codecs from src/renderable/codecs/
    - Assert on RenderableDocument structure, not markdown output

    **Verified by:** PR changes step defs, Remaining work step defs, Session handoffs step defs

    @acceptance-criteria @happy-path
    Scenario: pr-changes-generation.steps.ts implements all 12 scenarios
      Given tests/features/behavior/pr-changes-generation.feature
      When step definitions are created
      Then all 12 scenarios should pass
      And PrChangesCodec transformations are tested

    @acceptance-criteria @happy-path
    Scenario: remaining-work-enhancement.steps.ts implements priority sorting
      Given tests/features/behavior/remaining-work-enhancement.feature
      When step definitions are created
      Then priority-based sorting scenarios pass
      And quarter-based grouping scenarios pass

    @acceptance-criteria @happy-path
    Scenario: session-handoffs.steps.ts implements handoff context
      Given tests/features/behavior/session-handoffs.feature
      When step definitions are created
      Then SESSION-CONTEXT.md handoff section scenarios pass
      And discovery tag scenarios pass

  # ============================================================================
  # RULE 2: Renderable Helper Step Definitions (Medium Priority)
  # ============================================================================

  Rule: Renderable helper specs need step definitions for utility functions

    **Invariant:** Helper functions are pure and easy to unit test.
    Step definitions should test edge cases identified in specs.

    **Existing Specs:**
    - `tests/features/behavior/description-headers.feature` - 6 scenarios
    - `tests/features/behavior/description-quality-foundation.feature` - 10 scenarios
    - `tests/features/behavior/implementation-links.feature` - 5 scenarios

    **Implementation Notes:**
    - Import helpers from src/renderable/utils.ts or src/generators/sections/helpers.ts
    - Use simple string inputs/outputs
    - Test stripLeadingHeaders(), camelCaseToTitleCase(), normalizeImplPath()

    **Verified by:** Description header step defs, Quality foundation step defs, Implementation links step defs

    @acceptance-criteria @happy-path
    Scenario: description-headers.steps.ts tests header stripping
      Given tests/features/behavior/description-headers.feature
      When step definitions are created
      Then stripLeadingHeaders() scenarios pass
      And edge cases (empty, whitespace-only) are covered

    @acceptance-criteria @happy-path
    Scenario: description-quality-foundation.steps.ts tests title case conversion
      Given tests/features/behavior/description-quality-foundation.feature
      When step definitions are created
      Then camelCaseToTitleCase() scenarios pass
      And behavior file verification scenarios pass

  # ============================================================================
  # RULE 3: Scanner/Generator Step Definitions (Lower Priority)
  # ============================================================================

  Rule: Remaining specs in other directories need step definitions

    **Existing Specs:**
    - `tests/features/generators/table-extraction.feature`
    - `tests/features/scanner/docstring-mediatype.feature`

    **Verified by:** Table extraction step defs, DocString mediatype step defs

    @acceptance-criteria @happy-path
    Scenario: table-extraction.steps.ts tests stripMarkdownTables
      Given tests/features/generators/table-extraction.feature
      When step definitions are created
      Then table extraction without duplication scenarios pass

    @acceptance-criteria @happy-path
    Scenario: docstring-mediatype.steps.ts tests mediaType preservation
      Given tests/features/scanner/docstring-mediatype.feature
      When step definitions are created
      Then DocString mediaType is preserved through parsing

  # ============================================================================
  # IMPLEMENTATION GUIDANCE
  # ============================================================================

  Rule: Step definition implementation follows project patterns

    **Pattern:** All step definitions should follow the established patterns in
    existing .steps.ts files for consistency.

    **Template:**
    ```typescript
    import { Given, When, Then, Before } from '@cucumber/cucumber';
    import { expect } from 'vitest';
    import { createExtractedPattern } from '../../fixtures/pattern-factories.js';

    interface TestState {
      input: unknown;
      result: unknown;
      error: Error | null;
    }

    let state: TestState;

    Before(() => {
      state = { input: null, result: null, error: null };
    });

    Given('...', function (arg: string) {
      // Setup test state
    });

    When('...', function () {
      // Execute action under test
    });

    Then('...', function (expected: string) {
      expect(state.result).toBe(expected);
    });
    ```

    **File Locations:**
    - Behavior steps: tests/steps/behavior/{feature-name}.steps.ts
    - Generator steps: tests/steps/generators/{feature-name}.steps.ts
    - Scanner steps: tests/steps/scanner/{feature-name}.steps.ts

