@architect
@architect-pattern:CanonicalValuesSync
@architect-status:active
@architect-product-area:Configuration
@architect-implements:ADR001TaxonomyCanonicalValues
@architect-see-also:ADR001TaxonomyCanonicalValues
@behavior @taxonomy
Feature: Canonical values stay in sync between ADR-001 and TypeScript constants

  ADR-001 is the decision record for every canonical taxonomy enum. Each
  Rule with a values table must agree with the TypeScript constant that
  consumers import. This is the universal mechanism guard — one parser,
  one comparison, one failure mode that names the drift.

  Add new canonical values by extending the ADR Rule and the TS constant
  together; this scenario proves they did not drift apart.

  Rule: ADR-001 Rule 1 matches ARCHITECT_PACKAGE_PRODUCT_AREAS

    **Invariant:** The product-area table in ADR-001 Rule 1 lists the same
    values as `ARCHITECT_PACKAGE_PRODUCT_AREAS` exported from
    `@libar-dev/architect-core`.
    **Rationale:** Per D-8, productAreas are organizational and project-
    specific. The package's own list is asserted; other projects with no
    list configured leave the tag unconstrained.
    **Verified by:** Product-area values match between ADR-001 Rule 1 and ARCHITECT_PACKAGE_PRODUCT_AREAS

    @acceptance-criteria @happy-path
    Scenario: Product-area values match between ADR-001 Rule 1 and ARCHITECT_PACKAGE_PRODUCT_AREAS
      Given the ADR-001 canonical values feature file
      When I extract the product-area values from Rule 1
      And I list the values in ARCHITECT_PACKAGE_PRODUCT_AREAS
      Then both product-area lists contain the same values

  Rule: ADR-001 Rule 2 matches ADR_CATEGORY_VALUES

    **Invariant:** The adr-category table in ADR-001 Rule 2 lists the same
    values as `ADR_CATEGORY_VALUES` exported from `@libar-dev/architect-core`.
    **Rationale:** ADR is the authority on the category set; the constant
    is its TypeScript projection. Drift produces silent miscategorization.
    **Verified by:** ADR-category values match between ADR-001 Rule 2 and ADR_CATEGORY_VALUES

    @acceptance-criteria @happy-path
    Scenario: ADR-category values match between ADR-001 Rule 2 and ADR_CATEGORY_VALUES
      Given the ADR-001 canonical values feature file
      When I extract the adr-category values from Rule 2
      And I list the values in ADR_CATEGORY_VALUES
      Then both adr-category lists contain the same values

  Rule: ADR-001 Rule 3 matches ACCEPTED_STATUS_VALUES

    **Invariant:** The FSM status table in ADR-001 Rule 3 lists the same
    statuses as `ACCEPTED_STATUS_VALUES` exported from
    `@libar-dev/architect-core` (which is `[candidate, ...PROCESS_STATUS_VALUES]`).
    **Rationale:** A 5th value (candidate) is accepted at extraction but
    exempt from FSM enforcement. ACCEPTED_STATUS_VALUES is the broader
    set used by Zod and the registry; PROCESS_STATUS_VALUES is the strict
    FSM set. Both must match the ADR table.
    **Verified by:** Status values match between ADR-001 Rule 3 and ACCEPTED_STATUS_VALUES

    @acceptance-criteria @happy-path
    Scenario: Status values match between ADR-001 Rule 3 and ACCEPTED_STATUS_VALUES
      Given the ADR-001 canonical values feature file
      When I extract the status values from Rule 3
      And I list the values in ACCEPTED_STATUS_VALUES
      Then both status lists contain the same values

  Rule: ADR-001 Rule 4 matches VALID_TRANSITIONS

    **Invariant:** The valid transitions table in ADR-001 Rule 4 lists the
    same `(from, to)` pairs as the `VALID_TRANSITIONS` map exported from
    `@libar-dev/architect-core`.
    **Rationale:** Transition drift means either Process Guard accepts a
    transition that ADR-001 forbids, or rejects one that ADR-001 allows —
    both undermine FSM enforcement integrity.
    **Verified by:** Transitions match between ADR-001 Rule 4 and VALID_TRANSITIONS

    @acceptance-criteria @happy-path
    Scenario: Transitions match between ADR-001 Rule 4 and VALID_TRANSITIONS
      Given the ADR-001 canonical values feature file
      When I extract the transition pairs from Rule 4
      And I list the pairs in VALID_TRANSITIONS
      Then both transition pair lists contain the same pairs

  Rule: ADR-001 Rule 5 matches FORMAT_TYPES

    **Invariant:** The tag format types table in ADR-001 Rule 5 lists the
    same formats as `FORMAT_TYPES` exported from `@libar-dev/architect-core`.
    Order is irrelevant — set equality is asserted.
    **Rationale:** The format determines how the value-format dispatch
    parses a tag. A new format added to the constant without ADR coverage
    means the dispatch behavior is undocumented; conversely, a format
    removed from the constant breaks any tag still using it.
    **Verified by:** Format types match between ADR-001 Rule 5 and FORMAT_TYPES

    @acceptance-criteria @happy-path
    Scenario: Format types match between ADR-001 Rule 5 and FORMAT_TYPES
      Given the ADR-001 canonical values feature file
      When I extract the format-type values from Rule 5
      And I list the values in FORMAT_TYPES
      Then both format-type lists contain the same values

  Rule: ADR-001 Rule 6 canonical minimum matches CANONICAL_FEATURE_ONLY_TAG_SUFFIXES

    **Invariant:** The tags listed in ADR-001 Rule 6's source-ownership table
    with "Correct Source: Feature files" — excluding any per-package extension
    not declared in the canonical minimum — match the
    `CANONICAL_FEATURE_ONLY_TAG_SUFFIXES` constant exported from
    `@libar-dev/architect-core`. Per-package extensions such as
    `ARCHITECT_PACKAGE_FEATURE_ONLY_TAG_SUFFIXES` add to the canonical; they
    never narrow it. Drift on the canonical minimum signals real ADR/code
    divergence; drift on a per-package extension is by design.
    **Rationale:** The hybrid model (canonical floor + per-instance
    extension) only enforces the floor centrally. Asserting against the
    extension list would lock every project to one project's vocabulary.
    **Verified by:** Canonical feature-only tags match between ADR-001 Rule 6 and CANONICAL_FEATURE_ONLY_TAG_SUFFIXES

    @acceptance-criteria @happy-path
    Scenario: Canonical feature-only tags match between ADR-001 Rule 6 and CANONICAL_FEATURE_ONLY_TAG_SUFFIXES
      Given the ADR-001 canonical values feature file
      When I extract the canonical feature-only tags from Rule 6
      And I list the values in CANONICAL_FEATURE_ONLY_TAG_SUFFIXES
      Then both canonical feature-only tag lists contain the same values

  Rule: ADR-001 Rule 7 quarter format regex matches QUARTER_PATTERN

    **Invariant:** The quarter format declared in ADR-001 Rule 7
    (`YYYY-QN`, e.g. `2026-Q1`) is the format that the `QUARTER_PATTERN`
    regex exported from `@libar-dev/architect-core` accepts.
    **Rationale:** Rule 7 has no values table — the rule is the regex
    contract itself. The sync test asserts the canonical example accepts
    and the previous (anti-pattern) format rejects, proving the regex
    encodes Rule 7's contract.
    **Verified by:** QUARTER_PATTERN encodes ADR-001 Rule 7's format

    @acceptance-criteria @happy-path
    Scenario: QUARTER_PATTERN encodes ADR-001 Rule 7's format
      Given the QUARTER_PATTERN regex
      Then it accepts the canonical example "2026-Q1"
      And it rejects the anti-pattern "Q1-2026"

  Rule: ADR-001 Rule 8 phase names match CANONICAL_PHASE_NAMES

    **Invariant:** The 6 phase names in ADR-001 Rule 8 list the same
    names as `CANONICAL_PHASE_NAMES` exported from `@libar-dev/architect-core`.
    **Rationale:** Workflow config consumers and roadmap generation read
    phase names from the canonical list. Renaming a phase in the ADR
    without updating the constant breaks roadmap rendering.
    **Verified by:** Phase names match between ADR-001 Rule 8 and CANONICAL_PHASE_NAMES

    @acceptance-criteria @happy-path
    Scenario: Phase names match between ADR-001 Rule 8 and CANONICAL_PHASE_NAMES
      Given the ADR-001 canonical values feature file
      When I extract the phase names from Rule 8
      And I list the names in CANONICAL_PHASE_NAMES
      Then both phase-name lists contain the same names

  Rule: ADR-001 Rule 8 phase ordinals match CANONICAL_PHASE_ORDINALS

    **Invariant:** The 6 phase ordinals in ADR-001 Rule 8 list the same
    integers as `CANONICAL_PHASE_ORDINALS` exported from
    `@libar-dev/architect-core`.
    **Rationale:** Ordinals drive sort order in roadmap rendering; an
    ordinal shift in the ADR without updating the constant produces
    silently misordered output.
    **Verified by:** Phase ordinals match between ADR-001 Rule 8 and CANONICAL_PHASE_ORDINALS

    @acceptance-criteria @happy-path
    Scenario: Phase ordinals match between ADR-001 Rule 8 and CANONICAL_PHASE_ORDINALS
      Given the ADR-001 canonical values feature file
      When I extract the phase ordinals from Rule 8
      And I list the ordinals in CANONICAL_PHASE_ORDINALS
      Then both phase-ordinal lists contain the same ordinals

  Rule: ADR-001 Rule 9 matches DELIVERABLE_STATUS_VALUES

    **Invariant:** The deliverable status table in ADR-001 Rule 9 lists
    the same values as `DELIVERABLE_STATUS_VALUES` exported from
    `@libar-dev/architect-core`.
    **Rationale:** DoD checks read DELIVERABLE_STATUS_VALUES to classify
    terminal vs in-progress deliverables. Drift between the ADR table
    and the constant breaks DoD pass/fail decisions.
    **Verified by:** Deliverable status values match between ADR-001 Rule 9 and DELIVERABLE_STATUS_VALUES

    @acceptance-criteria @happy-path
    Scenario: Deliverable status values match between ADR-001 Rule 9 and DELIVERABLE_STATUS_VALUES
      Given the ADR-001 canonical values feature file
      When I extract the deliverable status values from Rule 9
      And I list the values in DELIVERABLE_STATUS_VALUES
      Then both deliverable-status lists contain the same values

  Rule: ADR-001 Rule 10 matches ARCHITECT_PACKAGE_ROLES

    **Invariant:** The role table in ADR-001 Rule 10 lists the same tags
    as `ARCHITECT_PACKAGE_ROLES` exported from `@libar-dev/architect-core`.
    **Rationale:** ADR is the authority on the decision; the constant is
    its TypeScript projection. Drift means either the decision shipped
    without code or the code shipped without a decision — both are bugs.
    **Verified by:** Role tags match between ADR-001 Rule 10 and ARCHITECT_PACKAGE_ROLES

    @acceptance-criteria @happy-path
    Scenario: Role tags match between ADR-001 Rule 10 and ARCHITECT_PACKAGE_ROLES
      Given the ADR-001 canonical values feature file
      When I extract the role tags from Rule 10
      And I list the tags in ARCHITECT_PACKAGE_ROLES
      Then both lists contain the same tags
