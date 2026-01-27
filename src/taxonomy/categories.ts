/**
 * Category definitions for DDD/ES/CQRS domain taxonomy
 *
 * Categories are used to classify patterns and organize documentation.
 * Priority determines display order (lower = higher priority).
 */
export interface CategoryDefinition {
  readonly tag: string;
  readonly domain: string;
  readonly priority: number;
  readonly description: string;
  readonly aliases: readonly string[];
}

/**
 * All category definitions for the monorepo
 */
export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    tag: 'domain',
    domain: 'Strategic DDD',
    priority: 1,
    description: 'Bounded contexts, aggregates, strategic design',
    aliases: [],
  },
  {
    tag: 'ddd',
    domain: 'Domain-Driven Design',
    priority: 2,
    description: 'DDD tactical patterns',
    aliases: [],
  },
  {
    tag: 'bounded-context',
    domain: 'Bounded Context',
    priority: 3,
    description: 'BC contracts and definitions',
    aliases: [],
  },
  {
    tag: 'event-sourcing',
    domain: 'Event Sourcing',
    priority: 4,
    description: 'Event store, aggregates, replay',
    aliases: ['es'],
  },
  {
    tag: 'decider',
    domain: 'Decider',
    priority: 5,
    description: 'Decider pattern',
    aliases: [],
  },
  {
    tag: 'fsm',
    domain: 'FSM',
    priority: 5,
    description: 'Finite state machine patterns',
    aliases: [],
  },
  {
    tag: 'cqrs',
    domain: 'CQRS',
    priority: 5,
    description: 'Command/query separation',
    aliases: [],
  },
  {
    tag: 'projection',
    domain: 'Projection',
    priority: 6,
    description: 'Read models, checkpoints',
    aliases: [],
  },
  {
    tag: 'saga',
    domain: 'Saga',
    priority: 7,
    description: 'Cross-context coordination, process managers',
    aliases: ['process-manager'],
  },
  {
    tag: 'command',
    domain: 'Command',
    priority: 8,
    description: 'Command handlers, orchestration',
    aliases: [],
  },
  {
    tag: 'arch',
    domain: 'Architecture',
    priority: 9,
    description: 'Architecture patterns, decisions',
    aliases: [],
  },
  {
    tag: 'infra',
    domain: 'Infrastructure',
    priority: 10,
    description: 'Infrastructure, composition root',
    aliases: ['infrastructure'],
  },
  {
    tag: 'validation',
    domain: 'Validation',
    priority: 11,
    description: 'Input validation, schemas',
    aliases: [],
  },
  {
    tag: 'testing',
    domain: 'Testing',
    priority: 12,
    description: 'Test patterns, BDD',
    aliases: [],
  },
  {
    tag: 'performance',
    domain: 'Performance',
    priority: 13,
    description: 'Optimization, caching',
    aliases: [],
  },
  {
    tag: 'security',
    domain: 'Security',
    priority: 14,
    description: 'Auth, authorization',
    aliases: [],
  },
  {
    tag: 'core',
    domain: 'Core',
    priority: 15,
    description: 'Core utilities',
    aliases: [],
  },
  {
    tag: 'api',
    domain: 'API',
    priority: 16,
    description: 'Public APIs',
    aliases: [],
  },
  {
    tag: 'generator',
    domain: 'Generator',
    priority: 17,
    description: 'Code generators',
    aliases: [],
  },
  {
    tag: 'middleware',
    domain: 'Middleware',
    priority: 18,
    description: 'Middleware patterns',
    aliases: [],
  },
  {
    tag: 'correlation',
    domain: 'Correlation',
    priority: 19,
    description: 'Correlation tracking',
    aliases: [],
  },
] as const;

/**
 * Category tags as a union type
 */
export type CategoryTag = (typeof CATEGORIES)[number]['tag'];

/**
 * Extract all category tags as an array
 */
export const CATEGORY_TAGS = CATEGORIES.map((c) => c.tag) as readonly CategoryTag[];
