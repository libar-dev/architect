@libar-docs
@libar-docs-pattern:ProcessGuardReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-lint
@libar-docs-claude-md-section:validation
Feature: Process Guard Reference - Auto-Generated Documentation

  **Problem:**
  Process Guard validates delivery workflow changes at commit time.
  Developers need quick access to validation rules, error messages, fixes, and CLI usage.
  Maintaining this documentation manually leads to drift from actual implementation.

  **Solution:**
  Auto-generate the Process Guard reference documentation from annotated source code.
  The source code defines the validation rules, error messages, and CLI options.
  Documentation becomes a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/PROCESSGUARDREFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/validation/processguardreference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| FSM Protection Levels | src/validation/fsm/states.ts | extract-shapes tag |
| FSM Valid Transitions | src/validation/fsm/transitions.ts | extract-shapes tag |
| FSM Diagram | THIS DECISION (Rule: FSM Diagram) | Fenced code block (Mermaid) |
| Validation Rules Types | src/lint/process-guard/types.ts | extract-shapes tag |
| Decider Function | src/lint/process-guard/decider.ts | extract-shapes tag |
| CLI Config | src/cli/lint-process.ts | extract-shapes tag |
| Escape Hatches | THIS DECISION (Rule: Escape Hatches) | Rule block table |
| Rule Descriptions | THIS DECISION (Rule: Rule Descriptions) | Rule block table |
| CLI Usage | THIS DECISION (Rule: CLI Usage) | Rule block content |
| Error Messages and Fixes | THIS DECISION (Rule: Error Messages and Fixes) | Rule block content |
| Programmatic API | THIS DECISION (Rule: Programmatic API) | Rule block content |
| Architecture | THIS DECISION (Rule: Architecture) | Rule block content |
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Process Guard reference feature file | complete | delivery-process/recipes/process-guard-reference.feature |
      | Generated detailed docs | pending | docs-generated/docs/PROCESSGUARDREFERENCE.md |
      | Generated compact docs | pending | docs-generated/_claude-md/validation/processguardreference.md |

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
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |

  Rule: Rule Descriptions

    Process Guard validates 6 rules (types extracted from TypeScript):

| Rule | Severity | Human Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
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
  Scenario: Reference generates Process Guard documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all validation rules
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And Mermaid diagrams are included in output
