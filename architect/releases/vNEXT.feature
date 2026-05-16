@architect
@architect-pattern:ReleaseVNEXT
@architect-status:active
Feature: vNEXT - Unreleased Package Work

  Staging area for Architect package work not yet assigned
  to a release version.

  **Purpose:**

  Deliverables tagged with @architect-release:vNEXT are tracked here
  until a release is cut. When cutting a release:

  1. Determine version number based on changes (major/minor/patch)
  2. Create new release feature file (e.g., v1.1.0.feature)
  3. Update deliverable tags from vNEXT to the new version
  4. Run `pnpm docs:all` to regenerate documentation

  **Current Work:**

  This release note stays intentionally light. It is the release-owned index
  for unreleased package work, not a deliverable ledger or surrogate spec.

  **Taxonomy Migration Campaign (Waves 1 through 4):**

  - Authored taxonomy now uses `@architect-uses` as the surviving dependency vocabulary.
  - Cross-process soft links no longer use separate authored tags. The old external dependency
    and parent tags were removed from live authored syntax.
  - Sequence tags and `@architect-extract-shapes` were removed from live authored syntax.
    Design ordering now lives in normal rule prose, and shape-oriented tooling reads the
    TypeScript export surface.
  - Hierarchy and dependency survivors were narrowed during the campaign, especially
    `@architect-level`, `@architect-parent`, and `@architect-uses`.
  - Migration details for the full Wave 1 through Wave 4 campaign live in
    `packages/architect-claude-plugin/MIGRATION.md`.

  See deliverables tagged with `@architect-release:vNEXT` in the codebase for
  the current unreleased change set.
