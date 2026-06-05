---
name: architect-data-api
description: Always loaded in this Architect repo. The canonical query surface for the PatternGraph — `pnpm architect:query <verb>` (CLI) and `architect_*` MCP twins. Gives deterministic, structured answers to "what is the state of X?", "what does X depend on?", "is this transition legal?", "what is blocking?", "are there dangling references?". Covers every verb the repo ships — overview / status / list / search / pattern / bundle / context / dep-tree / files / rules / scope-validate / arch blocking / arch workable / arch dangling / arch neighborhood / taxonomy / open-questions / handoff / documentation — plus the `query isValidTransition` deterministic FSM gate. Pattern exploration through this API is faster than file scanning, structurally typed, and never stale.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Data API — `pnpm architect:query`

The CLI (`pnpm architect:query <verb>`) is the canonical surface for the PatternGraph. Every "what is the state of X?" question about a pattern, every dependency walk, every FSM gate, every dangling-reference check is one verb away. Output is structured, deterministic, sub-second on warm cache, and pipes into `jq` or a PR description.

> **Piping to `jq`? Use `pnpm -s`.** Bare `pnpm architect:query <verb> --format json | jq` **fails** with a parse error — `pnpm` prints its `> architect@0.0.0 …` lifecycle banner to **stdout** ahead of the JSON. The `-s` (silent) flag suppresses it: `pnpm -s architect:query <verb> --format json | jq`. This is the single most common reason an agent wrongly concludes "the API isn't clean JSON" and falls back to `grep`. Always `-s` when piping. (See "Output formats & JSON consumption".)

**File scanning to learn about a pattern is a smell.** It is slower, less accurate, and easy to lie to. Treat the CLI as a first-class read surface and reach for `Read` / `Glob` / `Grep` only when you actually need the file's full text.

## Sessions in this repo

The Architect delivery process recognizes a small number of work shapes. Knowing which one you are in helps you choose what to look at, but **does not change which commands you run** — see "State-driven, not intent-driven" below.

- **Idea / candidate authoring** — drafting new patterns, refining open questions, sharpening invariants. Lives in `architect/specs/ideas/` and `architect/specs/candidates/`.
- **Design tier authoring** — promoting a plan-level spec, adding deliverables, stubs, exhaustive scenarios, ADR references. Lives in `architect/specs/`.
- **Implementation** — building from a design-level spec, transferring value to annotated production code + executable Gherkin.
- **Review** — gap-finding on a design spec before implementation, or verifying value transfer after a completed implementation.
- **Handoff** — end-of-session capture so the next session resumes from a clean state.
- **Maintenance** — evolving shipped code in place; scenarios grow as behaviour grows.

`architect-base` §9–§13 carries the maturity ladder, FSM lifecycle, spec / pattern bipartite relationship, and value-transfer doctrine that make these shapes legible.

## State-driven, not intent-driven

The API is being shaped around a single principle: **what you get back is determined by the pattern's state, not by your stated intent**. A pattern that is `active` with all dependencies completed answers questions the same way whether the caller is about to plan, implement, or review — only the caller's downstream action differs.

In practice this means:

- The same handful of verbs (`overview`, `pattern`, `bundle`, `dep-tree`, `files`, `rules`, `scope-validate`) covers every session shape above.
- `bundle <Pattern>` is the default pre-flight; it returns scenarios + dependencies + rules + open questions + docstring in one call.
- The `--mode <plan|design|implement|review>` flag on `bundle` changes which blocks are included by default (`context` instead takes `--session <planning|design|implement>` — no `review` value); but defaults are good and the variation in returned data is dominated by what the pattern actually _is_ on disk.
- Expect intent flags to recede further over time. The skill leads with state-driven exploration; per-intent recipes are not authored here.

## Pattern exploration — the everyday verbs

These are the verbs every session reaches for. Run them in this order when picking up an unfamiliar pattern.

```bash
# 1. Health + inventory — start here every time
pnpm architect:query overview                         # default summary; add --richness summary-with-references for START HERE orientation

# 2. Locate — if you know a name fragment but not the canonical pattern name
pnpm architect:query search <fragment>
pnpm architect:query list --status candidate --names-only

# 3. Pre-flight — the default composite, returns scenarios + deps + rules + open-questions + docstring
pnpm architect:query bundle <Pattern> --format json

# 4. Drop down to slices when bundle gave you enough to ask sharper questions
pnpm architect:query pattern <Pattern>                # full PatternDetail
pnpm architect:query dep-tree <Pattern> [--depth n]   # dependency walk
pnpm architect:query files <Pattern> [--related]      # implementation surface
pnpm architect:query rules --pattern <Pattern>        # invariants + verified-by
pnpm architect:query context <Pattern>                # adds architecture neighbours
pnpm architect:query open-questions [--parent <X>]    # candidate readiness signal
```

When the work involves several patterns, run `bundle` for each — the calls are cheap and the structured output composes well.

## Gates — deterministic verdicts

Three verbs are designed to be parsed for a verdict, not read as prose:

```bash
# FSM scope validation — checklist + final verdict
pnpm architect:query scope-validate <Pattern> design|implement

# Deterministic FSM transition gate — JSON boolean
pnpm architect:query query isValidTransition <from> <to>

# Graph-integrity gate — non-zero exit on drift vs baseline
pnpm architect:query arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict
```

`scope-validate` accepts only `design` and `implement`. Idea- and candidate-tier readiness is structural — `architect-base` §9.

`arch blocking` is the conversational counterpart to these gates: it prints `X blocked by: Y, Z` lines for every pattern with incomplete dependencies. Use it for the global blocker view.

## Verb reference

Organized by purpose. Every CLI verb has an MCP twin (mapping in "MCP twins" below).

### Health & inventory

- **`overview [--richness name-only|summary|summary-with-references|full]`** — the cold-start dashboard, depth controlled by `--richness` (default `summary`). The progress line is **delivery-only** — it counts the delivery base and excludes candidates (`272 delivery patterns (121 completed, 132 active, 19 planned (roadmap+deferred)) = 44%` + a `20 candidate patterns excluded from delivery progress` line; absolute counts drift every commit — re-verify live). See "Status vocabulary" below for the delivery-total-vs-grand-total distinction. The four levels:
  - **`name-only`** — the progress line alone.
  - **`summary`** (default) — lean dashboard: progress, an architecture mermaid glimpse, top-5 blocking (`X blocked by: Y, Z` then `… and N more — run arch blocking`), a one-line "READY TO START" count of roadmap patterns with satisfied deps, a one-line GENERATED VIEWS list, and the DATA API command hints.
  - **`summary-with-references`** — `summary` plus a **START HERE** orientation block: the high-signal docs to read first (Decisions / Taxonomy / Validation Rules / Business Rules / API Reference, each as a `documentation <type>` verb), the `--disclosure essential|important|useful|advanced` depth note, and the safe-to-start roadmap set.
  - **`full`** — itemizes the generated views (with one-line descriptions), adds the bounded-context architecture mermaid, and adds a **ROLE DISTRIBUTION** breakdown.
    An invalid `--richness` value errors with the accepted set enumerated. The Claude/Codex SessionStart hook injects the `summary-with-references` snapshot on `startup` / `clear` / `compact` (skipping only `resume`).
- **`status`** — status distribution counts + percentages, no per-pattern detail.
- **`list [--status v] [--role tag] [--parent X] [--package <name>] [--count] [--names-only]`** — pattern catalog. `--status` accepts the five FSM values (`candidate`, `roadmap`, `active`, `completed`, `deferred`) **plus** the rollup alias `planned` (= roadmap+deferred) — an out-of-enum value errors with that full accepted set enumerated. `--package` takes the **short** workspace name (`architect-core`, `architect-cli`, `architect-guard`, `architect-mcp`, `architect-projection`, `architect-pkg-content`, `architect-dev`) — **not** the `@libar-dev/…` form — and fails loud on an unmatched value. `--parent` resolves strictly; unknown parent exits non-zero with `Parent pattern not found`. `--names-only` returns a JSON string array.
- **`search <query>`** — fuzzy pattern-**name** search; JSON `[{patternName, score, matchType}]`. Matches against pattern names (exact / prefix / substring / punctuation-insensitive / Levenshtein), **not** annotation prose. A multi-word concept query that is no contiguous substring of any name degrades to **per-token** matching (`search "read model consistency"` surfaces the patterns matching the most tokens, low-scored, instead of `[]`); a single-token miss still returns `[]`. For a concept with no name overlap, steer to `documentation decisions` / `rules --feature <glob>`.
- **`taxonomy [--count]`** — `--count` prints a one-line summary; `--format json` returns the full taxonomy tree. Each constrained tag carries its allowed-value enum under a **`values`** array (e.g. `product-area` → its 8 canonical values, `role` → the 8 roles, `status` → the 5 FSM values) — confirm a legal value on-API instead of grepping `*-values.ts`. The digest is the registry's recognized-tag set, including the design-spec forward link **`executable-specs`** (a `csv` tag); the count line reads `… | N metadata tags | … | M total`.
- **`tags`** — `TagUsageMatrix`: pattern count + per-tag value distribution.
- **`diagnostics`** — JSON array of structural warnings.
- **`sources`**, **`unannotated`** — coverage helpers.

#### Status vocabulary — three labels, two of them are not FSM transition targets

The CLI surfaces three status words that are easy to conflate:

- **`roadmap`** — the **accepted FSM status** (`candidate → roadmap → active → completed`, with `deferred` off `roadmap`). This is what the source carries and what the FSM transitions move between.
- **`planned`** — a **normalized reporting bucket** that collapses `roadmap` + `deferred` into one count. It is **not** an FSM status, but `list --status planned` **does accept it** as a convenience alias (returns the roadmap+deferred set). The `query getPatternsByStatus` passthrough still **rejects** `planned` (accepts only `roadmap`/`deferred`) — so the alias is a `list` affordance, not an FSM-status target. The normalized methods (`getStatusDistribution`, `getStatusCounts`, `getPatternsByNormalizedStatus planned`) report under `planned`; the accepted-status methods report under `roadmap` / `deferred` separately.
- **`candidate`** — a **pre-FSM acceptance state**. `candidate → roadmap` is a human acceptance gate (a maturity flip), **not** a process-guard FSM transition. Candidates are excluded from delivery progress.

**Delivery total vs grand total** (the delivery-vs-grand distinction): `overview` and `getStatusDistribution.deliveryPercentages` count the **delivery base** — every status except `candidate`. At the current state that is **272 delivery patterns** (121 completed / 132 active / 19 planned) out of a **292 grand total** (the extra 20 are candidates). So the overview's `= 44%` denominator is 272, not 292. `candidateShare` (7) is over the grand total and is structurally non-summable with the delivery percentages. Re-verify live numbers with `pnpm -s architect:query status` and `pnpm -s architect:query query getStatusDistribution`.

### Per-pattern detail

- **`pattern <Name>`** — full PatternDetail (deliverables, relationships, rules, maturity, file). `--format json` returns all four classification axes from ONE call — `role`, `boundedContext`, `productArea`, and `level` — each populated when the source declares it (an axis the source omits comes back `null`/`""`, e.g. `pattern PatternGraphApi` carries `role` + `boundedContext`; `pattern ArchitectureDelta` carries `productArea`). No separate verb is needed to recover an axis. The projected `description` is a head (first sentence, or a `Problem: … Solution: …` summary); a sibling **`descriptionTruncated`** boolean flags when the source directive carried more design prose than the head (the dep-tree `truncated` precedent) — `true` means read the source feature for full context, not silent loss. When the underlying feature file fails to parse, this verb reports parse provenance `(kind, path, parser line:col)` instead of a flat "not found". A "not found" response is therefore not binary — it can mean _parse failure_ OR _truly absent_. Cross-check with `search` or `list --names-only` before concluding. **One trap:** the `=== Rules ===` block on `pattern <Name>` shows only the pattern's _own_ rules and is often **empty for a code/TS pattern whose invariants live on its implementing specs** (e.g. `pattern PatternGraphApi` → empty block, but `rules --pattern PatternGraphApi` → a non-empty set, 16 today). Empty here is not "no rules" — if `relationships.implementedBy` is non-empty, run `rules --pattern <Name>` (it resolves through `implementedBy`).
- **`context <Pattern> [--session planning|design|implement]`** — curated bundle: summary, dependencies, architecture neighbours. With `--session implement`, also includes an `=== FSM ===` line showing current status + valid transitions + protection level.
- **`files <Pattern> [--related]`** — primary deliverable file. With `--related`, adds `=== COMPLETED DEPENDENCIES ===`, `=== ROADMAP DEPENDENCIES ===`, `=== ARCHITECTURE NEIGHBORS ===` sections.
- **`dep-tree <Pattern> [--depth <n>]`** — dependency chain walk.
- **`rules [--product-area n] [--pattern n] [--package <name>] [--feature glob] [--decision <ADR>] [--only-invariants] [--count] [--names-only]`** — business-rule catalog. The scope filters (`--pattern` / `--product-area` / `--package` / `--feature` / `--decision`) are **mutually exclusive** — pass exactly one. `--pattern <TsPattern>` resolves through `implementedBy`, so it surfaces the rules of the implementing specs (a TS pattern with no own rules still returns its specs' rules). `--decision <ADR>` aggregates every rule enforcing that decision and accepts any id form (`ADR-009` / `ADR009` / the full `ADR009…` pattern name). `--package` takes the **short** workspace name (`architect-projection`, not `@libar-dev/architect-projection`) and fails loud on an unmatched value. `--feature <path-or-glob>` matches against `pattern.source.file`.

### Composite — the default pre-flight

- **`bundle <Pattern> [--mode plan|design|implement|review] [--include <block[,block...]>] [--estimate-tokens] [--format json]`** — composite of scenarios + deps + rules + open-questions + docstring (the JSON `.root.blocks` keys are `deps`, `docstring`, `docstringTruncated`, `openQuestions`, `rules`, `scenarios` — there is **no** `deliverables` block; deliverables/stubs surface via `context --session design`). When the `docstring` block is included it carries a sibling **`docstringTruncated`** boolean (same signal as `pattern`'s `descriptionTruncated`): `true` ⇒ the source directive holds more design prose than the emitted head. Mode default-include sets apply only when `--include` is omitted. Token estimation is heuristic (`chars / 4`). `--include` takes a comma list (`rules,deps,open-questions`); repeated `--include` flags also accumulate (equivalent), so neither form silently drops blocks.
- **`open-questions [--parent <Pattern>] [--include-self] [--format compact|json]`** — `OpenQuestionList` fragment: per-pattern open questions lifted from each spec's `**Open Questions[…]:**` block (the heading may carry a qualifier between the label and the colon, e.g. an epic's `**Open Questions (resolved per use-case):**`). Candidate-tier readiness signal. **`--parent <Epic>`** returns the open questions of the epic's **member** patterns and by default **excludes the focal epic's own**; add **`--include-self`** to also emit the epic-level (cross-cutting / gating) questions authored on the epic itself. So `open-questions --parent DocumentationProjection` returns the members' questions; `--include-self` adds `DocumentationProjection`'s own.

### Architecture views

- **`arch blocking`** — global blocker view; `X blocked by: Y, Z`.
- **`arch workable`** — the complement of `arch blocking`: roadmap-status patterns whose dependencies are all complete (safe to start). Returns the **full** startable set as compact summaries — the same set the overview computes for `startableCount`, but uncapped (the overview only shows an 8-item sample). Answers "what can I start right now?" in one call instead of `comm -23 <(list --status roadmap) <(arch blocking)`. Note `list --status roadmap` is **not** the same — it returns every roadmap pattern (incl. blocked ones).
- **`arch dangling [--baseline <path>] [--write-baseline] [--strict]`** — graph-integrity check; see "Gates" above.
- **`arch neighborhood <Pattern>`** — local subgraph around the pattern.
- **`arch graph`** — the full `ArchitectureGraph` (bounded contexts + packages + edges).
- **`arch packages [name]`** — per-package pattern inventory; with a name (short workspace form, e.g. `architect-core`), that package's patterns.
- **`arch coverage`** — annotation coverage rollup.
- **`arch roles`** — role inventory.
- **`arch bounded-context [name]`** — bounded-context inventory; with a name, the contents of that context.
- **`arch compare <bc-a> <bc-b>`** — diff two bounded contexts.
- **`arch orphans`** — patterns with no incoming or outgoing edges.

### Gates

- **`scope-validate <Pattern> <design|implement> [--strict]`** — verdict `READY` / `READY (with warnings)` / `BLOCKED`. Per-criterion checklist `[PASS] / [WARN] / [BLOCKED]` + final verdict line. `planning` and `review` are not accepted scope types.

### Session record

- **`handoff --pattern <X> [--session planning|design|implement|review] [--modified-file <p>]...`** — emits `=== HANDOFF ===` block. Pass `--modified-file` once per file touched.

### `query` passthrough — the typed read kernel, fully traversable

`query <method> [args...]` is a passthrough to the `PatternGraphAPI` typed read kernel. Returns `{success, data, metadata}` JSON (read **`.data`**). 28 of the 29 interface methods are reachable (only `getPatternGraph`, which returns the whole read model, is withheld to avoid payload overflow) — so the kernel is self-traversable and every accessor is CLI-verifiable. The live whitelist is authoritative: `query <typo>` echoes the full method set. Grouped by argument shape:

- **No-arg:** `getStatusCounts` → `{completed, active, planned, candidate, total}` · `getStatusDistribution` → `{counts, deliveryPercentages:{completed,active,planned}, candidateShare}` (delivery shares sum to 100 over the delivery base; `candidateShare` is over the grand total — the two are structurally non-summable) · `getCompletionPercentage` · `listRoles` · `listDecisions` · `listPackages` · `getCurrentWork` · `getRoadmapItems` · `getCompletedPatterns [limit]`
- **Pattern-name arg:** `getPattern <Name>` · `getPatternParseFailure <Name>` · `getPatternDependencies <Name>` · `getDependencyContext <Name>` (bidirectional deps — what dep-tree renders) · `getPatternRelationships <Name>` · `getRelatedPatterns <Name>` · `getApiReferences <Name>` · `getPatternDeliverables <Name>` · `getRulesForPattern <Name>` (resolves through implementedBy)
- **Role arg:** `getPatternsByRole <role>` · `getRoleInfo <role>`
- **Decision arg:** `getRulesByDecision <ADR>` · `getPatternsByDecision <ADR>` (both accept `ADR-009` / `ADR009` / the full `ADR009…` pattern name)
- **Status arg:** `getPatternsByStatus <accepted-status>` (accepts `roadmap`/`deferred`, **rejects** `planned`) · `getPatternsByNormalizedStatus <completed|active|planned|candidate>` (collapses `roadmap`/`deferred` → `planned`)
- **FSM (two args / status arg):** `query isValidTransition <from> <to>` → boolean gate · `checkTransition <from> <to>` → `TransitionCheck` · `getValidTransitionsFrom <status>` · `getProtectionInfo <status>`

**Pattern-list methods return compact summaries, not full records.** The methods that resolve to a _list of patterns_ — `getCurrentWork`, `getRoadmapItems`, `getCompletedPatterns`, `getPatternsByRole`, `getPatternsByStatus`, `getPatternsByNormalizedStatus` — emit one compact `{patternName, status, file}` entry per pattern, **not** the kernel's full `ExtractedPattern` (which carries every scenario, rule, and directive). (Note: `list --format json` returns a richer `PatternSummary` — `{kind, patternName, status, maturity, role, file, source, package}` — so the passthrough shape is leaner than `list`'s.) Returning the raw records would balloon a single `getCurrentWork` call to ~700 KB and drown the caller — the payload-overflow failure mode below. Single-pattern lookups (`getPattern <Name>`) and the scalar / object / FSM methods are unaffected and return their full shape. For inventory work, the dedicated verbs (`list --status …`, `overview`, `arch blocking`) remain the first reach; the passthrough list methods exist for kernel self-traversal and parity checks.

An unknown method errors with the full whitelist, so `query <typo>` is self-documenting.

The FSM methods live **only** under the passthrough — `query isValidTransition <from> <to>` works, but `isValidTransition <from> <to>` as a top-level verb errors with `Unknown subcommand: isValidTransition`. Same for `checkTransition`, `getValidTransitionsFrom`, `getProtectionInfo`: prefix with `query`.

### Documentation projection

- **`documentation <document-type> [--disclosure <level>] [--filter <status=csv>]...`** — emits projected docs. The verb accepts **14** document types: `architecture` / `design-review` / `api-reference` / `decisions` / `business-rules` / `patterns` / `roadmap` / `current-work` / `requirements-executable` / `requirements-specs` / `validation-rules` / `taxonomy` / `changelog` / `traceability`. (`index` is **not** an accepted type — it errors with the 14-type enum.) `--disclosure <level>` controls verbosity and takes one of **`essential` / `important` / `useful` / `advanced`** — an invalid level errors `--disclosure: invalid value "<x>". Accepted: essential, important, useful, advanced`. An invalid document type errors with the full accepted-type enum, so both arguments are self-documenting. **Flag asymmetry, easy to confuse:** `overview` tunes depth with `--richness`, `documentation` tunes depth with `--disclosure` — two different flag names with two different enums.
- **`architecture` and `design-review` fan out into inline lens children — one call, multiple slices.** A single `documentation architecture` renders the root context map PLUS three inline slices: `architecture:by-theme` (ADRs clustered by `@architect-adr-theme` into named groups — `Theme: projections` = ADR-005/006/009/010, plus `coordination` / `taxonomy` / `testing` — each with a depends-on/see-also mermaid + a cross-group Theme Map), `architecture:layered` (by `@architect-adr-layer`), and `architecture:package-seam` (by workspace package). All three render even at `--disclosure essential`. So **"which decisions cluster around projections / taxonomy / testing?"** is one lens query, never a grep over `architect/decisions/`. `documentation design-review` is the **working-state-inclusive component view**: it draws the live pattern graph _including not-yet-built specs_ as a root map plus `design-review:by-layer` / `design-review:by-package` / `design-review:by-theme` children. Classified nodes are status-annotated `Name (role · status)` (e.g. `MCPServer (service · completed)`); unbuilt specs render status-only (`(candidate)` / `(roadmap)`). Live node statuses are `active` / `completed` / `candidate` / `roadmap`. Under `--format json`, the lens children are keyed under `.children` (`.children["architecture:by-theme"]`, `.children["design-review:by-layer"]`, …). Use `design-review` to review a planned pattern's shape — and how it slots into the existing graph — before implementing, instead of opening each feature file.

### Interactive

- **`repl`** — interactive shell. Not used in scripted sessions.

## Output formats & JSON consumption

`--format json` is a **global** flag (parsed before the subcommand), so **every data verb can emit JSON** — there are no "text-only" verbs. Default output is human-readable text/compact; add `--format json` for structured output.

| Verb                                                                                                                                                                                                                       | Default output | `--format json` |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------- |
| `query <method>`, `diagnostics`, `arch dangling`, `search`, `list --names-only`                                                                                                                                            | JSON           | already JSON    |
| every other data verb — `overview` · `status` · `context` · `files` · `scope-validate` · `handoff` · `pattern` · `dep-tree` · `rules` · `tags` · `bundle` · `taxonomy` · `open-questions` · `arch blocking`/`neighborhood` | Text           | **yes**         |

**Three envelope shapes** (this trips up `jq` paths): structured verbs (`query`, `arch neighborhood`/`blocking`/`dangling`, `diagnostics`) wrap as `{ success, data, metadata }` → read **`.data`**; bundle-style verbs (`bundle`, `overview`, `status`, `pattern`, `dep-tree`, …) return the bundle directly → read **`.root`** / top-level fields; list-style verbs (`search`, `sources`, `list`, `list --names-only`) return a **bare JSON array** at top level → index with **`.[0]`**, _not_ `.data`/`.root` (`list --format json | jq '.root'` errors with `Cannot index array with string`). Under `--format json` an **error** is itself a `{ success: false, error: { message } }` envelope on **stderr** (stdout stays clean) — detect failure via the exit code or `2>&1 | jq '.success'`.

Pipe JSON through `jq` — **but always via `pnpm -s`**. Without `-s`, pnpm writes its `> architect@0.0.0 …` / `> tsx …` banner to **stdout** before the JSON, so `pnpm architect:query <verb> --format json | jq` dies with `parse error: Invalid numeric literal at line 2`. The `-s` flag is the whole fix:

```bash
pnpm -s architect:query query getStatusCounts | jq '.data'
pnpm -s architect:query bundle MarkdownRenderer --format json | jq '.root.kind'
pnpm -s architect:query arch neighborhood PatternGraph --format json | jq '.data.uses'
```

Text output is for human review.

**Value-validation errors are self-documenting — read the error, do not guess.** When a flag or positional gets an out-of-enum value, the CLI echoes the **accepted set** in the error: `--disclosure brief` → `Accepted: essential, important, useful, advanced`; `list --status zzz` → `Accepted: candidate, roadmap, active, completed, deferred, planned`; `documentation bogus` → the 14 supported document types; `query <typo>` → the full method whitelist; an invalid `--richness` → the four richness levels. A rejected value is therefore a discovery affordance, not a dead end — the correct value is in the message. (The skill's own past "flag broken" misreport came from guessing instead of reading the enumerated error.)

Representative JSON shape — `query isValidTransition roadmap active`:

```json
{
  "success": true,
  "data": true,
  "metadata": {
    "timestamp": "2026-05-29T05:52:16.268Z",
    "patternCount": 292,
    "validation": {
      "danglingReferenceCount": 0,
      "unknownStatusCount": 0,
      "warningCount": 0
    },
    "cache": { "hit": true, "ageMs": 43206 },
    "pipelineMs": 626
  }
}
```

Representative checklist output — `scope-validate PatternBundleProjection implement`:

```
=== SCOPE VALIDATION: PatternBundleProjection (implement) ===

=== CHECKLIST ===
[BLOCKED] Dependencies completed: 1/2 completed. Blockers: PatternRelationsFragmentContracts (active)
[BLOCKED] Deliverables defined: No deliverables found in Background table
[PASS] FSM allows transition: Already active — no transition needed
[WARN] Design decisions recorded: No PDR/AD references found in stubs
[WARN] Executable specs location set: No @executable-specs tag found

=== VERDICT ===
BLOCKED: 2 blocker(s) prevent implement session
```

## MCP twins

Every CLI verb has an MCP twin. Names map by snake-casing the CLI form and prefixing with `architect_`. **The MCP names use underscores end-to-end — `architect_scope_validate`, not `architect_scope-validate`.** The hyphenated form 404s against the registry.

| CLI subcommand      | MCP tool name                 |
| ------------------- | ----------------------------- |
| `overview`          | `architect_overview`          |
| `status`            | `architect_status`            |
| `context`           | `architect_context`           |
| `dep-tree`          | `architect_dep_tree`          |
| `files`             | `architect_files`             |
| `scope-validate`    | `architect_scope_validate`    |
| `handoff`           | `architect_handoff`           |
| `pattern`           | `architect_pattern`           |
| `bundle`            | `architect_bundle`            |
| `list`              | `architect_list`              |
| `open-questions`    | `architect_open_questions`    |
| `search`            | `architect_search`            |
| `rules`             | `architect_rules`             |
| `taxonomy`          | `architect_taxonomy`          |
| `arch neighborhood` | `architect_arch_neighborhood` |
| `arch blocking`     | `architect_arch_blocking`     |
| `arch coverage`     | `architect_coverage`          |
| `documentation`     | `architect_documentation`     |
| (no CLI twin)       | `architect_rebuild`           |
| (no CLI twin)       | `architect_config`            |
| (no CLI twin)       | `architect_help`              |

Source of truth: `packages/architect-mcp/src/tool-registry.ts` — read it for the current tool set and count; the mapping above teaches the snake_case rule, it is not a live inventory.

CLI-only carve-outs (no MCP twin today): `arch roles`, `arch bounded-context`, `arch compare`, `arch dangling`, `arch orphans`, `diagnostics`, `tags`, `sources`, `unannotated`, `repl`, the `query <method>` passthrough whitelist.

Both surfaces share the same data. The CLI is the default; MCP is a transport for tool-mediated bursts where you will issue several verbs back-to-back and the harness amortizes the round-trip overhead.

## Feedback — close the loop

The PatternGraph is a living surface. Verbs, flag shapes, and output structures evolve as the product evolves; this skill paraphrases the CLI but the CLI itself is canonical when they disagree. **API surprises are signal, not noise.**

**Capture today — append to `FEEDBACK.md` at the repo root.** One file, all reports, easy to grep historically. A useful entry names the verb you ran, what you expected, what you got, and the impact on your session. Short is fine — friction kills the loop.

**Coming — first-class `feedback` verb.** A `pnpm architect:query feedback` CLI verb (and `architect_feedback` MCP twin) will let agents and humans flag verb-misbehaviour structurally so failures feed back into development without a separate process. Planned shape:

- **Stateless input.** A freeform short note and an optional count of recent calls that were troublesome. No required arguments — the call itself is the lowest-cost feedback affordance the API can offer.
- **Session-tagged calls.** Every `pnpm architect:query` invocation carries an opaque session ID so `feedback` can reference _"the last N calls"_ without the caller copying anything in.
- **Bulk reporting.** One feedback call covers a sequence of troublesome calls; never per-call.
- **Heuristic auto-flagging.** Suspicious response shapes (too small to be useful, requirements-projection-sized dumps that drown the caller) and repeated calls with the same signature get surfaced as candidate feedback items automatically. The two failure modes of a structured query API are payload underflow and payload overflow — both detectable without inspecting content.

This loop is intentionally tighter than a typical API contract because the codebase being queried is itself evolving every commit. Consumer feedback is part of the product, not a side channel.

## Anti-patterns (stop)

- **Reading files before querying.** `Read` / `Glob` / `Grep` against `architect/`, `packages/architect-*/`, or `tests/features/` to _learn about a pattern_. There is a verb for that.
- **Hand-writing hyphenated MCP names.** Callable names are underscored end-to-end — `architect_scope_validate`, `architect_open_questions`, `architect_dep_tree`. Hyphens 404.
- **Treating `pattern <Name>` "not found" as binary.** It can mean parse failure with provenance. Cross-check with `search` or `list --names-only`.
- **Piping bare `pnpm architect:query … | jq`.** The pnpm banner on stdout breaks the pipe — use `pnpm -s`. Getting a `jq` parse error once and switching to `grep` is the #1 self-inflicted reason to abandon the API; the cost is ~10–15× more context per task.
- **Parsing `--format json` shapes by regex.** Pipe to `jq` (with `-s`) or parse structurally.
- **Combining `rules` scope filters.** `--pattern` / `--product-area` / `--package` / `--feature` / `--decision` are mutually exclusive — pass exactly one, or the call errors.
- **Stitching `overview` + `context` + `dep-tree` + `files` + `rules` manually.** Reach for `bundle <Pattern>` first; drop down to single verbs only when you need a single slice.

## Doctrine cross-references

- [`../architect-base/references/fsm-transitions.md`](../architect-base/references/fsm-transitions.md) — what `scope-validate` checklist entries and `query isValidTransition` outputs mean against the FSM table; `@architect-unlock-reason:` rules.
- [`../architect-base/references/four-tier-ladder.md`](../architect-base/references/four-tier-ladder.md) — why idea / candidate / plan have no `scope-validate` target.
- [`../architect-sessions/references/ephemeral-spec-deletion.md`](../architect-sessions/references/ephemeral-spec-deletion.md) — the manual pre-deletion gate the future `value-transfer` verb will mechanize.
- [`../architect-base/SKILL.md`](../architect-base/SKILL.md) §"Anti-anecdote" — the live CLI output is canonical; older skill bodies paraphrasing it are not (the same instinct as "API surprises are signal" above).

## Provenance

Verb names, flag shapes, and output samples in this skill were re-verified against the live CLI on 2026-05-29 at the current branch state (`campaign/docs-and-skills-consolidation`). Re-verify by running `pnpm architect:query --help` and the relevant subcommand `--help` when in doubt. The CLI's own output wins on disagreement.
