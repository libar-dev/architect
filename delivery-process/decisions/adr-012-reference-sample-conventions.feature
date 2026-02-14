@libar-docs
@libar-docs-pattern:ReferenceSampleConventions
@libar-docs-status:roadmap
@libar-docs-adr:012
@libar-docs-adr-status:accepted
@libar-docs-adr-category:architecture
@libar-docs-convention:reference-sample
Feature: ADR-012 Reference Sample Convention Content

  **Problem:**
  The reference doc showcase needs convention content that exercises all
  renderable block types: tables, code examples, mermaid diagrams,
  structured invariant/rationale annotations, and narrative text. The
  existing ADR-008 tagged with reference-sample only provides simple
  Rule blocks without rich content.

  **Decision:**
  Create a purpose-built decision file that serves as both a legitimate
  architectural decision AND a rich content source for the reference
  document showcase. The decision documents the rendering architecture
  choices that the showcase itself validates.

  **Consequences:**
  - (+) Reference sample exercises all convention content types
  - (+) Decision has genuine architectural value documenting renderer design
  - (+) Validates the convention extractor end-to-end
  - (-) File exists partly to serve as test fixture

  Background: Decision Context
    Given the following options were considered:
      | Option | Approach | Impact |
      | A | Tag existing decisions | Pulls unrelated content into showcase |
      | B | Purpose-built decision | Controls exactly which content types appear |
      | C | Synthetic test fixture | Not a real decision, violates code-first principle |

  Rule: Dual Rendering Architecture

    **Invariant:** Every RenderableDocument can be rendered by both
    renderToMarkdown (for human documentation) and renderToClaudeContext
    (for AI context), producing functionally equivalent content in
    format-appropriate representations.

    **Rationale:** Human readers need rich formatting (tables, collapsible
    sections, mermaid diagrams) while LLM consumers need token-efficient
    structured text. A single document model with two renderers avoids
    maintaining parallel content pipelines.

    **Verified by:** Claude context renders heading as section markers,
    Claude context produces fewer characters than markdown

    The renderer architecture maps 9 block types to two output formats:

    | Block Type | Markdown Output | Claude Context Output |
    | heading | Hash-prefixed headers | Section markers |
    | paragraph | Plain text | Plain text |
    | separator | Horizontal rule | Blank line |
    | table | Pipe-delimited | Pipe-delimited |
    | list | Bullet or numbered | Bullet or numbered |
    | code | Fenced code block | Fenced code block |
    | mermaid | Fenced mermaid block | Omitted |
    | collapsible | HTML details element | Flattened content |
    | link-out | Markdown link | Arrow-prefixed text |

    """mermaid
    stateDiagram-v2
        [*] --> RenderableDocument
        RenderableDocument --> renderToMarkdown : Human docs
        RenderableDocument --> renderToClaudeContext : AI context
        renderToMarkdown --> DocsOutput : docs/
        renderToClaudeContext --> ClaudeMdOutput : _claude-md/
    """

    @acceptance-criteria @happy-path
    Scenario: Both renderers produce valid output from same document
      Given a RenderableDocument with all 9 block types
      When rendered via renderToMarkdown
      And rendered via renderToClaudeContext
      Then both outputs contain the textual content
      And the claude context output omits mermaid blocks

  Rule: Codec-First Content Assembly

    **Invariant:** All generated documentation flows through the codec
    pipeline: MasterDataset to DocumentCodec to RenderableDocument to
    Renderer. No generator bypasses codecs to produce output directly.

    **Rationale:** Codecs are the single transformation layer between
    extracted data and renderable output. Bypassing them creates parallel
    formatting logic that drifts over time. The CompositeCodec enables
    combining multiple codec outputs without violating this constraint.

    **Verified by:** CompositeCodec combines multiple codec outputs

    """typescript
    // Codec composition enables flexible document assembly
    import { createCompositeCodec } from './codecs/composite.js';
    import { OverviewCodec } from './codecs/session.js';
    import { CurrentWorkCodec } from './codecs/session.js';

    const sessionBrief = createCompositeCodec(
      [OverviewCodec, CurrentWorkCodec],
      { title: 'Session Brief', separateSections: true }
    );
    const doc = sessionBrief.decode(dataset);
    """

    @acceptance-criteria @happy-path
    Scenario: Codec pipeline produces consistent output
      Given a MasterDataset with patterns and relationships
      When processed through the reference codec
      Then the RenderableDocument contains structured sections
      And no content is generated outside the codec pipeline

  Rule: Convention Tag Routing

    **Invariant:** Convention content is routed to reference documents via
    tag matching: patterns tagged with a convention value appear in any
    referenceDocConfig listing that value in its conventionTags array.

    **Rationale:** Tag-based routing decouples decision authoring from
    document assembly. Authors tag decisions with semantic convention
    values; document configs select which conventions to include. Adding
    a new decision to an existing reference doc requires only adding the
    appropriate convention tag.

    Convention routing follows this precedence:

    | Source Type | Extraction Method | Content Types |
    | Gherkin Rule blocks | parseBusinessRuleAnnotations | Tables, code, mermaid, invariant, rationale |
    | TypeScript JSDoc sections | Heading decomposition | Tables, narrative, structured annotations |

    @acceptance-criteria @happy-path
    Scenario: Convention tag routes content to reference doc
      Given a decision tagged with convention value "reference-sample"
      And a referenceDocConfig with conventionTags including "reference-sample"
      When the reference codec processes the MasterDataset
      Then convention content from the decision appears in the output
