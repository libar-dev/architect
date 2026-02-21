@libar-docs
@libar-docs-pattern:ConfigBasedWorkflowDefinition
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-missing-Invariant-Rationale-annotations
@libar-docs-phase:99
@libar-docs-effort:2h
@libar-docs-product-area:Configuration
@libar-docs-include:reference-sample,process-workflow
@libar-docs-depends-on:MvpWorkflowImplementation
@libar-docs-business-value:eliminate-broken-workflow-loading
@libar-docs-priority:high
Feature: Config-Based Workflow Definition

  **Problem:**
  Every `pnpm process:query` and `pnpm docs:*` invocation prints:
  `Failed to load default workflow (6-phase-standard): Workflow file not found`

  The `loadDefaultWorkflow()` function resolves to `catalogue/workflows/`
  which does not exist. The directory was deleted during monorepo extraction.
  The system already degrades gracefully (workflow = undefined), but the
  warning is noise for both human CLI use and future hook consumers (HUD).

  The old `6-phase-standard.json` conflated three concerns:
  - Taxonomy vocabulary (status names) — already in `src/taxonomy/`
  - FSM behavior (transitions) — already in `src/validation/fsm/`
  - Workflow structure (phases) — orphaned, no proper home

  **Solution:**
  Inline the default workflow as a constant in `workflow-loader.ts`, built
  from canonical taxonomy values. Make `loadDefaultWorkflow()` synchronous.
  Preserve `loadWorkflowFromPath()` for custom `--workflow <file>` overrides.

  The workflow definition uses only the 4 canonical statuses from ADR-001
  (roadmap, active, completed, deferred) — not the stale 5-status set from
  the deleted JSON (which included non-canonical `implemented` and `partial`).

  Phase definitions (Inception, Elaboration, Session, Construction,
  Validation, Retrospective) move from a missing JSON file to an inline
  constant, making the default workflow always available without file I/O.

  Design Decisions (DS-1, 2026-02-15):

  | ID | Decision | Rationale |
  | DD-1 | Inline constant in workflow-loader.ts, not preset integration | Minimal correct fix, zero type regression risk. Preset integration deferred. |
  | DD-2 | Constant satisfies existing WorkflowConfig type | Reuse createLoadedWorkflow() from workflow-config.ts. No new types needed. |
  | DD-3 | Remove dead code: getCatalogueWorkflowsPath, loadWorkflowConfig, DEFAULT_WORKFLOW_NAME | Dead since monorepo extraction. Public API break is safe (function always threw). |
  | DD-4 | loadDefaultWorkflow() returns LoadedWorkflow synchronously | Infallible constant needs no async or error handling. |
  | DD-5 | Amend ADR-001 with canonical phase definitions | Phase names are canonical values; fits existing governance in ADR-001. |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Inline default workflow constant | complete | src/config/workflow-loader.ts |
      | Make loadDefaultWorkflow synchronous | complete | src/config/workflow-loader.ts |
      | Remove dead code paths | complete | src/config/workflow-loader.ts |
      | Update public API exports | complete | src/config/index.ts |
      | Remove async and try-catch in orchestrator | complete | src/generators/orchestrator.ts |
      | Remove async and try-catch in process-api | complete | src/cli/process-api.ts |
      | Delete orphaned JSON file | n/a | delivery-process/6-phase-standard.json |
      | Amend ADR-001 with phase definitions rule | complete | delivery-process/decisions/adr-001-taxonomy-canonical-values.feature |

  # ============================================================================
  # RULE 1: Default workflow is always available without file I/O
  # ============================================================================

  Rule: Default workflow is built from an inline constant

    **Invariant:** `loadDefaultWorkflow()` returns a `LoadedWorkflow` without
    file system access. It cannot fail. The default workflow constant uses
    only canonical status values from `src/taxonomy/status-values.ts`.

    **Rationale:** The file-based loading path (`catalogue/workflows/`) has
    been dead code since monorepo extraction. Both callers (orchestrator,
    process-api) already handle the failure gracefully, proving the system
    works without it. Making the function synchronous and infallible removes
    the try-catch ceremony and the warning noise.

    **Verified by:** Default workflow loads without warning,
    Workflow constant uses canonical statuses only

    Implementation approach:

    | Step | Change | Impact |
    | Add DEFAULT_WORKFLOW_CONFIG constant | WorkflowConfig literal with 4 statuses, 6 phases | New code in workflow-loader.ts |
    | Change loadDefaultWorkflow() to sync | Returns createLoadedWorkflow(DEFAULT_WORKFLOW_CONFIG) | Signature: Promise to sync |
    | Remove dead code paths | Delete getCatalogueWorkflowsPath, loadWorkflowConfig, DEFAULT_WORKFLOW_NAME, dead imports | workflow-loader.ts cleanup |
    | Remove loadWorkflowConfig from public API | Update src/config/index.ts exports | Breaking change (safe: function always threw) |
    | Update orchestrator call site | Remove await and try-catch (lines 410-418) | orchestrator.ts |
    | Update process-api call site | Remove await and try-catch (lines 549-555) | process-api.ts |

    @acceptance-criteria @happy-path
    Scenario: Default workflow loads without warning
      Given the delivery-process package with no workflow JSON file
      When the process-api runs an overview command
      Then no workflow warning appears in output
      And the overview displays progress, active phases, and blocking info

    @acceptance-criteria @validation
    Scenario: Workflow constant uses canonical statuses only
      Given the inline DEFAULT_WORKFLOW_CONFIG constant
      Then it defines exactly 4 statuses: roadmap, active, completed, deferred
      And it defines 6 phases with order 1 through 6
      And each status name exists in PROCESS_STATUS_VALUES from taxonomy

  # ============================================================================
  # RULE 2: Custom workflow override is preserved
  # ============================================================================

  Rule: Custom workflow files still work via --workflow flag

    **Invariant:** `loadWorkflowFromPath()` remains available for projects
    that need custom workflow definitions. The `--workflow <file>` CLI flag
    and `workflowPath` config field continue to work.

    **Rationale:** The inline default replaces file-based *default* loading,
    not file-based *custom* loading. Projects may define custom phases or
    additional statuses via JSON files.

    **Verified by:** Custom workflow file overrides default

    @acceptance-criteria @happy-path
    Scenario: Custom workflow file overrides default
      Given a project with workflowPath set to a custom JSON file
      When the orchestrator loads workflow configuration
      Then it uses the custom workflow from the file path
      And the default inline workflow is not used

  # ============================================================================
  # RULE 3: No FSM or Process Guard changes
  # ============================================================================

  Rule: FSM validation and Process Guard are not affected

    **Invariant:** The FSM transition matrix, protection levels, and Process
    Guard rules remain hardcoded in `src/validation/fsm/` and
    `src/lint/process-guard/`. They do not read from `LoadedWorkflow`.

    **Rationale:** FSM and workflow are separate concerns. FSM enforces
    status transitions (4-state model from PDR-005). Workflow defines phase
    structure (6-phase USDP). The workflow JSON declared `transitionsTo` on
    its statuses, but no code ever read those values — the FSM uses its own
    `VALID_TRANSITIONS` constant. This separation is correct and intentional.

    Blast radius analysis confirmed zero workflow imports in:
    - src/validation/fsm/ (4 files)
    - src/lint/process-guard/ (5 files)
    - src/taxonomy/ (all files)

  # ============================================================================
  # DEFERRED: Workflow in preset/config system
  # ============================================================================

  Rule: Workflow as a configurable preset field is deferred

    **Invariant:** The inline default workflow constant is the only workflow source until preset integration is implemented. No preset or project config field exposes workflow customization.
    **Rationale:** Coupling workflow into the preset/config system before the inline fix ships would widen the blast radius and risk type regressions across all config consumers.

    Adding `workflow` as a field on `DeliveryProcessConfig` (presets) and
    `DeliveryProcessProjectConfig` (project config) is a natural next step
    but NOT required for the MVP fix.

    The inline constant in `workflow-loader.ts` resolves the warning. Moving
    workflow into the preset/config system enables:
    - Different presets with different default phases (e.g., 3-phase generic)
    - Per-project phase customization in delivery-process.config.ts
    - Phase definitions appearing in generated documentation

    See ideation artifact for design options:
    delivery-process/ideations/2026-02-15-workflow-config-and-fsm-extensibility.feature
