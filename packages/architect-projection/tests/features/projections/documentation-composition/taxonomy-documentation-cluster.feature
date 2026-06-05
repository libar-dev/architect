@architect
@architect-pattern:TaxonomyDocumentationClusterTesting
@architect-implements:TaxonomyDocumentationCluster
@architect-status:active
@architect-product-area:Generation
@architect-role:projection
@documentation-composition
Feature: TaxonomyDocumentationCluster — embedded-region generation into authored hosts

  The cluster's net-new emission proof: the single TaxonomyDigest View is routed into
  marker-bounded regions of hand-authored host `.md` files. This feature pins the
  managed-region engine (rewrite only the inter-marker span, byte-deterministic
  normalization, loud failure on malformed markers) and the per-source region bodies
  (role enum, registry counts, per-group enumeration table) the skill and formal-spec
  shapes draw from. The descriptor's parse-once contract (path containment, region-id
  uniqueness) is pinned separately in `emission-descriptor.feature`.

  Background:
    Given a digest with a Roles group and an ADR Tags group

  Rule: Embedded-region shapes generate only inside their managed-region markers; the authored voice is host-owned

    Scenario: regeneration rewrites only the marked region and preserves the authored voice
      Given a host with authored prose around a "taxonomy-role-enum" region
      When the region is rewritten with new generated content
      Then the content between the markers is the new generated content
      And the authored prose outside the markers is preserved byte-for-byte

    Scenario: a host with multiple regions rewrites each from its own selection and preserves the prose between them
      Given a host with a "taxonomy-role-enum" region and a "taxonomy-tag-count" region with authored prose between them
      When both regions are rewritten from their own selections
      Then each region holds its own selection's content
      And the authored prose between the two regions is preserved byte-for-byte

    Scenario: the same region id in two different host files is not a collision
      Given two separate hosts that each declare a "taxonomy-role-enum" region
      When each host's region is rewritten independently
      Then each host carries its own rewritten region without disturbing the other

    Scenario: a missing, duplicated, or nested region marker fails loudly rather than writing
      Then rewriting a region whose markers are absent throws and names the host and region
      And rewriting a region whose begin marker is duplicated throws
      And rewriting a region whose markers are unbalanced throws
      And rewriting a region whose markers are nested inside another region throws

  Rule: Region rewrites are byte-deterministic (the normalization contract)

    Scenario: a no-op regeneration of an unchanged region is byte-stable across host EOL conventions
      Given a host saved with CRLF endings outside the markers and an LF region body
      When the same region body is applied twice
      Then both applications produce byte-identical host output
      And the CRLF bytes outside the markers are left untouched

    Scenario: the in-region span is normalized to one blank line around LF content
      When a region body with stray blank lines and CRLF endings is applied
      Then the inter-marker span has exactly one blank line after the begin marker and before the end marker
      And the region body lines use LF endings

  Rule: The taxonomy documents are one generation family from the tag registry

    Scenario: the skill role-enum and tag-count regions are emitted from the digest, not hand-restated
      Then the "role-enum" region body lists the digest's role values
      And the "tag-count" region body states the digest's live role, metadata, and aggregation counts

    Scenario: a digest tag-group renders as a canonical enumeration table
      Then the region body for a digest group source is a markdown table of that group's tags
      And an unknown region source is rejected rather than emitting an empty region
