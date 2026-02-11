# Gherkin Patterns Reference

**Purpose:** Reference document: Gherkin Patterns Reference
**Detail Level:** Full reference

---

## Roadmap Spec Structure

**Context:** Roadmap specs define planned work with Problem/Solution descriptions
    and a Background deliverables table. They use the FSM status roadmap.

    **Key Elements:**

    **Structure Overview:**

    1. Tags at top: pattern name, status (roadmap), phase number
    2. Feature line with descriptive name
    3. **Problem:** section listing pain points as bullet list
    4. **Solution:** section listing approach as numbered list
    5. Background with deliverables DataTable (Deliverable, Status, Location columns)

    **Example Reference:** See specs/process-guard-linter.feature for a complete example.

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

**Context:** Use the Rule keyword to group related scenarios under a business constraint.
    Rules provide semantic grouping - generators extract them for business rules documentation.

    **Structure Overview:**

    1. Rule: line with business constraint name
    2. Optional structured annotations (Invariant, Rationale, Verified by)
    3. Related scenarios grouped under the Rule

    **Structured Rule Annotations:**

| **Usage Notes:**

    - Group scenarios that verify the same business constraint
    - Use Scenario Outline with Examples table for variations
    - Tag scenarios within Rules (at-happy-path, at-edge-case, etc.)
    - Rule blocks are optional - use when defining business invariants

**Rationale:** | Business justification (why it exists) | Business Rules generator | |

| Element | Purpose | Extracted By |
| --- | --- | --- |
| **Invariant:** | Business constraint (what must be true) | Business Rules generator |
| **Rationale:** | Business justification (why it exists) | Business Rules generator |
| **Verified by:** | Comma-separated scenario names | Traceability generator |

**Verified by:** | Comma-separated scenario names | Traceability generator |

---

## Scenario Outline for Variations

**Context:** Use Scenario Outline with Examples table when the same pattern applies
    with different inputs. This avoids duplicating nearly-identical scenarios.

    **Structure Overview:**

    1. Scenario Outline: line with descriptive name
    2. Steps using angle-bracket placeholders: <column_name>
    3. Examples: keyword followed by DataTable
    4. Each row in Examples table runs the scenario once

    **Best Practice:**

    **Example Reference:** See tests/features/validation/fsm-transitions.feature

| Condition | Recommendation |
| --- | --- |
| 3+ variations of same pattern | Use Scenario Outline |
| 1-2 variations | Separate Scenarios may be clearer |
| Different behaviors | Use separate Scenarios |
| Same behavior, different data | Use Scenario Outline |

---

## Executable Test Feature

**Context:** Test features focus on behavior verification. They use section
    dividers for organization in large feature files.

    **Structure Overview:**

    1. Tags: at-behavior, at-pattern-name, at-libar-docs-pattern:Name
    2. Feature with Problem/Solution description
    3. Background with test context setup
    4. Section comments (lines of === characters) to organize
    5. Scenarios grouped by section (Basic, Error Handling, etc.)

    **Section Comments:**

    Use comment lines with equals signs to divide large feature files into sections.
    These improve readability but are ignored by generators.

    Example section divider: a line of 70+ equals signs as a Gherkin comment.

    **Example Reference:** See tests/features/behavior/scanner-core.feature

---

## DataTable and DocString Usage

**Context:** DataTables and DocStrings serve different purposes. Choose
    the right one based on your data structure.

    **Decision Table:**

    **Background DataTable:**

    Use for data that applies to all scenarios - deliverables, definitions, configuration.
    First row is headers, subsequent rows are data.

    **Scenario DataTable:**

    Use for scenario-specific test inputs with tabular structure.
    Access in step definitions as array of objects keyed by header names.

    **DocString:**

    Use triple quotes (three double-quote characters) for multi-line content.
    Add language hint after opening quotes: typescript, bash, json, etc.
    Essential when content contains pipe characters that would break DataTables.

| Data Type | Use | Format |
| --- | --- | --- |
| Reference data (all scenarios) | Background DataTable | Pipe-delimited rows with header |
| Test inputs (single scenario) | Scenario DataTable | Pipe-delimited rows with header |
| Code examples | DocString | Triple quotes with lang hint |
| Content with pipes | DocString | Avoids parsing issues |
| Multi-line text | DocString | Preserves formatting |

---

## Tag Conventions

**Context:** Tags organize scenarios for filtering and categorization.
    Use consistent tags across the codebase.

    **Scenario Tags:**

    **Feature-Level Tags:**

    **Combining Tags:**

    Multiple tags on same line are space-separated.
    Feature-level tags apply to all scenarios in the feature.

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

**Context:** Feature descriptions appear in generated documentation.
    Choose headers that fit your pattern type.

    **Decision:** Three description structures are supported:

    **Notes:**

    - The **Problem/Solution** pattern is the dominant style in this codebase
    - Problem section: use bullet list for pain points
    - Solution section: use numbered list for approach steps
    - Both headers must include trailing colon and be bold

| Structure | Headers | Best For |
| --- | --- | --- |
| Problem/Solution | **Problem:** and **Solution:** | Pain point to fix |
| Value-First | **Business Value:** and **How It Works:** | TDD-style, Gherkin spirit |
| Context/Approach | **Context:** and **Approach:** | Technical patterns |

---

## Valid Rich Content

**Context:** Feature files support various content types. Some appear in
    generated docs, others are ignored.

    **Decision:** Content rendering by type:

    **Code-First Principle:**

    Prefer code stubs over DocStrings for complex examples. Feature files
    should reference code, not duplicate it.

    **Instead of large DocStrings, reference code files directly in Rule descriptions.**

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

**Context:** Gherkin has specific syntax constraints that differ from Markdown.

    **DocStrings vs Code Fences:**

    Prefer DocStrings (triple double-quotes) over Markdown code fences for portability.
    Markdown fences (triple backticks) may not render consistently in all contexts.
    DocStrings support language hints for syntax highlighting.

    **Tag Value Constraints:**

    Tag values cannot contain spaces. Use hyphens instead:

    **Quoted Values:**

    For values that need spaces, use the quoted-value format where supported.

| Invalid | Valid |
| --- | --- |
| at-unlock-reason:Fix for issue | at-unlock-reason:Fix-for-issue |
| at-libar-docs-pattern:My Pattern | at-libar-docs-pattern:MyPattern |

---

## Forbidden Content in Feature Descriptions

**Context:** Some content types cause Gherkin parser issues or rendering problems.
    Avoid these patterns in feature descriptions.

    **Forbidden Content:**

    **DocString Limitations:**

    - DocStrings cannot contain the closing triple-quote sequence
    - Avoid shell scripts with complex quoting in DocStrings
    - Keep DocStrings under 50 lines (reference code files for longer examples)
    - Do not use Gherkin keywords (Feature:, Scenario:) in DocString content

    **Workaround for Complex Examples:**

    Instead of embedding complex code in DocStrings, reference the actual file:
    "See src/example/module.ts for complete implementation."

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

**Context:** Quick checklist when authoring new Gherkin specs.

    **Before Writing:**

    **While Writing:**

    **After Writing:**

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

**Context:** Quick lookup table for Gherkin elements and their use cases.

    **Decision:** Element usage guide:

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

**Context:** Gherkin patterns connect to other documentation.

    **Decision:** Related docs by topic:

| Document | Content |
| --- | --- |
| INSTRUCTIONS.md | Complete tag reference and CLI |
| CONFIGURATION.md | Preset and tag prefix configuration |
| SESSION-GUIDES.md | Session workflows using these patterns |
| METHODOLOGY.md | Core thesis and two-tier architecture |

---

## Command Decision Tree

**Context:** Developers need to quickly determine which validation command to run.

    **Decision Tree:**

| Question | Answer | Command |
| --- | --- | --- |
| Need annotation quality check? | Yes | lint-patterns |
| Need FSM workflow validation? | Yes | lint-process |
| Need cross-source or DoD validation? | Yes | validate-patterns |
| Running pre-commit hook? | Default | lint-process --staged |

---

## Command Summary

**Context:** Three validation commands serve different purposes.

    **Commands:**

| Command | Purpose | When to Use |
| --- | --- | --- |
| lint-patterns | Annotation quality | Ensure patterns have required tags |
| lint-process | FSM workflow enforcement | Pre-commit hooks, CI pipelines |
| validate-patterns | Cross-source + DoD + anti-pattern | Release validation, comprehensive |

---

## lint-patterns Rules

**Context:** lint-patterns validates annotation quality in TypeScript files.

    **CLI Commands:**

    **Validation Rules:**

    Validation rules are extracted from `src/lint/rules.ts` via `@extract-shapes`.

    **Rule Error Examples:**

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

**Context:** Enforces dual-source architecture ownership between TypeScript and Gherkin files.

    Anti-pattern definitions are extracted from `src/validation/anti-patterns.ts` via `@extract-shapes`.

    **Anti-Patterns Detected:**

    **Tag Location Constraints:**

    **Default Thresholds:**

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

**Context:** Definition of Done validation ensures completed patterns meet quality criteria.

    DoD criteria and completion patterns are extracted from `src/validation/dod-validator.ts`
    and `src/validation/types.ts` via `@extract-shapes`.

    **DoD Criteria (for completed status):**

    **Recognized Completion Patterns:**

    **Recognized Pending Patterns:**

    **DoD Validation Output Example:**

**Rationale:** Ensures completed status reflects verified readiness for production.

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

**Verified by:** @acceptance-criteria Scenario: Reference generates Validation documentation

---

## validate-patterns Flags

**Context:** validate-patterns combines multiple validation checks.

    CLI configuration interface (`ValidateCLIConfig`) with all flags and options
    is extracted from `src/cli/validate-patterns.ts` via `@extract-shapes`.

    **CLI Options:**

    **Example Commands:**

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

**Context:** Validation commands integrate into CI/CD pipelines.

    **Recommended npm Scripts:**

    **Pre-commit Hook Setup:**

    Add to `.husky/pre-commit`: `npx lint-process --staged`

    **GitHub Actions Integration:**

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

**Context:** All validation commands use consistent exit codes.

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |

---

## Programmatic API

**Context:** All validation tools expose programmatic APIs for custom integrations.

    **API Functions:**

    **Import Paths:**

    

    **Anti-Pattern Detection Example:**

    

    **DoD Validation Example:**

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

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| PROCESS-GUARD-REFERENCE.md | Sibling | FSM workflow enforcement, pre-commit hooks |
| CONFIGURATION-REFERENCE.md | Reference | Tag prefixes, presets |
| TAXONOMY-REFERENCE.md | Reference | Valid status values, tag formats |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation reference |

---
