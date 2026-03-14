@architect
@architect-pattern:GeneratedDocQuality
@architect-status:completed
@architect-phase:38
@architect-effort:2d
@architect-product-area:Generation
@architect-depends-on:DocsLiveConsolidation
@architect-business-value:removes-500-lines-duplication-and-fixes-claude-context-coverage-for-generation-area
@architect-priority:high
Feature: Generated Documentation Quality Improvements

  **Problem:**
  Four quality issues reduce the usefulness of generated docs for both Claude agents
  and human developers: (1) REFERENCE-SAMPLE.md re-renders canonical value tables
  twice — 500+ duplicate lines with zero information gain; (2) the Generation product
  area compact file is 1.4 KB for a 233 KB area — critically undersized; (3)
  ARCHITECTURE-TYPES.md opens with orchestrator prose instead of type definitions,
  burying the content Claude most needs; (4) product area docs (GENERATION.md 233 KB,
  DATA-API.md 102 KB) have no navigation TOC, making browser traversal impractical.

  **Solution:**
  Fix the reference codec's behavior-specs renderer to stop duplicating convention
  tables. Enrich the Generation product area compact template. Reorder
  ARCHITECTURE-TYPES.md to lead with type definitions. Add a generated TOC block
  to product area doc headers.

  **Why It Matters:**
  | Benefit | Audience |
  | Removes ~200 wasted token-lines per REFERENCE-SAMPLE.md read | Claude |
  | Generation compact usable as standalone context (1.4 KB → 4+ KB) | Claude |
  | ARCHITECTURE-TYPES.md answers "what is MasterDataset?" immediately | Claude |
  | 233 KB product area docs become navigable in a browser | Human devs |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Fix behavior-specs renderer: no duplicate convention tables | complete | src/renderable/codecs/reference.ts | Yes | unit |
      | Enrich Generation _claude-md/ compact (target: 4+ KB) | complete | src/renderable/codecs/reference.ts | Yes | integration |
      | Reorder ARCHITECTURE-TYPES.md: types first, convention content second | complete | architect.config.ts, src/renderable/codecs/reference.ts | Yes | integration |
      | Add generated TOC block to product area doc headers | complete | src/renderable/codecs/reference.ts | Yes | integration |

  Rule: Behavior-specs renderer does not duplicate convention table content

    **Invariant:** When the reference codec renders a convention rule that contains
    a table, the table appears exactly once in the output: in the main convention
    section. The behavior-specs (expanded rule detail) section shows only the
    Invariant, Rationale, and Verified-by metadata — not the table body. A
    convention section with N tables produces exactly N table instances in the
    generated document, regardless of detail level.

    **Rationale:** DD-4: The current renderer re-includes the full convention
    table when rendering the expanded rule detail section. For REFERENCE-SAMPLE.md
    with 5 canonical value tables, this produces 500+ lines of exact duplication.
    Agents consuming this file waste context on content they already parsed.
    Human readers see the same table twice in the same scroll view.

    **Verified by:** Convention tables appear once in output,
    Behavior-specs shows rule metadata only

    @acceptance-criteria @happy-path
    Scenario: Convention rule table appears exactly once in generated output
      Given a ReferenceDocConfig with a convention rule containing a markdown table
      When the reference codec generates at detailed level
      Then the table appears once in the convention section
      And the behavior-specs expanded detail shows invariant and rationale only
      And no duplicate table rows exist in the document

    @acceptance-criteria @validation
    Scenario: REFERENCE-SAMPLE.md contains no duplicate table content after fix
      Given the reference-sample config regenerated after codec fix
      When the output is compared line by line
      Then each canonical value table appears exactly once
      And total document length is under 966 lines (down from 1166)

  Rule: Compact _claude-md/ files are self-sufficient for their product area

    **Invariant:** Each product area compact (`_claude-md/<area>/<area>-overview.md`)
    is self-sufficient as a standalone context file — an agent reading only the
    compact can answer: what does this area do, what are its key patterns, what are
    its invariants, and what files to read for details. Minimum target: 4 KB.
    The Generation compact is a specific gap: 1.4 KB for an area with 20+ codecs
    and the entire rendering pipeline.

    **Rationale:** DD-2: `_claude-md/` compacts are the Claude consumption contract.
    A 1.4 KB compact for the largest product area (233 KB) means agents have no
    usable summary context for Generation. They fall back to reading the full file
    or hallucinating based on names alone. The contract requires each compact to be
    a genuine summary, not a stub.

    **Verified by:** Generation compact >= 4 KB with codec list and pipeline summary,
    All area compacts self-sufficient without full product area doc

    @acceptance-criteria @happy-path
    Scenario: Generation compact contains codec inventory and pipeline summary
      Given the Generation product area compact regenerated with enriched template
      When its content is checked
      Then it contains a list of all major codecs with one-line purposes
      And it contains the four-stage pipeline summary (Scanner-Extractor-Transformer-Codec)
      And its file size is at least 4 KB

  Rule: ARCHITECTURE-TYPES.md leads with type definitions, not convention content

    **Invariant:** ARCHITECTURE-TYPES.md opens with the MasterDataset type definitions
    section before any pipeline-architecture convention content. An agent querying
    "what is MasterDataset" finds the type definition within the first 30 lines.
    The pipeline-architecture convention prose (orchestrator responsibilities, pipeline
    steps) follows the type definitions section.

    **Rationale:** The file is named ARCHITECTURE-TYPES — type definitions are the
    primary content. The pipeline-architecture convention content was added as a
    secondary layer. Current output opens with orchestrator prose, burying the type
    definitions that both Claude and human developers are most likely seeking.
    Section ordering in ReferenceDocConfig determines render order.

    **Verified by:** Type definitions appear in first 30 lines,
    Pipeline convention content follows types section

    @acceptance-criteria @happy-path
    Scenario: MasterDataset type definition appears before orchestrator prose
      Given ARCHITECTURE-TYPES.md generated with shapes section ordered before conventions
      When the first 30 lines are read
      Then MasterDataset or a related type definition appears
      And no orchestrator responsibility prose appears before the first type definition
