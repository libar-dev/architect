/**
 * Shared formatting utilities used across renderers and projection support code.
 *
 * Centralised here to avoid quadruplication. All functions are pure and
 * free of domain-specific imports, so there is no risk of cyclic dependencies.
 */

export function humanizeKey(value: string): string {
  return value
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortValue(entry)]),
  );
}

export function stableStringify(value: unknown, indent?: number): string {
  return JSON.stringify(sortValue(value), null, indent);
}
