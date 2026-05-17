---
description: Quick reference to Architect CLI verbs grouped by session intent. Compact alternative to the full data-api kernel; load when a session needs verb-by-purpose lookup without the deep reference.
---

# Architect CLI Overview (prototype)

> **Status:** prototype output of `scripts/proto/cli-catalog.ts`. Validates the documentation-projection design (architect/specs/documentation-projection/). Not a production skill.

## When this fires

Any architect-scoped session that needs to look up a CLI verb by what it does, grouped by what the session is trying to do. For deep verb shapes (JSON outputs, deterministic gates, quirks), descend to the full reference under `.pr-coordination/proto-output/cli-docs/INDEX.md`.

## Verbs by session intent

### planning

Capture a new idea, refine a candidate, decide what to build next.

- `pnpm architect:query overview`
- `pnpm architect:query list --status candidate --names-only`
- `pnpm architect:query open-questions [--parent <Epic>]` — candidate readiness signal
- `pnpm architect:query context <Pattern> --session planning`

### design

Promote a candidate to design tier — deliverables, stubs, ADRs, scenarios.

- `pnpm architect:query overview`
- `pnpm architect:query scope-validate <Pattern> design` — deterministic gate
- `pnpm architect:query bundle <Pattern> --mode design --format json`
- `pnpm architect:query dep-tree <Pattern>`
- `pnpm architect:query rules --pattern <Pattern>`

### implement

Build a design-tier spec end-to-end; transfer value to code + executable specs.

- `pnpm architect:query overview`
- `pnpm architect:query scope-validate <Pattern> implement` — must be PASS
- `pnpm architect:query bundle <Pattern> --mode implement --format json`
- `pnpm architect:query files <Pattern>`
- `pnpm architect:query rules --pattern <Pattern> --only-invariants`
- `pnpm architect:query query isValidTransition <from> active` — FSM gate before status flip

### review

Read a design-tier spec for implementation readiness, find gaps.

- `pnpm architect:query overview`
- `pnpm architect:query scope-validate <Pattern> implement` — PASS / WARN / BLOCKED is the gate
- `pnpm architect:query bundle <Pattern> --mode review --format json`
- `pnpm architect:query dep-tree <Pattern>`
- `pnpm architect:query arch blocking` — global blocker view
- `pnpm architect:query files <Pattern> --related`

### refactor

Modify shipped code that has no design spec (refactoring carve-out).

- `pnpm architect:query overview`
- `pnpm architect:query context <Pattern> --session implement` — current surface
- `pnpm architect:query files <Pattern>`
- `pnpm architect:query dep-tree <Pattern>` — blast radius
- `pnpm architect:query arch blocking`
- `pnpm architect:query arch dangling --baseline <path> --strict` — graph-integrity gate

### handoff

Wrap a session; capture state, list blockers, prepare continuation.

- `pnpm architect:query overview`
- `pnpm architect:query context <Pattern> --session <intent>`
- `pnpm architect:query arch blocking`
- `pnpm architect:query open-questions [--parent <X>]` — forward-looking signal
- `pnpm architect:query handoff --pattern <Pattern> --session <intent> [--modified-file <p>]...`

## Deterministic gates

Three verbs are designed to be parsed for a verdict, not read as prose. Default to these before any FSM/state mutation.

- **`scope-validate <Pattern> <design|implement>`** — Pre-flight check before starting design or implement work. Only design/implement accepted.
- **`query isValidTransition <from> <to>`** — FSM gate before flipping @architect-status.
- **`arch dangling --baseline <path> --strict`** — Graph-integrity check against committed baseline.

## Anti-patterns

- Reading files (`Read` / `Glob` / `Grep`) on architect-scoped paths before any CLI/MCP call.
- Hand-writing hyphenated MCP names — they 404. See full reference.
- Using `scope-validate <X> planning` — only `design` and `implement` are accepted.

## Full reference

`.pr-coordination/proto-output/cli-docs/INDEX.md` — per-verb signatures, CLI↔MCP parity table, JSON shapes, full quirk list.
