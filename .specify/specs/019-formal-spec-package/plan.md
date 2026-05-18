# Implementation Plan: Formal Spec Package — Graduate `@libar-dev/architect-spec` to v1.0

## Goal

Graduate `formal-spec/` from a private `v0.2 draft` in-tree to a public, citation-stable `@libar-dev/architect-spec@1.0.0` standalone npm package — decoupling methodology evolution from reference-implementation bugfixes and giving methodology readers a substitutable, language-agnostic vocabulary they can pin to a specific revision.

## Current State

### What exists today

- `formal-spec/` directory at the monorepo root (intentionally outside `packages/` to signal the methodology-vs-implementation distinction). The on-disk rename from `spec/` to `formal-spec/` landed in W1.5.5; the npm name `@libar-dev/architect-spec` was decided at the same time and did not change.
- `v0.2 draft` text is checked in — the Pattern model, four-tier ladder (idea → candidate → plan → design → executable), FSM transitions, annotation grammar (`@architect-pattern`, `@architect-implements`, `@architect-status`, `@architect-unlock-reason`, etc.), and the edge taxonomy.
- The reference implementation (`@libar-dev/architect-*`) parses and validates the v0.2 draft. Conformance is testable via the dogfood fixture set.
- `formal-spec/package.json` carries `private: true` — package is not on npm.
- `docs/METHODOLOGY.md` exists but is still a draft per the maintainer's self-assessment in `docs/DOCS-GAP-ANALYSIS.md`.
- Cross-references from `functional-specification.md` §"Cross-references" already point at `formal-spec/` and `docs/METHODOLOGY.md`.

### What is missing

- A `v1.0.0` cut; the package has never been published.
- An independent release cadence — currently the spec rides the `fixed` changesets group with the five publishable runtime packages, so every `core` patch bumps the spec.
- A consumer-facing `formal-spec/README.md` written for methodology readers (not contributors).
- A finalized, publishable `docs/METHODOLOGY.md` with an end-to-end reader path that does not require cloning the monorepo.
- A CI workflow that publishes the spec on tagged release (blocked by spec `020-ci-perf-gate`).
- Guidance in `MIGRATION.md` (when graduated per plan 017) telling consumers how to pin `@libar-dev/architect-spec` to a specific version.

## Target State

After this plan lands:

- `@libar-dev/architect-spec@1.0.0` is published to npm with `access: public`.
- The package has its own release cadence — extracted from the `fixed` changesets group or in a separate-but-related lane, decided and documented in this plan's outputs.
- `formal-spec/README.md` exists and is written for the methodology-reader audience. Anyone who finds the package on npm can understand what it is and what the four-tier ladder means without leaving npmjs.com.
- `docs/METHODOLOGY.md` is promoted from draft to publishable; readers get an end-to-end path from "what is a Pattern" through "what FSM transitions are legal" to "where the implementation lives."
- `formal-spec/package.json` has `private: false`, `publishConfig.access: "public"`, and a stable `repository` field pointing back at this monorepo.
- The reference implementation in `architect-core` continues to conform to the published spec version; conformance is testable.
- Spec `019-formal-spec-package/spec.md` has all `[ ]` items flipped to `[x]`.

## Technical Approach

1. **v0.2 → v1.0 content review.** Open `formal-spec/`. Audit each section against the four-tier ladder, the FSM transition table in `validation/fsm/transitions.ts`, the annotation grammar enforced by `architect-core`, and the seven relation kinds in `architect-projection`'s `pattern-relations/supporting.ts:66-74`. Flag any section that needs rewording for citation stability. Decide which sections are `v1.0` scope vs. `v1.1+` future work — published spec language is harder to change than draft language.

2. **Decouple methodology from implementation references.** Read every page of `formal-spec/`. Any text that references `@libar-dev/architect-core` or `architect-mcp` by name is a methodology-vs-impl boundary violation — the methodology must be implementation-agnostic. Rewrite as "a conforming parser" or "the reference implementation" where appropriate.

3. **Write the consumer-facing `formal-spec/README.md`.** Three sections: what this package is (the Architect Spec, methodology RFC); who it is for (methodology readers, alternative-implementation authors, AI-augmented developers evaluating spec languages); how to read it (start with `<chapter>.md`, then `<next>.md`). Include a link to `docs/METHODOLOGY.md` for the end-to-end reader path.

4. **Promote `docs/METHODOLOGY.md` from draft.** Identify draft markers in the file (TODOs, "needs review" comments, half-written sections). Resolve each. The end state: someone with no Architect background reads it linearly and emerges able to write a `candidate`-tier spec without consulting the codebase.

5. **Versioning lane decision.** Two options:
   - **(a) Keep in `fixed` group, version with runtime.** Simpler but every implementation patch bumps the spec — defeats the substitutable-methodology narrative.
   - **(b) Extract to its own version lane.** Methodology bumps when methodology changes; runtime can patch without bumping the spec. Preferred per spec 019, but requires a `linked` (not `fixed`) entry or a separate config block.
   - **Recommendation**: lane (b). Document the decision in an ADR in `architect/decisions/`. Plan 017 keeps the spec in `fixed` for `2.0.0-pre.1`; this plan extracts post-`2.0.0`.

6. **`formal-spec/package.json` manifest hardening.**
   - `private: false`
   - `publishConfig.access: "public"` (NFR-009)
   - `repository` field with `directory: "formal-spec"`
   - `license: "MIT"` (matches the rest of the family)
   - `keywords`, `description`, `homepage` pointing at the consumer-facing reader path
   - `files` array gating what ships (markdown sources + `README.md` + `LICENSE`; no test fixtures)

7. **First publish.** Add a changeset for `architect-spec@1.0.0`. Run the constitution §V gates. Cut via `release.yml` (plan 020) if available; otherwise `pnpm publish --filter @libar-dev/architect-spec --tag latest` after `pnpm changeset version`. Verify the tarball contents before pushing the tag.

8. **Announce + cross-link.** Update `README.md` at repo root, `packages/architect/README.md`, and the architect family README index to reference the published spec with a permalink. Update `MIGRATION.md` (when plan 017 ships) with spec-version pinning guidance.

9. **Conformance harness.** Make conformance testable: a fixture set under `formal-spec/conformance/` that a downstream parser (alt implementation, future Python implementation, etc.) can run to claim "conforms to v1.0". The reference implementation should run this harness as part of `pnpm test`.

## Tasks

- [ ] Audit `formal-spec/` v0.2 against four-tier ladder, FSM table, annotation grammar, edge taxonomy. Produce a section-by-section delta list.
- [ ] Scrub `formal-spec/` for implementation-specific references; rewrite as implementation-agnostic.
- [ ] Decide v1.0 scope; defer v1.1+ items into an explicit "post-v1.0" appendix or follow-up issue.
- [ ] Draft an ADR in `architect/decisions/` capturing the versioning-lane decision (extract from `fixed` group post-`2.0.0`).
- [ ] Write `formal-spec/README.md` for methodology-reader audience.
- [ ] Promote `docs/METHODOLOGY.md` from draft to publishable; resolve every TODO/half-section.
- [ ] Patch `formal-spec/package.json`: `private: false`, `publishConfig.access: "public"`, `repository.directory: "formal-spec"`, `license: "MIT"`, `description`, `keywords`, `homepage`, `files`.
- [ ] Add a changeset for `@libar-dev/architect-spec@1.0.0`.
- [ ] If `release.yml` (plan 020) is in place: publish via tagged release. Otherwise: manual `pnpm publish --filter @libar-dev/architect-spec`.
- [ ] Verify the published tarball includes only the intended files (markdown + README + LICENSE).
- [ ] Cross-link the published package from repo-root `README.md`, `packages/architect/README.md`, and `MIGRATION.md` once plan 017 lands.
- [ ] Add a `formal-spec/conformance/` fixture set; wire into `pnpm test` for the reference implementation.
- [ ] Verify the reference implementation continues to conform to v1.0; failures here block the publish.
- [ ] Update `019-formal-spec-package/spec.md` — flip all `[ ]` acceptance criteria to `[x]`.

## Risks & Mitigations

- **Risk**: Publishing a methodology RFC as v1.0 is a citation-stability commitment — future breaking changes to the spec become high-cost.
  - **Mitigation**: Be conservative about `v1.0` scope. Anything genuinely uncertain (e.g., naming of new edge kinds, exact wording of FSM transition rules) gets deferred to `v1.1+` rather than locked into v1.0.
- **Risk**: Extracting from the `fixed` group while plan 017 still ships `2.0.0-pre.1` with the spec inside the group introduces transient inconsistency.
  - **Mitigation**: Sequence: plan 017 cuts `2.0.0-pre.1` with the spec inside `fixed`; **this plan extracts after** plan 017 lands; the extraction is its own ADR + changesets PR.
- **Risk**: The reference implementation drifts ahead of the published spec.
  - **Mitigation**: The conformance fixture set (step 9) anchors the reference implementation against the published version. CI runs it; drift fails the test.
- **Risk**: Consumer-facing docs reference internal-only paths or assumptions.
  - **Mitigation**: Read `formal-spec/README.md` and `docs/METHODOLOGY.md` from a fresh-eyes perspective — ideally as a maintainer who has not worked on this project, or via a colleague review.
- **Risk**: `private: true` → `private: false` flip exposes accidental in-tree content (e.g., maintainer scratch notes) on npm.
  - **Mitigation**: The `files` field in step 6 explicitly enumerates what ships. Run `pnpm pack` and inspect the tarball before tagging.

## Testing Strategy

- **Unit tests**: methodology files are markdown — no runtime tests on the spec itself.
- **Conformance tests**: the new `formal-spec/conformance/` fixture set, exercised by the reference implementation via `pnpm test`. Each fixture is a minimal Architect-State sample (annotated TS + Gherkin) plus an expected projection — passing means the parser conforms.
- **Smoke**: `pnpm pack --filter @libar-dev/architect-spec` produces a tarball; tarball contents match the `files` field.
- **Integration**: at least one downstream alt-implementation contributor (or a synthetic stand-in) reads the published package and reports whether the methodology is unambiguous.
- **Executable Gherkin**: existing scenarios under `tests/features/` continue to pass — the spec extraction does not change the parser surface.

## Success Criteria

- All acceptance criteria in `019-formal-spec-package/spec.md` reach `[x]`.
- `@libar-dev/architect-spec@1.0.0` is on npm with `access: public`.
- `formal-spec/` has its own versioning lane post-`2.0.0` (per ADR in `architect/decisions/`).
- `docs/METHODOLOGY.md` is publishable; readers can navigate it linearly.
- `formal-spec/README.md` exists and targets the methodology-reader audience.
- A conformance fixture set is wired into `pnpm test`; drift is caught.
- Constitution §III gates pass.
- A downstream consumer can pin `@libar-dev/architect-spec@^1.0.0` and depend on the published API.

## Dependencies / Coordination

- **Plan 020** (`020-ci-perf-gate`) — provides `release.yml` for tagged publish. This plan is **soft-blocked** by plan 020; manual publish is possible but harder.
- **Plan 017** (`017-coordinated-package-versioning`) — must land first for `2.0.0-pre.1`. This plan's versioning-lane extraction happens **after** plan 017 cuts `2.0.0` stable.
- **Constitution §III.F (Coordinated Versioning)** — currently enforces lockstep for all six packages. This plan amends the invariant: spec moves to its own lane post-`2.0.0`. Capture the amendment in a new ADR and update constitution §III.F text in the same PR.
- **External**: npm registry, `@changesets/cli`, npm 2FA token / npm-publish credentials, GitHub Actions (if `release.yml` is wired).
- **Constraint**: any change to the spec post-v1.0 follows the constitution §IX amendment process — new ADR, PR, maintainer approval.
