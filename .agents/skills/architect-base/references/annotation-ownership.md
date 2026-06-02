# Annotation Ownership (canonical reference)

Reference for which `@architect-*` tags live on feature files
versus on code stubs / production TypeScript. Used by the
`architect-sessions` design, implement, and review-implementation
references and by `architect-refactor-session`.

## Split-ownership principle

Feature files own _what_ and _when_ (planning). Code stubs and
production TypeScript own _how_ and _with what_ (implementation).
Neither duplicates the other.

This split is what lets the kernel state, definitively:

- A pattern is **identified** by its feature file.
- Production code **realizes** the pattern via
  `@architect-implements:<Pattern>` (a relation, not an identity claim).
- Production-TS `@architect-*` annotations are **additive enrichment**,
  not mandatory completion criteria.

## Feature files own (planning)

| Tag                           | Purpose                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| `@architect-pattern`          | Pattern identity (canonical)                                          |
| `@architect-status`           | FSM state (`candidate`, `roadmap`, `active`, `completed`, `deferred`) |
| `@architect-bounded-context`  | Canonical structural grouping                                         |
| `@architect-uses`             | Declared dependency edges for spec, ADR, and test patterns            |
| `@architect-implements`       | Realization edge (test feature → production pattern)                  |
| `@architect-executable-specs` | Forward link from design spec to executable feature                   |
| `@architect-unlock-reason`    | Audit-trail for unusual FSM transitions                               |

## Code stubs / production TS own (implementation)

| Tag                            | Purpose                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `@architect-usecase`           | When/how to use                                                                                                         |
| `@architect-target`            | Stub's forward pointer to eventual production path                                                                      |
| `@architect-enforces-decision` | ADR/DD reference — the structured pattern→ADR edge (additive); `@architect-decision` is a doc-aggregation tag, not this |
| `@architect-role`              | Closed implementation-role enum                                                                                         |

## Code-originated patterns

Some patterns have no feature file because their canonical definition is the code itself, codecs (renderers), contracts (Zod schemas), and certain utilities. These patterns identify themselves on `.ts` source via `@architect-pattern:<Name>` and carry `@architect-role:codec | contract | utility | ...` on the same file. When source owns identity, the same source file also owns identity-coupled metadata such as `@architect-bounded-context` and any `@architect-uses` edges for that pattern. The PatternGraph extractor accepts production-TS identity for these roles.

Practical rule: `@architect-bounded-context` belongs on the surface that owns canonical identity. For planned behavior patterns, that surface is the feature file. For code-originated patterns, that surface is the `.ts` file carrying `@architect-pattern`. Do not duplicate the tag across both surfaces for the same pattern unless the second copy is an intentionally additive annotation with a different scope.

## When to use a feature file vs the source for identity

Use a feature file when the pattern represents planned behaviour, business intent, or a UI/integration outcome — anything where the Gherkin scenarios are part of the pattern's definition.

Use a `.ts` file when the pattern is purely structural — a contract surface, a serialization codec, a barrel, or a narrow utility — and a feature file would carry no scenarios beyond "the type compiles."

## Critical: do not duplicate identity

If a feature file owns identity, do NOT also author `@architect-pattern` on the realising production code. Keep `@architect-bounded-context` and feature-level `@architect-uses` on that owning feature, then use `@architect-implements:<Pattern>` (relation, not identity) on the production file. The feature still owns identity.

## Production-TS annotations are additive, not mandatory

A pattern can be `@architect-status:completed` with **zero**
`@architect-*` JSDoc on the production source, provided the executable
feature carries the full surface (pattern identity, status, dependencies,
invariants, scenarios).

Implications:

- Value transfer (see [`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md))
  does NOT require production-TS JSDoc to exist as a precondition for
  deletion-readiness — it only requires the executable feature carry
  the rule content.
- Annotations enrich discoverability for code-first navigation; they
  do not gate completion.
- A reviewer flagging "no annotations on `<file.ts>`" as a value-transfer
  blocker is mistaken — refer them here.

## Sibling references

- [`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md) — how this policy feeds
  the deletion gate.
- [`./spec-pattern-relationships.md`](./spec-pattern-relationships.md)
  — bipartite production↔test pattern graph + the
  `@architect-implements` realization edge.
- [`../SKILL.md`](../SKILL.md) §"Anti-anecdote" — the live graph/CLI
  is canonical; a stale skill paraphrase is not.

## Provenance (informational)

The split-ownership policy was originally codified in the architect
package's methodology doctrine and is now formalized in
`formal-spec/03-tag-system.md`; the canonical statement for plugin-internal
use lives here in the kernel. Tag definitions and required/repeatable
flags are derived live via `pnpm architect:query taxonomy --format json`
— re-verify against the CLI output rather than against any generated
`.md` if the two ever diverge.
