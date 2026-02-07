@libar-docs
@libar-docs-pattern:ContextFormatterTests
@libar-docs-status:active
Feature: Context Formatter - Plain Text Rendering

  Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),
  and formatOverview() plain text rendering functions.

  Rule: formatContextBundle renders section markers

    @acceptance-criteria @happy-path
    Scenario: Design bundle renders all populated sections
      Given a design context bundle with metadata, stubs, and dependencies
      When I format the bundle
      Then the output contains all expected sections
        | section              |
        | === PATTERN:         |
        | === STUBS ===        |
        | === DEPENDENCIES === |

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

    @acceptance-criteria @happy-path
    Scenario: Tree renders with arrows and focal marker
      Given a dep-tree with root, middle, and focal leaf
      When I format the tree
      Then the output contains all expected sections
        | section          |
        | ->               |
        | <- YOU ARE HERE  |

  Rule: formatOverview renders progress summary

    @acceptance-criteria @happy-path
    Scenario: Overview renders progress line
      Given an overview with 69 total patterns at 52 percent
      When I format the overview
      Then the output contains all expected sections
        | section        |
        | 69 patterns    |
        | 52%            |
        | === PROGRESS ===|

  Rule: formatFileReadingList renders categorized file paths

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
