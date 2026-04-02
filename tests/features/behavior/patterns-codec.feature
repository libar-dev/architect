@architect
@architect-pattern:PatternsCodecTesting
@architect-implements:PatternsCodec
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Generation
@behavior @patterns-codec
Feature: Patterns Document Codec
  The PatternsDocumentCodec transforms PatternGraph into a RenderableDocument
  for generating PATTERNS.md and category detail files.

  **Problem:**
  - Need to generate a comprehensive pattern registry from extracted patterns
  - Output should include progress tracking, navigation, and categorization

  **Solution:**
  - Codec transforms PatternGraph → RenderableDocument in a single decode call
  - Generates main document with optional category detail files

  Background:
    Given a patterns codec test context

  Rule: Document structure includes progress tracking and category navigation

    **Invariant:** Every decoded document must contain a title, purpose, Progress section with status counts, and category navigation regardless of dataset size.
    **Rationale:** The PATTERNS.md is the primary entry point for understanding project scope; incomplete structure would leave consumers without context.
    **Verified by:** Decode empty dataset, Decode dataset with patterns - document structure, Progress summary shows correct counts

    @happy-path @edge-case
    Scenario: Decode empty dataset
      Given an empty PatternGraph
      When decoding with PatternsDocumentCodec
      Then the document title is "Pattern Registry"
      And the document has a purpose
      And the progress section shows 0 patterns

    @happy-path
    Scenario: Decode dataset with patterns - document structure
      Given a PatternGraph with 5 patterns across 2 categories
      When decoding with PatternsDocumentCodec
      Then the document title is "Pattern Registry"
      And the document contains sections:
        | heading     |
        | Progress    |
        | Categories  |
        | All Patterns|

    @happy-path
    Scenario: Progress summary shows correct counts
      Given a PatternGraph with status distribution:
        | status    | count |
        | completed | 3     |
        | active    | 2     |
        | planned   | 5     |
      When decoding with PatternsDocumentCodec
      Then the progress section shows:
        | status    | count |
        | Completed | 3     |
        | Active    | 2     |
        | Planned   | 5     |
        | Total     | 10    |
      And the progress shows "30% complete"

  Rule: Pattern table presents all patterns sorted by status then name

    **Invariant:** The pattern table must include every pattern in the dataset with columns for Pattern, Category, Status, and Description, sorted by status priority (completed first) then alphabetically by name.
    **Rationale:** Consistent ordering allows quick scanning of project progress; completed patterns at top confirm done work, while roadmap items at bottom show remaining scope.
    **Verified by:** Pattern table includes all patterns, Pattern table is sorted by status then name

    @happy-path
    Scenario: Pattern table includes all patterns
      Given a PatternGraph with 4 patterns
      When decoding with PatternsDocumentCodec
      Then the pattern table has 4 rows
      And the pattern table has columns:
        | column      |
        | Pattern     |
        | Category    |
        | Status      |
        | Description |

    Scenario: Pattern table is sorted by status then name
      Given a PatternGraph with patterns:
        | name      | status    |
        | Zebra     | completed |
        | Alpha     | roadmap   |
        | Beta      | active    |
        | Gamma     | completed |
      When decoding with PatternsDocumentCodec
      Then the pattern table rows are in order:
        | name      |
        | Gamma     |
        | Zebra     |
        | Beta      |
        | Alpha     |

  Rule: Category sections group patterns by domain

    **Invariant:** Each category in the dataset must produce an H3 section listing its patterns, and the filterCategories option must restrict output to only the specified categories.
    **Rationale:** Without category grouping, consumers must scan the entire flat pattern list to find domain-relevant patterns; filtering avoids noise in focused documentation.
    **Verified by:** Category sections with pattern lists, Filter to specific categories

    @happy-path
    Scenario: Category sections with pattern lists
      Given a PatternGraph with patterns in categories:
        | category | count |
        | core     | 3     |
        | ddd      | 2     |
      When decoding with PatternsDocumentCodec
      Then the document has category sections:
        | category | patternCount |
        | core     | 3            |
        | ddd      | 2            |

    Scenario: Filter to specific categories
      Given a PatternGraph with patterns in categories:
        | category | count |
        | core     | 3     |
        | ddd      | 2     |
        | saga     | 1     |
      When decoding with filterCategories "core" and "ddd"
      Then the document has 5 patterns in the table
      And the category sections include only:
        | category |
        | core     |
        | ddd      |

  Rule: Dependency graph visualizes pattern relationships

    **Invariant:** A Mermaid dependency graph must be included when pattern relationships exist and the includeDependencyGraph option is not disabled; it must be omitted when no relationships exist or when explicitly disabled.
    **Rationale:** Dependency relationships are invisible in flat pattern lists; the graph reveals implementation ordering and coupling that affects planning decisions.
    **Verified by:** Dependency graph included when relationships exist, No dependency graph when no relationships, Dependency graph disabled by option

    Scenario: Dependency graph included when relationships exist
      Given a PatternGraph with pattern relationships
      When decoding with default options
      Then the document contains a mermaid dependency graph

    Scenario: No dependency graph when no relationships
      Given a PatternGraph without relationships
      When decoding with default options
      Then the document does not contain a mermaid block

    Scenario: Dependency graph disabled by option
      Given a PatternGraph with pattern relationships
      When decoding with includeDependencyGraph disabled
      Then the document does not contain a mermaid block

  Rule: Detail file generation creates per-pattern pages

    **Invariant:** When generateDetailFiles is enabled, each pattern must produce an individual markdown file at patterns/{slug}.md containing an Overview section; when disabled, no additional files must be generated.
    **Rationale:** Detail files enable deep-linking into specific patterns from the main registry while keeping the index document scannable.
    **Verified by:** Generate individual pattern files when enabled, No detail files when disabled, Individual pattern file contains full details

    @happy-path
    Scenario: Generate individual pattern files when enabled
      Given a PatternGraph with named patterns:
        | name            | category |
        | Core Pattern    | core     |
        | Another Core    | core     |
        | DDD Pattern     | ddd      |
      When decoding with generateDetailFiles enabled
      Then the document has individual pattern files:
        | path                     |
        | patterns/core-pattern.md |
        | patterns/another-core.md |
        | patterns/ddd-pattern.md  |
      And category links are anchor links
      And pattern links point to individual files

    Scenario: No detail files when disabled
      Given a PatternGraph with patterns in 2 categories
      When decoding with generateDetailFiles disabled
      Then the document has no additional files
      And category links are anchor links

    Scenario: Individual pattern file contains full details
      Given a PatternGraph with a pattern named "Test Pattern" in category "core"
      When decoding with generateDetailFiles enabled
      Then the "patterns/test-pattern.md" additional file exists
      And the pattern file has title containing "Test Pattern"
      And the pattern file contains an Overview section
