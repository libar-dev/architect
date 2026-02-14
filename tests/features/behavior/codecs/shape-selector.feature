@libar-docs
@libar-docs-pattern:ShapeSelectorTesting
@libar-docs-status:completed
@libar-docs-implements:ReferenceDocShowcase,DeclarationLevelShapeTagging
@libar-docs-product-area:Codec
Feature: Shape Selector Filtering

  Tests the filterShapesBySelectors function that provides fine-grained
  shape selection via structural discriminated union selectors.

  Background: Shape selector context
    Given a shape selector test context

  Rule: Reference doc configs select shapes via shapeSelectors

    **Invariant:** shapeSelectors provides three selection modes: by
    source path + specific names, by group tag, or by source path alone.

    **Verified by:** Select by source and names,
    Select by group,
    Select by source alone,
    shapeSources backward compatibility preserved

    @acceptance-criteria @happy-path
    Scenario: Select specific shapes by source and names
      Given a MasterDataset with patterns containing these extracted shapes:
        | Pattern Source | Shape Name | Group | Kind |
        | src/taxonomy/risk-levels.ts | RiskLevel | api-types | type |
        | src/taxonomy/risk-levels.ts | RISK_LEVELS | api-types | const |
        | src/taxonomy/risk-levels.ts | RiskCalculator | | function |
      When filtering with selector source "src/taxonomy/risk-levels.ts" and names "RiskLevel", "RISK_LEVELS"
      Then 2 shapes are returned including "RiskLevel" and "RISK_LEVELS"
      And shape "RiskCalculator" is not included

    @acceptance-criteria @happy-path
    Scenario: Select all shapes in a group
      Given a MasterDataset with patterns containing these extracted shapes:
        | Pattern Source | Shape Name | Group | Kind |
        | src/taxonomy/risk-levels.ts | RiskLevel | api-types | type |
        | src/taxonomy/status-values.ts | ProcessStatus | api-types | type |
        | src/taxonomy/status-values.ts | StatusHelper | | function |
      When filtering with selector group "api-types"
      Then 2 shapes are returned including "RiskLevel" and "ProcessStatus"
      And shape "StatusHelper" is not included

    @acceptance-criteria @happy-path
    Scenario: Select all tagged shapes from a source file
      Given a MasterDataset with patterns containing these extracted shapes:
        | Pattern Source | Shape Name | Group | Kind |
        | src/taxonomy/risk-levels.ts | RiskLevel | api-types | type |
        | src/taxonomy/risk-levels.ts | RISK_LEVELS | api-types | const |
        | src/taxonomy/risk-levels.ts | RiskCalculator | | function |
        | src/taxonomy/status-values.ts | ProcessStatus | api-types | type |
      When filtering with selector source "src/taxonomy/risk-levels.ts"
      Then 3 shapes are returned
      And shape "ProcessStatus" is not included

    @acceptance-criteria @happy-path
    Scenario: shapeSources without shapeSelectors returns all shapes
      Given a MasterDataset with patterns containing these extracted shapes:
        | Pattern Source | Shape Name | Group | Kind |
        | src/taxonomy/risk-levels.ts | RiskLevel | api-types | type |
        | src/taxonomy/risk-levels.ts | RISK_LEVELS | | const |
      When extracting shapes with shapeSources "src/taxonomy/*.ts"
      Then 2 shapes are returned including "RiskLevel" and "RISK_LEVELS"
