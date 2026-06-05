# Spec ↔ Pattern Relationships (canonical reference)

Reference for the bipartite production↔test pattern graph and
the sanctioned naming conventions. Used by the `architect-sessions`
plan (escape-hatch case), design, implement, and review-implementation
references and by `architect-refactor-session`.

## The bipartite pattern graph

Every production pattern can have a corresponding test pattern that
`implements` it. The PatternGraph carries both as nodes joined by an
`@architect-implements:` edge.

A test feature carries two file-level tags:

```gherkin
@architect-pattern:DefineConfigExecutableTests
@architect-implements:DefineConfig
```

`@architect-pattern:DefineConfigExecutableTests` declares the test feature as
its own pattern with a distinct name. `@architect-implements:DefineConfig`
declares the realization edge to the production pattern.

This two-tag shape is what lets queries traverse: "show me the
executable test for `DefineConfig`" walks `implements` edges from the
production pattern node to its test pattern node.

## Naming conventions for test patterns

Two suffix conventions are sanctioned:

| Suffix             | Use case                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `*Testing`         | Test pattern accompanying a deliberately-designed pattern (the pattern flowed through plan / design before being implemented) |
| `*ExecutableTests` | Test pattern backfilling coverage for code that already ships (the formal escape hatch — see below)                           |

Either suffix is acceptable; pick whichever conveys intent better in
context. The PatternGraph treats them identically — the suffix is a
human-facing convention.

## Forward / reverse link pair (deletion-gate input)

Two tags form the deletion-gate link pair:

- **Forward:** the design spec carries
  `@architect-executable-specs:<path>` pointing at the eventual
  executable feature file.
- **Reverse:** that executable feature carries
  `@architect-implements:<Pattern>` declaring the realization edge
  back to the focal pattern.

Both must exist and resolve to each other for the design spec to be
safely deletable. See [`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md)
§"Pre-deletion gate" for the full gate criteria.

## `*ExecutableTests` as the formal escape from retroactive plan-level specs

The kernel flags **retroactive plan-level specs** as a load-bearing
anti-pattern: authoring a fresh plan-level spec for code that already
ships inverts the spec lifecycle. The formal escape is the
`*ExecutableTests` convention:

1. Author a `tests/features/**/*executable-tests.feature` (or sibling)
   file.
2. File-level tags:
   `@architect-pattern:<Pattern>ExecutableTests` plus
   `@architect-implements:<Pattern>`.
3. Enrich the file's Rule blocks with `**Invariant:**`
   (+ `**Rationale:**` / `**Verified by:**` where useful) describing
   what the existing code already guarantees.

This produces graph visibility for the shipped pattern without
authoring a fictitious "planned" design spec that would immediately
become a zombie.

## Hierarchy axis (epic / phase / task / slice)

Patterns can be organized into a hierarchy independent of their
maturity. The hierarchy axis carries exactly two authored tags:
`@architect-level` and `@architect-parent`.

The hierarchy axis uses two tags:

- `@architect-level:<epic|phase|task|slice>` — declares this
  pattern's level in the hierarchy.
- `@architect-parent:<PatternName>` — declares the parent edge to
  another pattern.

Constraints:

- The level enum is closed: `epic > phase > task > slice`.
- `@architect-parent X` requires `X` to carry `@architect-level` at
  a strictly-higher level than the file declaring the parent.
  (`task`'s parent is `phase` or `epic`; `phase`'s parent is `epic`.
  Epics and slices are exempt — see below.)
- A pattern at any maturity tier (idea / candidate / plan / design /
  executable) can be at any hierarchy level. Hierarchy and maturity
  are independent.
- Cross-package parents resolve via the same `uses`-resolver that
  handles cross-package dependencies. Keep the authored form on the
  `@architect-parent` edge and let the resolver classify the target.
- Epics and slices are top-of-chain or lateral views and do not
  carry `@architect-parent`.

## Sibling references

- [`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md) — full deletion-gate
  criteria.
- [`./annotation-ownership.md`](./annotation-ownership.md) —
  split-ownership policy that makes the executable feature canonical.
- [`../SKILL.md`](../SKILL.md) §"Anti-anecdote" — the live graph/CLI
  is canonical; a stale skill paraphrase is not.

## Provenance (informational)

`@architect-implements`, `@architect-executable-specs`, and
`@architect-pattern` tag formats are derived live via
`pnpm architect:query taxonomy --format json`. The `*ExecutableTests`
and `*Testing` suffix conventions originated in the package family's
executable-coverage pattern doctrine; the statement above is the
canonical form.
