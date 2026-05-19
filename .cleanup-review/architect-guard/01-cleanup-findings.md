# architect-guard — Phase 1 Consolidated Findings

Three parallel reviews complete. Detailed per-agent reports:

- Code quality: [`01a-code-quality.md`](./01a-code-quality.md) — 18 findings (3 Critical, 5 High, 8 Medium, 5 Low)
- Architecture:  [`01b-architecture.md`](./01b-architecture.md) — 14 findings (0 Critical, 4 High, 6 Medium, 5 Low including 1 positive verification)
- Simplification: [`01c-simplification.md`](./01c-simplification.md) — 25 opportunities (6 High, 11 Medium, 8 Low) + 7 themes

## What the package gets right (verification baseline)

Several load-bearing invariants verified by the architecture agent — these bound how bad the rest of the findings can be:

- **ADR-003** single-definition / many-to-one `@architect-implements` rules: respected.
- **ADR-006** carve-out discipline: no direct `architect-core/src/scanner/` or `src/extractor/` imports outside the named stage-1 files. Only one gap (M2-arch — see RC-GUARD-5 below).
- **ADR-007** type boundary: `ProcessStatusValue` (4 values), `ProcessGuardRule` (6 values), `candidate` excluded from FSM — all preserved. No phantom rule IDs.
- **Decider purity** confirmed — the FSM decision function is a pure function of inputs.
- **Dangling-baseline mechanization** verified wired into `.github/workflows/ci.yml:31` and `publish.yml:36`.
- **Git helpers** (`execGitSafe`, `sanitizeBranchName`, NUL-delimited `parseGitNameStatus`) pass the shell-injection bar — the surface area is well-designed.

The findings concentrate in three architecturally narrow surfaces — the **FSM change-detection perimeter** (heuristic where it should be deterministic), **silent-failure hygiene** (bare `catch {}` echoing core's silent-drop cluster), and **layering inversions** (a 938-LOC CLI file doing business logic, a 1000-line in-code allowlist where a JSON baseline already exists).

## Cross-cutting themes

These are not yet root causes — they are pattern clusters that the next layer (02-final-report.md) traces back to ~8 root causes, some of which echo across packages.

### T-GUARD-1 — Decider is pure; perimeter is heuristic

The architecture agent verified the decider is a pure function (good — matches ADR-007 spec). But its inputs come from heuristic detection layers. Hunk-boundary state reset (C2), the unlock-reason validator downgrading from BLOCKED to WARN (C1), `--file` mode misreporting unchanged files (H2), and the missing exhaustiveness binding between `ProcessGuardRule` and handlers (H4) all live at the perimeter. The deterministic centre is surrounded by heuristics that can lie to it.

### T-GUARD-2 — Silent failures echo core's silent-drop cluster

Bare `catch {}` in `detectRemovedTags` (quality H1), three more in scanner-read paths (quality M5), silent session-file skip (quality L1), missing-base-ref errors indistinguishable from validation failures (quality H3). Same shape as RC-CORE-1 — the package needs a guard-side diagnostic discipline.

### T-GUARD-3 — `TagRegistry` plumbing is incomplete

`LintProcessCLI` drops the configured `TagRegistry` before invoking the decider (quality C3). Custom-prefix consumers get misleading error messages. This is the architect-config integration point for downstream consumers (Studio etc.), and it's leaking.

### T-GUARD-4 — `tier-a-baseline.ts` should be a JSON baseline like `dangling-baseline.ts`

Architecture H4: the package already implements the right pattern (JSON file, `--baseline` flag, CI-wired) for one allowlist. The other allowlist is a 1000-LOC in-code allowlist (quality L2 — 1132 LOC) that accumulates stale entries (quality M1). Two implementations of the same concept; one is principled, the other is the legacy form.

### T-GUARD-5 — `cli/validate-patterns.ts` is the wrong layer (938 LOC of business logic)

Architecture M1 + M2: the CLI file holds business logic (938 LOC) AND triggers a workspace re-scan to feed the anti-pattern detector (the second-scan gap — ADR-006 stage-1 carve-out not on the named list). CLI should be a thin composition root; the logic belongs in `lint/` or `validation/`.

### T-GUARD-6 — Public-barrel hygiene echoes core's RC-CORE-4

Architecture H1+H2+M3: wildcard `export *`; the lint engine is published through three doors; no `.internal.ts` convention enforced. Same root pattern as `architect-core`'s alias proliferation — convention without a CI gate.

### T-GUARD-7 — Step-linter regex/heuristic robustness

Quality H5 + M4 + M6 + M7: `stripQuotedContent` is escape-unaware (false positives); `isInSessionScope` substring matches over-match; cross-checks accept comment-only mentions of `And`/`Rule`; idea-tier detector stops at `Feature:` line. These are all heuristics that should be Gherkin-AST-aware. The package has `@cucumber/gherkin` available transitively but uses regex on raw text.

### T-GUARD-8 — Boilerplate + simplification echoes (cross-package)

Simplification themes from this agent rhyme with both core and projection:

- Severity-tally duplication across runners (H — package-local, fixable here).
- `noUncheckedIndexedAccess` defensive-guard pattern (M8) — cross-package echo of T-CORE-10 / RC-CORE-7.
- `pass | warn | blocked` vocabulary mismatch between decider and scope-validate (M11) — a typed boundary not enforced; symptom of the broader "convention without mechanism" theme.
- ~80-line error-guide manual in `decider.ts` JSDoc (L4) belongs in `docs-sources/`.
- `createViolation` cast contradicts no-BC doctrine (H — same root as core's `'codec' + 'Options'` shim).
- Duplicated `discoverFiles` / `readFileSafe` (H) — echoes projection's helper-duplication theme.
