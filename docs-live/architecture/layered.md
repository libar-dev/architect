# Architecture

**Purpose:** Auto-generated architecture diagrams from source annotations
**Detail Level:** Context map plus per-group component diagrams

---

## Overview

This view captures 15 patterns across 4 diagrams in the Layered architecture view.

## Diagrams

### Layer Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  foundation["foundation (4)"]
  infrastructure["infrastructure (4)"]
  refinement["refinement (7)"]
  infrastructure --> foundation
  infrastructure --> refinement
  refinement --> foundation
```

### Layer: foundation (4 patterns)

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues"]
  adr002gherkinonlytesting["ADR002GherkinOnlyTesting"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture"]
  pdr005processguardfsm["PDR005ProcessGuardFSM"]
  adr003sourcefirstpatternarchitecture -->|depends-on| adr001taxonomycanonicalvalues
  pdr005processguardfsm -->|depends-on| adr001taxonomycanonicalvalues
```

### Layer: infrastructure (4 patterns)

```mermaid
graph TD
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture"]
  adr008stepdefinitionstubsconvention["ADR008StepDefinitionStubsConvention"]
  adr014agentreadsurface["ADR014AgentReadSurface"]
  adr006singlereadmodelarchitecture -->|depends-on| adr005codecbasedmarkdownrendering
  adr014agentreadsurface -->|depends-on| adr006singlereadmodelarchitecture
```

### Layer: refinement (7 patterns)

```mermaid
graph TD
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary"]
  adr010documentationcompositionhelpers["ADR010DocumentationCompositionHelpers"]
  adr012deliverynavigation["ADR012DeliveryNavigation"]
  adr013taxonomyretirement["ADR013TaxonomyRetirement"]
  pdr001sessionworkflowcommands["PDR001SessionWorkflowCommands"]
  pdr006advisoryprocessguardprotection["PDR006AdvisoryProcessGuardProtection"]
  adr010documentationcompositionhelpers -. see-also .- adr009projectiontrustboundary
  adr012deliverynavigation -. see-also .- adr013taxonomyretirement
  adr013taxonomyretirement -->|depends-on| adr007coordinatedtaxonomyredesign
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

[← Back to Architecture](../ARCHITECTURE.md)
