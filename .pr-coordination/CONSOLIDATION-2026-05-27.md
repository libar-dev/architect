# Consolidation — 2026-05-27

A consolidation pass over `.pr-coordination/`, **not** a close-out. The campaign was the
non-spec-driven setup after extracting `@libar-dev/architect-*` from a monorepo. Most of it is
resolved — but one workstream is a **major in-progress capability** whose foundation must stay live:

> **WS-3 — universal documentation generation.** The goal is to replace the *entire* manual `docs/`
> corpus (14 files) with universal generators over the single read model. ADR-010 (composable-helper
> composition) + the `api-reference` `@architect-shape` tier are **only step 1**. The information
> architecture that grounds the whole program was hard to gather and is **not** disposable.

So this pass: (a) kept the doc-gen **foundation live** (`DOCS-IA-FINDINGS.md`, `HUD-IDEATION.md`,
`EXECUTION-PLAN.md`); (b) created **spec-graph entry points** into that work — these are pointers into
the base, not a replacement for it; (c) archived only the **genuinely-shipped** campaign residue (the
WS-5/6/7 handoffs); (d) recorded the pre-deletion checklist below.

Method: every claim was cross-checked against the **live** PatternGraph (`pnpm architect:query`) and the
changeset (`git diff`), per architect-base §16 (the live graph wins over a worklog).

## The doc-gen foundation — stays live (the base of the whole capability)

| Doc | Why it stays live |
| --- | --- |
| `DOCS-IA-FINDINGS.md` | The information-architecture base: the 7-surface source-of-truth map, the overlap/duplication matrix, the broken-claims register, the **generator quality ledger**, the **target-state corpus** (every manual doc → its generated replacement), and the prioritized roadmap (R1, R3–R7; R2 done). This is the requirements substrate for replacing all of `docs/`. Hard to reconstruct — do not bury. |
| `HUD-IDEATION.md` | The read-surface progressive-disclosure model (`ContentRichness` / `--disclosure`). Steps 1–2 shipped; the disclosure vocabulary underpins the audience-shaping in `OneSourceMultipleAudiences` and the brief bundle. |
| `EXECUTION-PLAN.md` | The WS-3 plan + the §6 gate sequence + method guardrails for the ongoing work. |

## Spec-graph entry points created (pointers into the base, not a transfer of it)

These give the capability queryable anchors in the graph. The detailed requirements still live in
`DOCS-IA-FINDINGS.md`; each entry point references back to it.

| Entry point (domain-named) | Anchors | Source |
| --- | --- | --- |
| `DocumentationProjection` epic — enriched with the **guiding principle** (similar docs = one generation family over partially-overlapping sources, shaped per audience by progressive disclosure, never duplicated), the **MVP discipline** (build docs as needed, no bulk catalog), the **corpus scope** (all technical docs + core skills body + maintained repo docs), and two retirement/parity invariant Rules + an open question | the whole capability's essence + the manual-docs→generator program + the source-less-generator (empty `quarter`/`phase`) decision | the user's articulation (2026-05-27) + `DOCS-IA-FINDINGS.md` §6 R1/R3–R7 (full corpus + ledger stays in that doc) |
| `TaxonomyDocumentationCluster` — new idea spec, `DocumentationProjection` member | the **MVP first proof-point**: one source (tag registry) → skill / reference / formal-spec / live-API shapes, generated as one family | `DOCS-IA-FINDINGS.md` + epic Validation Targets (taxonomy cluster) |
| `ApiReferenceShapeCoverage` — new idea spec, `DocumentationProjection` member | the deferred bulk `@architect-shape` pass over ~62 contract + 7 codec modules + its done-bar | `HANDOFF-WS7-shape-tier.md` (archived; rendering shipped) |
| `ArchitectBriefDeterministicBundle` — `Q-TOKEN-BUDGET-SIGNAL` (step 4 = that spec itself) | the deterministic token-budget signal on read verbs + the composite brief verb | `HUD-IDEATION.md` steps 3–4 (stays live) |
| `DecisionRecordTemporalHygiene` — new candidate spec | the unenforced decisions-only rule + the unaudited offending ADRs | `state.json` `ws3` ADR-hygiene follow-up |

## Already resolved by the current changeset (verified)

- **R2** (validation-rules markdown over-escaping) — **fixed**: `docs-live/VALIDATION-RULES.md` has zero
  backslash-escape artifacts after the `escapePlainMarkdownLine` / `inlineCode` rework.
- **WS-7 rendering-home decision** — **resolved + shipped**: the `@architect-shape` surface renders into a new
  `api-reference` documentType. Only the annotation *coverage* remained → `ApiReferenceShapeCoverage`.
- **WS-5/6 (`HANDOFF-docs-api-sweep.md`)** — shipped and integrated into the live graph.
- **WS-8 → ADR-010** — the falsified universal-projection engine + the chosen composable-helper direction are
  durably recorded in `architect/decisions/adr-010-documentation-composition-helpers.feature`.

## Disposition of every `.pr-coordination/` document

| Document | Disposition |
| --- | --- |
| `DOCS-IA-FINDINGS.md` | **Live (doc-gen base)** — the IA + target-state corpus + roadmap driving WS-3 |
| `HUD-IDEATION.md` | **Live (doc-gen base)** — the disclosure model |
| `EXECUTION-PLAN.md` | **Live (doc-gen base)** — WS-3 plan + §6 gates |
| `README.md` | **Live** — read-path reframed: doc-gen is in-progress, base stays, entry points listed |
| `PREAMBLE.md` | **Live** — mandatory skills + API-first |
| `DECISIONS.md` | **Live** — standing-rules digest (all decisions resolved) |
| `state.json` | **Live** — phase tracker; WS-3 reframed as in-progress capability |
| `SESSION-REPORTS-AND-LEARNINGS.md` | **Live** — appended a consolidation entry |
| `CONSOLIDATION-2026-05-27.md` | **Live** — this file |
| `HANDOFF-docs-api-sweep.md` | **Archived** → `archive/` (WS-5/6 shipped) |
| `HANDOFF-WS7-shape-tier.md` | **Archived** → `archive/` (rendering shipped; coverage → `ApiReferenceShapeCoverage`) |
| `archive/` (pre-existing) | Unchanged — resolved WS-0/1/2 history, resolved decision bodies, WS-1 strategy, session prompts |

## Pre-deletion checklist (before deleting `.pr-coordination/` entirely)

The folder is **not** deletable yet — WS-3 is an open capability. Before deletion:

1. **The universal doc-gen capability is built (or its base has a durable home).** All of `docs/` is replaced by
   generators (the `DocumentationProjection` target-state corpus), OR `DOCS-IA-FINDINGS.md` + `HUD-IDEATION.md` are
   relocated to a durable home tied to the capability (e.g. design-tier specs under
   `architect/specs/documentation-projection/`) so the program survives the folder's deletion. **Open decision —
   see the question to the maintainer in the session summary.**
2. **`DECISIONS.md` standing rules are durable elsewhere.** Most (D-3/6/7/8/10/11/12/15/16/19) are in the skill
   references or guard-enforced; D-21/22/23 are realized in `.agents/skills/` (guarded by `pnpm check:skills`).
   **Action:** one verification pass confirming each resolves to a skill section or a guard rule; migrate any that
   resolve to neither.
3. **`PREAMBLE.md` adds nothing beyond the skills.** Confirm no campaign-unique instruction is lost, then drop.
4. **Session lineage archived.** At final close, append `SESSION-REPORTS-AND-LEARNINGS.md` to
   `archive/SESSION-REPORTS-completed.md` and remove `state.json`.
5. **Gate sequence has a durable home.** Confirmed: architect-base §6 + CLAUDE.md carry the full suite (mirrored
   in `EXECUTION-PLAN.md §6`).

## Gate sequence (mirrors architect-base §6 / CLAUDE.md / EXECUTION-PLAN §6)

```
pnpm typecheck && pnpm build && pnpm test && pnpm test:dogfood
pnpm docs:all && git diff --exit-code docs-live/
pnpm --filter @libar-dev/architect-projection run test:perf:baseline
pnpm -s architect:query arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict
pnpm validate:all && pnpm check:skills
```
