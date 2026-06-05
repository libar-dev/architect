@architect
@architect-pattern:DecisionRecordTemporalHygiene
@architect-status:candidate
@architect-product-area:Validation
@architect-bounded-context:governance
@architect-see-also:ADR006SingleReadModelArchitecture
Feature: DecisionRecordTemporalHygiene - decision records stay decisions-only, no temporal or execution context

  **User Story:** As a maintainer relying on `architect/decisions/` as the durable, permanent record of why the architecture is the way it is, I want decision records to carry only the decision and its rationale — never status, work-in-progress, ETAs, or who-is-doing-what — so the corpus does not silently turn into a worklog. During this repo's bootstrap, that doctrine also means slimming or editing records in place rather than preserving amendment scaffolding in the read model. Today this is convention only (architect-base §3/§7, formal-spec): nothing flags a record that drifts, and several shipped ADRs already carry execution/temporal context. The gap is that the decisions-only rule is documented but unenforced, and the offending records are unaudited.

  **Open Questions:**
  - Enforcement surface: a `validate:all` lint over `architect/decisions/*.feature` that flags temporal/operational phrasing, or a doc-gen-time check, or reviewer-only? A lint risks false positives on legitimate dated decisions, so start narrow and target only execution-context residue.
  - What signals "temporal/execution context" mechanically — a closed phrase list (status:, ETA, "this week", session/WS labels), or a heuristic? Start narrow to avoid noise.
  - Remediation shape: during bootstrap, should each offending record be slimmed in place, or can some residue be removed only by deleting the whole record once the decision is re-expressed elsewhere? Post-1.0 append-only supersession is explicitly out of scope for this spec.

  Rule: A decision record holds only the decision and its rationale
    **Invariant:** A record under `architect/decisions/` states a decision plus durable, non-execution rationale and nothing else; status, work-in-progress, ETAs, ownership, and campaign/session labels do not appear in it. During bootstrap, remediation is in-place consolidation — edit, slim, or delete the record directly — and not a superseding-record chain.

  @acceptance-criteria @happy-path
  Scenario: a decision record carrying execution context is flagged
    Given a record under architect/decisions/ that states an ETA or work-in-progress status
    When decision-record hygiene is evaluated over the decisions corpus
    Then that record is reported as carrying temporal/execution context
    And the remediation is an in-place edit, slim, or deletion, not a superseding-record chain
