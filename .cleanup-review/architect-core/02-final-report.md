# Cleanup Review — `@libar-dev/architect-core`

## Review Target

`packages/architect-core/src/**` — 106 TS files, ~9.7k LOC. The ingestion +
read-model layer for the entire architect family. Detailed agent reports:
[`01a-code-quality.md`](./01a-code-quality.md) · [`01b-architecture.md`](./01b-architecture.md) · [`01c-simplification.md`](./01c-simplification.md) · [`01-cleanup-findings.md`](./01-cleanup-findings.md).

## Executive summary

The 82 findings across the three agents reduce to **seven structural root
causes**. Most of the high-impact issues are not independent — they are
symptoms of one of these seven mechanisms. The action plan below is organised
by root cause; fixing each collapses 4–20 findings at once.

Headline: the extraction layer is the load-bearing weakness. ADR-007 was
written specifically to eliminate silent drops at the extraction boundary
and that bug still has three live sites. The read-api surface has drifted
from canonical schemas in ways ADR-006 names by name. Everything else is
mechanical hygiene (No-BC enforcement, boilerplate collapse).

Raw counts: **8 Critical · 18 High · 17 Medium · 15 Low** (quality + arch) +
**8 High · 10 Medium · 10 Low** simplification opportunities. Linked through
seven root causes below.

---

## Root causes (the synthesis)

### RC-CORE-1 — No diagnostic-accumulator discipline at the extraction trust boundary

**Pattern.** Each extraction stage was written with its own failure surface — `console.warn`, `void`, silent `null` return, swallowed `safeParse` reason. No shared bus the orchestrator can drain.

**Findings this explains.**
- C1 — `dual-source-extractor.ts:93-100` logs and returns `null` on `ProcessMetadataSchema.safeParse` failure.
- C2 — `doc-extractor.ts:222` does `void extractionWarnings;`, discarding all accumulated messages.
- C3 — `build-pipeline.ts:221-236` drops feature parse errors whose recovered `patternName` is `undefined`.
- High (quality) — `JsonInputCodec.safeParse` swallows error reason.
- High (quality) — `recoverPatternNameFromFeatureText` matches anywhere in the file (silent collision).
- Medium (quality) — multiple log-and-skip sites in scanner.

**ADR anchor.** ADR-007 §Context names this exact failure shape ("the gherkin-ast-parser enum branch (line 622-625) silently discards unknown status values, and the gherkin-extractor (line 349-351) silently skips patterns without a status"). The fix landed at those two sites; the failure mode is mechanical and now lives in others.

**Structural fix.** Introduce an `ExtractionDiagnosticBus` (or extend the existing diagnostic surface) that every stage in `extractor/` and `generators/pipeline/` MUST push to instead of `console.*` / `void` / silent `null`. Add an ESLint rule scoped to `src/extractor/**` and `src/generators/pipeline/**` that bans `console.warn`, `console.error`, and unused-expression `void` statements. CI would have caught all three Criticals.

**Verification.** Regression tests proposed in the per-agent code-quality report for each site; once they pass, the rule prevents recurrence.

### RC-CORE-2 — `z.strictObject` discipline is doctrine without a mechanism

**Pattern.** The repo doctrine says `z.strictObject` at every cross-package contract, but there is no lint rule. 19 `z.object` callsites at the actual trust boundary still slip through.

**Findings this explains.**
- C4 — 19 sites; includes `BusinessRuleSchema` and all of `extracted-shape.ts` which crosses into `architect-projection`.
- A non-trivial chunk of the "extra fields silently pass" symptoms downstream — `projection`'s C1 markdown-renderer bypasses partly exist because the upstream contract didn't fail on unexpected shape fields.

**Structural fix.** Custom ESLint rule `architect/no-zod-object-in-validation-schemas` (or a Zod codemod) that flags `z.object` in `validation-schemas/**`. One commit converts the 19 sites and the rule prevents new ones. Knock-on effect: stricter upstream contract is the most cost-effective hardening for `projection`'s renderer-side bugs too.

### RC-CORE-3 — `Result` discriminated-union is being treated as a string container

**Pattern.** The `Result<T, E>` type carries typed errors; `.unwrap()` and a few consumers flatten the error back to a string at the worst moments.

**Findings this explains.**
- C5 — `Result.unwrap` JSON-stringifies non-Error error values.
- Related Mediums in `types/errors.ts` and the `JsonInputCodec` finding from RC-CORE-1.

**Structural fix.** Either delete `.unwrap()` and require `.match()` style at consumers, or change `.unwrap()` to throw the discriminant directly (`throw error;`) and rely on the caller's type narrowing. Both are pre-1.0 acceptable per no-BC.

### RC-CORE-4 — No-BC is convention without a CI gate

**Pattern.** Pre-1.0 no-BC is explicit doctrine; the repo still accumulates aliases and shims because no audit catches them.

**Findings this explains.**
- AC3 — 5 alias names for the 5-value status schema (`StatusValueSchema`, `DefaultPatternStatusSchema`, `PatternStatusSchema`, `AcceptedPatternStatusSchema`, `AcceptedStatusSchema`); `AcceptedPatternStatusSchema` is exported but unused (dead).
- High (arch) — `RuntimePatternGraph` alias of `PatternGraph`.
- High (arch) — two `ValidationSummary` shapes share the same exported name.
- High (quality) — `'codec' + 'Options'` string-concat strip in `config-loader.ts:189-197` (a back-compat shim dodging the lint).
- The "ADR-007 leftover" surface fields (`archRole`, `usecase`, `roadmapSpec`) extracted with no consumer.

**Structural fix.** Two complementary gates:
1. A "duplicate-named-exports across the public barrel" audit (the dangling-baseline mechanism extended). One name per concept.
2. An "unused-extracted-fields" diagnostic: any extractor output field with zero downstream consumer is flagged. Catches taxonomy leftovers like `archRole`.

Pre-1.0 the policy is "delete the alias, force consumers to update." The audit is what makes that policy mechanical.

### RC-CORE-5 — `read-api/` was decoupled from canonical schemas more than it had to be

**Pattern.** When `read-api/` was built, the canonical schemas in `validation-schemas/` were treated as too internal to expose externally. The result is hand-mirrored DTOs (Lossy Local Types) and a helper accidentally placed in the consumer that became a producer dependency.

**Findings this explains.**
- AC1 — `getPatternName` lives in `read-api/pattern-helpers.ts` but is imported by `extractor/` (`gherkin-extractor.ts:28`, `dual-source-extractor.ts:13`) and `generators/pipeline/` (`merge-patterns.ts:4`, `transform-dataset.ts:2`). Producer-→consumer cycle.
- AC2 — `PatternDependencies` / `PatternRelationships` / `ProtectionInfo` in `read-api/types.ts` hand-mirror `RelationshipEntry` / `Deliverable` / `ProtectionLevel`. `pattern-graph-api.ts:200-222` hand-projects fields one-by-one.
- Medium — `RuntimePatternGraph` overlap with `PatternGraph` (also RC-CORE-4).
- Medium — `pattern-classification.ts` re-exports pipeline internals (further coupling).

**ADR anchor.** ADR-006 §Anti-patterns names "Lossy Local Type" verbatim. The failure mode is happening *inside* the package that authors the anti-pattern definition.

**Structural fix.** Expose `RelationshipEntry`, `Deliverable`, `ProtectionLevel` directly from the public surface; delete the read-api mirrors; move `getPatternName` to `validation-schemas/extracted-pattern.ts` (next to its inputs). One coordinated commit. Pre-1.0, no compat layer.

### RC-CORE-6 — Conditional-spread + per-key dispatch as growth pattern

**Pattern.** Every new tag / field is added with another `...(x !== undefined ? { x } : {})` spread or another arm in a 40-case switch. The codebase grew that way and has ~95 such spreads in `buildGherkinPatternDraft` / `buildPattern` / `extractPatternTags`.

**Findings this explains (simplification themes).**
- H1 — `buildGherkinPatternDraft` is a 167-line conditional-spread pyramid.
- H2 — `buildPattern` is the same shape.
- H3 — `extractPatternTags` is a 350-line dispatch with ~45 named locals + a 40-case switch + ~50 conditional spreads.
- H4 — `collectDeprecatedTagDiagnostics` + `collectRoleDiagnostics` share dispatch.
- H5 — six near-identical `extract*Value` helpers.
- This pattern recurs ~80 times in `architect-projection`. Cross-package root cause; one helper addresses both.

**Structural fix.** Land `pickDefined()` once in `architect-core/src/utils/`, export it from the public surface, refactor all three Core sites. Estimated ~400 LOC removed in core; risk near-zero because `parseAtBoundary` re-validates after construction. Same helper used by projection (see RC-PROJ-3 in projection's report).

### RC-CORE-7 — Hygiene audits exist elsewhere but not here

**Pattern.** `architect-projection` ships `test:jsdoc-boilerplate-audit` and `test:barrel-audit`. `architect-core` has no equivalent, and the boilerplate has spread.

**Findings this explains.**
- Theme T3 from simplification — `### When to Use` boilerplate header in ~14 internal files.
- Theme T5 — `noUncheckedIndexedAccess` defensive guards duplicating caller-side invariants (~30 LOC).
- Several Medium-level public-surface bloat findings.

**Structural fix.** Port both audits from `architect-projection` to `architect-core` (or lift them to the workspace root). Sweep the boilerplate once; the audit prevents recurrence.

---

## Findings the synthesis does NOT explain (genuinely independent)

A small number of findings don't reduce to any of the seven root causes — flagged here so they aren't lost in the synthesis:

- **Catastrophic-backtracking risk** in `fileOptInPattern` (nested lazy quantifiers). Unique to that regex; not a pattern.
- **`safeRealpathSync` fallback weakens path-traversal check** — security finding specific to one helper.
- **`KNOWN_ACRONYMS` placeholder generator (`97 + placeholders.length`) overflows past 26** — current count is 35 acronyms; data bug, no root cause.
- **Sequential `await fs.readFile` vs unbounded `Promise.all`** — opposite concurrency bugs in sibling scanner files; could be unified with a bounded-parallelism helper but doesn't share root cause with the other findings.
- **`fs.readFileSync` size cap** missing in `doc-extractor.ts:204`.

These are five independent fixes, each surgical.

---

## Recommended Action Plan (root-cause ordered)

| Order | Root cause | Fix | Findings collapsed |
| ----- | ---------- | --- | ------------------ |
| 1 | RC-CORE-1 | Diagnostic bus + ESLint rule in `extractor/` | C1, C2, C3 + 3 Highs |
| 2 | RC-CORE-2 | `z.strictObject` codemod + lint rule on `validation-schemas/**` | C4 (19 sites) — has knock-on positive effect on `architect-projection` |
| 3 | RC-CORE-5 | Expose canonical schemas, delete read-api mirrors, move `getPatternName` | AC1, AC2 + 2 Medium |
| 4 | RC-CORE-4 | Duplicate-export audit + unused-field audit | AC3, 3 Highs |
| 5 | RC-CORE-6 | `pickDefined()` helper, refactor 3 sites | 8 High simplifications (~400 LOC) |
| 6 | RC-CORE-3 | Delete / harden `Result.unwrap` | C5 + 1 Medium |
| 7 | RC-CORE-7 | Port `jsdoc-boilerplate-audit` + `barrel-audit` from `architect-projection` | 14-file boilerplate sweep + future drift |
| — | independent | Five surgical fixes (regex, realpath, acronym overflow, scanner concurrency, file-size cap) | individual |

Ordering rationale: 1 and 2 close the trust boundary, which makes every downstream consumer (projection, guard, cli, mcp) safer. 3 and 4 are coordinated breaking changes — better to do together. 5 is the biggest LOC win and unlocks projection's parallel refactor. 6 and 7 are mechanical hygiene.

## Verification Suggestions

- Per-stage extractor diagnostic regression tests (RC-CORE-1) — proposed in the code-quality agent report.
- After RC-CORE-2: `pnpm test:dogfood` + `pnpm architect:query arch dangling --strict --baseline …` to confirm no projection consumer silently relied on extra fields.
- After RC-CORE-5: `pnpm architect:query bundle <Pattern>` round-trip on `DefineConfig` and `ConfigLoader` (verified-completed reference patterns) — structurally identical output before/after.
- After RC-CORE-6: `pnpm test:perf` in `architect-projection` should be flat or improved (fewer object allocations).

## Review Metadata

- Phase 1 agents: `cleanup-review:code-reviewer`, `cleanup-review:architect-review`,
  `cleanup-review:code-simplifier` (parallel)
- Bootstrap: `architect-base` + `architect-data-api` loaded for every agent
- ADR anchors used: 003, 006, 007, 009
- Read-only review — no source modifications
- **Synthesis note**: organised by root cause rather than by severity; severity counts and per-agent reports remain available in linked files for drill-down.
