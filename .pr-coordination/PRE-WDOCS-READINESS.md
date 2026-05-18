# Pre-W-DOCS-1 readiness — remaining work and sequencing

> **Captured:** 2026-05-17, immediately after the `architect-projection` final-improvements campaign landed (5 commits `c74814f` → `a4c2ddb`) and was reviewed by `code-reviewer` and `code-simplifier`. **Status:** **RESOLVED — historical.** All immediate, parallel, and most deferred items have been executed; the file is retained for audit. See § 0 below and `NEXT-SESSION.md` for the current state.
>
> **Read order:** `README.md` → `DEEP-DIVE.md` → `INVENTORY.md` → `PROPOSED-DESIGN.md` → `DECISIONS.md` → **this file** → `IDEATION-SPECS.md`.
>
> **Purpose:** consolidate every loose thread that touches the W-DOCS-1 PoC substrate so the next session opens with a clean working state. Nothing here invalidates `DECISIONS.md`; this file is a sequencing artifact, not a design artifact.

---

## 0. Resolved — 2026-05-17 cleanup mapping

Every immediate (§ 4) and parallel (§ 5) item is done. One deferred item
(D-1) is also done. Cleanup plan: `pre-w-docs-1-debt-cleanup.md`.

| Section | Item                                    | Commit                            | Notes                                                                                                      |
| ------- | --------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| § 4 A-1 | Commit uncommitted fixups               | `882c189`                         | Both hunks landed verbatim                                                                                 |
| § 4 A-2 | Polish backlog issue                    | `fea0383`, `c95517c`, `aae1993`   | Items inlined as commits instead of a backlog issue                                                        |
| § 4 A-3 | Repo-wide Prettier sweep                | `4f6a171` (+ drift fix `37ac815`) | 317 files, single atomic commit                                                                            |
| § 5 P-1 | Rename `DeliverableManifestSchema` pair | `aae1993`                         | Done pre-emptively (E in cleanup plan)                                                                     |
| § 5 P-2 | WHY comment in `splitOversizedDocument` | `fea0383`                         | One-line at `render-markdown.ts:2158`                                                                      |
| § 5 P-3 | Compare-baseline comparator dedup       | `fea0383`                         | `checkBudget` helper, 4 → 1 call sites                                                                     |
| § 5 P-4 | `resolveInvocationDir` precedence audit | `f7f4e30`                         | Inverted to cwd-first; regression test in `architect-cli`                                                  |
| § 6 D-1 | `@architect-usecase` retire-or-narrow   | `691da3c`                         | **Retired.** End-to-end (registry + Zod schemas + AST extractor + 8 doc files). Net taxonomy delta: -1 tag |

**Deliberate non-actions** (per `1833126` revert commit):

- **No PDR-002** for the `resolveInvocationDir` change. Bug-fix rationale lives in the commit message + the regression test feature file. Decision records are reserved for durable doctrine, not operational changes.
- **No ADR-010** for the `@architect-usecase` retirement. Consistent with ~30 prior tag retirements (W1.5 taxonomy shrink, DECISIONS.md D3''/D9) that were done without decision records.

**Still deferred** (§ 6 items that remain accurate):

- D-2 — Wave 9 Phase 3 skills packaging (gated on D7 design loop)
- D-3 — Wave 4 public-surface READMEs (subsumed into W-DOCS-5 per Option A)
- D-4 — Substrate splits W-DOCS-2+ will need (no advance work required)

**Branch state:** `campaign/docs-and-skills-consolidation` is at
release-candidate state. Cut `campaign/wdocs-1-poc` from its tip when
W-DOCS-1 starts. See `NEXT-SESSION.md` for the kickoff sequence.

---

---

## 1. State at capture

### What just landed (campaign: `architect-projection-final-improvements`)

Five thematic commits on `campaign/docs-and-skills-consolidation`, matching the plan's commit strategy:

| Commit    | Scope                                                                                       |
| --------- | ------------------------------------------------------------------------------------------- |
| `c74814f` | Substrate contract coverage (T2 — registry-axis contract tests, TDD)                        |
| `3b154d7` | 4-axis registry decomposition (T6) + consumer alignment (T7)                                |
| `58cb485` | Perf gate expansion across `renderMarkdown` doc types (T8) + baseline refresh (T9)          |
| `cf7abe8` | Tranche-one hardening (T10–T13: KindTable, isPlainObject, route parsing, addRoutedDocument) |
| `a4c2ddb` | Markdown perf comparator budgets (final ratchet — `min(hard, baseline × 1.5)`)              |

### What is uncommitted (legitimate fixup, both reviewers confirm)

- `tests/support/helpers/cli-runner.ts` — `GUARD_PACKAGE_ROOT` corrected from `../../../../architect-guard` (resolved outside the repo) to `packages/architect-guard`. Mirror of the `architect-cli` path fix already in `cf7abe8`; same root cause.
- `tests/steps/cli/data-api-help.steps.ts` — `FROZEN_GLOBAL_FLAGS` extended with the two-line "Agent environments: load the `architect-data-api` skill…" footer. Matches `packages/architect-cli/src/cli/commands/_shared/help.ts:29-30` byte-for-byte (verified).

### Reviewer verdicts

| Reviewer          | Verdict                 | Blockers | Polish items |
| ----------------- | ----------------------- | -------- | ------------ |
| `code-reviewer`   | "polish then ship"      | 0        | 4            |
| `code-simplifier` | "matches design — ship" | 0        | 4            |

Both reviewers verified the doctrine surface: zero `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@deprecated`, or BC shims introduced in projection `src/`. Lint, typecheck, build, package tests (172) all green.

---

## 2. Substrate inputs the W-DOCS-1 PoC will build on — verified clean

These are the load-bearing primitives the `.pr-coordination/` design assumes are stable. State at capture:

| Substrate                                             | State                                                                     | Source                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 4-axis documentation-type registry                    | Decomposed; exhaustive via `satisfies Record<…>`                          | `packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.*.ts` |
| Markdown renderer dispatch                            | `StrictKindTable<…>` enforces compile-time exhaustiveness                 | `packages/architect-projection/src/renderers/_shared/dispatch.ts:20-22` + `render-markdown.ts:219`         |
| Route-id parsing                                      | Centralized (`parseLogicalRouteId`, `tryParseLogicalRouteId`)             | `packages/architect-projection/src/routing/route-id.ts:63-111`                                             |
| `isPlainObject` plus lint guard                       | Single source + `no-restricted-syntax` rule                               | `packages/architect-projection/src/shared/plain-object.ts` + `eslint.config.mjs:14-30`                     |
| Perf gate                                             | Real ratchet `min(hard, baseline × 1.5)` over 3 doc types                 | `packages/architect-projection/tests/perf/compare-baseline.mjs:30-34, 73-158`                              |
| `addRoutedDocument` split-path                        | One render reused across measure + emit; split-path threads parent render | `render-markdown.ts:337-340, 2117-2186`                                                                    |
| Pattern-relations identity                            | `PatternIdentitySchema` extracted via `.omit({ kind: true })`             | `packages/architect-projection/src/fragments/pattern-relations/pattern-summary.ts:28`                      |
| `parseMarkdownToBlocks` (preamble foundation)         | Already exported from core, untouched by this campaign                    | `packages/architect-core/src/utils/markdown-parser.ts`                                                     |
| `extractShapes` + `discoverTaggedShapes`              | Already walks JSDoc for `@architect-extract-shapes`                       | `packages/architect-core/src/extractor/shape-extractor.ts`                                                 |
| `presentation-contracts.ts` (ReferenceDocConfig etc.) | Schema present, no consumer — re-wiring is W-DOCS-1 work                  | `packages/architect-core/src/config/presentation-contracts.ts`                                             |

**Implication:** every substrate primitive the W-DOCS-1 PoC needs is either (a) already in place and verified, or (b) explicitly part of W-DOCS-1 itself (`DocDefinition`, `WikiIndexDefinition`, `projectWikiIndex`, `composeDoc`). The campaign is not waiting on hidden substrate work.

---

## 3. Blockers for W-DOCS-1 start

**None.**

Candidate items investigated and rejected as blockers:

| Candidate                                                                     | Why it doesn't block                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate `DeliverableManifestSchema` (pattern-relations vs exec-context)     | Plan T4 explicitly accepted internal duplication; public barrel only exports the canonical variant. Trigger for fixing is cross-module schema-by-name scanning — not on the PoC path.                                                             |
| Hardcoded 12-entry generator dispatch (`documentation-bundle.internal.ts:64`) | The PoC explicitly does NOT touch the existing generator dispatch — it adds a NEW `DocDefinition` runner in `architect-generate` per § 7 of `PROPOSED-DESIGN.md`. The old dispatch stays until W-DOCS-5+ ports lift their respective docs across. |
| Three-axis disclosure split (D2)                                              | The Zod enum stays; consumers split when they consume. W-DOCS-2d does the input-side split; W-DOCS-1 reads from the existing `ProgressiveDisclosurePolicy` consumer-side. No upfront refactor required.                                           |
| `@architect-usecase` decision (D9)                                            | Explicitly non-blocking per D9; PoC does not depend on `@architect-usecase`.                                                                                                                                                                      |
| Wave 4 public-surface README work                                             | Independent surface; can land in parallel or be subsumed into W-DOCS-5 ports.                                                                                                                                                                     |
| Wave 9 Phase 3+ skills exposure                                               | D7 makes skills a _consumer_ of W-DOCS machinery, not a prerequisite. W-DOCS-1 Target A is one skill; full Wave 9 exposure waits on the PoC.                                                                                                      |
| Resolved-invocation-dir audit (`runtime-helpers.ts:36`)                       | Test harness already strips `PWD`/`INIT_CWD`; not on the PoC critical path. Stays on the 1.5.x hardening backlog.                                                                                                                                 |

---

## 4. Immediate actions — commit-ready, no design needed

### A-1. Commit the two uncommitted fixup hunks

Both are corroborated by both reviewers as legitimate fixups, not scope creep.

```bash
git add tests/support/helpers/cli-runner.ts tests/steps/cli/data-api-help.steps.ts
git commit -m "fix(tests): correct guard package root and pin new CLI help footer"
```

Suggested message body: explain the path-resolution drift (`../../../../architect-guard` was outside the repo) and the help-footer pin (FROZEN_GLOBAL_FLAGS now matches `architect-cli/src/cli/commands/_shared/help.ts` byte-for-byte).

### A-2. Capture the simplification follow-ups as an issue / backlog entry

Six concrete polish items, all in `packages/architect-projection/`:

1. `compare-baseline.mjs:161-162` — two `getMetricValue(...)` calls whose returns are discarded (silent existence-assertions); either delete or hoist to a named `assertMetricFieldsPresent(...)`.
2. `compare-baseline.mjs` — four near-identical `checkAverageMetric` / `checkScalarMetric` / `checkHotPathAverageMetric` / inner-`checkRenderMarkdownBundleMetrics` budget comparators could collapse to one `checkBudget({label, actual, baselineValue, hardBudget, unit})` (~200 → ~100 lines).
3. `routing/route-id.ts:77-111` — `tryParseLogicalRouteId` three-branch tree collapses to a single `switch (segments.length)` with index destructuring + one `segments.every(isLogicalRouteSegment)` check (~15 lines saved).
4. `projections/documentation-composition/documentation-type-registry.ts:138-186` — `createLazyReadonlyArrayFacade` is 48 lines of `Proxy` machinery to defer one `Object.freeze`; the registry is 12 entries cold-path doc-gen. Either initialize eagerly or use a plain lazy getter.
5. `renderers/render-markdown.ts` `splitOversizedDocument` (~2118-2186) — add a one-line WHY comment near the second `renderMarkdownDocument` call explaining the `linkOut` injection forces a re-render. The commit narrative says "memoize" but the second render is intentional; a future reader will assume it's dead.
6. `fragments/pattern-relations/supporting.ts:54` (+ paired `DeliverableSchema:52`) — rename to `EmbeddedDeliverableManifestSchema` / `EmbeddedDeliverableSchema` when the headline-demo extractor needs cross-module schema-by-name scanning. Touches `pattern-detail.ts:16-17, 28, 33` and `delivery-reporting/supporting.ts:16`. NOT urgent; the trigger condition does not exist yet.

**Recommended carrier:** a single GitHub issue titled `projection: polish backlog from final-improvements review` with the six items as checkboxes. Each is ≤30 minutes; none are coupled. They can be picked up between W-DOCS waves as cool-down work.

### A-3. Repo-wide Prettier sweep (root `REMAINING-WORK.md` § Wave 2 follow-up)

`pnpm format:check` reports 317 files with style drift. **Do this BEFORE W-DOCS-1 starts** — once the docs campaign begins, the diff will tangle generated-content churn with formatting churn and reviewers will struggle to separate them.

```bash
pnpm format
# Single commit, no other changes
git commit -am "style: repo-wide prettier sweep (deferred from W1.5 lift)"
```

Acceptance: `pnpm format:check` exits 0; `pnpm -r lint && pnpm typecheck && pnpm -r test` stays green.

---

## 5. Parallel-runnable polish (during W-DOCS-1; non-blocking)

These can land at any point during the W-DOCS-1 session without conflicting with the PoC work. Listed in order of suggested pickup if a slot opens.

### P-1. Rename `DeliverableManifestSchema` pair (A-2 item 6)

Becomes blocking only when the W-DOCS-2 `extractZodSchemaFields` extractor + cross-module name scanning lands. Pre-empting it during W-DOCS-1 removes one source of "is this the right schema?" friction during PoC fragment authoring.

### P-2. Add WHY comment to `splitOversizedDocument` (A-2 item 5)

Touches one file, one comment. Worth doing before W-DOCS-1 starts authoring the wiki-tree renderer (which exercises the split path heavily for any wiki page > the line budget).

### P-3. Compare-baseline comparator dedup (A-2 item 2)

W-DOCS-1 PoC adds new `WikiIndexDefinition` rendering — perf gate will need budget rows for it. Doing the dedup first means adding one row instead of four near-identical branches.

### P-4. Resolved-invocation-dir audit (`runtime-helpers.ts:36`, root REMAINING-WORK.md 1.5.x)

W-DOCS-1 runner integration into `architect-generate` is the first non-test embedder of the CLI. Probable trigger for the `PWD`/`INIT_CWD` precedence question. Run it before runner integration starts, not during debugging.

---

## 6. Deferred — W-DOCS-2+ window or later

### D-1. D9 `@architect-usecase` retire-or-narrow decision

Run the diagnostics after W-DOCS-1 closes, before W-DOCS-2 extractor catalog work begins:

```bash
pnpm architect:query tags
pnpm architect:query taxonomy --format json
```

Decide: retire if adoption is sparse, or narrow-rename to `@architect-applicability` (explicit trigger-condition semantics). Either way, the docs campaign does not block on it; this is an independent taxonomy hygiene decision.

### D-2. Wave 9 Phase 3+ skills exposure (root REMAINING-WORK.md § W9)

D7 makes skills a target of the W-DOCS machinery (`WikiIndexDefinition` with `targets: [{ kind: 'agent-context' }]`). The natural sequencing:

- **W-DOCS-1 (now):** PoC Target A is ONE skill (`.claude/skills/wiki-doc-generation/SKILL.md`) — proves the agent-context target shape.
- **W-DOCS-3 (multi-target output):** generalizes to per-skill `WikiIndexDefinition`s.
- **Wave 9 Phase 3 (separate):** decides packaging (`@libar-dev/architect-skills`? `@libar-dev/architect` meta? postinstall step?) and how consumers get the 8 session skills out of the box.

These can be sequenced independently; D7 closes the design loop, Phase 3 closes the distribution loop. The current `.agents/skills/` + `.claude/skills/` symlink layout is the substrate for both.

### D-3. Wave 4 public-surface docs (root REMAINING-WORK.md § Wave 4)

Three open items:

- Polish root `README.md` (currently minimal post-W1.5 sweep)
- Author per-package READMEs for the 5 splits
- Sweep `CONTRIBUTING.md`, `MAINTAINERS.md`, `SECURITY.md` for studio-era URL refs

**Subsumption decision:** the README work is structurally similar to a W-DOCS-5 reference-doc port (preamble + extracted shape catalog). Two options:

- **Option A (subsume into W-DOCS-5):** author each README as a `DocDefinition` once the substrate is proven. Pro: zero double-work. Con: ships pre-publish READMEs late.
- **Option B (parallel, hand-authored):** finish READMEs by hand during W-DOCS-1/2 sessions when those packages are unblocked. Pro: publishable surface ready earlier. Con: throwaway hand-authored content if Option A picks them up later.

**Recommendation:** Option A. Pre-publish (Wave 7) is gated on Wave 4 anyway; W-DOCS-5 completes ~3-5 sessions later. The PoC + extractor catalog being done before README authoring means the READMEs are correct-by-construction. Acceptance: root README + 5 package READMEs are each a `DocDefinition` by end of W-DOCS-5.

### D-4. Substrate splits the docs campaign will need

These are W-DOCS-2 onwards work; called out here so the design session for W-DOCS-2d doesn't rediscover them:

- **D2 disclosure split:** today's `ProgressiveDisclosurePolicy` conflates INPUT (fragment section selection) and OUTPUT (inline vs file split) disclosure. W-DOCS-2d splits the consumers; the Zod enum stays four-valued. No advance work needed in the projection package.
- **Generator dispatch shrinkage:** the hardcoded 12-entry table at `documentation-bundle.internal.ts:64` is the ceiling on what `architect-generate` produces today. As `DocDefinition`s land in W-DOCS-5+, those entries get removed one at a time. Eventually the dispatch table goes to zero and the file is deleted.
- **Codec/extractor revival:** the 19 codec source files + 7 generator source files that were dropped in the package split (per `README.md` external references) are the spec for W-DOCS-2 extractors. Treat as read-only reference; do not lift wholesale.

---

## 7. Sequencing decision matrix

```text
NOW
├── A-1: Commit uncommitted fixups (5 min)
├── A-3: Prettier sweep (30 min; isolated commit)
└── A-2: File polish backlog issue (5 min)

NEXT (one session, ≤2 hours)
└── Plan-tier W-DOCS-1 spec via architect-plan-session
    ├── Methodology: D12 reverse-engineer from PoC targets
    ├── Targets: D4' Target A (skill) + Target B (wiki tree)
    └── Source: this file + DECISIONS.md

W-DOCS-1 (~1 session, ~4 hours)
├── DocDefinition + WikiIndexDefinition types
├── projectWikiIndex projection
├── composeDoc helpers
├── architect-generate runner integration (P-4 audit lands here if not done)
├── Target A: skill emission with frontmatter survival
├── Target B: wiki tree with INDEX.md + child pages
└── Acceptance: both targets generated end-to-end from one source

W-DOCS-2 onwards (~6-10 sessions per § 7 PROPOSED-DESIGN.md)
├── Extractor catalog (W-DOCS-2a/b/c)
├── ContentFragments (W-DOCS-2d) — P-1 rename naturally lands in this window
├── Multi-target output (W-DOCS-3)
├── Generated-insert (W-DOCS-4)
├── 11 reference docs port (W-DOCS-5) — subsumes Wave 4 READMEs (D-3 Option A)
├── Doctrine carriers (W-DOCS-6)
├── Cleanup (W-DOCS-7)
└── Query surface gaps (W-DOCS-8, independent)

INDEPENDENT TRACKS (no W-DOCS dependency)
├── D-1: @architect-usecase decision (any time after W-DOCS-1)
├── D-2: Wave 9 Phase 3 skills packaging (after D7 design loop closes in W-DOCS-3)
├── Wave 5: CI workflows (any time)
├── Wave 6: formal-spec polish — coordinate with W-DOCS-5/6 to avoid churn
└── Wave 7: Publish — gated on Wave 4 (subsumed) + Wave 5 + tests-green
```

### Branching strategy

- The current branch (`campaign/docs-and-skills-consolidation`) has shipped the projection substrate. Once A-1/A-2/A-3 land, this branch is at a natural release-candidate state.
- **Recommended:** open the W-DOCS-1 work on a fresh branch (`campaign/wdocs-1-poc`) cut from `campaign/docs-and-skills-consolidation` after A-1/A-3. Keeps the projection-final-improvements PR reviewable on its own.
- Merge order: projection-final PR → Prettier sweep PR (atomic, easy to skim) → W-DOCS-1 PoC PR.

### When to cut a release

Not yet. Wave 7 (publish `2.0.0-pre.1`) is still gated on:

- Wave 4 public-surface docs (D-3, subsumed into W-DOCS-5)
- Wave 5 CI workflows (independent, can start any time)
- Tests-green guarantee on the published artifact (current state qualifies)

The W-DOCS-1 PoC is **not** a release blocker; it can ship after `2.0.0-pre.1` if needed. The PoC's value is proving the substrate, not gating publish.

---

## 8. Verification gates per phase

| Phase                         | Gate                                                                                                          | Command                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Post-A-1 (fixup commit)       | Dogfood + projection still green                                                                              | `pnpm --filter @libar-dev/architect-projection test && pnpm test:dogfood`                                                                                                   |
| Post-A-3 (Prettier sweep)     | Format clean; tests + lint + typecheck unaffected                                                             | `pnpm format:check && pnpm -r lint && pnpm typecheck && pnpm -r test`                                                                                                       |
| Pre-W-DOCS-1 design-tier spec | All idea-tier `.pr-coordination/ideation-specs/*.feature` marked ✅ by maintainer (per `README.md` gate)      | Manual review of the 5 ideation specs                                                                                                                                       |
| W-DOCS-1 acceptance (D4'/D10) | Two targets generated; ≥2 fragments shared at different disclosures; 4 data-source kinds exercised end-to-end | `pnpm docs:all` produces `.claude/skills/wiki-doc-generation/SKILL.md` AND `docs-live/wiki-doc-generation/INDEX.md` + child pages, both from one source; cross-refs resolve |
| W-DOCS-2+ regression          | Perf gate stays inside `min(hard, baseline × 1.5)` after each new doc type lands                              | `pnpm --filter @libar-dev/architect-projection test` (the perf comparator throws on metric drift)                                                                           |
| Pre-publish (Wave 7)          | Doctrine clean; no `eslint-disable` / `@ts-ignore` / `@deprecated` regressions                                | `pnpm guard:no-suppressions && pnpm validate:all && pnpm -r lint && pnpm typecheck && pnpm -r test && pnpm test:dogfood`                                                    |

---

## Cross-references

- `README.md` — orientation; lists the surviving substrate this file builds on
- `DECISIONS.md` § D4', D10, D12 — PoC scope; this file's § 3 confirms no blockers added since
- `PROPOSED-DESIGN.md` § 7 — wave breakdown; this file's § 7 sequences NOW → NEXT → wave entry
- `/Users/darkomijic/dev-projects/architect/REMAINING-WORK.md` § 1.5.x, § Wave 4, § Wave 9 Phase 3+ — root backlog items this file's § 4-6 reconcile with the docs campaign
- `/Users/darkomijic/dev-projects/architect/.sisyphus/plans/architect-projection-final-improvements.md` — the plan whose completion this file follows from
- `.full-review/05-final-report.md` — pre-campaign substrate work that landed in commits `a9ccdea` through `cc63f0a`; this file's § 2 confirms its outputs are stable
