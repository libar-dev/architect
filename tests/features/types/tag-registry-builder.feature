@architect
@architect-pattern:TypeScriptTaxonomyImplementation
@architect-status:completed
@architect-unlock-reason:Value-transfer-from-spec
@architect-phase:99
@architect-product-area:CoreTypes
@architect-include:core-types
@taxonomy @registry
Feature: Tag Registry Builder
  As an Architect developer
  I want taxonomy defined in TypeScript with Zod integration
  So that I get compile-time safety and runtime validation

  The tag registry builder constructs a complete TagRegistry from TypeScript
  constants. It is the single source of truth for the Architect
  annotation taxonomy, providing tag definitions, categories, and format
  options used by scanners and extractors.

  Background:
    Given a tag registry test context

  Rule: buildRegistry returns a well-formed TagRegistry

    **Invariant:** buildRegistry always returns a TagRegistry with version, categories, metadataTags, aggregationTags, formatOptions, tagPrefix, and fileOptInTag properties.
    **Rationale:** All downstream consumers (scanner, extractor, validator) depend on registry structure. A malformed registry would cause silent extraction failures across the entire pipeline.
    **Verified by:** Registry has correct version, Registry has expected category count, Registry has required metadata tags

    @function:buildRegistry @happy-path
    Scenario: Registry has correct version
      When I build the tag registry
      Then the registry version is "2.0.0"

    @function:buildRegistry @happy-path
    Scenario: Registry has expected category count
      When I build the tag registry
      Then the registry has 21 categories

    @function:buildRegistry @happy-path
    Scenario: Registry has required metadata tags
      When I build the tag registry
      Then the registry contains these metadata tags:
        | tag     | format |
        | pattern | value  |
        | status  | enum   |
        | phase   | number |

  Rule: Metadata tags have correct configuration

    **Invariant:** The pattern tag is required, the status tag has a default value, and tags with transforms apply them correctly.
    **Rationale:** Misconfigured tag metadata would cause the extractor to skip required fields or apply wrong defaults, producing silently corrupt patterns.
    **Verified by:** Pattern tag is marked as required, Status tag has default value, Transform functions work correctly

    @function:buildRegistry
    Scenario: Pattern tag is marked as required
      When I build the tag registry
      Then the metadata tag "pattern" has required set to true

    @function:buildRegistry
    Scenario: Status tag has default value
      When I build the tag registry
      Then the metadata tag "status" has a default value

    @function:buildRegistry
    Scenario: Transform functions work correctly
      When I build the tag registry
      Then the metadata tag "business-value" has a transform function
      And applying the "business-value" transform to "eliminates-event-replay" produces "eliminates event replay"

  Rule: Registry includes standard prefixes and opt-in tag

    **Invariant:** tagPrefix is the standard annotation prefix and fileOptInTag is the bare opt-in marker. These are non-empty strings.
    **Rationale:** Changing these values without updating all annotated files would break scanner opt-in detection across the entire monorepo.
    **Verified by:** Registry has standard tag prefix and opt-in tag

    @function:buildRegistry
    Scenario: Registry has standard tag prefix and opt-in tag
      When I build the tag registry
      Then the tag prefix is not empty
      And the file opt-in tag is not empty
