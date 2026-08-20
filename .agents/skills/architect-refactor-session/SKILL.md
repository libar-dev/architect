---
name: architect-refactor-session
description: MANDATORY when modifying shipped code that has NO design-level Architect spec — triggers on refactor, rename, extract, inline, consolidate, split-package, move-file, or any production-code edit on a `completed` pattern whose design spec was already deleted. Operationalizes the kernel's refactoring carve-out — skip the four-tier ladder, evolve the existing executable feature in place, preserve documented invariants unless `.pr-coordination/DECISIONS.md` authorizes a change. Invoke before the edit. Do NOT use for implementing a design spec, bug fixes that restore an invariant, or feature work needing a fresh pattern — those route to architect-sessions. DO NOT USE for spec-driven development.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Architect Refactor Session

Refactor sessions modify shipped code that has no design-level
`.feature` spec — the spec was deleted at original implement-time, and
the executable Gherkin in `tests/features/` is now the canonical
pattern definition. There is nothing to "implement from"; there is
existing code to evolve and an existing executable feature whose
invariants must continue to hold (or be deliberately changed under a
recorded decision). **This skill is only for non-spec-driven development. DO NOT USE for refactoring based on a design-level spec.**

## Premise — value transfer without a spec

The kernel's value-transfer doctrine still applies, but the source has
inverted. A normal implement session transfers value FROM an ephemeral
design spec INTO durable carriers (executable Gherkin + annotations);
a refactor session transfers value FROM existing durable carriers
THROUGH the code edit AND BACK INTO the same carriers, possibly
evolved. The pre-deletion gate from
[`../architect-sessions/references/ephemeral-spec-deletion.md`](../architect-sessions/references/ephemeral-spec-deletion.md) does
not apply — there is no spec to delete — but the **invariant carriers**
still gate completion. Use the adapted gate below in §"Adapted
invariant-carrier gate".

## Doctrine references

Load [`architect-base`](../architect-base/SKILL.md) (vocabulary) and [`architect-sessions`](../architect-sessions/SKILL.md) (the universal session rules + value-transfer concept) first; this skill builds on both. The depth this session leans on:

- [`./references/multi-session-coordination.md`](./references/multi-session-coordination.md)
  — `.pr-coordination/` layout, coordinator/worker split, the campaign
  rules, and the scope-discovery rule (Rule 5 — load-bearing: refactors
  concentrate the "scope expands mid-session" risk more than any other
  session type). Required when the refactor touches ≥3 packages or
  spans ≥3 sessions.
- [`../architect-base/references/four-tier-ladder.md`](../architect-base/references/four-tier-ladder.md)
  — the maturity ladder this carve-out skips (base owns the rungs). The
  carve-out itself — skip idea / candidate / plan and capture
  already-shipped behavior at executable-tier (a `*ExecutableTests`
  feature, or evolve the one in place) rather than revive the deleted
  design spec — is this skill's own subject (see Premise · Refactor
  order · Anti-patterns below). (Provenance:
  `formal-spec/08-spec-evolution.md` § "Exception: Refactoring specs"
  lets a refactoring spec skip candidate and plan, going to design-level
  _or_ executable; this skill narrows that to the executable
  `*ExecutableTests` convention — see Anti-patterns.)
- [`../architect-base/references/spec-pattern-relationships.md`](../architect-base/references/spec-pattern-relationships.md)
  — `<Pattern>ExecutableTests` is the formal escape hatch when shipped
  code lacks a `tests/features/<pattern>.feature`. Bipartite naming applies.
- [`../architect-base/references/annotation-ownership.md`](../architect-base/references/annotation-ownership.md)
  — split-ownership policy: production code realizing a feature-owned
  pattern uses `@architect-implements`, not a duplicate `@architect-pattern`
  (but a code-originated pattern — codec / contract / utility — owns its
  `@architect-pattern` on the `.ts`). Add `@architect-uses` /
  `@architect-usecase` / `@architect-decision` /
  `@architect-role` / `@architect-bounded-context` as additive enrichment.
- [`../architect-base/references/rule-block-template.md`](../architect-base/references/rule-block-template.md)
  — 4-field `Rule:` template (`**Invariant:**` / `**Rationale:**` /
  `**Verified by:**`) for any new or modified Rule block in the
  executable feature.
- [`../architect-sessions/references/ephemeral-spec-deletion.md`](../architect-sessions/references/ephemeral-spec-deletion.md)
  — invariant-carrier rules and anti-patterns (zombie spec,
  half-transferred value, retroactive plan-level spec). Skip §"Pre-deletion
  gate"; honor §"Anti-patterns".
- [`../architect-base/references/fsm-transitions.md`](../architect-base/references/fsm-transitions.md)
  — consult only when the refactor reopens a `completed` pattern
  (`completed` → `active` is advisory; `@architect-unlock-reason:` ≥10
  non-placeholder characters suppresses the warning). Most refactors never change status.

## Pre-flight (mandatory CLI bootstrap)

Scope validation is intentionally absent — scope readiness
(the `architect_scope_validate` MCP tool) only covers `design` or
`implement` sessions and refactors have no spec to validate.

Run the read-surface pre-flight per
[`../architect-graph-handle/SKILL.md`](../architect-graph-handle/SKILL.md)
(the read surface, ADR-014) — for a refactor that means:

- **Orientation:**
  `pnpm architect:q 'return {counts: g.graph.counts, active: g.patterns.filter(p => p.status === "active").map(p => p.name)}'`
- **Touched-file inventory:**
  `pnpm architect:q 'const p = g.pattern("<Pattern>"); return {file: p?.sourceFile, realizing: p?.implementedBy}'`
- **Dependency context:**
  `pnpm architect:q 'g.graph.relationshipIndex["<Pattern>"]'`
- **Blocked work:**
  `pnpm architect:q 'g.patterns.filter(p => p.status === "roadmap" && p.uses.some(u => g.pattern(u)?.status !== "completed")).map(p => p.name)'`
- **Graph-integrity gate** (also used in the closing checks below):
  `pnpm architect:graph dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict`

If `g.pattern("<Pattern>")` returns `undefined` (the pattern is
unknown to the graph), stop. Either the pattern name is wrong, or the
work is feature work disguised as refactor — route to
[`architect-sessions`](../architect-sessions/SKILL.md) and its
[`plan`](../architect-sessions/references/plan.md) reference.

## Refactor order (strict)

1. **Identify the executable feature.** Locate the file under
   `tests/features/` carrying `@architect-implements:<Pattern>` (use
   the pre-flight inventory one-liner — `g.pattern("<Pattern>")`
   exposes `sourceFile` and `implementedBy`).
   If absent, create it as
   `tests/features/<area>/<pattern-kebab>-executable-tests.feature`
   per
   [`../architect-base/references/spec-pattern-relationships.md`](../architect-base/references/spec-pattern-relationships.md);
   tag it with `@architect-pattern:<Pattern>ExecutableTests` and
   `@architect-implements:<Pattern>`. The new file is the durable
   artifact — never substitute a retroactive design-level spec.
2. **Read before edit.** Read the executable feature first; read every
   production file the inventory one-liner lists (`sourceFile` +
   `implementedBy`); read the
   `pnpm architect:q 'g.graph.relationshipIndex["<Pattern>"]'` output
   to understand the blast radius. Do not skim.
3. **Capture decisions before code.** Any invariant the refactor
   intends to change must be entered in `.pr-coordination/DECISIONS.md`
   (or, for solo-session refactors, the working note the user
   accepts) BEFORE the production-code edit lands. Refactor's most
   common drift mode is "the invariant looks wrong, just rewrite it";
   this gate stops that.
4. **Edit production code in dependency-leaf-first order.** After each
   edit, run the closest targeted typecheck / test slice for the
   surface you changed, then run `pnpm typecheck` at the next phase
   boundary. Before any commit or handoff, run `pnpm typecheck &&
pnpm test && pnpm validate:all`. Do not batch verification to the
   end. Per [`architect-sessions`](../architect-sessions/SKILL.md)
   §"Universal session rules", gates are non-negotiable.
5. **Update executable Gherkin in lockstep with code.** Every changed
   behavior must surface as a new or edited Scenario; every changed
   invariant must surface in the corresponding Rule block carrying
   the full 4-field content from
   [`../architect-base/references/rule-block-template.md`](../architect-base/references/rule-block-template.md).
   A previously-documented invariant that no longer holds requires a
   matching `DECISIONS.md` entry — no silent rewrites.
6. **Refresh `@architect-*` annotations.** On every production file
   touched, update declared `@architect-uses` edges when dependency
   direction changed; refresh `@architect-usecase` if the "when to
   use" guidance shifted; add or update `@architect-decision:DD-N`,
   `@architect-role`, and `@architect-bounded-context` where the refactor
   changed those semantics. Reverse edges derive from `@architect-uses`,
   they are not authored directly. Do not add a duplicate
   `@architect-pattern` for a feature-owned pattern (use
   `@architect-implements`); a code-originated pattern keeps its own
   `@architect-pattern` on the `.ts` (per
   [`../architect-base/references/annotation-ownership.md`](../architect-base/references/annotation-ownership.md)).

## Edge-authoring heuristics (refactor-specific)

Two recurring refactor cases are easy to get wrong because the truthful
edge is not the most obvious-looking one.

- **Produced fragments:** when a projection or builder genuinely
  constructs a fragment (for example its return type / `kind:` literal
  proves it produces `PatternDetail`), author the edge on the producer:
  `<Producer> @architect-uses <Fragment>`. Do **not** hang the edge on a
  pure re-export barrel when a truthful producer exists — that inverts
  the dependency and lies to the graph.
- **Producerless grouping barrels:** when a barrel is only a module
  grouping surface and no truthful producer exists, `barrel →
submodule` edges are acceptable. Verify against the barrel's actual
  exports/imports; if there is no concrete dependency to point at,
  defer rather than invent a phantom edge.
- **CLI subprocess tests:** an executable feature that drives the CLI
  through `runCommand("foo ...")` may
  `@architect-implements:<ProductionCliPattern>` when the command string
  maps **1:1** to one named production pattern. The command invocation
  is the concrete fact that authorizes the edge. If the command fans out
  across several patterns or no single production pattern exists, defer
  rather than guess.

Read back every such edge through the graph handle after authoring.
The file edit is not proof until
`pnpm architect:q 'g.pattern("<Pattern>")'` (the node carries
`uses`/`usedBy`) or `g.graph.relationshipIndex["<Pattern>"]` shows
the intended relationship in the live graph.

## Adapted invariant-carrier gate

The five criteria below replace the §"Pre-deletion gate" in
[`../architect-sessions/references/ephemeral-spec-deletion.md`](../architect-sessions/references/ephemeral-spec-deletion.md). All
five must hold before declaring the refactor done.

1. **Executable feature present.** A file under `tests/features/`
   carries `@architect-implements:<Pattern>`. (If the refactor created
   the `<Pattern>ExecutableTests` feature, this criterion verifies
   the new file's tag set.)
2. **Rule blocks intact.** Every Rule block touched still carries the
   4-field template (`Rule:` summary,
   `**Invariant:** / **Rationale:** / **Verified by:**`). No half-filled
   blocks.
3. **Invariant deltas authorized.** Every removed-or-changed
   invariant has a corresponding entry in
   `.pr-coordination/DECISIONS.md` (or the agreed solo-session
   record).
4. **Annotations refreshed.** Every production file touched carries
   the additive `@architect-*` annotations expected by split
   ownership. No `@architect-pattern` that _duplicates_ a feature-owned
   pattern's identity (use `@architect-implements`) — though an extracted
   code-originated pattern (codec / contract / utility) does own its
   `@architect-pattern` on the `.ts`; no stale `@architect-uses`
   referencing removed dependencies.
5. **Graph integrity.** The
   `g.graph.relationshipIndex["<Pattern>"]` after-state matches the
   refactor's intent — no surprise edges. The blocked-work script
   (`pnpm architect:q 'g.patterns.filter(p => p.status === "roadmap" && p.uses.some(u => g.pattern(u)?.status !== "completed")).map(p => p.name)'`)
   shows no new blockers introduced by the refactor. (Run both reads
   again after the final commit.) Use
   `pnpm architect:graph dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict`
   as the deterministic graph-integrity gate — non-zero exit means the
   refactor introduced (or removed) a dangling reference and the drift
   must be resolved before declaring done.

When all five hold, the refactor is durable. **No spec deletion
step** — the executable feature was already the durable artifact and
remains in place.

## Multi-session campaign mode

When `.pr-coordination/` carries an active campaign (per
[`./references/multi-session-coordination.md`](./references/multi-session-coordination.md)):

- Defer to `EXECUTION-PLAN.md` for ordering, gates, and closing
  invariants.
- Read the matching `sessions/NN-slug.md` worker prompt — execute
  exactly that scope; do not re-plan.
- Append a tight per-session entry to
  `SESSION-REPORTS-AND-LEARNINGS.md` at session end, including any
  drift surfaced and how it was classified (same-root-cause vs
  different-root-cause per Rule 5 in
  [`./references/multi-session-coordination.md`](./references/multi-session-coordination.md)).
- Do not edit `EXECUTION-PLAN.md`, `state.json`, or unstarted
  session prompts under `sessions/`. The coordinator owns those.
  Coordinator self-restraint is the load-bearing primitive — a
  worker that rewrites the plan becomes another coordinator and
  collapses the split.

## Anti-patterns (stop and redirect)

- **Retroactive plan-level spec.** Authoring a fresh idea / candidate
  / plan / design-level `.feature` for shipped code. Stop. Author or
  enrich a `<Pattern>ExecutableTests` feature instead. This is the
  single most common refactor mistake — there is no spec because
  there should be no spec.
- **Silent invariant change.** Editing a Rule block's
  `**Invariant:**` line without a `DECISIONS.md` entry. Revert the
  edit, capture the decision, then re-apply.
- **Half-transferred value.** Code edited but executable Gherkin not
  updated, or vice versa. Both surfaces must move together — running
  only targeted slices, or only `pnpm typecheck`, is not a substitute
  for updating the carrier.
- **Duplicating feature-owned identity in code.** Adding
  `@architect-pattern:X` to production-TS for a pattern `X` a feature
  file already owns — use `@architect-implements:X` instead; a refactor
  never _moves_ a behavioral pattern's identity off its feature
  (per
  [`../architect-base/references/annotation-ownership.md`](../architect-base/references/annotation-ownership.md)).
  This does **not** bar a code-originated pattern — codec / contract /
  utility, including one an `extract` refactor creates — from owning its
  own `@architect-pattern` on the `.ts`, as such patterns always have.
- **Zombie executable feature.** Stripping every Scenario from a
  feature without removing the file. Either the pattern still ships
  (the feature stays rich) or the pattern is being retired (the
  feature is removed). Never both.
- **Wrapper documents.** Drafting a "refactor plan" markdown
  alongside the executable feature. The executable feature is the
  plan; `DECISIONS.md` is the journal.

## Big-gap escape hatch

If the refactor surfaces a missing architectural decision (not just a
clarification), stop. Do not paper over it with a quick edit and a
silent invariant change. Report the gap to the user and recommend
routing to [`architect-sessions`](../architect-sessions/SKILL.md) and its
[`plan`](../architect-sessions/references/plan.md) reference to author a
NEW pattern for the emergent concern — never a retroactive pattern for
the existing shipped code. Shipping an under-decided refactor is worse
than re-opening the design conversation.

## Do not

- Do not author a new design-level spec for shipped code (the kernel's
  retroactive-spec anti-pattern).
- Do not delete or recreate `architect/specs/<pattern>.feature` — it
  does not exist and must not exist; that is the carve-out's premise.
- Do not skip executable-Gherkin updates with the rationalization
  "the code change is the doc"; the kernel does not accept that.
- Do not introduce No-BC violations (`@deprecated`,
  `// eslint-disable`, `@ts-expect-error`, compat aliases, "kept for
  compat" comments). The CLAUDE.md No-BC guard fails CI and refactor
  PRs are the most common offenders.
- Do not edit `EXECUTION-PLAN.md` or `state.json` from a worker
  session.
- Do not declare done before walking the five-criterion
  invariant-carrier gate above.
