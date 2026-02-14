# 📋 PDR 002 Session Workflow Commands

**Purpose:** Detailed requirements for the PDR 002 Session Workflow Commands feature

---

## Overview

| Property     | Value           |
| ------------ | --------------- |
| Status       | planned         |
| Product Area | DeliveryProcess |

## Description

**Context:**
DataAPIDesignSessionSupport adds two CLI subcommands: `scope-validate`
(pre-flight session readiness check) and `handoff` (session-end state
summary). The context assembly command (`context --session design|implement`)
already handles session start. These commands complete the session lifecycle.

**Problem:**
Several design decisions affect how these commands behave: output format,
git integration, session type inference, severity levels, formatter
architecture, date handling, and CLI syntax flexibility.

**Decision:**
Seven design decisions (DD-1 through DD-7) are captured below as Rules.

## Acceptance Criteria

**scope-validate outputs structured text**

- Given the CLI receives "scope-validate MyPattern --type implement"
- When the handler returns a formatted string
- Then main() outputs the string directly to stdout
- And the output contains === SCOPE VALIDATION === and === CHECKLIST === markers

**handoff outputs structured text**

- Given the CLI receives "handoff --pattern MyPattern"
- When the handler returns a formatted string
- Then main() outputs the string directly to stdout
- And the output contains === HANDOFF === and === COMPLETED === markers

**Handoff without git flag omits files section**

- Given a pattern "MyPattern" with active status
- When running "process-api handoff --pattern MyPattern"
- Then the output does not contain === FILES MODIFIED === section

**Handoff with git flag includes modified files**

- Given a pattern "MyPattern" with active status
- And git diff reports 3 modified files
- When running "process-api handoff --pattern MyPattern --git"
- Then the output contains === FILES MODIFIED === section
- And the section lists 3 file paths

**Active pattern infers implement session**

- Given a pattern with status "active"
- When running "process-api handoff --pattern MyPattern"
- Then the session summary shows session type "implement"

**Missing PDR references produce WARN not BLOCKED**

- Given a pattern with no PDR references in stubs
- When running "process-api scope-validate MyPattern --type implement"
- Then the design-decisions check shows "WARN"
- And the verdict is "READY" (warnings do not block)

**Positional scope type works**

- Given the CLI receives "scope-validate MyPattern implement"
- Then the scope type is parsed as "implement"

**Flag scope type works**

- Given the CLI receives "scope-validate MyPattern --type implement"
- Then the scope type is parsed as "implement"

**Reference generates Session Guides documentation**

- Given this decision document with source mapping table
- When running doc-from-decision generator
- Then detailed docs are generated with session decision tree
- And detailed docs are generated with planning session checklist
- And detailed docs are generated with implementation session checklist
- And compact docs are generated with FSM protection table
- And FSM error messages and fixes are included
- And escape hatches reference is included
- And common mistakes tables are included
- And discovery tags reference is included
- And detailed docs are generated with design session checklist
- And detailed docs are generated with planning-plus-design session checklist
- And handoff documentation template is included
- And related documentation mapping is included

## Business Rules

**DD-1 - Text output with section markers per ADR-008**

Both scope-validate and handoff return string from the router, using
=== SECTION === markers. This follows the dual output path established
by ADR-008. Both commands are AI-consumption focused — JSON wrapping
adds overhead without benefit.

_Verified by: scope-validate outputs structured text, handoff outputs structured text_

**DD-2 - Git integration is opt-in via --git flag**

The handoff command accepts an optional --git flag. When present, the
CLI handler calls git diff and passes the file list to the pure
generator function. The generator receives modifiedFiles as an optional
readonly string array — no shell dependency in the domain logic.

    **Rationale:** Pure functions are testable without mocking child_process.
    The git call stays in the CLI handler (I/O boundary), not the generator.

_Verified by: Handoff without git flag omits files section, Handoff with git flag includes modified files_

**DD-3 - Session type inferred from FSM status**

The handoff command infers session type from the pattern's current
FSM status. An explicit --session flag overrides inference.

    | Status | Inferred Session |
    | roadmap | design |
    | active | implement |
    | completed | review |
    | deferred | design |

_Verified by: Active pattern infers implement session_

**DD-4 - Severity levels match Process Guard model**

Scope validation uses three severity levels. BLOCKED prevents session
start. WARN indicates suboptimal readiness but does not block.

    | Severity | Meaning | Example |
    | PASS | Check passed | All dependencies completed |
    | BLOCKED | Hard prerequisite missing | Dependency not completed |
    | WARN | Recommendation not met | No PDR references found |

    The --strict flag (consistent with lint-process) promotes WARN to BLOCKED.

_Verified by: Missing PDR references produce WARN not BLOCKED_

**DD-5 - Current date only for handoff**

The handoff command always uses the current date. No --date flag.
Handoff is run at session end; backdating is a rare edge case not
worth the API surface area.

**DD-6 - Both positional and flag forms for scope type**

scope-validate accepts the scope type as either a positional argument
or a --type flag: both "scope-validate MyPattern implement" and
"scope-validate MyPattern --type implement" work.

    This matches how dep-tree accepts --depth as both positional and flag.

_Verified by: Positional scope type works, Flag scope type works_

**DD-7 - Co-located formatter functions**

Each new module (scope-validator.ts, handoff-generator.ts) exports
both the data builder and the text formatter. Unlike the
context-assembler/context-formatter split (justified by ContextBundle
complexity), these commands are simpler and benefit from co-location.

    **Rationale:** Avoids file proliferation. The formatter for scope
    validation is ~30 lines; separating it into its own file adds
    overhead without benefit. If complexity grows, the split can happen
    later.

**Session Decision Tree**

**Tag Notation:** In Rule descriptions below, "at-prefix" stands for the configured tag prefix (e.g., "@libar-docs-"), escaped to avoid Gherkin tag parsing.

    **Context:** Developers need to choose the correct session type based on their current situation.

    **Decision Tree (ASCII):**

```text
Starting from pattern brief?
    |-- Yes --> Need code stubs now? --> Yes --> Planning + Design
    |                                --> No  --> Planning
    |-- No  --> Ready to code? --> Yes --> Complex decisions? --> Yes --> Design first
                                                               --> No  --> Implementation
                               --> No  --> Planning
```

**Decision:** Session types map to inputs, outputs, and FSM changes:

| Session           | Input               | Output                      | FSM Change                     |
| ----------------- | ------------------- | --------------------------- | ------------------------------ |
| Planning          | Pattern brief       | Roadmap spec (.feature)     | Creates roadmap                |
| Design            | Complex requirement | Decision specs + code stubs | None                           |
| Implementation    | Roadmap spec        | Code + tests                | roadmap to active to completed |
| Planning + Design | Pattern brief       | Spec + stubs                | Creates roadmap                |

**Planning Session**

**Goal:** Create a roadmap spec. Do NOT write implementation code.

    **Checklist:**

    1. Extract metadata from pattern brief
       - Phase number to at-prefix-phase
       - Dependencies to at-prefix-depends-on
       - Status to at-prefix-status:roadmap (always roadmap)

    2. Create spec file at specs/product-area/pattern.feature

    3. Structure the feature with at-prefix tags

    4. Add deliverables table in Background section

    5. Convert tables to Rule blocks (each business constraint becomes a Rule)

    6. Add scenarios per Rule (minimum: 1 happy-path + 1 validation)

    7. Set executable specs location with at-prefix-executable-specs tag

    **Do NOT:**

| Forbidden Action                | Rationale                                |
| ------------------------------- | ---------------------------------------- |
| Create .ts implementation files | Planning only creates specs              |
| Transition to active            | Active requires implementation readiness |
| Ask Ready to implement?         | Planning session ends at roadmap spec    |
| Write full implementations      | Stubs only if Planning + Design          |

**Design Session**

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

    **When Required:**

| Use Design Session         | Skip Design Session |
| -------------------------- | ------------------- |
| Multiple valid approaches  | Single obvious path |
| New patterns/capabilities  | Bug fix             |
| Cross-context coordination | Clear requirements  |

    **Checklist:**

    1. Record architectural decisions as PDR .feature files in delivery-process/decisions/

    2. Document options (at least 2-3 approaches with pros/cons in Rule blocks)

    3. Get approval (user must approve recommended approach)

    4. Create code stubs in delivery-process/stubs/{pattern-name}/ with at-prefix-implements and Target: annotations

    **Code Stub Pattern:**

```typescript
/**
 * at-prefix
 * at-prefix-status roadmap
 * at-prefix-implements MyPattern
 *
 * MyPattern - Description
 *
 * Target: src/path/to/final/location.ts
 * See: PDR-001 (Design Decision)
 */
export interface MyResult {
  id: string;
}

export function myFunction(args: MyArgs): Promise<MyResult> {
  throw new Error('MyPattern not yet implemented - roadmap pattern');
}
```

**Do NOT:**

| Forbidden Action                 | Rationale                                                       |
| -------------------------------- | --------------------------------------------------------------- |
| Create markdown design documents | Decision specs provide better traceability with structured tags |
| Create implementation plans      | Design focuses on architecture                                  |
| Transition spec to active        | Requires implementation session                                 |
| Write full implementations       | Stubs only                                                      |

**Implementation Session**

**Goal:** Write code. The roadmap spec is the source of truth.

    **Pre-flight Requirements:**

| Requirement                                         | Why                             |
| --------------------------------------------------- | ------------------------------- |
| Roadmap spec exists with at-prefix-status:roadmap   | Cannot implement without spec   |
| Decision specs approved (if needed)                 | Complex decisions need approval |
| Implementation plan exists (for multi-session work) | Prevents scope drift            |

    **Execution Checklist (CRITICAL - Order Matters):**

    1. Transition to active FIRST (before any code)
       - Change at-prefix-status:roadmap to at-prefix-status:active
       - Protection: active = scope-locked (no new deliverables)

    2. Create executable spec stubs (if at-prefix-executable-specs present)
       - Use at-prefix-implements:PatternName tag

    3. For each deliverable:
       - Read acceptance criteria from spec
       - Implement code (replace throw new Error)
       - Preserve at-prefix-* annotations in JSDoc
       - Write tests
       - Update deliverable status to completed

    4. Transition to completed (only when ALL done)
       - Change at-prefix-status:active to at-prefix-status:completed
       - Protection: completed = hard-locked (requires at-prefix-unlock-reason)

    5. Regenerate docs with: pnpm docs:all

    **Do NOT:**

| Forbidden Action                    | Rationale                          |
| ----------------------------------- | ---------------------------------- |
| Add new deliverables to active spec | Scope-locked state prevents this   |
| Mark completed with incomplete work | Hard-locked state cannot be undone |
| Skip FSM transitions                | Process Guard will reject          |
| Edit generated docs directly        | Regenerate from source             |

**Planning + Design Session**

**Goal:** Create spec AND code stubs in one session. For immediate implementation handoff.

    **When to Use:**

| Use Planning + Design               | Use Planning Only            |
| ----------------------------------- | ---------------------------- |
| Need stubs for implementation       | Only enhancing spec          |
| Preparing for immediate handoff     | Still exploring requirements |
| Want complete two-tier architecture | Do not need Tier 2 yet       |

    **Checklist:**

    1. Complete Planning checklist (see Planning Session rule)

    2. Add at-prefix-executable-specs tag pointing to Tier 2 location

    3. Create code stubs (see Design Session code stub pattern)

    4. Create Tier 2 directory: package/tests/features/behavior/pattern-name/

    5. Create Tier 2 feature stubs with at-prefix-implements:PatternName

    6. Create step definitions stub at tests/planning-stubs/pattern.steps.ts

    **Handoff Complete When:**

    Tier 1:
    - All at-prefix-* tags present
    - at-prefix-executable-specs points to Tier 2
    - Deliverables table complete
    - Status is roadmap

    Tier 2:
    - Directory created with .feature files
    - Each file has at-prefix-implements
    - Step definitions stub compiles

    Validation:
    - pnpm lint passes
    - pnpm typecheck passes

**FSM Protection**

**Context:** The FSM (Finite State Machine) protects work integrity through state-based restrictions.

    **Decision:** Protection levels and valid transitions are defined in TypeScript source:
    - Protection levels: See `PROTECTION_LEVELS` in `src/validation/fsm/states.ts`
    - Valid transitions: See `VALID_TRANSITIONS` in `src/validation/fsm/transitions.ts`

    **Protection Levels:**

| State     | Protection   | Can Add Deliverables | Needs Unlock | Allowed Actions                | Blocked Actions               |
| --------- | ------------ | -------------------- | ------------ | ------------------------------ | ----------------------------- |
| roadmap   | None         | Yes                  | No           | Full editing, add deliverables | None                          |
| deferred  | None         | Yes                  | No           | Full editing, add deliverables | None                          |
| active    | Scope-locked | No                   | No           | Edit existing deliverables     | Adding new deliverables       |
| completed | Hard-locked  | No                   | Yes          | Nothing                        | Any change without unlock tag |

    **Valid FSM Transitions:**

| From     | To        | Trigger    | Notes                  |
| -------- | --------- | ---------- | ---------------------- |
| roadmap  | active    | Start work | Locks scope            |
| roadmap  | deferred  | Postpone   | For deprioritized work |
| active   | completed | Finish     | Terminal state         |
| active   | roadmap   | Regress    | For blocked work       |
| deferred | roadmap   | Resume     | To restart planning    |

    **Invalid Transitions (will fail validation):**

| Attempted             | Why Invalid                  | Valid Path                                 |
| --------------------- | ---------------------------- | ------------------------------------------ |
| roadmap to completed  | Must go through active       | roadmap to active to completed             |
| deferred to active    | Must return to roadmap first | deferred to roadmap to active              |
| deferred to completed | Cannot skip two states       | deferred to roadmap to active to completed |
| completed to any      | Terminal state               | Use unlock-reason tag to modify            |

**FSM Error Messages and Fixes**

**Context:** Process Guard validates FSM rules and provides specific error messages with fixes.

    **Error Reference:**

| Error                         | Cause                                          | Fix                                          |
| ----------------------------- | ---------------------------------------------- | -------------------------------------------- |
| completed-protection          | File has completed status but no unlock tag    | Add unlock-reason tag with hyphenated reason |
| invalid-status-transition     | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed  |
| scope-creep                   | Added deliverable to active spec               | Remove deliverable OR revert to roadmap      |
| session-scope (warning)       | Modified file outside session scope            | Add to scope OR use --ignore-session         |
| session-excluded              | Modified excluded pattern during session       | Remove from exclusion OR override            |
| deliverable-removed (warning) | Deliverable was removed from spec              | Informational only, verify intentional       |

**Escape Hatches**

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Available Escape Hatches:**

| Situation                    | Solution                  | Example                                                |
| ---------------------------- | ------------------------- | ------------------------------------------------------ |
| Fix bug in completed spec    | Add unlock-reason tag     | at-prefix-unlock-reason:'Fix-typo'                     |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session                 |
| CI treats warnings as errors | Use --strict flag         | lint-process --all --strict                            |
| Emergency hotfix             | Combine unlock + ignore   | at-prefix-unlock-reason:'Hotfix' plus --ignore-session |

    **Unlock Reason Constraints:**

    - Values cannot contain spaces (use hyphens)
    - Must describe why modification is needed
    - Is committed with the change for audit trail

**Handoff Documentation**

**Context:** Multi-session work requires state capture at session boundaries.

    **Template:**

```markdown
Session State

    - Last completed: Phase 1 - Core types
    - In progress: Phase 2 - Validation
    - Blockers: None

    Files Modified

    - src/types.ts - Added core types
    - src/validate.ts - Started validation (incomplete)

    Next Session

    1. FIRST: Complete validation in src/validate.ts
    2. Add integration tests
    3. Update deliverable statuses
```

**Required Elements:**

| Element        | Purpose                    |
| -------------- | -------------------------- |
| Last completed | What finished this session |
| In progress    | What is partially done     |
| Blockers       | What prevents progress     |
| Files Modified | Track changes for review   |
| Next Session   | Clear starting point       |

**Discovery Tags**

**Context:** Learnings discovered during sessions should be captured inline.

    **Decision:** Three discovery tag types are available:

| Tag                              | Purpose                       | Example                             |
| -------------------------------- | ----------------------------- | ----------------------------------- |
| at-prefix-discovered-gap         | Missing edge case or feature  | Missing-validation-for-empty-input  |
| at-prefix-discovered-improvement | Performance or DX enhancement | Cache-parsed-results                |
| at-prefix-discovered-learning    | Knowledge gained              | Gherkin-requires-strict-indentation |

    **Usage:** Add discovery tags as comments in feature files or code:

```gherkin
at-prefix-discovered-gap: Missing-edge-case-for-empty-input
    at-prefix-discovered-improvement: Cache-parsed-results
    at-prefix-discovered-learning: Gherkin-requires-strict-indentation
```

**Note:** Discovery tags use hyphens instead of spaces (tag values cannot contain spaces).

**Common Mistakes**

**Context:** Developers frequently make these mistakes when following session workflows.

    **Planning Session Mistakes:**

| Mistake                           | Why It Is Wrong                          | Correct Approach                               |
| --------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| Creating .ts implementation files | Planning only creates specs              | Create spec file only, no code                 |
| Transitioning to active           | Active requires implementation readiness | Keep status as roadmap                         |
| Asking Ready to implement?        | Planning session ends at roadmap spec    | End session after spec complete                |
| Writing full implementations      | Stubs only if Planning + Design          | Save implementation for Implementation session |

    **Implementation Session Mistakes:**

| Mistake                                | Why It Is Wrong                    | Correct Approach                      |
| -------------------------------------- | ---------------------------------- | ------------------------------------- |
| Writing code before transition         | FSM must be active first           | Change status to active FIRST         |
| Adding deliverables to active spec     | Scope-locked state prevents this   | Revert to roadmap to add scope        |
| Marking completed with incomplete work | Hard-locked state cannot be undone | Finish ALL deliverables first         |
| Skipping FSM transitions               | Process Guard will reject          | Follow roadmap to active to completed |
| Editing generated docs directly        | Will be overwritten                | Regenerate from source                |

    **Design Session Mistakes:**

| Mistake                            | Why It Is Wrong                            | Correct Approach                                                      |
| ---------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Creating markdown design documents | Decision specs provide better traceability | Record decisions as PDR .feature files in delivery-process/decisions/ |
| Creating implementation plans      | Design focuses on architecture             | Document options and decisions only                                   |
| Transitioning spec to active       | Requires implementation session            | Keep status as roadmap                                                |
| Writing full implementations       | Design creates stubs only                  | Use throw new Error pattern                                           |

**Related Documentation - Session Guides**

**Context:** Session guides connect to other documentation.

    **Decision:** Related docs by topic:

| Document                   | Content                                        |
| -------------------------- | ---------------------------------------------- |
| METHODOLOGY.md             | Core thesis, FSM states, two-tier architecture |
| GHERKIN-PATTERNS.md        | DataTables, DocStrings, Rule blocks            |
| CONFIGURATION.md           | Tag prefixes, presets                          |
| INSTRUCTIONS.md            | CLI commands, full tag reference               |
| PROCESS-GUARD-REFERENCE.md | FSM validation rules and CLI usage             |
| VALIDATION-REFERENCE.md    | DoD validation and anti-pattern detection      |

_Verified by: Reference generates Session Guides documentation_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
