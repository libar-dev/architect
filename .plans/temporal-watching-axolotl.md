# Design Session: Doc Quality Audit & Consolidation Plan

## Context

The website (`libar.dev/delivery-process/reference/architecture/`) shows the **old pre-refactoring
ARCHITECTURE.md** — the 14-section, 1,287-line version complete with "Programmatic Usage" and
"Extending the System" sections that Phase 4 removed. The refactored 358-line version has not yet
been deployed.

Two separate problems emerged from reviewing the doc output:

1. **Structural**: `docs-generated/` is chaotic (two output paths, intermediate files mixed with
   production references), and `docs-live/` is correct but incomplete.
2. **Quality**: Generated docs have significant verbosity and clarity issues from both the Claude
   agent and human developer perspectives.

---

## Problem 1: docs-live vs docs-generated Structure

### Current state (confusing)

```
docs-generated/
├── _claude-md/architecture/          ← compact claude context (ARCHITECTURE scope)
│   ├── architecture-codecs.md
│   ├── architecture-types.md
│   └── reference-sample.md
├── docs/                             ← full reference docs
│   ├── ARCHITECTURE-CODECS.md (19 KB)
│   ├── ARCHITECTURE-TYPES.md (14 KB)
│   └── REFERENCE-SAMPLE.md (44 KB)
├── business-rules/                   ← per-area business rules
├── taxonomy/                         ← taxonomy reference
├── TAXONOMY.md, BUSINESS-RULES.md   ← root-level generated files
└── annotation.md, generation.md...  ← root-level compact files (redundant with docs-live/_claude-md/)

docs-live/
├── _claude-md/                       ← compact claude context (product-area scope)
│   ├── annotation/, configuration/, ... (7 product areas)
├── decisions/                        ← ADRs (7 files)
├── product-areas/                    ← full product area docs (MASSIVE: 700+ KB total)
│   ├── ANNOTATION.md  (81 KB)
│   ├── GENERATION.md  (233 KB)       ← single file, 233 KB
│   ├── DATA-API.md    (102 KB)
│   └── ...
├── PRODUCT-AREAS.md
└── DECISIONS.md
```

### Target state (clean)

**`docs-live/`** — everything a user, Claude agent, or website visitor would read:

```
docs-live/
├── _claude-md/                       ← all compact claude context (both scopes)
│   ├── architecture/                 ← moved from docs-generated/_claude-md/architecture/
│   └── product-areas/                ← existing
├── decisions/                        ← ADRs (existing)
├── product-areas/                    ← full product area docs (existing)
├── reference/                        ← NEW: reference docs moved from docs-generated/docs/
│   ├── ARCHITECTURE-CODECS.md
│   ├── ARCHITECTURE-TYPES.md
│   └── (REFERENCE-SAMPLE.md optional)
├── PRODUCT-AREAS.md
└── DECISIONS.md
```

**`docs-generated/`** — intermediate/internal compilation artifacts only:

```
docs-generated/
├── business-rules/                   ← internal (not website-published)
├── taxonomy/                         ← internal
└── TAXONOMY.md, BUSINESS-RULES.md   ← internal summaries
```

**Key changes:**

- Move `docs-generated/docs/` → `docs-live/reference/` (production reference docs belong there)
- Move `docs-generated/_claude-md/architecture/` → `docs-live/_claude-md/architecture/`
- Remove root-level compact files from `docs-generated/` (they duplicate docs-live/\_claude-md/)
- Update `delivery-process.config.ts` output directory configs for reference docs

---

## Problem 2: Website Shows Stale Content

The published `libar.dev` still serves the pre-refactoring ARCHITECTURE.md (14 sections). The
358-line refactored version needs to be deployed. This is a publishing/deployment issue, not a
code issue — the source `docs/ARCHITECTURE.md` is already correct.

**Action required:** The website deployment needs to pick up the current `docs/ARCHITECTURE.md`.
This is likely a VitePress/Docusaurus site that reads from `docs/`. No code changes — just deploy.

---

## Problem 3: Quality Issues — Claude Agent Perspective

### Issue A: Product area docs are too large for context windows

| File | Size | Problem |
| GENERATION.md | 233 KB | Single file, impossible to load in context |
| DATA-API.md | 102 KB | Too large for targeted queries |
| ANNOTATION.md | 81 KB | Manageable but still large |

**Root cause:** Product area docs contain ALL patterns, all scenarios, all relationships in one
file. Claude doesn't need full specs — it needs the summary view.

**Fix direction:** The `_claude-md/` compact versions (1.5-7.5 KB each) are the RIGHT approach.
But they need to be complete enough to replace the full docs. Current compact versions may be
too sparse (e.g., `process-overview.md` is 7.5 KB but `generation-overview.md` is only 1.4 KB
despite GENERATION.md being 233 KB). Generation compact version is critically undersized.

### Issue B: REFERENCE-SAMPLE.md has 500+ lines of exact duplication

The same canonical value tables appear TWICE:

- First time: in the main section (lines 8-99)
- Second time: in the "expanded rule detail" section (lines 712-829)

Identical tables, word for word. For Claude consuming this doc, this is wasted tokens with zero
information gain. The expanded rule section should show ONLY invariant + rationale + verification
(not re-duplicate the table).

**Estimated savings:** ~200 lines (from 1,166 to ~966 lines, with same information density).

### Issue C: ARCHITECTURE-TYPES.md content is confusing

The file starts with "Orchestrator Pipeline Responsibilities" — which is about the orchestrator,
not "Architecture Types". The pipeline-architecture convention content and the MasterDataset
shape content are mixed without clear separation. An agent querying "what is MasterDataset" gets
orchestrator prose before finding the types.

**Fix direction:** Separate into clear sections: (1) Type definitions first, (2) Convention
content second.

### Issue D: Missing API import information

Generated docs reference types (`MasterDataset`, `RenderableDocument`, etc.) but never show
import paths. An agent implementing a custom codec has no machine-readable source for:

```typescript
import { type MasterDataset } from '@libar-dev/delivery-process';
```

**Fix direction:** Each type in ARCHITECTURE-TYPES.md should include its source file path
(extractable from annotations as `@libar-docs-file`).

---

## Problem 4: Quality Issues — Human Developer Perspective

### Issue A: Product area docs are too large to read in a browser

GENERATION.md at 233 KB is a wall of content. A developer visiting the website searching for
"how to write a codec" cannot find it without browser search. The progressive disclosure pattern
(main summary + detail files) exists in some codecs but the product area docs don't use it.

**Fix direction:** Product area docs need a summary/index at the top linking to major sections.
The existing docs already have headings — they need anchor links and a TOC.

### Issue B: REFERENCE-SAMPLE.md exists but is unclear what it IS

The file is titled "Reference Generation Sample" which means nothing to a new developer. It's
actually the canonical values reference for the delivery-process taxonomy — FSM states, product
areas, deliverable statuses, tag formats. That's valuable information buried under a confusing name.

**Fix direction:** Rename/retitle to "Taxonomy Reference" or "Canonical Values Reference".

### Issue C: docs/INDEX.md shows old navigation

The INDEX.md was written before Phase 4 refactoring and may still reference the old
ARCHITECTURE.md sections. It should reflect the current doc structure.

### Issue D: No "getting started" path for new package users

The website has Tutorial (10 parts) but the Reference section dumps users into the full
ARCHITECTURE.md without a "what to read first" guide. A human dev visiting the site doesn't
know whether to read Reference first or Tutorial first.

---

## Priority Matrix for Future Specs

| Improvement | Audience | Effort | Impact | Phase |
| Move reference docs to docs-live/ | Both | Low | Medium | Next |
| Remove REFERENCE-SAMPLE duplication | Claude | Low | High | Next |
| Fix Generation compact \_claude-md (1.4 KB → 5+ KB) | Claude | Low | High | Next |
| Fix ARCHITECTURE-TYPES section ordering | Claude | Low | Medium | Next |
| Add source file paths to type definitions | Claude | Medium | High | Future |
| Add TOC to product area docs | Human | Low | Medium | Next |
| Rename REFERENCE-SAMPLE to Taxonomy Reference | Human | Low | Low | Next |
| Update INDEX.md for post-Phase 4 structure | Human | Low | Medium | Next |
| Getting started guide (10-min path) | Human | High | High | Future |

---

## Design Decisions for Next Specs

**DD-1: docs-live/ is the single output directory for website-published content**
All content that appears on `libar.dev` comes from `docs-live/`. The `docs-generated/`
directory is for intermediate files, internal references, and `_claude-md/` context bundles
consumed by CLAUDE.md integration — not the public website.

**DD-2: Compact `_claude-md/` versions are the Claude contract, not full product area docs**
Claude sessions should consume `_claude-md/` compact versions (target: 3-8 KB per area).
The compact versions should be complete enough for agents to understand the area without the
full 100-233 KB docs. Undersized compact versions (like generation at 1.4 KB) need enrichment.

**DD-3: Reference docs are structured knowledge, not convention docs**
`ARCHITECTURE-CODECS.md` and `ARCHITECTURE-TYPES.md` are reference documents (type definitions,
codec options). The convention-tag mechanism generates them. They should live in `docs-live/reference/`
alongside the product area overview docs, not buried in `docs-generated/docs/`.

**DD-4: REFERENCE-SAMPLE.md duplication is a codec rendering bug**
The behavior specs section re-renders the same canonical value tables that already appear in the
main section. This is a codec rendering issue where "expanded rule detail" includes the full table
instead of just the rule metadata (invariant, rationale, verified-by). Fix the codec, not the content.

---

## What This Session Does NOT Produce

- Implementation code (no codec changes, no config changes)
- Feature specs for individual improvements (those are next session's output)
- A published website update (deployment concern, not code)

## Files That Change in This Design Session

None — this is a pure analysis and design session. Output is this plan + verbal recommendations.
The next session(s) will produce: (1) feature spec for docs-live consolidation, (2) feature spec
for quality improvements to generated docs.
