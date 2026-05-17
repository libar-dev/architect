---
name: architect-data-api
description: MANDATORY before any work in this Architect repo that touches the PatternGraph, design specs, executable features, or FSM state. Triggers on mentions of `pnpm architect:query`, `architect:query`, any `architect_*` MCP tool name (`architect_overview` / `architect_context` / `architect_scope_validate` / etc.), the CLI verb names (`overview`, `status`, `context`, `dep-tree`, `files`, `scope-validate`, `handoff`, `query`, `pattern`, `bundle`, `list`, `open-questions`, `search`, `arch <subcommand>`, `rules`, `diagnostics`, `tags`, `taxonomy`), session intents (planning / design / implement / review / refactor / handoff) applied to an Architect pattern, FSM transitions, `scope-validate`, `dep-tree`, `arch dangling`, dangling-reference baselines, or PatternGraph queries. Single source of truth for which surface (CLI vs MCP), which flags exist, which verdicts are deterministic, and which quirks bite. Invoke BEFORE the canonical bootstrap in any architect-* session skill — the bootstrap commands live here. Do NOT use for: generic CLI questions unrelated to `pnpm architect:query`, unrelated MCP servers, generic Gherkin work outside the architect family, or sprint/project management.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Data API — CLI + MCP

This skill is the **reference**, not the router. Intent detection lives in
[`../architect-session-router/SKILL.md`](../architect-session-router/SKILL.md).
Once the router has chosen a session intent (planning / design / implement /
review / refactor / handoff), this skill is the authoritative source for how
to talk to the PatternGraph.

The repo's `CLAUDE.md` already states the rule: **the Architect Data API
(CLI / MCP) is the canonical source. File scanning is not.** Every other
architect-scoped skill defers to this one for the actual verb shapes.

## When this skill fires

Every architect-repo session that touches patterns, specs, FSM state, or
executable features. The session-router invokes the canonical bootstrap; the
bootstrap lives here. If you are about to run `Read` / `Glob` / `Grep` against
`architect/`, `packages/architect-*/`, or `tests/features/` to learn about a
pattern, **stop** — there is a verb for that.

## CLI vs MCP — which to use

| Surface                             | Latency                      | Context cost per call                                      | When to prefer                                                                                                     |
| ----------------------------------- | ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm architect:query <verb>` (CLI) | ~2–5s cold, ~0.5s warm cache | One Bash tool result; pastes cleanly into PRs and handoffs | **Default.** Deterministic, easy to share, JSON pipes into `jq`.                                                   |
| `architect_*` MCP tools             | Sub-millisecond per call     | Each call is a separate tool-use round trip                | Tool-mediated bursts where you'll call ≥5 verbs back-to-back and the harness can amortize the round-trip overhead. |

**Doctrine:** default to CLI. Reach for MCP only when you'll burst-call
several verbs in close sequence — the sub-ms-per-call win reverses once you
count per-tool round-trip overhead. The two surfaces share the same data; do
not split documentation per surface.

## CLI ↔ MCP tool-name mapping (parity)

Every CLI subcommand has an MCP twin. Names map by snake*casing the CLI form
and prefixing with `architect*`. **The MCP names use underscores end-to-end
— `architect_scope_validate`, not `architect_scope-validate`.\*\* Writing the
hyphenated form will 404 against the registry.

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

Source of truth: `packages/architect-mcp/src/tool-registry.ts`. The current
inventory is **21 MCP tools** — CLAUDE.md still says 18, that line is stale.

Parity carve-outs (where the surfaces diverge):

- The CLI `arch <sub>` namespace only partially crosses the boundary. MCP
  exposes individual tools for `neighborhood`, `blocking`, and `coverage`;
  the remaining subcommands (`roles`, `bounded-context`, `compare`,
  `dangling`, `orphans`) are CLI-only. `architect_help` is a static tool
  catalog — it does not dispatch missing subcommands.
- The CLI's `query <method>` whitelist (`isValidTransition`,
  `getStatusCounts`, …) has no single MCP twin — use the verbs that wrap
  the same data (`architect_status` for counts; FSM checks reach via the
  scope-validate output).
- `diagnostics`, `tags`, `sources`, `unannotated`, `repl` are also CLI-only.

## Pre-flight by session intent

The **composite bundle** is the new default. `bundle <Pattern> --mode <session>`
returns deliverables + deps + rules + open-questions + docstring in one
shot. Use it first; drop down to individual verbs only when you need a single
slice.

### Planning (idea / candidate authoring)

```bash
pnpm architect:query overview
pnpm architect:query list --status candidate --names-only
pnpm architect:query open-questions [--parent <Epic>]              # candidate readiness signal
pnpm architect:query context <Pattern> --session planning          # if a pattern name is in mind
```

`scope-validate` is **not** available at this tier — it only accepts
`design` and `implement`. Idea/candidate readiness is checked structurally
(see [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md)).

### Design tier authoring

```bash
pnpm architect:query overview
pnpm architect:query scope-validate <Pattern> design               # gate
pnpm architect:query bundle <Pattern> --mode design --format json  # composite
# Drop-downs when you only need a slice:
pnpm architect:query dep-tree <Pattern>
pnpm architect:query rules --pattern <Pattern>
```

There is no `stubs` CLI verb. `context --session design` (or the design-mode
bundle) returns stubs.

### Implement (build from a design-level spec)

```bash
pnpm architect:query overview
pnpm architect:query scope-validate <Pattern> implement            # must be PASS
pnpm architect:query bundle <Pattern> --mode implement --format json
pnpm architect:query files <Pattern>                               # modification targets
pnpm architect:query rules --pattern <Pattern> --only-invariants   # what to encode
pnpm architect:query query isValidTransition <currentState> active # FSM gate before status flip
```

### Review (design-spec gap-finding, pre-implementation)

```bash
pnpm architect:query overview
pnpm architect:query scope-validate <Pattern> implement            # PASS/WARN/BLOCKED is the gate
pnpm architect:query bundle <Pattern> --mode review --format json
pnpm architect:query dep-tree <Pattern>
pnpm architect:query arch blocking                                 # global blocker view
pnpm architect:query files <Pattern> --related
```

### Refactor (shipped code, no design spec)

```bash
pnpm architect:query overview
pnpm architect:query context <Pattern> --session implement         # current surface
pnpm architect:query files <Pattern>                               # touched-file inventory
pnpm architect:query dep-tree <Pattern>                            # blast radius
pnpm architect:query arch blocking
pnpm architect:query arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict
                                                                   # graph-integrity gate
```

### Handoff (end-of-session capture)

```bash
pnpm architect:query overview
pnpm architect:query context <Pattern> --session <intent>          # has '=== FSM ===' for implement
pnpm architect:query arch blocking
pnpm architect:query open-questions [--parent <X>]                 # forward-looking signal
pnpm architect:query handoff --pattern <Pattern> --session <intent> [--modified-file <p>]...
```

### Generic inspection (no specific intent)

```bash
pnpm architect:query overview
pnpm architect:query search <fragment>                             # fuzzy pattern-name search
pnpm architect:query pattern <Name>                                # full detail (note parse-provenance behavior below)
pnpm architect:query taxonomy --count                              # tag-system snapshot
pnpm architect:query arch neighborhood <Pattern>
```

## Verb reference

Organized by intent bucket. Verbs marked **NEW** landed in the recent
remediation wave and are not yet reflected in older skill bodies.

### Health & inventory (any session)

- **`overview`** — text: progress (e.g. `260 delivery patterns (114 completed,
120 active, 26 planned) = 44%`) + blocking summary + Data-API hint footer.
  Note: the hint footer currently advertises a non-existent `stubs
--unresolved` verb — ignore that line; see "Known quirks" below.
- **`status`** — status distribution counts + percentages, no per-pattern detail.
- **`list [--status v] [--role tag] [--parent X] [--count] [--names-only]`**
  — pattern catalog. `--parent` is **NEW** and resolves strictly; unknown
  parent emits `Parent pattern not found: <Name>` and exits non-zero.
  `--names-only` returns a JSON string array — pipe through `jq`.
- **`search <query>`** — fuzzy pattern-name search; JSON
  `[{patternName, score, matchType}]`.
- **`taxonomy [--count]`** — `--count` (**NEW**) prints a one-line summary,
  e.g. `8 roles | 20 metadata tags | 3 aggregation tags | 31 total`.
  `--format json` returns the full `{ root: { tags: [...] } }`.
- **`tags`** — `TagUsageMatrix`: pattern count + per-tag value distribution.
- **`diagnostics`** — JSON array of structural warnings.
- **`sources`**, **`unannotated`** — coverage helpers.

### Per-pattern detail

- **`pattern <Name>`** — full PatternDetail (deliverables, relationships,
  rules, role, maturity, file). **NEW behavior:** when the underlying feature
  file fails to parse, this verb reports parse provenance
  `(kind, path, parser line:col)` instead of a flat "Pattern not found."
  _A "Pattern not found" response is no longer binary_ — could mean
  "doesn't exist" OR "exists but failed to parse." Cross-check with `search`
  or `list --names-only` before concluding it doesn't exist.
- **`context <Pattern> [--session planning|design|implement]`** — curated
  bundle: pattern summary, dependencies, architecture neighbors. With
  `--session implement`, also includes an `=== FSM ===` line showing current
  status + valid transitions + protection level.
- **`files <Pattern> [--related]`** — primary deliverable file. With
  `--related`, adds `=== COMPLETED DEPENDENCIES ===`, `=== ROADMAP
DEPENDENCIES ===`, and `=== ARCHITECTURE NEIGHBORS ===` sections.
- **`dep-tree <Pattern> [--depth <n>]`** — dependency chain walk.
- **`rules [--product-area n] [--pattern n] [--package n] [--feature glob]
[--only-invariants] [--count] [--names-only]`** — business-rule catalog.
  `--package` and `--feature` are **NEW**:
  - `--package <workspace-name>` filters by canonical workspace name
    (e.g. `@libar-dev/architect-projection`).
  - `--feature <path-or-glob>` matches against `pattern.source.file` with
    POSIX-style glob semantics.

### Composite (the new default pre-flight)

- **`bundle <Pattern> [--mode plan|design|implement|review] [--include
<block[,block...]>] [--estimate-tokens] [--format json]`** — **NEW**.
  Composite of deliverables + deps + rules + open-questions + docstring.
  Mode default-include sets apply only when `--include` is omitted. Token
  estimation is heuristic (chars / 4).
  - **Quirk:** repeated `--include` flag silently keeps **only the last
    value**. `--include rules --include deps` produces `Includes: [deps]`.
    Always use the comma-list form: `--include rules,deps,open-questions`.

- **`open-questions [--parent <Pattern>] [--format compact|json]`** —
  **NEW**. Returns `OpenQuestionList` fragment: per-pattern open questions
  lifted from each spec's `**Open Questions:**` block. The candidate-tier
  readiness signal that didn't exist when older skills were written.

### Gates & validation

- **`scope-validate <Pattern> <design|implement> [--strict]`** — verdict
  `READY` / `READY (with warnings)` / `BLOCKED`. **Only `design` and
  `implement` are accepted** — `planning`, `review`, anything else errors
  with `Scope type must be design or implement`. Output is a per-criterion
  checklist (`[PASS] / [WARN] / [BLOCKED]`) followed by a final verdict line.
- **`query isValidTransition <from> <to>`** — deterministic FSM gate. Returns
  `{success: true, data: true|false}`. Use this before flipping
  `@architect-status` (see [`../_shared/fsm-transitions.md`](../_shared/fsm-transitions.md)).
- **`arch dangling [--baseline <path>] [--write-baseline] [--strict]`** —
  graph-integrity check. Without flags, JSON-prints every dangling reference.
  With `--baseline <file>`, compares against a checked-in baseline; with
  `--strict`, exits non-zero on any drift. `--write-baseline` rewrites the
  baseline deterministically. The repo's committed baseline lives at
  `packages/architect-guard/src/lint/dangling-baseline.json`.
- **`arch blocking`** — text: `X blocked by: Y, Z` lines for every pattern
  with incomplete dependencies. The global blocker view.

### Other architecture verbs

- **`arch roles`** — role inventory.
- **`arch bounded-context [name]`** — bounded-context inventory; with a name,
  the contents of that context.
- **`arch neighborhood <Pattern>`** — local subgraph around the pattern.
- **`arch compare <bc-a> <bc-b>`** — diff two bounded contexts.
- **`arch coverage`** — annotation coverage rollup.
- **`arch orphans`** — patterns with no incoming or outgoing edges.

### Session-record

- **`handoff --pattern <X> [--session planning|design|implement|review]
[--modified-file <p>]...`** — emits `=== HANDOFF ===` block. Pass
  `--modified-file` once per file touched.

### Whitelisted `query` methods

`query <method> [args...]` is a passthrough to the typed read API. Returns
`{success, data, metadata}` JSON.

- `query getStatusCounts` → `{completed, active, planned, candidate, total}`.
- `query isValidTransition <from> <to>` → `{success, data: boolean}`. See
  "Gates & validation" above.
- `query getPatternsByStatus <status>` → array of pattern summaries.
- `query getPatternsByPhase <phase>` → array of pattern summaries.

### Documentation projection

- **`documentation <document-type> [--disclosure <level>] [--filter
<status=csv>]...`** — emits projected docs (patterns / architecture /
  roadmap / changelog / decisions / taxonomy / requirements-executable /
  requirements-specs). The disclosure level controls verbosity.

### Interactive

- **`repl`** — interactive shell. Not used in scripted sessions.

## Output formats & JSON consumption

| Verb                                                                                                                                     | Default output | `--format json` available |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------- |
| `query <method>`                                                                                                                         | JSON           | (default)                 |
| `diagnostics`                                                                                                                            | JSON           | (default)                 |
| `arch dangling`                                                                                                                          | JSON           | (default)                 |
| `search`                                                                                                                                 | JSON           | (default)                 |
| `list --names-only`                                                                                                                      | JSON           | (default)                 |
| `open-questions`                                                                                                                         | Text           | yes (`--format json`)     |
| `bundle`                                                                                                                                 | Text           | yes (`--format json`)     |
| `taxonomy`                                                                                                                               | Text           | yes (`--format json`)     |
| `overview` / `status` / `context` / `files` / `scope-validate` / `handoff` / `pattern` / `dep-tree` / `rules` / `tags` / `arch blocking` | Text           | text-only today           |

Pipe JSON through `jq` for downstream consumption. Text output is for human
review.

### Worked JSON shapes

`query isValidTransition roadmap active`:

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

`open-questions --format json` (truncated):

```json
{
  "children": {},
  "root": {
    "count": 2,
    "filters": {},
    "items": [
      {
        "file": "tests/features/cli/list-parent-child-alpha.feature",
        "pattern": "ChildAlpha",
        "questions": ["Who owns the alpha follow-up?", "Which signal closes the alpha gap?"],
        "status": "active"
      }
    ],
    "kind": "OpenQuestionList"
  }
}
```

`bundle ChildAlpha --mode design --format json` (truncated to structure):

```json
{
  "children": {},
  "root": {
    "kind": "PatternBundleEntry",
    "mode": "design",
    "entryRole": "root",
    "memberCount": 0,
    "members": [],
    "includes": ["docstring", "rules", "scenarios", "open-questions"],
    "pattern": {
      "patternName": "ChildAlpha",
      "status": "active",
      "maturity": "design",
      "source": "gherkin",
      "file": "..."
    },
    "blocks": {
      "docstring": "...",
      "openQuestions": ["..."],
      "rules": [
        {
          "kind": "BusinessRule",
          "ruleName": "...",
          "invariant": "...",
          "verifiedBy": ["..."],
          "scenarioCount": 1
        }
      ],
      "scenarios": [{ "ruleName": "...", "count": 1, "scenarios": ["..."] }]
    }
  }
}
```

`arch dangling` (already JSON by default):

```json
{
  "success": true,
  "data": [
    {
      "pattern": "ArchitectBriefDeterministicBundle",
      "field": "seeAlso",
      "missing": "ADR005CodecRendererSeparation"
    },
    {
      "pattern": "ModelEnrichedDataAPI",
      "field": "seeAlso",
      "missing": "ADR005CodecRendererSeparation"
    }
  ],
  "metadata": {
    /* ... */
  }
}
```

`scope-validate PatternBundleProjection implement` (text):

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
- Dependencies completed: 1/2 completed. Blockers: PatternRelationsFragmentContracts (active)
- Deliverables defined: No deliverables found in Background table
```

## Deterministic gates

Three verbs are designed to be parsed for a deterministic verdict, not read
as prose:

1. **`scope-validate <Pattern> <design|implement>`** — the per-criterion
   checklist (`[PASS]` / `[WARN]` / `[BLOCKED]`) + final verdict. Treat
   `READY` and `READY (with warnings)` as proceed; `BLOCKED` as stop.
2. **`query isValidTransition <from> <to>`** — JSON boolean. The gate before
   flipping `@architect-status`.
3. **`arch dangling --baseline <path> --strict`** — non-zero exit on drift.
   Use in CI gates and refactor closing checks; otherwise the baseline-less
   form reports current drift as JSON.

## Known quirks

- **`value-transfer <Pattern>` is future work.** Referenced in
  [`../_shared/value-transfer.md`](../_shared/value-transfer.md) as a planned
  verb; ships per `architect/specs/value-transfer-state.feature`. Until then,
  walk the manual pre-deletion gate in that shared doc.
- **`pattern <Name>` "not found" surfaces two distinct error paths.** The
  command first checks `getPattern`; if that misses, it probes
  `findPatternParseFailure` and re-throws a parse-failure-with-provenance
  message when one exists. Treat the two error strings as different signals
  — cross-check unfamiliar "not found" output against `search` or
  `list --names-only`.
- **MCP names use underscores end-to-end.** `architect_scope_validate`, not
  `architect_scope-validate`. Hyphenated forms 404 against the registry.
- **`scope-validate` rejects `planning` and `review`.** The error is
  `Scope type must be design or implement`. Idea/candidate readiness has no
  CLI gate — use the structural checklist in
  [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md).

## Doctrine cross-references

- [`../_shared/fsm-transitions.md`](../_shared/fsm-transitions.md) — what
  `scope-validate` checklist entries and `query isValidTransition` outputs
  mean against the FSM table; `@architect-unlock-reason:` rules.
- [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md) — which
  `--session` value applies at which tier; why planning/idea/candidate are
  not `scope-validate` targets.
- [`../_shared/value-transfer.md`](../_shared/value-transfer.md) — the manual
  pre-deletion gate that the future `value-transfer` verb will mechanize.
- [`../_shared/canonical-references.md`](../_shared/canonical-references.md)
  — anti-anecdote rule: the live CLI output is canonical; older skill bodies
  paraphrasing it are not.

## Anti-patterns (stop)

- **Reading files before querying.** `Read` / `Glob` / `Grep` against
  `architect/`, `packages/architect-*/`, or `tests/features/` to learn about
  a pattern. The Data API is faster, more accurate, and more compact.
- **Hand-writing hyphenated MCP names.** `mcp__architect__overview` is fine
  as a glob in prose, but the actual callable names are underscored:
  `architect_overview`, `architect_scope_validate`, `architect_open_questions`.
- **Using `scope-validate <X> planning`.** Only `design` and `implement` are
  accepted. The CLI errors with `Scope type must be design or implement`.
- **Parsing `--format json` shapes by regex.** Pipe to `jq` or parse
  structurally. The shapes are stable; regex against them is not.
- **Treating `pattern <Name>` "not found" as binary.** Post-PR, it can mean
  parse failure with provenance. Cross-check before concluding.
- **Chaining `--include` flags on `bundle`.** `--include rules --include deps`
  silently keeps only `deps`. Use comma-lists.
- **Stitching together overview + context + dep-tree + files + rules manually
  when the session-mode bundle would return the same data.** Reach for
  `bundle <Pattern> --mode <session>` first; drop down to single verbs only
  when you need a single slice.

## Provenance

All claims in this skill were verified against the live CLI on
2026-05-17 against the repo state at HEAD (`main`). Re-verify by running
`pnpm architect:query -- --help` and the relevant subcommand `--help`
forms when in doubt. The Data API is the canonical source — this skill
paraphrases it, but the CLI's own output wins on disagreement.
