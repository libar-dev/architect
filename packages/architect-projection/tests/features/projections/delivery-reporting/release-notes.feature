@architect
@architect-pattern:ReleaseNotesProjectionExecutableTests
@architect-implements:ReleaseNotesProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting release notes projection

  **Business Value:** Consumers receive a `ReleaseNotesDigest` bundle whose
  root lists every release in changelog order (Unreleased, tagged releases,
  quarter fallbacks, then Earlier) and whose children split one
  digest-per-release so downstream renderers can emit `CHANGELOG.md` plus one
  file per release.

  **How It Works:** The projection assembles release entries from
  `ProjectionContext` — active/`vNEXT` patterns feed the Unreleased bucket,
  completed patterns with release tags group into tagged releases, remaining
  completions fall back to their quarter, and anything else lands in Earlier.
  Each entry carries the latest completion date, pattern summaries, and
  deduplicated deliverables; optional release filtering trims the bundle to
  one entry.

  Background:
    Given the Delivery Reporting release notes projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/delivery-reporting/release-notes.feature |

  Rule: Release notes keep changelog grouping semantics without renderer formatting

    **Invariant:** The root `ReleaseNotesDigest` lists releases in the
    canonical order (Unreleased first, tagged releases descending, quarter
    fallbacks descending, then Earlier); each child key is a deterministic
    slug of its release label; a release filter returns only the matching
    entry.

    **Rationale:** Changelog grouping is a projection-level concern. Deferring
    it to renderers would duplicate logic across markdown, JSON, and UI
    outputs and break reproducible child routing.

    **Verified by:** release notes group unreleased, tagged, and fallback entries, release filters keep only the requested release entry

    @acceptance-criteria
    Scenario: release notes group unreleased, tagged, and fallback entries
      Given a release notes projection context with unreleased, versioned, and fallback completions
      When I project release notes without a filter
      Then the release notes root should group entries in changelog order
      And the release notes child keys should be deterministic

    Scenario: release filters keep only the requested release entry
      Given a release notes projection context with unreleased, versioned, and fallback completions
      When I project release notes filtered to "v1.2.0"
      Then the filtered release notes root should contain only "v1.2.0"
