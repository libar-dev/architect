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
| Protection Levels | THIS DECISION (Rule: Protection Levels) | Rule block table |
| Valid Transitions | THIS DECISION (Rule: Valid Transitions) | Rule block table |
| FSM Diagram | THIS DECISION (Rule: Valid Transitions DocString) | Fenced code block (Mermaid) |
| Validation Rules | src/lint/process-guard/types.ts | @extract-shapes tag |
| Decider Function | src/lint/process-guard/decider.ts | @extract-shapes tag |
| CLI Config | src/cli/lint-process.ts | @extract-shapes tag |
| FSM Transitions | src/validation/fsm/transitions.ts | @extract-shapes tag |
| CLI Examples | THIS DECISION (Rule: CLI Usage DocString) | Fenced code block |
| API Example | THIS DECISION (Rule: Programmatic API DocString) | Fenced code block |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Process Guard reference feature file | Complete | specs/docs/process-guard-reference.feature |
      | Generated detailed docs | Pending | docs-generated/docs/PROCESSGUARDREFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/validation/processguardreference.md |

  Rule: Protection Levels

    **Context:** Different FSM states have different protection levels.

    **Decision:** Protection levels are derived from status:

| Status | Level | Allowed | Blocked |
| --- | --- | --- | --- |
| roadmap | none | Full editing | - |
| deferred | none | Full editing | - |
| active | scope | Edit existing deliverables | Adding new deliverables |
| completed | hard | Nothing | Any change without unlock-reason |

  Rule: Valid Transitions

    **Context:** Status transitions must follow the FSM to maintain process integrity.

| From | To | Notes |
| --- | --- | --- |
| roadmap | active, deferred | Start work or postpone |
| active | completed, roadmap | Finish or regress if blocked |
| deferred | roadmap | Resume planning |
| completed | (none) | Terminal - use unlock to modify |

    **FSM Diagram:**

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

  Rule: Validation Rules

    Process Guard validates these rules:

| Rule | Severity | Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
| session-scope | warning | File not in active session scope |
| deliverable-removed | warning | Deliverable was removed (informational) |

  Rule: CLI Usage

    Process Guard is invoked via the lint-process CLI command.

| Flag | Description | Use Case |
| --- | --- | --- |
| --staged | Validate staged changes (default) | Pre-commit hooks |
| --all | Validate all changes vs main | CI/CD pipelines |
| --strict | Treat warnings as errors | CI enforcement |
| --ignore-session | Skip session scope rules | Emergency changes |
| --show-state | Show derived process state | Debugging |
| --format json | Machine-readable output | CI integration |

    **CLI Examples:**

    """bash
    lint-process --staged
    lint-process --all --strict
    lint-process --file specs/my-feature.feature
    lint-process --staged --show-state
    lint-process --staged --ignore-session
    """

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

  @acceptance-criteria
  Scenario: Reference generates Process Guard documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all validation rules
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And Mermaid diagrams are included in output
