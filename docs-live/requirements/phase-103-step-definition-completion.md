# 📋 Step Definition Completion

**Purpose:** Detailed requirements for the Step Definition Completion feature

---

## Overview

| Property       | Value                                   |
| -------------- | --------------------------------------- |
| Status         | planned                                 |
| Product Area   | Process                                 |
| Business Value | make existing behavior specs executable |
| Phase          | 103                                     |

## Description

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

## Acceptance Criteria

**pr-changes-generation.steps.ts implements all 12 scenarios**

- Given tests/features/behavior/pr-changes-generation.feature
- When step definitions are created
- Then all 12 scenarios should pass
- And PrChangesCodec transformations are tested

**remaining-work-enhancement.steps.ts implements priority sorting**

- Given tests/features/behavior/remaining-work-enhancement.feature
- When step definitions are created
- Then priority-based sorting scenarios pass
- And quarter-based grouping scenarios pass

**session-handoffs.steps.ts implements handoff context**

- Given tests/features/behavior/session-handoffs.feature
- When step definitions are created
- Then SESSION-CONTEXT.md handoff section scenarios pass
- And discovery tag scenarios pass

**description-headers.steps.ts tests header stripping**

- Given tests/features/behavior/description-headers.feature
- When step definitions are created
- Then stripLeadingHeaders() scenarios pass
- And edge cases (empty, whitespace-only) are covered

**description-quality-foundation.steps.ts tests title case conversion**

- Given tests/features/behavior/description-quality-foundation.feature
- When step definitions are created
- Then camelCaseToTitleCase() scenarios pass
- And behavior file verification scenarios pass

**table-extraction.steps.ts tests stripMarkdownTables**

- Given tests/features/generators/table-extraction.feature
- When step definitions are created
- Then table extraction without duplication scenarios pass

**docstring-mediatype.steps.ts tests mediaType preservation**

- Given tests/features/scanner/docstring-mediatype.feature
- When step definitions are created
- Then DocString mediaType is preserved through parsing

## Business Rules

**Generator-related specs need step definitions for output validation**

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

_Verified by: pr-changes-generation.steps.ts implements all 12 scenarios, remaining-work-enhancement.steps.ts implements priority sorting, session-handoffs.steps.ts implements handoff context_

**Renderable helper specs need step definitions for utility functions**

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

_Verified by: description-headers.steps.ts tests header stripping, description-quality-foundation.steps.ts tests title case conversion_

**Remaining specs in other directories need step definitions**

**Existing Specs:** - `tests/features/generators/table-extraction.feature` - `tests/features/scanner/docstring-mediatype.feature`

    **Verified by:** Table extraction step defs, DocString mediatype step defs

_Verified by: table-extraction.steps.ts tests stripMarkdownTables, docstring-mediatype.steps.ts tests mediaType preservation_

**Step definition implementation follows project patterns**

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

## Deliverables

- pr-changes-generation.steps.ts (pending)
- remaining-work-enhancement.steps.ts (pending)
- remaining-work-totals.steps.ts (pending)
- session-handoffs.steps.ts (pending)
- description-headers.steps.ts (pending)
- description-quality-foundation.steps.ts (pending)
- implementation-links.steps.ts (pending)
- table-extraction.steps.ts (pending)
- docstring-mediatype.steps.ts (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
