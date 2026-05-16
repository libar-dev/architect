/**
 * @architect
 * @architect-pattern LayerInference
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:extractor
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
export type FeatureLayer = 'timeline' | 'domain' | 'integration' | 'e2e' | 'component' | 'unknown';

export const FEATURE_LAYERS: readonly FeatureLayer[] = [
  'timeline',
  'domain',
  'integration',
  'e2e',
  'component',
  'unknown',
] as const;

export function inferFeatureLayer(filePath: string): FeatureLayer {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');

  if (normalizedPath.includes('/timeline/')) return 'timeline';
  if (normalizedPath.includes('/deciders/')) return 'domain';

  const isIntegration =
    normalizedPath.includes('/integration-features/') || normalizedPath.includes('/integration/');

  if (!isIntegration) {
    if (normalizedPath.includes('/orders/') || normalizedPath.includes('/inventory/')) {
      return 'domain';
    }
  }

  if (isIntegration) return 'integration';
  if (normalizedPath.includes('/e2e/')) return 'e2e';
  if (normalizedPath.includes('/scanner/') || normalizedPath.includes('/lint/')) return 'component';

  return 'unknown';
}
