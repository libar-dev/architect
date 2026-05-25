---
name: architect-data-api
description: Always loaded in this Architect repo. The canonical query surface for the PatternGraph — `pnpm architect:query <verb>` (CLI) and `architect_*` MCP twins. Gives deterministic, structured answers to "what is the state of X?", "what does X depend on?", "is this transition legal?", "what is blocking?", "are there dangling references?". Covers every verb the repo ships — overview / status / list / search / pattern / bundle / context / dep-tree / files / rules / scope-validate / arch blocking / arch dangling / arch neighborhood / taxonomy / open-questions / handoff / documentation — plus the `query isValidTransition` deterministic FSM gate. Pattern exploration through this API is faster than file scanning, structurally typed, and never stale.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Data API — `pnpm architect:query`

The CLI (`pnpm architect:query <verb>`) is the canonical surface for the PatternGraph. Every "what is the state of X?" question about a pattern, every dependency walk, every FSM gate, every dangling-reference check is one verb away. Output is structured, deterministic, sub-second on warm cache, and pipes cleanly into `jq` or a PR description.

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
- `bundle <Pattern>` is the default pre-flight; it returns deliverables + dependencies + rules + open questions + docstring in one call.
- The `--mode <plan|design|implement|review>` flag on `bundle` / `context` exists and changes which blocks are included by default, but defaults are good and the variation in returned data is dominated by what the pattern actually _is_ on disk.
- Expect intent flags to recede further over time. The skill leads with state-driven exploration; per-intent recipes are not authored here.

## Pattern exploration — the everyday verbs

These are the verbs every session reaches for. Run them in this order when picking up an unfamiliar pattern.

```bash
# 1. Health + inventory — start here every time
pnpm architect:query overview

# 2. Locate — if you know a name fragment but not the canonical pattern name
pnpm architect:query search <fragment>
pnpm architect:query list --status candidate --names-only

# 3. Pre-flight — the default composite, returns deliverables + deps + rules + open-questions + docstring
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

- **`overview`** — text: progress (`260 patterns (114 completed, 120 active, 26 planned) = 44%`) + blocking summary.
- **`status`** — status distribution counts + percentages, no per-pattern detail.
- **`list [--status v] [--role tag] [--parent X] [--count] [--names-only]`** — pattern catalog. `--parent` resolves strictly; unknown parent exits non-zero with `Parent pattern not found`. `--names-only` returns a JSON string array.
- **`search <query>`** — fuzzy pattern-name search; JSON `[{patternName, score, matchType}]`.
- **`taxonomy [--count]`** — `--count` prints a one-line summary; `--format json` returns the full taxonomy tree.
- **`tags`** — `TagUsageMatrix`: pattern count + per-tag value distribution.
- **`diagnostics`** — JSON array of structural warnings.
- **`sources`**, **`unannotated`** — coverage helpers.

### Per-pattern detail

- **`pattern <Name>`** — full PatternDetail (deliverables, relationships, rules, role, maturity, file). When the underlying feature file fails to parse, this verb reports parse provenance `(kind, path, parser line:col)` instead of a flat "not found". A "not found" response is therefore not binary — it can mean _parse failure_ OR _truly absent_. Cross-check with `search` or `list --names-only` before concluding.
- **`context <Pattern> [--session planning|design|implement]`** — curated bundle: summary, dependencies, architecture neighbours. With `--session implement`, also includes an `=== FSM ===` line showing current status + valid transitions + protection level.
- **`files <Pattern> [--related]`** — primary deliverable file. With `--related`, adds `=== COMPLETED DEPENDENCIES ===`, `=== ROADMAP DEPENDENCIES ===`, `=== ARCHITECTURE NEIGHBORS ===` sections.
- **`dep-tree <Pattern> [--depth <n>]`** — dependency chain walk.
- **`rules [--product-area n] [--pattern n] [--package n] [--feature glob] [--only-invariants] [--count] [--names-only]`** — business-rule catalog. `--package <workspace-name>` filters by canonical workspace name (e.g. `@libar-dev/architect-projection`). `--feature <path-or-glob>` matches against `pattern.source.file`.

### Composite — the default pre-flight

- **`bundle <Pattern> [--mode plan|design|implement|review] [--include <block[,block...]>] [--estimate-tokens] [--format json]`** — composite of deliverables + deps + rules + open-questions + docstring. Mode default-include sets apply only when `--include` is omitted. Token estimation is heuristic (`chars / 4`). Always use the comma-list form for `--include` (`rules,deps,open-questions`).
- **`open-questions [--parent <Pattern>] [--format compact|json]`** — `OpenQuestionList` fragment: per-pattern open questions lifted from each spec's `**Open Questions:**` block. Candidate-tier readiness signal.

### Architecture views

- **`arch blocking`** — global blocker view; `X blocked by: Y, Z`.
- **`arch dangling [--baseline <path>] [--write-baseline] [--strict]`** — graph-integrity check; see "Gates" above.
- **`arch neighborhood <Pattern>`** — local subgraph around the pattern.
- **`arch coverage`** — annotation coverage rollup.
- **`arch roles`** — role inventory.
- **`arch bounded-context [name]`** — bounded-context inventory; with a name, the contents of that context.
- **`arch compare <bc-a> <bc-b>`** — diff two bounded contexts.
- **`arch orphans`** — patterns with no incoming or outgoing edges.

### Gates

- **`scope-validate <Pattern> <design|implement> [--strict]`** — verdict `READY` / `READY (with warnings)` / `BLOCKED`. Per-criterion checklist `[PASS] / [WARN] / [BLOCKED]` + final verdict line. `planning` and `review` are not accepted scope types.

### Session record

- **`handoff --pattern <X> [--session planning|design|implement|review] [--modified-file <p>]...`** — emits `=== HANDOFF ===` block. Pass `--modified-file` once per file touched.

### Whitelisted `query` methods

`query <method> [args...]` is a passthrough to the typed read API. Returns `{success, data, metadata}` JSON.

- `query getStatusCounts` → `{completed, active, planned, candidate, total}`.
- `query isValidTransition <from> <to>` → `{success, data: boolean}`.
- `query getPatternsByStatus <status>` → array of pattern summaries.
- `query getPatternsByPhase <phase>` → array of pattern summaries.

### Documentation projection

- **`documentation <document-type> [--disclosure <level>] [--filter <status=csv>]...`** — emits projected docs (`patterns` / `architecture` / `roadmap` / `changelog` / `decisions` / `taxonomy` / `requirements-executable` / `requirements-specs`). Disclosure level controls verbosity.

### Interactive

- **`repl`** — interactive shell. Not used in scripted sessions.

## Output formats & JSON consumption

| Verb                                                                                                                                     | Default output | `--format json` available |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------- |
| `query <method>`, `diagnostics`, `arch dangling`, `search`, `list --names-only`                                                          | JSON           | (default)                 |
| `open-questions`, `bundle`, `taxonomy`                                                                                                   | Text           | yes (`--format json`)     |
| `overview` / `status` / `context` / `files` / `scope-validate` / `handoff` / `pattern` / `dep-tree` / `rules` / `tags` / `arch blocking` | Text           | text-only today           |

Pipe JSON through `jq`. Text output is for human review.

Representative JSON shape — `query isValidTransition roadmap active`:

```json
{
  "success": true,
  "data": true,
  "metadata": {
    "timestamp": "2026-05-17T01:06:21.673Z",
    "patternCount": 268,
    "validation": {
      "danglingReferenceCount": 2,
      "malformedPatternCount": 0,
      "unknownStatusCount": 0,
      "warningCount": 2
    },
    "cache": { "hit": true, "ageMs": 1002463 },
    "pipelineMs": 482
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

Source of truth: `packages/architect-mcp/src/tool-registry.ts`. Current inventory: **21 MCP tools**.

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
- **Parsing `--format json` shapes by regex.** Pipe to `jq` or parse structurally.
- **Chaining `--include` flags on `bundle`.** Repeated `--include` silently keeps only the last value. Use the comma-list form.
- **Stitching `overview` + `context` + `dep-tree` + `files` + `rules` manually.** Reach for `bundle <Pattern>` first; drop down to single verbs only when you need a single slice.

## Doctrine cross-references

- [`../_shared/fsm-transitions.md`](../_shared/fsm-transitions.md) — what `scope-validate` checklist entries and `query isValidTransition` outputs mean against the FSM table; `@architect-unlock-reason:` rules.
- [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md) — why idea / candidate / plan have no `scope-validate` target.
- [`../_shared/value-transfer.md`](../_shared/value-transfer.md) — the manual pre-deletion gate the future `value-transfer` verb will mechanize.
- [`../_shared/canonical-references.md`](../_shared/canonical-references.md) — anti-anecdote rule: the live CLI output is canonical; older skill bodies paraphrasing it are not.

## Provenance

Verb names, flag shapes, and output samples in this skill were verified against the live CLI on 2026-05-17 at the repo state HEAD on `main`. Re-verify by running `pnpm architect:query --help` and the relevant subcommand `--help` when in doubt. The CLI's own output wins on disagreement.
