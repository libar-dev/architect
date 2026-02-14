@libar-docs
@libar-docs-pattern:CrossCuttingDocumentInclusion
@libar-docs-status:completed
@libar-docs-phase:32
@libar-docs-effort:2d
@libar-docs-product-area:DeliveryProcess
@libar-docs-depends-on:DeclarationLevelShapeTagging,ReferenceDocShowcase
@libar-docs-business-value:enables-universal-content-routing-to-any-generated-document
@libar-docs-priority:high
Feature: Cross-Cutting Document Inclusion

  **Problem:**
  The reference doc codec assembles content from four sources, each with its
  own selection mechanism: conventionTags filters by convention tag values,
  behaviorCategories filters by pattern category, shapeSelectors filters by
  shape group or source, and diagramScopes filters by archContext or explicit
  pattern names. These selectors operate at different granularity levels.
  Convention and behavior selectors are coarse -- they pull ALL items matching
  a tag or category, with no way to select a single convention rule or a
  single behavior pattern for a focused showcase.

  More fundamentally, content-to-document is a many-to-many relationship.
  A CategoryDefinition interface should be includable in a Taxonomy Reference,
  a Configuration Guide, AND a claude.md architecture section simultaneously.
  But libar-docs-shape only supports one group, and behaviorCategories only
  supports one category per pattern. There is no cross-cutting tag that says
  "include this specific item in these specific documents."

  The experimental libar-docs-arch-view tag partially solved this for diagram
  scoping but its name is misleading -- it routes content, not architectural
  views. It should be replaced by a general-purpose include tag.

  **Solution:**
  Replace libar-docs-arch-view with libar-docs-include as a general-purpose
  CSV tag on both patterns and shape declarations. This tag acts as a
  document-routing mechanism alongside existing selectors. The tag controls
  two things: (1) diagram scoping -- DiagramScope gains an include field
  replacing archView, and (2) content routing -- ReferenceDocConfig gains an
  includeTags field. Content matching logic becomes: include if item matches
  existing selectors OR has a matching libar-docs-include tag value. The
  include tag is purely additive -- it never removes content that would be
  selected by existing filters.

  The tag is CSV format, so one item can appear in multiple documents:
  libar-docs-include:reference-sample,codec-system,config-guide

  This gives every content type (conventions, behaviors, shapes, diagrams)
  uniform per-item opt-in without changing how existing selectors work.

  **Design Decisions:**

  DD-1: Additive semantics (OR, not AND)
    The includeTags filter is unioned with existing selectors, not
    intersected. A pattern appears in a reference doc if it matches
    behaviorCategories OR has a matching include tag. Configs without
    includeTags behave identically to today. Configs with includeTags
    can pull in additional items that existing selectors cannot reach,
    without disrupting what existing selectors already select.

  DD-2: One tag replaces arch-view and adds content routing
    The libar-docs-include tag replaces the experimental arch-view tag
    entirely. DiagramScope.archView is renamed to DiagramScope.include.
    The same tag values that scope diagrams can also route content via
    ReferenceDocConfig.includeTags. One concept, one name. The arch-view
    tag, field names, registry entry, and all references are removed.

  DD-3: Works on both patterns and declarations
    For patterns (conventions, behaviors), the include tag lives in the
    file-level or feature-level libar-docs block and is extracted as
    part of the directive. For shapes, the include tag lives in the
    declaration-level JSDoc alongside libar-docs-shape. The shape
    extractor (discoverTaggedShapes) extracts both tags from the same
    JSDoc comment. The include values are stored on ExtractedShape as
    an optional includes: readonly string[] field.

  DD-4: Content type determines rendering, include tag determines routing
    The include tag does not change HOW content renders -- only WHERE
    it appears. A pattern with rules still renders as a behavior section.
    A shape still renders as a type code block. A convention still
    renders as convention tables. The include tag is orthogonal to
    content type. The codec determines rendering based on what the
    item IS, not how it was selected.

  **Pragmatic Constraints:**
  | Constraint | Rationale |
  | Include values are single tokens (no spaces) | Standard tag value convention, hyphen-separated |
  | No wildcard or glob matching on include values | Exact string match keeps selection predictable |
  | Additive only, no exclusion mechanism | Exclusion adds complexity; use separate configs instead |
  | Shape include requires libar-docs-shape tag too | Include routes a shape, but libar-docs-shape triggers extraction |

  **Implementation Path:**
  | Layer | Change | Effort |
  | registry-builder.ts | Replace arch-view with include in metadataTags (format: csv) | ~5 lines |
  | extracted-pattern.ts | Rename archView to include on directive schema | ~5 lines |
  | extracted-shape.ts | Add optional includes: readonly string[] field | ~3 lines |
  | doc-directive.ts | Rename archView to include on DocDirective | ~5 lines |
  | shape-extractor.ts | Extract libar-docs-include CSV from declaration JSDoc | ~15 lines |
  | doc-extractor.ts | Rename archView references to include | ~10 lines |
  | ast-parser.ts | Rename arch-view extraction to include | ~5 lines |
  | gherkin-ast-parser.ts | Rename archView field to include | ~5 lines |
  | reference.ts | Rename DiagramScope.archView to include, add includeTags to ReferenceDocConfig, add inclusion pass | ~35 lines |
  | project-config-schema.ts | Rename archView to include, add includeTags | ~5 lines |
  | transform-dataset.ts | Rename archView references to include in dataset views | ~10 lines |
  | master-dataset.ts | Rename byArchView to byInclude in dataset schema | ~5 lines |
  | reference-generators.ts | Update built-in configs from archView to include | ~5 lines |
  | pattern-scanner.ts | Rename arch-view extraction to include | ~3 lines |
  | delivery-process.config.ts | Update showcase config: rename archView, add includeTags | ~5 lines |
  | Source files (~8 files) | Replace libar-docs-arch-view annotations with libar-docs-include | ~8 lines |

  **Integration with Existing Selectors:**
  The reference codec decode method gains a new inclusion pass after the
  existing four content assembly steps. For each content type, the flow is:

  1. Existing selector produces initial content set
  2. Include tag pass finds additional items tagged for this document
  3. Results are merged (deduplicated by pattern name or shape name)
  4. Merged set is rendered using the existing section builders

  This means the include tag can pull a single behavior pattern into a
  reference doc without needing to create a dedicated behaviorCategory
  for it. It can pull a single convention rule without a unique
  conventionTag. The include tag closes the granularity gap for all
  content types uniformly.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Replace arch-view with include in tag registry | Complete | src/taxonomy/registry-builder.ts |
      | Rename archView to include on directive and pattern schemas | Complete | src/validation-schemas/ |
      | Includes field on ExtractedShape | Complete | src/validation-schemas/extracted-shape.ts |
      | Rename arch-view extraction to include in parsers | Complete | src/scanner/ |
      | Rename and extract include in doc extractor | Complete | src/extractor/doc-extractor.ts |
      | Extract include CSV from declaration JSDoc | Complete | src/extractor/shape-extractor.ts |
      | Rename DiagramScope.archView to include | Complete | src/renderable/codecs/reference.ts |
      | Add includeTags to ReferenceDocConfig with inclusion pass | Complete | src/renderable/codecs/reference.ts |
      | Rename archView in dataset views and transform | Complete | src/generators/pipeline/transform-dataset.ts |
      | Update all source file annotations from arch-view to include | Complete | src/**/*.ts |
      | Update configs: rename archView, add includeTags | Complete | delivery-process.config.ts |

  Rule: Include tag routes content to named documents

    **Invariant:** A pattern or shape with libar-docs-include:X appears in
    any reference document whose includeTags contains X. The tag is CSV,
    so libar-docs-include:X,Y routes the item to both document X and
    document Y. This is additive -- the item also appears in any document
    whose existing selectors (conventionTags, behaviorCategories,
    shapeSelectors) would already select it.

    **Rationale:** Content-to-document is a many-to-many relationship.
    A type definition may be relevant to an architecture overview, a
    configuration guide, and an AI context section. The include tag
    expresses this routing at the source, next to the code, without
    requiring the document configs to enumerate every item by name.

    **Verified by:** Pattern with include tag appears in matching doc,
    CSV include routes to multiple docs,
    Include is additive with existing selectors,
    Pattern without include tag is unaffected

    @acceptance-criteria @happy-path
    Scenario: Pattern with include tag appears in reference doc
      Given a pattern with tags:
        """
        @libar-docs
        @libar-docs-pattern:MyCodec
        @libar-docs-include:codec-system
        @libar-docs-core
        """
      And a reference doc config with includeTags "codec-system"
      And behaviorCategories is empty
      When the reference codec renders
      Then the behavior section includes "MyCodec"

    @acceptance-criteria @happy-path
    Scenario: CSV include routes pattern to multiple documents
      Given a pattern with tags:
        """
        @libar-docs
        @libar-docs-pattern:SharedType
        @libar-docs-include:codec-system,config-guide
        """
      And two reference doc configs:
        | Config | includeTags |
        | Codec System | codec-system |
        | Config Guide | config-guide |
      When each reference codec renders
      Then "SharedType" appears in both documents

    @acceptance-criteria @happy-path
    Scenario: Include is additive with existing selectors
      Given a pattern "ExistingBehavior" with category "infra"
      And a pattern "IncludedBehavior" with include tag "reference-sample"
      And a reference doc config with:
        | Field | Value |
        | behaviorCategories | infra |
        | includeTags | reference-sample |
      When the reference codec renders
      Then the behavior section includes both "ExistingBehavior" and "IncludedBehavior"

    @acceptance-criteria @edge-case
    Scenario: Pattern without include tag is unaffected
      Given a pattern "PlainPattern" with category "core" and no include tag
      And a reference doc config with includeTags "reference-sample"
      And behaviorCategories is empty
      When the reference codec renders
      Then "PlainPattern" does not appear in the behavior section

  Rule: Include tag scopes diagrams (replaces arch-view)

    **Invariant:** DiagramScope.include matches patterns whose
    libar-docs-include values contain the specified scope value.
    This is the same field that existed as archView -- renamed for
    consistency with the general-purpose include tag. Patterns with
    libar-docs-include:pipeline-stages appear in any DiagramScope
    with include: pipeline-stages.

    **Rationale:** The experimental arch-view tag was diagram-specific
    routing under a misleading name. Renaming to include unifies the
    vocabulary: one tag, two consumption points (diagram scoping via
    DiagramScope.include, content routing via ReferenceDocConfig.includeTags).

    **Verified by:** Diagram scope with include matches tagged patterns,
    Existing diagram configurations work after rename

    @acceptance-criteria @happy-path
    Scenario: Diagram scope uses include to select patterns
      Given patterns with include tags:
        | Pattern | include |
        | ConfigFactory | reference-sample |
        | DefineConfig | reference-sample |
        | PatternScanner | pipeline-stages |
      And a diagram scope with include "reference-sample"
      When the diagram is rendered
      Then it contains nodes for "ConfigFactory" and "DefineConfig"
      And it does not contain a node for "PatternScanner"

    @acceptance-criteria @happy-path
    Scenario: Pattern in diagram and content via same include tag
      Given a pattern "DefineConfig" with include tag "reference-sample"
      And a reference doc config with:
        | Field | Value |
        | includeTags | reference-sample |
        | diagramScopes | include: reference-sample |
      When the reference codec renders
      Then "DefineConfig" appears in the behavior section
      And "DefineConfig" appears as a diagram node

  Rule: Shapes use include tag for document routing

    **Invariant:** A declaration tagged with both libar-docs-shape and
    libar-docs-include has its include values stored on the ExtractedShape.
    The reference codec uses these values alongside shapeSelectors for
    shape filtering. A shape with libar-docs-include:X appears in any
    document whose includeTags contains X, regardless of whether the
    shape matches any shapeSelector.

    **Rationale:** Shape extraction (via libar-docs-shape) and document
    routing (via libar-docs-include) are orthogonal concerns. A shape
    must be extracted before it can be routed. The shape tag triggers
    extraction; the include tag controls which documents render it.
    This separation allows one shape to appear in multiple documents
    without needing multiple group values.

    **Verified by:** Shape with include appears in matching doc,
    Shape with both group and include works,
    Shape without include but with group still works

    @acceptance-criteria @happy-path
    Scenario: Shape with include tag appears in reference doc
      Given a TypeScript declaration:
        """typescript
        /**
         * @libar-docs-shape
         * @libar-docs-include reference-sample
         */
        export interface CategoryDefinition {
          readonly tag: string;
        }
        """
      And a reference doc config with includeTags "reference-sample"
      And shapeSelectors is empty
      When the reference codec renders
      Then the API Types section includes "CategoryDefinition"

    @acceptance-criteria @happy-path
    Scenario: Shape with both group and include works
      Given a TypeScript declaration:
        """typescript
        /**
         * @libar-docs-shape api-types
         * @libar-docs-include reference-sample,codec-system
         */
        export type SectionBlock = HeadingBlock | TableBlock;
        """
      And a reference doc config A with shapeSelectors group "api-types"
      And a reference doc config B with includeTags "codec-system"
      When each reference codec renders
      Then "SectionBlock" appears in both documents

    @acceptance-criteria @edge-case
    Scenario: Shape without include but with matching group still works
      Given a TypeScript declaration:
        """typescript
        /** @libar-docs-shape api-types */
        export type RiskLevel = 'low' | 'medium' | 'high';
        """
      And a reference doc config with shapeSelectors group "api-types"
      And no includeTags configured
      When the reference codec renders
      Then the API Types section includes "RiskLevel"

  Rule: Conventions use include tag for selective inclusion

    **Invariant:** A decision record or convention pattern with
    libar-docs-include:X appears in a reference document whose
    includeTags contains X. This allows selecting a single convention
    rule for a focused document without pulling all conventions
    matching a broad conventionTag.

    **Rationale:** Convention content is currently selected by
    conventionTags, which pulls all decision records tagged with a
    given convention value. For showcase documents or focused guides,
    this is too coarse. The include tag enables cherry-picking
    individual conventions alongside broad tag-based selection.

    **Verified by:** Convention with include appears in matching doc,
    Include works alongside conventionTags

    @acceptance-criteria @happy-path
    Scenario: Convention with include tag appears in reference doc
      Given a decision record with tags:
        """
        @libar-docs
        @libar-docs-convention:fsm-rules
        @libar-docs-include:reference-sample
        """
      And a reference doc config with includeTags "reference-sample"
      And conventionTags is empty
      When the reference codec renders
      Then the convention section includes the decision record

    @acceptance-criteria @happy-path
    Scenario: Include works alongside conventionTags
      Given a decision record "BroadConvention" with convention tag "output-format"
      And a decision record "IncludedConvention" with include tag "reference-sample"
      And a reference doc config with:
        | Field | Value |
        | conventionTags | output-format |
        | includeTags | reference-sample |
      When the reference codec renders
      Then both "BroadConvention" and "IncludedConvention" appear in the convention section
