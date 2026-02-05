@libar-docs
@libar-docs-pattern:ValidationReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-validation
@libar-docs-claude-md-section:validation
Feature: Validation Reference - Auto-Generated Documentation

  **Problem:**
  The project has three validation commands (lint-patterns, lint-process, validate-patterns)
  with different purposes and options. Developers need quick access to understand which
  command to run and what each validates. Maintaining this documentation manually leads
  to drift from actual implementation.

  **Solution:**
  Auto-generate the Validation reference documentation from annotated source code.
  The source code defines the validation rules, anti-pattern detectors, and CLI options.
  Documentation becomes a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/VALIDATION-REFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/validation/validation-reference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Command Decision Tree | THIS DECISION (Rule: Command Decision Tree) | Rule block content |
| Command Summary | THIS DECISION (Rule: Command Summary) | Rule block table |
| lint-patterns Rules | THIS DECISION (Rule: lint-patterns Rules) | Rule block table |
| lint-patterns Rules | src/lint/rules.ts | @extract-shapes tag |
| Anti-Pattern Detection | THIS DECISION (Rule: Anti-Pattern Detection) | Rule block table |
| Anti-Pattern Detection | src/validation/anti-patterns.ts | @extract-shapes tag |
| Anti-Pattern Types | src/validation/types.ts | @extract-shapes tag |
| DoD Validation | THIS DECISION (Rule: DoD Validation) | Rule block table |
| DoD Validation | src/validation/dod-validator.ts | @extract-shapes tag |
| validate-patterns Flags | THIS DECISION (Rule: validate-patterns Flags) | Rule block table |
| CI/CD Integration | THIS DECISION (Rule: CI/CD Integration) | Rule block content |
| Exit Codes | THIS DECISION (Rule: Exit Codes) | Rule block table |
| Programmatic API | THIS DECISION (Rule: Programmatic API) | Fenced code block |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Validation reference feature file | Complete | specs/docs/validation-reference.feature |
      | Source annotations for lint/rules.ts | Complete | src/lint/rules.ts |
      | Source annotations for validation types | Complete | src/validation/types.ts |
      | Source annotations for anti-patterns | Complete | src/validation/anti-patterns.ts |
      | Source annotations for dod-validator | Complete | src/validation/dod-validator.ts |
      | Generated detailed docs | Pending | docs-generated/docs/VALIDATION-REFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/validation/validation-reference.md |

  Rule: Command Decision Tree

    **Context:** Developers need to quickly determine which validation command to run.

    **Decision Tree:**

    """text
    Need to check annotation quality?
    --> Yes: lint-patterns

    Need FSM workflow validation?
    --> Yes: lint-process

    Need cross-source or DoD validation?
    --> Yes: validate-patterns

    Running pre-commit hook?
    --> lint-process --staged (default)
    """

  Rule: Command Summary

    **Context:** Three validation commands serve different purposes.

    **Commands:**

| Command | Purpose | When to Use |
| --- | --- | --- |
| lint-patterns | Annotation quality | Ensure patterns have required tags |
| lint-process | FSM workflow enforcement | Pre-commit hooks, CI pipelines |
| validate-patterns | Cross-source + DoD + anti-pattern | Release validation, comprehensive |

  Rule: lint-patterns Rules

    **Context:** lint-patterns validates annotation quality in TypeScript files.

    **Usage:**

    """bash
    npx lint-patterns -i "src/**/*.ts"
    npx lint-patterns -i "src/**/*.ts" --strict
    """

    **Validation Rules:**

| Rule | Severity | What It Checks |
| --- | --- | --- |
| missing-pattern-name | error | Must have pattern tag |
| invalid-status | error | Status must be valid FSM value |
| tautological-description | error | Description cannot just repeat name |
| pattern-conflict-in-implements | error | Pattern cannot implement itself |
| missing-relationship-target | warning | Relationship targets must exist |
| missing-status | warning | Should have status tag |
| missing-when-to-use | warning | Should have When to Use section |
| missing-relationships | info | Consider adding uses/used-by |

  Rule: Anti-Pattern Detection

    **Context:** Enforces dual-source architecture ownership between TypeScript and Gherkin files.

    **Anti-Patterns Detected:**

| ID | Severity | Description |
| --- | --- | --- |
| process-in-code | error | Process metadata in code (should be features-only) |
| tag-duplication | error | Dependencies in features (should be code-only) |
| magic-comments | warning | Generator hints in features |
| scenario-bloat | warning | Too many scenarios per feature (threshold: 20) |
| mega-feature | warning | Feature file too large (threshold: 500 lines) |

    **Tag Location Constraints:**

| Tag Type | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript code | Feature files |
| depends-on | Feature files | TypeScript code |
| quarter | Feature files | TypeScript code |
| team | Feature files | TypeScript code |

  Rule: DoD Validation

    **Context:** Definition of Done validation ensures completed patterns meet quality criteria.

    **Criteria for completed status:**

| Criterion | What It Checks |
| --- | --- |
| All deliverables complete | Status must be: complete, done, finished, yes, or checkmarks |
| Acceptance criteria present | At least one scenario with @acceptance-criteria tag |

    **Completion Patterns Recognized:**

    """text
    Text patterns: complete, completed, done, finished, yes
    Symbol patterns: check mark, heavy check mark, white check mark, ballot box with check
    """

  Rule: validate-patterns Flags

    **Context:** validate-patterns combines multiple validation checks.

    **Usage:**

    """bash
    npx validate-patterns \
      -i "src/**/*.ts" \
      -F "specs/**/*.feature" \
      --dod \
      --anti-patterns
    """

    **Available Flags:**

| Flag | What It Validates |
| --- | --- |
| --dod | Completed patterns have all deliverables done |
| --anti-patterns | Dual-source ownership rules not violated |
| --cross-source | Feature/TypeScript metadata consistency |

  Rule: CI/CD Integration

    **Context:** Validation commands integrate into CI/CD pipelines.

    **Recommended package.json Scripts:**

    """json
    {
      "scripts": {
        "lint:patterns": "lint-patterns -i 'src/**/*.ts'",
        "lint:process": "lint-process --staged",
        "lint:process:ci": "lint-process --all --strict",
        "validate:all": "validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns"
      }
    }
    """

    **Pre-commit Hook:**

    """bash
    npx lint-process --staged
    """

    **GitHub Actions:**

    """yaml
    - name: Lint annotations
      run: npx lint-patterns -i "src/**/*.ts" --strict

    - name: Validate patterns
      run: npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns
    """

  Rule: Exit Codes

    **Context:** All validation commands use consistent exit codes.

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |

  Rule: Programmatic API

    **Context:** All validation tools expose programmatic APIs for custom integrations.

    **Import Paths:**

    """typescript
    // Pattern linting
    import { lintFiles, hasFailures } from '@libar-dev/delivery-process/lint';

    // Process guard
    import { deriveProcessState, validateChanges } from '@libar-dev/delivery-process/lint';

    // Anti-patterns and DoD
    import { detectAntiPatterns, validateDoD } from '@libar-dev/delivery-process/validation';
    """

    **Anti-Pattern Detection Example:**

    """typescript
    import { detectAntiPatterns, formatAntiPatternReport } from '@libar-dev/delivery-process/validation';
    import { scanTypeScript, scanGherkin } from '@libar-dev/delivery-process/scanner';

    const tsFiles = await scanTypeScript(['src/**/*.ts']);
    const features = await scanGherkin(['specs/**/*.feature']);

    const violations = detectAntiPatterns(tsFiles, features, {
      thresholds: {
        scenarioBloatThreshold: 15,
        megaFeatureLineThreshold: 400,
      },
    });

    if (violations.length > 0) {
      console.log(formatAntiPatternReport(violations));
      process.exit(1);
    }
    """

    **DoD Validation Example:**

    """typescript
    import { validateDoD, formatDoDSummary } from '@libar-dev/delivery-process/validation';
    import { scanGherkin } from '@libar-dev/delivery-process/scanner';

    const features = await scanGherkin(['specs/**/*.feature']);
    const summary = validateDoD(features);

    console.log(formatDoDSummary(summary));

    if (summary.failedPhases > 0) {
      process.exit(1);
    }
    """

  @acceptance-criteria
  Scenario: Reference generates Validation documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all validation rules
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And command decision tree is included in output
