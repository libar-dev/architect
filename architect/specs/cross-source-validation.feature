@architect
@architect-pattern:CrossSourceValidation
@architect-status:roadmap
@architect-phase:100
@architect-effort:4h
@architect-product-area:Annotation
@architect-business-value:detect-inconsistencies-between-typescript-and-gherkin-sources
@architect-priority:high
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
      | Pattern name matcher | pending | Yes | @libar-dev/architect/src/validation/ |
      | Spec reference validator | pending | Yes | @libar-dev/architect/src/validation/ |
      | Circular dependency detector | pending | Yes | @libar-dev/architect/src/validation/ |
      | Orphan detector | pending | Yes | @libar-dev/architect/src/validation/ |

  Rule: Pattern names must be consistent across sources

    **Invariant:** A pattern name referenced in one source must resolve to the same canonical name in all other sources.
    **Rationale:** Typos or inconsistencies between TypeScript and Gherkin pattern names cause silent data loss — the pattern appears as two unrelated entries instead of a unified cross-source record.
    **Verified by:** Pattern name mismatch detected; Pattern names match across sources

    @acceptance-criteria
    Scenario: Pattern name mismatch detected
      Given TypeScript phase file with @architect-pattern MyPattern
      And feature file with @architect-pattern:MyPatern (typo)
      When validating pattern names
      Then warning suggests "Did you mean MyPattern? Found MyPatern"

    @acceptance-criteria
    Scenario: Pattern names match across sources
      Given TypeScript phase file with @architect-pattern SessionHandoffs
      And feature file with @architect-pattern:SessionHandoffs
      When validating pattern names
      Then validation passes

  Rule: Circular dependencies are detected

    **Invariant:** The dependency graph must be a directed acyclic graph (DAG) with no cycles.
    **Rationale:** Circular dependencies create unresolvable ordering — no pattern in the cycle can be completed first, blocking the entire chain from progressing.
    **Verified by:** Direct circular dependency; Transitive circular dependency

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

    **Invariant:** Every `@depends-on` reference must resolve to an existing pattern in the registry.
    **Rationale:** Dangling dependency references produce incomplete ordering and missing relationship edges in generated documentation, hiding actual inter-pattern constraints.
    **Verified by:** Dependency references non-existent pattern; All dependencies resolve

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
