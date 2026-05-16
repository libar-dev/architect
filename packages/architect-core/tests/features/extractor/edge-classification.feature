@architect
@architect-pattern:CrossPackageEdgeClassification
@architect-status:active
@architect-product-area:Annotation
@behavior @taxonomy
Feature: Cross-package edge externality classification

  The read-api wrapper `classifyEdgeExternality` exposes the existing
  cross-package machinery from `relationship-resolver` (which already
  underpins `buildReverseLookups` and `detectDanglingReferences`) as a
  stable surface for downstream consumers. Given a source pattern and a
  reference string, it returns one of `internal`, `external`, or
  `dangling` based on whether the reference resolves to a pattern
  declared in the same package, in another package's `src/`, or
  nowhere at all.

  The synthetic graph has three patterns: AlphaCore and BetaCore both
  declared in `packages/architect-core/src/`, and GammaGuard declared
  in `packages/architect-guard/src/`.

  Background: Synthetic two-package pattern graph
    Given a synthetic two-package graph with AlphaCore, BetaCore, and GammaGuard

  Rule: Same-package targets classify as internal

    @acceptance-criteria @happy-path
    Scenario: Same-package reference is internal
      When I classify the edge from "AlphaCore" to "BetaCore"
      Then the edge externality equals "internal"

  Rule: Cross-package targets classify as external

    @acceptance-criteria @happy-path
    Scenario: Cross-package reference is external
      When I classify the edge from "AlphaCore" to "GammaGuard"
      Then the edge externality equals "external"

  Rule: Unresolved references classify as dangling

    @acceptance-criteria @error-path
    Scenario: Unknown pattern reference is dangling
      When I classify the edge from "AlphaCore" to "DeltaUnknown"
      Then the edge externality equals "dangling"

  Rule: Declared pattern index is cached per graph

    @acceptance-criteria @performance
    Scenario: Repeated classifications reuse the declared-pattern index
      When I classify the edges from "AlphaCore" to "BetaCore" and "GammaGuard" while tracking declared-pattern-index builds
      Then the declared-pattern index is built 1 time
      And the classified edges equal "internal" and "external" in order
