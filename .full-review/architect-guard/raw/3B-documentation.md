# architect-guard — Phase 3B: Documentation Review

**Scope:** `packages/architect-guard/` (38 source files, ~9,135 SLOC)
**Phase context:** Phases 1 and 2 consolidated in `01-quality-architecture.md` and `02-simplification-cleanup.md`. This phase evaluates documentation as it exists today — not proposed future state.

---

## 1. Executive Summary

`@libar-dev/architect-guard` has **no package-level README**. It is the only publishable package in the family without one, and the absence is not incidental: the package's four CLI entry-points (`architect-guard`, `architect-validate`, `architect-lint-steps`, `architect-lint-patterns`) are the most consumer-facing surfaces in the repository, yet a consumer who installs `@libar-dev/architect-guard` directly receives zero installation, configuration, or usage guidance at the package root. The repo-level documentation that does exist (`docs/VALIDATION.md`, `docs/PROCESS-GUARD.md`) is comprehensive but carries a "Deprecated" banner directing readers to a `docs-live/` tree that is gitignored and only produced by running `pnpm docs:all` locally — meaning the only authoritative human-readable documentation is marked stale.

The JSDoc annotation coverage is 55% (21 of 38 `.ts` files), with the most significant gap concentrated in the `lint/steps/` subsystem (7 of 8 files unannotated) and the `lint/idea-tier/` subsystem (all 4 files unannotated), both of which are core deliverables of the package. The `git/` module carries a demonstrably wrong `@architect-bounded-context:generator` annotation on all four of its files — a live misinformation defect in the Architect State. The phantom PDR-005 reference appears **10 times** across source files and committed documentation (`docs/`, `docs-sources/`), which is four more sites than Phase 2 inventoried; two of the extra sites are in `docs/GHERKIN-PATTERNS.md` and `docs/VALIDATION.md`, both of which are load-bearing consumer-facing guides. The `tier-a-baseline.ts` — 1,138 LOC of hardcoded cross-package file paths — has no JSDoc header, no annotation, and zero documentation anywhere in the repo explaining its nature, its deletion-bound status, or why consumers cannot override it. MIGRATION.md covers the bin-to-package map correctly but does not address any guard JS API symbols, which matters because `DanglingBaselineComparison`, `DanglingBaselineEntry`, and the four `run*Cli` functions are the only externally consumed symbols the package exports.

---

## 2. README Audit

### 2.1 Existence check

`/Users/darkomijic/dev-projects/architect/packages/architect-guard/README.md` — **does not exist**.

Verified: `ls /Users/darkomijic/dev-projects/architect/packages/architect-guard/` returns no README. The only other publishable package without a package-level README in the family is not applicable here — `@libar-dev/architect-projection` has a substantive README per the review scope notes.

### 2.2 Severity of absence

The absence is a **High (P1) documentation defect**, not merely cosmetic:

1. A consumer installing `@libar-dev/architect-guard` via npm or pnpm receives no package-level README in the `npmjs.com` listing, no `--help` entry-point discovery, and no indication which bins come from this package vs. `@libar-dev/architect-cli`.
2. The `MIGRATION.md` (line 23) correctly maps the `architect-guard` **bin** to `@libar-dev/architect-cli` as the publisher, but MIGRATION.md says nothing about what `@libar-dev/architect-guard` itself is for as a dependency. A consumer who follows the migration guide and imports `import { runValidatePatternsCli } from '@libar-dev/architect-guard'` has no documentation telling them this is the intended JS-API surface.
3. The `AGENTS.md` (line 165) references `ProcessGuard` as a key export of `@libar-dev/architect-guard`, but `ProcessGuard` is not a symbol in the current barrel — the listed export is `runLintProcessCli`. This is an AGENTS.md inaccuracy compounded by the absent README.

### 2.3 Proposed README outline

The following outline is appropriate for the current state of the package. It should **not** document deletion-bound symbols (`TIER_A_LINT_BASELINE`, `tier-a-baseline.ts` loader), and it should not repeat the CLI flag reference already in each bin's `--help` text — it should point there. Do not add TypeDoc references.

```
# @libar-dev/architect-guard

## What this package does
One paragraph: policy, validation, process guard, step-lint, DoD, anti-pattern detection.
Distinguish: this package contains the *implementation*; `@libar-dev/architect-cli` publishes the bins.

## Bins (published via @libar-dev/architect-cli)
Table: bin name → what it does → --help reference
- architect-guard (runLintProcessCli)
- architect-validate (runValidatePatternsCli)
- architect-lint-steps (runLintStepsCli)
- architect-lint-patterns (runLintPatternsCli)

## JS API (for programmatic use)
The only externally consumed symbols per Phase 2 dead-surface analysis:
- runValidatePatternsCli, runLintStepsCli, runLintPatternsCli, runLintProcessCli
- compareDanglingBaseline, writeDanglingBaseline
- DANGLING_BASELINE_SOURCE_PATH
- DanglingBaselineComparison, DanglingBaselineEntry

Import path: @libar-dev/architect-guard (single entrypoint; no subpaths currently)

## Dangling-baseline override
Short explanation of dangling-baseline.json build-time copy and --update-baseline flag.
No mention of TIER_A_LINT_BASELINE (deletion-bound).

## Configuration
Brief: reads architect.config.ts via loadProjectConfig from @libar-dev/architect-core.
Point to docs/CONFIGURATION.md.

## Dogfood usage (this repo)
pnpm architect:guard --staged  (pre-commit)
pnpm architect:guard:all       (full tree)
pnpm validate:all              (cross-source + DoD + anti-patterns)
Note: these scripts live in root package.json; copy the pattern for consumer repos.

## ADR references
ADR-003: Source-First Pattern Architecture — guard's cross-source validation enforces this
ADR-009: Projection Trust Boundary — parseAtBoundary not yet applied (tracked as C-GUARD-4)
PDR-001: Session Workflow Commands — governs scope-validate/handoff in architect-cli, not guard

## Dependency direction
core ← guard ← cli
This package depends on @libar-dev/architect-core only. No circular dependencies.
```

---

## 3. CLI Help-Text Audit

All four CLIs expose their help via `--help` / `-h`. Help text is delivered by the `printHelp()` function in each module and is tested informally via the direct entrypoint. There is no automated test that the help text compiles or is accurate.

### 3.1 `architect-guard` (`runLintProcessCli` / `src/cli/lint-process.ts`)

**Help text source:** `lint-process.ts:142–189`

**Accurate items:**
- Mode flags (`--staged`, `--all`, `--files`, `--file`, `--format`, `--strict`, `--ignore-session`, `--show-state`, `--base-dir`) are all implemented and match the `parseArgs` logic.
- Exit code table (0 / 1) is accurate.
- Examples are valid invocations.

**Documentation defect (P1 — phantom reference):**

Line 170:
```
error    invalid-status-transition  Status transition must follow PDR-005 FSM
```

This is the one load-bearing instance Phase 2 flagged as `cli/lint-process.ts:170`. PDR-005 does not exist in `architect/decisions/`. A consumer reading the help text who tries to look up PDR-005 will find nothing. This is a **defect in user-visible help output** — not just an internal comment.

**Missing flag documentation — Phase 2 plan gap:**
The `--baseline` override for the tier-A baseline (Phase 2 Sweep 4 / H-SIMP-6) is not present. This is correct for *current* state — the flag does not yet exist in the implementation. Once Sweep 4 lands, the help text must be updated. There is no placeholder or TODO comment noting this, so the gap will not be caught by inspection.

**`--all` branch hardcodes `main`:**
`lint-process.ts:322`: `detectBranchChanges(config.baseDir, 'main', ...)`. The help text says `--all: Validate all changes compared to main branch` — accurate but the hardcoded branch name is not documented as a limitation. A consumer on a repo whose default branch is `master` or `trunk` will get silent wrong behavior. Phase 2 did not flag this; it is a doc + implementation gap.

### 3.2 `architect-validate` (`runValidatePatternsCli` / `src/cli/validate-patterns.ts`)

**Help text source:** `validate-patterns.ts:276–348`

**Accurate items:**
- All flags are implemented and match parseArgs.
- Exit code table (0 / 1 / 2) is accurate and correctly differentiates from `architect-guard`'s (0 / 1) table.
- `--update-baseline` is documented and implemented (`validate-patterns.ts:263`, `enforceDanglingBaseline`).
- DoD and anti-pattern sections are accurate.

**Documentation issues:**

1. **`loadConfig` vs `loadProjectConfig` split** (`lint-process.ts:264`, `validate-patterns.ts:753`): `validate-patterns` uses the to-be-deleted `loadConfig` (Phase 2 H-SIMP-2 sweep); `lint-process` uses `loadProjectConfig`. The help text does not explain this difference, and neither function is documented in any consumer-facing reference. This is not strictly a help-text defect but there is no path for a consumer to discover that the two CLIs have different config-loading semantics.

2. **`ScannerConfigSchema.parse` at `validate-patterns.ts:855`** — calls `ScannerConfigSchema.parse()` directly without `parseAtBoundary`, consistent with C-GUARD-4 / C-GUARD-3. Not visible in help but creates an opaque error path if invalid input is supplied.

3. **`--verbose` flag** exists in `parseArgs` and `printHelp` but is absent from the help table header line (`Options:` section) — it only appears in the examples section implicitly. This is minor but inconsistent.

### 3.3 `architect-lint-steps` (`runLintStepsCli` / `src/cli/lint-steps.ts`)

**Help text source:** `lint-steps.ts:113–175`

**Accurate items:**
- All flags implemented and documented.
- 12 rules table is accurate per the lint engine.
- Scan scope defaults (`tests/features/**/*.feature` / `tests/steps/**/*.steps.ts`) are correct.

**Documentation defect:**

The file-level JSDoc block (lines 3–12) does not carry any `@architect-pattern` annotation — `lint-steps.ts` is one of the 17 unannotated source files. The help text and implementation are sound, but the module is invisible to the PatternGraph. The pattern name would be `LintStepsCLI` following the sibling convention.

**No `@architect-bounded-context` annotation.** Sibling CLIs have it; `lint-steps.ts` lacks it. Not a help-text problem but a JSDoc gap.

### 3.4 `architect-lint-patterns` (`runLintPatternsCli` / `src/cli/lint-patterns.ts`)

**Help text source:** `lint-patterns.ts:149–193`

**Accurate items:**
- All flags implemented and match parseArgs.
- Rules table is accurate.
- `--strict` note ("Tier-A errors always fail") is correct and useful.

**Documentation issues:**

1. **`tier-a-baseline.ts` is invisible.** The help text says `--strict: Treat warnings as errors (Tier-A errors always fail)` but does not explain what "Tier-A" means or that it is a hardcoded 1,138-LOC baseline that cannot be overridden. A consumer running `architect-lint-patterns` against their own repo will see Tier-A violations they cannot suppress — the help text gives no guidance. Phase 2 proposed a `--baseline` flag (H-SIMP-6); until that lands there is no escape hatch, and the help text is silent about this.

2. **Example scope is misleading.** Line 181: `architect-lint-patterns -i "packages/@libar-dev/platform-*/src/**/*.ts"` is a non-existent package path — this is clearly copy from a studio-era template. The correct dogfood example would be `architect-lint-patterns -i "packages/*/src/**/*.ts"`. Minor but looks like stale content to a first-time reader.

---

## 4. JSDoc / @architect-pattern Coverage Map

### 4.1 Quantitative summary

| Metric | Value |
|--------|-------|
| Total `.ts` source files | 38 |
| Files with `@architect-pattern` | 21 |
| Annotation rate | **55%** |
| Projection's rate | 60% |
| Core's rate | 26% |

### 4.2 Annotated files (preserve)

| File | Pattern name | Bounded-context | Status |
|------|-------------|-----------------|--------|
| `src/git/index.ts` | GitModule | **generator** (WRONG — see §5) | active |
| `src/git/branch-diff.ts` | GitBranchDiff | **generator** (WRONG) | active |
| `src/git/name-status.ts` | GitNameStatus | **generator** (WRONG) | active |
| `src/git/helpers.ts` | GitHelpers | **generator** (WRONG) | active |
| `src/cli/lint-process.ts` | LintProcessCLI | process-guard | active |
| `src/cli/validate-patterns.ts` | ValidatePatternsCLI | validation | completed |
| `src/cli/lint-patterns.ts` | LintPatternsCLI | cli | completed |
| `src/lint/process-guard/index.ts` | ProcessGuardLinter | process-guard | active |
| `src/lint/process-guard/types.ts` | ProcessGuardTypes | process-guard | active |
| `src/lint/process-guard/decider.ts` | ProcessGuardDecider | process-guard | active |
| `src/lint/process-guard/derive-state.ts` | DeriveProcessState | process-guard | active |
| `src/lint/process-guard/detect-changes.ts` | DetectChanges | process-guard | active |
| `src/lint/process-guard/session-state-reader.ts` | SessionStateReader | process-guard | active |
| `src/lint/engine.ts` | LintEngine | lint | active |
| `src/lint/rules.ts` | LintRules | lint | active |
| `src/validation/anti-patterns.ts` | AntiPatternDetector | validation | completed |
| `src/validation/dod-validator.ts` | DoDValidator | validation | completed |
| `src/validation/types.ts` | DoDValidationTypes | validation | completed |
| `src/validation/index.ts` | ValidationModule | validation | completed |
| `src/lint/index.ts` | LintModule | lint | active |

(Note: `src/lint/steps/runner.ts` carries `@architect-pattern StepLintRunner` — counted in the 21; full list not enumerated above)

### 4.3 Unannotated files — gap map

17 files (45%) have no `@architect-pattern` annotation:

| File | Significance | Proposed annotation |
|------|-------------|-------------------|
| `src/index.ts` | Package barrel — public contract | `@architect-pattern GuardBarrel` / `@architect-role:barrel` |
| `src/cli/index.ts` | CLI re-export barrel | `@architect-pattern CLIBarrel` / `@architect-role:barrel` |
| `src/cli/shared.ts` | Shared CLI helpers (`printVersionAndExit`, `handleCliError`, `isDirectCliEntrypoint`, `DEBUG`) | `@architect-pattern CLIShared` / `@architect-role:utility` |
| `src/cli/lint-steps.ts` | **HIGH VALUE** — one of 4 externally-consumed CLI entry-points | `@architect-pattern LintStepsCLI` / `@architect-bounded-context:lint` |
| `src/lint/dangling-baseline.ts` | **HIGH VALUE** — externally consumed by `architect-cli`; `compareDanglingBaseline` + `writeDanglingBaseline` are in the 9-symbol public surface | `@architect-pattern DanglingBaselineManager` / `@architect-bounded-context:lint` |
| `src/lint/steps/index.ts` | Steps linter barrel | `@architect-pattern StepLintBarrel` / `@architect-role:barrel` |
| `src/lint/steps/types.ts` | Step lint types | `@architect-pattern StepLintTypes` / `@architect-role:contract` |
| `src/lint/steps/cross-checks.ts` | Cross-file rule engine | `@architect-pattern StepCrossChecks` / `@architect-bounded-context:lint` |
| `src/lint/steps/feature-checks.ts` | Feature-file-only rules | `@architect-pattern StepFeatureChecks` / `@architect-bounded-context:lint` |
| `src/lint/steps/step-checks.ts` | Step-file-only rules | `@architect-pattern StepStepChecks` / `@architect-bounded-context:lint` |
| `src/lint/steps/pair-resolver.ts` | Feature+step pairing logic | `@architect-pattern StepPairResolver` / `@architect-bounded-context:lint` |
| `src/lint/steps/runner.ts` | *Actually annotated* (StepLintRunner) | already annotated |
| `src/lint/steps/utils.ts` | Shared utilities | `@architect-pattern StepLintUtils` / `@architect-role:utility` |
| `src/lint/idea-tier/index.ts` | Idea-tier linter barrel | `@architect-pattern IdeaTierBarrel` / `@architect-role:barrel` |
| `src/lint/idea-tier/types.ts` | Idea-tier types | `@architect-pattern IdeaTierTypes` / `@architect-role:contract` |
| `src/lint/idea-tier/idea-tier-checks.ts` | Idea-tier check rules | `@architect-pattern IdeaTierChecks` / `@architect-bounded-context:lint` |
| `src/lint/idea-tier/runner.ts` | Idea-tier runner | `@architect-pattern IdeaTierRunner` / `@architect-bounded-context:lint` |

**High-value gaps** (i.e., in the externally-consumed or architecturally significant surface):
- `src/cli/lint-steps.ts` — published entry-point, invisible to PatternGraph
- `src/lint/dangling-baseline.ts` — contains the two symbols consumed by `architect-cli` plus the one constant, yet is not annotated
- `src/index.ts` — the package barrel has no header comment and no annotation (H-GUARD-1 / TD-CORE-4 analogue)

**Systematic gap: the entire `lint/steps/` subsystem (7 of 8 files) and entire `lint/idea-tier/` subsystem (4 of 4 files) are unannotated.** These are complete feature subsystems. They represent the `architect-lint-steps` CLI's implementation layer and an additional tier-checking layer, but neither is visible in the PatternGraph.

---

## 5. Findings by Severity

### Critical (P0)

#### DOC-GUARD-C1. `@architect-bounded-context:generator` on all four `git/` files — live Architect State misinformation

**Files:** `src/git/index.ts:6`, `src/git/branch-diff.ts:6`, `src/git/name-status.ts:6`, `src/git/helpers.ts:6`

**Doctrine:** "Architect State is Code." The `@architect-*` annotations ARE the state; generated docs and PatternGraph are projections of that state. A wrong annotation produces a wrong projection.

**What the annotation says:** `@architect-bounded-context:generator` — asserts this module belongs to the generator bounded context.

**What Phase 2 established (superseding Phase 1 H-GUARD-3):** `git/` is consumed **only** by `lint/process-guard/detect-changes.ts` within guard. It is not consumed by core. Phase 2 Cleanup-H-GUARD-3 says the correct refactor is to demote it to `src/lint/process-guard/_git/` and drop the annotation. The annotation is wrong regardless of whether the demotion lands: guard is not a generator.

**Impact:** Any PatternGraph query filtering by bounded-context will incorrectly classify these four modules as generator-context code. The `architect-lint-patterns` tool itself, when run against this repo, will report these four files as belonging to a generator context they do not belong to.

**Fix (independent of demotion decision):** Change `@architect-bounded-context:generator` to `@architect-bounded-context:process-guard` on all four files. If the demotion (Cleanup-H-GUARD-3) is also landed, the annotation is removed because the files move into `process-guard/_git/`.

---

### High (P1)

#### DOC-GUARD-H1. No package README — externally-consumed package has zero installation or usage documentation

**Path:** `packages/architect-guard/README.md` — does not exist.

**Context:** All five other publishable packages in the family are documented at the package level (projection has a substantial README per scope notes). `@libar-dev/architect-guard` is the only one without. The package exposes four CLIs and nine externally-consumed JS symbols.

**Fix:** Author the README as outlined in §2.3. The README should not describe deletion-bound symbols and should not duplicate bin flag reference (link to `--help` instead).

#### DOC-GUARD-H2. Phantom PDR-005 in load-bearing user-visible help output

**File:** `src/cli/lint-process.ts:170`
```
error    invalid-status-transition  Status transition must follow PDR-005 FSM
```

This is the one site Phase 2 (H-SIMP-3) identified as "load-bearing in CLI help output." The string appears verbatim in `architect-guard --help`. A consumer reading the help will see `PDR-005 FSM` and find nothing when they look it up — not in `architect/decisions/`, not in AGENTS.md's ADR list, not in any public doc.

**Decision required (Phase 2 H-SIMP-3 framing still holds):** Either author `architect/decisions/PDR-005-process-status-fsm.feature` (the FSM is a real decision worth recording; the transition table already exists in `architect-core/src/validation/fsm/transitions.ts`) or replace the reference with a self-contained description that does not cite a nonexistent document.

#### DOC-GUARD-H3. `lint-steps.ts` is unannotated despite being an externally-consumed entry-point

`src/cli/lint-steps.ts` is one of the four exported `run*Cli` functions consumed by `architect-cli`. Its sibling `lint-process.ts` has a full annotation block; `lint-steps.ts` has none. The file-level JSDoc (lines 3–12) is a plain comment, not an `@architect` annotated block. The module is invisible to the PatternGraph.

#### DOC-GUARD-H4. `dangling-baseline.ts` is unannotated despite containing three of the nine externally-consumed symbols

`src/lint/dangling-baseline.ts` exports `compareDanglingBaseline`, `writeDanglingBaseline`, and `DANGLING_BASELINE_SOURCE_PATH` — all three consumed by `architect-cli/src/cli/commands/_shared/structured.ts`. The module has no JSDoc header at all, no `@architect-pattern`, no bounded-context annotation. For the package's most architecturally interesting module (dangling-baseline pattern is Phase 2's reference shape for the tier-a-baseline refactor), the absence is notable.

#### DOC-GUARD-H5. AGENTS.md cites `ProcessGuard` as a key export but no such symbol exists in the barrel

`AGENTS.md:165`:
```
Key exports from `@libar-dev/architect-guard`:
- `ProcessGuard` — FSM enforcement for the delivery lifecycle.
```

`ProcessGuard` is not exported by `src/index.ts`. The externally-consumed symbols are `runLintProcessCli` and the dangling-baseline functions. This is a live inaccuracy in the repo's primary agent-guidance document.

#### DOC-GUARD-H6. MIGRATION.md maps the bin but ignores the JS API

`MIGRATION.md` maps `architect-guard` (the bin) to `@libar-dev/architect-cli` (the publisher) correctly. But the document's stated scope is "JS API → package map" for v1 consumers migrating to v2 splits. `@libar-dev/architect-guard`'s JS API surface (the nine externally-consumed symbols) is not mentioned at all. A v1 consumer who was importing any guard function from the v1 monolith gets no migration path from `MIGRATION.md`.

#### DOC-GUARD-H7. `docs/VALIDATION.md` and `docs/PROCESS-GUARD.md` are marked "Deprecated" and point to a gitignored tree

Both files carry a banner:
> **Deprecated:** This document is superseded by the auto-generated [...] This file is preserved for reference only.

The referenced auto-generated file lives under `docs-live/`, which is gitignored (`AGENTS.md:13`). Any consumer or contributor navigating to `docs/` sees the deprecation banner and no link to anything they can actually open. This effectively makes the docs surface **display as deprecated** while no non-gitignored replacement exists. Phase 2 did not flag this; it is a documentation-workflow defect, not a code defect, but it degrades discoverability of the most useful consumer-facing content in the repo.

#### DOC-GUARD-H8. `src/index.ts` has no header — public contract is unidentified

The barrel has no comment, no `@architect-pattern`, and no indication of what it exports or who its intended consumers are. Phase 1 (H-GUARD-1) noted "12 wildcards make the contract unidentifiable"; the annotation gap compounds this. The TD-CORE-4 analogue for core applied the same finding at identical severity.

---

### Medium (P2)

#### DOC-GUARD-M1. Phantom PDR-005 in committed documentation (`docs/` and `docs-sources/`)

Beyond the source-code references (inventoried in §6), the phantom reference appears in three committed docs files:

- `docs/VALIDATION.md:239`: `FSM validation for delivery workflow (PDR-005).`
- `docs/GHERKIN-PATTERNS.md:29`: `Enforces file protection levels per PDR-005`
- `docs/GHERKIN-PATTERNS.md:51`: `Rule: Status transitions must follow PDR-005 FSM`
- `docs-sources/gherkin-patterns.md:22`: same as GHERKIN-PATTERNS.md:29
- `docs-sources/gherkin-patterns.md:47`: `Rule: Status transitions must follow PDR-005 FSM`

Phase 2 (H-SIMP-3) inventoried 5 guard-source references and 1 core reference. This audit finds **5 additional references in committed doc files** that Phase 2 missed. Total phantom PDR-005 reference count is 10 (5 source + 1 core + 4 docs/docs-sources). The docs-sources entries are particularly important because they feed generated documentation via `pnpm docs:all` and will propagate the phantom reference into any consumer's generated output.

#### DOC-GUARD-M2. `tier-a-baseline.ts` — 1,138 LOC, deletion-bound, completely undocumented

`src/lint/tier-a-baseline.ts` has no JSDoc file header, no `@architect-pattern` annotation, and no explanation of what it is. The file exports `TIER_A_LINT_BASELINE` (a 1,000-entry hardcoded array of cross-package file paths), `applyTierABaseline`, and `summarizeLintResults`. Phase 2 established this is deletion-bound (Cleanup-C-GUARD-2 / Sweep 4). Per the review instruction, documentation for deletion-bound symbols should not be proposed. However, the **absence of any explanatory comment** means the next contributor to touch the file has no context that it exists for dogfood suppression, that it cannot be overridden by consumers, or that it is being replaced by a JSON + `--baseline` pattern. A single `// @internal - deletion-bound per Cleanup-C-GUARD-2; see docs for replacement plan` comment is appropriate and does not conflict with the no-doc-for-deletion-bound guidance.

#### DOC-GUARD-M3. `process-guard-rules.feature:38–49` cites nonexistent `phase-state-machine` feature suite

`tests/features/process-guard-rules.feature:38–49` (the "Status Transitions" rule block):
```
The FSM-validity rejection path is covered by the upstream
`phase-state-machine` feature suite.
```

No file matching `phase-state-machine` exists anywhere in the repo (confirmed by `find`). Phase 1 (H-GUARD-7) and Phase 2 (M-SIMP-4) both flagged this as a "phantom upstream suite reference." In the documentation context, this is an actively misleading statement: a contributor reading this feature file believes the FSM rejection path is tested elsewhere and will not add tests for it here. Phase 2 noted there are zero FSM transition tests in guard (and in core, per TD-CORE-3). The comment should be removed or replaced with the FSM-transition test stub per Phase 2 H-SIMP-7.

#### DOC-GUARD-M4. `lint/steps/` and `lint/idea-tier/` subsystems — complete JSDoc absence

12 files across two subsystems have no `@architect-pattern` annotation and no JSDoc headers. These are not utility helpers — they implement the `architect-lint-steps` CLI feature and an idea-tier checking feature respectively. The PatternGraph for this repo has no representation of these subsystems. Because the package's own `architect-lint-patterns` tool enforces annotation quality, running it against the guard package would flag its own source. This is a documentation debt that the toolchain would detect if it were run with guard's own `src/` as input (it is currently not run against guard; see Phase 1 M-GUARD-12).

#### DOC-GUARD-M5. `docs/VALIDATION.md` programmatic API section cites wrong import paths

`docs/VALIDATION.md:400–414`:
```typescript
import { lintFiles, hasFailures } from '@libar-dev/architect/lint';
import { runStepLint, STEP_LINT_RULES } from '@libar-dev/architect/lint';
import { deriveProcessState, validateChanges } from '@libar-dev/architect/lint';
import { detectAntiPatterns, validateDoD } from '@libar-dev/architect/validation';
```

These paths reference `@libar-dev/architect` subpaths (e.g., `/lint`, `/validation`) that do not exist. The v2 meta package is bin-only and has no JS exports. The correct v2 imports would be from `@libar-dev/architect-guard` directly. This is a live inaccuracy in consumer-facing documentation that will cause `Module not found` errors for any consumer who follows it.

#### DOC-GUARD-M6. `docs/VALIDATION.md` CI integration example uses `npx` for guard bins

`docs/VALIDATION.md:354–365` scripts section uses `npx architect-guard`, `npx lint-patterns`, etc. The repo's own pattern (per `AGENTS.md:199–202` and `package.json`) is `pnpm exec architect-guard`. The `npx` form works but is not the canonical invocation for a pnpm workspace. The CONTRIBUTING.md (where it exists) and the per-package READMEs (where they exist) should standardize on `pnpm exec` or document both forms.

#### DOC-GUARD-M7. `--all` mode silently hardcodes `main` branch — no documentation

`lint-process.ts:322`: `detectBranchChanges(config.baseDir, 'main', {...})`. The `--all` flag is documented as "Validate all changes compared to main branch" — both in the help text and in PROCESS-GUARD.md. No documentation notes that `main` is hardcoded and that consumers on `master`, `trunk`, or custom default branches will get incorrect behavior. This is a gap that affects consumer setups and should be documented as a known limitation alongside a note that an override flag is needed (tracked as a future enhancement).

---

### Low (P3)

#### DOC-GUARD-L1. `cli/lint-patterns.ts` help example uses non-existent package path

`lint-patterns.ts:182`:
```
architect-lint-patterns -i "packages/@libar-dev/platform-*/src/**/*.ts"
```

`@libar-dev/platform-*` does not exist in this repo. This is a copy from a studio-era template. Should be replaced with a realistic example (e.g., `architect-lint-patterns -i "packages/*/src/**/*.ts"`).

#### DOC-GUARD-L2. `docs/GHERKIN-PATTERNS.md` and `docs/VALIDATION.md` carry a "preserved for reference" disclaimer but still serve as primary documentation

Both files are marked deprecated yet are the only non-gitignored consumer documentation. The deprecation disclaimer may discourage contributors from maintaining or improving them, creating a documentation maintenance vacuum.

#### DOC-GUARD-L3. `CONTRIBUTING.md` does not mention guard bins or test patterns

`CONTRIBUTING.md` exists at the repo root but contains no reference to `architect-guard`, `architect-lint-steps`, `architect-validate`, or `architect-lint-patterns`. A first-time contributor adding a rule to the step-linter subsystem has no documented path to understand which test file to add to or which CLI to invoke.

---

## 6. Phantom PDR-005 Reference Inventory

Complete inventory across all non-generated files (node_modules and dist excluded):

| File | Line | Content | Severity |
|------|------|---------|----------|
| `src/cli/lint-process.ts` | 170 | `error    invalid-status-transition  Status transition must follow PDR-005 FSM` | **P1 — user-visible CLI help output** |
| `src/lint/process-guard/index.ts` | 14 | `* - Status transitions (must follow PDR-005 FSM)` | P2 — JSDoc |
| `src/lint/process-guard/types.ts` | 29 | `* - Protection levels from PDR-005 FSM` | P2 — JSDoc |
| `src/lint/process-guard/decider.ts` | 33 | `* 2. **Status Transition** - Transitions must follow PDR-005 FSM` | P2 — JSDoc |
| `src/lint/process-guard/decider.ts` | 58 | `* **Invariant:** Status transitions must follow the PDR-005 FSM path.` | P2 — JSDoc |
| `packages/architect-core/src/taxonomy/registry-builder.ts` | 162 | `purpose: 'Work item lifecycle status (per PDR-005 FSM)'` | P2 — runtime string |
| `docs/VALIDATION.md` | 239 | `FSM validation for delivery workflow (PDR-005).` | **P1 — consumer-facing doc** |
| `docs/GHERKIN-PATTERNS.md` | 29 | `Enforces file protection levels per PDR-005` | P1 — consumer-facing doc |
| `docs/GHERKIN-PATTERNS.md` | 51 | `Rule: Status transitions must follow PDR-005 FSM` | P1 — consumer-facing doc |
| `docs-sources/gherkin-patterns.md` | 22 | `Enforces file protection levels per PDR-005` | P1 — doc generator input |
| `docs-sources/gherkin-patterns.md` | 47 | `Rule: Status transitions must follow PDR-005 FSM` | P1 — doc generator input |

**Total: 11 references** (Phase 2 inventoried 6; this audit finds 5 additional sites in `docs/` and `docs-sources/`).

**Decision table (per Phase 2 H-SIMP-3 options):**

| Option | Action | Work estimate |
|--------|--------|---------------|
| A — Author PDR-005 | Create `architect/decisions/PDR-005-process-status-fsm.feature` documenting the FSM transition table (already in `architect-core/src/validation/fsm/transitions.ts`). All 11 references become valid citations. | ~1 hour |
| B — Strip all references | Replace the user-visible line 170 with a self-describing string; replace all other references with concrete descriptions of the FSM rule. Also sweep `docs/` and `docs-sources/`. | ~2 hours |

Option A is recommended: the FSM enforcement is a genuine architectural decision, the transition table is already canonical in code, and the existing references in error messages and docs are valuable if the PDR exists.

---

## 7. ADR Linkage Table

This table maps each relevant ADR to guard's relationship with it, per the annotations in source and any documentation cross-references.

| ADR | Title | Guard relationship | Documented? | Gap |
|-----|-------|--------------------|-------------|-----|
| **ADR-003** | Source-First Pattern Architecture | Guard's `validatePatterns` cross-source validator directly enforces this: it flags patterns present in TS but absent from Gherkin. | No link in guard source or docs | `validate-patterns.ts` has no `@architect-see-also` or `@architect-decision` annotation for ADR-003, though it is the primary enforcement point. |
| **ADR-005** | Codec/Renderer Separation | Not directly relevant to guard. | N/A | None. |
| **ADR-006** | Single Read Model | Guard consumes `RuntimePatternGraph` from core's single read model. `validate-patterns.ts:418` documents this: "DD-2: Consumes RuntimePatternGraph instead of raw scanner/extractor output." | Inline comment only | The inline comment documents the *what* but does not link to ADR-006. |
| **ADR-007** | Coordinated Taxonomy Redesign | Guard's anti-pattern detector references ADR-001 Rule 6 at `anti-patterns.ts:51` but not ADR-007, which governs the taxonomy that determines which tags are feature-only. | Partial (wrong ADR cited) | `anti-patterns.ts:51` cites ADR-001 for the feature-only tag suffixes. ADR-007 is the correct citation for the coordinated taxonomy design. |
| **ADR-009** | Projection Trust Boundary | Guard is supposed to use `parseAtBoundary` at its three trust boundaries (C-GUARD-4). It does not. | Not documented | No annotation, no source comment acknowledging the non-compliance. The gap is invisible until you know to look for it. |
| **PDR-001** | Session Workflow Commands | Governs `scope-validate`/`handoff` in `architect-cli`, not guard. Guard's session-scope rules are distinct. | Mentioned in Phase 1 ADR conformance table | AGENTS.md lists PDR-001 as load-bearing but does not clarify that it governs `architect-cli`, not guard. A contributor new to guard could incorrectly assume PDR-001 is the governing PDR for guard's session-scope rules. |
| **PDR-005** | Process Status FSM | **Does not exist** in `architect/decisions/`. Cited 11 times. | Phantom — no file | As inventoried in §6. |

### Summary of ADR linkage gaps

1. **ADR-003** — guard is the enforcement point but has no annotation linking it.
2. **ADR-007** — `anti-patterns.ts:51` cites the wrong ADR (ADR-001 Rule 6 instead of ADR-007).
3. **ADR-009** — guard's non-compliance with the trust-boundary ADR is undocumented in source.
4. **PDR-005** — phantom; should be authored or stripped.
5. No `@architect-decision` or `@architect-see-also` annotations exist anywhere in guard source. Projection uses `@architect-see-also:ADR009ProjectionTrustBoundary` as the family reference pattern (per core DOC-M-4 from the core Phase 5 report); guard has zero.

---

## 8. Dogfood Usage Documentation

### What exists

The following dogfood invocations are documented and accurate:

**In `AGENTS.md:199–202`:**
```bash
pnpm architect:guard --staged     # pre-commit gate
```

**In `package.json` scripts (discoverable, not documented in prose):**
```json
"architect:guard":     "pnpm exec architect-guard --base-dir . --staged",
"architect:guard:all": "pnpm exec architect-guard --base-dir . --all",
"validate:patterns":   "pnpm exec architect-validate --base-dir .",
"validate:all":        "pnpm exec architect-validate --base-dir . --dod --anti-patterns"
```

**In `docs/VALIDATION.md:350–358`:** A "Recommended package.json Scripts" section that a consumer can copy, though it uses `npx` rather than `pnpm exec` (DOC-GUARD-M6).

### What is missing

1. **No explanation of `--base-dir .`** — the dogfood scripts all pass `--base-dir .` but there is no documentation explaining why this is necessary. A consumer who omits it will get config-resolution behavior based on `process.cwd()` which may differ from the workspace root. The `AGENTS.md` operational note (line 208) covers `PWD` fragility for subprocess embedding but does not connect this to the `--base-dir` flag.

2. **No consumer-replication guide** — the consumer wanting to replicate the dogfood setup needs to: (a) install `@libar-dev/architect` or `@libar-dev/architect-guard`, (b) set up `architect.config.ts`, (c) configure `pnpm` scripts. Steps (a) and (c) are in `docs/VALIDATION.md:350–358`. Step (b) is in `docs/CONFIGURATION.md`. None of these are linked from a single entry-point guide, and no package README ties them together. A consumer arriving at `npmjs.com/@libar-dev/architect-guard` has no path to the configuration doc.

3. **`dangling-baseline.json` empty-array state undocumented** — Phase 2 (Cleanup-H-GUARD-5) notes the dangling-baseline is `[]` today and the entire dual-write apparatus exists for zero entries. There is no documentation explaining this or that the consumer is expected to seed it with their own project's baseline via `architect-validate --update-baseline`. `docs/VALIDATION.md:273` mentions the baseline path but does not explain the initialization workflow.

---

## 9. Cross-references to prior findings

| This finding | Prior finding | Relationship |
|-------------|--------------|--------------|
| DOC-GUARD-C1 (wrong @bounded-context on git/) | Phase 2 Cleanup-H-GUARD-3 + Cleanup-M-GUARD-6 | This audit confirms the wrong annotation is live and identifies it as Architect State misinformation (doctrine: "Architect State is Code"), elevating to Critical |
| DOC-GUARD-H1 (no README) | Not flagged in Phases 1 or 2 | New finding in Phase 3B |
| DOC-GUARD-H2 (PDR-005 in CLI help) | Phase 2 H-SIMP-3 | Confirms the specific user-visible line; adds docs/ sites to the inventory |
| DOC-GUARD-H5 (AGENTS.md ProcessGuard symbol mismatch) | Not flagged in Phases 1 or 2 | New finding in Phase 3B |
| DOC-GUARD-H6 (MIGRATION.md ignores JS API) | Not flagged in Phases 1 or 2 | New finding in Phase 3B |
| DOC-GUARD-H7 (deprecated docs point to gitignored tree) | Not flagged in Phases 1 or 2 | New finding in Phase 3B |
| DOC-GUARD-M1 (PDR-005 in docs/ and docs-sources/) | Phase 2 H-SIMP-3 inventoried only src/ | This audit extends the inventory by 5 additional sites |
| DOC-GUARD-M3 (phantom phase-state-machine reference) | Phase 1 H-GUARD-7, Phase 2 M-SIMP-4 | Confirmed; framed here as a documentation defect that suppresses future test authorship |
| DOC-GUARD-M5 (wrong import paths in VALIDATION.md) | Not flagged in Phases 1 or 2 | New finding in Phase 3B |
