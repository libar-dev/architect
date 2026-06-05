# Feedback

One file for all Architect-tooling feedback. Append newest entries at the top.
An entry is short: verb you ran, what you expected, what you got, impact on
your session. No template policing — friction kills the loop.

Until the first-class `feedback` verb ships, this file is the loop. Once the
verb lands, structured reports flow through it; this file remains the home
for anything that does not fit the verb's shape.

---

## 2026-06-05 — Finalized TaxonomyDocumentationCluster + reconciled value-transfer / code-stub-identity doctrine end-to-end

Reviewed the uncommitted campaign work across four fronts; validated the prior session's code-stub-identity reversal as **canonically correct** (no doctrine change needed), and found one substantive gap a green gate missed.

- **Doctrine validated, not changed.** Code/contract stubs carrying their own `@architect-pattern` is mandated by `formal-spec/04-tag-registry.md:31` + `:148`, `07-stub-format.md:86-94` (the code-stub Required-Tags table), ADR-003 ("identity travels with code from stub through production"), and ADR-008 (step-stubs are the lone node-less carve-out). `merge-patterns.ts:6-29` rejects only the *same* name in TS+Gherkin, so the distinct `EmissionDescriptor` / `TaxonomyDocumentationCluster` pair is no collision.
- **B1 — a real BLOCKER behind a green `scope-validate`.** `EmbeddedRegionEmissionSchema` carried a single `region`, but the spec requires multiple regions per host (formal-spec: one per digest tag-group; skill: `taxonomy-role-enum` + `taxonomy-tag-count`), and the digest is a childless `projectSingle` bundle with no per-group descriptor hook. `scope-validate … implement` reported READY anyway — the stub parsed, deliverables enumerated, and no scenario exercised the multi-region case. This is a substantive-gap class the mechanical gate cannot see: it checks structure, not whether the contract can express the shape a deliverable names. **Verb-feedback idea:** a `scope-validate` signal when a deliverable/Rule names a shape the stub's schema can't represent would catch this; today it is invisible. Resolved by making the embedded emission a `hostFile` + `regions[]` routing map (DD-6, ADR-010-clean — routing, not a content tree) and adding multi-region / normalization-contract / absent-host scenarios.
- **Value-transfer framing propagated to the top level.** `architect-base` §13 + §8 and `architect-sessions` "the spec is a scaffold" now lead with "deletion ≠ loss" and name the three scaffold destinations (design `.feature` → executable Gherkin; step-stub → step wiring; code/contract stub → **promoted** to `src/`, identity persists). The formal-spec (`02-artifact-types`, `07-stub-format`, `08-spec-evolution`) said "all stubs are deleted" — reconciled to distinguish code-stub promotion from behavioral-spec/step-stub deletion.
- **Authoring-syntax precision.** Doctrine text prescribed colon-form `.ts` tags; the measured convention is space-form for `@architect-pattern` / `-implements` / `-target` / `-status` and colon for `-role:` / `-bounded-context:` / `-product-area:`. Fixed the `design.md` + `annotation-ownership.md` examples (the `emission-descriptor.ts` stub itself was already correct).

## 2026-06-05 — RESOLVED: `design-decisions-recorded` WARN was a doctrine bug, not a check bug

Resolves the earlier entry "`scope-validate … design-decisions-recorded` is structurally unsatisfiable for a doctrine-compliant stub." That entry's premise — that doctrine forbids `@architect-pattern` on stubs, so `findStubPatterns` can never find one — was itself wrong for **code/contract** stubs. The blanket "code stubs MUST NOT carry `@architect-pattern`" lived only in `architect-sessions/references/design.md` and was an over-generalization of ADR-008's **step-definition-stub** rule onto code/contract stubs. The opposite is canonical: `formal-spec/04-tag-registry.md:31` makes `@architect-pattern` a **MUST on stubs**, ADR-003 records "identity travels with code from stub through production," and the extraction predecessor (`architect-studio/…/architect`) authors all 5 code stubs identity-bearing (`@architect-pattern:EnforcementConfig` implementing `EnforcementConfiguration`).

- **Fix applied:** authored `architect/stubs/taxonomy-documentation-cluster/emission-descriptor.ts` with its own code-originated identity (`@architect` + `@architect-pattern:EmissionDescriptor` + `@architect-role:contract` + `@architect-status:roadmap` + `@architect-product-area:Generation` + `@architect-implements:TaxonomyDocumentationCluster` + `@architect-target`).
- **Result:** the stub is now a graph node (`list`/`search`/`pattern` resolve it, `total` 295→296), `TaxonomyDocumentationCluster.implementedBy` points back at it (`arch neighborhood` confirms), and `scope-validate … implement` reports `[PASS] Design decisions recorded: 7 decision(s) found in 1 stub(s)` — WARN cleared, **0 dangling**.
- **Doctrine reconciled:** `architect-sessions/references/design.md` + `architect-base/references/annotation-ownership.md` now distinguish code/contract stubs (identity-bearing) from step-definition stubs (node-less, ADR-008). So `findStubPatterns`'s graph-node requirement is the **correct** contract — no check change needed; the proposed "locate stubs by file" fix would have entrenched the wrong (node-less) convention.
- **Lingering nit:** `pattern <Name> --format json` returned all-null on the *first* call right after the stub edit (cache miss mid-rebuild) while `list`/`search` already saw the node; a second call resolved fully. Minor cache-warming race in the `pattern` verb's rebuild path, worth a look.

## 2026-06-04 — `arch neighborhood <Epic>` silently drops the parent/child (epic↔member) axis — epic reads as near-isolated

- **Verb / surface:** `pnpm -s architect:query arch neighborhood DocumentationProjection` (text and `--format json | jq '.data'`).
- **Expected:** an epic's local subgraph to include its hierarchy axis — the 8 epic↔member parent/child edges — alongside dependency edges, so `arch neighborhood` alone conveys the epic's shape.
- **Got:** only the dependency edge `uses`/`dependsOn` = `ADR010DocumentationCompositionHelpers`. The `ArchitectureNeighborhood` shape carries **no parent/child field at all** (`uses`/`usedBy`/`dependsOn`/`enables`/`seeAlso`/`enforcedBy`/`sameContext`/`implements`/`implementedBy` only), so the 8 member edges have nowhere to land and are silently absent — the epic looks like a near-isolated node with one dependency. The hierarchy is real and surfaces everywhere else: `pattern DocumentationProjection` Hierarchy block lists 8 members, `bundle … --format json` `.root.members` has 8, `list --parent DocumentationProjection --names-only` returns the same 8, and `open-questions --parent` resolves the members.
- **Impact:** a refiner relying on `arch neighborhood` alone to understand an epic's shape would misread it as nearly isolated and miss the entire member sub-tree. The dependency-axis-only behavior is undocumented (no note in `architect-data-api` that the verb excludes the parent/child axis). Either add the hierarchy edges to the neighborhood shape, or document the verb as dependency-axis-only and point readers at `pattern` / `bundle` / `list --parent` for the hierarchy.

## 2026-06-04 — API carried a full WIP-spec design review; one interpretation nuance on the `open-questions` gating count

Reviewed the `DocumentationProjection` candidate family (epic + 8 members) entirely through the Data API (`list --parent`, `pattern`, `dep-tree`, `arch neighborhood`, `scope-validate`, `open-questions --parent … --include-self`, `documentation design-review`). Every verb worked first try and the capability tour passed all 13 steps. `documentation design-review` rendering the unbuilt members status-annotated — with the shipped `DesignReviewProjection` engine rendering its own parent epic's review — is the verb's intended use working as designed; it carried the review with zero spec-file scans for graph state.

- **Nuance (not a defect):** the epic's durable architectural decisions are the **`[gating]`-prefixed** open questions (3). A naive substring match for "gating" over the `open-questions --parent … --include-self` items returns **4**, because a `TaxonomyDocumentationCluster` member question *cross-references* "the epic emission-mode gating question." Count the durable set by the `[gating]` prefix, not by a substring match — the extra hit is a pointer, not a fourth decision. Minor, but it cost a "3 vs 4" reconciliation.
- **`jq`-shape reminder (already skill-documented):** `pattern --format json` puts the axes directly on `.root` (`.root.status`, not `.root.pattern.status`); `open-questions --format json` is `.root.items[].questions`. Guessing `.root.pattern.*` returns `null` silently — re-noting because it still bites.

## 2026-06-01 — Landed: five effectiveness fixes from the dogfood-gap-ledger triage (A1 · A3 · A5 · A10 · D16)

A blind 10-agent triage workflow re-verified the open FEEDBACK/ledger items against the live CLI (8 of 22 were already-closed ghosts — recorded below). The five genuinely-open, completable items landed this session, each gate-validated (typecheck · 1820 projection + 1211 dogfood tests · validate:all · docs-determinism · perf):

- **A1 — `open-questions --parent <Epic> --include-self`** + a compounding regex FIX. `--parent X` excluded the focal epic's own `**Open Questions:**`; worse, the `extractOpenQuestions` regex required a literal `**Open Questions:**` and so silently dropped any heading with a qualifier (e.g. an epic's `**Open Questions (resolved per use-case):**`) from **both** entry points. Fix: tolerate `**Open Questions[^*\n]*:**`, and add an additive `--include-self` flag (projection + CLI). DocumentationProjection's gating questions are now reachable.
- **A10 — `descriptionTruncated` / `docstringTruncated` flag** on `pattern` / `bundle`. The projected description is a head (first sentence or Problem+Solution summary); it silently dropped later design prose with **no marker** (the 2026-05-27 entry). Not a numeric 512-char cap as that entry guessed — a *semantic* first-sentence cut. Fix: an additive boolean (the dep-tree `truncated` precedent), string byte-identical so docs-live stays stable. Discriminates correctly (false for single-sentence / Problem-Solution-only directives, true when prose is dropped).
- **A5 — `arch workable` verb** (complement of `arch blocking`). The roadmap-minus-blocking set was computed in the overview but only exposed as a capped 8-item sample; the full startable set was unretrievable and the overview hint mis-pointed at `list --status roadmap` (returns all 19, not the 16 startable). Fix: `arch workable` returns the full set as compact summaries (verified == overview `startableCount`, disjoint from `arch blocking`); the 3 overview hints repointed.
- **A3 — taxonomy digest completeness.** ADD: the genuinely-recognized `@architect-executable-specs` forward-link tag was parsed by the scanner but absent from the registry the digest reads, so it never appeared in `taxonomy` / TAXONOMY.md (the 2026-05-26 entry). REMOVE (No-BC): deleted the orphan `usecase` parser code left behind by the 691da3c retirement. Digest total 32 → 33.
- **D16 — `architect-generate --check` / `pnpm docs:check`** (Resolves the 2026-05-26 "no determinism `--check` for docs:all"). Re-renders to memory, diffs the rendered docs **and the generated-docs manifest** against the working tree, writes nothing, exits non-zero on drift — proves idempotency mid-changeset where `git diff --exit-code` conflates an uncommitted edit with a non-deterministic generator. Self-validated this session (caught the A1/A3/A10 doc regen, then went clean after `docs:all`). _Post-review fix:_ the Codex stop-review caught that the first cut diffed only the rendered files, so a manifest-only drift (changed root classification / file set) would pass `--check` yet fail the git gate; the manifest fold (shared pure helper with the write path) now closes that, making `--check` a faithful proxy for the determinism gate.

## 2026-06-01 — Deferred-with-finding: degenerate-generator guard wiring (C15) is blocked on a generator retire/re-scope decision

Wiring `assertGeneratorNotDegenerate` into the docs runner (the shipped-but-unwired guard module) works — but it deterministically caught **3 degenerate generators that ship empty today**: `roadmap` + `current-work` (`0 quarters`) and `requirements-specs` (`0 requirements`), all orphaned from removed dimensions, all in `docs:all --all` and committed in `docs-live/`. So wiring the guard would hard-fail `docs:all` + the determinism gate until those 3 are retired or re-scoped onto a live dimension (status/level) — which is an **open gating question in the `DocumentationProjection` epic** (surfaced this session via `open-questions --parent DocumentationProjection --include-self`). Per "decisions recorded born-accepted after code proves them, never rushed ahead," the wiring is deferred (reverted) rather than pre-empting that decision; the guard module + its unit tests stay. The finding (the guard catches exactly these 3, named) is the value — it advances the open question with hard data.

## 2026-06-01 — Resolved (doc hygiene): four stale-open items confirmed already-fixed by the triage

The blind triage confirmed these earlier FEEDBACK items reproduce as **fixed** against the live CLI; recording closure so the ledger stops showing them open:

- **`test:perf:baseline` soft-threshold jitter** (2026-05-27) — RESOLVED by `054b7f8`: `compare-baseline.mjs` now uses `effectiveBudget = min(hard, max(baseline×1.5, baseline+slack))` with `ABSOLUTE_SLACK_BY_UNIT = { ms: 0.05, us: 50 }` — the requested noise floor. All 15 metrics pass with absolute headroom on the micro-metrics.
- **`architect:query` reflects last-built dist** (2026-05-29) — RESOLVED by `74f6730`: `architect:query` now runs `tsx --conditions=source` (resolves `architect-core`/`-projection` from `src`), and `scripts/check-build-fresh.mjs` (`pnpm check:build`) gates the still-dist-bound bins (generate/guard/validate) on an mtime freshness check.
- **A tag's allowed values aren't queryable** (2026-05-27) — RESOLVED: `taxonomy --format json` now carries a per-tag `values` array (product-area/role/status/adr-* enums); no `*-values.ts` source read needed.
- **Over-escaped backticks in flagship TAXONOMY.md** (2026-05-26) — RESOLVED by `06bfd91`: the taxonomy normalizer now emits renderer-authored backticks via the trusted-markdown hatch; `grep -c '\`' docs-live/TAXONOMY.md` → 0. (Sourced fragment text stays escaped — that is the ADR-009 trust boundary, not the defect.)

## 2026-06-01 — Fixed: `rules --product-area Platform` false-rejected 8 real rules (accepted-set ≠ filter-target)

- **Verb / surface:** `pnpm -s architect:query rules --product-area Platform`.
- **Expected:** the 8 rules whose pattern declares no `@architect-product-area` (incl. governing ADR-009 / ADR-010 invariants) — they bucket under the projection's `DEFAULT_PRODUCT_AREA = 'Platform'`.
- **Got:** fail-loud `--product-area: invalid value "Platform"`. The prior session's fail-loud commit (`fb7ca9d`) derived the accepted set from pattern-keyed `graph.byProductArea`, which **omits** the default bucket (a pattern with no `productArea` is absent from `byProductArea`, yet its rules still bucket under the default). So a valid area false-rejected as "invalid" — the same accepted-set-vs-filter-target divergence class as the ADR-005 false-empty, in reverse.
- **Impact:** trust erosion — a real, populated area reads as a typo. Found by a blind false-empty dogfood probe.
- **Fix:** new `collectBusinessRuleProductAreas(context)` projection helper returns the rule set's distinct areas (so accepted-set == filter-target by construction, incl. the default bucket); the CLI `resolveProductAreaFilter` now takes that precomputed set (matching `resolvePackageFilter(listPackages(), …)`). Regression: a new dogfood scenario with a no-area rule fixture asserts `--product-area Platform --names-only` returns it.

## 2026-06-01 — Fixed: `PDR001SessionWorkflowCommands` mis-tagged `@architect-adr:004` (a latent ADR/PDR collision sibling)

- **Verb / surface:** `pnpm -s architect:query rules --decision 001` / `--decision 1` / `--decision 004`.
- **Expected (by the ADR-005 collision precedent):** `001`/`1` is ambiguous (ADR-001 + PDR-001 both name "001"), so it should fail loud like `005`/`5` does.
- **Got:** `001`/`1` silently resolved to ADR-001 (10 rules), and `004` resolved to a pattern *named* PDR-001 — because `PDR001SessionWorkflowCommands` (file `pdr-001-…`, pattern name `PDR001`, Feature title "PDR-001 …") was tagged `@architect-adr:004`. Three identity signals said 001; one tag said 004. The resolver fix (2dffcfe) masked it — `001` "worked" only because the real PDR-001 was mis-numbered out of the collision.
- **Root cause / scope:** source-data typo, wrong since the v1-monolith split. No ADR-004 pattern exists; no `@architect-enforces-decision:004`/`:001` references anywhere, so nothing depended on the wrong numeric.
- **Fix:** corrected the tag to `001`. `001`/`1` now fail loud (ambiguous, consistent with `005`); `004` fails loud (no such decision); `ADR-001`/`PDR-001` still resolve by name. `docs-live/` **zero drift** (PDR-001 is excluded from the decisions projection by its `roadmap` status). The 2dffcfe identity self-match now handles the real 001 collision the same way it handles 005.
- **Observation (not fixed, by-design at this phase):** PDR-001 is `@architect-status:roadmap` though its commands (`scope-validate`, `handoff`) ship — a possible status-staleness, left untouched per "expect incompleteness".

## 2026-05-30 — Fixed: `rules --decision ADR-005` returned 0 (ADR/PDR numeric-id collision in the projection self-match)

- **Verb / surface:** `pnpm -s architect:query rules --decision ADR-005` (and `ADR005CodecBasedMarkdownRendering`).
- **Expected:** ADR-005's 5 own rules (every other ADR resolves: ADR-001→10, ADR-006→4, ADR-009→5).
- **Got:** **0** — silently. The 5 rules were reachable via `rules --feature '**/*markdown*'` (5) and the kernel `query getRulesByDecision ADR005…` (5), but the CLI `rules --decision` verb (which routes through the business-rules projection's decision scope) returned empty for exactly ADR-005.
- **Root cause:** `ADR005CodecBasedMarkdownRendering` and `PDR005ProcessGuardFSM` both carry `@architect-adr:005`. The projection's decision-record self-match (`patternEnforcesDecision`) re-canonicalized the pattern's **bare** `adr` tag (`"005"`), which is ambiguous across the ADR/PDR pair — `resolveDecisionPattern` refuses to guess and falls back to the raw `"005"`, which never equals the resolved target (`adr005codecbasedmarkdownrendering`). The kernel's `resolvePatternsByDecision` was immune because it self-includes the decision pattern by **identity**, not by re-canonicalizing the tag.
- **Impact:** a renderer-debugger querying the markdown renderer's own governing ADR got a false-empty — the one ADR most likely to be queried in that workflow. Found by a blind renderer-governance dogfood probe; missed by prior regression (which only tested ADR-006/009, neither of which collides).
- **Fix:** `business-rules.internal.ts` self-match now compares canonical pattern **identity** (`isDecisionPattern(p) && getPatternName(p) === target`) before the bare-tag fallback (kept for unresolvable fixture decisions). Regression: a new dogfood scenario seeds a colliding `ADR-555` / `PDR-555` pair and asserts `--decision ADR-555` returns the ADR's own rule and excludes the PDR's.

## 2026-05-30 — Resolved: JSON error envelope on stderr; `--product-area` fails loud; multi-word `search` degrades

- **Resolves:** ledger **#3** (JSON error envelope), the `--product-area` silent-zero, and the multi-word `search` → `[]` residual.
- **#3 (chosen design — envelope on stderr):** under `--format json`, an error now emits `{success:false,error:{message}}` to **stderr** (stdout stays clean — the success-path pipe invariant is preserved), exit unchanged. `… 2>&1 | jq '.success'` → `false`; `… 2>&1 | jq -r '.error.message'` carries the accepted set. Detection is via exit code or `2>&1 | jq`. The argv is read directly in the `main().catch` (where `format` is out of scope). New executable scenario in `cli-output-formatting.feature`. Note: `.success` was never uniform on the success path — bundle verbs return `{root,children}` with no `.success` — so the envelope adds the discriminant only to the error path.
- **`--product-area` fail-loud:** `rules --product-area NotARealArea` now errors with `Accepted: Annotation, Configuration, CoreTypes, DataAPI, Generation, Process, Projection, Validation` (was a silent `0`), matching `--package`/`--decision`. Case-insensitive valid values still resolve (`dataapi` → 98).
- **Multi-word `search`:** a multi-word concept query that is no contiguous substring of any name now degrades to **per-token** matching (`search "read model consistency"` → 10 hits; `"markdown rendering"` → 1) instead of `[]`; a single-token miss still returns `[]` (no noise).

## 2026-05-29 — Resolved: self-documenting value errors close the `--disclosure` / flag-enum confusion

- **Resolves:** "2026-05-27 — `documentation` help advertises rejected flags" and the underlying skill misreport that a flag was "broken."
- **Resolving change:** CLI value-validation errors now **enumerate the accepted set** in the message. Verified live: `documentation decisions --disclosure brief` → `Error: --disclosure: invalid value "brief". Accepted: essential, important, useful, advanced`; `documentation bogus` → lists all 13 document types; `list --status planned` → `Accepted: candidate, roadmap, active, completed, deferred`; an invalid `overview --richness` → the four richness levels. The valid `--disclosure` enum (`essential|important|useful|advanced`) is now documented explicitly in `architect-data-api`. The earlier "broken flag" conclusion came from guessing a value rather than reading the (now enumerated) error.

## 2026-05-29 — Resolved: `pattern` now surfaces all four classification axes

- **Resolves:** "2026-05-27 — `pattern` / `list` drop already-authored classification fields."
- **Resolving change (fix 1e):** `pattern <Name> --format json` now returns `boundedContext`, `productArea`, and `level` alongside `role` — all four classification axes from ONE call, each populated when the source declares it. Verified live: `pattern PatternGraphApi` → `role: utility`, `boundedContext: read-api`; `pattern ArchitectureDelta` → `productArea: Generation`. (Axes the source omits return `null`/`""`.) `architect-data-api`'s `pattern` verb description updated. Classification questions the read model should answer no longer force a spec-file read.

## 2026-05-29 — Resolved: SessionStart hook re-injects orientation on `compact` (PostCompact gap)

- **Resolves:** the **PostCompact** stopgap gap called out in "2026-05-26 — Migrate the architect-studio `architect-claude-plugin` hook system into this repo" (gap 1: long sessions lose API-first context after a compact).
- **Resolving change:** `.claude/hooks/architect-api-first.sh` now injects the live overview snapshot on `startup` / `clear` / `compact` (skipping only `resume`), and it injects `overview --richness summary-with-references` — the START HERE orientation tier — rather than a bare progress line. The broader plugin migration (PreToolUse enforcement, feedback-capture hook) remains open; only the orientation-on-compact gap is closed.

## 2026-05-29 — Resolved: `GenerateDocsCli → MarkdownRenderer` uses-edge authored on the feature header

- **Resolves:** "2026-05-29 — uses-edge for a Gherkin-owned pattern cannot be authored on production TS."
- **Resolving change:** added `@architect-uses:MarkdownRenderer` as a Gherkin header tag on `tests/features/cli/generate-docs.feature` (verified present), using the sanctioned mechanism for a Gherkin-owned pattern's consumer edge. The deeper doctrine question (whether `combineSources` should also key the code↔feature merge on `@architect-implements` so production TS can contribute `uses`, vs. the doctrine carving out that Gherkin-owned patterns author their own `uses` on the feature header) remains open for a future decision.

## 2026-05-27 — projected `docstring` is capped (~512 chars), silently dropping later design prose

- **Verb / surface:** `pnpm -s architect:query bundle <Pattern> --format json` (`.root.blocks.docstring`) and `pattern <Name>`.
- **Expected:** an epic/candidate spec's Feature description prose to be queryable — the `DocumentationProjection` epic was authored to carry foundational design context (a **Guiding principle** + an **MVP approach** block) so future sessions coordinate _from the graph_.
- **Got:** the `docstring` block is ~513 chars — it returned the User Story plus the _first sentence_ of the next paragraph (`**Scope of the corpus:** … not a narrow slice.`) and dropped everything after (the Guiding-principle and MVP-approach paragraphs). No marker signals the truncation. `Rule:` blocks are unaffected — fully projected.
- **Impact:** an epic meant to hold high-level design context only surfaces its head via the API; context not encoded as a `Rule` invariant is invisible to `bundle`/`pattern` consumers — and this bites the universal-doc-gen capability's own use case (the graph as coordination surface). Mitigation this session: encode the load-bearing essence as a `Rule` invariant (queryable) and keep full prose in the canonical source feature. A section-aware/longer docstring, or an explicit `truncated` flag (as `dep-tree` already carries), would close it.

## 2026-05-27 — `test:perf:baseline` soft thresholds are non-deterministic on a loaded dev machine (false failures jitter between unrelated metrics)

- **Verb / surface:** `pnpm --filter @libar-dev/architect-projection run test:perf:baseline`.
- **Expected:** a stable pass/fail; a real regression flags the metric it touched.
- **Got:** two consecutive runs on the same tree failed on **different, unrelated** sub-millisecond metrics — first `documentationView` (0.0313 vs 0.0269ms) + `requirementDigestAllAreas` (0.302 vs 0.161ms), then on a settled re-run those **passed** and `graphBuild` (467 vs 444ms) failed instead. Every **hard** limit passed with wide margin (e.g. documentationView hard=8ms; graphBuild hard=2000ms). The soft `baseline×1.5` gate trips on thermal/load noise for micro-benchmarks measured in µs–fractional-ms.
- **Impact:** the gate produces false stop-and-surface failures locally (right after `test:dogfood` loads the machine), pressuring a re-record (suppression) that the doctrine forbids. A median-of-N / warm-up, a noise floor (skip soft-check below ~0.1ms where jitter dominates), or treating soft-baseline as a warning while only `hard` fails the gate, would make it trustworthy. Not suppressed this session — diagnosed as noise via the re-run.

## 2026-05-27 — a tag's allowed **values** aren't queryable (had to read `product-area-values.ts` source)

- **Verb / surface:** `pnpm -s architect:query taxonomy --format json` — needed the valid `@architect-product-area` set to author a new spec.
- **Expected:** the taxonomy digest to surface each constrained tag's allowed-value list (e.g. product-area → the 8 canonical self-hosting values in `ARCHITECT_PACKAGE_PRODUCT_AREAS`).
- **Got:** no discoverable values list in the JSON for product-area; fell back to reading `packages/architect-core/src/taxonomy/product-area-values.ts` (and `registry-builder.ts`) source. (Distinct from the earlier "digest incomplete for recognized _tags_" entry — this is about a tag's allowed _value enum_.)
- **Impact:** an author choosing a `@architect-product-area` / `@architect-role` / status value can't confirm the legal set through the API, so they guess or grep source — the anti-pattern the API exists to remove. Surfacing `values:` per tag in the digest would make authoring on-API.

## 2026-05-27 — no determinism `--check` for `docs:all`; proving idempotency on a dirty tree needs a manual checksum loop

- **Verb / surface:** the determinism gate `pnpm docs:all && git diff --exit-code docs-live/`.
- **Expected:** a way to assert "the committed `docs-live/` equals canonical regen" that works while the changeset legitimately has uncommitted `docs-live/` edits.
- **Got:** `git diff --exit-code` conflates "uncommitted changeset" with "non-deterministic regen" — it is always non-empty on a dirty tree, so it can't confirm idempotency mid-changeset. I had to hand-roll a `shasum` of `docs-live/` before/after a second `docs:all` to prove the generator is deterministic.
- **Impact:** verifying a doc-gen changeset's determinism (the load-bearing property of a projection system) is a manual dance. A `docs:all --check` (regenerate to a temp dir, diff against the working tree, report drift without mutating it) would make idempotency a clean gate independent of git state.

## 2026-05-26 — Migrate the architect-studio `architect-claude-plugin` hook system into this repo (bash hook is an MVP stopgap)

- **Verb / surface:** Claude Code session integration. This repo ships only an MVP static bash `SessionStart` hook (`.claude/hooks/architect-api-first.sh`, wired in `.claude/settings.json`) that `cat`s an API-first contract.
- **Expected:** the full hook system architect-studio already ships as a packaged plugin — `architect-studio/packages/architect-claude-plugin` (marketplace `libar-architect`). It provides **5 hooks**: `UserPromptSubmit`; `PreToolUse` (matcher `Read|Glob|Grep` + `if: isArchitectScoped(...)` — intercepts architect-scoped file-scanning to **enforce** API-first); `CwdChanged`; `PostCompact` (re-injects context after compaction); `PostToolUseFailure` — plus a session-router + per-session skills, slash commands (plan/design/implement/review/refactor/review-implementation/handoff), dogfooding feedback capture, tests + evals, compiled TS. Docs: `MIGRATION.md`, `docs/HOOKS-API-ADOPTION.md`.
- **Got:** a single static `SessionStart` bash hook. It only **advises** (no `PreToolUse` enforcement), does **not survive compaction** (no `PostCompact` re-inject), and is single-shot (no per-prompt / cwd / failure reactions).
- **Impact:** the bash hook is an acceptable **temporary** stopgap for session-open context, but the durable answer is adopting `architect-claude-plugin` here (or folding it into the `@libar-dev/architect-*` family). Priority stopgap gaps vs the plugin: (1) **PostCompact** — long sessions lose the API-first context after a compact; (2) **PreToolUse** API-over-grep enforcement is absent; (3) no feedback-capture hook. Migration path is pre-written in the plugin's `MIGRATION.md` / `HOOKS-API-ADOPTION.md`.

## 2026-05-26 — architect-base §3 mislabels `architect/design-reviews/` as a hand-authored folder (caused real misfiling)

- **Verb / surface:** the architect-base §3 "Architect State" folder table — row `architect/design-reviews/` → "Design review captures" / lifetime "Reference".
- **Expected:** the table to describe the folder's actual role.
- **Got:** the folder actually holds **auto-generated** design-review artifacts — per-pattern sequence + component mermaid diagrams scoped to specs incl. unimplemented (`mcp-server-integration.md`, `setup-command.md`, `status-maturity-extraction.md`, each headed "Auto-generated design review with sequence and component diagrams"). "Design review captures / Reference" reads as "hand-authored captures live here."
- **Impact:** a prior session dropped a hand-authored prose review (`universal-docgen-direction.md`) into this generated tree and the handoff then called it "canonical"; two sessions treated a generated-output dir as a hand-authored home. The misplaced file risks clobbering on regen and corrupts canonical-read-order. Fix: §3 (and any architect-sessions reference) should describe `design-reviews/` as generated; hand-authored direction captures need a separate documented home.

## 2026-05-26 — Over-escaping reaches the flagship `TAXONOMY.md`, not just the unwired `validation-rules`

- **Verb / surface:** `pnpm docs:all` → generated `docs-live/TAXONOMY.md` (the `taxonomy` normalizer, one of the 11 special-cased `MARKDOWN_NORMALIZERS` kinds).
- **Expected:** code spans in table cells render as code — `` `projection` `` styled, no visible backslashes.
- **Got:** **31** backslash-escaped backticks (`\`projection\``) plus escaped parens (`\(per PDR-005 FSM\)`) in the shipped, git-tracked `TAXONOMY.md`. These render as literal backslashes, not code styling. Same defect *class* as the earlier `validation-rules` entry, but a **different normalizer** and a **flagship, wired** doc — so the blast radius is wider than "one unwired generator over-escapes."
- **Impact:** a prime-candidate "generate this" target ships visibly wrong markdown today. Reinforces the design-review finding that byte-parity with the current output is the wrong oracle — the target shape must be _redesigned_ (escape-only-where-needed), not reproduced. A renderer-level escaping audit (which fragment kinds escape table-cell code spans, and why) should precede any docgen build on these normalizers.

## 2026-05-26 — No verb introspects the projection/generation pipeline (dead-code reachability gap)

- **Verb / surface:** auditing the projection/generation pipeline for removable code — fell back to ad-hoc `grep` over `packages/*/src` (orphan-kind reference counts; reading `documentation-definition.internal.ts` for the generator→projection map; reading `render-markdown.ts` for `MARKDOWN_NORMALIZERS`).
- **Expected:** a deterministic verb to introspect the pipeline — for each of the 44 `FragmentSchema` kinds: which `project*` produces it, which renderer normalizer / CLI verb / doc generator / MCP tool consumes it, and whether it is reachable from any entry point. The registry already encodes most of this wiring.
- **Got:** nothing — the wiring is knowable only by reading dispatch tables + grepping. The grep heuristic also produced **false positives** (kinds with one file-reference looked orphan but were produced+consumed inside one `operational-insights` module), and a separate grep mis-counted normalizers (40 `normalize*` symbols vs 11 actual `MARKDOWN_NORMALIZERS` entries) — proving reference-count grep is the wrong tool and a registry-backed reachability verb is needed.
- **Impact:** pipeline-simplification audits (the "remove unneeded code" work) are non-deterministic and error-prone. A `pipeline` / `arch reachability` verb (kind → producer → consumer → entry-point, flagging unreachable) would make "what is dead?" a gate, not a guess.

## 2026-05-26 — No verb flags degenerate/empty generator output (doc-rot detection gap)

- **Verb / surface:** detecting dead doc generators — read `docs-live/ROADMAP.md` / `CURRENT-WORK.md` by hand to find "covering 0 quarters" (empty because the `quarter`/`phase` dimensions were removed from `ExtractedPattern`).
- **Expected:** `documentation` (a `--health` flag, or a `diagnostics` extension) to flag any generator whose projection yields an empty/degenerate fragment (0 groups / 0 rows / 0 quarters), so doc-rot from removed dimensions surfaces in a gate.
- **Got:** empty docs ship silently; only manual inspection of `docs-live/` reveals them. (Cross-ref the earlier "8 of 13 generators" entry, which noted roadmap/current-work/traceability emit empty — this is the missing _detection_ verb for it.)
- **Impact:** generators orphaned by schema/dimension removal rot invisibly between full doc reviews. An emptiness check at `docs:all` time would catch them deterministically.

## 2026-05-26 — `open-questions --parent <Epic>` excludes the epic's own questions

- **Verb / surface:** `pnpm architect:query open-questions --parent DocumentationProjection`
- **Expected:** the epic's own `**Open Questions:**` plus its members', to gauge candidate readiness of the whole sub-tree in one call.
- **Got:** only the 4 member patterns' questions (those carrying `@architect-parent:DocumentationProjection`). The epic's own questions are reachable only via the unfiltered `open-questions` (then filter to the pattern). `--parent X` means "children of X", excluding X itself.
- **Impact:** a reader gauging an epic's readiness via `--parent` silently misses epic-level (cross-cutting) open questions. A `--include-self` flag, or `--parent X` including X's own questions, would make epic readiness one call.

## 2026-05-26 — Piping `--format json` to `jq` fails without `pnpm -s` (banner on stdout)

- **Verb / surface:** every `--format json` verb invoked as `pnpm architect:query <verb> --format json | jq`.
- **Expected:** clean JSON on stdout, pipeable to `jq` (the skill claimed "pipes cleanly into jq").
- **Got:** `jq: parse error: Invalid numeric literal at line 2` — `pnpm` writes its `> architect@0.0.0 …` / `> tsx …` lifecycle banner to **stdout** ahead of the JSON. `2>/dev/null` does not help (it's stdout, not stderr); only `pnpm -s` suppresses it (verified: 600 vs 428 bytes).
- **Impact:** **the single biggest driver of API aversion.** Mining 5 review-agent transcripts: 69/101 API calls used bare `pnpm`; 4/5 agents wrote stdout-strip workarounds (`2>&1 | python3 …find('{')`); the one agent that used `-s` wrote none. Burned once, an agent concludes "the API isn't clean JSON" and reverts to grep (~10–15× more context/task). Fixed the `architect-data-api` skill + CLI `--help` this session to mandate `-s`; the durable fix is `--format json` guaranteeing JSON-only stdout (or a clean entry that bypasses the pnpm-run banner).

## 2026-05-26 — No whole-graph dump; rebuilding the graph costs an N-call loop

- **Verb / surface:** `arch neighborhood <P>` / `dep-tree <P>` (per-pattern); no aggregate.
- **Expected:** one verb returning all nodes + typed edges (with package/context/role/isTest) for graph-wide questions ("all forward edges", "diff a doc against the graph").
- **Got:** a review agent called `arch neighborhood` **~160 times** (≈3 min) to reconstruct the edge set; another looped `pattern <Name>` ~114 times. `documentation architecture --format json` emits `patterns[]` + rendered mermaid `sections`, not a flat edge array.
- **Impact:** aggregate/graph-shaped questions force loops-then-scripts. A `arch graph --format json` (nodes + edges + flags) collapses them and is the substrate the Studio Architecture Explorer needs.

## 2026-05-26 — `package` is not a queryable dimension (forces `grep @architect-pattern`)

- **Verb / surface:** `list` (no `--package`), `pattern <Name>` (no owning-package field), `arch *`.
- **Expected:** a pattern's owning package available via the API (`list --package <ws>`, a `package` field, or `arch packages`).
- **Got:** `package` is only a `rules --package` filter; to map pattern→package a review agent fell back to `grep -r @architect-pattern packages/*/src` — the exact anti-pattern the skill forbids.
- **Impact:** package-grouped architecture questions (cross-package context detection, the 5-package seam) can't be answered through the API. Studio's grouping/Explorer needs it.

## 2026-05-26 — No forward-link / value-transfer resolution verb; everyday verbs lack `--format json`

- **Verb / surface:** desired `value-transfer <P>` (`ValueTransferState` is its spec'd home) or `files --forward-link` resolving `@architect-executable-specs`; plus text-only `rules` / `dep-tree` / `scope-validate` / `overview` / `status`.
- **Expected:** one verb answering "is this design spec safe to delete?" (forward link resolves + reverse `@architect-implements` present + invariants transferred); and JSON output on the everyday verbs.
- **Got:** triaging 28 specs took 24 spec-file Reads + a 28-item grep loop because no verb surfaces the forward link or the deletion gate; `scope-validate` only covers design/implement; the everyday verbs are text-only so they can't be piped.
- **Impact:** spec-lifecycle work (and Studio's Spec Lifecycle Manager / graduation) can't be driven by the API yet; `--format json` on the everyday verbs would remove the remaining pipe-blockers.

## 2026-05-26 — doc-IA audit: generators orphaned from removed taxonomy dimensions + `index` static-registry coupling

- **Verb / surface:** `pnpm exec architect-generate -g <name>` (the doc generators) + `package.json` `docs:all`.
- **Expected:** `DEFAULT_GENERATORS` (13) and `docs:all` (was 8) to agree; each generator to emit a meaningful doc.
- **Got:** five generators declared but unrun (`index`, `business-rules`, `current-work`, `validation-rules`, `traceability`). Of these: `business-rules` is excellent; `validation-rules` is valuable but **over-escapes markdown** (`\*\*…\*\*`, `` \`…\` `` render literal backslashes); `current-work` + `traceability` emit **empty** docs because they project over the `quarter`/`phase` pattern dimensions that were **removed from `ExtractedPattern`** (the already-wired `roadmap` generator is likewise empty — "0 quarters"). The `index` generator builds its link table from a **static** `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY`, so it links _all 13_ doc types regardless of which ran — wiring `index` forces wiring everything or shipping dead links.
- **Impact:** closing the "8 of 13" gap is not a clean flip — it surfaced (a) a renderer escaping bug, (b) a family of generators orphaned from removed dimensions, and (c) an all-or-nothing coupling in the index. Full analysis + roadmap in `.pr-coordination/DOCS-IA-FINDINGS.md`.

## 2026-05-26 — idea-tier maturity rule: skills contradicted the shipped guard

- **Verb / surface:** `packages/architect-guard/src/lint/idea-tier/` vs the rebuilt skills.
- **Expected:** skills, `formal-spec/08`, and the guard to agree on idea-tier baseline tags.
- **Got:** the guard **requires** an explicit `@architect-maturity:idea` (`idea-tier-checks.ts:85`) and its own error message (`:259`) lists the minimum as "gate, pattern, status, **maturity**, product-area" — but the rebuilt skills said maturity "must not be authored" and listed a 5-tag baseline _excluding_ it. Three-way drift (code ✓ / formal-spec ✓ / skills ✗) on a load-bearing rule, surfacing right as idea-tier authoring begins.
- **Impact:** an author following the skill would omit the one tag the guard keys on, and the file would silently not be validated as idea-tier. Fixed the skills this session; a deterministic "does my idea spec satisfy the guard" check (or surfacing idea-tier lint in `scope-validate`) would have caught the drift earlier.

## 2026-05-26 — `taxonomy` digest is not a complete view of recognized tags

- **Verb / surface:** `pnpm architect:query taxonomy --format json` (and the generated `docs-live/TAXONOMY.md`).
- **Expected:** the taxonomy digest to enumerate every `@architect-*` tag the toolchain recognizes.
- **Got:** the digest projects only the **validation registry** (`buildRegistry`, 30 tags). Tags the scanner recognizes but that aren't in the registry — notably `@architect-executable-specs` and `@architect-usecase` (parsed into pattern metadata in `scanner/ast-parser.ts` / `gherkin-ast-parser.ts`) — do **not** appear in the digest or `docs-live/TAXONOMY.md`. Conversely, registry tags like `unlock-reason` / `target` are grouped under "Other"/filtered.
- **Impact:** authors verifying a tag against the digest can wrongly conclude a real, load-bearing tag (the design-spec forward link!) is unrecognized. Skills now teach the model and point to live data rather than enumerate, but a single authoritative "all recognized tags" surface (registry ∪ scanner-recognized) would close the gap.

## 2026-05-27 — Codex hooks need the sandbox-safe Architect CLI entrypoint

- **Verb / surface:** Codex SessionStart hook requesting a live Architect overview.
- **Expected:** the Architect Data API runs as the first-read surface without extra permission changes.
- **Got:** the `tsx` package-script path can fail in the Codex sandbox before Architect starts. The repo hook now uses `pnpm exec architect --base-dir . overview`, which works in the same environment.
- **Impact:** Keep Codex hooks on the built-bin entrypoint. Interactive humans can still use `pnpm architect:query <verb>` normally.

## 2026-05-27 — `documentation` help advertises rejected flags

- **Verb / surface:** `pnpm architect:query documentation decisions --disclosure brief` and `pnpm architect:query documentation decisions --filter status=accepted`.
- **Expected:** the flags advertised by `pnpm architect:query documentation --help` and the `architect-data-api` skill to be accepted.
- **Got:** `--disclosure` exits with `Error: --disclosure`; `--filter` exits with `Error: --filter` when run without a pipeline masking the exit code. Plain `documentation decisions` works.
- **Impact:** agents following the skill/help will hit a flag-shape mismatch on the documentation projection and must retry without filters.

## YYYY-MM-DD — <short title>

- **Verb / surface:** `pnpm architect:query <verb> <args>` (or `architect_<tool>` MCP)
- **Expected:** ...
- **Got:** ...
- **Impact:** ...

## 2026-05-27 — `pattern` / `list` drop already-authored classification fields

- **Verb / surface:** `pnpm -s architect:query pattern ArchitectBriefDeterministicBundle --format json` and `list --format json`
- **Expected:** classification fields already authored in source and already meaningful for AI routing — especially `productArea`, `boundedContext`, and `level` — to appear in `PatternDetail` / `PatternSummary` when present on the source pattern.
- **Got:** the source spec carries `@architect-product-area:DataAPI` and `@architect-bounded-context:api`, but the returned `PatternDetail` exposes neither field. The pattern output keeps `package`, `status`, `maturity`, `relationships`, and `hierarchy`, but drops these authored classification dimensions.
- **Impact:** this reads like an annotation gap when it is actually a projection/surface gap. Agents fall back to spec-file reads or grep for classification questions the read model should answer directly. The fix is higher leverage than more annotation: surface the fields already present.

## 2026-05-27 — `open-questions --parent <Epic>` still hides focal epic questions

- **Verb / surface:** `pnpm -s architect:query open-questions --parent DocumentationProjection --format json`
- **Expected:** the unresolved state of the work surface rooted at the epic — meaning the epic's own `**Open Questions:**` plus the child patterns' questions.
- **Got:** only member-pattern questions are returned. The focal epic `DocumentationProjection` has load-bearing gating questions in `architect/specs/documentation-projection/00-documentation-projection.feature`, but they are absent from the `--parent` result.
- **Impact:** an API-first design review can still miss the most important unresolved architecture decisions unless it reads the spec file directly. For epic refinement, `--parent` behaves like "children of X" rather than "open questions in the X subtree," which is the more useful AI-native interpretation.

## 2026-05-29 — `pnpm architect:query` reflects last-BUILT dist, not current source

- **Verb / surface:** all `pnpm architect:query <verb>` (the dogfood CLI runs `tsx pattern-graph-cli.ts`, but its `@libar-dev/architect-core` / `-projection` imports resolve via package `exports` → `dist/`).
- **Expected:** the API-first contract implies the CLI reports the _current_ state of the repo; after editing read-api/projection **source**, `query` should reflect it.
- **Got:** `query` reflects the last `pnpm build` (or the implicit rebuild a `pnpm test` triggers). Mid-refactor, `query getStatusDistribution` returned the OLD return shape until a rebuild synced `dist/`. The CLI _entry_ is tsx-from-source, but cross-package code is dist-resolved.
- **Impact:** an agent dogfooding a source change to a core/projection pattern can get silently stale answers and mis-conclude. Workaround: `pnpm build` (or `pnpm --filter <pkg> build`) after source edits before trusting `query`. Worth considering a dev `exports` condition that points at `src` under tsx, or a freshness warning when `dist` is older than `src`.

## 2026-05-29 — `query` pattern-list passthrough methods drowned the caller (700 KB)

- **Verb / surface:** `pnpm architect:query query <method>` for the eight list-returning kernel methods (`getCurrentWork`, `getRoadmapItems`, `getRecentlyCompleted`, `getPatternsByRole`, `getPatternsByQuarter`, `getPatternsByPhase`, `getPatternsByStatus`, `getPatternsByNormalizedStatus`).
- **Expected:** a compact inventory comparable to `list --status …` (the same logical query through `list` returns a ~39 KB `PatternSummary[]`).
- **Got:** the raw kernel `ExtractedPattern[]` — full directive/scenarios/rules per pattern. `getCurrentWork` and `getPatternsByNormalizedStatus active` were **707 KB each** (~175K tokens), `getPatternsByRole` 420 KB, `getRoadmapItems`/`getPatternsByStatus` 380 KB. An agent following the skill's "self-traversable kernel" framing could blow its whole context on one call.
- **Impact:** the payload-overflow failure mode the API itself names. **Fixed this session:** the CLI passthrough now projects these eight methods to the compact `{patternName, status, role, file}` shape (kernel return type unchanged — doc/projection consumers still get full records). Single-pattern (`getPattern`) and scalar/FSM methods are untouched.

## 2026-05-29 — uses-edge for a Gherkin-owned pattern cannot be authored on production TS

While repairing spec↔pattern edges I tried to add a `@architect-uses:MarkdownRenderer`
dependency edge for `GenerateDocsCli` (Gherkin-owned, `tests/features/cli/generate-docs.feature`)
by annotating its implementing production file `packages/architect-cli/src/cli/generate-docs.ts`.

Two TS-side approaches both fail:

- `@architect-pattern:GenerateDocsCli` on the .ts → hard pipeline error
  "Pattern conflicts detected: GenerateDocsCli … defined in both TypeScript and Gherkin sources."
- `@architect-implements:GenerateDocsCli` + `@architect-uses:` on the .ts → silently dropped:
  `combineSources` keys the code↔feature merge on `patternName` only, never on `@architect-implements`,
  so a code pattern with no own `patternName` is never matched onto the feature node and its `uses` is lost.

The only working mechanism is a `@architect-uses` **Gherkin header tag on the feature file**
(precedent: `tests/features/cli/validate-patterns.feature` → `ValidatorReadModelConsolidation`
uses `ADR006SingleReadModelArchitecture`, which resolves a correct reverse `usedBy`).

Impact: doctrine says `@architect-uses` is "owned by production TS, authored on the consumer," but for a
Gherkin-owned pattern the consumer edge can only be authored in Gherkin. Either the merge should also key on
`@architect-implements` (so production TS can contribute `uses` to the pattern it realizes), or the doctrine
wording should carve out that Gherkin-owned patterns author their own `uses` on the feature header.

## 2026-05-29 — duplicate `@architect-pattern:PatternGraphAPICLI` identity across two feature files (not gate-caught)

> **RESOLVED 2026-05-29** (commit `c398088`): `pattern-graph-cli-query.feature` renamed to `@architect-pattern:PatternGraphCliQueryPassthrough` + `@architect-implements:PatternGraphAPICLI` (matching its sibling slice features), and a `detectDuplicateFeatureIdentities` anti-pattern gate now fails `validate:all` on any future feature-level identity collision (reads feature-LEVEL tags via `extractProcessMetadata`, so docstring fixtures don't false-positive).

Two feature files both claim the same pattern identity:

- `tests/features/cli/pattern-graph-cli-core.feature` → `@architect-pattern:PatternGraphAPICLI`
- `tests/features/cli/pattern-graph-cli-query.feature` → `@architect-pattern:PatternGraphAPICLI`

This violates the ADR-001 invariant `@architect-pattern:X` may appear in exactly one file. The graph
carries `PatternGraphAPICLI` **twice** (`search PatternGraphAPICLI` and `list --names-only` both return it
twice), which surfaces as a duplicate row in `documentation traceability` (80 rows / 79 distinct patterns,
child keys `pattern-graph-apicli` + `pattern-graph-apicli-2`).

Notably **no gate catches it**: `validate:all`, `arch dangling --strict`, and `architect:guard --staged` all
pass green. The duplicate-identity detection that the cross-source merge applies for TS↔Gherkin conflicts
(`Pattern conflicts detected: … defined in both TypeScript and Gherkin sources`) does not fire for two
Gherkin features claiming the same identity.

Impact / scope decision: this is a genuine annotation bug, not a projection defect, so per the fix brief it
was **reported, not papered over** — the traceability projection still emits both rows. The clean fix is to
rename one feature's identity (e.g. `pattern-graph-cli-query.feature` → `PatternGraphAPICLIQuery` with
`@architect-implements:PatternGraphAPICLI` if it should stay a realization of the CLI pattern), and ideally
to add a duplicate-Gherkin-identity gate so this fails loud next time. Deferred from this session because it
ripples pattern identity + reverse edges + downstream `@architect-implements` refs.

---

## 2026-06-04 — `scope-validate <pattern> implement` "Design decisions recorded" WARN is unclearable for a doctrine-compliant stub

> **[SUPERSEDED 2026-06-05 — see the resolution entry at the top.]** The premise below ("doctrine forbids `@architect-pattern` on stubs") was wrong for *code/contract* stubs: `formal-spec/04-tag-registry.md` makes `@architect-pattern` a MUST on stubs and ADR-003 has identity travel from stub through production. The check is correct; the stub was under-annotated. Retained verbatim as a record of the original diagnosis.

**Verb:** `pnpm architect:query scope-validate TaxonomyDocumentationCluster implement`

**Expected:** a stub authored to doctrine (no `@architect-pattern`, with `@architect-target` +
`@architect-implements` + ADR/DD references in its JSDoc) should be able to satisfy the
`design-decisions-recorded` check — its description literally contains `ADR-010`, `DD-1`, `DD-2`, `DD-3`,
all of which match the detector regex `/\b(?:ADR|PDR|DD)-[A-Za-z0-9-]+\b/`.

**Got:** `[WARN] Design decisions recorded: No PDR/AD references found in stubs`, and it cannot be cleared.

**Root cause** (`packages/architect-projection/src/projections/execution-context/scope-readiness.internal.ts:202,335-351`):
`buildDesignDecisionsRecordedCheck` → `findStubPatterns` filters `context.graph.patterns` for a `/stubs/`
file whose `implementsPatterns` includes the target. A pattern node only exists for a file carrying
`@architect-pattern`. But stub doctrine (architect-sessions `design.md`; annotation-ownership) is explicit
that **stubs MUST NOT carry `@architect-pattern`** — so a correctly-authored stub is never in
`context.graph.patterns`, `findStubPatterns` returns `[]`, `decisionCount` is 0, and the check WARNs
regardless of how many ADR/DD references the stub's JSDoc actually carries. Confirmed: the only stub `.ts`
in the repo carries `ADR-010` + `DD-1..3` in its description and still WARNs; `dep-tree` shows the stub's
`@architect-implements` edge produces no graph node (0 downstream).

**Impact:** the check is structurally unsatisfiable without violating annotation-ownership doctrine, so
`scope-validate implement` can never reach a no-WARN PASS for a doctrine-compliant design. This session left
the WARN rather than manufacture `@architect-pattern` identity on the stub to game the substring scan.

**Clean fix:** `findStubPatterns` should locate stubs by file (path under `/stubs/` + an `@architect-target`
or `@architect-implements:<pattern>` tag), not by requiring pattern identity; `extractDecisionReferences`
then scans the stub file's JSDoc as today. That makes the check honor the same stubs the rest of the
session lifecycle treats as identity-less scaffolds.

---

## 2026-06-05 — `pnpm architect:query` route blocked by `tsx` IPC pipe EPERM in Codex sandbox

During a design-tier patch session, `bash scripts/api-capability-tour.sh` failed every step before any
Architect verb logic ran: `tsx` could not `listen` on its IPC pipe under
`/var/folders/dv/vjxl688n5wqbc334q2sqdv_80000gn/T/tsx-501/*.pipe` (`EPERM`). Retrying direct API calls with
`TMPDIR=/private/tmp pnpm -s architect:query ...` failed the same way under `/private/tmp/tsx-501/*.pipe`.
This appears to be a harness/sandbox incompatibility with the `tsx` CLI's parent IPC server. A direct Node
loader invocation did work and preserved the source CLI behavior:
`node --conditions=source --require ./node_modules/.pnpm/tsx@4.22.0/node_modules/tsx/dist/preflight.cjs --import ./node_modules/.pnpm/tsx@4.22.0/node_modules/tsx/dist/loader.mjs ./packages/architect-cli/src/cli/pattern-graph-cli.ts --base-dir . ...`.
