@libar-docs
@libar-docs-pattern:CompositeCodecTesting
@libar-docs-status:completed
@libar-docs-implements:ReferenceDocShowcase
@libar-docs-product-area:Generation
Feature: Composite Codec

  Assembles reference documents from multiple codec outputs by
  concatenating RenderableDocument sections. Enables building
  documents composed from any combination of existing codecs.

  Background: Composite codec test context
    Given a composite codec test context

  Rule: CompositeCodec concatenates sections in codec array order

    **Invariant:** Sections from child codecs appear in the composite
    output in the same order as the codecs array.

    **Verified by:** Sections from two codecs appear in order,
    Three codecs produce sections in array order

    @acceptance-criteria @happy-path
    Scenario: Sections from two codecs appear in order
      Given a codec producing a paragraph "Alpha content"
      And a codec producing a paragraph "Beta content"
      When CompositeCodec assembles them with title "Two Codec Test"
      Then the output title is "Two Codec Test"
      And paragraph "Alpha content" appears before "Beta content"

    @acceptance-criteria @happy-path
    Scenario: Three codecs produce sections in array order
      Given three codecs producing paragraphs "First", "Second", "Third"
      When CompositeCodec assembles them with title "Three Codec Test"
      Then paragraphs appear in order "First", "Second", "Third"

  Rule: Separators between codec outputs are configurable

    **Invariant:** By default, a separator block is inserted between
    each child codec's sections. When separateSections is false, no
    separators are added.

    **Verified by:** Default separator between sections,
    No separator when disabled

    @acceptance-criteria @happy-path
    Scenario: Default separator between sections
      Given a codec producing a paragraph "Part A"
      And a codec producing a paragraph "Part B"
      When CompositeCodec assembles them with title "Sep Test"
      Then a separator block appears between the two paragraph sections

    @acceptance-criteria @happy-path
    Scenario: No separator when disabled
      Given a codec producing a paragraph "Part A"
      And a codec producing a paragraph "Part B"
      When CompositeCodec assembles them with separateSections disabled
      Then no separator block exists in the output

  Rule: additionalFiles merge with last-wins semantics

    **Invariant:** additionalFiles from all children are merged into
    a single record. When keys collide, the later codec's value wins.

    **Verified by:** Non-overlapping files merged,
    Colliding keys use last-wins

    @acceptance-criteria @happy-path
    Scenario: Non-overlapping files merged
      Given a codec with additionalFile "a.md" titled "Doc A"
      And a codec with additionalFile "b.md" titled "Doc B"
      When CompositeCodec assembles them with title "Merge Test"
      Then additionalFiles contains keys "a.md" and "b.md"

    @acceptance-criteria @edge-case
    Scenario: Colliding keys use last-wins
      Given a codec with additionalFile "shared.md" titled "From A"
      And a codec with additionalFile "shared.md" titled "From B"
      When CompositeCodec assembles them with title "Collision Test"
      Then additionalFiles key "shared.md" has title "From B"

  Rule: composeDocuments works at document level without codecs

    **Invariant:** composeDocuments accepts RenderableDocument array and
    produces a composed RenderableDocument without requiring codecs.

    **Verified by:** Direct document composition

    @acceptance-criteria @happy-path
    Scenario: Direct document composition
      Given a RenderableDocument with paragraph "Doc One"
      And a RenderableDocument with paragraph "Doc Two"
      When composeDocuments assembles them with title "Composed"
      Then the result has title "Composed"
      And paragraph "Doc One" appears before "Doc Two"

  Rule: Empty codec outputs are handled gracefully

    **Invariant:** Codecs producing empty sections arrays contribute
    nothing to the output. No separator is emitted for empty outputs.

    **Verified by:** Empty codec skipped without separator

    @acceptance-criteria @edge-case
    Scenario: Empty codec skipped without separator
      Given a codec producing 0 sections
      And a codec producing a paragraph "Content"
      When CompositeCodec assembles them with title "Empty Test"
      Then the output contains exactly 1 section
      And no separator block exists in the output
