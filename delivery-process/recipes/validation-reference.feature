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
| lint-patterns Rules | src/lint/rules.ts | extract-shapes tag |
| Anti-Pattern Detection | src/validation/anti-patterns.ts | extract-shapes tag |
| DoD Validation | src/validation/dod-validator.ts, src/validation/types.ts | extract-shapes tag |
| validate-patterns Flags | src/cli/validate-patterns.ts | extract-shapes tag |
| CI/CD Integration | THIS DECISION (Rule: CI/CD Integration) | Rule block content |
| Exit Codes | THIS DECISION (Rule: Exit Codes) | Rule block table |
| Programmatic API | THIS DECISION (Rule: Programmatic API) | Fenced code block |
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Validation reference feature file | Complete | delivery-process/recipes/validation-reference.feature |
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

    Validation rules are extracted from `src/lint/rules.ts` via `@extract-shapes`.

  Rule: Anti-Pattern Detection

    **Context:** Enforces dual-source architecture ownership between TypeScript and Gherkin files.

    Anti-pattern definitions are extracted from `src/validation/anti-patterns.ts` via `@extract-shapes`.

    **Tag Location Constraints:**

    - `uses` tags belong in TypeScript code (runtime dependencies)
    - `depends-on`, `quarter`, `team` tags belong in Feature files (planning metadata)

  Rule: DoD Validation

    **Context:** Definition of Done validation ensures completed patterns meet quality criteria.

    DoD criteria and completion patterns are extracted from `src/validation/dod-validator.ts`
    and `src/validation/types.ts` via `@extract-shapes`.

    **Summary:** For `completed` status, all deliverables must be done and at least one
    `@acceptance-criteria` scenario must exist.

  Rule: validate-patterns Flags

    **Context:** validate-patterns combines multiple validation checks.

    CLI configuration interface (`ValidateCLIConfig`) with all flags and options
    is extracted from `src/cli/validate-patterns.ts` via `@extract-shapes`.

    **Usage:**

    """bash
    npx validate-patterns \
      -i "src/**/*.ts" \
      -F "specs/**/*.feature" \
      --dod \
      --anti-patterns
    """

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

  Rule: Related Documentation

    **Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| PROCESS-GUARD-REFERENCE.md | Sibling | FSM workflow enforcement, pre-commit hooks |
| CONFIGURATION-REFERENCE.md | Reference | Tag prefixes, presets |
| TAXONOMY-REFERENCE.md | Reference | Valid status values, tag formats |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation reference |

  @acceptance-criteria
  Scenario: Reference generates Validation documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all validation rules
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And command decision tree is included in output
