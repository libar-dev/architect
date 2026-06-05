@architect
@architect-pattern:EmissionDescriptorTesting
@architect-implements:EmissionDescriptor
@architect-status:active
@architect-product-area:Generation
@architect-role:contract
@documentation-composition
Feature: Emission descriptor contract — the BundleRouting split's sink-side trust boundary

  The emission descriptor is the OPTIONAL file-sink overlay split off `BundleRouting`
  (epic DocumentationProjection, "emission mode"). A View with no descriptor is the
  sink-agnostic baseline; a present descriptor selects one of two markdown-file
  placements. This feature pins the descriptor's parse-once trust boundary: the
  discriminated-union shape, repo-relative path containment, and per-host region
  identity. (The renderer, marker scan, and region-aware gate are NOT covered here —
  they are implementation built on this contract, not the contract itself.)

  Background:
    Given the emission descriptor contract state is initialized

  Rule: Emission mode is a discriminated union of the two markdown-file placements

    Scenario: a whole-artifact descriptor names the markdown file it writes
      Then a whole-artifact descriptor with a repo-relative ".md" root target parses
      And a whole-artifact descriptor with no markdown file route is rejected

    Scenario: an embedded-region descriptor requires a host file and at least one region
      Then an embedded-region descriptor with a host file and one region parses
      And an embedded-region descriptor with an empty region list is rejected

    Scenario: an unknown emission mode is rejected
      Then a descriptor whose mode is neither whole-artifact nor embedded-region is rejected
      And a whole-artifact strictObject variant rejects an unexpected extra property
      And an embedded-region strictObject variant rejects an unexpected extra property

    Scenario: the whole-artifact route validates its optional entity-layout enum
      Then a whole-artifact route with a nested-index entity layout parses
      And a whole-artifact route with an out-of-enum entity layout is rejected

  Rule: Descriptor paths stay repo-contained at the parse-once trust boundary

    Scenario: a whole-artifact root target rejects repo-escaping and non-markdown paths
      Then an absolute root target is rejected
      And a parent-traversal root target is rejected
      And a home-rooted root target is rejected
      And a Windows drive-rooted root target is rejected
      And a backslash-bearing root target is rejected
      And a non-".md" root target is rejected
      And an empty interior path segment is rejected
      And a single-dot path segment is rejected
      And a non-leading parent-traversal segment is rejected

    Scenario: an embedded host file is held to the same repo-relative markdown contract
      Then a parent-traversal host file is rejected
      And an accepted out-of-docs-live host file ".agents/skills/architect-base/references/taxonomy.md" parses

    Scenario: a child directory shares containment but carries no markdown-suffix rule
      Then a bare repo-relative child directory parses
      And a parent-traversal child directory is rejected

  Rule: Region identity is (hostFile, regionId) and is unique within a host

    Scenario: a duplicate region id within one host is rejected
      Then two regions sharing a region id in the same host are rejected
      And the rejection names the duplicate region id

    Scenario: the same region id slug in two different hosts is not a collision
      Then the same region id slug parses independently in two separate host descriptors

    Scenario: a region source or id that is not a lowercase-kebab slug is rejected
      Then a region source containing a space is rejected
      And a region id containing an underscore is rejected
