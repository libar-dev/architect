# Design Review — Layered Lens

**Purpose:** Design-review components grouped by architecture layer, including not-yet-implemented specs.
**Detail Level:** Working-state-inclusive context map plus per-lens component diagrams

---

## Overview

This view captures 14 patterns across 4 diagrams in the Layered view.

## Diagrams

### Layer Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  foundation["foundation (4)"]
  infrastructure["infrastructure (3)"]
  refinement["refinement (7)"]
  infrastructure --> foundation
  refinement --> foundation
```

### Layer: foundation (4 patterns)

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues<br/>(completed)"]
  adr002gherkinonlytesting["ADR002GherkinOnlyTesting<br/>(completed)"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture<br/>(completed)"]
  pdr005processguardfsm["PDR005ProcessGuardFSM<br/>(completed)"]
  adr003sourcefirstpatternarchitecture -->|depends-on| adr001taxonomycanonicalvalues
  pdr005processguardfsm -->|depends-on| adr001taxonomycanonicalvalues
```

### Layer: infrastructure (3 patterns)

```mermaid
graph TD
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering<br/>(completed)"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture<br/>(completed)"]
  adr008stepdefinitionstubsconvention["ADR008StepDefinitionStubsConvention<br/>(completed)"]
  adr006singlereadmodelarchitecture -->|depends-on| adr005codecbasedmarkdownrendering
```

### Layer: refinement (7 patterns)

```mermaid
graph TD
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign<br/>(completed)"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary<br/>(completed)"]
  adr010documentationcompositionhelpers["ADR010DocumentationCompositionHelpers<br/>(completed)"]
  adr012deliverynavigation["ADR012DeliveryNavigation<br/>(completed)"]
  adr013taxonomyretirement["ADR013TaxonomyRetirement<br/>(completed)"]
  pdr001sessionworkflowcommands["PDR001SessionWorkflowCommands<br/>(completed)"]
  pdr006advisoryprocessguardprotection["PDR006AdvisoryProcessGuardProtection<br/>(completed)"]
  adr010documentationcompositionhelpers -. see-also .- adr009projectiontrustboundary
  adr012deliverynavigation -. see-also .- adr013taxonomyretirement
  adr013taxonomyretirement -->|depends-on| adr007coordinatedtaxonomyredesign
```

## Fan-in

Most-depended-on patterns in this view, ranked by in-view dependant count.

| Pattern                              | Dependants | Top dependants                                                                                                                                     |
| ------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR001TaxonomyCanonicalValues        | 6          | ADR003SourceFirstPatternArchitecture, ADR007CoordinatedTaxonomyRedesign, ADR012DeliveryNavigation, ADR013TaxonomyRetirement, PDR005ProcessGuardFSM |
| ADR003SourceFirstPatternArchitecture | 2          | ADR008StepDefinitionStubsConvention, ADR012DeliveryNavigation                                                                                      |
| PDR005ProcessGuardFSM                | 2          | ADR007CoordinatedTaxonomyRedesign, PDR006AdvisoryProcessGuardProtection                                                                            |
| ADR002GherkinOnlyTesting             | 1          | ADR008StepDefinitionStubsConvention                                                                                                                |
| ADR005CodecBasedMarkdownRendering    | 1          | ADR006SingleReadModelArchitecture                                                                                                                  |
| ADR007CoordinatedTaxonomyRedesign    | 1          | ADR013TaxonomyRetirement                                                                                                                           |

## Legend

### Legend

- Solid arrow = dependency (depends-on / uses)
- Dotted line = reference (see-also)

## Patterns

- ADR001TaxonomyCanonicalValues
- ADR002GherkinOnlyTesting
- ADR003SourceFirstPatternArchitecture
- ADR005CodecBasedMarkdownRendering
- ADR006SingleReadModelArchitecture
- ADR007CoordinatedTaxonomyRedesign
- ADR008StepDefinitionStubsConvention
- ADR009ProjectionTrustBoundary
- ADR010DocumentationCompositionHelpers
- ADR012DeliveryNavigation
- ADR013TaxonomyRetirement
- PDR001SessionWorkflowCommands
- PDR005ProcessGuardFSM
- PDR006AdvisoryProcessGuardProtection

---

[← Back to Design Review](../DESIGN-REVIEW.md)
