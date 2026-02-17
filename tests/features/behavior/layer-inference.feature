@libar-docs
@libar-docs-pattern:LayerInferenceTesting
@libar-docs-implements:LayerInference
@libar-docs-status:completed
@libar-docs-product-area:Annotation
@behavior
Feature: Layer Inference from Feature File Paths
  The layer inference module classifies feature files into testing layers
  (timeline, domain, integration, e2e, component) based on directory path patterns.
  This enables automatic filtering and documentation grouping without explicit annotations.

  **Problem:**
  - Manual layer annotation in every feature file is tedious and error-prone
  - Inconsistent classification across projects makes filtering unreliable
  - Cross-platform path differences (Windows backslashes) cause classification failures
  - No fallback for unclassified features leads to missing test coverage

  **Solution:**
  - Directory-based inference using path pattern matching
  - Priority-based pattern matching (integration checked before domain)
  - Path normalization handles Windows, mixed separators, and case differences
  - "unknown" fallback layer ensures all features are captured
  - FEATURE_LAYERS constant provides validated layer enumeration

  Rule: Timeline layer is detected from /timeline/ directory segments

    **Invariant:** Any feature file path containing a /timeline/ directory segment is classified as timeline layer.
    **Verified by:** Detect timeline features from /timeline/ path, Detect timeline features regardless of parent directories, Detect timeline features in delivery-process package

    @happy-path @timeline
    Scenario: Detect timeline features from /timeline/ path
      Given the feature file path "tests/features/timeline/phase-01.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

    @happy-path @timeline
    Scenario: Detect timeline features regardless of parent directories
      Given the feature file path "examples/order-management/tests/features/timeline/phase-14.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

    @happy-path @timeline
    Scenario: Detect timeline features in delivery-process package
      Given the feature file path "packages/@libar-dev/delivery-process/tests/features/timeline/session-01.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

  Rule: Domain layer is detected from business context directory segments

    **Invariant:** Feature files in /deciders/, /orders/, or /inventory/ directories are classified as domain layer.
    **Verified by:** Detect decider features as domain, Detect orders features as domain, Detect inventory features as domain

    @happy-path @domain
    Scenario: Detect decider features as domain
      Given the feature file path "tests/features/deciders/order.decider.feature"
      When I infer the feature layer
      Then the inferred layer should be "domain"

    @happy-path @domain
    Scenario: Detect orders features as domain
      Given the feature file path "tests/features/orders/create-order.feature"
      When I infer the feature layer
      Then the inferred layer should be "domain"

    @happy-path @domain
    Scenario: Detect inventory features as domain
      Given the feature file path "tests/features/inventory/reserve-stock.feature"
      When I infer the feature layer
      Then the inferred layer should be "domain"

  Rule: Integration layer is detected and takes priority over domain directories

    **Invariant:** Paths containing /integration-features/ or /integration/ are classified as integration, even when they also contain domain directory names.
    **Verified by:** Detect integration-features directory as integration, Detect /integration/ directory as integration, Integration takes priority over orders subdirectory, Integration takes priority over inventory subdirectory

    @happy-path @integration
    Scenario: Detect integration-features directory as integration
      Given the feature file path "tests/integration-features/orders/full-flow.feature"
      When I infer the feature layer
      Then the inferred layer should be "integration"

    @happy-path @integration
    Scenario: Detect /integration/ directory as integration
      Given the feature file path "tests/integration/orders/saga.feature"
      When I infer the feature layer
      Then the inferred layer should be "integration"

    @edge-case @integration
    Scenario: Integration takes priority over orders subdirectory
      Given the feature file path "tests/integration-features/orders/e2e-flow.feature"
      When I infer the feature layer
      Then the inferred layer should be "integration"

    @edge-case @integration
    Scenario: Integration takes priority over inventory subdirectory
      Given the feature file path "tests/integration-features/inventory/stock-sync.feature"
      When I infer the feature layer
      Then the inferred layer should be "integration"

  Rule: E2E layer is detected from /e2e/ directory segments

    **Invariant:** Any feature file path containing an /e2e/ directory segment is classified as e2e layer.
    **Verified by:** Detect e2e features from /e2e/ path, Detect e2e features in frontend app, Detect e2e-journeys as e2e

    @happy-path @e2e
    Scenario: Detect e2e features from /e2e/ path
      Given the feature file path "tests/e2e/features/checkout.feature"
      When I infer the feature layer
      Then the inferred layer should be "e2e"

    @happy-path @e2e
    Scenario: Detect e2e features in frontend app
      Given the feature file path "apps/frontend/tests/e2e/features/login.feature"
      When I infer the feature layer
      Then the inferred layer should be "e2e"

    @happy-path @e2e
    Scenario: Detect e2e-journeys as e2e
      Given the feature file path "apps/frontend/tests/e2e/features/e2e-journeys/user-flow.feature"
      When I infer the feature layer
      Then the inferred layer should be "e2e"

  Rule: Component layer is detected from tool-specific directory segments

    **Invariant:** Feature files in /scanner/ or /lint/ directories are classified as component layer.
    **Verified by:** Detect scanner features as component, Detect lint features as component

    @happy-path @component
    Scenario: Detect scanner features as component
      Given the feature file path "tests/features/scanner/ast-parser.feature"
      When I infer the feature layer
      Then the inferred layer should be "component"

    @happy-path @component
    Scenario: Detect lint features as component
      Given the feature file path "tests/features/lint/rules.feature"
      When I infer the feature layer
      Then the inferred layer should be "component"

  Rule: Unknown layer is the fallback for unclassified paths

    **Invariant:** Any feature file path that does not match a known layer pattern is classified as unknown.
    **Verified by:** Return unknown for unclassified paths, Return unknown for root-level features, Return unknown for generic test paths

    @edge-case @unknown
    Scenario: Return unknown for unclassified paths
      Given the feature file path "tests/misc/random.feature"
      When I infer the feature layer
      Then the inferred layer should be "unknown"

    @edge-case @unknown
    Scenario: Return unknown for root-level features
      Given the feature file path "features/some-feature.feature"
      When I infer the feature layer
      Then the inferred layer should be "unknown"

    @edge-case @unknown
    Scenario: Return unknown for generic test paths
      Given the feature file path "tests/features/other/something.feature"
      When I infer the feature layer
      Then the inferred layer should be "unknown"

  Rule: Path normalization handles cross-platform and case differences

    **Invariant:** Layer inference produces correct results regardless of path separators, case, or absolute vs relative paths.
    **Verified by:** Handle Windows-style paths with backslashes, Be case-insensitive, Handle mixed path separators, Handle absolute Unix paths, Handle Windows absolute paths, Timeline in filename only should not match, Timeline detected even with deep nesting

    @edge-case @normalization
    Scenario: Handle Windows-style paths with backslashes
      Given the feature file path "tests\\features\\timeline\\phase-01.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

    @edge-case @normalization
    Scenario: Be case-insensitive
      Given the feature file path "Tests/Features/Timeline/Phase-01.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

    @edge-case @normalization
    Scenario: Handle mixed path separators
      Given the feature file path "tests\\features/deciders\\order.feature"
      When I infer the feature layer
      Then the inferred layer should be "domain"

    @edge-case @normalization
    Scenario: Handle absolute Unix paths
      Given the feature file path "/Users/dev/project/tests/features/timeline/phase.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

    @edge-case @normalization
    Scenario: Handle Windows absolute paths
      Given the feature file path "C:\\Users\\dev\\project\\tests\\features\\timeline\\phase.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

    @edge-case @filename-matching
    Scenario: Timeline in filename only should not match
      Given the feature file path "tests/features/other/timeline-related.feature"
      When I infer the feature layer
      Then the inferred layer should be "unknown"

    @edge-case @deep-nesting
    Scenario: Timeline detected even with deep nesting
      Given the feature file path "project/tests/features/timeline/nested/deep/phase.feature"
      When I infer the feature layer
      Then the inferred layer should be "timeline"

  Rule: FEATURE_LAYERS constant provides validated layer enumeration

    **Invariant:** FEATURE_LAYERS is a readonly array containing exactly all 6 valid layer values.
    **Verified by:** FEATURE_LAYERS contains all valid layer values, FEATURE_LAYERS has exactly 6 layers, FEATURE_LAYERS is a readonly array

    @constant @validation
    Scenario: FEATURE_LAYERS contains all valid layer values
      Then FEATURE_LAYERS should contain all expected layers: "timeline", "domain", "integration", "e2e", "component", "unknown"

    @constant @validation
    Scenario: FEATURE_LAYERS has exactly 6 layers
      Then FEATURE_LAYERS should have length 6

    @constant @validation
    Scenario: FEATURE_LAYERS is a readonly array
      Then FEATURE_LAYERS should be readonly
