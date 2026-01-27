@libar-docs
@libar-docs-pattern:CrossSourceValidation
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:4h
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:detect-inconsistencies-between-typescript-and-gherkin-sources
@libar-docs-priority:high
Feature: Cross-Source Validation

  **Problem:**
  The delivery process uses dual sources (TypeScript phase files and Gherkin
  feature files) that must remain consistent. Currently there's no validation
  to detect:
  - Pattern name mismatches
  - Missing spec file references
  - Circular dependency chains
  - Orphaned deliverables (not linked to any phase)

  **Solution:**
  Implement cross-source validation that scans both source types and
  detects inconsistencies, broken references, and logical errors.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Pattern name matcher | Pending | Yes | @libar-dev/delivery-process/src/validation/ |
      | Spec reference validator | Pending | Yes | @libar-dev/delivery-process/src/validation/ |
      | Circular dependency detector | Pending | Yes | @libar-dev/delivery-process/src/validation/ |
      | Orphan detector | Pending | Yes | @libar-dev/delivery-process/src/validation/ |

  Rule: Pattern names must be consistent across sources

    @acceptance-criteria
    Scenario: Pattern name mismatch detected
      Given TypeScript phase file with @libar-docs-pattern MyPattern
      And feature file with @libar-docs-pattern:MyPatern (typo)
      When validating pattern names
      Then warning suggests "Did you mean MyPattern? Found MyPatern"

    @acceptance-criteria
    Scenario: Pattern names match across sources
      Given TypeScript phase file with @libar-docs-pattern SessionHandoffs
      And feature file with @libar-docs-pattern:SessionHandoffs
      When validating pattern names
      Then validation passes

  Rule: Circular dependencies are detected

    @acceptance-criteria
    Scenario: Direct circular dependency
      Given Phase A with @depends-on:PhaseB
      And Phase B with @depends-on:PhaseA
      When validating dependencies
      Then error indicates "Circular dependency: PhaseA -> PhaseB -> PhaseA"

    @acceptance-criteria
    Scenario: Transitive circular dependency
      Given Phase A with @depends-on:PhaseB
      And Phase B with @depends-on:PhaseC
      And Phase C with @depends-on:PhaseA
      When validating dependencies
      Then error indicates "Circular dependency: PhaseA -> PhaseB -> PhaseC -> PhaseA"

  Rule: Dependency references must resolve

    @acceptance-criteria
    Scenario: Dependency references non-existent pattern
      Given Phase A with @depends-on:NonExistentPattern
      When validating dependencies
      Then error indicates "Unresolved dependency: NonExistentPattern"
      And similar pattern names are suggested if available

    @acceptance-criteria
    Scenario: All dependencies resolve
      Given Phase A with @depends-on:PhaseB
      And PhaseB exists
      When validating dependencies
      Then validation passes
