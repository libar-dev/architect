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
export type FeatureLayer = 'timeline' | 'domain' | 'integration' | 'e2e' | 'component' | 'unknown';
/**
 * All valid feature layers as a readonly array
 *
 * @remarks
 * Useful for validation and schema definitions
 */
export declare const FEATURE_LAYERS: readonly FeatureLayer[];
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
export declare function inferFeatureLayer(filePath: string): FeatureLayer;
//# sourceMappingURL=layer-inference.d.ts.map