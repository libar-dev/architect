@architect
@architect-pattern:ProcessGuardRulesExecutableTests
@architect-status:active
@architect-implements:ProcessGuardLinter
@architect-bounded-context:process-guard

Feature: Process guard rule expressions

  Process guard's decider enforces four rules over the change set produced by
  the file-change detector. Each rule has an invariant (what must hold), a
  rationale (why), and an existing executable scenario in this package's test
  suite that verifies the rule against the decider runtime.

  These rule blocks were previously authored as inline `// Rule:` JSDoc banners
  in `packages/architect-guard/src/lint/process-guard/decider.ts` (M4 Part C.1).
  The narrative is now load-bearing in this feature; the source banners were
  removed. The runtime behavior (the rule expression itself) lives in
  `decider.ts` and is unchanged.

  Rule: Protection Level

    **Invariant:** Hard-protected (completed) files cannot be modified
    without an `@architect-unlock-reason` tag, except when the modification
    itself is the transition to a terminal status (the act of completing).

    **Rationale:** Completed specs are the durable record of finished work.
    Editing them post-completion silently rewrites that record; the unlock
    tag forces an explicit, reviewable acknowledgement. The completion-edit
    carve-out exists because the very edit that sets `status:completed`
    must be allowed.

    **Verified by:** `guard-runtime.feature` scenario "Block completed spec
    edits without unlock reason".

  Rule: Status Transitions

    **Invariant:** Status transitions follow the FSM defined in
    `phase-state-machine`. The only sanctioned bypass is a retroactive
    transition to `completed` accompanied by a validated unlock reason.

    **Rationale:** The FSM encodes the delivery process; arbitrary jumps
    (e.g., `idea -> completed`) skip planning gates. The retroactive-unlock
    bypass exists for reconciling specs that were completed out-of-process
    and need to be re-aligned with the FSM.

    **Verified by:** `guard-runtime.feature` scenario "Detect status
    transitions for added files in files mode" exercises the detection
    pipeline; the FSM-validity rejection path is covered by the upstream
    `phase-state-machine` feature suite.

  Rule: Scope Creep

    **Invariant:** Scope-locked (active) specs cannot have new deliverables
    added; removing deliverables emits a warning, not an error.

    **Rationale:** Active specs are mid-implementation; adding deliverables
    silently expands committed scope. Removed deliverables may be legitimate
    (descoped or completed) but warrant author attention, hence warning,
    not block.

    **Verified by:** existing scope-creep step bindings in `guard-runtime`
    fixtures exercise the deliverable-addition rejection and
    deliverable-removal warning paths.

  Rule: Session Scope

    **Invariant:** Files modified outside the configured session scope
    emit a `session-scope` warning.

    **Rationale:** Session scope is the author's declared work boundary
    for the current session; cross-boundary edits are flagged so the
    author can confirm they are intentional rather than incidental
    drive-by edits.

    **Verified by:** session-scope step bindings in the guard test suite
    exercise the warning path against the decider.

  Rule: Session Exclusion

    **Invariant:** Files explicitly excluded from the active session are a
    hard error (a `session-excluded` violation), not a warning, unless the
    run sets `--ignore-session`.

    **Rationale:** Explicit exclusion is a deliberate protective boundary.
    Unlike the soft `session-scope` warning, crossing an explicit exclusion
    requires changing the session configuration, not a drive-by override --
    so the decider escalates it to a blocking error.

    **Verified by:** the guard-runtime `session-excluded` path: `validateChanges`
    runs `checkSessionExcluded` (skipped only when `ignoreSession` is set) and
    emits an error-severity `session-excluded` violation for excluded files.

  Rule: Deliverable Removal

    **Invariant:** Removing a deliverable from a scope-locked (active) spec
    emits a `deliverable-removed` warning, never an error.

    **Rationale:** Removal may be legitimate -- the deliverable was descoped
    or completed elsewhere -- but it warrants author attention so the commit
    documents the intent. Blocking it would punish a valid descope; ignoring
    it would let scope silently shrink.

    **Verified by:** the guard-runtime deliverable-removal path: when a change
    set reports removed deliverables on an active spec, `validateChanges` emits
    a warning-severity `deliverable-removed` violation.
