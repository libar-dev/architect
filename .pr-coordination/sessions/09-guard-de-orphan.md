# Session 09 — Connect architect-guard (WS-1 expansion, guard)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first**, then `../DECISIONS.md`
> (esp. **D-6**, **D-8**, **D-11**). Load skills `architect-base`, `architect-data-api`,
> `architect-refactor-session`.

> **ADR grounding:** `@architect-uses` is space/comma-separated, **no colon** (ADR-001/007).
> Reverse edges (`usedBy`/`enables`) **derive** — never author them. The de-orphaning here
> is all additive `@architect-uses` on production `.ts` + deletion of malformed duplicate lines.

## Goal

De-orphan the **2 `architect-guard/src` production orphans** (`GitNameStatusParser`,
`ValidationModule`) and clear the **confirmed D-8 colon-duplicate hygiene debt** in
`derive-state.ts` + `decider.ts`. Total orphans 37 → 35.

## Method (campaign discipline — non-negotiable)

Additive `@architect-uses` JSDoc only; **exactly ONE `@architect-uses` line per pattern**
(D-8 — extend the existing line, never add a second). Every edge below was verified against
the file's real imports this session; re-confirm live before authoring. After authoring,
**read back via the Data API** (`pnpm architect:query pattern <X>` → `uses`/`usedBy`;
`arch orphans`) BEFORE handing back — "annotation in the file" ≠ "edge in the graph".

## Edits (all verified against real imports)

1. **`packages/architect-guard/src/git/branch-diff.ts`** (`GitBranchDiff`, currently no
   `@architect-uses`) — imports `parseGitNameStatus` from `./name-status.js` (line 30).
   Add a new line after `@architect-bounded-context:generator`:

   ```
   * @architect-uses GitNameStatusParser
   ```

   This de-orphans `GitNameStatusParser` via the incoming edge.

2. **`packages/architect-guard/src/lint/process-guard/detect-changes.ts`** (`DetectChanges`)
   — imports `parseGitNameStatus` via `../../git/index.js` (line 47); symbol owner is
   `GitNameStatusParser`. **Extend** the existing line 9 (D-8):

   ```
   * @architect-uses DeriveProcessState, GitNameStatusParser
   ```

3. **`packages/architect-guard/src/validation/index.ts`** (`ValidationModule`, pure
   re-export barrel, `completed`, `role:barrel`) — re-exports `./types.js`,
   `./dod-validator.js`, `./anti-patterns.js` (patterns `DoDValidationTypes`, `DoDValidator`,
   `AntiPatternDetector`). Per **D-11** (mirror `GitModule`), add after
   `@architect-bounded-context:validation`:

   ```
   * @architect-uses DoDValidator, AntiPatternDetector, DoDValidationTypes
   ```

4. **`packages/architect-guard/src/lint/process-guard/derive-state.ts`** (`DeriveProcessState`,
   `active`) — **delete line 10** (`* @architect-uses:SessionStateReader,FSMValidator`), the
   malformed colon-form duplicate. Keep line 9 (`* @architect-uses SessionStateReader, FSMValidator`).

5. **`packages/architect-guard/src/lint/process-guard/decider.ts`** (`ProcessGuardDecider`,
   `active`) — **delete line 10** (`* @architect-uses:FSMValidator,DeriveProcessState,DetectChanges`),
   the malformed colon-form duplicate. Keep line 9.

Edits 4–5 don't change the graph (line 9 already wins) — pure hygiene removing the
parser-dropped duplicate + the illegal colon-on-uses form.

## Read-back (mandatory before handing back)

```bash
pnpm architect:query arch orphans            # GitNameStatusParser + ValidationModule GONE
pnpm architect:query pattern GitNameStatusParser   # usedBy includes GitBranchDiff (+ DetectChanges)
pnpm architect:query pattern ValidationModule      # uses = DoDValidator, AntiPatternDetector, DoDValidationTypes
pnpm architect:query pattern DeriveProcessState    # uses unchanged = [SessionStateReader, FSMValidator]
pnpm architect:query pattern ProcessGuardDecider   # uses unchanged = [FSMValidator, DeriveProcessState, DetectChanges]
```

Report the edited-file list + the read-back output. **Do not run the heavy gates or commit**
— the coordinator (main thread) owns the §6 gate sequence + commit + bookkeeping.

## Out of scope

Test-feature `@architect-implements` edges (Session 10), new code-originated identities
(Session 11), working-state specs, any `Rule:`/invariant authoring.
