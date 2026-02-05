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

### lint-patterns Rules

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

### Anti-Pattern Detection

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

### DoD Validation

- `isDeliverableComplete` - function
- `hasAcceptanceCriteria` - function
- `extractAcceptanceCriteriaScenarios` - function
- `validateDoDForPhase` - function
- `validateDoD` - function
- `formatDoDSummary` - function

### validate-patterns Flags

- `ValidateCLIConfig` - interface
- `ValidationIssue` - interface
- `ValidationSummary` - interface

### Exit Codes

**Context:** All validation commands use consistent exit codes.

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |
