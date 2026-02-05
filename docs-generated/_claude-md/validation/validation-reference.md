# ValidationReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Command Summary

**Context:** Three validation commands serve different purposes.

    **Commands:**

| Command | Purpose | When to Use |
| --- | --- | --- |
| lint-patterns | Annotation quality | Ensure patterns have required tags |
| lint-process | FSM workflow enforcement | Pre-commit hooks, CI pipelines |
| validate-patterns | Cross-source + DoD + anti-pattern | Release validation, comprehensive |

### lint-patterns Rules (from this decision (rule: lint-patterns rules))

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

### lint-patterns Rules (from rules)

- `LintRule` - interface
- `LintContext` - interface
- `defaultRules` - const
- `severityOrder` - const
- `filterRulesBySeverity` - function
- `missingPatternName` - const
- `missingStatus` - const
- `invalidStatus` - const
- `missingWhenToUse` - const
- `tautologicalDescription` - const
- `missingRelationships` - const
- `patternConflictInImplements` - const
- `missingRelationshipTarget` - const

### Anti-Pattern Detection (from this decision (rule: anti-pattern detection))

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

### Anti-Pattern Detection (from anti-patterns)

- `AntiPatternDetectionOptions` - interface
- `detectAntiPatterns` - function
- `detectProcessInCode` - function
- `detectMagicComments` - function
- `detectScenarioBloat` - function
- `detectMegaFeature` - function
- `formatAntiPatternReport` - function
- `toValidationIssues` - function

### Anti-Pattern Types

- `AntiPatternId` - type
- `AntiPatternViolation` - interface
- `AntiPatternThresholds` - type
- `AntiPatternThresholdsSchema` - const
- `DEFAULT_THRESHOLDS` - const
- `DoDValidationResult` - interface
- `DoDValidationSummary` - interface
- `COMPLETION_PATTERNS` - const
- `IN_PROGRESS_PATTERNS` - const
- `PENDING_PATTERNS` - const
- `WithTagRegistry` - interface

### DoD Validation (from this decision (rule: dod validation))

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

### DoD Validation (from dod-validator)

- `isDeliverableComplete` - function
- `hasAcceptanceCriteria` - function
- `extractAcceptanceCriteriaScenarios` - function
- `validateDoDForPhase` - function
- `validateDoD` - function
- `formatDoDSummary` - function

### validate-patterns Flags

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

### Exit Codes

**Context:** All validation commands use consistent exit codes.

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |
