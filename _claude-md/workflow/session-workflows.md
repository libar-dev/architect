### SessionGuidesModuleSource

#### SESSION-GUIDES.md is the authoritative public human reference

**Invariant:** `docs/SESSION-GUIDES.md` exists and is not deleted, shortened, or replaced with a redirect. Its comprehensive checklists, CLI command examples, and session decision trees serve developers on libar.dev.

**Rationale:** Session workflow guidance requires two formats for two audiences. Public developers need comprehensive checklists with full examples. AI sessions need compact invariants they can apply without reading 389 lines.

#### CLAUDE.md session workflow content is derived, not hand-authored

**Invariant:** After Phase 39 generation deliverables complete, the "Session Workflows" section in CLAUDE.md contains no manually-authored content. It is composed from generated `_claude-md/workflow/` modules.

**Rationale:** A hand-maintained CLAUDE.md session section creates two copies of session workflow guidance with no synchronization mechanism. Regeneration from annotated source eliminates drift.

#### Session type determines artifacts and FSM changes

**Invariant:** Four session types exist, each with defined input, output, and FSM impact. Mixing outputs across session types (e.g., writing code in a planning session) violates session discipline.

**Rationale:** Session type confusion causes wasted work — a design mistake discovered mid-implementation wastes the entire session. Clear contracts prevent scope bleeding between session types.

| Session           | Input               | Output                      | FSM Change                     |
| ----------------- | ------------------- | --------------------------- | ------------------------------ |
| Planning          | Pattern brief       | Roadmap spec (.feature)     | Creates roadmap                |
| Design            | Complex requirement | Decision specs + code stubs | None                           |
| Implementation    | Roadmap spec        | Code + tests                | roadmap to active to completed |
| Planning + Design | Pattern brief       | Spec + stubs                | Creates roadmap                |

#### Planning sessions produce roadmap specs only

**Invariant:** A planning session creates a roadmap spec with metadata, deliverables table, Rule: blocks with invariants, and scenarios. It must not produce implementation code, transition to active, or prompt for implementation readiness.

**Rationale:** Planning is the cheapest session type — it produces .feature file edits, no compilation needed. Mixing implementation into planning defeats the cost advantage and introduces untested code without a locked scope.

| Do                                                  | Do NOT                     |
| --------------------------------------------------- | -------------------------- |
| Extract metadata from pattern brief                 | Create .ts implementation  |
| Create spec file with proper tags                   | Transition to active       |
| Add deliverables table in Background                | Ask Ready to implement     |
| Convert constraints to Rule: blocks                 | Write full implementations |
| Add scenarios: 1 happy-path + 1 validation per Rule |                            |

#### Design sessions produce decisions and stubs only

**Invariant:** A design session makes architectural decisions and creates code stubs with interfaces. It must not produce implementation code. Context gathering via the Process Data API must precede any explore agent usage.

**Rationale:** Design sessions resolve ambiguity before implementation begins. Code stubs in delivery-process/stubs/ live outside src/ to avoid TypeScript compilation and ESLint issues, making them zero-risk artifacts.

| Use Design Session         | Skip Design Session |
| -------------------------- | ------------------- |
| Multiple valid approaches  | Single obvious path |
| New patterns/capabilities  | Bug fix             |
| Cross-context coordination | Clear requirements  |

#### Implementation sessions follow FSM-enforced execution order

**Invariant:** Implementation sessions must follow a strict 5-step execution order. Transition to active must happen before any code changes. Transition to completed must happen only when ALL deliverables are done. Skipping steps causes Process Guard rejection at commit time.

**Rationale:** The execution order ensures FSM state accurately reflects work state at every point. Writing code before transitioning to active means Process Guard sees changes to a roadmap spec (no scope protection). Marking completed with incomplete work creates a hard-locked state that requires unlock-reason to fix.

| Do NOT                              | Why                                     |
| ----------------------------------- | --------------------------------------- |
| Add new deliverables to active spec | Scope-locked state prevents scope creep |
| Mark completed with incomplete work | Hard-locked state cannot be undone      |
| Skip FSM transitions                | Process Guard will reject               |
| Edit generated docs directly        | Regenerate from source                  |

#### FSM errors have documented fixes

**Invariant:** Every Process Guard error code has a defined cause and fix. The error codes, causes, and fixes form a closed set — no undocumented error states exist.

**Rationale:** Undocumented FSM errors cause session-blocking confusion. A lookup table from error code to fix eliminates guesswork and prevents workarounds that bypass process integrity.

| Error                     | Cause                                          | Fix                                         |
| ------------------------- | ---------------------------------------------- | ------------------------------------------- |
| completed-protection      | File has completed status but no unlock tag    | Add libar-docs-unlock-reason tag            |
| invalid-status-transition | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed |
| scope-creep               | Added deliverable to active spec               | Remove deliverable OR revert to roadmap     |
| session-scope (warning)   | Modified file outside session scope            | Add to scope OR use --ignore-session        |
| session-excluded          | Modified excluded pattern during session       | Remove from exclusion OR override           |

| Situation                    | Solution              | Example                                |
| ---------------------------- | --------------------- | -------------------------------------- |
| Fix bug in completed spec    | Add unlock reason tag | libar-docs-unlock-reason:Fix-typo      |
| Modify outside session scope | Use ignore flag       | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use strict flag       | lint-process --all --strict            |

#### Handoff captures session-end state for continuity

**Invariant:** Multi-session work requires handoff documentation generated from the Process Data API. Handoff output always reflects actual annotation state, not manual notes.

**Rationale:** Manual session notes drift from actual deliverable state. The handoff command derives state from annotations, ensuring the next session starts from ground truth rather than stale notes.

#### ClaudeModuleGeneration is the generation mechanism

**Invariant:** Phase 39 depends on ClaudeModuleGeneration (Phase 25). Adding `@libar-docs-claude-module` and `@libar-docs-claude-section:workflow` tags to this spec will cause ClaudeModuleGeneration to produce `_claude-md/workflow/` output files. The hand-written `_claude-md/workflow/` files are deleted after successful verified generation.

**Rationale:** The annotation work (Rule blocks in this spec) is immediately useful — queryable via `pnpm process:query -- rules`. Generation deliverables cannot complete until Phase 25 ships the ClaudeModuleCodec. This sequencing is intentional: the annotation investment has standalone value regardless of whether the codec exists yet.
