@libar-docs
@libar-docs-pattern:TestContentBlocks
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:test-what-generators-capture
Feature: Test Content Blocks

  This feature demonstrates what content blocks are captured and rendered
  by the PRD generator. Use this as a reference for writing rich specs.

  **Overview**

  The delivery process supports **rich Markdown** in descriptions:
  - Bullet points work
  - *Italics* and **bold** work
  - `inline code` works

  **Custom Section**

  You can create any section you want using bold headers.
  This content will appear in the PRD Description section.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Demo item 1 | pending | No | demo/location1.ts |
      | Demo item 2 | complete | Yes | demo/location2.ts |

  Rule: Business rules appear as a separate section

    Rule descriptions provide context for why this business rule exists.
    You can include multiple paragraphs here.

    This is a second paragraph explaining edge cases or exceptions.

    @acceptance-criteria
    Scenario: Scenario with DocString for rich content
      This scenario demonstrates DocStrings for embedding rich content.

      Given a system in initial state
      When the user provides the following configuration:
        """markdown
        **Configuration Details**

        This DocString contains **rich Markdown content** that will be
        rendered in the Acceptance Criteria section.

        - Option A: enabled
        - Option B: disabled

        Use DocStrings when you need multi-line content blocks.
        """
      Then the system accepts the configuration

    @acceptance-criteria
    Scenario: Scenario with DataTable for structured data
      Given the following user permissions:
        | Permission | Level | Description |
        | read | basic | Can view resources |
        | write | elevated | Can modify resources |
        | admin | full | Can manage all settings |
      When the user attempts an action
      Then access is granted based on permissions

  Rule: Multiple rules create multiple Business Rule entries

    Each Rule keyword creates a separate entry in the Business Rules section.
    This helps organize complex features into logical business domains.

    @acceptance-criteria
    Scenario: Simple scenario under second rule
      Given a precondition
      When an action occurs
      Then the expected outcome happens

    @acceptance-criteria
    Scenario: Scenario with examples table
      Given a value of <input>
      When processed
      Then the result is <output>

      Examples:
        | input | output |
        | 1 | 2 |
        | 5 | 10 |
        | 10 | 20 |
