@libar-docs-implements:CodecBehaviorTesting
@behavior @requirements-adr-codecs
@libar-docs-pattern:RequirementsAdrCodecTesting
@libar-docs-product-area:Codec
Feature: Requirements and ADR Document Codecs
  The RequirementsDocumentCodec and AdrDocumentCodec transform MasterDataset
  into RenderableDocuments for PRD-style and architecture decision documentation.

  **Problem:**
  - Need to generate product requirements documents with flexible groupings
  - Need to document architecture decisions with status tracking and supersession

  **Solution:**
  - RequirementsDocumentCodec generates PRD-style docs grouped by product area, user role, or phase
  - AdrDocumentCodec generates ADR documentation with category, phase, or date groupings

  Background:
    Given a requirements and ADR codec test context

  # ═══════════════════════════════════════════════════════════════════════════
  # RequirementsDocumentCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: RequirementsDocumentCodec generates PRD-style documentation from patterns

    @happy-path @edge-case
    Scenario: No patterns with PRD metadata produces empty message
      Given an empty MasterDataset
      When decoding with RequirementsDocumentCodec
      Then the document title is "Product Requirements"
      And the document contains "No Product Requirements"

    @happy-path
    Scenario: Summary shows counts and groupings
      Given a MasterDataset with PRD patterns
      When decoding with RequirementsDocumentCodec
      Then the document title is "Product Requirements"
      And the document contains a "Summary" section
      And the summary table shows:
        | metric         | value |
        | Total Features | 4     |
        | Product Areas  | 2     |
        | User Roles     | 2     |

    @happy-path
    Scenario: By product area section groups patterns correctly
      Given a MasterDataset with PRD patterns
      When decoding with RequirementsDocumentCodec
      Then the document contains a "By Product Area" section
      And the product areas show their features

    Scenario: By user role section uses collapsible groups
      Given a MasterDataset with PRD patterns
      When decoding with RequirementsDocumentCodec
      Then the document contains a "By User Role" section
      And user role sections are collapsible

    Scenario: Group by phase option changes primary grouping
      Given a MasterDataset with PRD patterns
      When decoding with RequirementsDocumentCodec using groupBy phase
      Then the document contains a "By Phase" section
      And phase 1 shows its features

    Scenario: Filter by status option limits patterns
      Given a MasterDataset with PRD patterns
      When decoding with RequirementsDocumentCodec filtering to completed status
      Then the document shows only completed patterns

    Scenario: All features table shows complete list
      Given a MasterDataset with PRD patterns
      When decoding with RequirementsDocumentCodec
      Then the document contains an "All Features" section
      And the all features table has columns:
        | column       |
        | Feature      |
        | Product Area |
        | User Role    |
        | Status       |

    Scenario: Business value rendering when enabled
      Given a MasterDataset with PRD patterns with business value
      When decoding with RequirementsDocumentCodec
      Then the feature list shows business value descriptions

    Scenario: Generate individual requirement detail files when enabled
      Given a MasterDataset with PRD patterns
      When decoding with generateDetailFiles enabled for requirements
      Then the document has requirement detail files:
        | path                                           |
        | requirements/phase-01-user-authentication.md   |
        | requirements/phase-01-user-registration.md     |
        | requirements/phase-02-metrics-dashboard.md     |
        | requirements/phase-02-admin-dashboard.md       |

    Scenario: Requirement detail file contains acceptance criteria from scenarios
      Given a MasterDataset with PRD patterns with scenarios
      When decoding with generateDetailFiles enabled for requirements
      Then the requirement detail files contain acceptance criteria sections
      And the acceptance criteria shows scenario steps

    Scenario: Requirement detail file contains business rules section
      Given a MasterDataset with PRD patterns with rules
      When decoding with generateDetailFiles enabled for requirements
      Then the requirement detail files contain business rules sections

    Scenario: Implementation links from relationshipIndex
      Given a MasterDataset with PRD patterns with implementations
      When decoding with generateDetailFiles enabled for requirements
      Then the requirement detail files contain implementations sections

  # ═══════════════════════════════════════════════════════════════════════════
  # AdrDocumentCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: AdrDocumentCodec documents architecture decisions

    @happy-path @edge-case
    Scenario: No ADR patterns produces empty message
      Given a MasterDataset with no ADR patterns
      When decoding with AdrDocumentCodec
      Then the document title is "Architecture Decision Records"
      And the document contains "No Architecture Decisions"

    @happy-path
    Scenario: Summary shows status counts and categories
      Given a MasterDataset with ADR patterns
      When decoding with AdrDocumentCodec
      Then the document title is "Architecture Decision Records"
      And the document contains a "Summary" section
      And the ADR summary table shows:
        | metric     | value |
        | Total ADRs | 4     |
        | Accepted   | 2     |
        | Proposed   | 1     |
        | Superseded | 1     |
        | Categories | 2     |

    @happy-path
    Scenario: ADRs grouped by category
      Given a MasterDataset with ADR patterns
      When decoding with AdrDocumentCodec
      Then the document contains a "By Category" section
      And the ADR categories show their decisions

    Scenario: ADRs grouped by phase option
      Given a MasterDataset with ADR patterns
      When decoding with AdrDocumentCodec using groupBy phase
      Then the document contains a "By Phase" section
      And ADR phase sections are collapsible

    Scenario: ADRs grouped by date (quarter) option
      Given a MasterDataset with ADR patterns with quarters
      When decoding with AdrDocumentCodec using groupBy date
      Then the document contains a "By Date" section
      And ADR date sections show quarters

    Scenario: ADR index table with all decisions
      Given a MasterDataset with ADR patterns
      When decoding with AdrDocumentCodec
      Then the document contains an "ADR Index" section
      And the ADR index table has columns:
        | column   |
        | ADR      |
        | Title    |
        | Status   |
        | Category |

    Scenario: Status emoji mapping in ADR entries
      Given a MasterDataset with ADR patterns
      When decoding with AdrDocumentCodec
      Then ADR entries show correct status emojis:
        | status     | emoji |
        | accepted   | true  |
        | proposed   | true  |
        | superseded | true  |
        | deprecated | true  |

    Scenario: Context, Decision, Consequences sections from Rule keywords
      Given a MasterDataset with ADR patterns with semantic rules
      When decoding with AdrDocumentCodec
      Then ADR entries contain semantic sections

    Scenario: ADR supersedes rendering
      Given a MasterDataset with ADR patterns with supersession
      When decoding with AdrDocumentCodec
      Then ADR entries show supersedes relationships
      And ADR entries show supersededBy relationships

    Scenario: Generate individual ADR detail files when enabled
      Given a MasterDataset with ADR patterns
      When decoding with generateDetailFiles enabled for ADR
      Then the document has ADR detail files:
        | path                                        |
        | decisions/adr-001-event-sourcing.md         |
        | decisions/adr-002-cqrs-pattern.md           |
        | decisions/adr-003-workflow-automation.md    |
        | decisions/adr-004-use-temporal.md           |

    Scenario: ADR detail file contains full content
      Given a MasterDataset with ADR patterns with semantic rules
      When decoding with generateDetailFiles enabled for ADR
      Then the ADR detail files contain overview sections
      And the ADR detail files contain back links
