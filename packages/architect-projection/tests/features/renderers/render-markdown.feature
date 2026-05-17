@projection
Feature: renderMarkdown renders canonical markdown blocks
  The markdown renderer should preserve the current codec semantics for the canonical block vocabulary.

  Background:
    Given the renderMarkdown block test state is initialized

  Rule: Canonical blocks render with stable markdown semantics

    @happy-path
    Scenario: All nine block types render in canonical markdown
      Given a SectionedDocumentFixture fixture containing all canonical block types
      When I render the fragment as markdown
      Then the markdown output should match the canonical block rendering

    @security
    Scenario: Plain-text markdown blocks escape hostile text and block unsafe URLs
      Given a SectionedDocumentFixture fixture containing hostile markdown text and unsafe links
      When I render the fragment as markdown
      Then the markdown output should escape hostile plain text
      And the markdown output should neutralize block-level markdown markers
      And the markdown output should escape hostile collapsible summaries
      And the markdown output should block unsafe link targets

    @security
    Scenario: Release notes trusted markdown escapes interpolated fragment values
      Given a ReleaseNotesDigest fixture containing hostile release metadata
      When I render the fragment as markdown
      Then the release notes markdown should escape trusted interpolation values

    @security
    Scenario: Requirement digests escape interpolated trusted markdown values
      Given a RequirementDigest fixture containing hostile requirement values
      When I render the hostile requirement bundle as markdown without H2 splitting
      Then the requirement markdown should escape trusted interpolation values

  Rule: Routed markdown output can auto-split oversized files at H2 boundaries

    @split
    Scenario: Oversized routed output splits into child files with backlinks
      Given a routed SectionedDocumentFixture bundle fixture that exceeds the markdown size budget
      When I render the bundle as markdown with an H2 size budget
      Then the markdown output should be a routed file record
      And the oversized child file should split at H2 boundaries
      And each split-path routed fragment should render at most twice

  Rule: Routed documentation roots follow progressive disclosure policy

    @disclosure
    Scenario: Documentation root pages render summary links instead of detail bodies
      Given a routed business-rules SectionedDocumentFixture bundle with detailed children
      When I render the bundle as markdown without H2 splitting
      Then the documentation root should contain child links without full detail bodies
      And the documentation detail child should retain its detail body

    @business-rules
    Scenario Outline: BusinessRule table column count per richness
      Given a BusinessRuleSet bundle of 3 rules
      When I render the bundle to markdown at disclosure "<level>"
      Then the rendered markdown should use the expected <columns> rule table columns

      Examples:
        | level     | columns |
        | essential | 2       |
        | important | 3       |
        | useful    | 5       |
        | advanced  | 9       |

    @routing
    Scenario: Duplicate routed child paths are disambiguated by stable child ids
      Given a routed SectionedDocumentFixture bundle whose children request duplicate paths
      When I render the bundle as markdown without H2 splitting
      Then the duplicate child paths should be deterministically disambiguated
      And root child links should target the disambiguated paths

    @routing
    Scenario: Duplicate child route ids do not resolve to an arbitrary child link
      Given a routed SectionedDocumentFixture bundle whose children request duplicate paths
      When I render the bundle as markdown without H2 splitting
      Then ambiguous route-id references should stay plain text

    @routing
    Scenario: Child keys that collide with route-id aliases stay plain text
      Given a routed SectionedDocumentFixture bundle with a child-key and route-id collision
      When I render the bundle as markdown without H2 splitting
      Then route-id collisions with child keys should stay plain text

    @requirements
    Scenario: Requirements executable root renders summary links instead of requirement bodies
      Given a routed requirements-executable SectionedDocumentFixture bundle with detailed children
      When I render the bundle as markdown without H2 splitting
      Then the requirements-executable root should link to requirement detail children without full requirement bodies
      And the requirements-executable detail child should retain its requirement body

    @requirements
    Scenario: Requirements specs root renders summary links instead of requirement bodies
      Given a routed requirements-specs SectionedDocumentFixture bundle with detailed children
      When I render the bundle as markdown without H2 splitting
      Then the requirements-specs root should link to requirement detail children without full requirement bodies
      And the requirements-specs detail child should retain its requirement body

    @business-rules
    Scenario: business-rules root is navigation-only at default disclosure
      Given a routed BusinessRuleSet bundle grouped by package
      When I render the bundle as important business-rules markdown disclosure
      Then the business-rules root should contain a Packages counts table
      And the business-rules root should contain a Package Detail links section
      And the business-rules root should not contain a Rules table
      And the business-rules detail child should retain its Rules table

    @business-rules
    Scenario: business-rules grouping labels stay plain text when route targets are rejected
      Given a routed BusinessRuleSet bundle with a hostile grouping label
      When I render the bundle with an unsafe business-rules route profile
      Then the business-rules root should render the hostile grouping label as plain text
      And the routed output should not contain the rejected child path

    @business-rules
    Scenario: business-rules routed output rejects traversal and absolute child paths
      Given a routed BusinessRuleSet bundle with a hostile grouping label
      When I render the bundle with traversal business-rules route targets
      Then the business-rules root should render traversal labels as plain text
      And the routed output should not contain traversal or absolute child paths

    @disclosure
    Scenario: requirements-executable routed output rejects traversal child paths
      Given a routed requirements-executable SectionedDocumentFixture bundle with detailed children
      When I render the requirements-executable bundle with traversal route targets
      Then the requirements-executable root should keep requirement references as plain text
      And the requirements-executable routed output should not contain the rejected child path

    @disclosure
    Scenario: requirements-executable routed output rejects encoded traversal child paths
      Given a routed requirements-executable SectionedDocumentFixture bundle with detailed children
      When I render the requirements-executable bundle with encoded traversal route targets
      Then the requirements-executable root should keep encoded-traversal references as plain text
      And the requirements-executable routed output should not contain the encoded rejected child path

    @disclosure
    Scenario: requirements-executable routed output rejects encoded control-byte child paths
      Given a routed requirements-executable SectionedDocumentFixture bundle with detailed children
      When I render the requirements-executable bundle with encoded control-byte route targets
      Then the requirements-executable root should keep encoded-control references as plain text
      And the requirements-executable routed output should not contain the encoded control-byte child path

    @disclosure
    Scenario: requirements-executable routed output rejects non-markdown and padded child paths
      Given a routed requirements-executable SectionedDocumentFixture bundle with detailed children
      When I render the requirements-executable bundle with non-markdown and padded route targets
      Then the requirements-executable root should keep rejected child references as plain text
      And the requirements-executable routed output should not contain non-markdown or padded child paths

    @disclosure
    Scenario: requirements-executable routed output normalizes padded valid root paths
      Given a routed requirements-executable SectionedDocumentFixture bundle with detailed children
      When I render the requirements-executable bundle with a padded valid root route target
      Then the requirements-executable routed output should normalize the root markdown path

    @business-rules
    Scenario: business-rules root keeps projected grouping summary without emitted children
      Given a routed BusinessRuleSet bundle grouped by package
      When I render the bundle as important business-rules markdown disclosure without child pages
      Then the business-rules root should contain a Packages counts table
      And the business-rules root should not contain a Package Detail links section
      And the business-rules root should not contain a Rules table
