# Cleanup Review — `@libar-dev/architect-guard`

## Review Target

`packages/architect-guard/src/**` — 38 TS files, ~9.1k LOC. Policy, FSM
enforcement, anti-pattern detection, DoD validation, git helpers for
`--staged` mode. Detailed agent reports:
[`01a-code-quality.md`](./01a-code-quality.md) · [`01b-architecture.md`](./01b-architecture.md) · [`01c-simplification.md`](./01c-simplification.md) · [`01-cleanup-findings.md`](./01-cleanup-findings.md).

## Executive summary

The 57 findings across the three agents reduce to **eight structural root
causes**, three of which are cross-package echoes of root causes already named
in `architect-core` and `architect-projection`. Action plan is organised by
root cause; fixing each collapses 3–10 findings.

Headline: the FSM **decider is pure** (ADR-007 invariant verified); the
**perimeter that feeds it is heuristic**. Three Criticals all sit at that
perimeter — unlock-reason validation is downgraded to a warning, hunk-boundary
state detection resets in the middle of a diff, and `TagRegistry`
configuration is dropped before the decider runs. None of the three is
expensive to fix individually, but together they erode the FSM contract.

A second cluster: the package has the right mechanism (`dangling-baseline.ts`
with JSON baseline + CI gate) implemented once and bypassed once
(`tier-a-baseline.ts` as a 1000-LOC in-code allowlist). Unifying them is the
single highest-leverage architectural refactor.

Raw counts: **3 Critical · 9 High · 14 Medium · 9 Low** (quality + arch) +
**6 High · 11 Medium · 8 Low** simplification opportunities (1 architecture
"Low" is a positive verification, not a defect).

---

## What the package gets right (front-load before findings)

Independent positives confirmed by the architecture agent — they bound the scope of the criticisms below:

- **ADR-003** single-definition / many-to-one `@architect-implements` rules: respected.
- **ADR-006** stage-1 carve-out: only one gap (RC-GUARD-5 below); the named exceptions are correctly limited.
- **ADR-007** type boundary: `ProcessStatusValue` (4 values), `ProcessGuardRule` (6 values), `candidate` excluded from FSM — all preserved.
- **Decider purity**: verified — pure function over typed inputs.
- **Dangling-baseline mechanization**: verified end-to-end in CI.
- **Git helpers**: shell-injection-safe (`execGitSafe`, `sanitizeBranchName`, NUL-delimited parsing).

The package is structurally sound; the criticisms are about perimeter discipline and one large legacy file.

---

## Root causes (the synthesis)

### RC-GUARD-1 — FSM perimeter is heuristic where it should be deterministic

**Pattern.** The decider is provably pure (good — matches ADR-007 design). The detection layers that feed it are heuristic and lossy, which means the deterministic centre is surrounded by inputs that can lie to it.

**Findings this explains.**
- C1 (quality) — `@architect-unlock-reason` rule is **effectively unenforced**. Doctrine says ≥10-char + placeholder check at BLOCKED severity; current code uses layered substring matching with a ≥0-char path that downgrades the doctrine-mandated checks to WARN. The unlock-reason gate is the FSM's only escape valve for terminal-state edits; if it warns instead of blocks, the gate is open.
- C2 (quality) — Docstring-aware status detection resets at every diff hunk boundary in `detect-changes.ts`. Phantom transitions appear, real transitions are missed.
- H2 (quality) — `--file` mode reports unchanged files as modified → spurious protection violations.
- H4 (quality) — `ProcessGuardRule` union is **not exhaustiveness-bound** to its handler set. Adding a rule does not force a handler update at compile time.
- M2 (quality) — Terminal-state bypass in `checkProtectionLevel` is too broad.
- M3 (quality) — New-file transition semantics conflict with FSM-edge validation.

**ADR anchor.** ADR-007's whole point is the 4-value `ProcessStatusValue` boundary with FSM-validated transitions. The boundary is honored at the decider; it leaks at the detection layer.

**Structural fix.** Three coordinated changes:
1. Restore the unlock-reason validator to BLOCKED severity with the ≥10-char + non-placeholder check (delete the substring-matching downgrade path).
2. Make hunk-boundary state-detection stateful across hunks within a single file (the docstring scope is the file, not the hunk).
3. Add `assertNever(rule)` exhaustiveness binding so `ProcessGuardRule` and its handler set are compile-time-paired. Pre-1.0; this is a `never`-typed `default` branch.

After these three, the FSM contract is recoverable from code review rather than from manual ADR cross-reference.

### RC-GUARD-2 — Silent failures echo `architect-core` RC-CORE-1

**Pattern.** Bare `catch {}` and silent-skip paths in surfaces that should produce diagnostics. Same shape as the extraction-side silent drops in core — different mechanism, same failure mode.

**Findings this explains.**
- H1 (quality) — `detectRemovedTags` re-reads scanner output with bare `catch {}`.
- M5 (quality) — three more bare `catch {}` sites.
- L1 (quality) — silent session-file skip.
- H3 (quality) — missing-base-ref git errors are indistinguishable from validation failures (no error-code discrimination).

**ADR anchor.** Engineering doctrine ("No silent drops in extraction" generalised to "no silent drops at any enforcement surface").

**Structural fix.** Same prescription as RC-CORE-1, scoped to guard:
- A guard-side diagnostic surface (typed errors flowing to the CLI exit code).
- ESLint rule scoped to `packages/architect-guard/src/**` banning bare `catch {}` and unhandled `void`.
- Discriminate git-errors (missing ref, permission, network) from validation-result errors at the boundary.

Cross-package note: if the core diagnostic bus (RC-CORE-1) is built as workspace-shared, guard reuses it instead of building a parallel.

### RC-GUARD-3 — `TagRegistry` plumbing is broken at the CLI boundary

**Pattern.** Custom prefixes (architect-config taxonomy customization) flow through to most callers but the CLI process-guard runner drops the configured registry before invoking the decider.

**Findings this explains.**
- C3 (quality) — `LintProcessCLI` drops the configured `TagRegistry`. Custom-prefix consumers (Studio etc.) get misleading error messages that name the default prefix.

**ADR anchor.** Not a direct ADR — `architect.config.ts` taxonomy customization contract.

**Structural fix.** Single-file change in `cli/lint-process.ts`: thread `TagRegistry` from the loaded config into the decider invocation. Regression test fixture: a config with a non-default prefix; assert the error message names the configured prefix.

### RC-GUARD-4 — `tier-a-baseline.ts` is a 1000-LOC legacy form of the principled `dangling-baseline.ts`

**Pattern.** The package already shipped the right pattern (`dangling-baseline.ts` — JSON baseline file, `--baseline` flag, `--write-baseline` flag, CI gate) and then duplicated the concept as a 1000-LOC in-code allowlist for tier-A violations.

**Findings this explains.**
- H4 (arch) — `tier-a-baseline.ts` ships a 1000-line in-code allowlist while a principled JSON-baseline mechanism is wired end-to-end into CI a few directories away.
- M1 (quality) — Stale baseline entries accumulate (because there is no `--write-baseline` for tier-A).
- L2 (quality) — 1132-LOC baseline keyed on full message text (brittle).

**ADR anchor.** None directly; this is "use the better tool you already built." But it is *also* a No-BC echo (RC-CORE-4) — the legacy form persists because no audit forces consolidation.

**Structural fix.** Promote `dangling-baseline.ts`'s JSON-baseline + `--baseline` / `--write-baseline` mechanism to a reusable shape (e.g. `lint/baselines/<name>.json`), migrate tier-A to use it, delete the in-code allowlist. Stale entries become git-visible diffs (good), and refresh becomes `--write-baseline` (mechanized).

### RC-GUARD-5 — `cli/validate-patterns.ts` is doing business logic, not composition (938 LOC)

**Pattern.** The CLI layer should be a thin composition root over `lint/`, `validation/`, `git/`. Instead, `validate-patterns.ts` is 938 LOC of business logic AND triggers a workspace re-scan to feed the anti-pattern detector (the second-scan is structurally a stage-1 read of scanner/extractor output by a file *not* on ADR-006's named carve-out list).

**Findings this explains.**
- M1 (arch) — 938 LOC of business logic in a CLI file.
- M2 (arch) — Implicit second-scan inside `validate-patterns.ts`; ADR-006 carve-out gap.

**ADR anchor.** ADR-006 §Rule 1 names the four stage-1 carve-outs explicitly (`lint-patterns.ts`, `AntiPatternDetector`, `CoverageAnalyzer`, `SessionStateReader`). `validate-patterns.ts` is not on the list. The fact that it currently re-scans is the symptom; the cause is that business logic moved into CLI without the corresponding carve-out approval.

**Structural fix.**
1. Extract business logic from `cli/validate-patterns.ts` into `validation/validate-patterns-runner.ts` (or split across `validation/` modules).
2. The CLI becomes a thin composition over the runner.
3. If the second-scan is genuinely needed, the carve-out list in ADR-006 gets one new entry — explicit and reviewed, not implicit. If it's not needed, route it through the PatternGraph.

### RC-GUARD-6 — Public-barrel hygiene (cross-package echo of RC-CORE-4)

**Pattern.** Wildcard `export *`, lint engine published through three doors, no `.internal.ts` convention. Same shape as `architect-core` (alias proliferation) and `architect-projection` (helper duplication + `.internal` breaches).

**Findings this explains.**
- H1 (arch) — wildcard `export *` from the barrel.
- H2 (arch) — lint engine double-published through three doors.
- M3 (arch) — no `.internal.ts` convention.

**ADR anchor.** None directly; engineering doctrine ("No-BC convention without mechanism").

**Structural fix.** Same prescription as RC-CORE-4 and RC-PROJ-7 — replace `export *` with an enumerated named-export set; introduce the `.internal.ts` convention; cover both with an audit. **This is a workspace-shared concern**, not package-local — handle it as one workspace ESLint configuration.

### RC-GUARD-7 — Step-linter is regex/heuristic where it should be Gherkin-AST

**Pattern.** Several step-linter false-positive findings share the same mechanism: the linter operates on raw text and reinvents Gherkin parsing rather than using the AST that `architect-core` already produces.

**Findings this explains.**
- H5 (quality) — `stripQuotedContent` is escape-unaware → false positives.
- M4 (quality) — `isInSessionScope` substring matches over-match.
- M6 (quality) — cross-checks accept comment-only mentions of `And`/`Rule`.
- M7 (quality) — idea-tier detector stops at `Feature:` line.

**Structural fix.** Route step-linter inputs through the existing Gherkin AST from `architect-core` (or through `@cucumber/gherkin` directly). Each finding becomes an AST node query instead of a regex.

**Trade-off.** Step linter currently can run on partially-broken feature files; AST parsing might reject those. Decide at refactor time whether partial-input support is required (and if so, fall back to regex on parse failure with a diagnostic — never silently).

### RC-GUARD-8 — Boilerplate + vocabulary mismatch (cross-package echo of RC-CORE-6 / RC-CORE-7)

**Pattern.** Severity-tally duplication, `noUncheckedIndexedAccess` defensive guards, vocabulary mismatch between decider (`pass | warn | blocked`) and scope-validate, ~80-line error-guide manual JSDoc, `createViolation` cast that contradicts no-BC. Same family as core's RC-CORE-6 (conditional-spread sprawl) and RC-CORE-7 (audit gap).

**Findings this explains.**
- Simplification H (severity tally duplication across runners).
- Simplification H (`discoverFiles` / `readFileSafe` boilerplate across runners).
- Simplification H (the `createViolation` cast).
- Simplification M8 (defensive index-guard noise).
- Simplification M11 (vocabulary mismatch — `pass | warn | blocked` vs boolean).
- Simplification L4 (~80-line error-guide manual JSDoc in `decider.ts`).

**Structural fix.**
1. Extract a `RunnerHarness` (severity tally + `discoverFiles` + `readFileSafe`) that both `lint/steps/runner.ts` and `lint/idea-tier/runner.ts` consume.
2. Standardise on the typed `pass | warn | blocked` enum across decider AND scope-validate. Delete the boolean variant. Compile-time alignment.
3. Move the 80-line error-guide manual from `decider.ts` JSDoc to `docs-sources/`.
4. Remove the `createViolation` cast; if the underlying type contract is wrong, fix the type.

---

## Findings the synthesis does NOT explain (genuinely independent)

- **M8 (quality)** — No `Promise.all` on file reads in runners (perf; opposite-direction echo of core's scanner concurrency findings but independent).
- **L2 (quality)** — Stale baseline entries accumulate is captured by RC-GUARD-4, but the underlying message-text keying is also a brittleness in its own right.
- **L3-L5 (quality)** — Cosmetic / efficiency cleanups not part of any cluster.

---

## Recommended Action Plan (root-cause ordered)

| Order | Root cause | Fix | Findings collapsed |
| ----- | ---------- | --- | ------------------ |
| 1 | RC-GUARD-1 | Restore unlock-reason BLOCKED severity + stateful hunk detection + `assertNever` exhaustiveness | C1, C2, H2, H4, M2, M3 |
| 2 | RC-GUARD-3 | Thread `TagRegistry` through `LintProcessCLI` | C3 |
| 3 | RC-GUARD-2 | Guard-side diagnostic discipline + ESLint `no-bare-catch` | H1, H3, M5, L1 (4 findings) — share workspace bus with core if built |
| 4 | RC-GUARD-4 | Migrate tier-A to JSON baseline mechanism; delete in-code allowlist | H4-arch, M1, L2 |
| 5 | RC-GUARD-5 | Extract business logic from CLI; address carve-out gap explicitly | M1-arch, M2-arch |
| 6 | RC-GUARD-7 | Route step linter through Gherkin AST | H5, M4, M6, M7 |
| 7 | RC-GUARD-6 | Workspace-shared barrel hygiene (joint with core/projection) | H1-arch, H2-arch, M3-arch |
| 8 | RC-GUARD-8 | RunnerHarness + vocabulary standardisation + JSDoc cleanup + cast removal | 6 simplification opps |
| — | independent | `Promise.all` on file reads, cosmetic cleanups | individual |

Ordering rationale:
- 1 + 2 + 3 close FSM contract gaps; everything else builds on a sound enforcement surface.
- 4 + 5 are independent refactors that don't block each other.
- 6 is workspace-shared with the same fix from core/projection — bundle.
- 7 + 8 are mechanical cleanups; do last.

## Verification Suggestions

- After RC-GUARD-1: process-guard regression tests for: terminal-state edit with empty unlock-reason (must BLOCK); diff with status change across hunk boundary (must detect); each new `ProcessGuardRule` requires a compile-time handler (try adding a rule and assert build fails).
- After RC-GUARD-3: regression test with a non-default tag prefix in `architect.config.ts`; assert error messages name the configured prefix.
- After RC-GUARD-4: `pnpm test:pack-smoke` continues to pass; `--write-baseline` regenerates tier-A successfully.
- After RC-GUARD-5: `pnpm architect:query arch dangling --strict` confirms no new stage-1 imports outside the named list.

## Review Metadata

- Phase 1 agents: `cleanup-review:code-reviewer`, `cleanup-review:architect-review`,
  `cleanup-review:code-simplifier` (parallel)
- Bootstrap: `architect-base` + `architect-data-api` loaded for every agent
- ADR anchors used: 003, 006, 007
- Read-only review — no source modifications
- **Synthesis note**: organised by root cause. RC-GUARD-2, RC-GUARD-6, RC-GUARD-8 are explicit cross-package echoes of root causes already named in core/projection — see suite final report for joint resolution.
