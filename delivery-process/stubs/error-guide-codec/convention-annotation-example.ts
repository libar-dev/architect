/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ErrorGuideCodec
 * @libar-docs-target src/lint/process-guard/decider.ts
 *
 * ## Convention Annotation Example — DD-3 Decision
 *
 * **Decision DD-3 (Rationale source):** Rationale comes from convention
 * JSDoc annotations on `src/lint/process-guard/decider.ts`, not from
 * `Rule:` blocks in the ProcessGuardLinter Gherkin spec.
 *
 * **Rationale (DD-3):** The rationale content belongs near the error-handling
 * code, not in a planning spec. When a developer changes an error rule in
 * the decider, the convention JSDoc is right there -- they update both in
 * the same commit. This follows the proven pattern used by:
 * - `src/generators/orchestrator.ts` with `@libar-docs-convention pipeline-architecture`
 * - `src/renderable/codecs/reference.ts` with `@libar-docs-convention codec-registry`
 * - `src/renderable/codecs/validation-rules.ts` with `@libar-docs-convention codec-registry`
 *
 * All three use TypeScript JSDoc convention annotations with `## Heading`
 * decomposition. The convention extractor's `extractConventionRulesFromDescription()`
 * splits by `## Heading` sections, parsing each for `**Invariant:**`,
 * `**Rationale:**`, and tables -- exactly the structure needed for error guides.
 *
 * **Annotation format:**
 * Each error rule gets a `## <rule-id>` heading in the JSDoc with structured
 * content below it. The convention extractor decomposes by heading and
 * produces one `ConventionRuleContent` per error code.
 *
 * **Content structure per error code:**
 * - `**Invariant:**` — The rule statement (maps to "Why this rule exists")
 * - `**Rationale:**` — Why the constraint exists (detailed explanation)
 * - Table with `| Situation | Solution | Example |` for alternatives
 *
 * ### Annotation Placement
 *
 * The convention annotation is added to the EXISTING JSDoc block on
 * `src/lint/process-guard/decider.ts`. The file already has extensive
 * JSDoc describing the decider's design principles and rules. The
 * convention annotation extends this JSDoc, not replaces it.
 *
 * Specifically, `@libar-docs-convention process-guard-errors` is added
 * to the file-level JSDoc alongside the existing annotations:
 * - `@libar-docs-pattern ProcessGuardDecider`
 * - `@libar-docs-arch-role decider`
 * - etc.
 *
 * Then the `## ` headings for each error rule are added below the existing
 * design documentation.
 */

// ---------------------------------------------------------------------------
// Example: How decider.ts would be annotated (partial)
// ---------------------------------------------------------------------------

/**
 * This stub shows the PATTERN of convention annotation that would be
 * added to `src/lint/process-guard/decider.ts`. The actual annotation
 * content goes in the decider's file-level JSDoc block.
 *
 * Key insight: The convention extractor splits by `## Heading` and parses
 * each section for `**Invariant:**`, `**Rationale:**`, and tables. So
 * each error rule becomes a separate `ConventionRuleContent` entry in
 * the extracted `ConventionBundle`.
 *
 * The annotation below demonstrates the format for all 6 error rules.
 * In the actual decider.ts, these would follow the existing `### Rules
 * Implemented` section.
 *
 * @libar-docs-convention process-guard-errors
 *
 * ## completed-protection
 *
 * **Invariant:** Completed specs are immutable without an explicit unlock
 * reason. The unlock reason must be at least 10 characters and cannot be
 * a placeholder.
 *
 * **Rationale:** The `completed` status represents verified, accepted work.
 * Allowing silent modification undermines the terminal-state guarantee.
 * Requiring an unlock reason creates an audit trail and forces the developer
 * to justify why completed work needs revisiting.
 *
 * | Situation | Solution | Example |
 * |-----------|----------|---------|
 * | Fix typo in completed spec | Add unlock reason tag | `@libar-docs-unlock-reason:Fix-typo-in-FSM-diagram` |
 * | Spec needs rework | Create new spec instead | New feature file with `roadmap` status |
 * | Legacy import | Multiple transitions in one commit | Set `roadmap` then `completed` |
 *
 * ## invalid-status-transition
 *
 * **Invariant:** Status transitions must follow the PDR-005 FSM path.
 * The only valid paths are: roadmap->active, roadmap->deferred,
 * active->completed, active->roadmap, deferred->roadmap.
 *
 * **Rationale:** The FSM enforces a deliberate progression through
 * planning, implementation, and completion. Skipping states (e.g.,
 * roadmap->completed) means work was never tracked as active, breaking
 * session scoping and deliverable validation.
 *
 * | Attempted | Why Invalid | Valid Path |
 * |-----------|-------------|------------|
 * | roadmap->completed | Must go through active | roadmap->active->completed |
 * | deferred->active | Must return to roadmap first | deferred->roadmap->active |
 * | deferred->completed | Cannot skip two states | deferred->roadmap->active->completed |
 *
 * ## scope-creep
 *
 * **Invariant:** Active specs cannot add new deliverables. Scope is locked
 * when status transitions to `active`.
 *
 * **Rationale:** Prevents scope creep during implementation. Plan fully
 * before starting; implement what was planned. Adding deliverables mid-
 * implementation signals inadequate planning and risks incomplete work.
 *
 * | Situation | Solution | Example |
 * |-----------|----------|---------|
 * | Need new deliverable | Revert to roadmap first | Change status to roadmap, add deliverable, then back to active |
 * | Discovered work during implementation | Create new spec | New feature file for the discovered work |
 *
 * ## session-scope
 *
 * **Invariant:** Files outside the active session scope trigger warnings
 * to prevent accidental cross-session modifications.
 *
 * **Rationale:** Session scoping ensures focused work. Modifying files
 * outside the session scope often indicates scope creep or working on
 * the wrong task. The warning is informational (not blocking) to allow
 * intentional cross-scope changes with `--ignore-session`.
 *
 * ## session-excluded
 *
 * **Invariant:** Files explicitly excluded from a session cannot be
 * modified in that session. This is a hard error, not a warning.
 *
 * **Rationale:** Explicit exclusion is a deliberate decision to protect
 * certain files from modification during a session. Unlike session-scope
 * (warning), exclusion represents a conscious boundary that should not
 * be violated without changing the session configuration.
 *
 * ## deliverable-removed
 *
 * **Invariant:** Removing a deliverable from an active spec triggers a
 * warning to ensure the removal is intentional and documented.
 *
 * **Rationale:** Deliverable removal during active implementation may
 * indicate descoping or completion elsewhere. The warning ensures
 * visibility -- the commit message should document why the deliverable
 * was removed.
 */
export function _conventionAnnotationExample(): never {
  throw new Error('ErrorGuideCodec not yet implemented - roadmap pattern');
}
