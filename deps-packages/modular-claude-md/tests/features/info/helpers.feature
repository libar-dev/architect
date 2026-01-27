Feature: Info Command Helpers
  Helper functions for analyzing module structure, extracting headings,
  and validating module organization.

  # Module Line Counting
  Scenario: Count lines in existing module
    Given a module "core/intro.md" with sample content having 4 lines
    When counting lines for "core/intro.md"
    Then the line count should be 4

  Scenario: Count lines for missing module returns zero
    When counting lines for "missing/file.md"
    Then the line count should be 0

  # Heading Extraction
  Scenario: Extract headings from module with mixed levels
    Given a module "docs/guide.md" with mixed heading levels
    When extracting headings from "docs/guide.md"
    Then the extracted headings should match the mixed levels structure

  Scenario: Extract headings from module with no headings
    Given a module "empty/file.md" with plain text only
    When extracting headings from "empty/file.md"
    Then the headings should be empty

  Scenario: Extract headings from missing module
    When extracting headings from "missing/file.md"
    Then the headings should be empty

  Scenario: Ignore H1 headings in module
    Given a module "docs/title.md" with H1 and H3 headings
    When extracting headings from "docs/title.md"
    Then only the H3 heading should be extracted

  # Tag Collection
  Scenario: Collect all unique tags from metadata
    Given metadata with sections:
      | title    | tags         | module           | moduleTags       |
      | Core     | core         | core/intro.md    | core             |
      | Advanced | advanced     | advanced/tips.md | advanced, expert |
      | Testing  | testing      | testing/guide.md | testing, core    |
    When collecting all tags
    Then the tags should be "advanced, core, expert, testing"

  Scenario: Collect tags with no duplicates
    Given metadata with sections:
      | title  | tags | module        | moduleTags |
      | Core   | core | core/main.md  | core       |
      | Basics | core | core/intro.md | core       |
    When collecting all tags
    Then the tags should be "core"

  # Module Matching
  Scenario: Get modules matching tags
    Given metadata with sections:
      | title    | tags     | module           | moduleTags       |
      | Core     | core     | core/intro.md    | core             |
      | Advanced | advanced | advanced/tips.md | advanced, expert |
      | Testing  | testing  | testing/guide.md | testing          |
    When getting modules matching tags "core, testing"
    Then the matching modules should be:
      | path             |
      | core/intro.md    |
      | testing/guide.md |

  Scenario: Get modules with no matches
    Given metadata with sections:
      | title | tags | module        | moduleTags |
      | Core  | core | core/intro.md | core       |
    When getting modules matching tags "nonexistent"
    Then the matching modules should be empty

  # Structure Validation
  Scenario: Valid module structure starting with H3
    Given headings for validation:
      | level | text            | line |
      | 3     | Getting Started | 1    |
      | 4     | Prerequisites   | 3    |
      | 4     | Installation    | 5    |
    When validating structure for "docs/guide.md"
    Then there should be no structure issues

  Scenario: Detect module with no headings
    Given headings for validation:
      | level | text | line |
    When validating structure for "empty/file.md"
    Then there should be 1 structure issue
    And issue 1 should have severity "warning" and type "no-headings"

  Scenario: Detect module starting with H2 shallow
    Given headings for validation:
      | level | text    | line |
      | 2     | Section | 1    |
    When validating structure for "shallow/file.md"
    Then there should be 1 structure issue
    And issue 1 should have severity "error" and type "shallow-start"

  Scenario: Detect module starting with H4 deep
    Given headings for validation:
      | level | text       | line |
      | 4     | Subsection | 1    |
    When validating structure for "deep/file.md"
    Then there should be 1 structure issue
    And issue 1 should have severity "error" and type "deep-start"

  Scenario: Detect level skip in headings
    Given headings for validation:
      | level | text            | line |
      | 3     | Getting Started | 1    |
      | 5     | Deep Section    | 3    |
    When validating structure for "skip/file.md"
    Then there should be 1 structure issue
    And issue 1 should have severity "warning" and type "level-skip"

  Scenario: Detect multiple issues
    Given headings for validation:
      | level | text          | line |
      | 2     | Wrong Start   | 1    |
      | 4     | Skipped Level | 3    |
    When validating structure for "multi/file.md"
    Then there should be 2 structure issues
    And the issues should include error "shallow-start" and warning "level-skip"
