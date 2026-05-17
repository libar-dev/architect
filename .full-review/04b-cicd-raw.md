# Phase 4: CI/CD & DevOps Review

**Reviewed:** `packages/architect-projection/` — CI/CD pipeline, build process, publish automation, workspace integration, artifact hygiene, and campaign operational readiness.

**Key finding:** This is a library with no deployment pipeline, but the CI surface that **does** exist has gaps that will block the doc-generation campaign unless addressed before W-DOCS-1 lands.

## Findings

### 1. CI Workflow absent; publish gate entirely manual

**Severity:** High  
**Location:** No `.github/workflows/` directory exists. Release process is documented only in `REMAINING-WORK.md` Wave 7.  
**Operational risk:** Publishing `architect-projection` (and the 5-package cohort) to npm requires manual `pnpm changeset publish` invocation with zero automated pre-flight validation. Changes that pass local `pnpm test` may fail npm provenance verification, publish to wrong dist-tag, or publish out-of-sync with peer packages.  
**Campaign impact:** The campaign will land new `DocDefinition` API, new types, and extended exports. The publish gate must verify the exports map matches actual `dist/` contents (per Phase 3 D-M5) — today only `test:barrel-audit` checks this. CI should run this gate before publish, not hope for pre-commit discipline.  
**Fix recommendation:**

- Pre-publish: Implement `.github/workflows/publish.yml` that runs on `main` push after a changeset is merged. Run: `pnpm -r --filter './packages/**' build`, `pnpm test:barrel-audit`, `pnpm -r --filter './packages/**' test`. Block publish if any gate fails.
- Require `NPM_TOKEN` + `id-token: write` for provenance.
- Add a "dry-run pack" step that verifies each tarball is created (catch pre-pack failures).

---

### 2. Perf gate runs locally only; not gated in CI

**Severity:** High  
**Location:** `packages/architect-projection/tests/perf/` — `compare-baseline.mjs` and `business-rule-set.baseline.json` exist locally. No CI job runs them.  
**Operational risk:** The perf baseline (`business-rule-set.baseline.json`, last updated 2026-05-08, anchored to 36-pattern fixture) is committed to repo. The 1.5× ceiling protects against regressions **locally** but regressions shipped if CI doesn't re-run. Phase 3 H2 flagged: "gate has zero end-to-end coverage of `renderMarkdown`" — the campaign's primary landing zone.  
**Campaign impact:** The campaign will call `renderMarkdown` 5–10× more (new doc types via `DocDefinition`). Without CI perf-gating, the campaign lands renderer regressions silently. Phase 3 also flagged the baseline is year-old; the campaign's fan-out will be measured against stale numbers.  
**Fix recommendation:**

- Add `.github/workflows/performance.yml`: run `pnpm test:barrel-audit && pnpm typecheck && vitest run` for the projection package on every PR/push.
- Include the perf baseline check: `node packages/architect-projection/tests/perf/compare-baseline.mjs` as a CI gate (requires `.sisyphus/evidence/` to be generated during test run).
- Before W-DOCS-1: regenerate baseline on a clean post-W1.5 build. Document baseline generation procedure (currently missing).

---

### 3. `prepack` script executes but provenance requires CI OIDC token

**Severity:** Medium  
**Location:** `packages/architect-projection/package.json:55` — `"prepack": "pnpm clean && pnpm build"` runs before pack. `publishConfig.provenance: true` requires `id-token: write` GitHub Actions permission.  
**Operational risk:** The `prepack` script is correct (cleans + rebuilds). The `provenance` flag is set correctly. But the npm publish command (when run from CI) must pass `--provenance` — if the publish workflow forgets this flag, provenance silently doesn't generate even though the config claims it.  
**Campaign impact:** Provenance is a supply-chain security signal the campaign should not drop. Campaign doesn't touch publish logic, but CI setup must enforce it.  
**Fix recommendation:**

- In publish workflow: use `npm publish --provenance` (not `changeset publish` which defaults to `--provenance` **only** if `publishConfig.provenance: true` is set in the package, which it is — so verify by running a dry-pack first).
- Document the OIDC token requirement and baseline regeneration in `CONTRIBUTING.md` or a `PUBLISH.md`.

---

### 4. Workspace coupling via `workspace:*` untested in CI

**Severity:** Medium  
**Location:** `packages/architect-projection/package.json:58` — depends on `@libar-dev/architect-core` as `workspace:*`. Root `.changeset/config.json:7-13` groups all 6 packages into fixed version (they always version together).  
**Operational risk:** If `architect-core` lands a breaking change (e.g., `PatternGraph` shape), `architect-projection` may build locally (workspace aliasing hides the break) but fail on publish (when it's forced to consume the published core). The fixture tests do exercise the cross-package boundary, but CI should verify a "realistic consumer install" (installing published artifacts from a previous snapshot or `next` dist-tag) doesn't break.  
**Campaign impact:** The campaign will likely touch `PatternGraphAPI` consumption in the projection layer. If CI doesn't catch cross-package breakage, the campaign's changes could break published consumers undetected.  
**Fix recommendation:**

- Add a CI job (in the publish workflow or a separate "integration" workflow) that installs the **published** `next` dist-tagged versions (or the latest stable if pre-release isn't available) and runs a minimal smoke test: `import { parseAndProjectDocumentationBundle } from '@libar-dev/architect-projection'; import { buildPatternGraph } from '@libar-dev/architect-core';` + one call to each.
- This catches version-pinning bugs and breakage that `workspace:*` hides.

---

### 5. Barrel audit enforces exports map; audit runs in `test` gate, not in build gate

**Severity:** Medium  
**Location:** `packages/architect-projection/package.json:53-54` — `test` chain is `test:barrel-audit && typecheck && vitest run`. `test:barrel-audit` (line 54, `node ./scripts/options-schema-barrel-audit.mjs`) checks that all `*OptionsSchema` exports in subtree barrels bubble up to root barrels.  
**Operational risk:** The audit is load-bearing (Phase 3 flagged it as preventing new normalizers from being silently omitted). It runs before typecheck, so failures are caught early locally. **But** if a contributor runs `pnpm build` without running `pnpm test`, they bypass the audit. The audit is also scoped narrowly to `*OptionsSchema` names; it doesn't verify the full exports map matches actual `.d.ts` files in `dist/`.  
**Campaign impact:** The campaign will add `DocDefinition` API to the `./projections` barrel + root barrel. The audit won't catch if the export is wrong (it only checks `*OptionsSchema` pattern). Campaign contributors should be explicitly told: "run `pnpm test` before committing; barrel drift breaks npm publish."  
**Fix recommendation:**

- Update audit script to also check `*Fragment`, `*Renderable`, and `*Definition` patterns (not just `*OptionsSchema`). Make it a regex-driven generic barrel auditor.
- Add JSDoc to `DOCUMENTATION_PROJECTION_FACTORIES` (Phase 3 D-H2): "Do NOT add entries here; this dispatch table is being replaced by `DocDefinition`. See .pr-coordination/PROPOSED-DESIGN.md."
- Document in `CONTRIBUTING.md`: "Always run `pnpm test` before pushing — it enforces barrel discipline and perf gates."

---

### 6. `docs:all` script runs locally; generated `docs-live/` gitignored and never committed

**Severity:** Medium  
**Location:** Root `package.json:32` — `"docs:all": "pnpm exec architect-generate --base-dir . -g patterns -g architecture -g roadmap -g changelog -g requirements-executable -g requirements-specs -g decisions -g taxonomy -f"`. Output lands in `docs-live/` (gitignored per CLAUDE.md).  
**Operational risk:** The doc-gen script invokes `architect-generate`, which internally uses `parseAndProjectDocumentationBundle` from the projection package. If a campaign commit breaks the projection API or validation, `pnpm docs:all` silently fails or produces empty/malformed output **on the developer's machine** but the failure is never surfaced in CI (CI doesn't run `docs:all` because output is gitignored). The campaign introduces `DocDefinition.build()` — if its Zod schema is malformed or the new extractor crashes, the campaign lands broken doc-gen without CI catching it.  
**Campaign impact:** The campaign's entire value is that `docs:all` works end-to-end with new doc types. Campaign must add a CI gate that runs `docs:all` and verifies output (at least: non-empty files, valid markdown, no ERROR lines).  
**Fix recommendation:**

- Add CI job (in test or publish workflow): run `pnpm docs:all` and commit the output to a temporary branch or artifact (do NOT commit to main — keep `docs-live/` gitignored). Parse output for errors/warnings. Fail if any generator raises an exception or produces zero output.
- Alternatively: add a "stable output check" — run `docs:all` twice in succession and diff the output; fail if it changes (detects non-deterministic generators).
- Document in `CONTRIBUTING.md`: "The campaign's `DocDefinition` API must pass `pnpm docs:all` with no errors. CI will validate this before merge."

---

### 7. Perf baseline is year-old; regeneration procedure undocumented

**Severity:** Medium  
**Location:** `packages/architect-projection/tests/perf/baselines/business-rule-set.baseline.json` — `generatedAt: "2026-05-08T15:24:38.282Z"`. Phase 3 M3 flagged: baseline anchored to commit `ee58aac` (initial multi-package split, ~year old in repo time).  
**Operational risk:** The 1.5× multiplier gives 50% headroom against year-old perf numbers. If the codebase drifted (it has, post-W1.5), the baseline is stale and the ceiling is invisible slack. A 5× doc-count fan-out could be ~2–2.5× real cost increase, and the gate would silently pass as long as it stays under baseline × 1.5.  
**Campaign impact:** The campaign multiplies projection calls 5–10×. The baseline should be regenerated **before** W-DOCS-1 so the campaign's regressions are measured against reality, not year-old slack.  
**Fix recommendation:**

- Regenerate baseline on a clean build: `pnpm clean && pnpm build && pnpm test` to populate `.sisyphus/evidence/` → copy to `tests/perf/baselines/business-rule-set.baseline.json`.
- Document procedure in a `PERF.md` or `CONTRIBUTING.md` section: "To regenerate baselines: (1) ensure clean state (`pnpm clean && pnpm install`), (2) run full test suite (`pnpm test`), (3) copy `{{.sisyphus/evidence/task-3-business-rule-set-perf-report.json}}` to `packages/architect-projection/tests/perf/baselines/business-rule-set.baseline.json`, (4) commit."
- Schedule baseline refresh as a quarterly CI job (or at major campaign milestones).

---

### 8. No linting in CI; `pnpm lint` not wired into test/build gates

**Severity:** Low  
**Location:** Root `package.json:14` — `"lint": "pnpm -r --filter './packages/**' lint"` exists but is not called from `pnpm test` or root build workflow.  
**Operational risk:** Contributor pushes code with linting errors; CI (when it exists) doesn't catch them because lint is not a gate. `eslint.config.mjs` exists at root (from W1.5 dogfood lift) but is incomplete per REMAINING-WORK.md W2 — missing `eslint-plugin-import` and doc/React rules stripped.  
**Campaign impact:** Campaign won't be blocked by lint, but linting discipline on new `DocDefinition` API and `ContentFragment` types would catch common mistakes.  
**Fix recommendation:**

- Complete W2 setup: install `eslint-plugin-import`, verify `pnpm lint` runs clean, add to CI gates (both PR validation and pre-publish).
- Document in `CONTRIBUTING.md`: "Run `pnpm lint` locally before pushing; CI will enforce this."
- Stripe out React/Tailwind rules from root eslint config; keep TypeScript + imports + no-suppression-comments.

---

### 9. Changesets config is correct; no publish automation yet

**Severity:** Low  
**Location:** `.changeset/config.json` — fixed group of 6 packages, public access, `main` base branch, changesets ignored for spec + dogfood.  
**Operational risk:** None — config is correct as-is. Wave 7 in REMAINING-WORK.md will drive the first changeset. This is a placeholder for completeness.  
**Campaign impact:** None. Campaign doesn't touch changesets; Wave 7 will.  
**Fix recommendation:** None — move on.

---

### 10. NPM_TOKEN and OIDC setup deferred; publish requires manual secret rotation

**Severity:** Low  
**Location:** Not yet configured (Wave 5 in REMAINING-WORK.md). Wave 7 will set up `NPM_TOKEN` env var in GitHub Actions.  
**Operational risk:** Manual token management scales poorly and risks accidental exposure. OIDC is the modern pattern (GitHub → npm, keyless).  
**Campaign impact:** Campaign doesn't affect publishing, but the final publish workflow (Wave 7) should use OIDC from day one rather than static tokens.  
**Fix recommendation:** When Wave 5 lands, use `npm` v10+ with `provenance: true` and OIDC token from GitHub Actions context. Document in publish workflow.

---

## Campaign-Critical Summary

**Campaign readiness checklist:**

1. **BLOCKING before W-DOCS-1:** Add `pnpm docs:all` gate to CI. Campaign's entire value is doc-gen; CI must verify it works end-to-end. (Finding 6)
2. **BLOCKING before W-DOCS-1:** Regenerate perf baseline. Campaign will be measured against year-old numbers; silent regressions guaranteed without refresh. (Finding 7)
3. **BLOCKING before W-DOCS-1:** Add `renderMarkdown` to perf gate. Campaign multiplies doc-gen 5–10×; unmeasured path will regress silently. (Finding 2)
4. **High priority:** Add CI publish gate. Campaign introduces `DocDefinition`; publish without pre-flight validation risks malformed exports. (Finding 1)
5. **High priority:** Enhance barrel audit to catch `*Definition` + new pattern names. Campaign adds new API surface; generic pattern auditor catches regressions. (Finding 5)
6. **Medium priority:** Add cross-package smoke test (publish + consume). Campaign will depend on `architect-core`; workspace aliasing hides breaking changes. (Finding 4)
7. **Medium priority:** Add "stable output check" to `docs:all` — run twice, diff output. Catches non-deterministic doc generators introduced by campaign. (Finding 6)

**Out of scope:** Findings 8, 9, 10 (linting, changesets, tokens) do not block campaign but should be addressed in Wave 2–5 of REMAINING-WORK.md for overall CI maturity.

## Key Observations

- **No GitHub Actions yet.** REMAINING-WORK.md Wave 5 is committed to adding CI; this review confirms CI is the missing piece between "works locally" and "ships safely."
- **Workspace coupling is sound.** The `workspace:*` dependency + fixed version group in changesets is correct; adding a publish-artifact smoke test (Finding 4) is defensive verification, not a blocker.
- **Perf gate exists but is incomplete.** The business-rule-set fixture and budgets are well-designed, but the gate runs locally only and covers only `patterns` doc type. Campaign will multiply coverage from 1 to 12+; CI must enforce all types.
- **Barrel audit is load-bearing.** `test:barrel-audit` prevents silent export drift (Phase 3 T-H1 flagged normalizer omissions would pass other tests). Generalizing it to `*Definition` patterns (Finding 5) is table-stakes for the campaign's new API.
- **`docs:all` is the campaign's proving ground.** The script ties together projection + rendering + composition. If CI doesn't run it, the campaign lands broken doc-gen undetected.

---

## Severity Ranking

| ID  | Severity | Blocker for Campaign | Blocker for Publish |
| --- | -------- | -------------------- | ------------------- |
| 1   | High     | No                   | Yes                 |
| 2   | High     | **Yes**              | No                  |
| 3   | Medium   | No                   | Yes                 |
| 4   | Medium   | **Yes**              | No                  |
| 5   | Medium   | **Yes**              | No                  |
| 6   | Medium   | **Yes**              | No                  |
| 7   | Medium   | **Yes**              | No                  |
| 8   | Low      | No                   | No                  |
| 9   | Low      | No                   | No                  |
| 10  | Low      | No                   | No                  |

**Blocker definition:** Must be fixed before W-DOCS-1 lands (campaign starts), or campaign ships broken.

---

## What CI Looks Like at Campaign Launch (W-DOCS-1)

For the campaign to land safely:

```yaml
# Pseudo-workflow: PR validation + publish gate
- name: Install
  run: pnpm install --frozen-lockfile

- name: Build & typecheck
  run: pnpm build && pnpm typecheck

- name: Lint (post-W2)
  run: pnpm lint

- name: Barrel audit (enhanced for *Definition)
  run: pnpm test:barrel-audit

- name: Test suite
  run: pnpm test

- name: Perf gate (baseline regenerated pre-W-DOCS-1)
  run: node packages/architect-projection/tests/perf/compare-baseline.mjs

- name: Doc generation + stable output check
  run: |
    pnpm docs:all > /tmp/docs-1.txt 2>&1
    pnpm docs:all > /tmp/docs-2.txt 2>&1
    diff /tmp/docs-1.txt /tmp/docs-2.txt || exit 1
    grep -i error /tmp/docs-1.txt && exit 1 || true

- name: Pack (dry-run)
  run: pnpm -r --filter './packages/**' pack

- name: Consume published artifacts (post-W4)
  run: |
    npm install @libar-dev/architect-projection@next
    node -e "require('@libar-dev/architect-projection')" || exit 1
```

This is the gate that will catch campaign regressions.
