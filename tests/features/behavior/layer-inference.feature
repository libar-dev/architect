@libar-docs
@libar-docs-pattern:LayerInferenceTesting
@libar-docs-implements:LayerInference
@libar-docs-status:completed
@libar-docs-product-area:Extractor
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

  # ==========================================================================
  # Timeline Layer Detection
  # ==========================================================================

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

  # ==========================================================================
  # Domain Layer Detection
  # ==========================================================================

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

  # ==========================================================================
  # Integration Layer Detection
  # ==========================================================================

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

  # ==========================================================================
  # E2E Layer Detection
  # ==========================================================================

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

  # ==========================================================================
  # Component Layer Detection
  # ==========================================================================

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

  # ==========================================================================
  # Unknown Layer Fallback
  # ==========================================================================

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

  # ==========================================================================
  # Path Normalization
  # ==========================================================================

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

  # ==========================================================================
  # Edge Cases
  # ==========================================================================

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

  # ==========================================================================
  # FEATURE_LAYERS Constant Validation
  # ==========================================================================

  @constant @validation
  Scenario: FEATURE_LAYERS contains all valid layer values
    Then FEATURE_LAYERS should contain all expected layers: "timeline", "domain", "integration", "e2e", "component", "unknown"

  @constant @validation
  Scenario: FEATURE_LAYERS has exactly 6 layers
    Then FEATURE_LAYERS should have length 6

  @constant @validation
  Scenario: FEATURE_LAYERS is a readonly array
    Then FEATURE_LAYERS should be readonly
