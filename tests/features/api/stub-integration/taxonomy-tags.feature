@architect
@architect-pattern:StubTaxonomyTagTests
@architect-status:active
@architect-implements:RegistryBuilder
@architect-product-area:DataAPI
Feature: Stub Integration Taxonomy Tags

  **Problem:**
  Stub metadata (target path, design session) was stored as plain text
  in JSDoc descriptions, invisible to structured queries.

  **Solution:**
  Register architect-target as a taxonomy tag so stub metadata flows
  through the extraction pipeline as a structured field. Wave 1 retired
  the `since` tag — git history is the canonical source of creation
  timing — so it is no longer registered.

  Rule: Taxonomy tags are registered in the registry

    **Invariant:** The target stub metadata tag must be registered in the tag registry as a recognized taxonomy entry.
    **Rationale:** Unregistered tags would be flagged as unknown by the linter — registration ensures stub metadata tags pass validation alongside standard annotation tags.
    **Verified by:** Target tag exists in registry

    @acceptance-criteria @happy-path
    Scenario: Target tag exists in registry
      Given the default tag registry
      When looking up the "target" metadata tag
      Then the tag exists with format "value"

  Rule: Tags are part of the stub metadata group

    **Invariant:** The target tag must be grouped under the stub metadata domain in the built registry.
    **Rationale:** Domain grouping enables the taxonomy codec to render stub metadata tags in their own section — ungrouped tags would be lost in the "Other" category.
    **Verified by:** Built registry groups target as a stub tag

    @acceptance-criteria @happy-path
    Scenario: Built registry groups target as a stub tag
      Given the default tag registry
      When I look up tags in the "stub" metadata group
      Then the group contains "target"
