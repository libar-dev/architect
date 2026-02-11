# Session Guides Reference

**Purpose:** Reference document: Session Guides Reference
**Detail Level:** Full reference

---

## DD-1 - Text output with section markers per ADR-008

Both scope-validate and handoff return string from the router, using
    === SECTION === markers. This follows the dual output path established
    by ADR-008. Both commands are AI-consumption focused — JSON wrapping
    adds overhead without benefit.

---

## DD-2 - Git integration is opt-in via --git flag

The handoff command accepts an optional --git flag. When present, the
    CLI handler calls git diff and passes the file list to the pure
    generator function. The generator receives modifiedFiles as an optional
    readonly string array — no shell dependency in the domain logic.

**Rationale:** Pure functions are testable without mocking child_process. The git call stays in the CLI handler (I/O boundary), not the generator.

---

## DD-3 - Session type inferred from FSM status

The handoff command infers session type from the pattern's current
    FSM status. An explicit --session flag overrides inference.

---

## DD-4 - Severity levels match Process Guard model

Scope validation uses three severity levels. BLOCKED prevents session
    start. WARN indicates suboptimal readiness but does not block.

    The --strict flag (consistent with lint-process) promotes WARN to BLOCKED.

---

## DD-5 - Current date only for handoff

The handoff command always uses the current date. No --date flag.
    Handoff is run at session end; backdating is a rare edge case not
    worth the API surface area.

---

## DD-6 - Both positional and flag forms for scope type

scope-validate accepts the scope type as either a positional argument
    or a --type flag: both "scope-validate MyPattern implement" and
    "scope-validate MyPattern --type implement" work.

    This matches how dep-tree accepts --depth as both positional and flag.

---

## DD-7 - Co-located formatter functions

Each new module (scope-validator.ts, handoff-generator.ts) exports
    both the data builder and the text formatter. Unlike the
    context-assembler/context-formatter split (justified by ContextBundle
    complexity), these commands are simpler and benefit from co-location.

**Rationale:** Avoids file proliferation. The formatter for scope validation is ~30 lines; separating it into its own file adds overhead without benefit. If complexity grows, the split can happen later.

---

## Session Decision Tree

**Tag Notation:** In Rule descriptions below, "at-prefix" stands for the configured tag prefix (e.g., "@libar-docs-"), escaped to avoid Gherkin tag parsing.

    **Context:** Developers need to choose the correct session type based on their current situation.

    **Decision Tree (ASCII):**

    

    **Decision:** Session types map to inputs, outputs, and FSM changes:

| Session | Input | Output | FSM Change |
| --- | --- | --- | --- |
| Planning | Pattern brief | Roadmap spec (.feature) | Creates roadmap |
| Design | Complex requirement | Decision specs + code stubs | None |
| Implementation | Roadmap spec | Code + tests | roadmap to active to completed |
| Planning + Design | Pattern brief | Spec + stubs | Creates roadmap |

---

## Planning Session

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

| Forbidden Action | Rationale |
| --- | --- |
| Create .ts implementation files | Planning only creates specs |
| Transition to active | Active requires implementation readiness |
| Ask Ready to implement? | Planning session ends at roadmap spec |
| Write full implementations | Stubs only if Planning + Design |

---

## Design Session

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

    **When Required:**

    **Checklist:**

    1. Record architectural decisions as PDR .feature files in delivery-process/decisions/

    2. Document options (at least 2-3 approaches with pros/cons in Rule blocks)

    3. Get approval (user must approve recommended approach)

    4. Create code stubs in delivery-process/stubs/{pattern-name}/ with at-prefix-implements and Target: annotations

    **Code Stub Pattern:**

    

    **Do NOT:**

| Use Design Session | Skip Design Session |
| --- | --- |
| Multiple valid approaches | Single obvious path |
| New patterns/capabilities | Bug fix |
| Cross-context coordination | Clear requirements |

| Forbidden Action | Rationale |
| --- | --- |
| Create markdown design documents | Decision specs provide better traceability with structured tags |
| Create implementation plans | Design focuses on architecture |
| Transition spec to active | Requires implementation session |
| Write full implementations | Stubs only |

---

## Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

    **Pre-flight Requirements:**

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

| Requirement | Why |
| --- | --- |
| Roadmap spec exists with at-prefix-status:roadmap | Cannot implement without spec |
| Decision specs approved (if needed) | Complex decisions need approval |
| Implementation plan exists (for multi-session work) | Prevents scope drift |

| Forbidden Action | Rationale |
| --- | --- |
| Add new deliverables to active spec | Scope-locked state prevents this |
| Mark completed with incomplete work | Hard-locked state cannot be undone |
| Skip FSM transitions | Process Guard will reject |
| Edit generated docs directly | Regenerate from source |

---

## Planning + Design Session

**Goal:** Create spec AND code stubs in one session. For immediate implementation handoff.

    **When to Use:**

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

| Use Planning + Design | Use Planning Only |
| --- | --- |
| Need stubs for implementation | Only enhancing spec |
| Preparing for immediate handoff | Still exploring requirements |
| Want complete two-tier architecture | Do not need Tier 2 yet |

---

## FSM Protection

**Context:** The FSM (Finite State Machine) protects work integrity through state-based restrictions.

    **Decision:** Protection levels and valid transitions are defined in TypeScript source:
    - Protection levels: See `PROTECTION_LEVELS` in `src/validation/fsm/states.ts`
    - Valid transitions: See `VALID_TRANSITIONS` in `src/validation/fsm/transitions.ts`

    **Protection Levels:**

    **Valid FSM Transitions:**

    **Invalid Transitions (will fail validation):**

| State | Protection | Can Add Deliverables | Needs Unlock | Allowed Actions | Blocked Actions |
| --- | --- | --- | --- | --- | --- |
| roadmap | None | Yes | No | Full editing, add deliverables | None |
| deferred | None | Yes | No | Full editing, add deliverables | None |
| active | Scope-locked | No | No | Edit existing deliverables | Adding new deliverables |
| completed | Hard-locked | No | Yes | Nothing | Any change without unlock tag |

| From | To | Trigger | Notes |
| --- | --- | --- | --- |
| roadmap | active | Start work | Locks scope |
| roadmap | deferred | Postpone | For deprioritized work |
| active | completed | Finish | Terminal state |
| active | roadmap | Regress | For blocked work |
| deferred | roadmap | Resume | To restart planning |

| Attempted | Why Invalid | Valid Path |
| --- | --- | --- |
| roadmap to completed | Must go through active | roadmap to active to completed |
| deferred to active | Must return to roadmap first | deferred to roadmap to active |
| deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
| completed to any | Terminal state | Use unlock-reason tag to modify |

---

## FSM Error Messages and Fixes

**Context:** Process Guard validates FSM rules and provides specific error messages with fixes.

    **Error Reference:**

| Error | Cause | Fix |
| --- | --- | --- |
| completed-protection | File has completed status but no unlock tag | Add unlock-reason tag with hyphenated reason |
| invalid-status-transition | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed |
| scope-creep | Added deliverable to active spec | Remove deliverable OR revert to roadmap |
| session-scope (warning) | Modified file outside session scope | Add to scope OR use --ignore-session |
| session-excluded | Modified excluded pattern during session | Remove from exclusion OR override |
| deliverable-removed (warning) | Deliverable was removed from spec | Informational only, verify intentional |

---

## Escape Hatches

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Available Escape Hatches:**

    **Unlock Reason Constraints:**

    - Values cannot contain spaces (use hyphens)
    - Must describe why modification is needed
    - Is committed with the change for audit trail

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | at-prefix-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |
| Emergency hotfix | Combine unlock + ignore | at-prefix-unlock-reason:'Hotfix' plus --ignore-session |

---

## Handoff Documentation

**Context:** Multi-session work requires state capture at session boundaries.

    **Template:**

    

    **Required Elements:**

| Element | Purpose |
| --- | --- |
| Last completed | What finished this session |
| In progress | What is partially done |
| Blockers | What prevents progress |
| Files Modified | Track changes for review |
| Next Session | Clear starting point |

---

## Discovery Tags

**Context:** Learnings discovered during sessions should be captured inline.

    **Decision:** Three discovery tag types are available:

    **Usage:** Add discovery tags as comments in feature files or code:

    

    **Note:** Discovery tags use hyphens instead of spaces (tag values cannot contain spaces).

| Tag | Purpose | Example |
| --- | --- | --- |
| at-prefix-discovered-gap | Missing edge case or feature | Missing-validation-for-empty-input |
| at-prefix-discovered-improvement | Performance or DX enhancement | Cache-parsed-results |
| at-prefix-discovered-learning | Knowledge gained | Gherkin-requires-strict-indentation |

---

## Common Mistakes

**Context:** Developers frequently make these mistakes when following session workflows.

    **Planning Session Mistakes:**

    **Implementation Session Mistakes:**

    **Design Session Mistakes:**

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating .ts implementation files | Planning only creates specs | Create spec file only, no code |
| Transitioning to active | Active requires implementation readiness | Keep status as roadmap |
| Asking Ready to implement? | Planning session ends at roadmap spec | End session after spec complete |
| Writing full implementations | Stubs only if Planning + Design | Save implementation for Implementation session |

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Writing code before transition | FSM must be active first | Change status to active FIRST |
| Adding deliverables to active spec | Scope-locked state prevents this | Revert to roadmap to add scope |
| Marking completed with incomplete work | Hard-locked state cannot be undone | Finish ALL deliverables first |
| Skipping FSM transitions | Process Guard will reject | Follow roadmap to active to completed |
| Editing generated docs directly | Will be overwritten | Regenerate from source |

| Mistake | Why It Is Wrong | Correct Approach |
| --- | --- | --- |
| Creating markdown design documents | Decision specs provide better traceability | Record decisions as PDR .feature files in delivery-process/decisions/ |
| Creating implementation plans | Design focuses on architecture | Document options and decisions only |
| Transitioning spec to active | Requires implementation session | Keep status as roadmap |
| Writing full implementations | Design creates stubs only | Use throw new Error pattern |

---

## Related Documentation - Session Guides

**Context:** Session guides connect to other documentation.

    **Decision:** Related docs by topic:

| Document | Content |
| --- | --- |
| METHODOLOGY.md | Core thesis, FSM states, two-tier architecture |
| GHERKIN-PATTERNS.md | DataTables, DocStrings, Rule blocks |
| CONFIGURATION.md | Tag prefixes, presets |
| INSTRUCTIONS.md | CLI commands, full tag reference |
| PROCESS-GUARD-REFERENCE.md | FSM validation rules and CLI usage |
| VALIDATION-REFERENCE.md | DoD validation and anti-pattern detection |

---

## Context - Why Process Guard Exists

The delivery workflow defines states for specifications:
    - **roadmap:** Planning phase, fully editable
    - **active:** Implementation in progress, scope-locked
    - **completed:** Work finished, hard-locked
    - **deferred:** Parked work, fully editable

    Without enforcement, these states are advisory only. Process Guard
    makes them enforceable through pre-commit validation.

---

## Decision - How Process Guard Works

Process Guard implements 7 validation rules:

    The linter runs as a pre-commit hook via Husky.
    See `.husky/pre-commit` for the hook configuration.

    Pre-commit: `npx lint-process --staged`
    CI pipeline: `npx lint-process --all --strict`

---

## Consequences - Trade-offs of This Approach

**Benefits:**
    - Catches workflow errors before they enter git history
    - Prevents accidental scope creep during active development
    - Protects completed work from unintended modifications
    - Clear escape hatch via unlock-reason annotation

    **Costs:**
    - Requires understanding of FSM states and transitions
    - Initial friction when modifying completed specs
    - Pre-commit hook adds a few seconds to commit time

---

## FSM Diagram

The FSM enforces valid state transitions. Protection levels and transitions
    are defined in TypeScript (extracted via @extract-shapes).

---

## Escape Hatches

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Decision:** These escape hatches are available:

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI warnings blocking pipeline | Omit --strict flag | lint-process --all (warnings won't fail) |

---

## Rule Descriptions

Process Guard validates 7 rules (types extracted from TypeScript):

| Rule | Severity | Human Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
| missing-relationship-target | warning | Relationship target pattern must exist |
| session-scope | warning | File not in active session scope |
| deliverable-removed | warning | Deliverable was removed (informational) |

---

## Error Messages and Fixes

**Context:** Each validation rule produces a specific error message with actionable fix guidance.

    **Error Message Reference:**

    **Common Invalid Transitions:**

    **Fix Patterns:**

    1. **completed-protection**: Add `unlock-reason` tag with hyphenated reason
    2. **invalid-status-transition**: Follow FSM path (roadmap to active to completed)
    3. **scope-creep**: Remove new deliverable OR revert status to `roadmap` temporarily
    4. **session-scope**: Add file to session scope OR use `--ignore-session` flag
    5. **session-excluded**: Remove from exclusion list OR use `--ignore-session` flag

    For detailed fix examples with code snippets, see [PROCESS-GUARD.md](/docs/PROCESS-GUARD.md).

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

Process Guard is invoked via the lint-process CLI command.
    Configuration interface (`ProcessGuardCLIConfig`) is extracted from `src/cli/lint-process.ts`.

    **CLI Commands:**

    **CLI Options:**

    **Integration:** See `.husky/pre-commit` for pre-commit hook setup and `package.json` scripts section for npm script configuration.

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

---

## Programmatic API

Process Guard can be used programmatically for custom integrations.

    **Usage Example:**

    

    **API Functions:**

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

Process Guard uses the Decider pattern for testable validation.

    **Data Flow Diagram:**

    

    **Principle:** State is derived from file annotations - there is no separate state file to maintain.

---

## Related Documentation

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| VALIDATION-REFERENCE.md | Sibling | DoD validation, anti-pattern detection |
| SESSION-GUIDES-REFERENCE.md | Prerequisite | Planning/Implementation workflows that Process Guard enforces |
| CONFIGURATION-REFERENCE.md | Reference | Presets and tag configuration |
| METHODOLOGY-REFERENCE.md | Background | Code-first documentation philosophy |

---
