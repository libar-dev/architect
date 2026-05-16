import type { GeneratorSourceOverride, ResolvedSourcesConfig } from './project-config.js';

export function mergeSourcesForGenerator(
  base: ResolvedSourcesConfig,
  generatorName: string,
  overrides: Readonly<Record<string, GeneratorSourceOverride>>
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
