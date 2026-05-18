# Feature: Formal Spec Package (`@libar-dev/architect-spec`)

## Status
⚠️ PARTIAL — `formal-spec/` (v0.2 draft) lives in-tree but is private, unpublished, and not yet graduated to a citable v1.0 standalone package.

## Overview

`@libar-dev/architect-spec` is the **formal specification for architecture-connected software specifications**. It defines **WHAT** practitioners write — the vocabulary (Pattern, four-tier ladder, FSM states, annotation grammar, edge kinds) — independent of any specific parser or tool. The `@libar-dev/architect-*` package family in this monorepo is the **reference implementation of HOW** to parse, validate, and project against the spec.

Strategically, shipping the formal spec separately from the reference implementation is a category-defining move (per `business-context.md` §"Market Context"): it signals that the durable artifact is the **vocabulary**, and the implementation is a substitutable detail. Downstream consumers — including methodology readers who never touch this codebase — can cite the spec, evaluate alternate implementations against it, or build their own in another language. This is the same shape as `tsconfig.json` for TypeScript, `package.json` for npm, or `pyproject.toml` for Python: the schema outlasts the tool.

Today the spec lives at `formal-spec/` in this monorepo as a `v0.2 draft`. The npm package name is `@libar-dev/architect-spec` (the on-disk directory was renamed from `spec/` to `formal-spec/` in W1.5.5; the npm name did not change). The package is **currently private** (not published to npm). Maintenance is bundled with the reference implementation — every PR that changes the vocabulary touches both `formal-spec/` and the `architect-*` packages in the same commit.

The gap to "PARTIAL → COMPLETE": cut `v1.0`, publish to npm with `access: public`, decouple the release cadence from the reference implementation, and finalize consumer-readable methodology docs (`docs/METHODOLOGY.md` is still draft). Until then, methodology readers must clone the monorepo to read the spec — a substantial onboarding tax.

## User Stories

- As a **methodology reader**, I want `@libar-dev/architect-spec` to be a citable, standalone package separate from the reference implementation, so I can evaluate the spec language without adopting a specific TypeScript implementation.
- As an **AI-augmented developer** evaluating tooling, I want to read `docs/METHODOLOGY.md` end-to-end without prerequisite codebase context, so I can decide whether the four-tier ladder fits my project before installing anything.
- As an **architect maintainer**, I want `formal-spec/` versioned independently of `architect-core` post-1.0, so methodology evolution and implementation bug-fixes ship on independent cadences.
- As a **contributor** to a non-TypeScript implementation of the spec, I want a published, citable schema (the formal spec) and a stable version pin, so my parser can target a known revision of the vocabulary.
- As an **architect-maintainer**, I want consumers to be able to migrate between reference implementations without re-learning the vocabulary, so the spec is genuinely substitutable.

## Acceptance Criteria

- [x] Formal spec source lives at `formal-spec/` (renamed from `spec/` in W1.5.5).
- [x] npm package name decided: `@libar-dev/architect-spec`.
- [x] `v0.2 draft` text is checked in.
- [x] Reference implementation (`@libar-dev/architect-*`) parses and validates the v0.2 draft grammar.
- [x] Cross-references from `functional-specification.md` §"Cross-references" point to `formal-spec/` and `docs/METHODOLOGY.md` as the methodology source-of-truth.
- [ ] Package `private: true` flag removed in `formal-spec/package.json`.
- [ ] Package published to npm with `access: public` (consistent with NFR-009 + `.changeset/config.json`).
- [ ] `v1.0.0` cut as the first stable spec release.
- [ ] Spec release cadence decoupled from `fixed` changesets group (so methodology can move independently of `architect-core`).
- [ ] `docs/METHODOLOGY.md` promoted from draft to publishable, with end-to-end reader path (no monorepo clone required).
- [ ] `MIGRATION.md` includes guidance for spec consumers about pinning `@libar-dev/architect-spec` to a specific version.
- [ ] Public README at `formal-spec/README.md` written for methodology-reader audience (not contributor audience).
- [ ] CI workflow publishes spec on tagged release (depends on `020-ci-perf-gate`).

## Technical Requirements

- **Package location**: `formal-spec/` at monorepo root (not under `packages/` — intentional, signals the methodology-vs-implementation distinction).
- **Package manifest**: `formal-spec/package.json` with `name: "@libar-dev/architect-spec"`, `private: true` today, target `private: false` + `publishConfig.access: "public"` for v1.0.
- **Versioning**: Currently in the `fixed` changesets group with the five publishable runtime packages. Target: extract to its own versioning lane post-1.0 so methodology releases (e.g., v1.1 adding a new annotation tag) do not force a runtime-package bump.
- **Content shape**: Methodology RFC — Pattern model, four-tier ladder, FSM transitions, annotation grammar (`@architect-pattern`, `@architect-implements`, `@architect-status`, etc.), edge taxonomy (seven relation kinds: `depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref` — see also tech-debt #3 in `021-doctrine-doc-drift-fixes`).
- **Invariants preserved**: ADR-003 source-first, ADR-005 codec/renderer separation, ADR-006 single read model, ADR-007 taxonomy redesign, ADR-009 trust boundary.
- **License**: MIT (matches the rest of the family per NFR-009).
- **Reference-implementation conformance**: The parser/validator in `architect-core` continues to track the published spec version; conformance is testable via the dogfood fixture set.

## Implementation Status

**Completed:**
- ✅ `formal-spec/` directory exists in the monorepo tree.
- ✅ `v0.2 draft` text checked in (per `business-context.md` §"Product Vision" and `functional-specification.md` §"Architect Spec").
- ✅ Renamed from `spec/` to `formal-spec/` in W1.5.5 (npm name unchanged).
- ✅ Reference implementation in `architect-core` parses the current draft.
- ✅ Cross-references from generated docs point readers at the spec.

**Missing / Drift:**
- ⚠️ `formal-spec/package.json` is marked `private: true` — package is not on npm yet.
- ⚠️ `v1.0` not cut. The maintainer's stated trajectory is "finish W1.5 lift, then graduate the spec" (tech-debt #7, Phase C in `technical-debt-analysis.md`).
- ⚠️ `docs/METHODOLOGY.md` is still draft per the maintainer's self-assessment in `docs/DOCS-GAP-ANALYSIS.md`.
- ⚠️ Spec is currently bound to the `fixed` changesets group — no independent release cadence yet (tech-debt #8 schedules the collision-map graduation alongside `2.0.0-pre.1`; the spec's own decoupling is the next milestone).
- ❌ No public `formal-spec/README.md` written for methodology-reader audience.
- ❌ No CI workflow to publish the spec on tagged release (blocked by `020-ci-perf-gate`).

## Dependencies

- `020-ci-perf-gate` — publishing the spec requires committed CI workflows.
- `017-coordinated-package-versioning` — extracting the spec from the `fixed` group requires a coordinated changesets reconfiguration.
- `005-cli-surface` and `006-mcp-server` — reference-implementation conformance depends on these being able to consume the latest spec version.
- External tooling: `@changesets/cli`, npm registry access.

## Related Specifications

- `architect/decisions/ADR-003` — Source-First Pattern Architecture (the spec defines the model).
- `architect/decisions/ADR-007` — Coordinated Taxonomy Redesign (the spec is the taxonomy's source of truth).
- `architect/decisions/ADR-009` — Projection Trust Boundary (the spec's Zod schemas are the boundary contract).
- `docs/METHODOLOGY.md` — consumer-facing reader path (draft).
- `MIGRATION.md` — v1→v2 collision map; consumers reading this need spec version guidance once graduated.
- `REMAINING-WORK.md` §W1.5 — bundles the spec graduation with the W1.5 close-out.
- `technical-debt-analysis.md` items #7 (W1.5 completion, Phase C) and #8 (collision-map graduation, dependent on #7).
- `business-context.md` §"Product Vision" — frames the spec-vs-implementation split as a category-defining move.
- `functional-specification.md` §"Architect Spec (`formal-spec/`)" — canonical naming source.
