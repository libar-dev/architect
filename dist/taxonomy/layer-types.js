/**
 * Feature layer types for test organization
 *
 * Inferred from feature file directory paths:
 * - timeline: Process/workflow features (delivery-process)
 * - domain: Business domain features
 * - integration: Cross-system integration tests
 * - e2e: End-to-end user journey tests
 * - component: Unit/component level tests
 * - unknown: Cannot determine layer from path
 */
export const LAYER_TYPES = [
    'timeline',
    'domain',
    'integration',
    'e2e',
    'component',
    'unknown',
];
//# sourceMappingURL=layer-types.js.map