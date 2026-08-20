@architect
@architect-pattern:CompactTextRendererTests
@architect-status:active
@architect-implements:CompactTextRenderer
@architect-product-area:DataAPI
Feature: Compact Text Renderer - Plain Text Rendering

  Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),
  and formatOverview() plain text rendering functions.

  Rule: formatContextBundle renders section markers

    **Invariant:** The compact text renderer must render section markers for all populated sections in a context bundle, with design bundles rendering all sections and implement bundles focusing on deliverables and FSM.
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

  Rule: formatDependencyContext renders a bidirectional focal view

    **Invariant:** The dependency-context compact renderer must lead with a one-line focal summary, then render an upstream "DEPENDS ON" tree and a downstream "REQUIRED BY" tree, using `-> ` indentation arrows for transitive nodes so the chain depth stays scannable.
    **Rationale:** A bidirectional view answers both "what does the focal pattern depend on?" and "what depends on the focal pattern?" in one render — a one-directional tree forces two separate queries, and arrows make transitive depth legible at a glance.
    **Verified by:** Context renders the focal summary and bidirectional trees

    @acceptance-criteria @happy-path
    Scenario: Context renders the focal summary and bidirectional trees
      Given a dependency context with root, middle, and focal leaf
      When I format the dependency context
      Then the output contains all expected sections
        | section                       |
        | Leaf depends on 1             |
        | === DEPENDS ON (upstream) === |
        | === REQUIRED BY (downstream) === |
        | ->                            |

  Rule: formatOverview renders progress summary

    **Invariant:** The overview compact renderer must render a progress summary line showing completion metrics for the project and point users to the graph-handle read surface (`pnpm architect:q`).
    **Rationale:** The progress line is the first thing developers see when starting a session — it provides immediate project health awareness, and the follow-up command guidance must be copy-pasteable.
    **Verified by:** Overview renders progress line, Overview renders read-surface guidance

    @acceptance-criteria @happy-path
    Scenario: Overview renders progress line
      Given an overview with 69 total patterns at 52 percent
      When I format the overview
      Then the output contains all expected sections
        | section        |
        | 69 delivery patterns |
        | 52%            |
        | === PROGRESS ===|

    @acceptance-criteria @happy-path
    Scenario: Overview renders read-surface guidance
      Given an overview with 69 total patterns at 52 percent
      When I format the overview
      Then the output contains "pnpm architect:q '<js>'"
      And the output contains "Load the `architect-graph-handle` skill"

  Rule: formatFileReadingList renders categorized file paths

    **Invariant:** The file reading list compact renderer must categorize paths into primary and dependency sections, producing minimal output when the list is empty.
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
