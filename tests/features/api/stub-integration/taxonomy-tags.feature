@architect
@architect-pattern:StubTaxonomyTagTests
@architect-implements:DataAPIStubIntegration
@architect-status:active
@architect-product-area:DataAPI
Feature: Stub Integration Taxonomy Tags

  **Problem:**
  Stub metadata (target path, design session) was stored as plain text
  in JSDoc descriptions, invisible to structured queries.

  **Solution:**
  Register architect-target and architect-since as taxonomy tags
  so they flow through the extraction pipeline as structured fields.

  Rule: Taxonomy tags are registered in the registry

    **Invariant:** The target and since stub metadata tags must be registered in the tag registry as recognized taxonomy entries.
    **Rationale:** Unregistered tags would be flagged as unknown by the linter — registration ensures stub metadata tags pass validation alongside standard annotation tags.
    **Verified by:** Target and since tags exist in registry

    @acceptance-criteria @happy-path
    Scenario: Target and since tags exist in registry
      Given the default tag registry
      When looking up the "target" metadata tag
      Then the tag exists with format "value"
      And the "since" tag also exists with format "value"

  Rule: Tags are part of the stub metadata group

    **Invariant:** The target and since tags must be grouped under the stub metadata domain in the built registry.
    **Rationale:** Domain grouping enables the taxonomy codec to render stub metadata tags in their own section — ungrouped tags would be lost in the "Other" category.
    **Verified by:** Built registry groups target and since as stub tags

    @acceptance-criteria @happy-path
    Scenario: Built registry groups target and since as stub tags
      Given the default tag registry
      When I look up tags in the "stub" metadata group
      Then the group contains "target"
      And the group contains "since"
