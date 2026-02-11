@libar-docs
@libar-docs-adr:006
@libar-docs-adr-status:accepted
@libar-docs-adr-category:process
@libar-docs-pattern:ProcessGuard
@libar-docs-phase:99
@libar-docs-status:completed
@libar-docs-completed:2026-01-29
@libar-docs-product-area:Validation
@libar-docs-claude-md-section:validation
@libar-docs-unlock-reason:Migrate-recipe-content-for-codec-reference-gen
@libar-docs-convention:fsm-rules
Feature: ADR-006 - Process Guard Validation System

  **Context:**
  The delivery workflow needs protection against accidental modifications:
  - Completed specs get modified without explicit unlock reason
  - Status transitions bypass FSM rules (e.g., roadmap -> completed)
  - Active specs expand scope unexpectedly with new deliverables
  - Changes occur outside session boundaries without warning

  Without validation, the delivery process relies on human discipline alone.
  Mistakes ripple through documentation generation and workflow tracking.

  **Decision:**
  Implement a Decider-based linter that validates git changes at commit time:
  - **Pure functions:** No I/O in validation logic, easy to test
  - **Derived state:** State computed from file annotations, not stored separately
  - **Protection levels:** Files inherit protection from `@libar-docs-status` tag
  - **FSM enforcement:** Transitions validated against PDR-005 state machine
  - **Session scoping:** Warnings for out-of-scope files, errors for excluded files
  - **Escape hatch:** `@libar-docs-unlock-reason` allows modifying completed specs

  **Consequences:**
  - (+) Invalid workflow transitions caught before commit
  - (+) Scope creep prevented on active specs
  - (+) Completed work protected from accidental modification
  - (+) Session boundaries enforce focus
  - (-) Learning curve for unlock-reason workflow
  - (-) Requires pre-commit hook setup

  **Target Documents:**

  | Output | Purpose | Detail Level |
  | docs/PROCESS-GUARD.md | Detailed human reference | detailed |
  | _claude-md/validation/process-guard.md | Compact AI context | summary |

  **Source Mapping:**

  | Section | Source File | Extraction Method |
  | Context | THIS DECISION (Rule: Context - Why Process Guard Exists) | Decision rule description |
  | How It Works | THIS DECISION (Rule: Decision - How Process Guard Works) | Decision rule description |
  | Trade-offs | THIS DECISION (Rule: Consequences - Trade-offs of This Approach) | Decision rule description |
  | Validation Rules | tests/features/validation/process-guard.feature | Rule blocks |
  | Protection Levels | delivery-process/specs/process-guard-linter.feature | Scenario Outline Examples |
  | Valid Transitions | delivery-process/specs/process-guard-linter.feature | Scenario Outline Examples |
  | API Types | src/lint/process-guard/types.ts | @extract-shapes tag |
  | Decider API | src/lint/process-guard/decider.ts | @extract-shapes tag |
  | CLI Options | src/cli/lint-process.ts | JSDoc section |
  | Error Messages | src/lint/process-guard/decider.ts | createViolation() patterns |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Process Guard decision document | complete | delivery-process/decisions/adr-006-process-guard.feature |
      | Generated compact docs | pending | _claude-md/validation/process-guard.md |
      | Generated detailed docs | pending | docs/PROCESS-GUARD.md |

  Rule: Context - Why Process Guard Exists

    The delivery workflow defines states for specifications:
    - **roadmap:** Planning phase, fully editable
    - **active:** Implementation in progress, scope-locked
    - **completed:** Work finished, hard-locked
    - **deferred:** Parked work, fully editable

    Without enforcement, these states are advisory only. Process Guard
    makes them enforceable through pre-commit validation.

  Rule: Decision - How Process Guard Works

    Process Guard implements 7 validation rules:

    | Rule ID | Severity | What It Checks |
    | completed-protection | error | Completed specs require unlock reason |
    | invalid-status-transition | error | Transitions must follow FSM |
    | scope-creep | error | Active specs cannot add deliverables |
    | session-excluded | error | Cannot modify excluded files |
    | missing-relationship-target | warning | Relationship target must exist |
    | session-scope | warning | File outside session scope |
    | deliverable-removed | warning | Deliverable was removed |

    The linter runs as a pre-commit hook via Husky.
    See `.husky/pre-commit` for the hook configuration.

    Pre-commit: `npx lint-process --staged`
    CI pipeline: `npx lint-process --all --strict`

  Rule: Consequences - Trade-offs of This Approach

    **Benefits:**
    - Catches workflow errors before they enter git history
    - Prevents accidental scope creep during active development
    - Protects completed work from unintended modifications
    - Clear escape hatch via unlock-reason annotation

    **Costs:**
    - Requires understanding of FSM states and transitions
    - Initial friction when modifying completed specs
    - Pre-commit hook adds a few seconds to commit time

  Rule: FSM Diagram

    The FSM enforces valid state transitions. Protection levels and transitions
    are defined in TypeScript (extracted via @extract-shapes).

    """mermaid
    stateDiagram-v2
        [*] --> roadmap
        roadmap --> active : Start work
        roadmap --> deferred : Postpone
        active --> completed : Finish
        active --> roadmap : Regress (blocked)
        deferred --> roadmap : Resume
        completed --> [*]

        note right of completed : Terminal state
        note right of active : Scope-locked
    """

  Rule: Escape Hatches

    **Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Decision:** These escape hatches are available:

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI warnings blocking pipeline | Omit --strict flag | lint-process --all (warnings won't fail) |

  Rule: Rule Descriptions

    Process Guard validates 7 rules (types extracted from TypeScript):

| Rule | Severity | Human Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
| missing-relationship-target | warning | Relationship target must exist |
| session-scope | warning | File not in active session scope |
| deliverable-removed | warning | Deliverable was removed (informational) |

  Rule: Error Messages and Fixes

    **Context:** Each validation rule produces a specific error message with actionable fix guidance.

    **Error Message Reference:**

| Rule | Severity | Example Error | Fix |
| --- | --- | --- | --- |
| completed-protection | error | Cannot modify completed spec without unlock reason | Add unlock-reason tag |
| invalid-status-transition | error | Invalid status transition: roadmap to completed | Follow FSM path |
| scope-creep | error | Cannot add deliverables to active spec | Remove deliverable or revert to roadmap |
| missing-relationship-target | warning | Missing relationship target: "PatternX" referenced by "PatternY" | Add target pattern or remove relationship |
| session-scope | warning | File not in active session scope | Add to scope or use --ignore-session |
| session-excluded | error | File is explicitly excluded from session | Remove from exclusion or use --ignore-session |
| deliverable-removed | warning | Deliverable removed: "Unit tests" | Informational only |

    **Common Invalid Transitions:**

| Attempted | Why Invalid | Valid Path |
| --- | --- | --- |
| roadmap to completed | Must go through active | roadmap to active to completed |
| deferred to active | Must return to roadmap first | deferred to roadmap to active |
| deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
| completed to any | Terminal state | Use unlock-reason tag to modify |

    **Fix Patterns:**

    1. **completed-protection**: Add `unlock-reason` tag with hyphenated reason
    2. **invalid-status-transition**: Follow FSM path (roadmap to active to completed)
    3. **scope-creep**: Remove new deliverable OR revert status to `roadmap` temporarily
    4. **session-scope**: Add file to session scope OR use `--ignore-session` flag
    5. **session-excluded**: Remove from exclusion list OR use `--ignore-session` flag
    6. **missing-relationship-target**: Add target pattern OR remove the relationship

    For detailed fix examples with code snippets, see [PROCESS-GUARD.md](/docs/PROCESS-GUARD.md).

  Rule: CLI Usage

    Process Guard is invoked via the lint-process CLI command.
    Configuration interface (`ProcessGuardCLIConfig`) is extracted from `src/cli/lint-process.ts`.

    **CLI Commands:**

| Command | Purpose |
| --- | --- |
| `lint-process --staged` | Pre-commit validation (default mode) |
| `lint-process --all --strict` | CI pipeline with strict mode |
| `lint-process --file specs/my-feature.feature` | Validate specific file |
| `lint-process --staged --show-state` | Debug: show derived process state |
| `lint-process --staged --ignore-session` | Override session scope checking |

    **CLI Options:**

| Option | Description |
| --- | --- |
| `--staged` | Validate staged files only (pre-commit) |
| `--all` | Validate all tracked files (CI) |
| `--strict` | Treat warnings as errors (exit 1) |
| `--ignore-session` | Skip session scope validation |
| `--show-state` | Debug: show derived process state |
| `--format json` | Machine-readable JSON output |
| `--file <path>` | Validate a specific file |

    **Integration:** See `.husky/pre-commit` for pre-commit hook setup and `package.json` scripts section for npm script configuration.

  Rule: Programmatic API

    Process Guard can be used programmatically for custom integrations.

    **Usage Example:**

    """typescript
    import {
      deriveProcessState,
      detectStagedChanges,
      validateChanges,
      hasErrors,
      summarizeResult,
    } from '@libar-dev/delivery-process/lint';

    const state = (await deriveProcessState({ baseDir: '.' })).value;
    const changes = detectStagedChanges('.').value;
    const { result } = validateChanges({
      state,
      changes,
      options: { strict: false, ignoreSession: false },
    });

    if (hasErrors(result)) {
      console.log(summarizeResult(result));
      for (const v of result.violations) {
        console.log(`[${v.rule}] ${v.file}: ${v.message}`);
      }
      process.exit(1);
    }
    """

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

  Rule: Architecture

    Process Guard uses the Decider pattern for testable validation.

    **Data Flow Diagram:**

    """mermaid
    flowchart LR
        A[deriveProcessState] --> C[validateChanges]
        B[detectChanges] --> C
        C --> D[ValidationResult]

        subgraph Pure Functions
            C
        end

        subgraph I/O
            A
            B
        end
    """

    **Principle:** State is derived from file annotations - there is no separate state file to maintain.

  Rule: Related Documentation

    **Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| VALIDATION-REFERENCE.md | Sibling | DoD validation, anti-pattern detection |
| SESSION-GUIDES-REFERENCE.md | Prerequisite | Planning/Implementation workflows that Process Guard enforces |
| CONFIGURATION-REFERENCE.md | Reference | Presets and tag configuration |
| METHODOLOGY-REFERENCE.md | Background | Code-first documentation philosophy |

  @acceptance-criteria
  Scenario: ADR generates Process Guard documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then "docs/PROCESS-GUARD.md" is generated with detailed content
    And "_claude-md/validation/process-guard.md" is generated with compact content
    And content is extracted from the mapped source files
