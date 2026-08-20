@architect
@architect-pattern:ValueFormatCanonicalValuesDispatch
@architect-implements:GherkinExtractor
@architect-status:active
@architect-product-area:Annotation
@architect-see-also:CanonicalValuesSync
@behavior @taxonomy
Feature: Value-format tags with canonical values surface drift

  Registries that declare format `value` together with a values list must
  cause the extractor to emit an `invalid-enum-value` diagnostic for any tag
  value outside the declared list. This is the universal mechanism for any
  value-format tag with canonical values (product-area, adr-category,
  format, and any future tag with a canonical list).

  Background: Value-format canonical-values context
    Given a value-format canonical-values context

  # ============================================================================
  # RULE 1: Value-format dispatch enforces canonical values
  # ============================================================================

  Rule: Value-format dispatch enforces canonical values

    **Invariant:** Registering a value-format tag with `values: [...]` causes unknown values to surface as `invalid-enum-value` diagnostics at extraction time, mirroring the enum-format branch's drift detection.
    **Rationale:** Without this, canonical-values for value-format tags silently accept anything, defeating ADR-001's enforcement guarantee for product-area, adr-category, and similar taxonomy tags.
    **Verified by:** Unknown value emits diagnostic; known value passes through

    @acceptance-criteria @happy-path
    Scenario: Unknown value for value-format tag emits diagnostic
      Given a registry that declares "test-area" as a value-format tag with values "Alpha, Beta"
      When I extract a feature using "@architect-test-area:Gamma"
      Then the diagnostics include "Unrecognized value 'Gamma' for @architect-test-area"
      And the diagnostic lists valid values "Alpha, Beta"

    @acceptance-criteria @happy-path
    Scenario: Known value for value-format tag emits no diagnostic
      Given a registry that declares "test-area" as a value-format tag with values "Alpha, Beta"
      When I extract a feature using "@architect-test-area:Alpha"
      Then no "invalid-enum-value" diagnostic is emitted
      And the metadata records test-area as "Alpha"
