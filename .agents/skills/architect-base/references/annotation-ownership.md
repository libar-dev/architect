# Annotation ownership

Reference for which `@architect-*` tags live on feature files versus on code stubs and production TypeScript. Used by the `architect-sessions` design, implement, and review-implementation references and by `architect-refactor-session`.

## Split-ownership principle

Feature files own _what_ and _when_ (planning). Code stubs and production TypeScript own _how_ and _with what_ (implementation). Neither duplicates the other.

This split is what lets the kernel state:

- A pattern is **identified** by its feature file.
- Production code **realizes** the pattern via `@architect-implements:<Pattern>` (a relation, not an identity claim).
- Production-TS `@architect-*` annotations are **additive enrichment**, not mandatory completion criteria.

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

| Tag                            | Purpose                                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `@architect-usecase`           | When/how to use                                                                                                        |
| `@architect-target`            | Stub's forward pointer to eventual production path                                                                     |
| `@architect-enforces-decision` | ADR/DD reference. The structured pattern→ADR edge (additive); `@architect-decision` is a doc-aggregation tag, not this |
| `@architect-role`              | Closed implementation-role enum                                                                                        |

## Code-originated patterns

Some patterns have no feature file because the code itself is the canonical definition: codecs (renderers), contracts (Zod schemas), and certain utilities. These patterns identify themselves on `.ts` source via `@architect-pattern:<Name>` and carry `@architect-role:codec | contract | utility | ...` on the same file. When source owns identity, that same source file also owns identity-coupled metadata such as `@architect-bounded-context` and any `@architect-uses` edges for that pattern. The PatternGraph extractor accepts production-TS identity for these roles.

Practical rule: `@architect-bounded-context` belongs on the owner of canonical identity. For planned behavior patterns, that owner is the feature file. For code-originated patterns, that owner is the `.ts` file carrying `@architect-pattern`. Do not duplicate the tag across both owners for the same pattern unless the second copy is an intentionally additive annotation with a different scope.

## When to use a feature file vs the source for identity

Use a feature file when the pattern represents planned behavior, business intent, or a UI/integration outcome. Anything where the Gherkin scenarios are part of the pattern's definition.

Use a `.ts` file when the pattern is purely structural, a contract, a serialization codec, a barrel, or a narrow utility, and a feature file would carry no scenarios beyond "the type compiles."

## Do not duplicate identity

"Duplicate" means the **same pattern name** on two owners. If a feature owns identity for pattern `X`, do NOT also author `@architect-pattern:X` on the realizing code. Keep `@architect-bounded-context` and feature-level `@architect-uses` on the owning feature. Put `@architect-implements:X` (relation, not identity) on the realizing file. The feature still owns `X`.

This is **not** a ban on code carrying _any_ `@architect-pattern`. A code/contract **stub** (or shipped module) realizing a behavioral feature carries its **own, distinct** code-originated identity, for example `@architect-pattern:EmissionDescriptor` (`@architect-role:contract`) with `@architect-implements:TaxonomyDocumentationCluster`. That is the bipartite design↔contract split, the same shape as test↔production, **not** duplication: the names differ, so `mergePatterns` sees no collision. `formal-spec/04-tag-registry.md` makes `@architect-pattern` a **MUST on stubs**, and ADR-003 records that identity **travels with the code from stub through production**. A node-less code stub is the anti-pattern. Its `@architect-implements` edge is dropped and it is invisible to `g.pattern()` reads, `architect_bundle`, and `implementedBy` traversals. The lone exception is the **step-definition stub** (`architect/step-stubs/`), which carries no `@architect-pattern` (ADR-008): the spec owns identity, and the step stub only realizes scenarios.

Authoring-syntax note: the `@architect-pattern:Name` / `@architect-implements:Name` forms above are naming shorthand. In an actual `.ts` stub or module these tags are **space**-separated, `@architect-pattern EmissionDescriptor`, `@architect-implements TaxonomyDocumentationCluster`, `@architect-target …`, while `@architect-role:` / `@architect-bounded-context:` keep the colon. `.feature` files use the colon for `@architect-pattern:` / `@architect-implements:`. Full rule: [`taxonomy.md`](taxonomy.md).

## Do not duplicate explanation

Identity is normalized. Pattern `X` is explained on **one** canonical owner (its feature file, or for a code-originated pattern its `.ts`). Prose is normalized the same way: the pattern's **what and why** live on that one owner, never copied onto its edges.

- A file carrying `@architect-implements:X` documents **this file's local how**, the implementation choice, the gotcha, the local constraint, not what `X` is or why it exists. _N_ files implementing `X` must not carry _N_ paraphrases of `X`'s purpose. That denormalizes the canonical node's prose onto its realization edges, the prose form of the ADR-006 single-read-model violation. When the local note would add nothing beyond "this realizes X," the `@architect-implements:X` edge alone is the documentation.
- A **step-definition** stub (`architect/step-stubs/`; no `@architect-pattern`, per ADR-008) carries **wiring**, not narration. Re-stating the rule or scenario the spec already owns is the stub form of transcription bloat. The spec owns that prose. The step stub binds it to steps.
- A **code/contract** stub carries its own identity and the shape decisions production code will need (types, signatures, why-this-shape), but not a re-explanation of the behavioral pattern it implements. That lives on the feature it points at via `@architect-implements`.

This is the authoring-time sibling of the value-transfer **Transcription bloat** anti-pattern in [`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md): both enforce one home per explanation.

## Production-TS annotations are additive, not mandatory

A pattern can be `@architect-status:completed` with **zero** `@architect-*` JSDoc on the production source, provided the executable feature carries the full record (pattern identity, status, dependencies, invariants, scenarios).

Annotations are curated, not a coverage quota.

Implications:

- Value transfer (see [`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md)) does NOT require production-TS JSDoc to exist as a precondition for deletion-readiness. It only requires the executable feature carry the rule content.
- Annotations enrich discoverability for code-first navigation. They do not gate completion.
- A reviewer flagging "no annotations on `<file.ts>`" as a value-transfer blocker is mistaken. Refer them here.

## Sibling references

- [`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md). How this policy feeds the deletion gate.
- [`./spec-pattern-relationships.md`](./spec-pattern-relationships.md). Bipartite production↔test pattern graph + the `@architect-implements` realization edge.
- [`../SKILL.md`](../SKILL.md) §"Anti-anecdote". The live PatternGraph via `pnpm architect:q` is canonical. A stale skill paraphrase is not.

## Provenance (informational)

The split-ownership policy was originally codified in the architect package's methodology doctrine and is now formalized in `formal-spec/03-tag-system.md`. The canonical statement for plugin-internal use lives here in the kernel. Tag definitions and required/repeatable flags are enumerated in the generated `docs-live/TAXONOMY.md`. Re-verify against a fresh regeneration (`pnpm docs:all`) rather than against any stale copy if the two ever diverge.
