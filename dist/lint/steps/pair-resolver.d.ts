/**
 * Resolves feature-to-step file pairs by extracting loadFeature() paths
 * from step definition files.
 */
import type { LintViolation } from '../../validation-schemas/lint.js';
import type { FeatureStepPair } from './types.js';
/**
 * Extract the feature file path from a loadFeature() call in step file content.
 *
 * Supports two patterns:
 * 1. Simple string: loadFeature('tests/features/path/name.feature')
 * 2. resolve(): loadFeature(resolve(__dirname, '../../../features/path/name.feature'))
 *
 * Returns null if no loadFeature call found or path is not extractable.
 */
export declare function extractFeaturePath(stepFileContent: string): string | null;
/**
 * Resolve feature<->step file pairs from a list of step files.
 *
 * For each .steps.ts file, extracts the loadFeature() path and resolves
 * it to an absolute path relative to baseDir.
 *
 * Returns pairs and any warnings (e.g., unparseable loadFeature calls).
 */
export declare function resolveFeatureStepPairs(stepFiles: readonly string[], baseDir: string): {
    readonly pairs: readonly FeatureStepPair[];
    readonly warnings: readonly LintViolation[];
};
//# sourceMappingURL=pair-resolver.d.ts.map