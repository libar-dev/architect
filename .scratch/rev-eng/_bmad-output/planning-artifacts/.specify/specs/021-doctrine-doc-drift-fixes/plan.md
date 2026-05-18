# Implementation Plan: Doctrine + Documentation Drift Fixes (Phase A Bundle)

## Goal

Land Phase A as a single ≈1-2 hour PR closing tech-debt items #1, #2, #3, #6, and #12 — patching `AGENTS.md`, `packages/architect/package.json`, `docs/MCP-SETUP.md`, and `REMAINING-WORK.md` so the doctrine and documentation match the runtime that already behaves correctly.

## Current State

### What is correct already (the code)

- `process.cwd()` is tried first in both `architect-cli` and `architect-mcp` (`packages/architect-cli/src/cli/runtime-helpers.ts:36-56` and `packages/architect-mcp/src/runtime-helpers.ts:16-36`). `INIT_CWD` and `PWD` are fallbacks on failure only.
- `ARCHITECT_MCP_TOOLS` registry in `packages/architect-mcp/src/tool-metadata.ts:1-71` ships **21 tools**.
- The projection layer ships **seven** relation kinds in `packages/architect-projection/src/fragments/pattern-relations/supporting.ts:66-74`: `depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`.
- `CLAUDE.md` (= `AGENTS.md` via symlink) correctly cites 21 MCP tools.

### What is drifted (the docs)

1. **`AGENTS.md` §"Operational notes" (tech-debt #1, High Impact / Low Effort / Quick Win):** claims `process.env.PWD` is checked **before** `process.cwd()` and instructs subprocess embedders to strip `PWD` and `INIT_CWD`. The runtime does the opposite. Consumers following the doctrine strip env vars that would have been ignored regardless.
2. **`packages/architect/package.json` `description` field (tech-debt #2, Medium Impact / Low Effort / Quick Win):** says "18 tools". Should say 21.
3. **`CLAUDE.md` / `AGENTS.md` §"Pattern graph" (tech-debt #3, Medium Impact / Low Effort / Quick Win):** frames the model with four edge kinds. Misses `enables`, `extends`, `api-ref` — three of the seven projection-layer relation kinds.
4. **`REMAINING-WORK.md` PWD revisiting note (tech-debt #6, Low Impact / Low Effort, couples with #1):** the note in `REMAINING-WORK.md` is still flagged as `[NEEDS REVISITING]` even though the runtime patch landed.
5. **`docs/MCP-SETUP.md:88-106` (tech-debt #12, Medium Impact / Low Effort / Quick Win):** enumerates 18 tools; same root cause as #2, different file.

### Doctrine context

The `no-suppressions` doctrine (constitution §III.A and AGENTS.md §No-BC) forbids `// eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `@deprecated`-as-shim, and BC aliases. Traditional placeholder/TODO smells are deliberately absent — the codebase "deletes don't defers." That means most worktree-visible debt is exactly this doctrinal-drift category (this plan) and pre-1.0 completion (plans 017, 019, 020), not the usual code-quality issues. Outside contributors form their first impression from `AGENTS.md` / `README.md` / `docs/MCP-SETUP.md`; stale docs erode trust faster than the underlying bugs would.

## Target State

After this plan lands:

- `AGENTS.md` §"Operational notes" describes the actual cwd precedence: `process.cwd()` first, then `INIT_CWD`, then `PWD` (fallbacks on failure).
- The obsolete "strip `PWD`/`INIT_CWD`" guidance is removed.
- `packages/architect/package.json` `description` quotes 21 tools (or names what they do).
- `docs/MCP-SETUP.md:88-106` enumerates all 21 tools, anchored to the registry as source of truth.
- `CLAUDE.md` / `AGENTS.md` §"Pattern graph" either enumerates all seven relation kinds or explicitly marks "four edges" as the high-level model with seven projection-level kinds underneath.
- `REMAINING-WORK.md` PWD/cwd revisiting note is retired — replaced with "graduated — see AGENTS.md §Operational notes" or deleted.
- `grep -F "18 tool"` and `grep -F "four edges"` (in the misleading sense) return zero hits.
- All five items ship in a single PR (per `Phase A`).

## Technical Approach

1. **Read the canonical source files.** Open and confirm:
   - `packages/architect-cli/src/cli/runtime-helpers.ts:36-56` (cwd precedence).
   - `packages/architect-mcp/src/runtime-helpers.ts:16-36` (cwd precedence — MCP variant).
   - `packages/architect-mcp/src/tool-metadata.ts:1-71` (the 21 tools).
   - `packages/architect-projection/src/fragments/pattern-relations/supporting.ts:66-74` (the seven relation kinds).

2. **Patch `AGENTS.md` §"Operational notes"** with corrected cwd precedence text. New text: "The `architect-cli` and `architect-mcp` resolve their working directory via `process.cwd()` first. If that throws, they fall back to `INIT_CWD`, then `PWD`. Subprocess embedders do not need to strip these env vars — they are only consulted on `process.cwd()` failure." Remove the contradicting paragraph entirely.

3. **Patch `packages/architect/package.json` `description`.** Replace "18 tools" with "21 tools" (or, better, "21 MCP tools spanning the dogfood CLI parity surface" — more durable wording).

4. **Patch `docs/MCP-SETUP.md:88-106`.** Rewrite with the 21-tool enumeration extracted from `tool-metadata.ts`. Add a header comment: "Source of truth: `packages/architect-mcp/src/tool-metadata.ts`. Regenerate with `pnpm docs:all` if owned by a generator." (Note: this overlaps with plan 006 — see Coordination.)

5. **Patch `CLAUDE.md` / `AGENTS.md` §"Pattern graph".** Two options:
   - **(a) Enumerate all seven.** "The projection layer ships seven relation kinds: `depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`."
   - **(b) Two-layer framing.** "The Pattern model has four primary edge kinds (`depends-on`, `uses`, `implements`, `see-also`); the projection layer additionally surfaces `enables`, `extends`, and `api-ref` for query-time precision."
   - **Recommendation**: option (b) is more truthful (the four-edge mental model is real in the docs) and preserves the existing reader's mental model while closing the gap. Pick the option per maintainer preference; this plan supports either.

6. **Retire `REMAINING-WORK.md` PWD revisiting note.** Find the `[NEEDS REVISITING]` block, replace with "graduated — fix landed; AGENTS.md §Operational notes corrected in <PR-link>". Or delete entirely if the maintainer's preference is to keep the file short.

7. **Sweep for collateral references.** `rg -F "18 tool"`, `rg -F "PWD before"`, `rg -F "strip PWD"`, `rg -F "four edges"` (in the misleading sense). Patch each hit consistently.

8. **Run `pnpm format` + `pnpm format:check`** to apply Prettier. Then `pnpm validate:all` to confirm no anti-pattern regressions.

9. **Optional: regenerate docs.** If any of the touched files is owned by `pnpm docs:all`'s generator set, run `pnpm docs:all` and verify reproducibility (byte-identical re-run).

10. **Open the PR with explicit tech-debt references.** PR description: "Closes Phase A per `technical-debt-analysis.md`: items #1, #2, #3, #6, #12. Combined ≈1-2 hour estimate." Reviewer reads the PR description, opens each tech-debt item, sees direct mapping.

## Tasks

- [ ] Open `packages/architect-cli/src/cli/runtime-helpers.ts:36-56` and confirm cwd precedence.
- [ ] Open `packages/architect-mcp/src/runtime-helpers.ts:16-36` and confirm cwd precedence (MCP variant).
- [ ] Open `packages/architect-mcp/src/tool-metadata.ts:1-71` and extract the 21 tool names + descriptions.
- [ ] Open `packages/architect-projection/src/fragments/pattern-relations/supporting.ts:66-74` and confirm the seven relation kinds.
- [ ] Patch `AGENTS.md` §"Operational notes" — correct cwd precedence wording; remove the obsolete strip guidance.
- [ ] Patch `packages/architect/package.json` `description` field — 21 tools.
- [ ] Rewrite `docs/MCP-SETUP.md:88-106` with the 21-tool enumeration (coordinate with plan 006 — single PR preferred).
- [ ] Patch `CLAUDE.md` / `AGENTS.md` §"Pattern graph" with seven-kind enumeration or two-layer framing (per maintainer preference).
- [ ] Retire `REMAINING-WORK.md` PWD revisiting note.
- [ ] `rg -F "18 tool"`, `rg -F "PWD before"`, `rg -F "strip PWD"`, `rg -F "four edges"` — patch each hit consistently.
- [ ] Run `pnpm format` to apply Prettier.
- [ ] Run `pnpm format:check` — must pass.
- [ ] Run `pnpm validate:all` — must pass (DoD + anti-pattern detection).
- [ ] If `docs/MCP-SETUP.md` is generator-owned, run `pnpm docs:all` and confirm reproducibility.
- [ ] Open PR with explicit references to tech-debt items #1, #2, #3, #6, #12.
- [ ] Update `021-doctrine-doc-drift-fixes/spec.md` — flip all `[ ]` acceptance criteria to `[x]`.

## Risks & Mitigations

- **Risk**: A stale "PWD before cwd" reference is missed and reappears in the next regeneration.
  - **Mitigation**: `rg -F` for fixed-string matches against the broader doctrinal phrasing; include `REMAINING-WORK.md` explicitly. Add a short regression-safeguard test if practical: a conformance script that asserts cwd precedence wording in `AGENTS.md` matches the source-of-truth file.
- **Risk**: The "four edges" framing is intentional — a deliberate simplification — and the patch over-corrects toward `verbosity`.
  - **Mitigation**: Use option (b) from step 5 (two-layer framing). It preserves the simpler mental model and closes the gap without bloating doctrine prose.
- **Risk**: This plan overlaps with plan 006 on items #2 and #12; shipping separately would cause merge conflicts on `docs/MCP-SETUP.md` and `packages/architect/package.json`.
  - **Mitigation**: **Ship as a single combined PR with plan 006.** Plan 006 explicitly acknowledges this overlap. If split, ensure the second-to-land PR's diff is rebased clean.
- **Risk**: The PR description does not adequately link back to tech-debt items; reviewer cannot tell which deltas close which items.
  - **Mitigation**: Use a checklist in the PR description mapping each commit hunk to a tech-debt item number. Treat the description itself as part of the artifact.
- **Risk**: A docs change accidentally erodes a load-bearing doctrine claim (e.g., implies the No-BC doctrine is advisory).
  - **Mitigation**: This plan is drift-correction only — no doctrine claim is removed. Every patch maps to a specific tech-debt item; off-scope changes are rejected during self-review.

## Testing Strategy

- **Unit tests**: not applicable — this plan ships docs-only deltas (plus a single `package.json` description string).
- **Integration tests**: not applicable.
- **Conformance check**: optionally add a tiny script that asserts the cwd precedence text in `AGENTS.md` matches the actual code path in `runtime-helpers.ts`. Same for the 21-tool count in the MCP-SETUP doc.
- **Regression**: `pnpm docs:all` regeneration is byte-identical post-patch (if the touched files are generator-owned).
- **Executable Gherkin**: existing scenarios under `tests/features/` continue to pass — unaffected.
- **Smoke**: a fresh `git clone` + `pnpm install` + `pnpm exec architect overview` works against the dogfood workspace.

## Success Criteria

- All acceptance criteria in `021-doctrine-doc-drift-fixes/spec.md` reach `[x]`.
- A single PR closes tech-debt items #1, #2, #3, #6, #12.
- `grep -F "18 tool"` returns zero hits across the repo.
- `grep -F "PWD before"` returns zero hits (in the misleading sense).
- `grep -F "four edges"` either returns zero hits or only hits in the explicit two-layer framing context.
- `pnpm format:check` passes.
- `pnpm validate:all` passes.
- `pnpm docs:all` regenerates byte-identical output (if applicable).
- Constitution §III gates pass; no `packages/*/src/` code changes (this is docs + one `package.json` string only).
- The PR description references each tech-debt item explicitly so the reviewer can verify mapping.

## Dependencies / Coordination

- **Plan 006** (`006-mcp-server`) — overlaps on items #2 and #12 (MCP tool-count drift). **Recommended ship mode: single combined PR.** If split, the second-to-land PR is rebased cleanly and the merged plan-006 references this plan in its history.
- **Spec 004** (`004-fragment-projection-pipeline`) — owns the seven relation kinds; no edits expected here.
- **Spec 005** (`005-cli-surface`) and **Spec 006** (`006-mcp-server`) — own the cwd precedence in their respective runtime helpers; no code edits expected.
- **No other plan dependencies.** This is the cheapest of the five plans (≈1-2 hours combined per `technical-debt-analysis.md` Phase A) and can land first or last in the Phase A cycle.
- **Constitution authority**: no constitution change. This plan does not amend any doctrine — it brings the docs into agreement with doctrine already in place.
- **External**: Prettier (`pnpm format`), `rg` (ripgrep) for collateral sweeps.
