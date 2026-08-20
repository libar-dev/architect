/**
 * @architect
 * @architect-pattern SlugCanonicalization
 * @architect-status completed
 * @architect-role:utility
 * @architect-bounded-context:rendering
 */
export function slugForRouteSegment(value: string): string {
  const segment = slugForFilename(value);

  if (segment.length === 0) {
    throw new Error(`Cannot create a stable route segment from: ${value}`);
  }

  return segment;
}

export function slugForFilename(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugForAnchor(value: string): string {
  return slugForFilename(value);
}
