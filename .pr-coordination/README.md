# Docs generation campaign — coordination

Pause-point context for the documentation-generation consolidation work. Captured 2026-05-17 during the W1.5 → W4 transition.

## What this is

A focused design-session input set for the next time we pick up documentation generation. The user is wrapping up two prerequisites first (core package extraction, skills consolidation), then returning to this.

## Read order

1. **`DEEP-DIVE.md`** — the headline finding, the architectural reframe, and the answers to the two big questions ("can PatternGraph extract what we need?" and "annotation-config vs rethink to something more flexible?"). Start here.
2. **`INVENTORY.md`** — concrete catalog: what exists in the post-W1.5 packages, what was dropped during the lift, what the pre-refactor monolith proved was possible. Use this for cross-reference while reading DEEP-DIVE.
3. **`PROPOSED-DESIGN.md`** — sketches of the new `DocDefinition` API, the extractor catalog, the multi-target output surface, and the wave breakdown for execution.

## Status

**Blocking decisions:** none — design space is well-understood, the user has approved restoring the dropped capability and intends to extend rather than clone the pre-refactor design.

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
