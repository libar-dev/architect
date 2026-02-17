# CliBehaviorTesting

**Purpose:** Detailed patterns for CliBehaviorTesting

---

## Summary

**Progress:** [░░░░░░░░░░░░░░░░░░░░] 0/1 (0%)

| Status | Count |
| --- | --- |
| ✅ Completed | 0 |
| 🚧 Active | 0 |
| 📋 Planned | 1 |
| **Total** | 1 |

---

## 📋 Planned Patterns

### 📋 Cli Behavior Testing

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |
| Business Value | ensure cli commands work correctly with all argument combinations |

**Problem:**
  All 5 CLI commands (generate-docs, lint-patterns, lint-process, validate-patterns,
  generate-tag-taxonomy) have zero behavior specs. These are user-facing interfaces
  that need comprehensive testing for argument parsing, error handling, and output formats.

  **Solution:**
  Create behavior specs for each CLI command covering:
  - Argument parsing (all flags and combinations)
  - Error handling (missing/invalid input)
  - Output format validation (JSON, pretty)
  - Exit code behavior

  **Business Value:**
  | Benefit | How |
  | Reliability | CLI commands work correctly in all scenarios |
  | User Experience | Clear error messages for invalid usage |
  | CI/CD Integration | Predictable exit codes for automation |

#### Dependencies

- Depends on: ADR002GherkinOnlyTesting

#### Acceptance Criteria

**Generate specific document type**

- Given TypeScript files with @libar-docs annotations
- And feature files with pattern metadata
- When running "generate-docs -g patterns -o docs"
- Then PATTERNS.md is created in docs directory
- And exit code is 0

**Generate multiple document types**

- Given source files with pattern metadata
- When running "generate-docs -g patterns,roadmap,remaining -o docs"
- Then PATTERNS.md, ROADMAP.md, and REMAINING-WORK.md are created
- And exit code is 0

**Unknown generator name fails with helpful error**

- Given source files with pattern metadata
- When running "generate-docs -g invalid-generator -o docs"
- Then exit code is 1
- And error message contains "Unknown generator: invalid-generator"
- And available generators are listed

**Missing required input fails with usage hint**

- When running "generate-docs -g patterns"
- Then exit code is 1
- And error message contains "missing required"

**Lint passes for valid annotations**

- Given TypeScript files with complete @libar-docs annotations
- When running "lint-patterns -i 'src/**/*.ts'"
- Then exit code is 0
- And output indicates "No violations found"

**Lint fails for missing pattern name**

- Given TypeScript file with @libar-docs but no @libar-docs-pattern
- When running "lint-patterns -i 'src/**/*.ts'"
- Then exit code is 1
- And output contains "missingPatternName" violation

**JSON output format**

- Given TypeScript files with lint violations
- When running "lint-patterns -i 'src/**/*.ts' --format json"
- Then output is valid JSON
- And JSON includes violations array with severity, message, file, line

**Strict mode treats warnings as errors**

- Given TypeScript files with warning-level violations only
- When running "lint-patterns -i 'src/**/*.ts' --strict"
- Then exit code is 1

**DoD validation for specific phase**

- Given feature files with phase 15 deliverables
- When running "validate-patterns --dod --phase 15"
- Then output shows DoD completion for phase 15
- And deliverable status is summarized

**Anti-pattern detection**

- Given feature files with scenario bloat (>15 scenarios)
- When running "validate-patterns --anti-patterns"
- Then output includes "scenarioBloat" violation
- And affected feature files are listed

**Combined validation modes**

- When running "validate-patterns --dod --anti-patterns"
- Then both DoD and anti-pattern results are shown
- And exit code reflects combined status

**File not found error includes path**

- When running "generate-docs -i 'nonexistent/**/*.ts' -g patterns -o docs"
- Then error message contains file path
- And exit code is 1

**Parse error includes line number**

- Given TypeScript file with invalid JSDoc syntax
- When running "lint-patterns -i 'src/**/*.ts'"
- Then error includes file path and line number

#### Business Rules

**generate-docs handles all argument combinations correctly**

**Invariant:** Invalid arguments produce clear error messages with usage hints.
    Valid arguments produce expected output files.

    **API:** See `src/cli/generate-docs.ts`

    **Verified by:** Argument parsing, Generator selection, Output file creation

_Verified by: Generate specific document type, Generate multiple document types, Unknown generator name fails with helpful error, Missing required input fails with usage hint_

**lint-patterns validates annotation quality with configurable strictness**

**Invariant:** Lint violations are reported with file, line, and severity.
    Exit codes reflect violation presence based on strictness setting.

    **API:** See `src/cli/lint-patterns.ts`

    **Verified by:** Lint execution, Strict mode, Output formats

_Verified by: Lint passes for valid annotations, Lint fails for missing pattern name, JSON output format, Strict mode treats warnings as errors_

**validate-patterns performs cross-source validation with DoD checks**

**Invariant:** DoD and anti-pattern violations are reported per phase.
    Exit codes reflect validation state.

    **API:** See `src/cli/validate-patterns.ts`

    **Verified by:** DoD validation, Anti-pattern detection, Phase filtering

_Verified by: DoD validation for specific phase, Anti-pattern detection, Combined validation modes_

**All CLIs handle errors consistently with DocError pattern**

**Invariant:** Errors include type, file, line (when applicable), and reason.
    Unknown errors are caught and formatted safely.

    **Verified by:** Error formatting, Unknown error handling

_Verified by: File not found error includes path, Parse error includes line number_

---

[← Back to Roadmap](../ROADMAP.md)
