# Docs generation campaign — coordination

Pause-point context for the documentation-generation consolidation work. Captured 2026-05-17 during the W1.5 → W4 transition.

## What this is

A focused design-session input set for the next time we pick up documentation generation. The user is wrapping up two prerequisites first (core package extraction, skills consolidation), then returning to this.

> **State of the substrate as of 2026-05-17:** the pre-W-DOCS-1 debt
> cleanup is done — see `NEXT-SESSION.md` for the commit-by-commit record
> and the maturity classification of every file in this folder. Session
> sequencing is owned by `architect-session-router` against whichever
> research artifact is the current focus; this folder is the input set,
> not the agenda.

## Read order

1. **`DEEP-DIVE.md`** — the headline finding, the architectural reframe, and the answers to the two big questions ("can PatternGraph extract what we need?" and "annotation-config vs rethink to something more flexible?"). Start here.
2. **`INVENTORY.md`** — concrete catalog: what exists in the post-W1.5 packages, what was dropped during the lift, what the pre-refactor monolith proved was possible. Use this for cross-reference while reading DEEP-DIVE.
3. **`PROPOSED-DESIGN.md`** — sketches of the new `DocDefinition` API, the extractor catalog, the multi-target output surface, the wave breakdown for execution, and the § 10 wiki-tree-with-index extension.
4. **`DECISIONS.md`** — ratified decisions D1–D12 from the 2026-05-17 design session. Supersedes the open questions in DEEP-DIVE and PROPOSED-DESIGN § 9 where they overlap; treat as source-of-truth for W-DOCS sequencing.
5. **`IDEATION-SPECS.md` + `ideation-specs/`** — idea-tier business-requirement specs (Gherkin shape, one user story + one invariant per file, ≤30 lines each). **Validation gate** before any design-tier session: the maintainer marks each spec ✅/❌/🔁; implementation does not begin until all marks are ✅.

## Status

**Blocking decisions:** none — design ratified in `DECISIONS.md` on 2026-05-17. W-DOCS-1 acceptance case is `docs/ANNOTATION-GUIDE.md` ported to a wiki tree under `docs-live/annotation-guide/`. Zero new annotation carriers added by the campaign.

**Prerequisites in flight (not blocking this work but should land first):**

- Core package extraction finalization (W1.5.x hardening backlog)
- Skills consolidation (W9)

**Implementation target:** Wave 4 of the REMAINING-WORK.md campaign, resequenced. See `PROPOSED-DESIGN.md` § Wave breakdown.

## Key external references

- **Pre-refactor proof artifacts** (the regression source — read-only reference):
  - `/Users/darkomijic/dev-projects/delivery-process/architect.config.ts` — the 9-entry `referenceDocConfigs` array that produced working reference docs.
  - `/Users/darkomijic/dev-projects/delivery-process/docs-live/reference/REFERENCE-SAMPLE.md` — 1,135-line kitchen-sink output showing all 5 Mermaid diagram types, TypeScript shape extraction with JSDoc preservation, behavior-spec collapsibles, ADR rendering.
  - `/Users/darkomijic/dev-projects/delivery-process/src/renderable/codecs/` — the 19 codec source files that were dropped during the package split.
  - `/Users/darkomijic/dev-projects/delivery-process/src/generators/built-in/` — the 7 generator source files including `claude-modules` (dual-target output) and the 3 dropped doc generators.
  - `/Users/darkomijic/dev-projects/delivery-process/docs-live/reference/*.md` — 11 docs, 4,430 total lines, all auto-generated pre-refactor. Use as the target output corpus.

- **Surviving in post-refactor (architecturally important):**
  - `packages/architect-core/src/config/presentation-contracts.ts` — `ReferenceDocConfig`, `DiagramScope`, diagram-type enum, shape-group enum. Schema still defined, no consumer.
  - `packages/architect-core/src/utils/markdown-parser.ts` — `parseMarkdownToBlocks()`, the foundation for preamble support.
  - `packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:64` — the hardcoded 12-entry generator dispatch table that's the current ceiling on `architect-generate` output.
  - `packages/architect-core/src/extractor/shape-extractor.ts` — `extractShapes()` + `discoverTaggedShapes()` (which already walks JSDoc for `@architect-extract-shapes`).

## Out of scope here

- The W9 skills consolidation work. Touches doc generation only insofar as agent-context modules might be a generator target (covered in PROPOSED-DESIGN § dual-target output).
- The W7 publish/cutover. Doc generation should be working before publish but the campaign is self-contained.
- Studio coordination (W8).
