# Design Review — Themed Lens

**Purpose:** Design-review components grouped by decision theme, including not-yet-implemented specs.
**Detail Level:** Working-state-inclusive context map plus per-lens component diagrams

---

## Overview

This view captures 15 patterns across 6 diagrams in the Theme view.

## Diagrams

### Theme Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  commands["commands (1)"]
  coordination["coordination (2)"]
  projections["projections (5)"]
  taxonomy["taxonomy (5)"]
  testing["testing (2)"]
  coordination --> taxonomy
  taxonomy --> coordination
  testing --> taxonomy
```

### Theme: commands (1 pattern)

```mermaid
graph TD
  pdr001sessionworkflowcommands["PDR001SessionWorkflowCommands<br/>(completed)"]
```

### Theme: coordination (2 patterns)

```mermaid
graph TD
  pdr005processguardfsm["PDR005ProcessGuardFSM<br/>(completed)"]
  pdr006advisoryprocessguardprotection["PDR006AdvisoryProcessGuardProtection<br/>(completed)"]
  pdr006advisoryprocessguardprotection -->|depends-on| pdr005processguardfsm
```

### Theme: projections (5 patterns)

```mermaid
graph TD
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering<br/>(completed)"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture<br/>(completed)"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary<br/>(completed)"]
  adr010documentationcompositionhelpers["ADR010DocumentationCompositionHelpers<br/>(completed)"]
  adr014agentreadsurface["ADR014AgentReadSurface<br/>(completed)"]
  adr006singlereadmodelarchitecture -->|depends-on| adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr005codecbasedmarkdownrendering
  adr010documentationcompositionhelpers -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr009projectiontrustboundary
  adr014agentreadsurface -->|depends-on| adr006singlereadmodelarchitecture
  adr014agentreadsurface -->|depends-on| adr010documentationcompositionhelpers
```

### Theme: taxonomy (5 patterns)

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues<br/>(completed)"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture<br/>(completed)"]
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign<br/>(completed)"]
  adr012deliverynavigation["ADR012DeliveryNavigation<br/>(completed)"]
  adr013taxonomyretirement["ADR013TaxonomyRetirement<br/>(completed)"]
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
  adr002gherkinonlytesting["ADR002GherkinOnlyTesting<br/>(completed)"]
  adr008stepdefinitionstubsconvention["ADR008StepDefinitionStubsConvention<br/>(completed)"]
  adr008stepdefinitionstubsconvention -->|depends-on| adr002gherkinonlytesting
```

## Fan-in

Most-depended-on patterns in this view, ranked by in-view dependant count.

| Pattern                               | Dependants | Top dependants                                                                                                                                     |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR001TaxonomyCanonicalValues         | 6          | ADR003SourceFirstPatternArchitecture, ADR007CoordinatedTaxonomyRedesign, ADR012DeliveryNavigation, ADR013TaxonomyRetirement, PDR005ProcessGuardFSM |
| ADR003SourceFirstPatternArchitecture  | 2          | ADR008StepDefinitionStubsConvention, ADR012DeliveryNavigation                                                                                      |
| PDR005ProcessGuardFSM                 | 2          | ADR007CoordinatedTaxonomyRedesign, PDR006AdvisoryProcessGuardProtection                                                                            |
| ADR002GherkinOnlyTesting              | 1          | ADR008StepDefinitionStubsConvention                                                                                                                |
| ADR005CodecBasedMarkdownRendering     | 1          | ADR006SingleReadModelArchitecture                                                                                                                  |
| ADR006SingleReadModelArchitecture     | 1          | ADR014AgentReadSurface                                                                                                                             |
| ADR007CoordinatedTaxonomyRedesign     | 1          | ADR013TaxonomyRetirement                                                                                                                           |
| ADR010DocumentationCompositionHelpers | 1          | ADR014AgentReadSurface                                                                                                                             |

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
- ADR014AgentReadSurface
- PDR001SessionWorkflowCommands
- PDR005ProcessGuardFSM
- PDR006AdvisoryProcessGuardProtection

---

[← Back to Design Review](../DESIGN-REVIEW.md)
