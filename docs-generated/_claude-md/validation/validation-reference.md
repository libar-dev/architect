# ValidationReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Command Decision Tree

**Context:** Developers need to quickly determine which validation command to run.

    **Decision Tree:**

| Question | Answer | Command |
| --- | --- | --- |
| Need annotation quality check? | Yes | lint-patterns |
| Need FSM workflow validation? | Yes | lint-process |
| Need cross-source or DoD validation? | Yes | validate-patterns |
| Running pre-commit hook? | Default | lint-process --staged |

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

### DoD Validation

- `isDeliverableComplete` - function
- `hasAcceptanceCriteria` - function
- `extractAcceptanceCriteriaScenarios` - function
- `validateDoDForPhase` - function
- `validateDoD` - function
- `formatDoDSummary` - function

### DoD Types

- `AntiPatternId` - type
- `AntiPatternViolation` - interface
- `AntiPatternThresholds` - type
- `AntiPatternThresholdsSchema` - const
- `DEFAULT_THRESHOLDS` - const
- `DoDValidationResult` - interface
- `DoDValidationSummary` - interface
- `getPhaseStatusEmoji` - function
- `WithTagRegistry` - interface

### validate-patterns Flags

- `ValidateCLIConfig` - interface
- `ValidationIssue` - interface
- `ValidationSummary` - interface

### CI/CD Integration

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

### Exit Codes

**Context:** All validation commands use consistent exit codes.

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |

### Programmatic API

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

### Related Documentation

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| PROCESS-GUARD-REFERENCE.md | Sibling | FSM workflow enforcement, pre-commit hooks |
| CONFIGURATION-REFERENCE.md | Reference | Tag prefixes, presets |
| TAXONOMY-REFERENCE.md | Reference | Valid status values, tag formats |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation reference |
