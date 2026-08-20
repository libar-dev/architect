@architect
@architect-pattern:ProcessGuardRulesExecutableTests
@architect-status:active
@architect-implements:ProcessGuardLinter
@architect-bounded-context:process-guard

Feature: Process guard rule expressions

  Process guard's decider enforces rules over the change set produced by
  the file-change detector. Each rule has an invariant (what must hold), a
  rationale (why), and an existing executable scenario in this package's test
  suite that verifies the rule against the decider runtime.

  The protection that gates iterative work — modifying a completed spec and
  expanding active-spec scope — is advisory on the commit path (PDR-006): it
  surfaces warnings rather than commit-blocking errors, an
  `@architect-unlock-reason` suppresses the warning, and `--strict` (CI, not
  the commit path) promotes the warning to blocking via the shared severity
  model.

  These rule blocks were previously authored as inline `// Rule:` JSDoc banners
  in `packages/architect-guard/src/lint/process-guard/decider.ts` (M4 Part C.1).
  The narrative is now load-bearing in this feature; the source banners were
  removed. The runtime behavior (the rule expression itself) lives in
  `decider.ts` and is unchanged.

  Rule: Protection Level

    **Invariant:** Modifying a hard-protected (completed) spec surfaces a
    `completed-protection` warning, never a commit-blocking error, except when
    the modification itself is the transition to a terminal status (the act of
    completing), which is silent. An `@architect-unlock-reason` tag is optional
    and suppresses the warning when present.

    **Rationale:** Small, planned-related changes to finished work are normal
    maintenance, not process violations (PDR-006). A hard block forces reverting
    valuable work or faking status; a warning keeps the change visible and
    intentional while letting it land. The unlock tag remains a real audit
    signal, now opt-in rather than a friction wall. The completion-edit carve
    -out exists because the very edit that sets `status:completed` must be
    allowed silently.

    **Verified by:** `guard-runtime.feature` scenario "Warn on completed spec
    edits without unlock reason" and "Suppress completed-protection warning with
    unlock reason".

  Rule: Status Transitions

    **Invariant:** Status transitions follow the FSM defined in
    `phase-state-machine`. Reopening completed work to `active` or `roadmap` is a
    valid transition (PDR-006). The only sanctioned bypass for `-> completed` is
    a retroactive transition accompanied by a validated unlock reason.

    **Rationale:** The FSM encodes the delivery process; arbitrary jumps
    (e.g., `idea -> completed`) skip planning gates. Reopening completed work is
    first-class so legitimate maintenance is not walled. The retroactive-unlock
    bypass exists for reconciling specs that were completed out-of-process and
    need to be re-aligned with the FSM.

    **Verified by:** `guard-runtime.feature` scenario "Detect status
    transitions for added files in files mode" exercises the detection
    pipeline; the FSM-validity rejection path is covered by the upstream
    `phase-state-machine` feature suite.

  Rule: Scope Creep

    **Invariant:** Expanding the scope of a scope-locked (active) spec is
    advisory: adding a deliverable whose status is `pending` (unbuilt scope)
    emits a `scope-creep` warning; adding a deliverable that records real
    progress (in-progress/complete/deferred/superseded/n/a) is silent; removing
    a deliverable emits a `deliverable-removed` warning. An
    `@architect-unlock-reason` suppresses these warnings. No deliverable change
    to an active spec blocks a commit.

    **Rationale:** Scope crystallizes during implementation (PDR-006). Surfacing
    the addition of unbuilt scope keeps it intentional; blocking it only invites
    a revert or a status lie. Recording real progress is reality and needs no
    signal.

    **Verified by:** `guard-runtime.feature` scenario "Warn on pending scope
    added to an active spec" and the existing scope-creep step bindings that
    exercise the deliverable-addition warning and deliverable-removal warning
    paths.

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
    emits a `deliverable-removed` warning, never an error. An
    `@architect-unlock-reason` suppresses the warning.

    **Rationale:** Removal may be legitimate -- the deliverable was descoped
    or completed elsewhere -- but it warrants author attention so the commit
    documents the intent. Blocking it would punish a valid descope; ignoring
    it would let scope silently shrink.

    **Verified by:** the guard-runtime deliverable-removal path: when a change
    set reports removed deliverables on an active spec, `validateChanges` emits
    a warning-severity `deliverable-removed` violation.

  Rule: Strict Mode Promotion

    **Invariant:** Under `--strict`, advisory warnings (completed-protection,
    scope-creep, deliverable-removed) are promoted to blocking errors via the
    shared severity model; on the default commit path they remain warnings.

    **Rationale:** The advisory model keeps the commit path unblocked (PDR-006)
    while leaving a hard gate available to CI. `--strict` is the opt-in lever
    that restores prevention where it is wanted, without re-walling everyday
    commits.

    **Verified by:** `guard-runtime.feature` scenario "Strict mode promotes the
    completed-protection warning to a blocking error".
