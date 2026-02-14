# ✅ Layer Inference Testing

**Purpose:** Detailed requirements for the Layer Inference Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Annotation |

## Description

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

## Acceptance Criteria

**Detect timeline features from /timeline/ path**

- Given the feature file path "tests/features/timeline/phase-01.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**Detect timeline features regardless of parent directories**

- Given the feature file path "examples/order-management/tests/features/timeline/phase-14.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**Detect timeline features in delivery-process package**

- Given the feature file path "packages/@libar-dev/delivery-process/tests/features/timeline/session-01.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**Detect decider features as domain**

- Given the feature file path "tests/features/deciders/order.decider.feature"
- When I infer the feature layer
- Then the inferred layer should be "domain"

**Detect orders features as domain**

- Given the feature file path "tests/features/orders/create-order.feature"
- When I infer the feature layer
- Then the inferred layer should be "domain"

**Detect inventory features as domain**

- Given the feature file path "tests/features/inventory/reserve-stock.feature"
- When I infer the feature layer
- Then the inferred layer should be "domain"

**Detect integration-features directory as integration**

- Given the feature file path "tests/integration-features/orders/full-flow.feature"
- When I infer the feature layer
- Then the inferred layer should be "integration"

**Detect /integration/ directory as integration**

- Given the feature file path "tests/integration/orders/saga.feature"
- When I infer the feature layer
- Then the inferred layer should be "integration"

**Integration takes priority over orders subdirectory**

- Given the feature file path "tests/integration-features/orders/e2e-flow.feature"
- When I infer the feature layer
- Then the inferred layer should be "integration"

**Integration takes priority over inventory subdirectory**

- Given the feature file path "tests/integration-features/inventory/stock-sync.feature"
- When I infer the feature layer
- Then the inferred layer should be "integration"

**Detect e2e features from /e2e/ path**

- Given the feature file path "tests/e2e/features/checkout.feature"
- When I infer the feature layer
- Then the inferred layer should be "e2e"

**Detect e2e features in frontend app**

- Given the feature file path "apps/frontend/tests/e2e/features/login.feature"
- When I infer the feature layer
- Then the inferred layer should be "e2e"

**Detect e2e-journeys as e2e**

- Given the feature file path "apps/frontend/tests/e2e/features/e2e-journeys/user-flow.feature"
- When I infer the feature layer
- Then the inferred layer should be "e2e"

**Detect scanner features as component**

- Given the feature file path "tests/features/scanner/ast-parser.feature"
- When I infer the feature layer
- Then the inferred layer should be "component"

**Detect lint features as component**

- Given the feature file path "tests/features/lint/rules.feature"
- When I infer the feature layer
- Then the inferred layer should be "component"

**Return unknown for unclassified paths**

- Given the feature file path "tests/misc/random.feature"
- When I infer the feature layer
- Then the inferred layer should be "unknown"

**Return unknown for root-level features**

- Given the feature file path "features/some-feature.feature"
- When I infer the feature layer
- Then the inferred layer should be "unknown"

**Return unknown for generic test paths**

- Given the feature file path "tests/features/other/something.feature"
- When I infer the feature layer
- Then the inferred layer should be "unknown"

**Handle Windows-style paths with backslashes**

- Given the feature file path "tests\\features\\timeline\\phase-01.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**Be case-insensitive**

- Given the feature file path "Tests/Features/Timeline/Phase-01.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**Handle mixed path separators**

- Given the feature file path "tests\\features/deciders\\order.feature"
- When I infer the feature layer
- Then the inferred layer should be "domain"

**Handle absolute Unix paths**

- Given the feature file path "/Users/dev/project/tests/features/timeline/phase.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**Handle Windows absolute paths**

- Given the feature file path "C:\\Users\\dev\\project\\tests\\features\\timeline\\phase.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**Timeline in filename only should not match**

- Given the feature file path "tests/features/other/timeline-related.feature"
- When I infer the feature layer
- Then the inferred layer should be "unknown"

**Timeline detected even with deep nesting**

- Given the feature file path "project/tests/features/timeline/nested/deep/phase.feature"
- When I infer the feature layer
- Then the inferred layer should be "timeline"

**FEATURE_LAYERS contains all valid layer values**

- Then FEATURE_LAYERS should contain all expected layers: "timeline", "domain", "integration", "e2e", "component", "unknown"

**FEATURE_LAYERS has exactly 6 layers**

- Then FEATURE_LAYERS should have length 6

**FEATURE_LAYERS is a readonly array**

- Then FEATURE_LAYERS should be readonly

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
