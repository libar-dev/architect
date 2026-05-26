# Architect Spec

> A formal specification for architecture-connected software specifications.
>
> **Version:** 0.2.0 (Draft)
> **Status:** Working draft — internal to the libar-dev/architect repo until ready for publication
> **License:** To be determined (targeting open specification license)

---

## What This Is

The Architect Spec defines a format for writing software specifications that are
**connected to your architecture** — not just documents that describe behavior, but
artifacts that carry metadata about dependencies, delivery status, business rules,
bounded contexts, and architecture layers. These specifications are parseable into a
queryable **pattern graph** that AI agents, documentation generators, and enforcement
tools consume.

The format is based on **Gherkin** (the Given/When/Then language from BDD) extended with
structured metadata tags, rule blocks with formal invariants, and deliverables tables that
link specs to implementation artifacts.

## What This Is Not

- **Not a toolchain specification.** This spec defines WHAT to write, not HOW to parse it.
  The reference implementation is [`@libar-dev/architect`](https://www.npmjs.com/package/@libar-dev/architect),
  but any toolchain could implement a parser conforming to this spec.
- **Not a methodology guide.** This spec defines the format and data model, not how to
  organize your team or run your sprints.
- **Not an alternative to OpenSpec.** OpenSpec and Architect Spec operate at different layers.
  OpenSpec manages change proposals in Markdown. Architect Spec connects specifications to
  architecture, code, and AI context. They are complementary, not competing.

## Why Formalize This

The approach described in this spec has been proven across two production codebases —
the `architect-studio` desktop app (then ~386 patterns / ~929 rules / 33 ADRs at peak)
and the `@libar-dev/architect-*` package family (currently 260 delivery patterns + 8
candidates / 347 rules / 9 ADRs+PDRs as of this draft):

| Metric                   | Without Spec Format | With Spec Format (reported peak across the two codebases) |
| ------------------------ | ------------------- | --------------------------------------------------------- |
| Daily velocity           | ~1,900 LOC/day      | ~10,100 LOC/day                                           |
| Specification coverage   | 50 files            | 530 files                                                 |
| Architecture decisions   | Ad hoc              | 33 formal ADRs (studio)                                   |
| Patterns tracked         | None                | 386 (258 completed) (studio peak)                         |
| Business rules extracted | None                | 929 machine-extractable rules (studio peak)               |
| Major rewrites           | Multiple            | Zero                                                      |

> _Informative:_ The current `@libar-dev/architect` reference repo runs a much smaller
> dogfood instance — its purpose is to govern the toolchain itself, not to be a
> production application. Numbers above are reported historical peaks across the two
> codebases, not current-repo measurements.

Formalizing the format enables:

1. **Third-party tooling** — anyone can build parsers, validators, and generators
2. **Interoperability** — specs written for one toolchain work with another
3. **Standardization** — teams adopt a proven format instead of inventing their own
4. **AI context engineering** — structured specs compress into session-aware AI context bundles

## Conformance Levels

Not every project needs the full spec. Three levels allow incremental adoption:

| Level | Name     | What's Required                                                                 | Value                                                                |
| ----- | -------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **1** | Minimal  | Tagged `.feature` files with `@architect` gate                                  | Parseable architecture metadata on Gherkin specs                     |
| **2** | Standard | Full tag system + deliverables table + Rule/Invariant structure + FSM lifecycle | Queryable pattern graph, business rule extraction, delivery tracking |
| **3** | Full     | Pattern graph generation + ProcessGuard enforcement + projections               | AI context bundles, scope-creep prevention, generated documentation  |

Start at Level 1. Graduate when you need more.

## Reading Guide

| Document                                                    | What It Covers                            | Read When                            |
| ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| [00 — Overview](00-overview.md)                             | Core concepts, component map, quick start | First. Always.                       |
| [01 — Conformance](01-conformance.md)                       | 3 levels, versioning, RFC 2119            | Understanding what's required        |
| [02 — Artifact Types](02-artifact-types.md)                 | 4 artifact types, directories, naming     | Setting up a project                 |
| [03 — Tag System](03-tag-system.md)                         | Tag mechanics, format types, ordering     | Writing your first spec              |
| [04 — Tag Registry](04-tag-registry.md)                     | Complete tag reference (50+ tags)         | Looking up a specific tag            |
| [05 — Feature Spec Format](05-feature-spec-format.md)       | Gherkin structure conventions             | Writing feature specs                |
| [06 — ADR Format](06-adr-format.md)                         | Architecture Decision Records             | Writing ADRs                         |
| [07 — Stub Format](07-stub-format.md)                       | TypeScript design stubs                   | Creating design stubs                |
| [08 — Spec Evolution](08-spec-evolution.md)                 | Plan → design → executable model          | Understanding the maturity lifecycle |
| [09 — Delivery Lifecycle](09-delivery-lifecycle.md)         | FSM, ProcessGuard, sessions               | Enforcing delivery process           |
| [10 — Pattern Graph](10-pattern-graph.md)                   | Data model specification                  | Building tooling                     |
| [11 — Project Configuration](11-project-configuration.md)   | Config format and role sets               | Configuring a project                |
| [12 — Live Documentation API](12-live-documentation-api.md) | Structured document serving via Data API  | Building live document views         |
| [Appendix A — Examples](appendix-a-examples.md)             | 6 complete annotated examples             | Learning by example                  |

## Relationship to @libar-dev/architect

The `@libar-dev/architect-*` package family is the **reference implementation** of this spec. As of v2.0 the implementation is split into five publishable packages plus a bin-only meta:

| Package                           | Role                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@libar-dev/architect-core`       | Canonical model, ingestion, graph build, scanner/extractor, taxonomy, config, read API (`PatternGraphAPI`).                                                                   |
| `@libar-dev/architect-projection` | Fragment-based projection pipeline (Zod-validated `RenderableDocument` blocks, renderers).                                                                                    |
| `@libar-dev/architect-guard`      | Policy, validation, ProcessGuard, step-lint, anti-pattern detection.                                                                                                          |
| `@libar-dev/architect-cli`        | Composition root and 7 bins (`architect`, `architect-generate`, `architect-guard`, `architect-validate`, `architect-lint-steps`, `architect-lint-patterns`, `architect-mcp`). |
| `@libar-dev/architect-mcp`        | MCP server, tool registry, file watcher, pipeline session.                                                                                                                    |
| `@libar-dev/architect` (meta)     | Bin-only re-export of the 7 bins. No JS API — JS consumers must import from the split that owns each symbol.                                                                  |

Together they provide:

- A scanner/extractor pipeline that parses annotated TypeScript and Gherkin
- `buildPatternGraph()` / `createPatternGraphAPI()` from `architect-core` producing and querying the pattern-graph data model described in §10
- A CLI with 22 user-facing subcommands (`overview`, `context`, `dep-tree`, `scope-validate`, `arch`, `rules`, …) for querying the graph
- An MCP server with 21 tools (`architect_overview`, `architect_context`, `architect_documentation`, …) for AI context delivery
- Projection-based documentation generation from the graph
- ProcessGuard for FSM enforcement described in §09

This spec defines the format. The toolchain implements it.

## Publication Trajectory

| Phase       | Location                                             | Status               |
| ----------- | ---------------------------------------------------- | -------------------- |
| **Phase 1** | `formal-spec/` folder in libar-dev/architect repo    | Current (v0.2 draft) |
| **Phase 2** | Standalone npm package (`@libar-dev/architect-spec`) | Planned              |
| **Phase 3** | Published HTML specification at `spec.libar.dev`     | Future               |

## CHANGELOG

### 0.2.1 (Draft) - 2026-05-08

- Removed `@architect-depends-on-external` and `@architect-parent-external` from the formal authored tag set. Cross-process soft links are now derived from surviving relationship data instead of separate authored tags.
- Removed the authored `@architect-sequence-orchestrator`, `@architect-sequence-step`, `@architect-sequence-module`, and `@architect-sequence-error` examples from the formal spec. Design ordering now lives in ordinary rule prose and scenario structure.
- Removed `@architect-extract-shapes` from the formal stub guidance. Exported TypeScript declarations are now the canonical contract surface for shape-oriented tooling.
- Narrowed the draft's migration story to the surviving authored taxonomy. Use `@architect-uses` for authored dependency vocabulary. The Wave 1–Wave 4 migration campaign record lived in `architect-studio/packages/architect-claude-plugin/MIGRATION.md` at the time of authoring; the same content will be reproduced in this repo's `MIGRATION.md` at the `2.0.0-pre.1` release (see Wave 4 of the repo `REMAINING-WORK.md`).

### 0.2.0 (Draft) - 2026-04-29

- Added `slice` enum value to `@architect-level` (alongside `epic`, `phase`, `task`) and supports
  named architectural slices (saved N-pattern views) as a new level of hierarchy distinct from
  delivery work. See §04 (Group 7) for the value table.
- Added `@architect-depends-on-external` (csv) and `@architect-parent-external` (value) to
  Group 4 (Relationships) for cross-process dependency expression. Form is
  `<process>:<pattern>` (e.g., `pkg:CandidateExtraction`). Soft-link semantics: extracted
  for visibility, not validated across delivery-process graphs.
- Added Idea Tier subsection in §08 (Spec Evolution) describing the lightest pre-candidate
  spec shape: `@architect-status:candidate` + `@architect-maturity:idea`, ≤30 lines (warn-only), six-tag
  minimum, no `Background:` block, no `Scenario:` blocks, rules-with-`**Invariant:**` only.
  Idea tier is not a new status — the idea and candidate tiers both sit at
  `@architect-status:candidate`, distinguished by `@architect-maturity` (`idea` vs `plan`).
- No new tags introduced for "track" or "consideration". The existing `@architect-maturity`
  enum (`idea` / `plan` / `design` / `executable`) is the lifecycle discriminator.

### 0.1.0 (Draft)

- Initial working draft.
