Feature: Tag Matcher
  The matcher module filters content based on tag matching.
  A subsection matches if it shares ANY tag with the target (OR logic).

  # Basic tag matching
  Scenario: Subsection matches when it shares one tag
    Given a subsection with tags "core, testing"
    When checking against target tags "core, advanced"
    Then the subsection should match

  Scenario: Subsection matches when it shares all tags
    Given a subsection with tags "core, testing"
    When checking against target tags "core, testing"
    Then the subsection should match

  Scenario: Subsection does not match when no tags shared
    Given a subsection with tags "advanced, experimental"
    When checking against target tags "core, testing"
    Then the subsection should not match

  Scenario: Empty subsection tags never match
    Given a subsection with tags ""
    When checking against target tags "core"
    Then the subsection should not match

  Scenario: Empty target tags never match
    Given a subsection with tags "core"
    When checking against target tags ""
    Then the subsection should not match

  # Section matching
  Scenario: Section has matching content when at least one subsection matches
    Given a section with subsections having tags:
      | tags               |
      | advanced, feature  |
      | core, mandatory    |
    When checking if section has content for tags "core"
    Then section should have matching content

  Scenario: Section has no matching content when no subsection matches
    Given a section with subsections having tags:
      | tags               |
      | advanced, feature  |
      | experimental       |
    When checking if section has content for tags "core"
    Then section should not have matching content

  # Get matching subsections
  Scenario: Get only matching subsections
    Given a section with subsections having tags:
      | tags               |
      | core               |
      | advanced           |
      | core, testing      |
    When getting matching subsections for tags "core"
    Then there should be 2 matching subsections

  # Count modules
  Scenario: Count matching modules across sections
    Given sections with subsections:
      | section   | tags               |
      | Core      | core               |
      | Core      | core, testing      |
      | Advanced  | advanced           |
      | Testing   | testing            |
    When counting modules for tags "core, testing"
    Then the count should be 3
