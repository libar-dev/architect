/**
 * @architect
 * @architect-pattern SourceMerge
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:configuration
 *
 * ## SourceMerge - Per-Generator Source Override Merging
 *
 * Merges per-generator source overrides into the resolved sources config.
 * Exports `mergeSourcesForGenerator`, which layers a named generator's
 * additional TypeScript inputs, additional features, or wholesale feature
 * replacement onto the base resolved sources, preserving the shared exclude set.
 */
import type { GeneratorSourceOverride, ResolvedSourcesConfig } from './project-config.js';

export function mergeSourcesForGenerator(
  base: ResolvedSourcesConfig,
  generatorName: string,
  overrides: Readonly<Record<string, GeneratorSourceOverride>>,
): ResolvedSourcesConfig {
  const override = overrides[generatorName];

  if (override === undefined) {
    return base;
  }

  const typescript: readonly string[] =
    override.additionalInput !== undefined && override.additionalInput.length > 0
      ? [...base.typescript, ...override.additionalInput]
      : base.typescript;

  if (override.replaceFeatures !== undefined && override.replaceFeatures.length > 0) {
    return { typescript, features: override.replaceFeatures, exclude: base.exclude };
  }

  const features: readonly string[] = [...base.features, ...(override.additionalFeatures ?? [])];
  return { typescript, features, exclude: base.exclude };
}
