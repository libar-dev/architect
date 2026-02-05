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
| DoD Validation | src/validation/dod-validator.ts | extract-shapes tag |
| DoD Types | src/validation/types.ts | extract-shapes tag |
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

| Question | Answer | Command |
| --- | --- | --- |
| Need annotation quality check? | Yes | lint-patterns |
| Need FSM workflow validation? | Yes | lint-process |
| Need cross-source or DoD validation? | Yes | validate-patterns |
| Running pre-commit hook? | Default | lint-process --staged |

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

    **CLI Commands:**

| Command | Purpose |
| --- | --- |
| `npx lint-patterns -i "src/**/*.ts"` | Basic usage |
| `npx lint-patterns -i "src/**/*.ts" --strict` | Strict mode (CI) |

    **Validation Rules:**

    Validation rules are extracted from `src/lint/rules.ts` via `@extract-shapes`.

| Rule | Severity | What It Checks |
| --- | --- | --- |
| missing-pattern-name | error | Must have explicit pattern name tag |
| invalid-status | error | Status must be valid FSM value |
| tautological-description | error | Description cannot just repeat name |
| pattern-conflict-in-implements | error | Pattern cannot implement itself (circular reference) |
| missing-relationship-target | warning | Relationship targets must reference existing patterns |
| missing-status | warning | Should have status tag |
| missing-when-to-use | warning | Should have "When to Use" section |
| missing-relationships | info | Consider adding uses/used-by tags |

    **Rule Error Examples:**

| Rule | Example Error | Fix |
| --- | --- | --- |
| missing-pattern-name | Pattern missing explicit name | Add @libar-docs-pattern YourName |
| invalid-status | Invalid status 'draft' | Use: roadmap, active, completed, deferred |
| tautological-description | Description repeats pattern name | Provide meaningful context |
| missing-status | No @libar-docs-status found | Add: @libar-docs-status completed |
| missing-when-to-use | No "When to Use" section found | Add ### When to Use in description |

  Rule: Anti-Pattern Detection

    **Context:** Enforces dual-source architecture ownership between TypeScript and Gherkin files.

    Anti-pattern definitions are extracted from `src/validation/anti-patterns.ts` via `@extract-shapes`.

    **Anti-Patterns Detected:**

| ID | Severity | Description | Fix |
| --- | --- | --- | --- |
| tag-duplication | error | Dependencies in features (should be code-only) | Move uses tags to TypeScript code |
| process-in-code | error | Process metadata in code (should be features-only) | Move quarter/team tags to feature files |
| magic-comments | warning | Generator hints in features (e.g., # GENERATOR:) | Use standard Gherkin tags instead |
| scenario-bloat | warning | Too many scenarios per feature (threshold: 20) | Split into multiple feature files |
| mega-feature | warning | Feature file too large (threshold: 500 lines) | Split by component or domain |

    **Tag Location Constraints:**

| Tag | Correct Location | Wrong Location | Reason |
| --- | --- | --- | --- |
| @libar-docs-uses | TypeScript code | Feature files | TS owns runtime dependencies |
| @libar-docs-depends-on | Feature files | TypeScript code | Gherkin owns planning dependencies |
| @libar-docs-quarter | Feature files | TypeScript code | Gherkin owns timeline metadata |
| @libar-docs-team | Feature files | TypeScript code | Gherkin owns ownership metadata |

    **Default Thresholds:**

| Threshold | Default Value | Description |
| --- | --- | --- |
| scenarioBloatThreshold | 20 | Max scenarios per feature file |
| megaFeatureLineThreshold | 500 | Max lines per feature file |
| magicCommentThreshold | 5 | Max magic comments before warning |

  Rule: DoD Validation

    **Context:** Definition of Done validation ensures completed patterns meet quality criteria.

    DoD criteria and completion patterns are extracted from `src/validation/dod-validator.ts`
    and `src/validation/types.ts` via `@extract-shapes`.

    **DoD Criteria (for completed status):**

| Criterion | Requirement | Failure Message |
| --- | --- | --- |
| Deliverables Complete | All deliverables must be marked done | X/Y deliverables incomplete |
| Acceptance Criteria | At least one @acceptance-criteria scenario | No @acceptance-criteria scenarios found |

    **Recognized Completion Patterns:**

| Type | Patterns |
| --- | --- |
| Text (case-insensitive) | complete, completed, done, finished, yes |
| Symbols | checkmark, heavy checkmark, check box with check, white check |

    **Recognized Pending Patterns:**

| Type | Patterns |
| --- | --- |
| Text (case-insensitive) | pending, todo, planned, not started, no |

    **DoD Validation Output Example:**

| Phase | Pattern | Deliverables | AC Scenarios | Result |
| --- | --- | --- | --- | --- |
| Phase 14 | MyPattern | 5/5 complete | 3 found | PASS |
| Phase 15 | OtherPattern | 2/4 complete | 0 found | FAIL |

  Rule: validate-patterns Flags

    **Context:** validate-patterns combines multiple validation checks.

    CLI configuration interface (`ValidateCLIConfig`) with all flags and options
    is extracted from `src/cli/validate-patterns.ts` via `@extract-shapes`.

    **CLI Options:**

| Flag | Description |
| --- | --- |
| `-i, --include` | TypeScript file glob patterns |
| `-F, --features` | Feature file glob patterns |
| `--dod` | Enable DoD validation for completed patterns |
| `--anti-patterns` | Enable anti-pattern detection |
| `--cross-source` | Enable cross-source consistency validation |

    **Example Commands:**

| Command | Purpose |
| --- | --- |
| `npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod` | DoD only |
| `npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --anti-patterns` | Anti-patterns only |
| `npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns` | Full validation |

  Rule: CI/CD Integration

    **Context:** Validation commands integrate into CI/CD pipelines.

    **Recommended npm Scripts:**

| Script Name | Command | Purpose |
| --- | --- | --- |
| lint:patterns | lint-patterns -i 'src/**/*.ts' | Annotation quality |
| lint:process | lint-process --staged | Pre-commit validation |
| lint:process:ci | lint-process --all --strict | CI pipeline |
| validate:all | validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns | Full validation |

    **Pre-commit Hook Setup:**

    Add to `.husky/pre-commit`: `npx lint-process --staged`

    **GitHub Actions Integration:**

| Step Name | Command |
| --- | --- |
| Lint annotations | npx lint-patterns -i "src/**/*.ts" --strict |
| Validate patterns | npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns |

  Rule: Exit Codes

    **Context:** All validation commands use consistent exit codes.

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |

  Rule: Programmatic API

    **Context:** All validation tools expose programmatic APIs for custom integrations.

    **API Functions:**

| Category | Function | Description |
| --- | --- | --- |
| Linting | lintFiles(files, rules) | Run lint rules on files |
| Linting | hasFailures(result) | Check for lint failures |
| Anti-Patterns | detectAntiPatterns(ts, features) | Run all anti-pattern detectors |
| Anti-Patterns | detectProcessInCode(files) | Find process tags in TypeScript |
| Anti-Patterns | detectScenarioBloat(features) | Find feature files with too many scenarios |
| Anti-Patterns | detectMegaFeature(features) | Find feature files that are too large |
| Anti-Patterns | formatAntiPatternReport(violations) | Format violations for console output |
| DoD | validateDoD(features) | Validate DoD for all completed phases |
| DoD | validateDoDForPhase(name, phase, feature) | Validate DoD for single phase |
| DoD | isDeliverableComplete(deliverable) | Check if deliverable is done |
| DoD | hasAcceptanceCriteria(feature) | Check for @acceptance-criteria scenarios |
| DoD | formatDoDSummary(summary) | Format DoD results for console output |

    **Import Paths:**

    """typescript
    // Pattern linting
    import { lintFiles, hasFailures } from '@libar-dev/delivery-process/lint';

    // Anti-patterns and DoD
    import { detectAntiPatterns, validateDoD } from '@libar-dev/delivery-process/validation';
    """

    **Anti-Pattern Detection Example:**

    """typescript
    import { detectAntiPatterns } from '@libar-dev/delivery-process/validation';

    const violations = detectAntiPatterns(tsFiles, features, {
      thresholds: { scenarioBloatThreshold: 15 },
    });
    """

    **DoD Validation Example:**

    """typescript
    import { validateDoD, formatDoDSummary } from '@libar-dev/delivery-process/validation';

    const summary = validateDoD(features);
    console.log(formatDoDSummary(summary));
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
