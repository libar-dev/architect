# Implementation Plan: MCP Server (Tool-Count Drift Resolution)

## Goal

Resolve the two MCP-tool-count documentation-drift items (tech-debt #2 + #12) by updating the meta-package `description` string and the `docs/MCP-SETUP.md` tool list to enumerate the **21 tools** that the `ARCHITECT_MCP_TOOLS` registry actually ships — bringing the docs into agreement with `CLAUDE.md` / `AGENTS.md` and the canonical registry.

## Current State

### What exists today

- `ARCHITECT_MCP_TOOLS` registry in `packages/architect-mcp/src/tool-metadata.ts:1-71` ships **21 tools**, each with `z.strictObject(...).readonly()` input schemas per ADR-009.
- `CLAUDE.md` (symlink to `AGENTS.md`) §"Package family" correctly cites 21 tools — no edit needed on this file for this plan.
- The MCP server (`packages/architect-mcp/src/cli/mcp-server.ts`) registers exactly the registry's tool set; transport is stdio-only, no network surface.
- `--watch` mode debounces filesystem changes at 500 ms and rebuilds the in-memory `PatternGraph`; `architect_rebuild` is exposed as a manual trigger.
- `docs/MCP-SETUP.md` wiring section (the `mcpServers` config snippet) is correct — the *wiring* docs work; only the *tool list* enumeration is stale.

### What is drifted (the gap closed by this plan)

- `packages/architect/package.json` meta-package `description` field currently advertises "18 tools" (tech-debt #2). The meta package has no JS exports — just bin re-exports — but the description field is the first signal consumers see on npm.
- `docs/MCP-SETUP.md:88-106` enumerates **18 tools**, missing three that ship in the registry (tech-debt #12).
- Possible secondary references in `CHANGELOG.md`, `README.md`, or release notes still quoting "18 tools" — to be located by grep during execution.

### What is correct already (don't touch)

- The registry itself (`tool-metadata.ts:1-71`) is the source of truth and is correct.
- The MCP `instructions` string in `tool-metadata.ts:85-86` — describes the agent-recommended call order.
- The schema discipline (`z.strictObject(...).readonly()` per ADR-009) and the input-validation boundary.

## Target State

After this plan lands:

- The `packages/architect/package.json` `description` quotes the correct tool count (21).
- `docs/MCP-SETUP.md:88-106` enumerates **all 21 tools** with names, one-line summaries, and an explicit "generated from `tool-metadata.ts` — re-run `<command>` to refresh" header so the section's drift risk is structurally bounded going forward.
- A grep against the repo for `18 tools`, `eighteen tools`, `18 MCP tools` returns zero hits.
- The MCP server behavior is unchanged — this plan ships docs-only deltas.
- Spec 006's last two acceptance criteria (currently `[ ]`) flip to `[x]`.

## Technical Approach

1. **Enumerate the canonical tool set.** Read `packages/architect-mcp/src/tool-metadata.ts:1-71`, extract each `name` field. Cross-check against any test fixtures that assert tool-count parity. Produce a numbered list with `name` + one-line `description` for each of the 21 tools — this is the projection that both edits target.

2. **Patch the meta-package description.** Edit `packages/architect/package.json`'s `description` field. Use precise prose ("MCP server with 21 tools spanning the dogfood CLI parity surface") rather than just a raw number — descriptions that name what the tools do age better than ones that just count them.

3. **Patch `docs/MCP-SETUP.md`.** Rewrite lines 88-106 with the 21-tool enumeration. Add a comment at the top of the section pointing to `tool-metadata.ts` as the source of truth, plus an instruction for regenerating the section when the registry changes.

4. **Sweep for stale references.** `rg -F "18 tool" -F "18 MCP" -F "eighteen"` across `*.md`, `CHANGELOG*`, `README*`. Patch each hit consistently. Special attention to `REMAINING-WORK.md` and any release notes.

5. **Verify locally.** Run `pnpm format` then `pnpm format:check` to confirm Prettier compliance. Run `pnpm docs:all` if applicable — confirm the regenerated `docs-live/` does not re-introduce stale numbers via a generator that pulled from a stale string constant.

6. **Coordinate with plan 021 (doctrine-doc-drift-fixes).** This plan and `021-doctrine-doc-drift-fixes` overlap by design on the tool-count fix. The recommended outcome is **a single PR landing both plans together** — see `Dependencies / Coordination` below. If shipped separately, plan 021 must explicitly mark items #2 and #12 as "owned by plan 006".

## Tasks

- [ ] Read `packages/architect-mcp/src/tool-metadata.ts:1-71` and extract the 21 tool entries (`name` + first-line `description`).
- [ ] Update `packages/architect/package.json` `description` field — replace "18" with "21"; reword to "MCP server with 21 tools…" (or equivalent).
- [ ] Rewrite `docs/MCP-SETUP.md:88-106` with the 21-tool enumeration; preserve the surrounding wiring sections unchanged.
- [ ] Add a header comment to the rewritten `docs/MCP-SETUP.md` tool-list section: "Source of truth: `packages/architect-mcp/src/tool-metadata.ts`. Re-run `pnpm docs:all` to refresh."
- [ ] `rg -F "18 tool"` across the repo; patch each hit consistently.
- [ ] `rg -F "18 MCP"` across the repo; patch each hit.
- [ ] `rg -F "eighteen"` across `*.md`; patch any tool-count references.
- [ ] Run `pnpm format` to apply Prettier; commit only the formatting hunks tied to this PR's files.
- [ ] Run `pnpm format:check` — must pass.
- [ ] Run `pnpm docs:all` if `docs/MCP-SETUP.md` is in the generator set; confirm reproducibility.
- [ ] Eyeball-verify `pnpm exec architect-mcp --help` shows no regression.
- [ ] Update spec `006-mcp-server/spec.md` acceptance criteria — flip the two `[ ]` items to `[x]`.

## Risks & Mitigations

- **Risk**: Bundling with plan 021 results in a PR larger than the ≈1-2 hour Phase A estimate.
  - **Mitigation**: Plan 021 is itself Phase A; combined Phase A is still ≈1-2 hours. If the combined PR balloons, split along the natural seam: tool-count fixes in this PR, AGENTS.md and PWD/edges fixes in plan 021's PR.
- **Risk**: `docs/MCP-SETUP.md` is partially generated by `pnpm docs:all` and edits get overwritten on the next regeneration.
  - **Mitigation**: Inspect `architect-generate` config and `DEFAULT_GENERATORS` to confirm whether MCP-SETUP is generator-owned. If yes, edit the generator's template; if no, edit the file directly and document the boundary.
- **Risk**: A stale "18 tools" reference is missed and reappears in the next release.
  - **Mitigation**: Use `rg -F` for fixed-string matches; include `--type-add 'md:*.md'` and run against `CHANGELOG`, `README`, and `REMAINING-WORK.md` explicitly.
- **Risk**: The meta-package `description` is consumed in npm-registry listings or downstream documentation generators; mismatched updates create new drift.
  - **Mitigation**: After edit, search for any docs or workflow that reads `pkg.description` and rebuild affected artifacts in the same PR.

## Testing Strategy

- **Unit tests**: not applicable — this plan ships docs-only deltas.
- **Integration tests**: not applicable for the same reason.
- **Conformance check**: a one-shot script (can be inline shell) that asserts the count of registered tools in `ARCHITECT_MCP_TOOLS` equals the count of bullet entries in `docs/MCP-SETUP.md:88-106`. Consider promoting this to a permanent test in `packages/architect-mcp/tests/features/` keyed to the registry — that would close the drift door permanently.
- **Executable Gherkin**: existing MCP scenarios under `packages/architect-mcp/tests/features/` continue to pass with no change.
- **Smoke**: `pnpm exec architect-mcp --help` still lists the expected verb surface.

## Success Criteria

- All acceptance criteria in `006-mcp-server/spec.md` move to `[x]`.
- `rg -F "18 tool"` returns zero hits across the repo.
- `pnpm format:check` passes.
- `pnpm validate:all` passes (no DoD or anti-pattern regressions).
- `pnpm test` passes (no test was tied to the stale numbers).
- Constitution §III gates pass: typecheck, test, validate:all, guard, format:check, guard:no-suppressions, perf gate (unaffected — docs-only).
- If a conformance-check test is added (recommended), it asserts registry-to-docs parity going forward.

## Dependencies / Coordination

- **Plan 021** (`021-doctrine-doc-drift-fixes`) bundles tech-debt items #1, #2, #3, #6, #12 into a single ≈1-2 hour PR. This plan (006) overlaps with plan 021 on items #2 and #12. Recommended ship mode: **single combined PR**. If kept separate, plan 021 must reference this plan and the tool-count tasks must be marked complete on the plan that lands first.
- **Spec 005** (`005-cli-surface`) — owns the CLI parity verbs the MCP tools mirror; no edits expected here but verify the CLI verb count quoted in `AGENTS.md` matches reality (covered by plan 021).
- **No code dependencies** — this is documentation only. Constitution §III.A (No-BC) is unaffected.
