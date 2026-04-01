/**
 * Shared constants for architecture diagram enum values.
 *
 * Single source of truth consumed by both:
 * - registry-builder.ts (tag definition values)
 * - extracted-pattern.ts (Zod schema enums)
 *
 * @architect
 */

export const ARCH_ROLE_VALUES = [
  'bounded-context',
  'command-handler',
  'projection',
  'saga',
  'process-manager',
  'infrastructure',
  'repository',
  'decider',
  'read-model',
  'service',
] as const;

export type ArchRole = (typeof ARCH_ROLE_VALUES)[number];

export const ARCH_LAYER_VALUES = ['domain', 'application', 'infrastructure'] as const;

export type ArchLayer = (typeof ARCH_LAYER_VALUES)[number];
