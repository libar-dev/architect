# Simplification Review — `@libar-dev/architect-guard`

Review-only. Behavior-preserving simplifications, grouped by impact. All snippets
trimmed to the load-bearing fragment; line numbers point to the canonical site.

---

## High impact

### H1. `createViolation` casts away `exactOptionalPropertyTypes` instead of using a conditional spread

- **File:** `packages/architect-guard/src/lint/process-guard/decider.ts:445-461`
- **Current pattern**
  ```ts
  function createViolation(
    rule: ProcessGuardRule, severity: ViolationSeverity,
    message: string, file: string, suggestion?: string,
  ): ProcessViolation {
    const violation: ProcessViolation = { rule, severity, message, file };
    if (suggestion !== undefined) {
      (violation as { suggestion?: string }).suggestion = suggestion;
    }
    return violation;
  }
  ```
- **Simplified pattern**
  ```ts
  function createViolation(
    rule: ProcessGuardRule, severity: ViolationSeverity,
    message: string, file: string, suggestion?: string,
  ): ProcessViolation {
    return {
      rule, severity, message, file,
      ...(suggestion !== undefined ? { suggestion } : {}),
    };
  }
  ```
- **Behavior-preservation:** identical shape — the conditional spread already
  produces an object that satisfies `exactOptionalPropertyTypes`. Drops the
  `as` cast (which is the bigger smell; doctrine forbids `@ts-ignore`-class
  escapes, and a write-through cast on a fresh literal is the same family).
- **Verification:** `pnpm --filter @libar-dev/architect-guard typecheck && test`.

---

### H2. The decider's rule table re-encodes severity in two places — flag-arg vs returned `severity`

- **File:** `packages/architect-guard/src/lint/process-guard/decider.ts:166-234`
- **Current pattern.** `validateChanges` runs each rule, then in `strict` mode
  rewrites every warning to `{ severity: 'error' }` and rebuilds two arrays.
  Each rule body itself decides severity by passing the string `'error'` or
  `'warning'` into `createViolation`.

  ```ts
  for (const v of ruleViolations) {
    if (v.severity === 'error') violations.push(v);
    else warnings.push(v);
  }
  // ...
  const finalViolations = options.strict
    ? [...violations, ...warnings.map((w) => ({ ...w, severity: 'error' as const }))]
    : violations;
  const finalWarnings = options.strict ? [] : warnings;
  ```
- **Simplified pattern.** Promote in one pass while partitioning, removing
  the double traversal and the warning-map allocation:
  ```ts
  const promoted = options.strict;
  const finalViolations: ProcessViolation[] = [];
  const finalWarnings: ProcessViolation[] = [];
  for (const { rule, fn } of rules) {
    const ruleViolations = fn();
    events.push({ type: 'rule_checked', rule, passed: ruleViolations.length === 0 });
    for (const v of ruleViolations) {
      if (v.severity === 'error' || promoted) finalViolations.push(promoted ? { ...v, severity: 'error' } : v);
      else finalWarnings.push(v);
    }
  }
  ```
- **Behavior-preservation:** order of `finalViolations` differs only in the
  strict case (errors stay before promoted warnings, same as today because
  rule iteration order is preserved); event emission is unchanged.
- **Verification:** existing decider tests (`packages/architect-guard/tests`)
  cover both `strict: true` and `strict: false`. Re-run.

---

### H3. `detectStatusTransitions` re-parses the captured `rawLine` after already extracting it

- **File:** `packages/architect-guard/src/lint/process-guard/detect-changes.ts:430-471`
- **Current pattern.** The hot loop captures `{ lineNumber, insideDocstring, rawLine }`
  for each `validAddedTag` / `removedTag`. Then the post-loop builder calls
  `statusPattern.exec(state.validAddedTag.rawLine)` and
  `statusPattern.exec(state.removedTag.rawLine)` AGAIN to recover the matched
  status string — even though that exact match was already in scope when the
  location was captured.
- **Simplified pattern.** Add the parsed status to `StatusTagLocation` (or a
  local extension), assign it at capture time, and read it at build time:
  ```ts
  interface ParsedStatusTag extends StatusTagLocation { readonly status: ProcessStatusValue; }
  // capture:
  state.validAddedTag = { lineNumber: ..., insideDocstring: ..., rawLine: line, status: toStatus };
  // build:
  const toStatus = state.validAddedTag.status;
  const fromStatus = state.removedTag?.status ?? DEFAULT_STATUS;
  ```
- **Behavior-preservation:** identical transitions emitted. Saves two `RegExp.exec`
  calls per file with a status change and removes the awkward
  `tryParseProcessStatusValue(toMatch?.[1])` chain at the end.
- **Verification:** `tests/lint/process-guard/detect-changes.test.ts` covers
  hunk-relative line numbers, docstring-aware filtering, and unlock-reason
  carry-through.

---

### H4. Two near-identical `discoverFiles` / `readFileSafe` / `buildSummary` blocks across the two runners

- **Files:**
  - `packages/architect-guard/src/lint/steps/runner.ts:114-175`
  - `packages/architect-guard/src/lint/idea-tier/runner.ts:40-95`
- **Current pattern.** Both runners define identical `discoverFiles`,
  `readFileSafe`, and a structurally identical `buildSummary` that walks
  violations and tallies `error / warning / info` via a `switch`.
- **Simplified pattern.** Lift to a shared module — e.g.
  `packages/architect-guard/src/lint/_runner-utils.ts`:
  ```ts
  export function discoverFiles(patterns: readonly string[], baseDir: string): readonly string[] { ... }
  export function readFileSafe(filePath: string): string | null { ... }
  export function buildLintSummary(
    violationsByFile: Map<string, LintViolation[]>,
    filesScanned: number,
  ): LintSummary { /* uses summarizeLintResults from tier-a-baseline */ }
  ```
  `tier-a-baseline.ts` already exports `summarizeLintResults` with the same
  severity-tally semantics — both runners should call it instead of
  re-implementing the switch.
- **Behavior-preservation:** identical `LintSummary` output. Removes ~60
  duplicated LOC and one severity-tally maintenance point.
- **Verification:** runner-level vitest coverage exists for both modules.
  Add no new tests; existing ones pin the output shape.

---

### H5. Five anti-pattern detectors share the same `readFileSync + line-walk + try/catch` skeleton

- **File:** `packages/architect-guard/src/validation/anti-patterns.ts:148-313`
- **Current pattern.** `detectRemovedTags`, `detectMagicComments`,
  `detectMegaFeature` each open the file, split by `\n`, walk lines, and wrap
  the whole block in `try { ... } catch { /* ignore */ }`. The catch
  intentionally swallows file-deleted-mid-scan errors but is identical at
  every site.
- **Simplified pattern.** Single helper:
  ```ts
  function withFeatureLines<T>(
    feature: ScannedGherkinFile,
    fn: (lines: readonly string[]) => T,
  ): T | undefined {
    try {
      return fn(readFileSync(feature.filePath, 'utf-8').split('\n'));
    } catch {
      return undefined;
    }
  }
  ```
  Each detector becomes a 5-10 line body that returns its violations.
- **Behavior-preservation:** identical error-swallowing semantics; identical
  per-line iteration.
- **Verification:** unit tests for each detector exist; rerun after refactor.
  This is also a clean place to delete the three duplicated `// Ignore read
  errors — file may have been deleted` comments (WHY-comment redundant once
  the helper is named).

---

### H6. Cross-source matching repeats `getPatternName(p).toLowerCase()` and `tsByName` / `gherkinByName` index construction

- **File:** `packages/architect-guard/src/cli/validate-patterns.ts:423-578`
- **Current pattern.** Two near-mirror loops (TS→Gherkin then Gherkin→TS),
  each with its own `isDirectNameMatch` + `hasCrossSourceRelationshipMatch`
  fall-through, then a third loop for `getDeliverableWorkflowPatterns`, then
  a fourth for dependency-existence. Each builds its own
  `name.toLowerCase()` lookup keys ad-hoc.
- **Simplified pattern.** Hoist `getPatternName(p).toLowerCase()` into a
  cached pair at index-build time, and inline `isDirectNameMatch` (it's a
  three-line predicate used twice):
  ```ts
  function indexByLowerName(patterns: readonly ExtractedPattern[]) {
    return new Map(patterns.map((p) => [getPatternName(p).toLowerCase(), p] as const));
  }
  const tsByName = indexByLowerName(tsPatterns);
  const gherkinByName = indexByLowerName(gherkinPatterns);
  ```
  Then factor the two `direction → unmatched` walks into one function
  parameterized on `(source, sourceByName, targetByName, reportSeverity)`.
  Eliminates ~60 LOC of mirrored prose without changing diagnostics.
- **Behavior-preservation:** issue order matches today's (deterministic
  source iteration). Verifiable by snapshotting `validatePatterns(dataset)`
  output for a fixed dataset.
- **Verification:** `validate-patterns` CLI smoke-tests in the dogfood
  harness plus the unit tests in `packages/architect-guard/tests`.

---

## Medium impact

### M1. `severity` tally is implemented as a `switch` in four places — replace with `Record<LintSeverity, number>`

- **Files:**
  - `lint/engine.ts:137-148`
  - `lint/steps/runner.ts:152-164`
  - `lint/idea-tier/runner.ts:71-83`
  - `lint/tier-a-baseline.ts:1076-1089`
- **Current pattern.** Each site declares
  `let errorCount = 0; let warningCount = 0; let infoCount = 0;` then
  switches on `violation.severity`.
- **Simplified pattern.**
  ```ts
  const counts: Record<LintSeverity, number> = { error: 0, warning: 0, info: 0 };
  for (const v of violations) counts[v.severity]++;
  return { errorCount: counts.error, warningCount: counts.warning, infoCount: counts.info, ... };
  ```
  Combined with H4 this becomes one function. The `Record` form also makes
  it obvious that severity is closed-set and not "two booleans plus an info
  count" — which connects to the broader "bool flags should be the
  three-level severity enum" theme.
- **Behavior-preservation:** identical totals.
- **Verification:** existing summary tests.

---

### M2. Hunk-header `\d+` parsing duplicated for the same hunk pattern

- **File:** `packages/architect-guard/src/lint/process-guard/detect-changes.ts:355,386-393`
- **Current pattern.** `hunkHeaderPattern.exec(line)` returns groups whose
  first element is then `parseInt(hunkMatch[1], 10) - 1`. The pattern is
  defined as a `RegExp` literal at top of function; nothing else uses it.
- **Simplified pattern.** Inline as a numeric capture and skip the literal
  match → groups → parseInt round-trip:
  ```ts
  const hunkMatch = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(line);
  if (hunkMatch) {
    state.newLineNumber = Number(hunkMatch[1]) - 1;
    state.insideDocstring = false;
    continue;
  }
  ```
  Marginal but it's one less compile-time-vs-runtime indirection and lets
  the reader see the hunk shape inline. Worth combining with H3.
- **Behavior-preservation:** identical line-tracking.

---

### M3. `extractDataTableColumnValues` flattens column-key fallback unnecessarily

- **File:** `packages/architect-guard/src/lint/process-guard/session-state-reader.ts:207-229`
- **Current pattern.**
  ```ts
  const value = columnKeys.map((key) => row[key]).find((c) => c !== undefined);
  ```
  Allocates an intermediate array for the sake of `.find`.
- **Simplified pattern.**
  ```ts
  for (const key of columnKeys) {
    const candidate = row[key];
    if (candidate !== undefined) { values.push(candidate); break; }
  }
  ```
  Same semantics, allocation-free. Trivial but the file is on the hot path
  for every guard run.

---

### M4. `detectIdeaTier` builds two distinct return shapes for the same data — collapse via single trailing return

- **File:** `packages/architect-guard/src/lint/idea-tier/idea-tier-checks.ts:71-99`
- **Current pattern.** Three returns: early "no gate" return, then a
  "matched maturity:idea" return, then a final fallthrough — each spelling
  out the full object literal.
- **Simplified pattern.** Compute `isIdeaTier` once and return:
  ```ts
  const ideaLevel = level === 'epic' || level === 'slice' ? level : undefined;
  const isIdeaTier = hasGate && explicitMaturity === 'idea';
  return {
    isIdeaTier,
    explicitArchitectTagCount: hasGate ? explicitArchitectTagCount : explicitArchitectTagCount,
    hasParentTag: hasGate ? hasParentTag : hasParentTag,
    level: hasGate ? ideaLevel : undefined,
  };
  ```
  The no-gate branch differs only in `level: undefined`, which is itself
  the same as `ideaLevel` when there is no `@architect-level` — verify and
  collapse if so.
- **Behavior-preservation:** preserve the "no gate ⇒ level undefined" rule
  via the conditional. Saves two literal-object copies, reduces three exit
  points to one.

---

### M5. `extractAcceptanceCriteriaScenarios` duplicates the predicate from `hasAcceptanceCriteria`

- **File:** `packages/architect-guard/src/validation/dod-validator.ts:56-82`
- **Current pattern.** Two functions, identical filter:
  ```ts
  const semanticMatch = scenario.semanticTags.some((tag) => tag.toLowerCase() === 'acceptance-criteria');
  const tagMatch = scenario.tags.some((tag) => tag.toLowerCase() === 'acceptance-criteria');
  return semanticMatch || tagMatch;
  ```
- **Simplified pattern.** Extract a predicate, share it:
  ```ts
  function isAcceptanceCriteriaScenario(scenario: ExtractedScenario): boolean {
    const all = [...scenario.semanticTags, ...scenario.tags];
    return all.some((t) => t.toLowerCase() === 'acceptance-criteria');
  }
  export const hasAcceptanceCriteria = (p) => (p.scenarios ?? []).some(isAcceptanceCriteriaScenario);
  export const extractAcceptanceCriteriaScenarios = (p) =>
    (p.scenarios ?? []).filter(isAcceptanceCriteriaScenario).map((s) => s.scenarioName);
  ```
- **Behavior-preservation:** identical scenario set returned.

---

### M6. Step-checks: two `describeFeature(/...) ` regex scans for the same line-locator

- **File:** `packages/architect-guard/src/lint/steps/cross-checks.ts:118-126,169-177`
- **Current pattern.** `checkMissingAndDestructuring` and
  `checkMissingRuleWrapper` each walk the step file linearly to find the
  line of the first `describeFeature(`. Different functions, identical
  search.
- **Simplified pattern.** A single helper:
  ```ts
  function locateDescribeFeatureLine(stepContent: string): number {
    const lines = stepContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/describeFeature\s*\(/.test(lines[i] ?? '')) return i + 1;
    }
    return 1;
  }
  ```
- **Behavior-preservation:** identical line attribution.

---

### M7. `branch-diff.getChangedFilesList` is a near-clone of the first half of `detect-changes.detectBranchChanges`

- **Files:**
  - `packages/architect-guard/src/git/branch-diff.ts:46-59`
  - `packages/architect-guard/src/lint/process-guard/detect-changes.ts:148-186`
- **Current pattern.** Both run the same three git invocations
  (`merge-base`, `diff --name-status -z`, then the parsing) and both
  wrap in `try { ... } catch (error) { return R.err(...) }`. `branch-diff`
  intentionally drops deleted files, but the prefix is identical.
- **Simplified pattern.** Either:
  - Extract a shared internal `getMergeBaseNameStatus(baseDir, baseBranch): Result<ParsedGitNameStatus>`
    and have both callers consume it; or
  - Have `getChangedFilesList` delegate to `detectBranchChanges` and slice
    the relevant fields (`modifiedFiles + addedFiles`).
  The first is cleaner because it preserves the "branch-diff doesn't depend
  on the lint layer" doctrine in the file header.
- **Behavior-preservation:** identical files returned (modified ∪ added).
- **Verification:** existing branch-diff + detect-changes vitests.

---

### M8. Five step-check files share a near-identical `for (let i = 0; i < lines.length; i++) { const line = lines[i]; if (line === undefined) continue; ... }` skeleton

- **Files:** `feature-checks.ts`, `step-checks.ts`, `cross-checks.ts`,
  `idea-tier-checks.ts`, `detect-changes.ts`.
- **Current pattern.** Every check function opens with the same
  `noUncheckedIndexedAccess` boilerplate. Project doctrine forbids
  silencing the strict flag, but the loop shape is mechanical.
- **Simplified pattern.** A typed iterator helper:
  ```ts
  function* enumerateLines(content: string): Iterable<{ readonly line: string; readonly lineNumber: number }> {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined) yield { line, lineNumber: i + 1 };
    }
  }
  // call site:
  for (const { line, lineNumber } of enumerateLines(content)) { ... }
  ```
- **Behavior-preservation:** identical iteration; the guard for `undefined`
  is now centralized. Eliminates a defensive-guard pattern repeated ~20×
  across the package while remaining strict-mode-compliant.
- **Verification:** call-site behaviour is line-by-line equivalent; existing
  unit tests cover each check.

---

### M9. `checkForbiddenLinePattern` already exists but `checkRuleHasInvariant` open-codes its own walk

- **File:** `packages/architect-guard/src/lint/idea-tier/idea-tier-checks.ts:127-228`
- **Current pattern.** `checkNoScenarios` and `checkNoBackground` route
  through `checkForbiddenLinePattern`. `checkRuleHasInvariant` needs
  state (current rule, invariant-seen) so it can't reuse the helper —
  but the file would read better if the two API shapes were named and
  collocated so the reader knows which is which.
- **Simplified pattern.** Rename and group:
  ```ts
  // ── stateless single-pattern checks ─────────────────────────
  const checkNoScenarios   = (lines, file) => checkForbiddenLinePattern(...);
  const checkNoBackground  = (lines, file) => checkForbiddenLinePattern(...);
  // ── stateful checks (need rule-context) ─────────────────────
  function checkRuleHasInvariant(lines, file) { ... }
  ```
  Then drop the `function flush(): void` nested closure inside
  `checkRuleHasInvariant` (it captures three locals; turning them into a
  reducer-state object lets `flush` be a normal top-level function and
  removes the closure allocation cost in the hot path).

---

### M10. `detectDeliverableChanges` correlates added/removed via `Set` + `filter` + `filter` — quadratic in the worst case and triple-traversal in the common one

- **File:** `packages/architect-guard/src/lint/process-guard/detect-changes.ts:596-616`
- **Current pattern.**
  ```ts
  for (const deliverable of [...change.added]) {
    if (removedSet.has(deliverable)) {
      change.modified.push(deliverable);
      change.added = change.added.filter((d) => d !== deliverable);
      change.removed = change.removed.filter((d) => d !== deliverable);
    }
  }
  ```
- **Simplified pattern.** Single pass that partitions:
  ```ts
  const removedSet = new Set(change.removed);
  const stillAdded: string[] = [];
  for (const d of change.added) {
    if (removedSet.has(d)) { change.modified.push(d); removedSet.delete(d); }
    else stillAdded.push(d);
  }
  change.added = stillAdded;
  change.removed = [...removedSet];
  ```
  Linear, allocation-light, semantically equivalent (modulo array order in
  `removed` — if order is observable, snapshot tests will tell us).
- **Behavior-preservation:** modified set identical; verify ordering
  expectation in `detectDeliverableChanges` tests.

---

### M11. `process-guard` `boolean` flags should match the Process Guard's three-level severity

- **File:** `packages/architect-guard/src/lint/process-guard/types.ts:164-181,302-305`
- **Current pattern.** `ProcessViolation.severity: 'error' | 'warning'` and
  `DeciderEvent { type: 'rule_checked'; ...; passed: boolean }`. The
  Process Guard's actual three-level vocabulary is `pass | warn | blocked`
  (scope-validate language) — the existing `boolean passed` flag collapses
  `warn` and `blocked` into a single `false`, which makes downstream code
  re-derive severity by re-checking violation arrays.
- **Simplified pattern.** Either widen the event:
  ```ts
  | { type: 'rule_checked'; rule: ProcessGuardRule; verdict: 'pass' | 'warn' | 'blocked' }
  ```
  …or keep `passed: boolean` and split `severity` out of the event entirely
  (consumers already get the same info from the returned violations).
  Pre-1.0 / no-BC: pick one verdict shape. The current pair encodes the
  same fact twice in incompatible vocabularies.
- **Behavior-preservation:** depends on whether anything outside this
  package consumes `DeciderEvent`. Package surface is barrel-only — a quick
  callsite sweep should clear it.
- **Verification:** package-level unit tests + dogfood smoke.

---

## Low impact

### L1. Comment-only WHAT noise per doctrine

- **Files:** scattered.
- Examples — these comments restate code visible on the next line and
  should be deleted (the function name carries the WHAT; the WHY is
  absent or already encoded in the JSDoc above):
  - `decider.ts:172` `// Emit start event`
  - `decider.ts:177-195` `// Run each rule`
  - `decider.ts:211` `// In strict mode, promote warnings to violations`
    (this one is borderline-WHY; keep if `M11` lands).
  - `detect-changes.ts:265-267` `// === === Status Transition Detection ===`
    (duplicated `===` separator — typo).
  - `validate-patterns.ts:597,650-656` summary-construction comments.
  - `anti-patterns.ts:186-188,237-239,307-309` `// Ignore read errors — file may have been deleted`
    (covered by H5's helper rename).
- **Behavior-preservation:** none — deletions only.

---

### L2. Duplicated section separator typo

- **File:** `lint/process-guard/detect-changes.ts:265-267`
  ```ts
  // =============================================================================
  // =============================================================================
  // Status Transition Detection
  ```
  Stray duplicated divider. Delete one.

---

### L3. `helpers.ts` describes itself with the wrong "when to use" template

- **File:** `packages/architect-guard/src/git/helpers.ts:14-17`
  ```
  ### When to Use
  - As a typed contract / data shape consumed by projection or render layers.
  ```
  This block is the boilerplate from a different pattern role (contract /
  data shape). `GitHelpers` is `@architect-role:utility`. The "When to Use"
  reads as a copy-paste artifact and should either be deleted or rewritten
  to describe utility-execution use. Same issue at `name-status.ts:14-17`.
- **Behavior-preservation:** docstring-only.

---

### L4. `decider.ts` JSDoc carries an "Error Guide Content" Markdown manual

- **File:** `packages/architect-guard/src/lint/process-guard/decider.ts:37-116`
- **Current pattern.** ~80 lines of user-facing error-guide tables embedded
  in the file JSDoc — situation/solution/example matrices for five rules.
- **Simplified pattern.** This content is documentation, not code-local
  rationale. Move to `architect/decisions/` (or, since these are reference
  docs, to `docs-sources/process-guard-errors.md`) and replace with a
  one-line forward link. The current location bloats the file by ~16% and
  duplicates per-rule rationale already present in the validators
  themselves.
- **Behavior-preservation:** code unchanged.

---

### L5. `isDeliverableComplete` is a thin re-export wrapper

- **File:** `packages/architect-guard/src/validation/dod-validator.ts:43-45`
  ```ts
  export function isDeliverableComplete(deliverable: Deliverable): boolean {
    return isDeliverableStatusComplete(deliverable.status);
  }
  ```
- **Simplified pattern.** Either delete (callers use
  `isDeliverableStatusComplete` directly) or alias-export from
  `architect-core`. No-BC doctrine: prefer deletion + callsite update.
- **Verification:** grep `isDeliverableComplete` — appears to be exported
  but only used locally based on the visible code path; confirm before
  deleting.

---

### L6. `escapeRegex` is a one-call utility — inline or move to `_shared`

- **File:** `packages/architect-guard/src/lint/process-guard/detect-changes.ts:298-300`
- The helper exists for one call site (`statusPattern` construction).
  Either inline at the construction site or move to a shared utility
  module — the same helper likely exists in `architect-core`'s tag-prefix
  handling code, and re-declaring it here is mild duplication.

---

### L7. `findRepoRoot` walks parents with `for (;;)` and an inner break — replace with `while`

- **File:** `packages/architect-guard/src/lint/tier-a-baseline.ts:1119-1131`
- Cosmetic. `for (;;)` reads like an infinite loop; `while (current !== path.dirname(current))`
  expresses the termination condition at the top.

---

### L8. `tagPrefix` lookup is repeated at every detect entry point

- **File:** `packages/architect-guard/src/lint/process-guard/detect-changes.ts:111,153,201`
  ```ts
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  ```
  All three `detectStagedChanges` / `detectBranchChanges` / `detectFileChanges`
  open with this. Single helper:
  ```ts
  const resolveTagPrefix = (options?: ChangeDetectionOptions) =>
    options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  ```
  Companion to H5's "pull WHY into a named helper" theme.

---

## Cross-cutting themes

1. **Single source of severity tally.** Five files implement the same
   `error/warning/info` switch (M1, H4, H5). The `LintSummary` shape lets
   `summarizeLintResults` already in `tier-a-baseline.ts` own this — the
   other four sites should call it.

2. **`for (let i...)` + `noUncheckedIndexedAccess` guard is a package-wide
   shape.** ~20 occurrences. A typed `enumerateLines` iterator (M8) makes
   the strict-mode guard cost zero. This is the highest-frequency
   defensive-guard pattern in the package.

3. **`createViolation` casts contradict no-BC doctrine.** H1 is the visible
   case in `decider.ts`. A repo-wide grep for `as { suggestion?: string }`
   and similar should turn up siblings — the conditional-spread alternative
   is shorter and strict-mode-clean.

4. **WHAT-restating comments at section starts (H1.5, M2.5, L1).** Doctrine
   is "default no comments". The package opens many functions with
   `// Emit start event`, `// Run each rule`, etc. These should be deleted
   wholesale unless they explain a non-obvious WHY (e.g., the comment at
   `decider.ts:289-298` explaining the `transition.to === 'completed' &&
   hasUnlockReason` bypass IS load-bearing — it documents the FSM carve-out).

5. **Git helpers leak through two parallel paths.** `branch-diff` was
   created to decouple "generators layer" from "lint layer", but the lint
   layer (`detect-changes`) and `branch-diff` now both run the same
   `merge-base + name-status -z` prefix. The decoupling did its job at the
   architectural level; the implementation-level duplication (M7) wants
   one more small extraction.

6. **Three-level severity vocabulary is half-encoded.** Process-Guard
   speaks `pass | warn | blocked` in scope-validate but `'error' | 'warning'`
   inside the decider. The Boolean `passed` flag in `DeciderEvent`
   collapses the vocabulary further. M11 is the doctrinal alignment; H2 is
   the resulting simplification.

7. **No `@deprecated` shims spotted.** Pre-1.0 / no-BC review found no
   parallel-implementation aliases or `@deprecated` markers to call out for
   deletion in this package. The earlier "taxonomy moved from JSON to TS"
   migration left only comment residue (`detect-changes.ts:24-27`,
   `types.ts:204-209`) — useful WHY, keep.
