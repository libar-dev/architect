/**
 * @libar-docs
 * @libar-docs-extractor
 * @libar-docs-pattern LayerInference
 * @libar-docs-status completed
 * @libar-docs-used-by GherkinExtractor
 *
 * ## LayerInference - Directory-Based Feature Classification
 *
 * Infers feature file layer (timeline, domain, integration, e2e, component)
 * from directory path patterns. Enables filtering without explicit annotations.
 *
 * ### When to Use
 *
 * - When filtering scenarios by testing layer
 * - When generating layer-specific documentation
 * - When calculating test coverage by layer
 */

/**
 * Feature layer classification based on directory structure
 *
 * @remarks
 * Layers represent different testing contexts and documentation purposes:
 * - `timeline`: Process documentation features (roadmap, milestones)
 * - `domain`: Pure domain logic tests (deciders, command handlers)
 * - `integration`: Full-stack integration tests with real backend
 * - `e2e`: Browser-based end-to-end user journey tests
 * - `component`: Tooling/infrastructure component tests
 * - `unknown`: Unclassified features (fallback)
 */
export type FeatureLayer = "timeline" | "domain" | "integration" | "e2e" | "component" | "unknown";

/**
 * All valid feature layers as a readonly array
 *
 * @remarks
 * Useful for validation and schema definitions
 */
export const FEATURE_LAYERS: readonly FeatureLayer[] = [
  "timeline",
  "domain",
  "integration",
  "e2e",
  "component",
  "unknown",
] as const;

/**
 * Infer feature layer from file path
 *
 * Uses directory structure patterns to classify feature files:
 * - `/timeline/` → timeline (process documentation)
 * - `/deciders/` → domain (pure domain logic)
 * - `/orders/`, `/inventory/` (not integration) → domain
 * - `/integration-features/`, `/integration/` → integration
 * - `/e2e/` → e2e (browser-based tests)
 * - `/scanner/`, `/lint/` → component (tooling tests)
 *
 * @param filePath - Absolute or relative path to feature file
 * @returns Inferred layer based on directory patterns
 *
 * @example
 * ```typescript
 * inferFeatureLayer('tests/features/timeline/phase-01.feature');
 * // Returns: 'timeline'
 *
 * inferFeatureLayer('tests/features/deciders/order.decider.feature');
 * // Returns: 'domain'
 *
 * inferFeatureLayer('tests/integration-features/orders/flow.feature');
 * // Returns: 'integration'
 * ```
 */
export function inferFeatureLayer(filePath: string): FeatureLayer {
  // Normalize path for cross-platform consistency
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");

  // Timeline features (process documentation)
  if (normalizedPath.includes("/timeline/")) {
    return "timeline";
  }

  // Decider features (pure domain logic)
  if (normalizedPath.includes("/deciders/")) {
    return "domain";
  }

  // Domain features (command handlers, but not integration tests)
  // Check for integration FIRST to avoid false positives
  const isIntegration =
    normalizedPath.includes("/integration-features/") || normalizedPath.includes("/integration/");

  if (!isIntegration) {
    if (normalizedPath.includes("/orders/") || normalizedPath.includes("/inventory/")) {
      return "domain";
    }
  }

  // Integration features
  if (isIntegration) {
    return "integration";
  }

  // E2E features (browser-based tests)
  if (normalizedPath.includes("/e2e/")) {
    return "e2e";
  }

  // Component features (tooling tests)
  if (normalizedPath.includes("/scanner/") || normalizedPath.includes("/lint/")) {
    return "component";
  }

  // Unknown - fallback for unclassified features
  return "unknown";
}
