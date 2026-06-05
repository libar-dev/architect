# Plan — Finalize TaxonomyDocumentationCluster + reconcile value-transfer / code-stub-identity doctrine

## Context

The `campaign/docs-and-skills-consolidation` branch carries uncommitted work from a prior
session that (a) heavily expanded the `TaxonomyDocumentationCluster` design spec + authored its
`emission-descriptor.ts` stub, and (b) **reversed a doctrine call**: a code/contract stub now
carries its **own** code-originated `@architect-pattern` identity (e.g. `EmissionDescriptor`)
plus `@architect-implements`/`@architect-target`, instead of being node-less. This session
reviews and finalizes that work across the four fronts the user named:

1. Review + finalize the `TaxonomyDocumentationCluster` spec → implementation-ready.
2. Reconcile any related specs.
3. Make **value transfer** unmistakable at the **top-level** skills — deletion of an ephemeral
   spec does **not** destroy information; the value _moves_ to durable carriers.
4. Validate the `@architect-pattern`-on-code-stubs approach and ensure skills + other docs cover it.

### What this session validated (via the architect API + canonical sources)

- **The code-stub-identity reversal is canonically CORRECT** (not a regression):
  `formal-spec/04-tag-registry.md:31` (`@architect-pattern` MUST on stubs) + `:148`
  (`@architect-implements` MUST on stubs); `formal-spec/07-stub-format.md:86-94` (definitive
  code-stub Required-Tags table); `adr-003:52-68` ("TS source owns pattern identity" + lifecycle
  table + "identity travels with code from stub through production"); `adr-008:127-130`
  (step-definition stubs are the **lone** carve-out); `merge-patterns.ts:6-29` (rejects only the
  **same name** in both TS+Gherkin — distinct names pass).
- **`scope-validate … implement` → READY**, `dep-tree` clean (`TaxonomyDigestProjection` is
  `completed`), `arch dangling` clean, the stub resolves both edge directions.
- **Authoring conventions are surface-dependent** (measured): `.ts` JSDoc →
  `@architect-pattern`/`-implements`/`-target`/`-status` **space**;
  `-role:`/`-bounded-context:`/`-product-area:` **colon**. `.feature` → `-pattern:`/`-implements:`
  **colon**. ⇒ the stub is authored correctly; only the doctrine _text_ is off.
- **An adversarial spec-review found one genuine BLOCKER** the green gate misses (B1 below).

---

## A. Finalize `TaxonomyDocumentationCluster` (Task 1) — one BLOCKER + tightenings

### A0 — BLOCKER: the contract can't express the formal-spec shape it must emit

`EmbeddedRegionEmissionSchema` carries a **single** `region` (`emission-descriptor.ts:124-127`,
`EmbeddedRegionTargetSchema` = one `{hostFile, regionId}`), but the spec mandates **multiple
regions in one host**:

- formal-spec shape = "**one region per digest-emitted group** (Core Identity, Classification,
  Relationships, ADR, Hierarchy, …)" (spec line 30);
- skill shape = **two** regions, `taxonomy-role-enum` + `taxonomy-tag-count` (spec line 29).

The digest demonstrably produces multiple groups in **one childless `projectSingle` bundle**
(`fragments/governance/supporting.ts` `TagGroupEntrySchema`; `projections/governance/taxonomy-digest.ts`
returns `projectSingle`, `children:{}`), and doc-gen associates **one View → one descriptor**
(`documentation-definition.internal.ts:58`). The epic repeats the singular "a region target"
(`00-documentation-projection.feature:35`). So today the formal-spec shape — one of the two
embedded shapes that are the _entire point_ of this proof-point cluster — is unrepresentable.

**Recommended resolution (ADR-010-clean):** make the embedded-region emission express **N
regions per host**, modeled as a _routing map_ (the embedded analog of whole-artifact's
`childDirectory`/`entityPathLayout` child→path routing), **never** per-region content config:

- Stub: hoist `hostFile` to the emission level; replace `region` with
  `regions: z.array(z.strictObject({ regionId, /* selection key */ })).min(1)`. Each entry routes
  one digest selection to one marker region — it names **where** content lands, not **what** it is
  (keeps DD-3 / ADR-010 intact: still a write target, not a content tree).
- Spec: state that each region maps to a distinct digest selection — formal-spec: one region per
  digest tag-group (routed from the existing `TagGroupEntrySchema` group structure); skill: one
  region per embedded fact (role-enum, count). Reconcile spec **line 30**, the Background
  deliverable row, and the stub so they agree.
- The one genuinely implement-time choice (slice the digest into a routed multi-child bundle vs.
  small dedicated per-selection Views) is named as known work, not pre-decided — but the
  _contract_ must express the cardinality now so the spec stops contradicting itself.

Alternatives considered (record, don't adopt without a reason): (b) keep `region` singular + N
separate descriptors per host — collides with the one-View-one-factory + `projectSingle` model;
(c) collapse formal-spec to one whole-enumeration region — fails the skill shape outright (its two
facts live in different authored sections of `taxonomy.md`).

### A1 — SHOULD-FIX (spec tightenings surfaced by the review)

- **Multi-region scenario (masks B1 today):** add a scenario under Rule 2 — two marker-bounded
  regions in one host, regenerate, assert each is rewritten from its selection and the
  inter-region authored prose is preserved. Without it the suite passes against the broken
  single-`region` contract.
- **Region identity scope (S2):** state that region identity is `(hostFile, regionId)` and the
  marker scan is host-scoped; add cross-host-collision to Rule 2's malformed/duplicate-marker
  error scenario (today it only covers duplicates within one host).
- **Normalization contract (S3):** line 28 promises byte-deterministic blank-line normalization,
  but EOL/trailing-newline/whitespace policy is one prose clause with no `@boundary` scenario —
  and the embedded hosts are hand-authored (likely mixed EOLs). Specify the EOL + blank-line +
  final-newline contract as an invariant with a boundary scenario; add nested/interleaved markers
  to the malformed-marker error case.
- **First-run / absent-host (S4):** add a scenario for "host file exists but region markers not yet
  present" (and missing host) → the same loud failure as malformed markers, since the multi-target
  write path is net-new infra.

### A2 — NICE-TO-HAVE (low-risk corrections)

- **Wording (S5):** "the three file-sink fields" — only **two** (`markdownRootTarget`,
  `markdownChildDirectory`) are renamed/unified; `entityPathLayout` is already consistent across
  `BundleRouting`/registry/stub and is carried forward unchanged. Reword spec line 32 accordingly.
- **Package attribution (N1):** the registry files cited in DD-5 / spec body live in
  **architect-projection** (`src/projections/documentation-composition/documentation-type-registry*.ts`),
  not architect-core; the `generate-docs.ts` functions live in **architect-cli**
  (`src/cli/generate-docs.ts`), not architect-projection. Add package prefixes so the implementer
  greps the right package.
- **Same-commit step migration (N2):** the sequencing's "migrate the executable step files" is the
  _last_ sub-step, but ≥3 step files spread the file-sink fields onto `BundleRouting`; any typed
  `BundleRouting` literal breaks in the **same** commit the interface fields are removed — state
  they migrate in that commit, not as a follow-up.
- **arch-layer diff scenario (N3):** the canonical-vs-digest-emitted boundary OQ is resolved; add a
  scenario asserting a spec-canonical-but-undigested tag (`arch-layer`) surfaces as a reviewable
  diff (the behavior the cluster markets), so the resolved rule is tested.

### A3 — settled polish regardless of B1

- Add `@architect-bounded-context:documentation-composition` to `emission-descriptor.ts` (all
  sibling fragments in the target dir carry one; additive, makes the node fully classified).

> All of A is **design-tier** work (specs + stubs only) — no production code, no FSM transition.

---

## B. Related specs (Task 2)

- **Epic `00-documentation-projection.feature:35`** — reconcile the singular "a region target" to
  the multi-region cardinality from A0 (one-line consistency fix; the rest of the epic's
  2026-06-04 emission-mode direction stays as-is and is consistent).
- Everything else is **consistent, no change**: `03-goal-oriented-navigation` (output-routing
  re-homes onto the descriptor — prerequisite-of, confirmed), MultiSourceComposition,
  OneSourceMultipleAudiences, ADR-010, `.pr-coordination/DOCS-IA-FINDINGS.md` (R8 prerequisite).
- The `<!-- architect:gen … -->` markers in `taxonomy.md` / `formal-spec/04-tag-registry.md` are
  **implement-time** work the spec already documents — **not** added now (a design session never
  writes the generation targets).

---

## C. Value-transfer clarity — top-level skills (Task 3)

Deep references (`ephemeral-spec-deletion.md`, `annotation-ownership.md`) are already correct. The
gap is at the **top level**: sharpen "value moves, nothing is lost," and surface the
code/contract-stub-promotion nuance that currently lives only in deep references.

- **`architect-base/SKILL.md` §13** — lead with: deletion removes a redundant copy _after_ its
  value has moved; it never destroys information. Make the three destinations explicit:
  design `.feature` → executable Gherkin (+ JSDoc) then deleted; **step-definition stubs** → the
  executable feature's step wiring then deleted; **code/contract stubs** → **promoted to `src/`**
  (identity persists per ADR-003, status advances roadmap→completed), staging copy removed, pattern
  not discarded.
- **`architect-sessions/SKILL.md` §"The spec is a scaffold"** — re-word "design-level specs **and
  stubs** are ephemeral scaffolds" so "scaffold comes down" clearly means _the duplicate is removed
  after transfer, not the value_, and call out the code/contract-stub promotion exception.
- **`architect-base/SKILL.md` §8** — already consistent; add a one-line pointer that a
  code/contract **stub** carries its own identity (cross-ref `annotation-ownership.md`).

Surgical edits; no restructuring.

---

## D. `@architect-pattern` code-stub doctrine — precision (Task 4)

- **Colon/space authoring examples:** `design.md` (stub-authoring bullet) and
  `annotation-ownership.md` ("do not duplicate identity" example) prescribe colon-form `.ts` tags
  (`@architect-pattern:`/`-implements:`/`-target:`); the measured `.ts` convention is **space**.
  Fix the examples to space-form (or add a one-line cross-ref to `taxonomy.md`'s csv-vs-colon rule)
  so authors don't copy the wrong form. The stub itself is already correct.
- **Pin `@architect-status:roadmap`** in the `design.md` stub example (per `07-stub-format.md`
  "always roadmap for stubs"); the status-advances-on-promotion rule already lives in `implement.md`.
- No new lint/check — `findStubPatterns`' graph-node requirement is the correct contract
  (FEEDBACK.md 2026-06-05).

---

## E. formal-spec precision pass (user-approved)

Distinguish **code/contract-stub promotion** (identity travels to `src/`) from
**behavioral-spec / step-stub deletion** in three sections that currently say "all stubs are
deleted":

- `07-stub-format.md:186-210` ("Stub Lifecycle" + "Critical rule") — "deleted" for a code stub =
  staging copy removed _because the `src/` implementation IS the realized stub_ (text already says
  this); make identity-persistence (ADR-003) explicit.
- `08-spec-evolution.md:376` + diagram (`:20`,`:58`) + "What Survives" table (`:531`,`:460`).
- `02-artifact-types.md:81,196-201`.

Do **NOT** touch `formal-spec/04-tag-registry.md` (cluster's implement-time generation target).

---

## F. FEEDBACK.md

Append: validated the code-stub-identity reversal against canonical sources (no doctrine change —
already correct); found B1 (single-`region` descriptor can't express the formal-spec multi-region
shape) behind a green `scope-validate` — a substantive-gap class the gate can't see; propagated the
value-transfer "nothing lost" + stub-promotion framing to top-level skills; fixed colon/space
authoring examples; reconciled the formal-spec stub-lifecycle sections.

---

## Verification (architect API first — never hand-edit a projection)

1. `pnpm -s architect:query scope-validate TaxonomyDocumentationCluster implement` → still READY.
2. `pnpm -s architect:query pattern EmissionDescriptor --format json` → role `contract`,
   bounded-context `documentation-composition`, `implementsPatterns [TaxonomyDocumentationCluster]`.
3. `pnpm -s architect:query rules --pattern TaxonomyDocumentationCluster --only-invariants` →
   the new multi-region + normalization scenarios present; counts increased.
4. `pnpm -s architect:query arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict` → 0.
5. `pnpm check:skills` → wiring intact, 0 dangling symlinks.
6. `pnpm docs:check` (or `docs:all && git diff --exit-code docs-live`) → no projection drift
   (edits are working-state + skills + formal-spec, not source).
7. Re-read the edited top-level skill sections: a reader cannot read "deletion = lost work," and
   the code-stub-promotion exception is visible without opening a deep reference.

> Scope guardrail: **design/doctrine session** — writes specs, stubs, skills, formal-spec prose
> only. No production code, no FSM transition, no spec deletion, no `<!-- architect:gen -->` markers.
