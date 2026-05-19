# architect-core — Phase 1 Consolidated Findings

Three parallel reviews complete. Detailed per-agent reports:

- Code quality: [`01a-code-quality.md`](./01a-code-quality.md) — 36 findings (5 Critical, 10 High, 11 Medium, 10 Low)
- Architecture:  [`01b-architecture.md`](./01b-architecture.md) — 18 findings (3 Critical, 8 High, 6 Medium, 5 Low)
- Simplification: [`01c-simplification.md`](./01c-simplification.md) — 28 opportunities (8 High, 10 Medium, 10 Low) + 7 themes

## Cross-cutting themes (where ≥2 agents converged)

### T-CORE-1 — Silent drops in extraction despite ADR-007

Multiple silent-drop sites surfaced by the **code-quality** agent. ADR-007 §Context names this exact failure mode (gherkin extractor / parser silently discarding patterns with unknown status), and the package has *still* not closed the back door:

- `dual-source-extractor.ts:93-100` — `ProcessMetadataSchema.safeParse` failure → `console.warn` + `null` return.
- `doc-extractor.ts:222` — `void extractionWarnings;` discards every shape-extraction failure.
- `build-pipeline.ts:221-236` — feature parse errors whose `patternName` is undefined disappear from `featureParseFailures`.

This is the canonical Critical-class theme for the package: the bug ADR-007 was written to fix is still mechanically present.

### T-CORE-2 — Zod boundary discipline incomplete (`z.object` vs `z.strictObject`)

Both **code-quality** (C4) and **architecture** (M-5) independently identified ≥19 schemas still on permissive `z.object`. The most damaging are at the actual trust boundary — `BusinessRuleSchema`, all of `extracted-shape.ts`. These schemas cross into `architect-projection` (which is bound by ADR-009 to parse only at `parseAndProject*`), so a permissive shape upstream silently widens the contract everywhere downstream.

### T-CORE-3 — Aliasing as a No-BC violation

Architecture C-3, code-quality, and simplification all noted multiple-naming as a recurring failure. The status enum is the canonical example (≥5 names for the 5-value `AcceptedStatusValue` schema; `AcceptedPatternStatusSchema` is exported but unused). `RuntimePatternGraph` alias of `PatternGraph` is similar. Each alias hides the ADR-007 boundary it was designed to enforce.

### T-CORE-4 — Layering inversions: producer → read-api

The **architecture** agent's C-1 finding (extractor & generators/pipeline importing from read-api/pattern-helpers `getPatternName`) is structurally an internal cycle. The function is 2 lines — moving it to `validation-schemas/extracted-pattern.ts` (where its inputs are declared) deletes the inversion without touching consumer code.

### T-CORE-5 — Lossy local types *inside* core's own read-api

ADR-006 explicitly names "Lossy Local Type" as an anti-pattern. The architecture agent (C-2) found three of them — `PatternDependencies`, `PatternRelationships`, `ProtectionInfo` — in `read-api/types.ts`, each hand-mirroring a canonical schema, with `PatternGraphAPI` hand-projecting fields one-by-one. External adherence is good; internal adherence is the gap.

### T-CORE-6 — Public surface bloat via `export *`

The architecture agent (H-1) flagged six `export *` lines in the barrel that publicize every symbol under `types/`, `validation-schemas/`, `validation/fsm/`, `scanner/`, `extractor/`, `utils/`, `read-api/`. Combined with the alias proliferation in T-CORE-3, this creates a public surface with no explicit "what we promise" list — every cleanup is potentially a breaking change.

### T-CORE-7 — Boilerplate conditional spreads and 350-line dispatch functions

The **simplification** agent's H1/H2/H3 + T1 cluster (≈95 hand-rolled `...(x !== undefined ? { x } : {})` spreads in `buildGherkinPatternDraft` / `buildPattern` / `extractPatternTags`) is the highest-leverage refactor in the package. A single `pickDefined` helper plus a strategy table for tag extraction removes ~400 LOC at zero behavioural risk because `parseAtBoundary` re-validates the output.

### T-CORE-8 — Concurrency inconsistency

Code-quality flagged opposite bugs in sibling scanner files — sequential `await fs.readFile` in the TS scanner (under-utilization) vs unbounded `Promise.all` in the Gherkin scanner (no concurrency cap). Both want a bounded-parallelism helper (`p-limit` style) and a shared pattern.

### T-CORE-9 — Security/safety hazards in shared utilities

Several discrete High findings in code-quality cluster as "input handling that bypasses the type system":

- Catastrophic-backtracking risk in `fileOptInPattern` (nested lazy quantifiers).
- `safeRealpathSync` falls back to non-canonical path; the `pattern.includes('..')` check that follows is unsound.
- No size cap on `fs.readFileSync` in `doc-extractor.ts:204`.
- `KNOWN_ACRONYMS` placeholder generator (`97 + placeholders.length`) overflows past 26 acronyms (35 exist today).

### T-CORE-10 — Comment rot and defensive guards from `noUncheckedIndexedAccess`

Simplification T3/T5 — boilerplate JSDoc headers (`### When to Use\n\n- As a typed contract …`) appear verbatim in ~14 internal files (delete per CLAUDE.md doctrine), and defensive index-access guards duplicate caller-side invariants (~30 LOC of pure noise).

## How to read the priority list

The package's most damaging issues are in two architecturally narrow areas — the **extraction trust boundary** (silent drops + permissive Zod) and **the read-api surface** (lossy local types + aliasing). Both have been the subject of ADRs (007, 006) and remain mechanically incomplete. The largest LOC wins are in the simplification themes (T-CORE-7, T-CORE-10), which carry near-zero behavioural risk and would make future cleanup safer.
