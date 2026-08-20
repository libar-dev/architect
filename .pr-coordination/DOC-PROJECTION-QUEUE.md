# Documentation-Projection — design-review verdicts + session pointers

**Points, never records.** The specs (`architect/specs/documentation-projection/*.feature`)
and the live PatternGraph are the source of truth. This file holds only the **design-review
verdict** (the readiness gap-find) and the **session orchestration** (which skill, what order)
— it does **not** copy deliverables, rules, scope, or status out of the specs. Copying rots,
and it is the wrapper anti-pattern `./AGENTS.md` warns against. **The spec is each session's
prompt** — pull it live and build from it.

Live status in one call:
`pnpm -s architect:query list --parent DocumentationProjection --format json`

## Verdicts (the design-review gap-find)

| Spec | Pattern | Readiness verdict |
|------|---------|-------------------|
| 05 | `TaxonomyDocumentationCluster` | **Implementation-ready** — design resolved, `scope-validate implement` = READY. The spec carries its own remaining-work list and value-transfer (deletion) gate. Build from the spec; do not re-plan. |
| 03 | `GoalOrientedNavigation` | **Not yet** — at `plan` maturity; needs a lightweight `plan → design` rung first (`scope-validate design` = READY; "stubs: none" is justified, §10 detail-doctrine), then implement. **Sequenced after 05.** |
| 01 / 02 / 04 | `MultiSourceComposition` · `OneSourceMultipleAudiences` · `SourceCanonical` | **Not implementation targets** — capability invariants the epic upholds (00 §"Members — capability invariants"); open questions resolved. Do not try to "make them implementation-ready." |
| 00 | `DocumentationProjection` (epic) | Two gating decisions open (composition-basis ADR-011; read-model reach) — neither blocks 05/03; both gate later clusters (API/verbs). |

> The prior **W1–W8 brief labels are superseded** (most landed). Ignore them — the spec's own
> deliverable table (`[x]`/`[ ]`) and value-transfer gate are the live truth.

## Running these — the spec is the prompt

All remaining work is **spec-driven** (specs 05 and 03), so load **`architect-sessions`** and
build from the spec — pull it live (`bundle <Pattern>`). **`architect-refactor-session` applies to
none of it:** that skill is only for shipped code with **no** design spec, never for completing a
design-level spec. Even the CLI gate-coverage item — which evolves `GenerateDocsCli`'s feature in
place — is value transfer that **spec 05 drives**, so it is an `architect-sessions` implement /
value-transfer task; "evolved in place per the refactoring carve-out" in spec 05 is the *mechanism*
(no fresh design spec for the shipped CLI), not the session skill.

**Each spec carries its own remaining work, deliverables, and Sequencing block** — order follows
those (05 is `GoalOrientedNavigation`'s prerequisite), not a list re-recorded here. 03 additionally
needs the `plan → design` rung before implementing (per the verdict above).

Gates before commit (architect-base §6): `pnpm typecheck && pnpm test && pnpm validate:all` ·
`pnpm architect:guard --staged` · `pnpm docs:all && pnpm docs:check`.
