@architect
@architect-pattern:SessionGuidesModuleSource
@architect-status:completed
@architect-unlock-reason:Terminology-alignment-rebrand
@architect-phase:39
@architect-effort:0.5d
@architect-product-area:Generation
@architect-depends-on:ClaudeModuleGeneration,DocsConsolidationStrategy
@architect-business-value:session-workflow-CLAUDE-md-section-generated-from-annotated-specs
@architect-priority:medium
@architect-claude-module:session-workflows
@architect-claude-section:workflow
@architect-claude-tags:core
@architect-include:session-workflows
Feature: Session Guides as Annotated Module Source

  **Problem:**
  CLAUDE.md contains a "Session Workflows" section (~160 lines) that is hand-maintained
  with no link to any annotated source. Three hand-written files in `_claude-md/workflow/`
  (session-workflows.md, session-details.md, fsm-handoff.md) are equally opaque: no
  machine-readable origin, no regeneration from source annotations.

  The prior plan proposed tagging ADR-001, ADR-003, and PDR-001 with `@architect-claude-module`
  to make them the source for generated workflow modules. Design analysis revealed this is
  fundamentally flawed: `claude-module` is a file-level tag that pulls ALL Rules from a file,
  but most Rules in those decision specs are irrelevant to session workflows (ADR-001 has 9
  Rules, only 2-3 are workflow-relevant; PDR-001 has 7 Rules about CLI implementation
  decisions, not workflow guidance).

  **Solution:**
  This spec file itself becomes the annotated source for session workflow content.
  Session workflow invariants are captured as Rule: blocks here, covering session type
  contracts, FSM protection, execution order, error recovery, and handoff patterns.

  Once ClaudeModuleGeneration (Phase 25) ships, adding `@architect-claude-module` and
  `@architect-claude-section:workflow` tags to this spec will cause the codec to produce
  `_claude-md/workflow/` modules automatically. The hand-written files are then deleted
  and the CLAUDE.md section becomes a generated include.

  Retain `docs/SESSION-GUIDES.md` (389 lines) as the authoritative public human reference
  deployed to libar.dev. It serves developers with comprehensive checklists and full CLI
  examples — content that cannot be expressed as compact invariants.

  Three-layer architecture after Phase 39:

  | Layer | Location | Content | Maintenance |
  | Public human reference | docs/SESSION-GUIDES.md | Full checklists, CLI examples, decision trees | Manual (editorial) |
  | Compact AI context | _claude-md/workflow/ | Invariants, session contracts, FSM reference | Generated from this spec |
  | Machine-queryable source | Process Data API | Rules from this spec via `rules` command | Derived from annotations |

  **Why It Matters:**
  | Benefit | How |
  | No CLAUDE.md drift | Session workflow section generated, not hand-authored |
  | Single annotated source | This spec owns all session workflow invariants |
  | Correct audience alignment | Public guide stays in docs/, AI context in _claude-md/ |
  | Process API coverage | Session workflow content queryable via `pnpm architect:query -- rules` |
  | Immediately useful | Rule: blocks are queryable today, generation follows when Phase 25 ships |

  **Design Session Findings (2026-03-05):**
  | Finding | Impact |
  | claude-module is file-level, not Rule-level | Cannot selectively tag individual Rules in ADR/PDR files |
  | ADR-001 has 9 Rules, only 2-3 workflow-relevant | Tagging ADR-001 would create noisy, diluted context |
  | PDR-001 Rules are CLI implementation decisions | Not session workflow guidance, wrong audience |
  | Phase 25 claude-section enum lacks workflow value | Must add workflow to enum before annotation |
  | Self-referential spec is correct source | This spec captures invariants, SESSION-GUIDES.md has editorial content |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Session workflow behavior spec with Rule blocks (session types, FSM contracts, escape hatches, handoff) | complete | architect/specs/session-guides-module-source.feature | No | n/a |
      | Verify SESSION-GUIDES.md retained with correct INDEX.md links | complete | docs/SESSION-GUIDES.md | No | n/a |
      | Add workflow to Phase 25 claude-section enum | complete | architect/specs/claude-module-generation.feature | No | n/a |
      | Add claude-module and claude-section:workflow tags to this spec | complete | architect/specs/session-guides-module-source.feature | No | n/a |
      | Generated _claude-md/workflow/session-workflows.md replaces hand-written version | complete | _claude-md/workflow/session-workflows.md | No | n/a |
      | Generated _claude-md/workflow/fsm-handoff.md replaces hand-written version | complete | _claude-md/workflow/fsm-handoff.md | No | n/a |
      | CLAUDE.md Session Workflows section replaced with modular-claude-md include | complete | CLAUDE.md | No | n/a |

  # ===========================================================================
  # RULE 1: SESSION-GUIDES.MD IS THE PUBLIC HUMAN REFERENCE
  # ===========================================================================

  Rule: SESSION-GUIDES.md is the authoritative public human reference

    **Invariant:** `docs/SESSION-GUIDES.md` exists and is not deleted, shortened, or
    replaced with a redirect. Its comprehensive checklists, CLI command examples, and
    session decision trees serve developers on libar.dev.

    **Rationale:** Session workflow guidance requires two formats for two audiences.
    Public developers need comprehensive checklists with full examples. AI sessions
    need compact invariants they can apply without reading 389 lines.

    **Verified by:** SESSION-GUIDES.md exists after Phase 39,
    No broken links after Phase 39

    @acceptance-criteria @happy-path
    Scenario: SESSION-GUIDES.md exists after Phase 39 completes
      Given Phase 39 (SessionGuidesModuleSource) is complete
      Then docs/SESSION-GUIDES.md exists in the repository
      And docs/INDEX.md contains a link to SESSION-GUIDES.md
      And SESSION-GUIDES.md contains no fewer lines than it did before Phase 39

    @acceptance-criteria @validation
    Scenario: No broken links after Phase 39
      Given Phase 39 (SessionGuidesModuleSource) is complete
      Then no retained file in docs/ contains a broken link to a deleted file
      And docs/INDEX.md navigation is consistent with docs/ directory contents

  # ===========================================================================
  # RULE 2: CLAUDE.MD SESSION CONTENT IS DERIVED
  # ===========================================================================

  Rule: CLAUDE.md session workflow content is derived, not hand-authored

    **Invariant:** After Phase 39 generation deliverables complete, the "Session
    Workflows" section in CLAUDE.md contains no manually-authored content. It is
    composed from generated `_claude-md/workflow/` modules.

    **Rationale:** A hand-maintained CLAUDE.md session section creates two copies of
    session workflow guidance with no synchronization mechanism. Regeneration from
    annotated source eliminates drift.

    **Verified by:** CLAUDE.md session section is a generated module reference

    @acceptance-criteria @happy-path
    Scenario: CLAUDE.md session section is a generated module reference
      Given Phase 39 generation deliverables are complete
      When inspecting CLAUDE.md under the Session Workflows heading
      Then the section contains a modular-claude-md include reference to the generated module
      And the section contains no manually-authored do/do-not tables or checklist steps

  # ===========================================================================
  # RULE 3: SESSION TYPE DETERMINES ARTIFACTS AND FSM CHANGES
  # ===========================================================================

  Rule: Session type determines artifacts and FSM changes

    **Invariant:** Four session types exist, each with defined input, output, and
    FSM impact. Mixing outputs across session types (e.g., writing code in a planning
    session) violates session discipline.

    **Rationale:** Session type confusion causes wasted work — a design mistake
    discovered mid-implementation wastes the entire session. Clear contracts prevent
    scope bleeding between session types.

    **Verified by:** Session type contracts are enforced

    | Session | Input | Output | FSM Change |
    | Planning | Pattern brief | Roadmap spec (.feature) | Creates roadmap |
    | Design | Complex requirement | Decision specs + code stubs | None |
    | Implementation | Roadmap spec | Code + tests | roadmap to active to completed |
    | Planning + Design | Pattern brief | Spec + stubs | Creates roadmap |

    @acceptance-criteria @happy-path
    Scenario: Session type contracts are enforced
      Given a planning session is active
      Then the session produces only a roadmap spec
      And no TypeScript implementation code is created
      And the FSM status is set to roadmap

  # ===========================================================================
  # RULE 4: PLANNING SESSIONS PRODUCE SPECS ONLY
  # ===========================================================================

  Rule: Planning sessions produce roadmap specs only

    **Invariant:** A planning session creates a roadmap spec with metadata, deliverables
    table, Rule: blocks with invariants, and scenarios. It must not produce implementation
    code, transition to active, or prompt for implementation readiness.

    **Rationale:** Planning is the cheapest session type — it produces .feature file
    edits, no compilation needed. Mixing implementation into planning defeats the cost
    advantage and introduces untested code without a locked scope.

    **Verified by:** Planning session output constraints

    | Do | Do NOT |
    | Extract metadata from pattern brief | Create .ts implementation |
    | Create spec file with proper tags | Transition to active |
    | Add deliverables table in Background | Ask Ready to implement |
    | Convert constraints to Rule: blocks | Write full implementations |
    | Add scenarios: 1 happy-path + 1 validation per Rule | |

    @acceptance-criteria @happy-path
    Scenario: Planning session output constraints
      Given a planning session for a new pattern
      When the session completes
      Then a .feature file exists with @architect-status:roadmap
      And the file contains a Background with deliverables table
      And no .ts files were created in src/

  # ===========================================================================
  # RULE 5: DESIGN SESSIONS PRODUCE DECISIONS AND STUBS
  # ===========================================================================

  Rule: Design sessions produce decisions and stubs only

    **Invariant:** A design session makes architectural decisions and creates code stubs
    with interfaces. It must not produce implementation code. Context gathering via the
    Process Data API must precede any explore agent usage.

    **Rationale:** Design sessions resolve ambiguity before implementation begins. Code
    stubs in architect/stubs/ live outside src/ to avoid TypeScript compilation
    and ESLint issues, making them zero-risk artifacts.

    **Verified by:** Design session output constraints

    | Use Design Session | Skip Design Session |
    | Multiple valid approaches | Single obvious path |
    | New patterns/capabilities | Bug fix |
    | Cross-context coordination | Clear requirements |

    @acceptance-criteria @happy-path
    Scenario: Design session output constraints
      Given a design session for a pattern with multiple valid approaches
      When the session completes
      Then code stubs exist in architect/stubs/
      And no implementation code was written in src/
      And decision rationale is captured in Rule: blocks

  # ===========================================================================
  # RULE 6: IMPLEMENTATION FOLLOWS FSM-ENFORCED EXECUTION ORDER
  # ===========================================================================

  Rule: Implementation sessions follow FSM-enforced execution order

    **Invariant:** Implementation sessions must follow a strict 5-step execution order.
    Transition to active must happen before any code changes. Transition to completed
    must happen only when ALL deliverables are done. Skipping steps causes Process Guard
    rejection at commit time.

    **Rationale:** The execution order ensures FSM state accurately reflects work state
    at every point. Writing code before transitioning to active means Process Guard
    sees changes to a roadmap spec (no scope protection). Marking completed with
    incomplete work creates a hard-locked state that requires unlock-reason to fix.

    **Verified by:** Implementation execution order is enforced

    Execution order:
    1. Transition to active FIRST (before any code changes)
    2. Create executable spec stubs (if @architect-executable-specs present)
    3. For each deliverable: implement, test, update status to complete
    4. Transition to completed (only when ALL deliverables done)
    5. Regenerate docs: pnpm docs:all

    | Do NOT | Why |
    | Add new deliverables to active spec | Scope-locked state prevents scope creep |
    | Mark completed with incomplete work | Hard-locked state cannot be undone |
    | Skip FSM transitions | Process Guard will reject |
    | Edit generated docs directly | Regenerate from source |

    @acceptance-criteria @happy-path
    Scenario: Implementation execution order is enforced
      Given an implementation session for a roadmap pattern
      When the session begins
      Then the first action is transitioning status to active
      And code changes follow the FSM transition
      And completed is only set after all deliverables are done

  # ===========================================================================
  # RULE 7: FSM ERRORS HAVE DOCUMENTED FIXES
  # ===========================================================================

  Rule: FSM errors have documented fixes

    **Invariant:** Every Process Guard error code has a defined cause and fix. The
    error codes, causes, and fixes form a closed set — no undocumented error states
    exist.

    **Rationale:** Undocumented FSM errors cause session-blocking confusion. A lookup
    table from error code to fix eliminates guesswork and prevents workarounds that
    bypass process integrity.

    **Verified by:** All FSM errors have documented recovery paths

    | Error | Cause | Fix |
    | completed-protection | File has completed status but no unlock tag | Add @architect-unlock-reason tag |
    | invalid-status-transition | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed |
    | scope-creep | Added deliverable to active spec | Remove deliverable OR revert to roadmap |
    | session-scope (warning) | Modified file outside session scope | Add to scope OR use --ignore-session |
    | session-excluded | Modified excluded pattern during session | Remove from exclusion OR override |

    Escape hatches for exceptional situations:

    | Situation | Solution | Example |
    | Fix bug in completed spec | Add unlock reason tag | @architect-unlock-reason:Fix-typo |
    | Modify outside session scope | Use ignore flag | architect-guard --staged --ignore-session |
    | CI treats warnings as errors | Use strict flag | architect-guard --all --strict |

    @acceptance-criteria @happy-path
    Scenario: All FSM errors have documented recovery paths
      Given Process Guard reports a validation error
      Then the error code appears in the FSM error reference table
      And the table entry includes both cause and fix

  # ===========================================================================
  # RULE 8: HANDOFF CAPTURES SESSION-END STATE
  # ===========================================================================

  Rule: Handoff captures session-end state for continuity

    **Invariant:** Multi-session work requires handoff documentation generated from
    the Process Data API. Handoff output always reflects actual annotation state,
    not manual notes.

    **Rationale:** Manual session notes drift from actual deliverable state. The
    handoff command derives state from annotations, ensuring the next session starts
    from ground truth rather than stale notes.

    **Verified by:** Handoff output reflects annotation state

    Generate handoff via: pnpm architect:query -- handoff --pattern PatternName
    Options: --git (include recent commits), --session (session identifier)

    Output includes: deliverable statuses, blockers, modification date, and next
    steps — all derived from current annotation state.

    @acceptance-criteria @happy-path
    Scenario: Handoff output reflects annotation state
      Given a multi-session implementation with 3 deliverables
      When running the handoff command after completing 2 deliverables
      Then the output shows 2 complete and 1 pending
      And the output reflects the current annotation state, not manual notes

  # ===========================================================================
  # RULE 9: CLAUDE MODULE GENERATION IS THE MECHANISM (DEFERRED)
  # ===========================================================================

  Rule: ClaudeModuleGeneration is the generation mechanism

    **Invariant:** Phase 39 depends on ClaudeModuleGeneration (Phase 25). Adding
    `@architect-claude-module` and `@architect-claude-section:workflow` tags to
    this spec will cause ClaudeModuleGeneration to produce `_claude-md/workflow/`
    output files. The hand-written `_claude-md/workflow/` files are deleted after
    successful verified generation.

    **Rationale:** The annotation work (Rule blocks in this spec) is immediately
    useful — queryable via `pnpm architect:query -- rules`. Generation deliverables
    cannot complete until Phase 25 ships the ClaudeModuleCodec. This sequencing is
    intentional: the annotation investment has standalone value regardless of
    whether the codec exists yet.

    **Prerequisite:** Phase 25 must add `workflow` to the `claude-section` enum
    values (currently: core, process, testing, infrastructure).

    **Verified by:** Generated modules replace hand-written workflow files

    @acceptance-criteria @happy-path
    Scenario: Generated modules replace hand-written workflow files
      Given ClaudeModuleGeneration (Phase 25) is complete
      And this spec is annotated with claude-module and claude-section tags
      When running pnpm docs:claude-modules
      Then _claude-md/workflow/ contains generated files derived from this spec
      And the generated files replace the prior hand-written versions
