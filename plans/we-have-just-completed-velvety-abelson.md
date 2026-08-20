# Plan: Improve API Discoverability + Core Annotation Fixing + Skill Sync

> Status: DRAFT — exploration in progress. This file is being built incrementally.

## Context

Architect was recently extracted from a monorepo. The prior sessions got the repo to an **operational, green, committed** state: the PatternGraph read kernel (`PatternGraphAPI`) is correct, reachable through the `query` passthrough, guarded by a consistency suite, and the CLI returns compact payloads. The branch is `campaign/docs-and-skills-consolidation`.

The next chunk of work targets **dogfooding effectiveness** — making the Architect tooling and PatternGraph state genuinely usable for continued work in this repo. Four threads:

1. **API discoverability for agent sessions is still weak.** A cold session does not reliably discover what the API can answer. Levers: the `overview` verb, the SessionStart hook (`.codex/hooks/architect-api-first.sh`), and the mandatory-skill loading protocol.
2. **Core package annotations need a careful review + mass fix** across `packages/architect-core/src/` and `packages/architect-core/tests/`.
3. **The `overview` verb should actively "promote" the value of the API** — surfacing the high-value data dimensions (business rules, decisions, taxonomy, validation rules, API shapes) that the generated-doc indexes (`docs-live/*.md`) already summarize.
4. **The three Architect skills are essential context AND critical artifacts** — they must be improved and continuously kept in sync with the implementation.

### Grounding already gathered

- `overview` already emits: PROGRESS, ARCHITECTURE (mermaid), BLOCKING, GENERATED VIEWS (13 doc types), and a "DATA API — Use Instead of Explore Agents" verb list. Current graph: **266 delivery patterns (118 completed, 129 active, 19 planned) = 44%, + 20 candidates**. Packages: cli (4), core (31), guard (20), mcp (5), projection (103).
- The "demo hook" is already a substantial SessionStart injector: API-first contract + mental model + skill-load directive + live `overview` snapshot. Bounded-read stdin handling, graceful fallback. It lives under `.codex/`.
- `docs-live/` index files already compute exactly the promotable summary stats: BUSINESS-RULES (292 rules / 6 packages), DECISIONS (10 ADRs), TAXONOMY (8 roles / 20 metadata / 3 aggregation = 31 tags), VALIDATION-RULES (6 rules / 4 FSM states / 3 protection levels), API-REFERENCE (241 shapes / 3 packages).
- Note discrepancy to investigate: `docs-live/BUSINESS-RULES.md` lists 6 packages (incl. `architect-dev`, `architect-pkg-content`) but live overview shows 5 — possible doc grouping by feature-path vs package, or staleness.

## Findings (from exploration agents)

_pending_

## Recommended approach

_pending_

## Verification

_pending_
