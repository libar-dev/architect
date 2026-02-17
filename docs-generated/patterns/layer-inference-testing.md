# ✅ Layer Inference Testing

**Purpose:** Detailed documentation for the Layer Inference Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

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

## Business Rules

**Timeline layer is detected from /timeline/ directory segments**

**Invariant:** Any feature file path containing a /timeline/ directory segment is classified as timeline layer.
    **Verified by:** Detect timeline features from /timeline/ path, Detect timeline features regardless of parent directories, Detect timeline features in delivery-process package

_Verified by: Detect timeline features from /timeline/ path, Detect timeline features regardless of parent directories, Detect timeline features in delivery-process package_

**Domain layer is detected from business context directory segments**

**Invariant:** Feature files in /deciders/, /orders/, or /inventory/ directories are classified as domain layer.
    **Verified by:** Detect decider features as domain, Detect orders features as domain, Detect inventory features as domain

_Verified by: Detect decider features as domain, Detect orders features as domain, Detect inventory features as domain_

**Integration layer is detected and takes priority over domain directories**

**Invariant:** Paths containing /integration-features/ or /integration/ are classified as integration, even when they also contain domain directory names.
    **Verified by:** Detect integration-features directory as integration, Detect /integration/ directory as integration, Integration takes priority over orders subdirectory, Integration takes priority over inventory subdirectory

_Verified by: Detect integration-features directory as integration, Detect /integration/ directory as integration, Integration takes priority over orders subdirectory, Integration takes priority over inventory subdirectory_

**E2E layer is detected from /e2e/ directory segments**

**Invariant:** Any feature file path containing an /e2e/ directory segment is classified as e2e layer.
    **Verified by:** Detect e2e features from /e2e/ path, Detect e2e features in frontend app, Detect e2e-journeys as e2e

_Verified by: Detect e2e features from /e2e/ path, Detect e2e features in frontend app, Detect e2e-journeys as e2e_

**Component layer is detected from tool-specific directory segments**

**Invariant:** Feature files in /scanner/ or /lint/ directories are classified as component layer.
    **Verified by:** Detect scanner features as component, Detect lint features as component

_Verified by: Detect scanner features as component, Detect lint features as component_

**Unknown layer is the fallback for unclassified paths**

**Invariant:** Any feature file path that does not match a known layer pattern is classified as unknown.
    **Verified by:** Return unknown for unclassified paths, Return unknown for root-level features, Return unknown for generic test paths

_Verified by: Return unknown for unclassified paths, Return unknown for root-level features, Return unknown for generic test paths_

**Path normalization handles cross-platform and case differences**

**Invariant:** Layer inference produces correct results regardless of path separators, case, or absolute vs relative paths.
    **Verified by:** Handle Windows-style paths with backslashes, Be case-insensitive, Handle mixed path separators, Handle absolute Unix paths, Handle Windows absolute paths, Timeline in filename only should not match, Timeline detected even with deep nesting

_Verified by: Handle Windows-style paths with backslashes, Be case-insensitive, Handle mixed path separators, Handle absolute Unix paths, Handle Windows absolute paths, Timeline in filename only should not match, Timeline detected even with deep nesting_

**FEATURE_LAYERS constant provides validated layer enumeration**

**Invariant:** FEATURE_LAYERS is a readonly array containing exactly all 6 valid layer values.
    **Verified by:** FEATURE_LAYERS contains all valid layer values, FEATURE_LAYERS has exactly 6 layers, FEATURE_LAYERS is a readonly array

_Verified by: FEATURE_LAYERS contains all valid layer values, FEATURE_LAYERS has exactly 6 layers, FEATURE_LAYERS is a readonly array_

---

[← Back to Pattern Registry](../PATTERNS.md)
