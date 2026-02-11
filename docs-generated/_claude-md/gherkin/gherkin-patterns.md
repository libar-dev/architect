# Gherkin Patterns Reference

**Purpose:** Reference document: Gherkin Patterns Reference
**Detail Level:** Compact summary

---

## Roadmap Spec Structure

| Element | Purpose | Example |
| --- | --- | --- |
| at-libar-docs-pattern:Name | Unique identifier (required) | at-libar-docs-pattern:ProcessGuard |
| at-libar-docs-status:roadmap | FSM state | at-libar-docs-status:roadmap |
| at-libar-docs-phase:N | Phase number for timeline | at-libar-docs-phase:99 |
| Problem/Solution headers | Extracted by generators | **Problem:** / **Solution:** |
| Background deliverables | Tracks implementation progress | DataTable with Status column |

---

## Rule Blocks for Business Constraints

**Invariant:** | Business constraint (what must be true) | Business Rules generator | |

| Element | Purpose | Extracted By |
| --- | --- | --- |
| **Invariant:** | Business constraint (what must be true) | Business Rules generator |
| **Rationale:** | Business justification (why it exists) | Business Rules generator |
| **Verified by:** | Comma-separated scenario names | Traceability generator |

---

## Scenario Outline for Variations

| Condition | Recommendation |
| --- | --- |
| 3+ variations of same pattern | Use Scenario Outline |
| 1-2 variations | Separate Scenarios may be clearer |
| Different behaviors | Use separate Scenarios |
| Same behavior, different data | Use Scenario Outline |

---

## Executable Test Feature

---

## DataTable and DocString Usage

| Data Type | Use | Format |
| --- | --- | --- |
| Reference data (all scenarios) | Background DataTable | Pipe-delimited rows with header |
| Test inputs (single scenario) | Scenario DataTable | Pipe-delimited rows with header |
| Code examples | DocString | Triple quotes with lang hint |
| Content with pipes | DocString | Avoids parsing issues |
| Multi-line text | DocString | Preserves formatting |

---

## Tag Conventions

| Tag | Purpose | When to Use |
| --- | --- | --- |
| at-happy-path | Primary success scenario | Default behavior works |
| at-edge-case | Boundary conditions | Unusual inputs, limits |
| at-error-handling | Error recovery | Graceful degradation |
| at-validation | Input validation | Constraint checks |
| at-integration | Cross-component behavior | System boundaries |
| at-poc | Proof of concept | Experimental features |
| at-acceptance-criteria | Required for DoD | Must-pass scenarios |

| Tag | Purpose | Example |
| --- | --- | --- |
| at-behavior | Marks test feature file | Test feature identification |
| at-libar-docs | Opt-in for processing | Required for all processed features |
| at-libar-docs-pattern:Name | Unique pattern identifier | Pattern registry key |
| at-libar-docs-status:state | FSM state | roadmap, active, completed, deferred |
| at-libar-docs-phase:N | Timeline phase | Phase number for roadmap |

---

## Feature Description Patterns

| Structure | Headers | Best For |
| --- | --- | --- |
| Problem/Solution | **Problem:** and **Solution:** | Pain point to fix |
| Value-First | **Business Value:** and **How It Works:** | TDD-style, Gherkin spirit |
| Context/Approach | **Context:** and **Approach:** | Technical patterns |

---

## Valid Rich Content

| Content Type | Syntax | Appears in Docs |
| --- | --- | --- |
| Plain text | Regular paragraphs | Yes |
| Bold/emphasis | **bold** and *italic* | Yes |
| Tables | Markdown pipe tables | Yes |
| Lists | Dash item or number-dot item | Yes |
| DocStrings | Triple quotes with lang | Yes (code block) |
| Comments | Lines starting with hash | No (ignored) |

| Approach | When to Use |
| --- | --- |
| DocStrings | Brief examples (5-10 lines), current/target state |
| Code stub reference | Complex APIs, interfaces, full implementations |

---

## Syntax Notes

| Invalid | Valid |
| --- | --- |
| at-unlock-reason:Fix for issue | at-unlock-reason:Fix-for-issue |
| at-libar-docs-pattern:My Pattern | at-libar-docs-pattern:MyPattern |

---

## Forbidden Content in Feature Descriptions

| Forbidden | Why | Alternative |
| --- | --- | --- |
| Code fences (triple backticks) | Not Gherkin syntax | Use DocStrings with lang hint |
| at-prefix in free text | Interpreted as Gherkin tag | Remove at-symbol or escape |
| Nested DocStrings | Gherkin parser error | Reference code stub file |
| Lines starting with dot | Parser issues in some contexts | Reword sentence |
| Feature: in DocStrings | Triggers Gherkin keyword parsing | Use different example text |
| at-tags with space values | Tag parsing fails | Use hyphens instead |

---

## Authoring Checklist

| Check | Why |
| --- | --- |
| Determine spec type (roadmap vs test) | Different tag requirements |
| Choose description pattern | Problem/Solution, Value-First, or Context/Approach |
| Identify deliverables | For Background DataTable |
| List business constraints | Each becomes a Rule block |

| Check | Action |
| --- | --- |
| Tags at feature level | at-libar-docs, at-libar-docs-pattern, at-libar-docs-status |
| Feature description | Use bold headers (**Problem:** etc.) |
| Background DataTable | Deliverable, Status, Location columns |
| Rule blocks | One per business constraint |
| Scenarios per Rule | Minimum 1 happy-path + 1 validation |
| Scenario tags | at-happy-path, at-edge-case, at-acceptance-criteria |

| Check | Command |
| --- | --- |
| Lint passes | pnpm lint |
| Pattern lint passes | pnpm lint-patterns |
| Docs generate | pnpm docs:technical |
| Content appears in output | Check docs-generated/ directory |

---

## Quick Reference

| Element | Use For | Example Location |
| --- | --- | --- |
| Background DataTable | Deliverables, shared reference | specs/process-guard-linter.feature |
| Rule block | Group scenarios by constraint | tests/features/validation/*.feature |
| Scenario Outline | Same pattern with variations | tests/features/behavior/fsm-*.feature |
| DocString | Code examples, pipes content | tests/features/behavior/scanner-*.feature |
| Section comments | Organize large features | Most test features |
| at-happy-path | Primary success scenario | Every feature with scenarios |
| at-edge-case | Boundary conditions | Validation features |
| at-acceptance-criteria | Required for DoD | Roadmap specs |

---

## Related Documentation - Gherkin

| Document | Content |
| --- | --- |
| INSTRUCTIONS.md | Complete tag reference and CLI |
| CONFIGURATION.md | Preset and tag prefix configuration |
| SESSION-GUIDES.md | Session workflows using these patterns |
| METHODOLOGY.md | Core thesis and two-tier architecture |

---

## Command Decision Tree

| Question | Answer | Command |
| --- | --- | --- |
| Need annotation quality check? | Yes | lint-patterns |
| Need FSM workflow validation? | Yes | lint-process |
| Need cross-source or DoD validation? | Yes | validate-patterns |
| Running pre-commit hook? | Default | lint-process --staged |

---

## Command Summary

| Command | Purpose | When to Use |
| --- | --- | --- |
| lint-patterns | Annotation quality | Ensure patterns have required tags |
| lint-process | FSM workflow enforcement | Pre-commit hooks, CI pipelines |
| validate-patterns | Cross-source + DoD + anti-pattern | Release validation, comprehensive |

---

## lint-patterns Rules

| Command | Purpose |
| --- | --- |
| `npx lint-patterns -i "src/**/*.ts"` | Basic usage |
| `npx lint-patterns -i "src/**/*.ts" --strict` | Strict mode (CI) |

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

| Rule | Example Error | Fix |
| --- | --- | --- |
| missing-pattern-name | Pattern missing explicit name | Add @libar-docs-pattern YourName |
| invalid-status | Invalid status 'draft' | Use: roadmap, active, completed, deferred |
| tautological-description | Description repeats pattern name | Provide meaningful context |
| missing-status | No @libar-docs-status found | Add: @libar-docs-status completed |
| missing-when-to-use | No "When to Use" section found | Add ### When to Use in description |

---

## Anti-Pattern Detection

| ID | Severity | Description | Fix |
| --- | --- | --- | --- |
| tag-duplication | error | Dependencies in features (should be code-only) | Move uses tags to TypeScript code |
| process-in-code | error | Process metadata in code (should be features-only) | Move quarter/team tags to feature files |
| magic-comments | warning | Generator hints in features (e.g., # GENERATOR:) | Use standard Gherkin tags instead |
| scenario-bloat | warning | Too many scenarios per feature (threshold: 20) | Split into multiple feature files |
| mega-feature | warning | Feature file too large (threshold: 500 lines) | Split by component or domain |

| Tag | Correct Location | Wrong Location | Reason |
| --- | --- | --- | --- |
| @libar-docs-uses | TypeScript code | Feature files | TS owns runtime dependencies |
| @libar-docs-depends-on | Feature files | TypeScript code | Gherkin owns planning dependencies |
| @libar-docs-quarter | Feature files | TypeScript code | Gherkin owns timeline metadata |
| @libar-docs-team | Feature files | TypeScript code | Gherkin owns ownership metadata |

| Threshold | Default Value | Description |
| --- | --- | --- |
| scenarioBloatThreshold | 20 | Max scenarios per feature file |
| megaFeatureLineThreshold | 500 | Max lines per feature file |
| magicCommentThreshold | 5 | Max magic comments before warning |

---

## DoD Validation

**Invariant:** Completed patterns must satisfy all DoD criteria defined below.

| Criterion | Requirement | Failure Message |
| --- | --- | --- |
| Deliverables Complete | All deliverables must be marked done | X/Y deliverables incomplete |
| Acceptance Criteria | At least one @acceptance-criteria scenario | No @acceptance-criteria scenarios found |

| Type | Patterns |
| --- | --- |
| Text (case-insensitive) | complete, completed, done, finished, yes |
| Symbols | checkmark, heavy checkmark, check box with check, white check |

| Type | Patterns |
| --- | --- |
| Text (case-insensitive) | pending, todo, planned, not started, no |

| Phase | Pattern | Deliverables | AC Scenarios | Result |
| --- | --- | --- | --- | --- |
| Phase 14 | MyPattern | 5/5 complete | 3 found | PASS |
| Phase 15 | OtherPattern | 2/4 complete | 0 found | FAIL |

---

## validate-patterns Flags

| Flag | Description |
| --- | --- |
| `-i, --include` | TypeScript file glob patterns |
| `-F, --features` | Feature file glob patterns |
| `--dod` | Enable DoD validation for completed patterns |
| `--anti-patterns` | Enable anti-pattern detection |
| `--cross-source` | Enable cross-source consistency validation |

| Command | Purpose |
| --- | --- |
| `npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod` | DoD only |
| `npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --anti-patterns` | Anti-patterns only |
| `npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns` | Full validation |

---

## CI/CD Integration

| Script Name | Command | Purpose |
| --- | --- | --- |
| lint:patterns | lint-patterns -i 'src/**/*.ts' | Annotation quality |
| lint:process | lint-process --staged | Pre-commit validation |
| lint:process:ci | lint-process --all --strict | CI pipeline |
| validate:all | validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns | Full validation |

| Step Name | Command |
| --- | --- |
| Lint annotations | npx lint-patterns -i "src/**/*.ts" --strict |
| Validate patterns | npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns |

---

## Exit Codes

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |

---

## Programmatic API

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

---

## Related Documentation - Validation

| Document | Relationship | Focus |
| --- | --- | --- |
| PROCESS-GUARD-REFERENCE.md | Sibling | FSM workflow enforcement, pre-commit hooks |
| CONFIGURATION-REFERENCE.md | Reference | Tag prefixes, presets |
| TAXONOMY-REFERENCE.md | Reference | Valid status values, tag formats |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation reference |

---
