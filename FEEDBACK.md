# Feedback

One file for all Architect-tooling feedback. Append newest entries at the top.
An entry is short: verb you ran, what you expected, what you got, impact on
your session. No template policing — friction kills the loop.

Until the first-class `feedback` verb ships, this file is the loop. Once the
verb lands, structured reports flow through it; this file remains the home
for anything that does not fit the verb's shape.

---

## 2026-05-26 — doc-IA audit: generators orphaned from removed taxonomy dimensions + `index` static-registry coupling

- **Verb / surface:** `pnpm exec architect-generate -g <name>` (the doc generators) + `package.json` `docs:all`.
- **Expected:** `DEFAULT_GENERATORS` (13) and `docs:all` (was 8) to agree; each generator to emit a meaningful doc.
- **Got:** five generators declared but unrun (`index`, `business-rules`, `current-work`, `validation-rules`, `traceability`). Of these: `business-rules` is excellent; `validation-rules` is valuable but **over-escapes markdown** (`\*\*…\*\*`, `` \`…\` `` render literal backslashes); `current-work` + `traceability` emit **empty** docs because they project over the `quarter`/`phase` pattern dimensions that were **removed from `ExtractedPattern`** (the already-wired `roadmap` generator is likewise empty — "0 quarters"). The `index` generator builds its link table from a **static** `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY`, so it links *all 13* doc types regardless of which ran — wiring `index` forces wiring everything or shipping dead links.
- **Impact:** closing the "8 of 13" gap is not a clean flip — it surfaced (a) a renderer escaping bug, (b) a family of generators orphaned from removed dimensions, and (c) an all-or-nothing coupling in the index. Full analysis + roadmap in `.pr-coordination/DOCS-IA-FINDINGS.md`.

## 2026-05-26 — idea-tier maturity rule: skills contradicted the shipped guard

- **Verb / surface:** `packages/architect-guard/src/lint/idea-tier/` vs the rebuilt skills.
- **Expected:** skills, `formal-spec/08`, and the guard to agree on idea-tier baseline tags.
- **Got:** the guard **requires** an explicit `@architect-maturity:idea` (`idea-tier-checks.ts:85`) and its own error message (`:259`) lists the minimum as "gate, pattern, status, **maturity**, product-area" — but the rebuilt skills said maturity "must not be authored" and listed a 5-tag baseline *excluding* it. Three-way drift (code ✓ / formal-spec ✓ / skills ✗) on a load-bearing rule, surfacing right as idea-tier authoring begins.
- **Impact:** an author following the skill would omit the one tag the guard keys on, and the file would silently not be validated as idea-tier. Fixed the skills this session; a deterministic "does my idea spec satisfy the guard" check (or surfacing idea-tier lint in `scope-validate`) would have caught the drift earlier.

## 2026-05-26 — `taxonomy` digest is not a complete view of recognized tags

- **Verb / surface:** `pnpm architect:query taxonomy --format json` (and the generated `docs-live/TAXONOMY.md`).
- **Expected:** the taxonomy digest to enumerate every `@architect-*` tag the toolchain recognizes.
- **Got:** the digest projects only the **validation registry** (`buildRegistry`, 30 tags). Tags the scanner recognizes but that aren't in the registry — notably `@architect-executable-specs` and `@architect-usecase` (parsed into pattern metadata in `scanner/ast-parser.ts` / `gherkin-ast-parser.ts`) — do **not** appear in the digest or `docs-live/TAXONOMY.md`. Conversely, registry tags like `unlock-reason` / `target` are grouped under "Other"/filtered.
- **Impact:** authors verifying a tag against the digest can wrongly conclude a real, load-bearing tag (the design-spec forward link!) is unrecognized. Skills now teach the model and point to live data rather than enumerate, but a single authoritative "all recognized tags" surface (registry ∪ scanner-recognized) would close the gap.

## YYYY-MM-DD — <short title>

- **Verb / surface:** `pnpm architect:query <verb> <args>` (or `architect_<tool>` MCP)
- **Expected:** ...
- **Got:** ...
- **Impact:** ...
