# Architecture

**Purpose:** Auto-generated architecture diagrams from source annotations
**Detail Level:** Context map plus per-group component diagrams

---

## Overview

This view captures 14 patterns across 6 diagrams in the Theme architecture view.

## Diagrams

### Theme Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  commands["commands (1)"]
  coordination["coordination (2)"]
  projections["projections (4)"]
  taxonomy["taxonomy (5)"]
  testing["testing (2)"]
  coordination --> taxonomy
  taxonomy --> coordination
  testing --> taxonomy
```

### Theme: commands (1 pattern)

```mermaid
graph TD
  pdr001sessionworkflowcommands["PDR001SessionWorkflowCommands"]
```

### Theme: coordination (2 patterns)

```mermaid
graph TD
  pdr005processguardfsm["PDR005ProcessGuardFSM"]
  pdr006advisoryprocessguardprotection["PDR006AdvisoryProcessGuardProtection"]
  pdr006advisoryprocessguardprotection -->|depends-on| pdr005processguardfsm
```

### Theme: projections (4 patterns)

```mermaid
graph TD
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary"]
  adr010documentationcompositionhelpers["ADR010DocumentationCompositionHelpers"]
  adr006singlereadmodelarchitecture -->|depends-on| adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr005codecbasedmarkdownrendering
  adr010documentationcompositionhelpers -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr009projectiontrustboundary
```

### Theme: taxonomy (5 patterns)

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture"]
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign"]
  adr012deliverynavigation["ADR012DeliveryNavigation"]
  adr013taxonomyretirement["ADR013TaxonomyRetirement"]
  adr001taxonomycanonicalvalues -. see-also .- adr007coordinatedtaxonomyredesign
  adr001taxonomycanonicalvalues -. see-also .- adr012deliverynavigation
  adr001taxonomycanonicalvalues -. see-also .- adr013taxonomyretirement
  adr003sourcefirstpatternarchitecture -->|depends-on| adr001taxonomycanonicalvalues
  adr007coordinatedtaxonomyredesign -->|depends-on| adr001taxonomycanonicalvalues
  adr012deliverynavigation -->|depends-on| adr001taxonomycanonicalvalues
  adr012deliverynavigation -->|depends-on| adr003sourcefirstpatternarchitecture
  adr012deliverynavigation -. see-also .- adr013taxonomyretirement
  adr013taxonomyretirement -->|depends-on| adr001taxonomycanonicalvalues
  adr013taxonomyretirement -->|depends-on| adr007coordinatedtaxonomyredesign
```

### Theme: testing (2 patterns)

```mermaid
graph TD
  adr002gherkinonlytesting["ADR002GherkinOnlyTesting"]
  adr008stepdefinitionstubsconvention["ADR008StepDefinitionStubsConvention"]
  adr008stepdefinitionstubsconvention -->|depends-on| adr002gherkinonlytesting
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

[← Back to Architecture](../ARCHITECTURE.md)
