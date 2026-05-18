export const KNOWN_TRANSFORM_NAMES = ['padAdr', 'stripQuotes'] as const;

export type KnownTransformName = (typeof KNOWN_TRANSFORM_NAMES)[number];

const METADATA_TRANSFORMS = {
  padAdr: (value: string): string => value.padStart(3, '0'),
  stripQuotes: (value: string): string => value.replace(/^["']|["']$/g, ''),
} as const satisfies Record<KnownTransformName, (value: string) => string>;

export function applyKnownTransform(
  transformName: KnownTransformName | undefined,
  value: string,
): string {
  if (transformName === undefined) {
    return value;
  }

  return METADATA_TRANSFORMS[transformName](value);
}
