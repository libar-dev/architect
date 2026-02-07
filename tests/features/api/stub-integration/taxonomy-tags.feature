@libar-docs
@libar-docs-pattern:StubTaxonomyTagTests
@libar-docs-status:active
Feature: Stub Integration Taxonomy Tags

  **Problem:**
  Stub metadata (target path, design session) was stored as plain text
  in JSDoc descriptions, invisible to structured queries.

  **Solution:**
  Register libar-docs-target and libar-docs-since as taxonomy tags
  so they flow through the extraction pipeline as structured fields.

  Rule: Taxonomy tags are registered in the registry

    @acceptance-criteria @happy-path
    Scenario: Target and since tags exist in registry
      Given the default tag registry
      When looking up the "target" metadata tag
      Then the tag exists with format "value"
      And the "since" tag also exists with format "value"

  Rule: Tags are part of the stub metadata group

    @acceptance-criteria @happy-path
    Scenario: Stub group contains target and since
      Given the metadata tags by group
      When checking the "stub" group
      Then it contains "target" and "since"
