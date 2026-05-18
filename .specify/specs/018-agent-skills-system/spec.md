# Feature: Agent Skills System

## Status
✅ COMPLETE — Nine architect skills (two kernels + seven session skills) live under `.agents/skills/`; Claude Code reads them via `.claude/skills/` symlinks; `_shared/` doctrine kernel is loaded transparently.

## Overview

The agent skills system is how AI coding agents interact with this repo without re-deriving doctrine every session. Skills live under `.agents/skills/` (the single source of truth). Claude Code discovers them via symlinks at `.claude/skills/` — a projection that must never be edited directly. Other harnesses (OpenCode, Oh-My-OpenCode) have their own surfaces in `architect-studio/.opencode/` and `architect-studio/.omo-architect-stash/` respectively; those are out of scope for this phase.

There are **nine** skills, organized into two tiers:

- **Two kernels** — loaded first in every architect-scoped session:
  - `architect-session-router` — resolves session intent (planning / design / implement / refactor / review / review-implement / handoff) and routes to the matching session skill; surfaces relevant `_shared/` doctrine files.
  - `architect-data-api` — canonical reference for the CLI + MCP surface: verb shapes, deterministic gates (`scope-validate`, `query isValidTransition`, `arch dangling --strict`), JSON shapes, parity table, and known quirks.
- **Seven session skills** — intent-specific, dispatched by the router:
  - `architect-plan-session` — idea / candidate-tier spec authoring.
  - `architect-design-session` — design-tier spec; runs `scope-validate design`.
  - `architect-implement-spec` — build spec end-to-end; transfer value to annotations + executable Gherkin.
  - `architect-review-spec` — pre-implementation readiness review of a design spec.
  - `architect-review-implementation` — post-merge implementation review; batch spec deletion.
  - `architect-refactor-session` — modify shipped code with no extant design spec.
  - `architect-verify-handoff` — wrap session; capture state and blockers.

The **`_shared/` directory** holds the harness-agnostic doctrine kernel: four-tier ladder, FSM transitions, value transfer, annotation ownership, canonical references, multi-session coordination, the rule-block template, session preamble, and spec-pattern relationships. Skills reference these files by relative path; loading the router surfaces the pointers without inlining the bodies.

**Operational invariant (from constitution §VIII):** the kernel pair **must** be loaded before any architect-scoped `Read` / `Glob` / `Grep`, before invoking any other architect-* session skill, and **before calling `pnpm architect:query` or any `architect_*` MCP tool**. The Data API (CLI / MCP) is the canonical source of truth about patterns, specs, FSM state, and executable features — file scanning is not.

## User Stories

- As an AI coding agent starting an architect-scoped session, I want the router to resolve my intent so I am dispatched to the correct session skill without guessing.
- As an AI coding agent, I want the data-api kernel loaded before I run any CLI / MCP verb so I never invoke a verb with the wrong shape.
- As an architect maintainer, I want skills to live in **one** place (`.agents/skills/`) with a symlink projection so I never have to keep two copies in sync.
- As an AI-augmented developer, I want session intents to be enumerable and stable so I can predict which skill will fire.
- As an AI coding agent, I want `_shared/` doctrine surfaced by the router so I do not inline doctrine into every session skill.

## Acceptance Criteria

- [x] Nine skills exist at `.agents/skills/` — two kernels + seven session skills.
- [x] `.claude/skills/` projection is a symlink (never edited directly).
- [x] `architect-session-router` resolves all seven session intents and dispatches to the correct downstream skill.
- [x] `architect-data-api` exposes the parity table (CLI ↔ MCP) for every verb listed in `integration-points.md` §CLI Surface and §MCP Surface.
- [x] The kernel pair is mandatory before any architect-scoped Read/Glob/Grep, any session skill, and any `pnpm architect:query` or `architect_*` MCP call (constitution §VIII).
- [x] `_shared/` holds the harness-agnostic doctrine kernel and is referenced by relative path from skills.
- [x] Session skills are description-activated (no slash-command bootstrap, no hooks) so they trigger on the natural verbs an agent uses.
- [x] Skills are documented in AGENTS.md §"Agent skills".
- [x] Harness coverage today is **Claude Code only**; OpenCode and Oh-My-OpenCode variants live in `architect-studio/` and are out of scope here.

## Technical Requirements

- **Surface**: `.agents/skills/<skill-name>/SKILL.md` (one directory per skill).
- **Projection**: `.claude/skills/` is a symlink to `.agents/skills/` (or per-skill symlinks). Treat it as read-only.
- **Activation**: description-based — each skill's frontmatter triggers on the verbs and surface names a session uses; no slash-command or hook bootstrap.
- **Kernel pair**: `architect-session-router` and `architect-data-api`. The router routes to exactly one downstream session skill per session intent.
- **Shared doctrine**: `_shared/` files referenced by relative path. Editing `_shared/` propagates to every skill without each one inlining.
- **Invariants**:
  - The kernel pair is loaded first, every architect-scoped session, before any other architect tool / skill.
  - The `.claude/skills/` projection is never edited directly.
  - Other harnesses' surfaces (OpenCode, Oh-My-OpenCode) are out of scope at this phase.

## Implementation Status

**Completed:**
- ✅ Nine skills under `.agents/skills/` (two kernels + seven session skills).
- ✅ `.claude/skills/` symlink projection wired for Claude Code.
- ✅ `_shared/` doctrine kernel referenced by relative path from skills.
- ✅ Constitution §VIII (Operating Procedure for AI Agents) documents the mandatory kernel-pair load.
- ✅ AGENTS.md §"Agent skills" enumerates the nine skills.
- ✅ `integration-points.md` §"Cross-references" pins the canonical references the data-api kernel surfaces.

## Dependencies

- Spec 005 (`cli-surface`) — `architect-data-api` references CLI verbs.
- Spec 006 (`mcp-server`) — `architect-data-api` references MCP tools.
- Spec 010 (`scope-readiness-validation`) — `architect-design-session` runs `scope-validate design`.
- Spec 011 (`session-handoff`) — `architect-verify-handoff` wraps sessions through this surface.
- Spec 013 (`pre-commit-guard`) — session skills understand the guard's session-scoped rules.

## Related Specifications

- AGENTS.md §"Agent skills" (the nine-skill table) and §"Session bootstrap (mandatory)".
- Constitution §VIII (Operating Procedure for AI Agents).
- ADR-003 — Source-First Pattern Architecture (skills exist to keep agents on-source, on-spec).
- PDR-001 — Session Workflow Commands (the canonical verb shapes the skills wrap).
- `decision-rationale.md` — why description-based activation over slash-command bootstrap.
- `functional-specification.md` §"Cross-references" — `.agents/skills/` as workflow source-of-truth.
- **Out of scope at this phase**: OpenCode adapter in `architect-studio/.opencode/`; Oh-My-OpenCode variant in `architect-studio/.omo-architect-stash/`.
