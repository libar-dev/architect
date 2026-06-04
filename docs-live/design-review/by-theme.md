# Design Review — Themed Lens

**Purpose:** Design-review components grouped by decision theme, including not-yet-implemented specs.
**Detail Level:** Working-state-inclusive context map plus per-lens component diagrams

---

## Overview

This view captures 11 patterns across 6 diagrams in the Theme view.

## Diagrams

### Theme Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  commands["commands (1)"]
  coordination["coordination (1)"]
  projections["projections (4)"]
  taxonomy["taxonomy (3)"]
  testing["testing (2)"]
  coordination --> taxonomy
  taxonomy --> coordination
  testing --> taxonomy
```

### Theme: commands (1 pattern)

```mermaid
graph TD
  pdr001sessionworkflowcommands["PDR001SessionWorkflowCommands<br/>(roadmap)"]
```

### Theme: coordination (1 pattern)

```mermaid
graph TD
  pdr005processguardfsm["PDR005ProcessGuardFSM<br/>(completed)"]
```

### Theme: projections (4 patterns)

```mermaid
graph TD
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering<br/>(completed)"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture<br/>(completed)"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary<br/>(completed)"]
  adr010documentationcompositionhelpers["ADR010DocumentationCompositionHelpers<br/>(completed)"]
  adr006singlereadmodelarchitecture -->|depends-on| adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr005codecbasedmarkdownrendering
  adr010documentationcompositionhelpers -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr009projectiontrustboundary
```

### Theme: taxonomy (3 patterns)

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues<br/>(completed)"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture<br/>(completed)"]
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign<br/>(active)"]
  adr001taxonomycanonicalvalues -. see-also .- adr007coordinatedtaxonomyredesign
  adr003sourcefirstpatternarchitecture -->|depends-on| adr001taxonomycanonicalvalues
  adr007coordinatedtaxonomyredesign -->|depends-on| adr001taxonomycanonicalvalues
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

| Pattern                              | Dependants | Top dependants                                                                                 |
| ------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| ADR001TaxonomyCanonicalValues        | 3          | ADR003SourceFirstPatternArchitecture, ADR007CoordinatedTaxonomyRedesign, PDR005ProcessGuardFSM |
| ADR002GherkinOnlyTesting             | 1          | ADR008StepDefinitionStubsConvention                                                            |
| ADR003SourceFirstPatternArchitecture | 1          | ADR008StepDefinitionStubsConvention                                                            |
| ADR005CodecBasedMarkdownRendering    | 1          | ADR006SingleReadModelArchitecture                                                              |
| PDR005ProcessGuardFSM                | 1          | ADR007CoordinatedTaxonomyRedesign                                                              |

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
- PDR001SessionWorkflowCommands
- PDR005ProcessGuardFSM

---

[← Back to Design Review](../DESIGN-REVIEW.md)
