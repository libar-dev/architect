# Design Review — "Universal" Documentation Generation direction

> **Captured:** 2026-05-26. **Status:** preliminary direction review (read-only; no code/spec changed except sharpening the `DocumentationProjection` candidate open questions).
> **Reviews:** the candidate epic `DocumentationProjection` (`architect/specs/documentation-projection/`, in-repo) against the live tree — projection/renderer code, ADRs (`architect/decisions/`), and reproducible Data API queries.
> **Lineage (not in-repo):** the earlier W-DOCS framework proposal and cross-corpus duplication analysis lived in maintainer-local scratch (gitignored) and a campaign-ephemeral coordination log (archived at campaign close). Their load-bearing facts are inlined below so this review stands alone; those paths are intentionally not cited as resolvable references.

This is a design-review capture, not a spec and not an ADR. The capability vision is canon at candidate tier; the _implementation approach_ below is a recommendation with go/no-go gates, awaiting human ratification before any plan/design-tier work begins.

---

## 0. Prerequisite check — architect is functional post-extraction

The campaign's founding crisis (≈40% orphans from refactoring PRs that stripped `@architect-*` annotations) is **resolved**. Live signals (2026-05-26):

- `diagnostics` → `[]`; `danglingReferenceCount: 0`, `unknownStatusCount: 0`, `warningCount: 0` across **280 patterns**.
- `status` → 116 completed (44%) / 131 active / 19 planned / 14 candidate.
- `arch orphans` → 28 total, of which only **6 are `active`** (real annotation gaps); the rest are roadmap specs not yet wired (expected).
- `arch coverage` → 64%, but the denominator includes working-state files (`architect/decisions/`, `architect/releases/`, `architect/specs/`) that D16/D18 deliberately exclude from production role-tagging — production coverage is higher.

**Conclusion:** the Data API is deterministic and reliable; spec-driven development is unblocked **today**. Documentation generation is a downstream capability, not a prerequisite for doing spec-driven work. Treat core-infra polish (the 6 active orphans, WS-3 doc generators) as ordinary maintenance, not a re-enablement blocker.

---

## 1. The phrase collapses two layers — only one is live

| Layer                                | What it is                                                                                                                                 | Status                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Micro — per-doc-type engine**      | Replace projection factories (`buildApiReferenceBundle`) with declarative config (`defineGroupedRoutedDocType`)                            | **Falsified & reverted in a prior session.** `+67 LOC`, zero per-type reduction; per-kind leaf irreducible. (measured & reverted; see §2) |
| **Macro — doc composition (W-DOCS)** | A layer _above_ projections composing fragments + editorial seeds into many doc shapes (skills, READMEs, formal-spec, wikis), multi-target | **Greenfield.** None of `DocDefinition`/`ContentFragment`/`WikiIndexDefinition`/`composeDoc`/`RenderableDocument` exist in `src/`.        |

Do **not** revive the micro engine as the wedge for the macro layer — a prior session built, measured, and reverted exactly that, and left the warning explicit. This review is exclusively the macro layer.

The formal in-repo contract is the candidate epic `DocumentationProjection` and its members `MultiSourceComposition`, `OneSourceMultipleAudiences`, `GoalOrientedNavigation`, `SourceCanonical`. Their invariants are sound; the open questions are the unresolved design risk.

---

## 2. Feasibility finding — the macro layer does NOT hit the WS-8 wall

`render-markdown.ts` (76 KB) has two layers with different cost structures:

1. **Per-kind dispatch** — `MARKDOWN_NORMALIZERS` (`render-markdown.ts:212`): **11 per-kind normalizers + a generic `normalizeGenericFragment` fallback** for the other 33 of the 44 `FragmentSchema` kinds (`fragment-schema.internal.ts:71`). The 11 special-cased kinds are genuinely per-type (e.g. `ApiReferenceDigest` field tables + fenced signatures + ADR-009 escaping). **This is the WS-8 wall** — but it is narrower than it first looks (only 11 kinds are special-cased), which strengthens the feasibility finding below.
2. **Generic block renderer** — `renderBlock()` (`render-markdown.ts:1965`) over the 9-type `Block` union (`blocks/schema.ts`), with constructor helpers (`heading`/`paragraph`/`table`/…) already shipped (`blocks/schema.ts:274-384`) and `renderDocument()` iterating `document.sections`. Trust boundary preserved here too: plain blocks escape via `renderMarkdownText`/`escapeTableCell`; `Trusted*Block` variants pass through.

**Key reconciliation (never stated cleanly in the lineage):** W-DOCS composes at layer 2. A `DocDefinition.build()` returning `Block[]` needs exactly **one** shared renderer (already exists), because per-document variation lives in TypeScript composition code, not in a per-document renderer. WS-8's wall is "every new _structured_ doc type needs a new leaf renderer + schema + dispatch entry." W-DOCS docs share one leaf renderer and differ only in assembly. **The two paths are complementary, not competing:** structured-data docs (api-reference, business-rules) keep the typed-fragment path; narrative/composed docs (skills, READMEs, prose) use block composition.

Feasibility was never the real risk. Value, scope, and risk are.

---

## 3. Critical findings (the things that should give pause)

### 3.1 The premise decayed — the corpus shrank and the riskiest target was already solved by hand

The earlier corpus analysis sized the problem at **≈14,111 lines / 57 files** and leaned hardest on "the `_shared/` doctrine is duplicated across 9 session skills." That is no longer true. This branch (`campaign/docs-and-skills-consolidation`) already did it:

- `_shared/` is **gone**.
- 9 skills → 3 mandatory + 1 carve-out + omo (~2,482 lines).
- The exact "doctrine fragments" (four-tier-ladder, rule-block-template, annotation-ownership, fsm-transitions) now live as `architect-base/references/*.md`, **progressively disclosed by directory + lazy-load** — the "INPUT disclosure" the `ContentFragment` framework was invented to provide.

The skills problem was solved with **files + a loader**, not a framework. W-DOCS's largest, riskiest sub-goal (D7: skills as generated `WikiIndexDefinition`s) is **substantially moot.** `formal-spec/` (4,511 lines) and `docs/` (4,635 lines, 14 files) are still hand-authored and still duplicate data — that is where genuine leverage remains.

### 3.2 "Generation" equivocates — the highest-leverage topics are content-ROUTING, not generation

Of the 11 cross-corpus duplication topics the analysis identified, **five (four-tier ladder, rule-block template, annotation ownership, value transfer, project layout) are hand-written doctrine with no code source.** For those, W-DOCS does not generate — it loads `_shared`-style markdown via `preamble()` and re-emits at different depths. Two different things wear one name:

- **Genuinely generated** (FSM table, tag registry, config schema, CLI verbs, MCP tools, scope-validate verdicts): derivable from Zod/CLI/FSM code. **This is where all the real drift lives** (stale tool counts, stale taxonomy).
- **Merely routed** (the doctrine prose): no code source, doesn't drift from code, low maintenance payoff.

### 3.3 Parallel-pipeline irony

The campaign's banner is ADR-006 Single Read Model (anti-pattern: "Parallel Pipeline"), yet `DocDefinition.build()` hand-composing `Block[]` is a second _authoring_ model alongside typed `project*()`. It reads the same graph (so not a read-model violation), but it must be a **conscious, ADR-documented** decision with an explicit rule for which path a new doc takes — not smuggled in under the anti-duplication banner.

### 3.4 `SourceCanonical` vs. the skills — the spec forbids the safe plan

`SourceCanonical`: _"no parallel-tree narrative file owns claims about shipped behavior the projection then mirrors."_ Skill bodies are exactly that. Taken literally the spec forbids the current skills. This forces a fork: skills become projections (high risk, now unnecessary per §3.1), OR skills are declared editorial framing and carved out (the safe answer — which shrinks the campaign to data-derived docs). You cannot have both. `architect-base` §10 ("strip context to match the form" is a refused failure mode) warns directly against mechanizing the skills.

### 3.5 Cost/risk asymmetry + two landmines

- **Asymmetry:** ~10–14 sessions; value concentrated in ~5–7 data extractors + the generated-insert directive (~2–3 sessions). The rest buys the framework tower whose prime beneficiary (skills) is solved. Front-loaded value, back-loaded cost/risk.
- **Block-vocabulary duplication:** `SectionBlock` exists twice — `architect-core/src/config/section-block.ts` and `architect-projection/src/blocks/schema.ts` (`BlockSchema`). Reconcile to one (No-BC) before building on it.
- **Trust-boundary distribution:** ADR-009 escaping is centralized in the renderer's per-kind normalizers today; block-composing `build()` functions push the trusted-vs-sourced decision to every doc-config author. Escape-by-default mitigates; the surface widens.

---

## 4. Recommended decomposition

Split along the §3.2 seam. Ship the real part; defer/kill the risky-overtaken part.

- **Track A — Generated inserts (GO; the 80/20).** The `<!-- generated:source:start -->…<!-- end -->` directive + 5–7 data extractors (`extractCliCommands`, `extractMcpTools`, `extractFSMTransitionMatrix`, `extractTagRegistry`, config-schema, `extractScopeValidateOutcomes`). Host docs stay hand-authored; only data tables regenerate. Closes the real drift, gated by the existing `docs:all && git diff --exit-code docs-live` oracle. **Near-superset of the in-flight docs work** — fixing the `validation-rules` over-escaping and generating a config/MCP reference from the registry are the same items, already on the docs backlog.
- **Track B — Single-doc `DocDefinition` proof point (CONDITIONAL GO).** Rebuild exactly one doomed doc — `docs/ARCHITECTURE.md` (1,625 lines, in-repo; it still teaches a _stale_ "four-stage codec pipeline" the fragment-based projection replaced) — as a `DocDefinition` over the block renderer. If it doesn't clearly beat "hand-write + generated inserts," **stop; the macro layer isn't worth it.**
- **Track C — `ContentFragment` + `WikiIndexDefinition` + multi-target skills (NO-GO).** The framework's rich-doc engine is a rebuild of the `reference/` block-composition machinery (`createReferenceCodec` / `REFERENCE-SAMPLE`) that was an **experiment deliberately removed** in the monorepo→subpackage refactor to cut complexity — confirmed: zero residue in the current tree (absent from the 44 fragment kinds, no orphaned projections/renderers). Rebuilding it re-introduces the exact complexity the refactor existed to remove. Compounding reasons: prime beneficiary already solved (§3.1), the `SourceCanonical`-vs-skills contradiction (§3.4), and the bulk of the cost. Revisit only if a future need genuinely changes this calculus.

---

## 5. Go / No-Go gates

**Pre-commitment (decide before any planning session):**

1. **Re-baseline gate.** Re-count the hand-authored doc corpus (`docs/` + `formal-spec/`) against today's tree; the earlier ≈14k-line figure predates the skills consolidation. If surviving duplication is dominated by _data_ topics → scope to Track A. (Likely.)
2. **Editorial-framing decision gate.** Make it an explicit ADR: skills + narrative intros are editorial framing, carved out of `SourceCanonical`. If you can't commit, the campaign is blocked on an unresolvable contradiction.
3. **Parallel-authoring ADR gate.** ADR sanctioning block-composition as a second authoring model, with the per-doc routing rule. No macro code before it.
4. **Block-vocabulary reconciliation gate.** Pick one canonical `Block`/`SectionBlock`, delete the other (No-BC).

**In-flight kill criteria:** 5. **Track B parity gate.** If the `DocDefinition` rebuild doesn't beat hand-authored + inserts → kill Track C. 6. **Determinism gate.** Any wave that can't produce a byte-stable `docs-live` diff is not done. 7. **Net-LOC gate (the WS-8 lesson).** Framework LOC added without host LOC removed or drift closed = failed rationale. Same rubric that correctly killed the micro engine.

---

## 6. Maturity-level guidance (what gets recorded where)

For this body of work specifically:

| Artifact                                                                              | Home / tier                                        | Rationale                                                                           |
| ------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| This review (direction + gates + findings)                                            | `architect/design-reviews/` (durable reference)    | Reviews a direction with open questions; not a spec, not a settled ADR.             |
| `DocumentationProjection` epic + members                                              | **stays `candidate`**; sharpen open questions only | Invariants sound; questions open; premise needs re-baseline. Promotion now = bloat. |
| Steers ("skills are editorial framing", "block-composition is a sanctioned 2nd path") | **gates here, not ADRs**                           | ADRs are settled decisions; these await ratification (gates 2–3).                   |
| Core-infra re-enablement (WS-0/1/2)                                                   | **no spec** (done)                                 | `plan.md` tripwire: no retroactive specs for shipped work.                          |
| Generated-insert capability (Track A)                                                 | **idea-tier spec — only after commitment**         | Premature; gate 1 (re-baseline) decides scope first.                                |

General rule reinforced: invest detail where architecturally significant/non-routine; refuse both "bloat to satisfy the form" and "strip context to match the tier" (`architect-base` §10).

---

## 7. Open questions to resolve before planning (from the candidate specs)

- **Editorial framing** (epic `00`, `SourceCanonical 04`): exception to no-write-side, or source-routed? (Gate 2 forces this.)
- **Source-conflict resolution** (`MultiSourceComposition 01`): when JSDoc and a Gherkin Rule disagree, which wins and how does the conflict surface? No mechanism exists today.
- **Agent-context size budget** (`OneSourceMultipleAudiences 02`): hard/soft/harness-derived line limit? Link-out vs inline-on-demand when an agent needs more depth?
- **Cross-package canonical ownership** (`SourceCanonical 04`): the FSM lives in `architect-guard` but is cited by formal-spec + skills — where is _the_ canonical source aggregate? (Hardest, unsolved.)

---

## 8. Recommended next steps

1. **Re-baseline the corpus** (gate 1) against today's tree — cheapest, highest-value, de-risks any plan built on the decayed 14k-line estimate.
2. **Size Track A + Track B against the live tree** — the substrate is the existing `blocks/` + renderer code (re-derivable); the manual-doc decomposition target is `docs/ARCHITECTURE.md` itself. (Older sizing notes exist only in gitignored maintainer scratch.)
3. **Draft gating ADRs 2–4** (editorial-framing carve-out; parallel-authoring sanction; block-vocab reconciliation) — blockers, cheap to write.

Do (1) before any implementation planning.
