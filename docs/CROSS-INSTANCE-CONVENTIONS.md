# Cross-Instance Conventions

Two delivery processes coexist in the architect-studio monorepo: `architect`
(Studio, monorepo root) and `architect-pkg` (the `@libar-dev/architect`
package family at `packages/architect/`). Each owns its own ADRs and its own
PatternGraph. This document collects the conventions that prevent the two
instances from colliding when they reference each other.

## Cross-instance ADR references

Each instance numbers its ADRs independently, so Studio-ADR-001 (MCP Sidecar
Communication) and Pkg-ADR-001 (Taxonomy Canonical Values) collide on the
bare `ADR-001` label. When referring to an ADR across instances — in commit
messages, design discussions, or another ADR's body — prefix with the
instance:

- `Studio-ADR-NNN` for ADRs in `architect/decisions/` (Studio root)
- `Pkg-ADR-NNN` for ADRs in `packages/architect/architect/decisions/`
  (package)

Inside a single instance's own folder, the bare `ADR-NNN` form is unambiguous
and remains correct.

## Principle ADRs

Some ADRs (e.g., Pkg-ADR-003 Source-First Pattern Architecture) capture
foundational principles practiced everywhere in the codebase rather than
features that ship as discrete deliverables. Their `@architect-status`
reflects "principle is practiced", not "code is shipped". Validation for
principle ADRs is an audit pass; advancement to `completed` requires
confirmation that the principle is widespread, not a list of finished
deliverables. The standard "deliverables → ship" FSM model misfits this
category, so deliverable rows for a principle ADR are typically `complete`
(audit confirmed), `superseded` (the principle obviated the deliverable), or
`n/a`.

## Cross-process dependency guidance

`@architect-uses` is the canonical authored dependency vocabulary for both same-process
and cross-process references. When the target resolves to a declared pattern in the
other delivery process, the runtime derives the external soft link from that same
authored edge.

That soft-link behavior keeps the authoring model simple:

- The source file still declares one `uses` edge.
- Same-process targets resolve as local graph edges.
- Cross-process targets resolve as external soft links.
- Unresolved targets fail validation instead of silently staying in the graph.

Cross-process references in `@architect-uses` resolve automatically against package
boundaries. A target declared in another package's `src/` is classified as external;
do not author a separate external-parent tag or external-dependency tag on active
doctrine, source, or help surfaces.

Historical campaign artifacts may still quote retired external-dependency tags only in
the approved retention zones from `.pr-coordination/10-final-report-remediation-matrix.md`.
The retired Wave 1 codemod command is intentionally not coming back; validate the
post-campaign state with this recipe instead:

```bash
pnpm pkg:query -- taxonomy --format json
pnpm --filter @libar-dev/architect-dev architect:lint-patterns
pnpm --filter @libar-dev/architect-dev validate:anti-patterns
pnpm pkg:query -- arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json
```
