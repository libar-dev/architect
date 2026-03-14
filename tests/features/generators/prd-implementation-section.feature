@architect
@architect-pattern:PrdImplementationSectionTesting
@architect-status:completed
@architect-product-area:Generation
@architect-implements:PrdImplementationSection
Feature: PRD Implementation Section

  Tests the Implementations section rendering in pattern documents.
  Verifies that code stubs with @architect-implements tags appear in pattern docs
  with working links to the source files.

  Background: Pattern generator test context
    Given a pattern generator test context

  # ===========================================================================
  # Rule 1: Implementation files appear in pattern docs
  # ===========================================================================

  Rule: Implementation files appear in pattern docs via @architect-implements

    **Invariant:** Any TypeScript file with a matching @architect-implements tag must appear in the pattern document's Implementations section with a working file link.
    **Rationale:** Implementation discovery relies on tag-based linking — missing entries break traceability between specs and code.
    **Verified by:** Implementations section renders with file links, Implementation includes description when available

    Scenario: Implementations section renders with file links
      Given a pattern "EventStoreDurability" defined with:
        | Field | Value |
        | status | roadmap |
        | category | event-sourcing |
      And a TypeScript file "durability/outbox.ts" that implements "EventStoreDurability" with:
        | Field | Value |
        | name | OutboxPattern |
        | description | Action results captured via onComplete mutation |
      When generating the pattern document for "EventStoreDurability"
      Then the document contains heading "Implementations"
      And the document contains file link to "durability/outbox.ts"
      And the document contains implementation description "Action results captured"

    Scenario: Implementation includes description when available
      Given a pattern "TestPattern" defined with:
        | Field | Value |
        | status | active |
        | category | core |
      And a TypeScript file "impl/test-impl.ts" that implements "TestPattern" with:
        | Field | Value |
        | name | TestImpl |
        | description | This implementation provides core functionality |
      When generating the pattern document for "TestPattern"
      Then the document contains implementation description "This implementation provides core functionality"

  # ===========================================================================
  # Rule 2: Multiple implementations are listed alphabetically
  # ===========================================================================

  Rule: Multiple implementations are listed alphabetically

    **Invariant:** When multiple files implement the same pattern, they must be listed in ascending file path order.
    **Rationale:** Deterministic ordering ensures stable document output across regeneration runs.
    **Verified by:** Multiple implementations sorted by file path

    Scenario: Multiple implementations sorted by file path
      Given a pattern "MultiImplPattern" defined with:
        | Field | Value |
        | status | active |
        | category | core |
      And TypeScript files that implement "MultiImplPattern":
        | File | Name |
        | durability/outbox.ts | OutboxPattern |
        | durability/publication.ts | PublicationPattern |
        | durability/idempotentAppend.ts | IdempotentAppend |
      When generating the pattern document for "MultiImplPattern"
      Then implementations appear in file path order:
        | File |
        | durability/idempotentAppend.ts |
        | durability/outbox.ts |
        | durability/publication.ts |

  # ===========================================================================
  # Rule 3: Patterns without implementations omit the section
  # ===========================================================================

  Rule: Patterns without implementations omit the section

    **Invariant:** The Implementations heading must not appear in pattern documents when no implementing files exist.
    **Rationale:** Rendering an empty Implementations section misleads readers into thinking implementations were expected but are missing, rather than simply not applicable.
    **Verified by:** No implementations section when none exist

    Scenario: No implementations section when none exist
      Given a pattern "NoImplPattern" defined with:
        | Field | Value |
        | status | roadmap |
        | category | core |
      And no TypeScript files implement "NoImplPattern"
      When generating the pattern document for "NoImplPattern"
      Then the document does not contain heading "Implementations"

  # ===========================================================================
  # Rule 4: Implementation references use correct link format
  # ===========================================================================

  Rule: Implementation references use relative file links

    **Invariant:** Implementation file links must be relative paths starting from the patterns output directory.
    **Rationale:** Absolute paths break when documentation is viewed from different locations; relative paths ensure portability.
    **Verified by:** Links are relative from patterns directory

    Scenario: Links are relative from patterns directory
      Given a pattern "LinkTestPattern" defined with:
        | Field | Value |
        | status | active |
        | category | infra |
      And a TypeScript file "packages/@libar-dev/platform-core/src/durability/outbox.ts" that implements "LinkTestPattern" with:
        | Field | Value |
        | name | Outbox |
        | description | Outbox implementation |
      When generating the pattern document for "LinkTestPattern"
      Then the implementation link path starts with "../"
      And the implementation link path contains "outbox.ts"
