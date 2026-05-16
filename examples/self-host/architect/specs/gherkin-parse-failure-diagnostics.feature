@architect
@architect-pattern:GherkinParseFailureDiagnostics
@architect-status:candidate
@architect-product-area:Annotation
@architect-bounded-context:extractor
Feature: GherkinParseFailureDiagnostics

  **Problem:**
  Scanner-level Gherkin parse failures still log to stderr and stop at the scan
  boundary. This preserves the information for local debugging but does not
  thread parser failures into the extraction diagnostic pipeline, which means
  CLI, MCP, and downstream session tooling cannot surface malformed gated files
  alongside other extraction health signals.

  **Solution:**
  Introduce scanner-to-pipeline threading for gated Gherkin parse failures so
  malformed `.feature` files emit `parse-failure` diagnostics with file path,
  severity, parser message, and remediation guidance. The diagnostic must flow
  through `BuildResult.diagnostics` and the consumer surfaces that already
  expose extraction diagnostics.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Parse-failure scanner threading | pending | src/scanner/gherkin-scanner.ts |
      | Pipeline aggregation | pending | src/generators/pipeline/build-pipeline.ts |
      | Executable specification | pending | tests/features/taxonomy/ |

  Rule: Gated parse failures become structured diagnostics

    **Invariant:** A gated `.feature` file that fails Gherkin parsing produces a
    `parse-failure` diagnostic in `BuildResult.diagnostics` with the original
    parser message preserved. Non-gated malformed files may still be ignored by
    Architect extraction.

    **Rationale:** Parse failures are currently visible only as stderr noise.
    They must participate in the same diagnostics contract as other extraction
    failures so session tooling can treat malformed gated specs as first-class
    health signals.

    @acceptance-criteria
    Scenario: Malformed gated feature produces parse-failure diagnostic
      Given a gated .feature file with malformed Gherkin syntax
      When buildPatternGraph() is called
      Then BuildResult.diagnostics contains a diagnostic with code "parse-failure"
      And the diagnostic message includes the original parser error details
