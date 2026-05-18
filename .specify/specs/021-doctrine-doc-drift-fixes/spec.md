# Feature: Doctrine + Documentation Drift Fixes (Phase A Bundle)

## Status
⚠️ PARTIAL — the underlying code is correct; the docs (`AGENTS.md`, `docs/MCP-SETUP.md`, the meta-package `description`, `REMAINING-WORK.md`) carry stale facts that mislead consumers and downstream contributors. Bundled as a single ≈1–2-hour PR per `technical-debt-analysis.md` §Suggested Migration Phases / Phase A.

## Overview

A reverse-engineering pass at the pinned commit (`b875ff1`) surfaces four code-vs-doc drift items where the runtime behaves correctly but the documentation contradicts the implementation. Each is independently small; bundled, they form `Phase A` of the migration plan in `technical-debt-analysis.md` — a single short PR that closes all of them at once. The Phase-A estimate is ≈1–2 hours.

The four items (plus one supplementary No-BC violation surfaced during spec generation) are:

1. **PWD/INIT_CWD/cwd precedence drift** (tech-debt #1, **High Impact / Low Effort / Quick Win**). `AGENTS.md` states *"The `architect-cli` resolves config via `process.env.PWD` before `process.cwd()`. This is fragile when embedding the CLI in subprocesses — strip `PWD` and `INIT_CWD` from the child env if you want the child to honour the `cwd:` you set."* The runtime does the opposite — `process.cwd()` is tried first, with `INIT_CWD` and `PWD` as fallbacks only on failure (`packages/architect-cli/src/cli/runtime-helpers.ts:36-56`; `packages/architect-mcp/src/runtime-helpers.ts:16-36`). Consumers following the doctrine attempt to strip env vars that would have been ignored anyway — wasted effort and confusion.

2. **MCP tool-count drift** (tech-debt #2 + #12, Medium Impact / Low Effort / Quick Win). `CLAUDE.md` says **21** tools and is correct. The meta-package `description` in `packages/architect/package.json` says **18**, and `docs/MCP-SETUP.md:88-106` lists 18. The authoritative registry is `packages/architect-mcp/src/tool-metadata.ts:1-71` (`ARCHITECT_MCP_TOOLS`) — 21 tools. Consumers reading either stale source build mental models with three missing tools.

3. **"Four edges" framing in CLAUDE.md is incomplete** (tech-debt #3, Medium Impact / Low Effort / Quick Win). `CLAUDE.md` §"Pattern graph" frames the model with four edge kinds. The projection layer has **seven** relation kinds: `depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref` (`packages/architect-projection/src/fragments/pattern-relations/supporting.ts:66-74`). External consumers writing edge-filter logic against the docs miss `enables`, `extends`, and `api-ref`. The fix is either to enumerate all seven or to be explicit that "four edges" is the high-level model and the seven are the projection-level enum.

4. **REMAINING-WORK.md PWD note** (tech-debt #6, Low Impact / Low Effort, couples with #1). `AGENTS.md` §"Operational notes" says *"Worth revisiting (tracked in REMAINING-WORK.md)."* The runtime patch is already in place (see #1) — the open question is whether the doctrine doc, the working backlog, or both need updates. Resolves as a side-effect of #1.

5. **Dead BC alias `DDD_ES_CQRS_ROLES`** (NEW — surfaced during Gear-3 spec generation, not in `technical-debt-analysis.md`; Low Impact / Low Effort / Quick Win). `packages/architect-core/src/config/role-constants.ts:68` exports `DDD_ES_CQRS_ROLES = LOCKED_WAVE_ONE_ROLES` as a second name for the same array also exported as `DEFAULT_ROLES`. Grep across `packages/*/src/` finds **zero internal callers** for `DDD_ES_CQRS_ROLES` (only barrel re-exports in `index.ts` and `config/index.ts`). The active caller (`factory.ts:30`, `registry-builder.ts:146`) uses `DEFAULT_ROLES`. This is precisely the "Backward-compatibility aliases (re-exporting an old name from a new location)" pattern forbidden by constitution §III.A. The doctrine fix is to **delete the alias** and the corresponding line in both barrels (`src/index.ts:65`, `src/config/index.ts:44`). External consumers, if any, get a 2.0.0-pre.1 breaking-change note — consistent with the No-BC release strategy. This item couples with spec 017 (W1.5 cleanup) more than the other Phase-A drift items; the maintainer may prefer to roll it into the 2.0.0-pre.1 release rather than Phase-A.

The doctrine note in `technical-debt-analysis.md` is the key context: the `no-suppressions` doctrine forbids `// eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `@deprecated`-as-shim, and BC aliases. **Traditional placeholder/TODO smells are deliberately absent by policy** — the codebase "deletes don't defers." That means most worktree-visible debt is doctrinal drift (this spec) and pre-1.0 completion (specs 017, 019, 020), not the usual code-quality issues. The remediation surface is small but high-leverage: outside contributors form their first impression from `AGENTS.md` / `README.md` / `docs/MCP-SETUP.md`, and stale docs erode trust faster than the underlying bugs would.

## User Stories

- As a **contributor** integrating the architect-cli into a subprocess, I want `AGENTS.md` to accurately describe the `cwd()` / `INIT_CWD` / `PWD` precedence, so I don't strip env vars that would have been ignored anyway.
- As an **AI-augmented developer** evaluating MCP integration, I want a single tool count quoted consistently across `CLAUDE.md`, `docs/MCP-SETUP.md`, and the meta-package `description`, so I don't lose three tools in mental model mismatch.
- As an **AI coding agent** writing edge-filter logic, I want all seven relation kinds (`depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`) enumerated in `CLAUDE.md` / `AGENTS.md`, so I don't silently miss edges in projection-layer queries.
- As an **architect maintainer**, I want `REMAINING-WORK.md` and `AGENTS.md` §"Operational notes" to agree about the PWD/cwd resolution, so the maintainer's backlog stops accumulating already-resolved items.
- As a **first-time reader** of the repo, I want the doctrine claims in `AGENTS.md` to match the code on first inspection, so the "platform that holds together" promise is verifiable rather than aspirational.

## Acceptance Criteria

- [ ] `AGENTS.md` §"Operational notes" updated to describe actual precedence: `process.cwd()` first, then `INIT_CWD`, then `PWD` — only on `process.cwd()` failure.
- [ ] Obsolete "strip `PWD`/`INIT_CWD`" guidance removed from `AGENTS.md`.
- [ ] `packages/architect/package.json` `description` field updated to reference **21** MCP tools (matches registry).
- [ ] `docs/MCP-SETUP.md:88-106` regenerated or rewritten to enumerate all **21** tools from `ARCHITECT_MCP_TOOLS` in `tool-metadata.ts`.
- [ ] `CLAUDE.md` / `AGENTS.md` §"Pattern graph" updated to enumerate all seven relation kinds, OR to make explicit that "four edges" is the high-level model and the seven kinds are the projection-level enum.
- [ ] `REMAINING-WORK.md` `[NEEDS REVISITING]` reference for the PWD/cwd item retired once the AGENTS.md patch lands (closes tech-debt #6 as side-effect of #1).
- [ ] All four changes ship in a single PR (per `Phase A`).
- [ ] PR description references tech-debt items #1, #2, #3, #6, #12 explicitly.
- [ ] Total work tracked at ≈1–2 hours (per Phase A estimate).
- [ ] Updated docs regenerated wherever the projection pipeline owns them (so the fix sticks past the next `pnpm docs:all`).
- [ ] No new doctrine claims introduced — this is a drift-correction PR, not a doctrine-evolution PR.
- [ ] No code changes in `packages/*/src/` for items #1–#4 (changes are docs and `package.json` description only).
- [ ] Item #5 (`DDD_ES_CQRS_ROLES` dead alias): delete the export at `packages/architect-core/src/config/role-constants.ts:68` and the corresponding barrel re-exports in `src/index.ts` and `src/config/index.ts`. **May be deferred to spec 017 (`2.0.0-pre.1` cut)** if the maintainer prefers to batch breaking changes — flag this decision in the PR description.
- [ ] Grep verification: after item #5 lands, `rg "DDD_ES_CQRS_ROLES" packages/` returns zero matches in `src/` and `dist/`.

## Technical Requirements

- **Files touched**:
  - `AGENTS.md` (operational notes + pattern-graph framing).
  - `CLAUDE.md` — symlinked to `AGENTS.md`; single edit propagates.
  - `packages/architect/package.json` (description field).
  - `docs/MCP-SETUP.md:88-106` (or regenerate from `ARCHITECT_MCP_TOOLS`).
  - `REMAINING-WORK.md` (retire the PWD revisiting note).
- **Reference sources** (the canonical surfaces these docs must match):
  - `packages/architect-cli/src/cli/runtime-helpers.ts:36-56` — cwd precedence.
  - `packages/architect-mcp/src/runtime-helpers.ts:16-36` — cwd precedence in the MCP variant.
  - `packages/architect-mcp/src/tool-metadata.ts:1-71` — `ARCHITECT_MCP_TOOLS` (21 tools).
  - `packages/architect-projection/src/fragments/pattern-relations/supporting.ts:66-74` — seven relation kinds.
- **Tooling**:
  - Prettier (run `pnpm format` after edits).
  - `pnpm docs:all` if any docs are generated from source rather than hand-edited; verify byte-identical reproducibility after.
  - No changesets entry required — this is documentation-only, no public package surface changes.
- **Invariants preserved**:
  - All six doctrine claims in `AGENTS.md` remain enforceable (no claim is removed in service of papering over a real gap).
  - The "seven relation kinds" framing remains consistent with ADR-007 (Coordinated Taxonomy Redesign).
  - The MCP tool registry remains the single source of truth — docs project from it.
- **Acceptance gate**: `pnpm format:check`, `pnpm validate:all`, and visual review against the cited source files.

## Implementation Status

**Completed:**
- ✅ Runtime cwd precedence correctly implemented (`process.cwd()` first) in both `architect-cli` and `architect-mcp`.
- ✅ MCP tool registry contains the correct 21 tools (`ARCHITECT_MCP_TOOLS` in `tool-metadata.ts:1-71`).
- ✅ All seven projection-layer relation kinds are implemented (`supporting.ts:66-74`).
- ✅ `CLAUDE.md` correctly states 21 MCP tools.
- ✅ The drift items are tracked in `technical-debt-analysis.md` (items #1, #2, #3, #6, #12).
- ✅ Phase A estimate published (≈1–2 hours, single PR).

**Missing / Drift:**
- ⚠️ `AGENTS.md` §"Operational notes" claims PWD-first precedence (tech-debt #1) — fix pending.
- ⚠️ `packages/architect/package.json` `description` says 18 tools (tech-debt #2) — fix pending.
- ⚠️ `docs/MCP-SETUP.md:88-106` lists 18 tools (tech-debt #12) — fix pending; same root cause as #2 but separate file.
- ⚠️ `CLAUDE.md` / `AGENTS.md` "four edges" framing incomplete (tech-debt #3) — needs enumeration of all seven kinds or explicit two-layer framing.
- ⚠️ `REMAINING-WORK.md` PWD revisiting note still present (tech-debt #6) — retires once #1 lands.

## Dependencies

- `005-cli-surface` — owns the `architect-cli` runtime whose cwd precedence the doctrine must match.
- `006-mcp-server` — owns `ARCHITECT_MCP_TOOLS` (the 21-tool registry) and the MCP-side cwd precedence.
- `004-fragment-projection-pipeline` — owns the seven relation kinds whose enumeration the doctrine must match.
- External tooling: Prettier (`pnpm format`), `pnpm docs:all` for regenerated surfaces.

## Related Specifications

- `architect/decisions/ADR-007` — Coordinated Taxonomy Redesign (the seven relation kinds derive from this ADR).
- `architect/decisions/ADR-006` — Single Read Model (the MCP tool registry is the single source of truth; docs project from it).
- `technical-debt-analysis.md` items #1, #2, #3, #6, #12 — **all Quick Win quadrant**.
- `technical-debt-analysis.md` §"Suggested Migration Phases" / **Phase A** — single PR, ≈1–2 hours total.
- `technical-debt-analysis.md` §"Dependency ordering" — #1 → #6 (AGENTS.md doctrine patch retires the REMAINING-WORK note); #2 → #12 (CLAUDE.md is correct; MCP-SETUP.md regenerated alongside the package-description fix).
- `AGENTS.md` §"Operational notes" and §"Pattern graph" — the two sections needing edits.
- `functional-specification.md` §"Cross-references" — confirms `integration-points.md` as the canonical MCP surface reference.
