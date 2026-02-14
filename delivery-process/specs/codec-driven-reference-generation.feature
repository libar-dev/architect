@libar-docs
@libar-docs-pattern:CodecDrivenReferenceGeneration
@libar-docs-status:completed
@libar-docs-unlock-reason:Retroactive-spec-for-completed-work
@libar-docs-phase:27
@libar-docs-effort:5d
@libar-docs-product-area:DeliveryProcess
@libar-docs-depends-on:DocGenerationProofOfConcept,ScopedArchitecturalView
@libar-docs-business-value:eliminates-per-document-recipe-features-with-config-driven-generation
@libar-docs-priority:high
Feature: Codec-Driven Reference Generation

  **Problem:**
  Each reference document (Process Guard, Taxonomy, Validation, etc.) required a
  hand-coded recipe feature that duplicated codec setup, rendering, and file output
  logic. Adding a new reference document meant creating a new feature file, a new
  codec wrapper, and a new generator class -- all following the same pattern.

  **Solution:**
  A single `createReferenceCodec` factory driven by `ReferenceDocConfig` objects.
  Each config declares four content sources -- convention tags, diagram scopes,
  shape source globs, and behavior categories -- that compose automatically in
  AD-5 order. 13 configs produce 27 generators (13 detailed for `docs/` +
  13 summary for `_claude-md/` + 1 meta-generator).

  **Why It Matters:**
  | Benefit | How |
  | Zero-code new documents | Add a config object, get two output files |
  | Consistent structure | Every reference doc follows the same composition order |
  | Two detail levels | Detailed (full source, diagrams) and summary (compact tables) |
  | Convention-driven content | Decision records auto-populate via tag matching |
  | Shape extraction | TypeScript types rendered from AST, not duplicated in prose |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | ReferenceDocConfig interface | complete | src/renderable/codecs/reference.ts |
      | createReferenceCodec factory | complete | src/renderable/codecs/reference.ts |
      | Convention section builder | complete | src/renderable/codecs/reference.ts |
      | Shape section builder (AD-6) | complete | src/renderable/codecs/reference.ts |
      | Behavior section builder | complete | src/renderable/codecs/reference.ts |
      | AD-5 composition order | complete | src/renderable/codecs/reference.ts |
      | 13 reference configs | complete | src/generators/built-in/reference-generators.ts |
      | ReferenceDocGenerator class | complete | src/generators/built-in/reference-generators.ts |
      | ReferenceDocsGenerator meta-generator | complete | src/generators/built-in/reference-generators.ts |
      | Convention extractor | complete | src/renderable/codecs/convention-extractor.ts |

  Rule: Config-driven codec replaces per-document recipe features

    **Invariant:** A single `ReferenceDocConfig` object is sufficient to produce
    a complete reference document. No per-document codec subclass or recipe feature
    is required.

    **Rationale:** The codec composition logic is identical across all reference
    documents. Only the content sources differ. Extracting this into a config-driven
    factory eliminates N duplicated recipe features and makes adding new documents
    a one-line config addition.

    **Verified by:** All 13 configs produce valid documents,
    Empty config produces fallback content

    @acceptance-criteria @happy-path
    Scenario: Config with matching data produces a complete document
      Given a ReferenceDocConfig with convention tags and shape sources
      And a MasterDataset with patterns matching those tags and sources
      When the reference codec renders the document
      Then the output contains convention sections, shape sections, and metadata

    @acceptance-criteria @edge-case
    Scenario: Config with no matching data produces fallback content
      Given a ReferenceDocConfig with tags that match no patterns
      And an empty MasterDataset
      When the reference codec renders the document
      Then the output contains "No content found" fallback message

  Rule: Four content sources compose in AD-5 order

    **Invariant:** Reference documents always compose content in this order:
    conventions, then scoped diagrams, then shapes, then behaviors. Empty sources
    are omitted without placeholder sections.

    **Rationale:** AD-5 established that conceptual context (conventions and
    architectural diagrams) should precede implementation details (shapes and
    behaviors). This reading order helps developers understand the "why" before
    the "what".

    **Verified by:** Composition order follows conventions-diagrams-shapes-behaviors,
    Convention and behavior content compose together

    @acceptance-criteria @happy-path
    Scenario: Composition follows AD-5 order
      Given a config with all four content sources populated
      When the reference codec renders at detailed level
      Then conventions appear before diagrams
      And diagrams appear before shapes
      And shapes appear before behaviors

    @acceptance-criteria @happy-path
    Scenario: Empty sources are omitted gracefully
      Given a config with only convention tags (no shapes, no behaviors, no diagrams)
      And a MasterDataset with matching conventions
      When the reference codec renders the document
      Then only convention sections appear
      And no empty placeholder sections exist

  Rule: Detail level controls output density

    **Invariant:** Three detail levels produce progressively more content from the
    same config. Summary: type tables only, no diagrams, no narrative. Standard:
    narrative and code examples, no rationale. Detailed: full rationale, property
    documentation, and scoped diagrams.

    **Rationale:** AI context windows need compact summaries. Human readers need
    full documentation. The same config serves both audiences by parameterizing
    the detail level at generation time.

    **Verified by:** Summary produces compact tables,
    Detailed includes full rationale

    @acceptance-criteria @happy-path
    Scenario: Summary level produces compact type tables
      Given a config with shape sources matching TypeScript types
      When the reference codec renders at summary level
      Then shapes appear as a two-column table (Type, Kind)
      And no source code blocks appear
      And no mermaid diagrams appear

    @acceptance-criteria @happy-path
    Scenario: Detailed level includes full source and rationale
      Given a config with conventions and shape sources
      When the reference codec renders at detailed level
      Then convention sections include rationale text
      And shapes include full source code blocks
      And scoped diagrams are rendered as mermaid

  Rule: Generator registration produces paired detailed and summary outputs

    **Invariant:** Each ReferenceDocConfig produces exactly two generators
    (detailed for `docs/`, summary for `_claude-md/`) plus a meta-generator
    that invokes all pairs. Total: N configs x 2 + 1 = 2N + 1 generators.

    **Rationale:** Every reference document needs both a human-readable detailed
    version and an AI-optimized compact version. The meta-generator enables
    `pnpm docs:all` to produce every reference document in one pass.

    **Verified by:** All 27 generators are registered,
    Generators follow naming convention

    @acceptance-criteria @happy-path
    Scenario: All 27 generators are registered from 13 configs
      Given 13 ReferenceDocConfig entries
      When reference generators are registered
      Then 27 generators exist in the registry

    @acceptance-criteria @happy-path
    Scenario: Detailed generators use kebab-case-reference naming
      Given the registered reference generators
      Then detailed generators end with "-reference"
      And summary generators end with "-reference-claude"
