@ideation
@ideation-status:active
@ideation-scope:workflow-config,fsm-extensibility,preset-integration
@relates-to:ConfigBasedWorkflowDefinition,ADR001TaxonomyCanonicalValues,ProcessGuardLinter
Feature: Workflow Configuration, Process Instance, and FSM Extensibility

  # Trigger: `Failed to load default workflow` warning on every API call
  # MVP fix: ConfigBasedWorkflowDefinition spec (inline constant, sync loader)
  # This ideation captures the broader architectural direction beyond the MVP.

  # ============================================================================
  # PRESET INTEGRATION — NEXT STEP AFTER MVP
  # ============================================================================

  Rule: Workflow as a preset-level default

    When different presets need different default phases (e.g., 3-phase generic
    vs 6-phase USDP), the inline constant in workflow-loader.ts is insufficient.
    Workflow becomes a field on `ArchitectConfig`, like categories.

    **Option A: Preset-level default (recommended)**

    | Pro | Follows existing preset pattern (categories work this way) |
    | Pro | Generic preset could ship 3-phase, ddd-es-cqrs ships 6-phase |
    | Con | Presets are in src/config/presets.ts — mixes domain knowledge into config |

    **Option B: Separate taxonomy constant**

    Phase definitions in `src/taxonomy/phase-definitions.ts`, referenced by presets.

    | Pro | Source-first (ADR-003 aligned), scannable by extractor |
    | Pro | Phases become annotatable and appear in generated docs |
    | Con | Taxonomy is for vocabulary/constants; phases are structural |

  Rule: Type separation — WorkflowConfig conflates statuses and phases

    The MVP correctly reuses `WorkflowConfig` because it inlines the ENTIRE
    workflow (statuses + phases) as a single constant.

    For preset integration, only phases move to config; statuses stay in
    taxonomy. This means a NEW type is appropriate:

    | Type | Shape | Notes |
    | WorkflowPhaseDefinition | name, order, statusOnEntry? | Simpler than WorkflowPhase (no artifacts) |
    | WorkflowDefinition | phases array, optional metadata | Simpler than WorkflowConfig (no statuses) |

    The workflow field must be optional in config. When absent, preset default
    applies. When preset has no workflow, the system works without phases
    (current behavior — graceful degradation).

  Rule: ADR-001 amendment may need revisiting

    DD-5 amends ADR-001 with canonical phase names (the 6 USDP phases).
    If workflow becomes configurable (per-preset phases), the decision changes
    from "these are THE phases" to "these are DEFAULT phases" — which may
    warrant a separate ADR.

  # ============================================================================
  # FSM EXTENSIBILITY — FUTURE DIRECTION
  # ============================================================================

  Rule: The FSM will need more states — but not today

    Current 4-state FSM (roadmap, active, completed, deferred) covers the
    linear plan-do-done workflow. Gaps identified:

    | Gap | Current Workaround | When It Hurts |
    | Pre-planning exploration/ideation | Not tracked by FSM | HUD hooks need to detect and support pre-planning sessions |
    | Review/approval gate | Implicit (deliverables checked manually) | When Process Guard needs to enforce review before completion |
    | Blocked (explicit, not regression) | `active -> roadmap` (loses "was active" context) | When tracking blocked patterns distinctly from planned ones |

    A `discovery` or `ideation` status could precede `roadmap`. This would
    formalize the exploratory work phase (like this session) where multiple
    concerns are investigated before any spec exists.

    PDR-013 (agent lifecycle FSM) shows the same pattern at a different scale:
    4 states, 7 events, Map-based O(1) lookups. When both FSMs coexist in the
    monorepo, the generic `defineFSM()` utility emerges from concrete need.

  Rule: Transition configurability — hardcoded is fine for now

    Making transitions configurable (per-preset or per-config) requires:
    - Every `VALID_TRANSITIONS[status]` reference to read from resolved config
    - Process Guard to accept configurable FSM instead of imported constant
    - Protection levels to become per-status configuration, not hardcoded map

    Significant refactoring with no immediate consumer. Revisit when a concrete
    need appears (e.g., a repo wanting 3 states, or adding `review` as a gate).

  # ============================================================================
  # MULTI-PROJECT AND OPEN-SOURCING
  # ============================================================================

  Rule: Three projects with different workflow requirements

    | Context | Workflow Needs | Config Complexity |
    | This package (delivery-process) | Full 6-phase, 298 patterns | Uses itself as POC |
    | Monorepo (libar-platform) | Full 6-phase, multi-package | Primary consumer |
    | Future adopters (open-source) | Minimal or custom phases | Must work with zero config |

    The preset system is the adoption ramp. `generic` preset with a simple
    3-phase workflow (Plan, Build, Ship) lowers the barrier. `ddd-es-cqrs`
    with 6-phase USDP is the full version.

  # ============================================================================
  # META: IDEATION AS AN ARTIFACT TYPE
  # ============================================================================

  Rule: Ideation-to-implementation is not 1:1

    Exploration sessions produce insights across multiple future specs, but
    there is no artifact type for "explored N things, here are the findings
    that feed M different implementation sessions."

    This ideation artifact is an experiment in that direction:

    | Property | Value |
    | Lives in | architect/ideations/ (not specs/, not decisions/) |
    | Format | Gherkin-structured but not executable |
    | FSM status | Not tracked (ideation precedes roadmap) |
    | Lifecycle | Active while useful, trimmed as specs consume content |

    **Open question:** Should ideation artifacts be scannable by the extractor?
    Selective opt-in via `@architect` tag matches the existing architecture —
    most stay invisible, the ones worth surfacing get a tag.
