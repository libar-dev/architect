@architect
@architect-pattern:TagRegistrySchemasValidation
@architect-status:active
@architect-product-area:Validation
@validation @tag-registry
Feature: Tag Registry Schema Validation
  The tag registry configuration module provides schema-validated taxonomy
  definitions for organizing patterns by role, metadata tags, and
  aggregation rules. It supports creating default registries from the
  canonical taxonomy source and merging custom overrides.

  Background:
    Given a tag registry test context

  Rule: createDefaultTagRegistry produces a valid registry from taxonomy source

    **Invariant:** createDefaultTagRegistry always returns a TagRegistry that passes TagRegistrySchema validation, with non-empty roles, metadataTags, and aggregationTags arrays.
    **Rationale:** The default registry is the foundation for all pattern extraction. An invalid or empty default registry would silently break extraction for every consumer.
    **Verified by:** Default registry passes schema validation, Default registry has non-empty roles, Default registry has non-empty metadata tags, Default registry has expected tag prefix

    @function:createDefaultTagRegistry @happy-path
    Scenario: Default registry passes schema validation
      When I create a default tag registry
      Then the registry should pass TagRegistrySchema validation

    @function:createDefaultTagRegistry
    Scenario: Default registry has non-empty roles
      When I create a default tag registry
      Then the registry should have at least 1 role

    @function:createDefaultTagRegistry
    Scenario: Default registry has non-empty metadata tags
      When I create a default tag registry
      Then the registry should have at least 1 metadata tag

    @function:createDefaultTagRegistry
    Scenario: Default registry has expected tag prefix
      When I create a default tag registry
      Then the registry tag prefix should be "@architect-"

  Rule: mergeTagRegistries deep-merges registries by tag

    **Invariant:** mergeTagRegistries merges roles, metadataTags, and aggregationTags by their tag field, with override entries replacing base entries of the same tag and new entries being appended. Scalar fields (version, tagPrefix, fileOptInTag, formatOptions) are fully replaced when provided.
    **Rationale:** Consumers need to customize the taxonomy without losing default definitions. Tag-based merging prevents accidental duplication while allowing targeted overrides.
    **Verified by:** Merge overrides a role by tag, Merge adds new roles from override, Merge replaces scalar fields when provided, Merge preserves base when override is empty

    @function:mergeTagRegistries @happy-path
    Scenario: Merge overrides a role by tag
      Given a base registry with a role "service" at priority 1
      When I merge with an override that sets role "service" to priority 10
      Then the merged registry should have role "service" at priority 10

    @function:mergeTagRegistries
    Scenario: Merge adds new roles from override
      Given a base registry with a role "service" at priority 1
      When I merge with an override that adds role "custom" at priority 5
      Then the merged registry should have 2 roles
      And the merged registry should contain role "custom"

    @function:mergeTagRegistries
    Scenario: Merge replaces scalar fields when provided
      Given a base registry with tag prefix "@architect-"
      When I merge with an override that sets tag prefix "@custom-"
      Then the merged registry tag prefix should be "@custom-"

    @function:mergeTagRegistries
    Scenario: Merge preserves base when override is empty
      Given a base registry with a role "service" at priority 1
      When I merge with an empty override
      Then the merged registry should have 1 role
      And the merged registry should have role "service" at priority 1

    @function:mergeTagRegistries
    Scenario: Merge preserves roles when override is empty
      Given a base registry with a role "service" at priority 1
      When I merge with an empty override
      Then the merged registry should have 1 role
      And the merged registry should include role "service"
