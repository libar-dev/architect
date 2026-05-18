# Pre-W-DOCS-1 debt cleanup — implementation plan

## Context

The `architect-projection` final-improvements campaign landed cleanly (commits `c74814f` → `a4c2ddb`); two parallel reviews (`pr-review-toolkit:code-reviewer` + `code-simplifier:code-simplifier`) both returned "ship" verdicts with 4 polish items each. The readiness review at `.pr-coordination/PRE-WDOCS-READINESS.md` consolidated those reviewer findings with the open items in root `REMAINING-WORK.md § 1.5.x / § Wave 2 follow-up` into 10 actionable debt items.

The user is preparing to start the W-DOCS-1 PoC (per `.pr-coordination/DECISIONS.md` D4'/D10/D12). Before that critical work begins, they want the substrate fully clean: no uncommitted hunks, no style drift that will tangle with docs churn, no known polish that will be referenced in future PRs.

**Outcome:** a working tree at known-clean state, with the projection substrate ratified and two open audits (CLI invocation-dir, `@architect-usecase`) carrying explicit decisions or backlog entries. From there, the W-DOCS-1 PoC opens on a fresh branch (`campaign/wdocs-1-poc`) from a release-candidate base.

**Scope verified via 1 Explore agent pass** — every file:line cited below has been read and confirmed.

---

## Scope (11 items, ~3.5 hours total)

One item was added beyond the readiness doc: the `state.reportPath!` non-null assertions in `business-rule-set-report.steps.ts:738,747` (item 11). Code-reviewer flagged as "trivial; ignore unless restructuring" — included here because the user asked for full scope.

---

## Execution sequence — 7 commits

User-confirmed decisions on items 9 and 10 promoted both from audit-only to real commits. Each commit independently revertable. Verification gates between commits.

```text
Commit A:  fix(tests): correct guard package root and pin new CLI help footer  (item 1)
Commit B:  style: repo-wide prettier sweep                                     (item 2)
Commit C:  refactor(projection): polish backlog from final-improvements review (items 3, 4, 5, 6, 11)
Commit D:  refactor(projection): drop defensive proxy method rebinding         (item 8)
Commit E:  refactor(projection): rename embedded deliverable schemas           (item 7)
Commit F:  fix(cli): invert resolveInvocationDir precedence (cwd > INIT_CWD > PWD)  (item 9)
Commit G:  refactor(taxonomy): retire @architect-usecase                       (item 10)
```

Branching: do all work on the current branch (`campaign/docs-and-skills-consolidation`). After commit G, this branch is at release-candidate state. Cut `campaign/wdocs-1-poc` from its tip when W-DOCS-1 starts.

---

## Per-item detail

### Item 1 — Commit the two uncommitted fixup hunks (5 min)

**Commit A.** Both reviewers verified these are legitimate fixups, not scope creep.

Files (already modified, just stage and commit):

- `tests/support/helpers/cli-runner.ts:63` — `GUARD_PACKAGE_ROOT` path: `../../../../architect-guard` → `../../../packages/architect-guard`. Old path resolved outside the repo (`/Users/darkomijic/dev-projects/architect-guard`, doesn't exist); new path resolves to `/Users/darkomijic/dev-projects/architect/packages/architect-guard` (verified).
- `tests/steps/cli/data-api-help.steps.ts:62-63` — `FROZEN_GLOBAL_FLAGS` extended with two lines matching `packages/architect-cli/src/cli/commands/_shared/help.ts:29-30` byte-for-byte (verified by reading both).

```bash
git add tests/support/helpers/cli-runner.ts tests/steps/cli/data-api-help.steps.ts
git commit -m "fix(tests): correct guard package root and pin new CLI help footer

cli-runner: GUARD_PACKAGE_ROOT pointed outside the repo
(../../../../architect-guard → ../../../packages/architect-guard).
Mirror of the architect-cli path fix in cf7abe8; same root cause.

data-api-help: FROZEN_GLOBAL_FLAGS now pins the two-line
\"Agent environments: load the architect-data-api skill ...\" footer
added to architect-cli/src/cli/commands/_shared/help.ts."
```

**Verify:** `pnpm --filter @libar-dev/architect-projection test && pnpm test:dogfood`

---

### Item 2 — Repo-wide Prettier sweep (30 min)

**Commit B.** One atomic style commit, before any code-content changes in this batch. Per root `REMAINING-WORK.md § Wave 2 follow-up`: 317 files with style drift from the W1.5 lift.

```bash
pnpm format
pnpm format:check                                # must exit 0
pnpm -r lint && pnpm typecheck && pnpm -r test   # must stay green
git add -A
git commit -m "style: repo-wide prettier sweep (deferred from W1.5 lift)

317 files with format drift after W1.5 lifted dogfood content to repo
root under a slightly different prettier config. Single atomic sweep so
subsequent W-DOCS-1+ doc generation work doesn't tangle generated-content
churn with formatting churn."
```

**Risk:** if any file is hand-formatted intentionally (e.g., aligned tables in markdown), the sweep flattens it. Spot-check by skimming the diff on any `.feature`, `.md`, or `.json` files that look like they might have intentional alignment. If found, add `.prettierignore` entry before sweep and re-run.

**Verify:** all three commands above must be clean. Pay particular attention to `.feature` files — Gherkin step indentation can confuse prettier's markdown handling.

---

### Item 3 — Add WHY comment to `splitOversizedDocument` (5 min)

**Commit C (group).** `packages/architect-projection/src/renderers/render-markdown.ts:2158-2164`.

The function calls `renderMarkdownDocument` twice per split child (first at ~2145-2151 with mode `'measure'`, second at 2158-2164 with mode `'emit'`). A future reader sees two renders and assumes one is dead or memoizable. It isn't: the `splitChildDocument` differs from the measured `subDocument` because a `linkOut` is prepended between the two calls.

Add one-line comment immediately above the second `renderMarkdownDocument(splitChildDocument, ...)` call:

```ts
// Re-renders splitChildDocument (not subDocument) — linkOut was prepended after the measure pass, so the emit output is genuinely different.
```

**Verify:** `pnpm --filter @libar-dev/architect-projection test` (comment-only change; should not affect any test).

---

### Item 4 — Hoist discarded `getMetricValue` calls to named assertion (10 min)

**Commit C (group).** `packages/architect-projection/tests/perf/compare-baseline.mjs:161-162`.

Current:

```javascript
getMetricValue(bundles, documentType, 'p50Ms');
getMetricValue(bundles, documentType, 'iterations');
```

These are intentional validation side-effects — `getMetricValue` throws if the field is missing. But the bare calls with discarded returns read like dead code.

Hoist into a named helper at module scope:

```javascript
function assertMetricFieldsPresent(metricsHost, key, fields) {
  for (const field of fields) {
    getMetricValue(metricsHost, key, field);
  }
}
```

Replace the two bare calls with:

```javascript
assertMetricFieldsPresent(bundles, documentType, ['p50Ms', 'iterations']);
```

**Verify:** `pnpm --filter @libar-dev/architect-projection test` — the perf gate runs the comparator end-to-end; missing fields throw with the same error message wording.

---

### Item 5 — Collapse `tryParseLogicalRouteId` to switch form (20 min)

**Commit C (group).** `packages/architect-projection/src/routing/route-id.ts:77-111`.

Current shape: three sequential `if (segments.length === 2 && second === 'index')` / `if (segments.length === 2)` / `if (segments.length === 4)` branches, each with its own `isLogicalRouteSegment` checks.

Target shape:

```ts
function tryParseLogicalRouteId(value: string): ParsedLogicalRouteId | undefined {
  const segments = value.split('/');
  if (!segments.every(isLogicalRouteSegment)) return undefined;
  const [documentType, second, third, fourth] = segments;
  if (documentType === undefined) return undefined;
  switch (segments.length) {
    case 2:
      if (second === 'index') return { documentType, kind: 'index' };
      return { documentType, kind: 'entity', stableEntityId: second! };
    case 4:
      return {
        documentType,
        kind: 'child',
        stableEntityId: second!,
        childKind: third!,
        stableChildId: fourth!,
      };
    default:
      return undefined;
  }
}
```

Two callers verified: `parseLogicalRouteId` at line 65 (same file, internal) and `renderers/markdown-paths.ts:4,16`. No tests pin branch behavior directly — coverage is via integration tests.

The `noUncheckedIndexedAccess: true` flag (per `tsconfig.architect-base.json`) makes the destructured `second`/`third`/`fourth` typed as `string | undefined`. The `segments.every(isLogicalRouteSegment)` precondition narrows to defined-and-string at runtime, but TypeScript can't see it. Use `!` non-null assertions after the `every` check (mirror the existing pattern in the file if any; otherwise these are the only `!` introductions).

**Alternative if `!` is undesirable:** explicit narrowing

```ts
case 2: {
  if (second === undefined) return undefined;
  if (second === 'index') return { documentType, kind: 'index' };
  return { documentType, kind: 'entity', stableEntityId: second };
}
```

Slightly more verbose but no `!`. Recommend the explicit narrowing form — it's more honest about the type system's view.

**Verify:** `pnpm --filter @libar-dev/architect-projection test && pnpm --filter @libar-dev/architect-projection typecheck`. Integration tests cover all three branch outcomes via the markdown renderer.

---

### Item 6 — Compare-baseline comparator dedup (45 min)

**Commit C (group).** `packages/architect-projection/tests/perf/compare-baseline.mjs`.

Four near-identical comparators (lines 68-89, 91-111, 113-134, 153-177) all do the same shape:

1. Read actual metric value
2. Read baseline metric value
3. Compute effective budget = `min(hardBudget, baseline × 1.5)`
4. Compare actual to budget; throw with a labeled message on overage
5. Print a status line

Target shape: one helper, four call sites.

```javascript
/**
 * @param {object} args
 * @param {string} args.label                Display label for the metric (used in throw + status line).
 * @param {number} args.actual               Measured value.
 * @param {number} args.baselineValue        Baseline value for the same metric.
 * @param {number} args.hardBudget           Absolute ceiling regardless of baseline.
 * @param {string} args.unit                 Unit suffix for display ('ms', 'iter', etc.).
 */
function checkBudget({ label, actual, baselineValue, hardBudget, unit }) {
  const baselineBudget = baselineValue * BASELINE_DRIFT_MULTIPLIER;
  const effectiveBudget = Math.min(hardBudget, baselineBudget);
  if (actual > effectiveBudget) {
    throw new Error(
      `[perf] ${label} exceeded budget: ${actual.toFixed(2)}${unit} > ` +
        `${effectiveBudget.toFixed(2)}${unit} ` +
        `(hard=${hardBudget}${unit}, baseline=${baselineValue.toFixed(2)}${unit})`,
    );
  }
  console.log(
    `[perf] ${label}: ${actual.toFixed(2)}${unit} ` +
      `(budget=${effectiveBudget.toFixed(2)}${unit})`,
  );
}
```

Each existing comparator becomes a one-line call. Net diff: ~200 → ~100 lines (estimate from the readiness doc, validated by reading the file).

**Sequencing within Commit C:** do item 4 (hoist `assertMetricFieldsPresent`) before this one, so the helper is available when `checkRenderMarkdownBundleMetrics` is refactored.

**Verify:** `pnpm --filter @libar-dev/architect-projection test`. The perf gate is the only consumer of this file; if the comparator changes break it, the test suite fails loudly.

---

### Item 7 — Rename embedded `DeliverableManifestSchema` + `DeliverableSchema` (30 min)

**Commit E (separate).** `packages/architect-projection/src/fragments/pattern-relations/supporting.ts:52-55, 97-98`.

Renames (within `pattern-relations/supporting.ts` only):

- `DeliverableManifestSchema` → `EmbeddedDeliverableManifestSchema`
- `DeliverableSchema` → `EmbeddedDeliverableSchema`
- `DeliverableManifest` (type) → `EmbeddedDeliverableManifest`
- `Deliverable` (type) → `EmbeddedDeliverable`

After rename, drop the `ExecutionContextDeliverableManifestSchema` / `ExecutionContextDeliverableSchema` import aliases in `supporting.ts:14-15` (no longer needed since names no longer collide; import the canonical names directly).

**Caller updates required:**

1. `packages/architect-projection/src/fragments/pattern-relations/pattern-detail.ts:16-17, 28, 33` — switch imports to the `Embedded*` names; usage sites at 28, 33 update.
2. `packages/architect-projection/src/fragments/delivery-reporting/supporting.ts:16, 43` — imports `DeliverableSchema` from pattern-relations. Update to `EmbeddedDeliverableSchema`.
3. `packages/architect-guard/src/lint/tier-a-baseline.ts:576, 582` — hardcoded baseline strings `'DeliverableManifestSchema'` and `'DeliverableSchema'` reference the _projection_ pattern-relations definitions. Update to `'EmbeddedDeliverableManifestSchema'` and `'EmbeddedDeliverableSchema'`, OR update the lint expectation if the rule was checking for the canonical names (read context before editing — if the lint rule was _flagging_ the duplicate, it stays unchanged and becomes a no-op).

**NOT touched by this rename:**

- `packages/architect-projection/src/fragments/execution-context/{deliverable,deliverable-manifest}.ts` — canonical names stay
- `packages/architect-core/src/validation-schemas/dual-source.ts:44,53` — third definition discovered during exploration; cross-package collision is NOT the simplifier's stated trigger. Out of scope.
- `packages/architect-projection/tests/fixtures/fragments.ts:1518-1519` — fixture dispatch table keyed by **canonical** schema names (`DeliverableSchema`, `DeliverableManifestSchema`). These keys map to the _execution-context_ schemas (verified at fixture file lines 10, 14 imports). No fixture update needed.

**Test fixtures discovery note:** the string-key dispatch table at `tests/fixtures/fragments.ts` is the headline-demo extractor analog the rename targets. Today it keys by canonical name and the execution-context schema wins. After rename, the pattern-relations variant has its own discoverable name (`EmbeddedDeliverableManifestSchema`). The collision is mechanically prevented going forward.

**Verify per file:**

```bash
# Rename
sed -i '' 's/DeliverableManifestSchema/EmbeddedDeliverableManifestSchema/g' \
  packages/architect-projection/src/fragments/pattern-relations/supporting.ts
# (manual: ensure only pattern-relations identifiers change; do NOT bulk-sed across pattern-detail or delivery-reporting — handle imports surgically)
```

Recommend: do the rename manually via `Edit` tool on each of the 5 files, not via `sed`, to keep import-alias updates surgical.

```bash
pnpm --filter @libar-dev/architect-projection test
pnpm --filter @libar-dev/architect-guard test
pnpm --filter @libar-dev/architect-projection lint
pnpm --filter @libar-dev/architect-projection typecheck
```

**Commit message:**

```
refactor(projection): rename embedded deliverable schemas to disambiguate

pattern-relations/supporting.ts re-derived DeliverableSchema /
DeliverableManifestSchema from the canonical execution-context variants
via .omit({ kind: true }).extend(...). Two schemas with the same
identifier in the same package was a footgun for any extractor that
performs schema-by-name lookups across modules.

Rename the pattern-relations variants to EmbeddedDeliverableSchema /
EmbeddedDeliverableManifestSchema. Canonical execution-context names
stay. Import aliases dropped (no longer needed).

Updates pattern-detail.ts, delivery-reporting/supporting.ts, and the
architect-guard tier-A lint baseline.

Note: a third DeliverableManifestSchema exists in
architect-core/src/validation-schemas/dual-source.ts. Cross-package
collision is not the trigger this rename addresses; out of scope.
```

---

### Item 8 — Simplify `createLazyReadonlyArrayFacade` (30 min)

**Commit D (separate).** `packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.ts:138-186`.

**Confirmed constraint:** `packages/architect-projection/package.json:21` declares `"sideEffects": false`. The lazy initialization IS load-bearing — eager init would compute the 4-axis composition during module evaluation, breaking the tree-shake promise.

**The simplification opportunity is narrower than the simplifier suggested.** The defensive function-rebinding inside the `get` trap (lines 152-160) is unnecessary — Array prototype methods called on a `Proxy<Array>` already get `this` bound to the Proxy, which dispatches back through the trap correctly.

**Target shape (~20 lines):**

```ts
function createLazyReadonlyArrayFacade<TValue>(load: () => readonly TValue[]): readonly TValue[] {
  const target: TValue[] = [];
  let initialized = false;
  function initialize(): void {
    if (initialized) return;
    initialized = true;
    target.push(...load());
    Object.freeze(target);
  }
  return new Proxy(target, {
    get(t, p, r) {
      initialize();
      return Reflect.get(t, p, r);
    },
    has(t, p) {
      initialize();
      return Reflect.has(t, p);
    },
    ownKeys(t) {
      initialize();
      return Reflect.ownKeys(t);
    },
    getOwnPropertyDescriptor(t, p) {
      initialize();
      return Reflect.getOwnPropertyDescriptor(t, p);
    },
    set() {
      return false;
    },
  });
}
```

Diff: ~48 → ~20 lines. Same API. Same lazy semantics. Same `sideEffects: false` compatibility.

**Why the function-rebinding wrapper isn't needed:** when `proxy.map(fn)` runs, JS calls `Reflect.get(proxy, 'map')` (returning `Array.prototype.map` via the trap) with `this = proxy`. Inside `.map`, the iteration reads `this[i]` which goes back through the `get` trap. No rebinding required — the standard semantics already handle this.

**Verify with a sanity check before committing:**

```bash
node -e "
const target = [];
let init = false;
const p = new Proxy(target, {
  get(t, k, r) {
    if (!init) { init = true; target.push(1,2,3); Object.freeze(target); }
    return Reflect.get(t, k, r);
  },
  has(t, k) { return Reflect.has(t, k); },
  ownKeys(t) { return Reflect.ownKeys(t); },
});
console.log(p.map(x => x * 2));      // [2, 4, 6]
console.log(p.length);                // 3
console.log([...p]);                  // [1, 2, 3]
console.log(p[1]);                    // 2
"
```

All four output lines must match the comments. If they don't, the function-rebinding wrapper is actually needed and item 8 should be skipped.

```bash
pnpm --filter @libar-dev/architect-projection test
pnpm --filter @libar-dev/architect-projection typecheck
pnpm --filter @libar-dev/architect-projection build
```

The lazy array is consumed in 9+ test step files via `.map()`, `.length`, indexing, and `for...of` (verified by Explore agent). All standard Array operations.

**Commit message:**

```
refactor(projection): drop defensive proxy method rebinding

createLazyReadonlyArrayFacade wrapped every method access in a
Reflect.apply closure inside the get trap. The wrapper was defensive,
not necessary — standard JS already binds `this` to the Proxy when
calling proxy.map(fn) etc., and the iteration reads via the get trap
correctly.

Drop the wrapper. 48 → 20 lines. Same API, same lazy semantics,
sideEffects:false (package.json:21) still respected. The 12-entry
cold-path registry initializes on first read; subsequent reads pay
zero overhead beyond a single boolean check.
```

---

### Item 9 — Invert `resolveInvocationDir` precedence (45 min)

**Commit F (decision: Option A).** Per user direction. Per root `REMAINING-WORK.md § 1.5.x`.

**Current behavior** (`packages/architect-cli/src/cli/runtime-helpers.ts:36-46`, verified):

```ts
export function resolveInvocationDir(): string {
  const pwd = process.env['PWD'];
  const initCwd = process.env['INIT_CWD'];
  if (pwd !== undefined && pwd.length > 0) return pwd;
  if (initCwd !== undefined && initCwd.length > 0) return initCwd;
  return process.cwd();
}
```

Precedence: `PWD` → `INIT_CWD` → `process.cwd()`. Used by `generate-docs.ts:38,216`, `pattern-graph-cli.ts:44,53`. Verify whether `architect-mcp/src/runtime-helpers.ts:16` is a re-export (changes propagate automatically) or its own copy (needs the same edit).

**The problem (latent, surfaces under embedding):** when a parent process embeds the CLI via `execFile({ cwd: '/target/dir' })`, the spawned child inherits the parent's `PWD` (still pointing at the parent's working directory). `resolveInvocationDir()` returns the parent's cwd, not the cwd `execFile` was told to use. W-DOCS-1 runner integration into `architect-generate` will trigger this.

**Target behavior:**

```ts
export function resolveInvocationDir(): string {
  // Inverted precedence (vs. legacy PWD-first behavior):
  //   process.cwd() is canonical so execFile({ cwd }) embedding is respected.
  //   INIT_CWD and PWD remain as fallbacks if cwd resolution fails (rare).
  try {
    const cwd = process.cwd();
    if (cwd.length > 0) return cwd;
  } catch {
    /* fall through to env fallbacks */
  }
  const initCwd = process.env['INIT_CWD'];
  if (initCwd !== undefined && initCwd.length > 0) return initCwd;
  const pwd = process.env['PWD'];
  if (pwd !== undefined && pwd.length > 0) return pwd;
  throw new Error('Unable to resolve invocation directory');
}
```

**Behavior change consequences:**

- ✅ Embedders (`execFile({ cwd })`) now work correctly without env stripping.
- ⚠️ Interactive symlinked-shell users see the physical (resolved) path instead of the logical (PWD) path. Cosmetic in error messages and path-display surfaces. Acceptable per user direction.
- ✅ Tests in `tests/support/helpers/cli-runner.ts` no longer need to worry about PWD inheritance (the comment at line 42 documenting the workaround can be removed).

**Steps:**

1. **Verify MCP file:** read `packages/architect-mcp/src/runtime-helpers.ts:16` — confirm whether re-export or independent copy. If copy, apply the same edit there.
2. **Update `runtime-helpers.ts`** as shown above.
3. **Update test harness comment** at `tests/support/helpers/cli-runner.ts:42` — remove or rewrite the PWD-precedence note (now stale).
4. **Add regression test:** create or extend a test that confirms `process.cwd()` precedence:

   ```ts
   // tests/steps/cli/cli-runner-cwd.steps.ts (or unit test in architect-cli/tests/)
   it('prefers process.cwd() over PWD env var', () => {
     const originalPwd = process.env['PWD'];
     process.env['PWD'] = '/intentionally/wrong/path';
     try {
       expect(resolveInvocationDir()).toBe(process.cwd());
     } finally {
       if (originalPwd === undefined) delete process.env['PWD'];
       else process.env['PWD'] = originalPwd;
     }
   });
   ```

5. **Walk callers** — `generate-docs.ts:216` and `pattern-graph-cli.ts:53` may have surrounding code that compensated for the old precedence. Read both call-sites; remove any defensive PWD-stripping or PWD-aware messaging.

6. **Author PDR** at `architect/decisions/PDR-002-cli-invocation-dir-precedence.md`:
   - Decision: invert precedence to `process.cwd()` → `INIT_CWD` → `PWD`
   - Rationale: embedding (W-DOCS-1 runner) is the canonical surface; symlinked-shell logical-path display is an acceptable cost
   - Migration: callers may now rely on cwd being respected; no opt-out
   - Reference: follows PDR-001 format

**Verify:**

```bash
pnpm --filter @libar-dev/architect-cli test
pnpm --filter @libar-dev/architect-cli typecheck
pnpm --filter @libar-dev/architect-mcp test
pnpm test:dogfood                       # exercises real CLI invocations
```

**Commit message:**

```
fix(cli): invert resolveInvocationDir precedence

Was: PWD → INIT_CWD → cwd. Now: cwd → INIT_CWD → PWD.

Old precedence broke execFile({ cwd }) embedding (subprocess inherited
parent PWD, ignoring the cwd argument). New precedence makes embedding
work correctly, which is required for W-DOCS-1 runner integration into
architect-generate.

Symlinked-shell users now see the physical (resolved) path in error
messages instead of the logical (PWD) path. Cosmetic change; no
functional impact.

Adds regression test. Removes stale PWD-precedence note in cli-runner.ts.
PDR-002 records the rationale.
```

---

### Item 10 — Retire `@architect-usecase` (45 min)

**Commit G (decision: Option A — retire).** Per user direction, grounded in `.pr-coordination/DECISIONS.md` D3''/D9 reasoning:

> The Feature/Rule/Scenario triple in Gherkin IS this repo's UML use case model. Scenarios = Actor+goal+outcome. Rules = invariants/OCL. Features = capabilities. Adding a free-text tag-side intent surface duplicates a primitive already enforced in CI — in _worse_ form (free text vs. executable text).

`@architect-usecase` is the lone free-text tag in Core. Retiring it shrinks the taxonomy and aligns with the refactor doctrine (vocabulary that didn't earn its keep).

**Current state** (verified):

- Definition at `packages/architect-core/src/taxonomy/registry-builder.ts:175-180` — `tag: 'usecase'`, `format: 'quoted-value'`, `purpose: 'Use case association'`, `repeatable: true`, example `'@architect-usecase "When handling command failures"'`.
- Example string at `packages/architect-projection/src/projections/operational-insights/taxonomy-digest.internal.ts:146` — `'@architect-usecase "When X happens"'` (generic doc-string placeholder).
- Real adoption site at `prd-generator-code-annotations-inclusion.feature:93` — `@architect-usecase "When event append must survive failures"`.
- Grep confirmed: 6 total occurrences, mix of definition / example / 1+ real carrier.

**Steps:**

1. **Re-enumerate adoption sites** (fresh grep, in case anything changed):

   ```bash
   grep -rn "@architect-usecase\|'usecase'\|\"usecase\"" \
     /Users/darkomijic/dev-projects/architect/packages \
     /Users/darkomijic/dev-projects/architect/architect \
     /Users/darkomijic/dev-projects/architect/tests \
     --include="*.ts" --include="*.feature" --include="*.md"
   ```

   Categorize each hit as one of:
   - **Definition** — registry entry to delete
   - **Example/doc string** — placeholder text in docs, digests, comments; safe to delete
   - **Real carrier** — annotation on a production pattern; needs editorial decision below
   - **Test fixture** — likely a test of the tag-registry itself; will need removal or adaptation

2. **Per real carrier site: editorial decision (per D3'' doctrine).**

   For each `@architect-usecase "When X"` annotation, decide:
   - If the carrier file has a Gherkin Scenario: that covers the same trigger condition → just delete the annotation (no information lost).
   - If not, the trigger-condition intent is captured nowhere else → write the intent into a Gherkin `Scenario:` line on the appropriate feature, then delete the annotation. The Scenario title is the canonical home per D3''.
   - If the trigger is purely a code-level "when this fires" comment with no spec analog → fold into nearby JSDoc prose, then delete.

   **Reasonable expectation:** with only 1-2 real carriers identified by the Explore agent (`prd-generator-code-annotations-inclusion.feature:93` is itself a `.feature` file, so the trigger condition is probably already adjacent to a scenario), this editorial step is small. Surface a list of carrier sites + per-site decisions in the commit message for reviewability.

3. **Delete the registry entry** at `packages/architect-core/src/taxonomy/registry-builder.ts:175-180` — remove the entire `{ tag: 'usecase', ... }` object including its example line. Re-check the surrounding array for trailing commas / list integrity.

4. **Delete example/placeholder strings** at:
   - `packages/architect-projection/src/projections/operational-insights/taxonomy-digest.internal.ts:146` — remove the `@architect-usecase "When X happens"` line; check surrounding doc-string context for related copy that references it.
   - Any other doc-string examples found in step 1.

5. **Search for downstream consumers** that may reference the tag by string literal:

   ```bash
   grep -rn "'usecase'\|\"usecase\"" packages/architect-core/src/ packages/architect-projection/src/
   ```

   Likely zero hits in production code (the tag is consumed generically via the registry), but verify.

6. **Update tests:** if `packages/architect-core/tests/` has a test pinning the taxonomy includes `'usecase'`, remove that assertion. The lint baseline (`packages/architect-guard/src/lint/`) probably does NOT reference `usecase` by string; verify.

7. **Author ADR amendment.** D9 in `.pr-coordination/DECISIONS.md` records the follow-up. Either:
   - Amend `DECISIONS.md` D9 to read "executed; tag retired" with date and commit ref.
   - Or write `architect/decisions/ADR-010-retire-architect-usecase.md` capturing the rationale (D3'' doctrine, free-text vs. executable, UML use-case shape lives in Gherkin scenarios). Recommended: the ADR — D9 in `.pr-coordination/DECISIONS.md` was a "follow-up; non-blocking" placeholder, and the actual ratified decision deserves its own record under `architect/decisions/`.

**Verify:**

```bash
pnpm --filter @libar-dev/architect-core test
pnpm --filter @libar-dev/architect-projection test    # taxonomy-digest changed
pnpm validate:all                                      # anti-pattern + taxonomy checks
pnpm architect:query tags                              # confirm 'usecase' is GONE from output
pnpm test:dogfood
pnpm guard:no-suppressions                             # no new suppressions introduced
```

**Commit message:**

```
refactor(taxonomy): retire @architect-usecase

@architect-usecase was the lone free-text tag in Core. Its 'When X happens'
trigger-condition shape duplicates a primitive already enforced in CI —
Gherkin Scenario: titles carry the UML use-case shape (Actor + goal +
outcome) in executable, typed, reviewed form. Free text was the wrong
substrate for this load.

Per DECISIONS.md D3'' and D9, retire the tag:
  - Registry entry removed from architect-core/src/taxonomy/registry-builder.ts
  - Example string removed from architect-projection taxonomy-digest
  - N real carrier sites (listed below) folded into Gherkin Scenarios or
    JSDoc prose where the trigger intent had no canonical home

Net taxonomy delta: -1 tag. Aligns with the refactor doctrine —
"tags that didn't earn their keep."

Carrier-by-carrier editorial decisions:
  - <site 1>: <fold-into-scenario|fold-into-jsdoc|delete-no-loss>
  - <site 2>: <...>
  ...

ADR-010 records the decision rationale.
```

---

### Item 11 — Replace `state.reportPath!` non-null assertions (5 min)

**Commit C (group).** `packages/architect-projection/tests/features/perf/business-rule-set-report.steps.ts:738, 747`.

Two `state.reportPath!` non-null assertions. They exist because TypeScript can't see that a prior `expect(state.reportPath).not.toBeNull()` narrowed the value.

Two acceptable fixes; pick whichever matches local style:

A. Replace `!` with explicit narrowing:

```ts
const reportPath = state.reportPath;
expect(reportPath).not.toBeNull();
if (reportPath === null || reportPath === undefined) throw new Error('reportPath missing');
// use reportPath
```

B. Use a type-narrowing assertion helper (project may already have `assertDefined`):

```ts
assertDefined(state.reportPath, 'reportPath');
// state.reportPath now typed as defined
```

**Recommended:** Option A (no new helper). Trivial change; reads naturally.

Doctrine note: `!` non-null assertions are NOT in the no-suppressions banlist (`eslint.config.mjs` `no-restricted-syntax` rule targets `eslint-disable*`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `@deprecated`). The `!` cleanup is style, not doctrine.

**Verify:** `pnpm --filter @libar-dev/architect-projection test`.

---

## Verification gates between commits

After each commit:

| Commit | Required to pass before next commit                                                                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | `pnpm --filter @libar-dev/architect-projection test && pnpm test:dogfood`                                                                                                                                              |
| B      | `pnpm format:check && pnpm -r lint && pnpm typecheck && pnpm -r test`                                                                                                                                                  |
| C      | `pnpm --filter @libar-dev/architect-projection test && pnpm --filter @libar-dev/architect-projection lint && pnpm --filter @libar-dev/architect-projection typecheck`                                                  |
| D      | `pnpm --filter @libar-dev/architect-projection test && pnpm --filter @libar-dev/architect-projection build` (build matters because Proxy semantics differ between source + bundled output)                             |
| E      | `pnpm --filter @libar-dev/architect-projection test && pnpm --filter @libar-dev/architect-guard test && pnpm --filter @libar-dev/architect-projection lint && pnpm --filter @libar-dev/architect-projection typecheck` |
| F      | `pnpm --filter @libar-dev/architect-cli test && pnpm --filter @libar-dev/architect-mcp test && pnpm test:dogfood`                                                                                                      |
| G      | `pnpm --filter @libar-dev/architect-core test && pnpm --filter @libar-dev/architect-projection test && pnpm validate:all && pnpm architect:query tags`                                                                 |

After everything: full repo gate

```bash
pnpm -r lint && pnpm typecheck && pnpm -r test && pnpm test:dogfood && \
  pnpm validate:all && pnpm guard:no-suppressions && pnpm format:check
```

All must pass before declaring the substrate clean and opening `campaign/wdocs-1-poc`.

---

## Critical files modified (summary)

```
tests/support/helpers/cli-runner.ts                                                              (item 1)
tests/steps/cli/data-api-help.steps.ts                                                           (item 1)
[317 files via prettier]                                                                          (item 2)
packages/architect-projection/src/renderers/render-markdown.ts                                   (item 3)
packages/architect-projection/tests/perf/compare-baseline.mjs                                    (items 4, 6)
packages/architect-projection/src/routing/route-id.ts                                            (item 5)
packages/architect-projection/src/fragments/pattern-relations/supporting.ts                      (item 7)
packages/architect-projection/src/fragments/pattern-relations/pattern-detail.ts                  (item 7)
packages/architect-projection/src/fragments/delivery-reporting/supporting.ts                     (item 7)
packages/architect-guard/src/lint/tier-a-baseline.ts                                             (item 7)
packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.ts  (item 8)
packages/architect-cli/src/cli/runtime-helpers.ts                                                (item 9)
packages/architect-mcp/src/runtime-helpers.ts (if independent copy, not re-export)               (item 9)
tests/support/helpers/cli-runner.ts (stale comment removal)                                      (item 9)
[1 new regression test under architect-cli/tests/ or tests/steps/cli/]                            (item 9)
architect/decisions/PDR-002-cli-invocation-dir-precedence.md (NEW)                               (item 9)
packages/architect-core/src/taxonomy/registry-builder.ts                                         (item 10)
packages/architect-projection/src/projections/operational-insights/taxonomy-digest.internal.ts   (item 10)
[1-2 .feature carrier files — to be re-enumerated at execution time]                              (item 10)
architect/decisions/ADR-010-retire-architect-usecase.md (NEW)                                    (item 10)
packages/architect-projection/tests/features/perf/business-rule-set-report.steps.ts              (item 11)
```

---

## Reused existing patterns

- **`Object.freeze` lazy-init pattern** — already in `createLazyReadonlyArrayFacade`; simplified shape reuses the same `initialized` boolean + `target.push(...load())` flow.
- **`min(hard, baseline × 1.5)` budget rule** — already canonical in `compare-baseline.mjs:30-34`; the dedup `checkBudget(...)` helper preserves it verbatim.
- **`.omit({ kind: true }).extend(...)` schema composition** — pattern is established in `supporting.ts:54-56`; the rename preserves the composition style.
- **Explicit narrowing over `!`** — already used in step-definition idioms across `tests/steps/cli/`; item 11 mirrors that style.
- **PDR (Process Decision Record) format** — see existing `architect/decisions/PDR-001-session-workflow-commands.md` for the audit deliverable's structure.

---

## Risk callouts

1. **Item 2 (Prettier sweep) is the highest-risk-of-noise commit.** 317 files at once is hard to skim. Reviewers will need to trust the tool. Recommendation: run on its own branch first if any doubt; cherry-pick across once confirmed clean.
2. **Item 8 (Proxy simplification) MUST pass the sanity check before commit.** The function-rebinding wrapper was defensive — if the runtime turns out to need it (unlikely but possible for some Array method), keep the original and skip item 8.
3. **Item 7 lint baseline (`tier-a-baseline.ts:576,582`)** — read context before editing. If the rule was _flagging_ the duplicate as an anti-pattern, the rename makes it stale data; if it was _expecting_ the name, the rename requires the baseline to update. Either way, one careful read + one decision.
4. **Item 10 (taxonomy rename)** — `architect:query taxonomy --format json` is a downstream surface; verify the new tag name appears correctly. Any consumer of `tag === 'usecase'` as a string literal (probable: zero; possible: nonzero) needs concurrent update.
5. **No item touches `architect/specs/` files** — that path is excluded by the dogfood `eslint.config.mjs` / `tsconfig.json` and any change there is design-tier work, not refactor.

---

## Out of scope (explicitly NOT in this plan)

- Cross-package `Deliverable*Schema` collision in `architect-core/src/validation-schemas/dual-source.ts` — discovered during exploration; defer until the trigger condition (cross-package schema-by-name extractor) actually exists.
- Wave 4 public-surface README work (`PRE-WDOCS-READINESS.md § D-3`) — subsumed into W-DOCS-5 per Option A recommendation.
- Wave 9 Phase 3+ skills exposure — depends on W-DOCS-3 D7 design loop.
- W-DOCS-1 substrate work (`DocDefinition`, `WikiIndexDefinition`, `projectWikiIndex`, `composeDoc`) — that IS the next campaign.
- D2 disclosure-machinery split — W-DOCS-2d work.
- Hardcoded 12-entry generator dispatch in `documentation-bundle.internal.ts:64` — shrinks naturally as W-DOCS-5+ ports take over.

---

## Estimated effort summary

| Item                                                               | Effort       | Commit    |
| ------------------------------------------------------------------ | ------------ | --------- |
| 1. Commit uncommitted fixup hunks                                  | 5 min        | A         |
| 2. Repo-wide Prettier sweep                                        | 30 min       | B         |
| 3. WHY comment in `splitOversizedDocument`                         | 5 min        | C         |
| 4. Hoist discarded `getMetricValue` to `assertMetricFieldsPresent` | 10 min       | C         |
| 5. Collapse `tryParseLogicalRouteId` to switch form                | 20 min       | C         |
| 6. Compare-baseline comparator dedup                               | 45 min       | C         |
| 11. Replace `state.reportPath!` non-null assertions                | 5 min        | C         |
| 8. Simplify `createLazyReadonlyArrayFacade`                        | 30 min       | D         |
| 7. Rename `EmbeddedDeliverable*Schema`                             | 30 min       | E         |
| 9. Invert `resolveInvocationDir` precedence + PDR                  | 45 min       | F         |
| 10. Retire `@architect-usecase` + ADR                              | 45 min       | G         |
| **Total**                                                          | **~4 hours** | 7 commits |

Sequencing: items in a commit can be done in any order within that commit; commits A → B → C → D → E → F → G must be sequential.

---

## What ready-to-start looks like

After this plan executes:

- Working tree clean (zero uncommitted files).
- All 7 commits on `campaign/docs-and-skills-consolidation`.
- Full repo gate green: lint + typecheck + test + dogfood + validate:all + guard:no-suppressions + format:check all exit 0.
- Two decisions ratified and committed:
  - PDR-002 — `resolveInvocationDir` precedence inverted (cwd-first); embedding semantics now correct.
  - ADR-010 — `@architect-usecase` retired; trigger-condition intent lives in Gherkin Scenarios per D3''.
- `.pr-coordination/PRE-WDOCS-READINESS.md` updated with a "Resolved" header listing all 11 items + commit refs.
- Net taxonomy delta from this cleanup: **-1 tag** (consistent with the shrink-not-grow doctrine that W-DOCS will continue).

Open the W-DOCS-1 PoC on a fresh `campaign/wdocs-1-poc` branch cut from this tip. The plan-tier session uses `.pr-coordination/PRE-WDOCS-READINESS.md` + `.pr-coordination/DECISIONS.md` as inputs per `DECISIONS.md` D12.
