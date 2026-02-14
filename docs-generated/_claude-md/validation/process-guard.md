# Process Guard Reference

**Purpose:** Reference document: Process Guard Reference
**Detail Level:** Compact summary

---

## Context - Why Process Guard Exists

---

## Decision - How Process Guard Works

---

## Consequences - Trade-offs of This Approach

---

## FSM Diagram

---

## Escape Hatches

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI warnings blocking pipeline | Omit --strict flag | lint-process --all (warnings won't fail) |

---

## Rule Descriptions

| Rule | Severity | Human Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
| missing-relationship-target | warning | Relationship target must exist |
| session-scope | warning | File not in active session scope |
| deliverable-removed | warning | Deliverable was removed (informational) |

---

## Error Messages and Fixes

| Rule | Severity | Example Error | Fix |
| --- | --- | --- | --- |
| completed-protection | error | Cannot modify completed spec without unlock reason | Add unlock-reason tag |
| invalid-status-transition | error | Invalid status transition: roadmap to completed | Follow FSM path |
| scope-creep | error | Cannot add deliverables to active spec | Remove deliverable or revert to roadmap |
| missing-relationship-target | warning | Missing relationship target: "PatternX" referenced by "PatternY" | Add target pattern or remove relationship |
| session-scope | warning | File not in active session scope | Add to scope or use --ignore-session |
| session-excluded | error | File is explicitly excluded from session | Remove from exclusion or use --ignore-session |
| deliverable-removed | warning | Deliverable removed: "Unit tests" | Informational only |

| Attempted | Why Invalid | Valid Path |
| --- | --- | --- |
| roadmap to completed | Must go through active | roadmap to active to completed |
| deferred to active | Must return to roadmap first | deferred to roadmap to active |
| deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
| completed to any | Terminal state | Use unlock-reason tag to modify |

---

## CLI Usage

| Command | Purpose |
| --- | --- |
| `lint-process --staged` | Pre-commit validation (default mode) |
| `lint-process --all --strict` | CI pipeline with strict mode |
| `lint-process --file specs/my-feature.feature` | Validate specific file |
| `lint-process --staged --show-state` | Debug: show derived process state |
| `lint-process --staged --ignore-session` | Override session scope checking |

| Option | Description |
| --- | --- |
| `--staged` | Validate staged files only (pre-commit) |
| `--all` | Validate all tracked files (CI) |
| `--strict` | Treat warnings as errors (exit 1) |
| `--ignore-session` | Skip session scope validation |
| `--show-state` | Debug: show derived process state |
| `--format json` | Machine-readable JSON output |
| `--file <path>` | Validate a specific file |

---

## Programmatic API

| Category | Function | Description |
| --- | --- | --- |
| State | deriveProcessState(cfg) | Build state from file annotations |
| Changes | detectStagedChanges(dir) | Parse staged git diff |
| Changes | detectBranchChanges(dir) | Parse all changes vs main |
| Changes | detectFileChanges(dir, f) | Parse specific files |
| Validate | validateChanges(input) | Run all validation rules |
| Results | hasErrors(result) | Check for blocking errors |
| Results | hasWarnings(result) | Check for warnings |
| Results | summarizeResult(result) | Human-readable summary |

---

## Architecture

---

## Related Documentation

| Document | Relationship | Focus |
| --- | --- | --- |
| VALIDATION-REFERENCE.md | Sibling | DoD validation, anti-pattern detection |
| SESSION-GUIDES-REFERENCE.md | Prerequisite | Planning/Implementation workflows that Process Guard enforces |
| CONFIGURATION-REFERENCE.md | Reference | Presets and tag configuration |
| METHODOLOGY-REFERENCE.md | Background | Code-first documentation philosophy |

---

## API Types

| Type | Kind |
| --- | --- |
| AntiPatternId | type |
| AntiPatternViolation | interface |
| AntiPatternThresholds | type |
| AntiPatternThresholdsSchema | const |
| DEFAULT_THRESHOLDS | const |
| DoDValidationResult | interface |
| DoDValidationSummary | interface |
| getPhaseStatusEmoji | function |
| WithTagRegistry | interface |
| isDeliverableComplete | function |
| hasAcceptanceCriteria | function |
| extractAcceptanceCriteriaScenarios | function |
| validateDoDForPhase | function |
| validateDoD | function |
| formatDoDSummary | function |
| AntiPatternDetectionOptions | interface |
| detectAntiPatterns | function |
| detectProcessInCode | function |
| detectMagicComments | function |
| detectScenarioBloat | function |
| detectMegaFeature | function |
| formatAntiPatternReport | function |
| toValidationIssues | function |
| LintRule | interface |
| LintContext | interface |
| defaultRules | const |
| severityOrder | const |
| filterRulesBySeverity | function |
| missingPatternName | const |
| missingStatus | const |
| invalidStatus | const |
| missingWhenToUse | const |
| tautologicalDescription | const |
| missingRelationships | const |
| patternConflictInImplements | const |
| missingRelationshipTarget | const |

---
