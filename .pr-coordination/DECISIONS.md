# Docs generation — decisions

> **Captured:** 2026-05-17. **Status:** approved by repo owner; superseding open
> questions in `DEEP-DIVE.md` § "Pending decisions for the design session"
> and `PROPOSED-DESIGN.md` § 9 where they overlap. Source-of-truth for the
> W-DOCS campaign sequencing in `PROPOSED-DESIGN.md` § 7.

## Read order

`README.md` → `DEEP-DIVE.md` → `INVENTORY.md` → `PROPOSED-DESIGN.md` → **this
file**. This file is the ratified output of the design session that consumed
the first four.

## Context — what changed since `PROPOSED-DESIGN.md` was drafted

Two design-session findings reshaped the proposal:

1. **The DeepWiki-style multi-file wiki tree with a generated index** is a
   distinct fourth reuse boundary, alongside multi-target output, ContentFragment,
   and generated-insert directives. It maps cleanly onto the existing
   `ProjectionBundle.children` + `BundleRouting.entityPathLayout` substrate
   (commits `1f0ad77`, `a7e647e`) — the routing primitive is already
   wiki-shaped; what was missing was the index projection.
2. **The UML/Gherkin substrate this repo already enforces** is a coherent
   minimal use-case model — `role` (stereotype), `bounded-context` (package),
   `extends` (generalization), `implements` (realization), `uses` (dependency),
   `see-also` (association), `parent`+`level` (containment hierarchy),
   Gherkin `Feature` (capability), `Rule` (invariant/OCL), `Scenario` (use
   case as Actor+goal+outcome). Every navigation surface a generated wiki
   index needs is a projection over this graph. **No new annotation
   carriers are added by this campaign.**

## Decisions

### D1 — Wiki-tree-with-index is a first-class doc shape

Add `WikiIndexDefinition` + `projectWikiIndex(def, ctx)` alongside
`DocDefinition`. A wiki tree is the natural shape for any "topic" that
exceeds ~300 lines as a single doc; the index page is a **derived
projection** of the children, not a hand-authored navigation surface.

A `WikiIndexDefinition` carries:

- `id`, `title`
- `root: DocDefinition` — produces the `ProjectionBundle<Fragment>` whose
  children become the wiki pages
- `readingPaths?: ReadingPath[]` — editorial cross-cutting reading paths
  (TypeScript code, not annotations); hierarchical reading paths are
  derived from `@architect-parent`/`@architect-level` walks (see D3a')
- `preambles?: PreambleMap` — per-page editorial framing

Everything in the index page (File Map, Concept Index, Key Entities Reference,
Diagram Catalog, header counts) is derived. No hand-authored navigation.

### D2 — Progressive disclosure has three orthogonal jobs, sharing one vocabulary

The `essential | important | useful | advanced` vocabulary applies to three
distinct concerns, each owned by a different layer. They compose without
conflict.

| Axis                   | Question it answers                                  | Mechanism                                                |
| ---------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| **INPUT disclosure**   | "Which sub-sections does this fragment emit?"        | `ContentFragment.build(ctx, { disclosure })` parameter   |
| **OUTPUT disclosure**  | "Does this doc render inline or split into files?"   | `bundle.routing.disclosureSpec` + `splitOversizedDocument` |
| **INDEX disclosure**   | "How deep does navigation expose the tree?"          | `WikiIndexDefinition` index page is itself a disclosure slice; readers descend by clicking |

Codebase implication: today's machinery conflates INPUT and OUTPUT under
`ProgressiveDisclosurePolicy`. The campaign separates them. The Zod schemas
keep the four-value enum; the *consumers* of that enum split.

### D3'' — No new annotation carriers; Concept Index sources from Gherkin

The Concept Index ("intent → file" inversion) is built from existing
executable-spec primitives, not from a new tag:

| Concept Index source                | Carrier                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Goal-shaped intents (actor + goal)  | Gherkin `Scenario:` titles (already typed via vitest-cucumber, executed in CI)  |
| Invariant-shaped intents            | Gherkin `Rule:` titles (already required to carry rationale + verified-by)      |
| Capability-shaped intents           | Gherkin `Feature:` name + description (one capability per file)                 |
| TS-only code participation          | Indirect via `@architect-implements <Pattern>` → graph join → that pattern's scenarios |

The Concept Index is a **graph join over PatternGraph**, not a string-clustering
pass. No paraphrase normalization needed; no free-text drift; no `@architect-usecase`
dependency.

**UML mapping used by the wiki index** (canonical for this repo, not
extensible per session):

| UML concept                       | Repo primitive                                |
| --------------------------------- | --------------------------------------------- |
| Stereotype                        | `@architect-role` (8-value enum)              |
| Package / System boundary         | `@architect-bounded-context`                  |
| Generalization                    | `@architect-extends`                          |
| Realization                       | `@architect-implements`                       |
| Dependency                        | `@architect-uses`                             |
| Association                       | `@architect-see-also`                         |
| Containment / package hierarchy   | `@architect-parent` + `@architect-level`      |
| Use case (Actor + goal + outcome) | Gherkin `Scenario:`                           |
| Invariant / OCL constraint        | Gherkin `Rule:`                               |
| Capability                        | Gherkin `Feature:`                            |

### D3a' — Reading Paths derive from hierarchy or are declared editorially

Two sources, no new annotation:

1. **Hierarchical reading paths** are derived by walking `@architect-parent`
   + `@architect-level` (re-rendering of `projectDependencyTree` already
   exposed via `pnpm architect:query dep-tree`). The wiki-index renders the
   walk as a numbered reading path.
2. **Cross-cutting editorial reading paths** are declared as a TypeScript
   field on `WikiIndexDefinition`:

   ```ts
   readingPaths: [
     {
       id: 'first-annotate',
       intent: 'I want to annotate a TypeScript service file for the first time',
       steps: [
         { routeId: '1-getting-started',         rationale: 'add @architect opt-in' },
         { routeId: '6-patterns-by-file-type',   rationale: 'find service-or-module pattern' },
         { routeId: '4-tag-reference/4-1-core',  rationale: 'look up required core tags' },
         { routeId: '7-verification/7-1-cli',     rationale: 'verify with pnpm architect:query' },
       ],
     },
   ]
   ```

   Editorial intent lives in code, not in production-code annotations. This
   is the only editorial-shaped surface in the wiki-index design.

### D3b — No `MetadataTagDefinition` schema additions

The existing tag-registry schema (`tag`, `kind`, `format`, `purpose`,
`description`, `example`, `required`, `repeatable`, `values`, `defaultValue`,
`groupName`) is sufficient for the wiki-index work. The `groupName` field
already drives the section headings in the generated TAXONOMY.md. No new
fields are added.

### D4 — `docs/ANNOTATION-GUIDE.md` is the W-DOCS-1 acceptance case

The trivial port target proposed in `PROPOSED-DESIGN.md` § 7 changes from
`CLI-REFERENCE.md` to `ANNOTATION-GUIDE.md`. The new case exercises
tag-registry extraction + wiki-index emission + multi-page output in one
end-to-end slice. The resulting tree shape:

```
docs-live/annotation-guide/
  INDEX.md                          ← projectWikiIndex output
  1-getting-started.md              ← preamble + JSDoc lifted from a canonical example
  2-ownership-model.md              ← projectTaxonomyDigest grouped by source-of-truth
  3-shape-extraction.md             ← extractJSDocProse on shape-extractor module
  4-tag-reference/                  ← bundle child directory; one page per groupName
    4-1-core-tags.md
    4-2-relationship-tags.md
    4-3-architecture-tags.md
    …
  5-format-types.md                 ← formatTypes[] from the taxonomy JSON
  6-patterns-by-file-type.md        ← preamble (genuinely editorial)
  7-verification/
    7-1-cli-commands.md             ← extractCliCommands (W-DOCS-2)
    7-2-common-issues.md            ← preamble
```

Acceptance: `pnpm docs:all` produces the tree above; `INDEX.md` carries File
Map, Concept Index (from Gherkin scenario/rule/feature titles of patterns
that contribute to any child page), Key Entities Reference, Diagram
Catalog, and Reading Paths; the manual `docs/ANNOTATION-GUIDE.md` is
deleted in the same PR.

### D5 — `docs/` and `formal-spec/` are deletion targets

Every doc in those directories is migrated to a wiki tree under
`docs-live/<topic>/` and the manual file is deleted. `formal-spec/`
collapses into `docs-live/formal-spec/` with one wiki per top-level
section (`00-overview`, `01-conformance`, …). The migration runs through
W-DOCS-5, W-DOCS-6, and W-DOCS-7; per-doc PRs delete the corresponding
manual file as part of the same commit.

The formal-spec `npm` package name (`@libar-dev/architect-spec`) stays;
only the on-disk shape changes.

### D6 — W-DOCS-1 starts with wiki substrate, not doc-by-doc port

Resequence the wave breakdown in `PROPOSED-DESIGN.md` § 7:

- **W-DOCS-1**: `DocDefinition` + `WikiIndexDefinition` types,
  `projectWikiIndex` projection, `composeDoc` helpers, runner integration.
  Acceptance: ANNOTATION-GUIDE.md ported (see D4).
- **W-DOCS-2**: extractor catalog (unchanged from `PROPOSED-DESIGN.md`).
- **W-DOCS-2d**: ContentFragments + INPUT-side disclosure integration
  (unchanged).
- **W-DOCS-3**: multi-target output (`DocTarget[]`) (unchanged).
- **W-DOCS-4**: generated-insert directive (unchanged).
- **W-DOCS-5**: port the 11 pre-refactor reference docs as wiki trees where
  they exceed ~300 lines, as single docs otherwise.
- **W-DOCS-6**: doctrine carriers (unchanged).
- **W-DOCS-7**: cleanup pass — delete `docs/` and `formal-spec/` source
  files migrated by then; rewrite remaining as wiki trees.
- **W-DOCS-8**: query surface gaps (unchanged; fully independent).

W-DOCS-1 now produces a wiki tree as its verification artifact, not a
single file. This proves the substrate at minimum useful scale before any
doc-by-doc port.

### D7 — Agent-context skills are wiki trees too

The W9 skills consolidation pulls into the same machinery. Each
`.agents/skills/architect-*-session/SKILL.md` is a `WikiIndexDefinition`
with `targets: [{ kind: 'agent-context', path: '.agents/skills/<skill>/' }]`.
The shared `_shared/` modules become ContentFragments at chosen INPUT
disclosure depths, embedded in multiple skill wikis with `linkToCanonical: true`
pointing at the canonical wiki under `docs-live/`. Closes the loop on
"agent-context as second target" without duplicating doc-generation
machinery.

### D8 — Index page emission is mechanical; navigation surfaces are reproducible

All five wiki-index navigation sections are derived from the rendered
bundle children + the graph. No hand-authored navigation.

| Section                  | Derivation                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Header counts            | Walk bundle children: `N pages`, `~M lines`, `K mermaid diagrams`, `T tables`.                          |
| File Map                 | One row per child. "Answers" = first paragraph of the page's source content (JSDoc summary / `Feature:` / `Rule:` invariant). "Key Entities" = extractor outputs for that child. |
| Concept Index            | Graph join: for each pattern contributing to any child page, collect Scenario/Rule/Feature titles → invert by intent string. |
| Key Entities Reference   | Aggregate extractor outputs across the tree; primary-definition page = the child where `@architect-pattern` / `@architect-implements` declares the symbol. |
| Diagram Catalog          | Walk `MermaidBlock` nodes; group by `mermaidType`; list per-page densities.                             |
| Reading Paths            | Hierarchical: re-render of `projectDependencyTree`. Editorial: from `WikiIndexDefinition.readingPaths`. |
| Validation               | Generated grep/rg commands that reproduce the header counts (per `WIKI-INDEXING-FORMAT.md` § 10).       |

### D9 — Follow-up (non-blocking): re-examine `@architect-usecase`

`@architect-usecase` is the lone free-text tag in Core. Its current shape
("trigger condition" / "When X happens") is closer to a Gherkin When-clause
than a UML use case (Actor + goal + outcome). The wiki-index campaign
explicitly does **not** rely on it.

Independently of this campaign, run:

```bash
pnpm architect:query tags                    # current adoption counts per value
pnpm architect:query taxonomy --format json  # canonical registry shape
```

Then decide:

- **Retire** — if adoption is sparse or the values overlap with Scenario titles.
- **Narrow** — rename to `@architect-applicability` (explicit trigger-condition
  semantics), keep free-text, fix the misnaming.

Either decision is out of scope for the W-DOCS waves; the docs campaign does
not block on it.

## Net taxonomy delta from the docs campaign

| Change                                                      | Count  |
| ----------------------------------------------------------- | ------ |
| Tags added                                                  | **0**  |
| Tags removed (under D9 follow-up; non-blocking)             | 0 or 1 |
| Tag-registry schema fields added                            | **0**  |
| New annotation carriers                                     | **0**  |

The campaign shrinks or holds the taxonomy. This matches the past refactor
direction and the doctrine pattern: when a new surface tempts vocabulary
growth, prefer projections over the existing graph.

## Cross-references

- `PROPOSED-DESIGN.md` § 7 — wave breakdown (resequenced by D6)
- `PROPOSED-DESIGN.md` § 10 (new) — wiki-index extension, type sketches
- `DEEP-DIVE.md` § Q3 — ContentFragment design (still load-bearing; D1
  builds on it)
- `INVENTORY.md` § 3b — surviving disclosure substrate (D2 separates its
  jobs)
- `.full-review/05-final-report.md` — P0/P1 substrate work landed before
  this design session (commits `a9ccdea` through `cc63f0a`)
- `.agents/skills/architect-data-api/SKILL.md` — canonical CLI/MCP surface
  used to verify the live taxonomy shape before drafting D3''/D3b
