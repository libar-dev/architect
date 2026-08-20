import {
  createDefaultTagRegistry,
  type ExtractedPattern,
  type PatternGraph,
} from '@libar-dev/architect-core';

export type PipelineInput =
  | { kind: 'patterns'; data: readonly ExtractedPattern[] }
  | { kind: 'scalar'; data: unknown };

export interface OutputModifiers {
  full?: boolean;
  count?: boolean;
  namesOnly?: boolean;
  fields?: readonly string[];
}

export interface ListFilters {
  status?: string;
  role?: string;
  limit?: number;
  offset?: number;
}

export const DEFAULT_OUTPUT_MODIFIERS: OutputModifiers = {};
export const DEFAULT_LIST_FILTERS: ListFilters = {};

const ALLOWED_FIELDS = new Set(['name', 'patternName', 'status', 'role', 'phase', 'filePath']);
const ROLE_LOOKUP = buildRoleLookup();

function buildRoleLookup(): ReadonlyMap<string, string> {
  const roleLookup = new Map<string, string>();

  for (const role of createDefaultTagRegistry().roles) {
    roleLookup.set(role.tag.toLowerCase(), role.tag);
    for (const alias of role.aliases ?? []) {
      roleLookup.set(alias.toLowerCase(), role.tag);
    }
  }

  return roleLookup;
}

function canonicalizeRole(role: string | undefined): string | undefined {
  if (!role) {
    return undefined;
  }

  return ROLE_LOOKUP.get(role.toLowerCase()) ?? role.toLowerCase();
}

export function checkOutputModifiers(modifiers: OutputModifiers): void {
  const conflicts: string[] = [];
  if (modifiers.full && modifiers.namesOnly) {
    conflicts.push('full cannot be combined with namesOnly');
  }
  if (modifiers.full && modifiers.count) {
    conflicts.push('full cannot be combined with count');
  }
  if (modifiers.full && modifiers.fields && modifiers.fields.length > 0) {
    conflicts.push('full cannot be combined with fields');
  }
  if (conflicts.length > 0) {
    throw new Error(`Conflicting modifiers: ${conflicts.join('; ')}`);
  }

  const invalidFields: string[] = [];
  for (const field of modifiers.fields?.map((value) => value.trim()) ?? []) {
    if (!ALLOWED_FIELDS.has(field)) {
      invalidFields.push(field);
    }
  }

  if (invalidFields.length > 0) {
    throw new Error(`Invalid field names: ${invalidFields.join(', ')}`);
  }
}

export function stripEmpty<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined && item !== '') as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, current] of Object.entries(value as Record<string, unknown>)) {
      if (current === null || current === undefined || current === '') continue;
      if (Array.isArray(current) && current.length === 0) continue;
      if (
        typeof current === 'object' &&
        !Array.isArray(current) &&
        Object.keys(current).length === 0
      )
        continue;
      out[key] = stripEmpty(current);
    }
    return out as T;
  }
  return value;
}

function summarizePattern(pattern: ExtractedPattern): Record<string, unknown> {
  return {
    patternName: pattern.name,
    name: pattern.name,
    status: pattern.status,
    role: pattern.role ?? 'uncategorized',
    filePath: pattern.source.file,
  };
}

function toOutputRecord(pattern: ExtractedPattern): Record<string, unknown> {
  return {
    ...pattern,
    filePath: pattern.source.file,
  };
}

export function applyOutputPipeline(input: PipelineInput, modifiers: OutputModifiers): unknown {
  checkOutputModifiers(modifiers);
  if (input.kind === 'scalar') return input.data;
  const patterns = input.data;
  if (modifiers.count) return patterns.length;
  const items: Record<string, unknown>[] = modifiers.full
    ? patterns.map(toOutputRecord)
    : patterns.map(summarizePattern);
  if (modifiers.namesOnly) return patterns.map((pattern) => pattern.name);
  if (modifiers.fields && modifiers.fields.length > 0) {
    const normalizedFields = modifiers.fields.map((field) => field.trim());
    return items.map((item) => {
      const picked: Record<string, unknown> = {};
      for (const field of normalizedFields) picked[field] = item[field];
      return picked;
    });
  }
  return items;
}

export function applyListFilters(dataset: PatternGraph, filters: ListFilters): ExtractedPattern[] {
  let results = [...dataset.patterns];
  if (filters.status) results = results.filter((p) => p.status === filters.status);
  if (filters.role) {
    const requestedRole = canonicalizeRole(filters.role);
    results = results.filter((p) => canonicalizeRole(p.role ?? 'uncategorized') === requestedRole);
  }
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? results.length;
  return results.slice(offset, offset + limit);
}
