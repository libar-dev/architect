@architect
@architect-pattern:ContextFormatterTests
@architect-status:active
@architect-product-area:DataAPI
Feature: Context Formatter - Plain Text Rendering

  Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),
  and formatOverview() plain text rendering functions.

  Rule: formatContextBundle renders section markers

    **Invariant:** The context formatter must render section markers for all populated sections in a context bundle, with design bundles rendering all sections and implement bundles focusing on deliverables and FSM.
    **Rationale:** Section markers enable structured parsing of context output — without them, AI consumers cannot reliably extract specific sections from the formatted bundle.
    **Verified by:** Design bundle renders all populated sections, Implement bundle renders deliverables and FSM

    @acceptance-criteria @happy-path
    Scenario: Design bundle renders all populated sections
      Given a design context bundle with metadata, stubs, dependencies, and deliverables
      When I format the bundle
      Then the output contains all expected sections
        | section              |
        | === PATTERN:         |
        | === STUBS ===        |
        | === DEPENDENCIES === |
        | === DELIVERABLES === |

    @acceptance-criteria @happy-path
    Scenario: Implement bundle renders deliverables and FSM
      Given an implement context bundle with deliverables and FSM
      When I format the bundle
      Then the output contains all expected sections
        | section              |
        | === DELIVERABLES === |
        | === FSM ===          |
      And the output contains checkbox markers

  Rule: formatDepTree renders indented tree

    **Invariant:** The dependency tree formatter must render with indentation arrows and a focal pattern marker to visually distinguish the target pattern from its dependencies.
    **Rationale:** Visual hierarchy in the dependency tree makes dependency chains scannable at a glance — flat output would require mental parsing to understand depth and relationships.
    **Verified by:** Tree renders with arrows and focal marker

    @acceptance-criteria @happy-path
    Scenario: Tree renders with arrows and focal marker
      Given a dep-tree with root, middle, and focal leaf
      When I format the tree
      Then the output contains all expected sections
        | section          |
        | ->               |
        | <- YOU ARE HERE  |

  Rule: formatOverview renders progress summary

    **Invariant:** The overview formatter must render a progress summary line showing completion metrics for the project and point users to the current query script name.
    **Rationale:** The progress line is the first thing developers see when starting a session — it provides immediate project health awareness, and the follow-up command guidance must be copy-pasteable.
    **Verified by:** Overview renders progress line, Overview renders architect query guidance

    @acceptance-criteria @happy-path
    Scenario: Overview renders progress line
      Given an overview with 69 total patterns at 52 percent
      When I format the overview
      Then the output contains all expected sections
        | section        |
        | 69 patterns    |
        | 52%            |
        | === PROGRESS ===|

    @acceptance-criteria @happy-path
    Scenario: Overview renders architect query guidance
      Given an overview with 69 total patterns at 52 percent
      When I format the overview
      Then the output contains "pnpm architect:query -- <subcommand>"
      And the output contains "Full reference: pnpm architect:query -- --help"

  Rule: formatFileReadingList renders categorized file paths

    **Invariant:** The file reading list formatter must categorize paths into primary and dependency sections, producing minimal output when the list is empty.
    **Rationale:** Categorized file lists tell developers which files to read first (primary) versus reference (dependency) — uncategorized lists waste time on low-priority files.
    **Verified by:** File list renders primary and dependency sections, Empty file reading list renders minimal output

    @acceptance-criteria @happy-path
    Scenario: File list renders primary and dependency sections
      Given a file reading list with primary and dependency files
      When I format the file reading list
      Then the output contains "=== PRIMARY ==="
      And the output contains "=== COMPLETED DEPENDENCIES ==="

    @acceptance-criteria @edge-case
    Scenario: Empty file reading list renders minimal output
      Given an empty file reading list
      When I format the file reading list
      Then the output is a single newline
