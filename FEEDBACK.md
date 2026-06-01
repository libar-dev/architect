# Feedback

One file for all Architect-tooling feedback. Append newest entries at the top.
An entry is short: verb you ran, what you expected, what you got, impact on
your session. No template policing — friction kills the loop.

Until the first-class `feedback` verb ships, this file is the loop. Once the
verb lands, structured reports flow through it; this file remains the home
for anything that does not fit the verb's shape.

---

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
