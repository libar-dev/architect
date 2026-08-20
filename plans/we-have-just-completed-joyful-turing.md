# Plan — Make the Architect API a no-brainer grep replacement (effectiveness pass)

## Context

The architect package family was recently extracted from a monorepo. Prior sessions got it **operationally green** (typecheck/test/validate/guard/docs-determinism/perf all passing) and proved the read kernel (`PatternGraphAPI`) is **correct but under-exercised and under-promoted**. The repo now needs the _effectiveness_ layer, not more correctness.

The user set the tone for this whole effort (answering the core-package scoping question):

> "Correctness of annotations is not measurable mechanically. Annotations are good **if Claude gets what is needed in the graph and API for effective codebase inspection** and architectural views and graph slices — token-efficient views as a **no-brainer replacement for grep** and custom scripts for repo exploration. … Core capabilities of architect are almost there but **not very effective at the moment**. [This] is intended to … trigger rethinking on what is needed and **what can be removed**."

**Organizing principle for every workstream below:** the success test is not "validators pass" — it is _"can an agent answer the real questions it would otherwise grep for, token-efficiently, through the API?"_ That reframes goal 2 (annotations are good iff they yield useful graph slices), unifies it with goals 1/3 (overview/API are the surfaces that must _deliver_ those slices), licenses **removal** of dead/noisy surface (No-BC), and makes **dogfooding the measure of done**.

A reframing surfaced during exploration that must be stated up front: **the core-package annotation audit found ZERO mechanical defects** (all roles/statuses/`@architect-uses` valid, no dangling refs, no duplicate identities — verified via `arch dangling`/`diagnostics` returning `[]`). So this is not a defect-cleanup. The real gaps are _effectiveness_ gaps: lossy/under-surfaced API output, an unguarded read kernel, a flat front door, and a stale manual.

Confirmed decisions this session:

- **Goal 2:** Option 1 directionally (specs + fixes), but **measured by dogfooding effectiveness, and including removal** — not a mechanical sweep.
- **Hook:** improve the bash stopgap **in place** (plugin migration is a separate cross-repo campaign; `architect-claude-plugin` lives in the proprietary `architect-studio` repo).
- **Extras (all three included):** self-documenting CLI value errors, restore dropped classification fields on `pattern`, and a `pnpm format` sweep.

Branch fit: we are on `campaign/docs-and-skills-consolidation`, which already owns goals 1/3/4 and the bulk of the unformatted files — this work lands on that campaign.

---

## Execution model — agent-heavy, dogfood-driven

Run as a multi-agent **Workflow** (ultracode is on; the user asked for heavy agent use). The shape is **discover → fan-out fix → verify**, with strict file-ownership boundaries between concurrent implementers and a dogfooding harness book-ending the run (baseline before, re-measure after).

Phase 0 produces the **Gap Ledger** that drives Phases 1–2 — we do not guess what to add/remove; we let real exploration tasks reveal it.

---

## Phase 0 — Dogfooding effectiveness baseline (discovery)

**Why first:** the user's bar is "no-brainer grep replacement." We must _measure_ the gap before closing it, and the measurements become regression evidence.

Fan out N agents (≈8–12), each handed one realistic **fresh-agent exploration scenario** — the questions an agent actually asks when it lands in this repo — with a hard rule: \_answer ONLY through `pnpm -s architect:query <verb>` (or `architect\__` MCP); record every grep/Read fallback as a failure.\* Representative scenarios:

- "What is the read model and what reads it?" (kernel discovery)
- "What does `MarkdownRenderer` depend on, transitively, and what's blocking it?"
- "What business rules constrain the projection trust boundary?"
- "Show me the architecture of the projection pipeline and its bounded contexts."
- "What's the taxonomy — valid roles/statuses/tags — and where is it enforced?"
- "Which ADRs govern the read model, and what did they decide?"
- "What's `active` right now and what's the next workable roadmap item?"
- "Classify `pattern-graph-api.ts`: role, context, layer, product-area." ← directly exercises the dropped-classification-fields gap.

Each agent emits a structured record per scenario: `{question, verbsTried, answeredViaApi: bool, grepFallbackNeeded: bool, payloadTooBig|tooSmall|missingField, frictionNote}`. A synthesis agent **deduplicates** into the **Gap Ledger**, bucketed:

- **ADD** — missing views/slices/fields/verbs the API should expose.
- **REMOVE** — dead/orphaned/noisy surface that wastes tokens or misleads (No-BC deletes).
- **ANNOTATE** — patterns whose graph slice was unhelpful because annotations under-describe them.
- **GUIDE** — overview/hook/skill guidance gaps (agent didn't know the right verb existed).

**Critical files to seed agents:** `scripts/api-capability-tour.sh` (existing 9-step demo — extend its spirit), the data-api skill verb table, `docs-live/INDEX.md`.

**Output artifact:** `.pr-coordination/DOGFOOD-GAP-LEDGER.md` (campaign-scoped, ephemeral). This is the spec for Phases 1–2.

---

## Phase 1 — Overview as the self-promoting front door (goals 1 + 3)

The overview verb is the agent's first touch. Today it renders PROGRESS → ARCHITECTURE → ACTIVE PHASES → BLOCKING → GENERATED VIEWS → CLI HINTS, and the data behind richer slices is **already precomputed on the graph but unsurfaced**.

**1a. Wire the dead `summary-with-references` richness tier (the headline of goal 3).**
`--richness summary-with-references` currently renders **byte-identical to `summary`** — confirmed: `render-compact-text.ts:183` (architecture) and `:205-210` (generated views) both take the `summary` path. This is a designed-but-unwired tier whose name _promises references it never adds_. Wire it to surface the progressive-disclosure orientation docs the user named — TAXONOMY, DECISIONS, VALIDATION-RULES, BUSINESS-RULES, API-REFERENCE — **derived, not hand-authored**:

- These map 1:1 to `documentation <type>` verbs already in `SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES` (`index.ts:137-142`). Tag an "orientation" subset on the registry identities (or derive by key) so the references list never drifts from the supported set — same discipline as the existing derived `OVERVIEW_GENERATED_VIEWS`.
- Surface the `--disclosure <essential|important|useful|advanced>` mechanic here so agents learn drill-down exists (`disclosure/levels.ts:9`).

**1b. Surface precomputed distributions, richness-gated.**
Add overview sections fed by views the graph _already_ computes — near-zero cost:

- **Role / bounded-context distribution** — from `context.graph.byRole` / `listRoles()` (`read-api/pattern-graph-api.ts`).
- **Annotation-coverage line** — `buildAnnotationCoverage` already exists at `projections/operational-insights/index.ts:264`.
- **Orphan-pattern count** — `findOrphanPatterns` in `read-api/graph-inventory.ts` (the rot-detector that is itself currently un-surfaced).
- Gate so `summary` stays lean, `summary-with-references` adds orientation links, `full` itemizes everything.

**1c. Curate CLI hints from the Gap Ledger.** `OVERVIEW_CLI_HINTS` (hardcoded in `index.ts`) should name exactly the verbs the dogfooding agents _wished they'd known_ — and drop any that didn't earn their line.

**Insertion points (from exploration):** new sections at `render-compact-text.ts` after line 120 / 129 / 152; fragment fields added to `fragments/operational-insights/{overview-digest,supporting}.ts` (Zod `strictObject`, `z.infer` types). Keep `name-only` untouched.

**1d. Extra fix — self-documenting CLI value errors.** `parseSchemaValue` (`commands/_shared/schemas.ts:127-133`) `catch`es the Zod error and re-throws a bare `new Error(errorMessage)`, so `--disclosure brief` collapses to the cryptic `Error: --disclosure` instead of "expected one of essential|important|useful|advanced". Surface the accepted enum in the thrown message (the `z.enum` carries it), mirroring the self-documenting `query <typo>` whitelist behavior the skill already praises. This fixes a whole class of flag errors at once (`parseDisclosureLevel` `read.ts:62`, and siblings).

**1e. Extra fix — restore dropped classification fields on `pattern`.** `pattern <Name> --format json` returns `{role, status, maturity, …}` but **omits `boundedContext`, `productArea`, `level`** though the source carries them (verified: keys are `deliverableManifest, deliverables, description, file, kind, maturity, package, patternName, relationships, role, rules, source, status, stubs`). This makes the per-pattern read-kernel output lossy — directly undercutting "classify this file via the API." Extend the `PatternDetail` projection + its fragment schema to surface the three classification axes (role · bounded-context · layer + product-area). **Ripples the determinism gate** — regenerate and commit `docs-live/` in the same change.

---

## Phase 2 — Core package effectiveness (goal 2, reframed)

Driven by the Gap Ledger, not by a quota. The measure is "does the graph slice for this pattern answer what an agent needs."

**2a. Fix the two test/prod pattern-name mismatches (real correctness bugs).**

- `tests/features/types/error-factories.feature` declares `@architect-pattern:ErrorFactories` but production is `ErrorFactoryTypes` (`types/errors.ts:3`).
- `tests/features/types/result-monad.feature` declares `@architect-pattern:ResultMonad` but production is `ResultMonadTypes` (`types/result.ts:3`).
  These break the bipartite spec↔pattern link. Align names and add `@architect-implements:<ProdPattern>` so reverse traceability resolves.

**2b. Add the 4 missing `@architect-implements` edges.** The 4 feature files without the tag (`extractor/external-relationship-tags.feature`, `extractor/value-format-canonical-values.feature`, plus the two above) — wire each to its production pattern or confirm it's a deliberately test-scoped pattern.

**2c. Backfill executable specs for the read kernel — ONLY for surfaces dogfooding proves useful.**
`tests/features/read-api/` has just `pattern-graph-api.feature` + `pattern-graph-api-consistency.feature`. `GraphInventory`, `ArchitectureInspection`, `PatternHelpers`, `PatternClassification` have no dedicated executable spec. For each, the Gap Ledger decides: **spec it** (if the dogfooding agents reached for it) or **remove it** (No-BC — if it's orphaned surface nobody needs). The prior session already committed the _canonicalize-onto-kernel_ direction (`b6221f3`), so default is "spec the surfaces that survived canonicalization; delete the ones that didn't."

**2d. Wire the jsdoc-boilerplate audit to core + clean boilerplate.** `packages/architect-projection/scripts/jsdoc-boilerplate-audit.mjs` runs in CI for `architect-projection` only; **architect-core uses the same boilerplate phrases uncaught** (e.g. `read-api/pattern-graph-api.ts:11-12`, `architecture-inspection.ts:11-12`). Extend the audit to scan `architect-core` and replace the boilerplate with substantive `@architect-*` rationale where the Gap Ledger flagged an unhelpful slice.

**2e. ANNOTATE / REMOVE per ledger.** Enrich annotations where the slice was unhelpful; delete dead exports/methods the dogfooding surfaced (the prior review found ~23/29 kernel methods had zero production callers — re-confirm post-canonicalization and prune the genuinely-dead ones).

---

## Phase 3 — Hook improvement in place (goal 1)

Improve `.codex/hooks/architect-api-first.sh` (and its `.claude/hooks/` twin — keep them identical; both registered at `.claude/settings.json:3-14` and `.codex/hooks.json:2-14`):

- **Close the PostCompact gap.** The hook already detects `SOURCE` (startup/resume/clear/compact) but deliberately **skips** the live overview + contract on `compact` — so long sessions lose the API-first context after compaction (FEEDBACK.md:41). Re-inject at least the contract + skill-load nudge on `compact`.
- **Remove the silent 4000-char truncation** of the live overview snapshot (no marker today) — either render `--richness name-only`/`summary` (now compact by design after Phase 1) so truncation is unnecessary, or add an explicit "(truncated — run `overview` for full)" marker.
- **Align hook content with the improved overview** — the contract's default-verb list and the "Load mandatory skills now" block should match the Phase-1 overview and Phase-4 skills.

Out of scope (explicitly): porting `architect-claude-plugin` (PreToolUse enforcement, full PostCompact) — that is a separate cross-repo campaign.

---

## Phase 4 — Skill sync (goal 4)

Bring the three SKILL.md bodies back in lockstep with the live CLI (they are the agent's manual; they drift silently because they're not projected). Update `.agents/skills/architect-{base,data-api,sessions}/SKILL.md` (canonical; the `.claude`/`.codex`/`.opencode` trees symlink in — `check:skills` stays green):

- **data-api skill:** document `--richness` levels (`overview`) **and** the valid `--disclosure` levels `essential|important|useful|advanced` (`documentation`) — the skill currently shows neither enum, which is _exactly_ what caused the false "flag broken" report. Correct the documentation type count to **13** (the skill says 12 and omits `api-reference`). Document the new overview behavior (orientation references, distributions). Note the `pattern` output now carries classification fields (after Phase 1e). Note the `open-questions --parent X` quirk (excludes X's own questions). Refresh stale example counts (266→~286). Bump the **Provenance** line to today's verified state.
- **base skill:** verify §3/§14 against live (the `design-reviews` "auto-generated" labeling is already correct in the loaded body — confirm). Sync the verb-surface summary with the Phase-1 overview.
- **sessions skill:** confirm reference routing still matches; no verb drift expected.
- **FEEDBACK.md:** close the entries this chunk resolves (the `--disclosure` confusion → now self-documenting; classification-field gap → now surfaced; PostCompact → now re-injected) with resolving-commit notes; leave open ones (plugin migration) annotated.

---

## Phase 5 — Verification + housekeeping

**Re-run the dogfooding harness (the effectiveness measure).** Re-execute the Phase-0 scenarios against the changed API and diff the Gap Ledger — every ADD/REMOVE/ANNOTATE item should now resolve API-only with no grep fallback. This is the proof the user's bar is met, not just that gates are green.

**Extra fix — format sweep (3c).** `pnpm format` over the 42 unformatted files (mostly skills/docs this branch owns) as a **dedicated `style:` commit**, separate from the substantive changes, to clear the red `format:check` CI gate.

**Full gate run (all must be green before any commit):**

```bash
pnpm typecheck && pnpm typecheck:dogfood
pnpm test && pnpm test:dogfood
pnpm lint && pnpm format:check
pnpm validate:all && pnpm architect:guard --staged
pnpm docs:all && git diff --exit-code docs-live      # determinism gate — Phases 1e/2 ripple here
pnpm -s architect:query arch dangling --strict --baseline packages/architect-guard/src/lint/dangling-baseline.json
pnpm test:perf:baseline                              # overview now does more graph walks — watch the budget
bash scripts/api-capability-tour.sh                  # smoke the demoed verbs
```

**Commit hygiene:** explicit-file staging, `type(scope): summary`, logically grouped (front-door / core-effectiveness / hook / skills / style). Commit only when the user asks. Determinism-gate-coupled changes (source + regenerated `docs-live/`) committed together.

---

## Critical files (reference, by phase)

| Phase | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | `scripts/api-capability-tour.sh`; `docs-live/INDEX.md`; new `.pr-coordination/DOGFOOD-GAP-LEDGER.md`                                                                                                                                                                                                                                                                                                                                                                                             |
| 1     | `packages/architect-cli/src/cli/commands/reporting.ts:26-56`; `packages/architect-projection/src/projections/operational-insights/index.ts:130-262`; `…/renderers/render-compact-text.ts:103-211`; `…/fragments/operational-insights/{overview-digest,supporting}.ts`; `…/disclosure/{levels,spec}.ts`; `…/read-api/{pattern-graph-api,graph-inventory}.ts`; `packages/architect-cli/src/cli/commands/_shared/schemas.ts:127-133` + `read.ts:62`; the `PatternDetail` projection + fragment (1e) |
| 2     | `packages/architect-core/tests/features/types/{error-factories,result-monad}.feature`; `…/tests/features/extractor/{external-relationship-tags,value-format-canonical-values}.feature`; `…/tests/features/read-api/`; `…/src/read-api/{graph-inventory,architecture-inspection,pattern-helpers,pattern-classification}.ts`; `packages/architect-projection/scripts/jsdoc-boilerplate-audit.mjs`                                                                                                  |
| 3     | `.codex/hooks/architect-api-first.sh`; `.claude/hooks/architect-api-first.sh`; `.claude/settings.json`; `.codex/hooks.json`                                                                                                                                                                                                                                                                                                                                                                      |
| 4     | `.agents/skills/architect-{base,data-api,sessions}/SKILL.md`; `FEEDBACK.md`                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Doctrine guardrails (do not violate)

- **No hand-authored projections.** Overview references/distributions derive from the graph + registry, never a hardcoded list that can drift.
- **No-BC.** Removals are deletes, not deprecations/aliases. No `@ts-ignore`, no `eslint-disable`, no `--no-verify`.
- **Zod-first.** New fragment fields are `z.strictObject` with `z.infer` types, parsed once at the boundary.
- **Determinism gate is load-bearing.** Any projection change requires regenerating and committing `docs-live/` in the same change.
- **Dogfood-or-delete the kernel.** Don't spec a surface you're about to delete; the Gap Ledger forces the canonicalize-vs-remove call rather than deferring it.
