# TaxonomyDocumentationCluster — implementation-readiness impact assessment

**Pattern:** `TaxonomyDocumentationCluster` (status `roadmap`, parent `DocumentationProjection`)
**Spec:** `architect/specs/taxonomy-documentation-cluster.feature`
**Stub:** `architect/stubs/taxonomy-documentation-cluster/emission-descriptor.ts`
**Date:** 2026-06-05 · branch `campaign/docs-and-skills-consolidation`

> Companion to the design spec. The spec carries the _invariants_; this file carries the
> _map of what to touch_ — a volatile `file:line` consumer list that must NOT live in the
> `.feature` (it would rot). Every claim below was verified against the live tree, not the
> spec's own line numbers. Where a load-bearing spec claim had drifted or was over-broad, it
> is corrected here.

---

## 1. Verdict

**Contract-ready; two of the four shapes are gated behind net-new infrastructure.**

- The spec's load-bearing facts are all **confirmed** against the live tree (§2).
- The single new contract — the emission descriptor (`BundleRouting` split) — is **correctly shaped** in the stub and its blast radius is **narrower than the spec implied** (§3): one injector site, three renderer/​type files, three test files. Several surfaces the raw investigation first flagged (`generate-docs`, `render-json`, `business-rules`, `grouped-routed-bundle`) are confirmed **out of scope**.
- The two **shipped** shapes (whole-artifact `docs-live/TAXONOMY.md`, no-descriptor live-API context) work today and ship first.
- The two **new** shapes (embedded-region skill + formal-spec) cannot ship until **two pieces of infrastructure that do not exist anywhere in the codebase** are built (§4): a **multi-target write path** (today the generator resolves a single output dir) and a **region-aware determinism diff** (today the gate is whole-file byte comparison; `grep architect:gen packages/` returns **zero hits**). The spec correctly scopes these as "implementation, not contract shape," but they are large — this is where the real risk sits.

---

## 2. Verified load-bearing facts

| Spec claim                                                                                                        | Verdict                    | Evidence                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TaxonomyDigestProjection` is `completed` and returns `projectSingle` (no routing)                                | ✅ confirmed               | `projections/governance/taxonomy-digest.ts:73` (`return projectSingle(...)`); `projectSingle` → `{root, children:{}, routing: undefined}` (`fragments/base.ts:53-58`)                                                                                                                             |
| Live registry = 8 roles · 22 metadata · 3 aggregation · 33 total                                                  | ✅ confirmed               | `architect:query taxonomy --count`                                                                                                                                                                                                                                                                |
| `architect:query taxonomy` is the no-descriptor sink (only `{children, root}`, no routing)                        | ✅ confirmed               | `architect:query taxonomy --format json`                                                                                                                                                                                                                                                          |
| `isRoutingLike` is a hand-written guard at `fragments/base.ts:64`, delegating to `DisclosureSpecSchema.safeParse` | ✅ confirmed               | `base.ts:64`, `base.ts:87-89`; **exactly one caller** (`isBundle`, `base.ts:50`); not exported from the barrel                                                                                                                                                                                    |
| `BundleRouting` is a TS `interface` (not Zod) carrying logical + 3 file-sink fields                               | ✅ confirmed               | `base.ts:6-25` — `markdownRootTarget?` (13), `markdownChildDirectory?` (18), `entityPathLayout?` (24), all optional                                                                                                                                                                               |
| The `.md` rule `z.string().regex(/\.md$/u)` is on the registry schema                                             | ✅ confirmed               | `documentation-type-registry.ts:42` — field is **`markdownRootTarget`** (required, no `.optional()`)                                                                                                                                                                                              |
| The `` `${string}.md` `` template type exists                                                                     | ✅ confirmed               | `documentation-type-registry.output-routing.ts:7`                                                                                                                                                                                                                                                 |
| `formal-spec` lists `@architect-arch-layer` as canonical but it is absent from the live registry                  | ✅ confirmed (with nuance) | `formal-spec/04-tag-registry.md:66,80`; digest has `adr-layer`, **not** `arch-layer`. **Nuance:** an `arch-layer-values.ts` enum _does_ exist in `architect-core` — so the divergence is "enum exists in core, tag not projected into the registry," which the per-tag reconciliation must handle |
| `formal-spec` omits `shape` / `executable-specs`; both are in the digest                                          | ✅ confirmed               | digest contains `shape`, `executable-specs`; `formal-spec` tables list neither                                                                                                                                                                                                                    |
| `formal-spec` count (~26) drifts from the live count (33)                                                         | ✅ confirmed               | `formal-spec/04-tag-registry.md:315` ("≈ 26 total") vs live `33 total`                                                                                                                                                                                                                            |
| skill `references/taxonomy.md` already "does the right thing" (links, no full enumeration)                        | ⚠️ mostly                  | It **links** for the count (line 54) but **hand-restates the role enum** (line 28) — that 8-value block is itself a drift risk and is the natural skill region                                                                                                                                    |

---

## 3. Blast radius of the `BundleRouting` split (No-BC)

The split: keep the **logical** fields on `BundleRouting` (`rootRouteId`, `childRouteIds`, `childPathStrategy`, `anchorStrategy`, `disclosureSpec`); move the **three file-sink** fields onto the optional `emission?: EmissionDescriptor`; delete `isRoutingLike`.

### IN scope — must change

| File                                               | Symbol                                                                                          | Change                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fragments/base.ts`                                | `BundleRouting` (6-25)                                                                          | Remove `markdownRootTarget`/`markdownChildDirectory`/`entityPathLayout`; keep logical fields.                                                                                                                                                                                           |
| `fragments/base.ts`                                | `isRoutingLike` (64-77) + private helpers (`isOptionalString`, `isOptionalEntityPathLayout`, …) | **Delete.** Re-implement `isBundle`'s routing check (50) via a Zod schema for the slimmed logical `BundleRouting`, or validate at the descriptor trust boundary. Parse once.                                                                                                            |
| `fragments/` (new)                                 | `emission-descriptor.ts`                                                                        | Land the stub at its `@architect-target` (`packages/architect-projection/src/fragments/emission-descriptor.ts`).                                                                                                                                                                        |
| `renderers/markdown-paths.ts`                      | `resolveLogicalRoutePath` (12-39), `resolveRootMarkdownPath` (41-47)                            | Reads `routing?.markdownChildDirectory` (22), `routing?.entityPathLayout` (25), `routing?.markdownRootTarget` (42-43). Accept the `MarkdownFileRoute` as a separate parameter, or resolve the path at the call site. **Core renderer-side refactor.**                                   |
| `renderers/types.ts`                               | `MarkdownRouteProfile.mapPath` (3, 16)                                                          | Extend the signature to also receive the `MarkdownFileRoute` descriptor.                                                                                                                                                                                                                |
| `renderers/render-markdown.ts`                     | `mapPath` call sites (269, 446)                                                                 | Thread the descriptor alongside `routing`. **Logical-routing reads (262-266, 282, 390-453) are unchanged.**                                                                                                                                                                             |
| `projections/.../documentation-bundle.internal.ts` | `projectDocumentationBundleInternal` (59-94), injection at **86-88**                            | **THE sole site** that injects the three markdown fields onto `bundle.routing`. Stop injecting; instead build a `WholeArtifactEmission` descriptor from the registry definition and attach as the View's optional `emission?`. Keep `disclosureSpec` injection (85) on logical routing. |
| `cli/commands/_shared/output.ts`                   | `isBundle` import (7), error strings (100, 107)                                                 | No functional break if `isBundle` keeps its signature; update the two `…routing?: BundleRouting` error strings to reflect the slimmed shape + optional `emission`.                                                                                                                      |
| `tests/.../render-markdown.feature.steps.ts`       | `createBundleWithRouting` (700-719; spreads 708-715)                                            | Move the three fields out of the routing fixture into a `MarkdownFileRoute`/`emission` fixture. Evolve the executable feature in place (refactoring carve-out).                                                                                                                         |
| `tests/.../config-documentation.steps.ts`          | assertion at **1085** (`routing?.markdownChildDirectory === 'architecture'`)                    | Re-point at `emission.markdownFileRoute.childDirectory`.                                                                                                                                                                                                                                |

### OUT of scope — explicitly confirmed unaffected (refuting over-broad raw findings)

| File                                                             | Why it does NOT break                                                                                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cli/generate-docs.ts` (103, 106, 123)                           | Reads `metadata.markdownRootTarget` from the **registry** (`SUPPORTED_DOCUMENTATION_TYPE_REGISTRY`), **not** from `BundleRouting`. Impacted only by a later registry re-home (GoalOrientedNavigation). |
| `renderers/render-json.ts` (97-114)                              | Serializes only logical fields (`anchorStrategy`, `childPathStrategy`, `rootRouteId`, `childRouteIds`) — the JSON/API sink is unaffected.                                                              |
| `projections/governance/business-rules.internal.ts` (163-172)    | `businessRuleRouting` returns logical-only routing; assigns no markdown fields.                                                                                                                        |
| `projections/_shared/grouped-routed-bundle.internal.ts` (48, 87) | Only references the `buildRouting` callback type; callers supply logical-only routing. Type tightens automatically.                                                                                    |
| `tests/.../registry-contract.steps.ts`                           | The registry schema is unchanged by this cluster; stable. (Touched only by GoalOrientedNavigation's later re-home.)                                                                                    |

### The naming consolidation the descriptor earns

Today the markdown-routing fields live in **three** surfaces with **inconsistent names**:

- `BundleRouting` (`base.ts`): `markdownRootTarget?`, **`markdownChildDirectory?`**, `entityPathLayout?` (string, optional).
- registry schema (`documentation-type-registry.ts:42-49`): `markdownRootTarget` (required regex), **`childDirectory?`**, `entityPathLayout?`.
- `DOCUMENTATION_TYPE_OUTPUT_ROUTING` (`output-routing.ts:6-10`): `` markdownRootTarget: `${string}.md` ``, `childDirectory?`, `entityPathLayout?`.

The descriptor's `MarkdownFileRouteSchema` (`emission-descriptor.ts:96-104`) unifies these to **`rootTarget`** (required, `.md` regex preserved — **not** relaxed to `.min(1)`), `childDirectory?`, `entityPathLayout?` — the "defined once, not forked" win (stub DD-5). Note the asymmetry the descriptor correctly preserves: `rootTarget` is **required** (matching the registry), even though `BundleRouting` declared it optional.

---

## 4. Net-new infrastructure required (the real risk)

Both pieces are scoped by the spec as implementation, but **neither exists anywhere today**:

1. **Multi-target write path.** `resolveOutputDirectory` (`generate-docs.ts:484-496`) resolves exactly **one** output dir per generator (default `docs-live`); `writeGeneratedFiles` (507-522) writes every file under it via `path.resolve(outputDir, file.path)`. The embedded shapes write into `.agents/skills/architect-base/references/taxonomy.md` and `formal-spec/04-tag-registry.md` — **outside** any single configured dir, and into a _region_ of an existing file rather than a whole new file. Net-new per-emission host-file targeting (`emission.region.hostFile`).

2. **Region-aware determinism diff.** `reportDriftAndExit` (524-609) does whole-file byte comparison (**line 541**, `current !== file.content`) + a manifest diff (554-592). There is **no marker scan** (`grep architect:gen packages/` = 0 hits). For embedded regions the gate must (a) locate the begin/end sentinels derived from `regionId`, (b) regenerate and diff **only** the inter-marker span, (c) preserve everything outside the markers byte-for-byte on write.

**Coverage-hole warning:** the manifest diff (554-592) assumes one `outputDir` per generator. Embedded targets outside `docs-live` must either be folded into the manifest (host-file region hashes) **or** CI's `git diff --exit-code docs-live` will **not cover the embedded regions at all** — a silent coverage hole that would defeat the entire drift-killing purpose of the cluster. The revised spec names this as an explicit invariant (Rule: "Generation into a host file outside `docs-live` is covered by the determinism gate").

---

## 5. Impact on the 14 generated doc types

Only **4** of the 14 are touched; only **1** changes its output.

| Doc type                  | Impact                                                                                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `taxonomy`                | **Output set expands** (the cluster's purpose): adds the two embedded-region shapes (skill + formal-spec) to today's whole-artifact `TAXONOMY.md` + no-descriptor live-API context.                                                |
| `requirements-executable` | The **only** type using `entityPathLayout: 'nested-index'` (`output-routing.ts:47`). The split moves `entityPathLayout` onto the descriptor — highest-risk path-resolution case (`markdown-paths.ts:25-26`). **No output change.** |
| `architecture`            | `config-documentation.steps.ts:1085` asserts `routing.markdownChildDirectory === 'architecture'`; the test/wiring moves to the descriptor. **No output change.**                                                                   |
| `design-review`           | Carries `childDirectory` routing that re-homes onto the descriptor like every multi-file type. **No output change** — but `DesignReviewProjection` is the next deliverable family and should land on the post-split shape.         |
| (other 10)                | Unaffected.                                                                                                                                                                                                                        |

---

## 6. Improvement opportunities the capability unlocks

| Effort | Opportunity                                                                                                                                                                                                                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| large  | **Retire the drifting facts** in the two hand-authored surfaces: generate the role enum + count into the skill, the enumeration tables into the formal-spec — turning today's silent rot (`arch-layer` ghost, missing `shape`/`executable-specs`, count 26 vs 33) into a determinism-gate diff. _This is the cluster's entire payoff._ |
| medium | **Fix the formal-spec count + `arch-layer`/`shape`/`executable-specs` divergences as the first reviewable region diff**, settling the canonical-vs-recognized boundary one tag at a time against live data.                                                                                                                            |
| medium | **Collapse `BundleRouting` to logical-only** and define the `.md` sink contract **once** on the descriptor — deletes the hand-written `isRoutingLike` guard and the duplicated `.md` regex now living on both `BundleRouting` (via `isRoutingLike`) and the registry. Advances the source-first/No-BC collapse.                        |
| large  | **Extend the determinism gate to arbitrary host files**, closing the `docs-live`-only coverage hole and making the gate the enforcement mechanism for _all_ generated facts (reusable for generated tables in README/CONTRIBUTING/RFCs, not just taxonomy).                                                                            |
| medium | **Make the embedded-region write path generic** so `DesignReviewProjection` and any skill/RFC can carry generated facts without becoming fully-generated artifacts — the substrate `OneSourceMultipleAudiences` needs broadly.                                                                                                         |
| large  | **Foundation for GoalOrientedNavigation's registry re-home:** the slimmed `BundleRouting` + optional descriptor is the clean base onto which GoalOrientedNavigation moves the registry's output-routing axis, removing the registry/`BundleRouting` duplication.                                                                       |

---

## 7. Sequencing

1. **R8 block-vocab reconciliation FIRST** (independent, blocking, _not_ part of this cluster). The epic marks reconciling `architect-core`'s `SectionBlock` (`section-block.ts:121`, bare `z.string().optional()`) and `architect-projection`'s `BlockSchema` (`schema.ts:121-127`, regex + `.max(64)`) to one as an ADR-010-consequence prerequisite "before the composition layer builds further on the shared block renderer" (`00-documentation-projection.feature:65`; `DOCS-IA-FINDINGS.md` §6 R8, High). A shipped-contract refactor under the refactoring carve-out. The embedded shapes render through the shared block renderer, so R8 should land before them.
2. **Descriptor + logical-routing split** (within this cluster, ordered to keep the tree compiling): introduce `emission-descriptor.ts` + a Zod schema for the slimmed logical `BundleRouting` → migrate the sole injector (`documentation-bundle.internal.ts:86-88`) and the renderer call sites (`markdown-paths.ts`, `render-markdown.ts:269/446`, `types.ts:16`) → delete `isRoutingLike` and re-point `isBundle` → remove the three fields from the interface **in the same commit** the descriptor takes over → migrate the three test step files + author `taxonomy-cluster.feature` steps.
3. **Ship whole-artifact + live-API parity** (both already green).
4. **Build the multi-target write path + region-aware gate**, then the **two embedded shapes** + the formal-spec reconciliation diffs.
5. **GoalOrientedNavigation comes AFTER** — it re-homes the registry's output-routing axis onto _this_ descriptor (`03-goal-oriented-navigation.feature:10`), so this cluster's descriptor is a **prerequisite for it, not a dependency of it**. (`TaxonomyDocumentationCluster` has no `depends-on`/`see-also` referencing GoalOrientedNavigation — confirming the direction.)

---

## 8. Spec-readiness gaps → addressed in the revised spec

| Gap (severity)                                                             | Resolution in the revised `.feature`                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marker grammar + region semantics only in the stub comment (**blocking**)  | Pinned in the embedded-region Rule (sentinel grammar, per-host `regionId`s, newline normalization) + new error/boundary scenarios for missing/duplicate markers.                                                                                                                |
| Gate coverage outside `docs-live` undefined — coverage hole (**blocking**) | New Rule: "Generation into a host file outside `docs-live` is covered by the determinism gate," with the multi-target write path named as a deliverable.                                                                                                                        |
| Canonical-vs-recognized left open with no rule (**important**)             | Open Question sharpened to the three-way distinction (spec-canonical / digest-emitted / scanner-recognized) + the `arch-layer-values.ts` nuance; the starting rule is firmed up as THE rule for the first diff, the per-tag fine-tuning kept as the deliberately-deferred part. |
| No No-BC deletion sequence (**important**)                                 | Short "Sequencing" note in the spec.                                                                                                                                                                                                                                            |
| Executable-spec scenario mapping absent (**important**)                    | Forward link already set; the 5 scenarios are authored to map 1:1 to the planned step file; the three existing step files are flagged for in-place migration.                                                                                                                   |
| Sequencing vs R8 / GoalOrientedNavigation not stated (**nice-to-have**)    | "Sequencing" note.                                                                                                                                                                                                                                                              |
| `rootTarget` vs `markdownRootTarget` naming drift (**nice-to-have**)       | Clarified in the Stubs block (the descriptor renames + consolidates; the registry re-home is later, under GoalOrientedNavigation).                                                                                                                                              |
