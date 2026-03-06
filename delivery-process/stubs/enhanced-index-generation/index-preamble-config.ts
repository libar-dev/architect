/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements EnhancedIndexGeneration
 * @libar-docs-target delivery-process.config.ts
 *
 * ## Index Preamble Configuration — DD-3, DD-4 Decisions
 *
 * **Decision DD-3 (Audience paths: preamble vs annotation-derived):** Use full
 * preamble for audience reading paths. The reading order within each audience
 * profile is editorial judgment — "read this third because it builds on concepts
 * from document two" cannot be computed from pattern metadata.
 *
 * **Rationale (DD-3):** The three audience profiles (New User, Developer/AI,
 * Team Lead/CI) and their curated reading sequences are the most-cited
 * navigation aid in the existing manual INDEX.md. Each reading path is a
 * deliberate pedagogical ordering: foundational concepts first, then
 * architecture, then workflow, then enforcement. No annotation can express
 * "this document builds on the mental model established by reading METHODOLOGY
 * before ARCHITECTURE." The preamble mechanism is designed precisely for this
 * case — editorial content that changes at authorial cadence, not code cadence.
 *
 * **Decision DD-4 (Key concepts: annotation-derived vs preamble):** Use preamble
 * for the key concepts glossary. Pattern descriptions are too granular and
 * technical to serve as glossary definitions for a navigation document.
 *
 * **Rationale (DD-4):** A glossary entry for "Delivery Workflow FSM" needs a
 * reader-friendly 2-sentence explanation plus an ASCII state diagram. Pattern
 * descriptions are structured for MasterDataset consumers (codecs, API queries),
 * not for human onboarding. Attempting to derive glossary content from pattern
 * metadata would produce entries like "FSM enforcement, pre-commit hooks" —
 * accurate but unhelpful for someone encountering the concept for the first
 * time. A future `@libar-docs-glossary` annotation type could solve this, but
 * it would require a new scanner capability and extraction pipeline. The
 * preamble approach works today with zero new infrastructure.
 *
 * **Decision DD-2 (Merge manual + generated listings):** Document entries are
 * configured statically in `documentEntries`, not discovered at generation time.
 * The codec is pure (no filesystem I/O) and deterministic.
 *
 * **Rationale (DD-2):** Filesystem discovery at generation time would couple
 * the codec to the filesystem, break deterministic testing, and require
 * heuristics to extract titles/descriptions from markdown files. The existing
 * docs are a stable, slowly-changing set (~14 manual docs + ~30 generated).
 * When a document is added or renamed, updating the config entry is trivial
 * and happens at the same time as the document creation. This is the same
 * pattern used by `PRODUCT_AREA_META` in reference.ts — manually curated
 * metadata for a stable set of entities.
 *
 * ### Preamble Structure
 *
 * The preamble composes four editorial sections as `SectionBlock[]`:
 *
 * | Section | SectionBlock Types | Source |
 * |---------|-------------------|--------|
 * | Quick Navigation | heading + table | "If you want X, read Y" lookup |
 * | Reading Order: New User | heading + paragraph + list | 3-step onboarding path |
 * | Reading Order: Developer/AI | heading + paragraph + list | 5-step deep-dive path |
 * | Reading Order: Team Lead/CI | heading + paragraph + list | 2-step governance path |
 * | Document Roles Matrix | heading + table | Audience x Document x Focus |
 * | Key Concepts | heading + paragraphs | Glossary definitions |
 *
 * ### Config Integration
 *
 * This preamble is provided via `CodecOptions` in delivery-process.config.ts:
 *
 * ```typescript
 * // In delivery-process.config.ts (future)
 * export default defineConfig({
 *   // ... existing config ...
 *   codecOptions: {
 *     index: {
 *       preamble: INDEX_PREAMBLE_SECTIONS,
 *       documentEntries: INDEX_DOCUMENT_ENTRIES,
 *     },
 *   },
 * });
 * ```
 *
 * Alternatively, the preamble could be passed via generatorOverrides
 * with a custom codec options mechanism, following the pattern used by
 * `pr-changes` codec options (changedFiles passed at runtime).
 */

import type { SectionBlock } from '../../src/renderable/schema.js';
import type { DocumentEntry } from './index-codec-options.js';

// ---------------------------------------------------------------------------
// Example Preamble Sections
// ---------------------------------------------------------------------------

/**
 * Quick navigation table — "If you want X, read Y" lookup.
 *
 * This is the highest-value section of the index. Users scan this first
 * to find the document relevant to their immediate need.
 */
export const QUICK_NAVIGATION_SECTIONS: readonly SectionBlock[] = [
  {
    type: 'heading' as const,
    level: 2,
    text: 'Quick Navigation',
  },
  {
    type: 'table' as const,
    headers: ['If you want to...', 'Read this'],
    rows: [
      ['Get started quickly', '[README.md](../README.md)'],
      ['Configure presets and tags', '[CONFIGURATION.md](docs/CONFIGURATION.md)'],
      ['Understand the "why"', '[METHODOLOGY.md](docs/METHODOLOGY.md)'],
      ['Learn the architecture', '[ARCHITECTURE.md](docs/ARCHITECTURE.md)'],
      ['Run AI coding sessions', '[SESSION-GUIDES.md](docs/SESSION-GUIDES.md)'],
      ['Write Gherkin specs', '[GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md)'],
      ['Enforce delivery process rules', '[PROCESS-GUARD.md](docs/PROCESS-GUARD.md)'],
      ['Validate annotation quality', '[VALIDATION.md](docs/VALIDATION.md)'],
      ['Query process state via CLI', '[PROCESS-API.md](docs/PROCESS-API.md)'],
      ['Browse product area overviews', '[PRODUCT-AREAS.md](docs-live/PRODUCT-AREAS.md)'],
      ['Review architecture decisions', '[DECISIONS.md](docs-live/DECISIONS.md)'],
      ['Check business rules', '[BUSINESS-RULES.md](docs-live/BUSINESS-RULES.md)'],
    ],
  },
];

/**
 * Audience reading paths — curated sequences for three reader profiles.
 *
 * DD-3: These are full preamble sections because reading order is
 * editorial judgment, not computable from metadata.
 */
export const READING_ORDER_SECTIONS: readonly SectionBlock[] = [
  {
    type: 'heading' as const,
    level: 2,
    text: 'Reading Order',
  },

  // --- New User Path ---
  {
    type: 'heading' as const,
    level: 3,
    text: 'For New Users',
  },
  {
    type: 'paragraph' as const,
    text: [
      '1. **[README.md](../README.md)** -- Installation, quick start, Data API CLI overview',
      '2. **[CONFIGURATION.md](docs/CONFIGURATION.md)** -- Presets, tag prefixes, config files',
      '3. **[METHODOLOGY.md](docs/METHODOLOGY.md)** -- Core thesis, dual-source architecture',
    ].join('\n'),
  },

  // --- Developer / AI Path ---
  {
    type: 'heading' as const,
    level: 3,
    text: 'For Developers / AI',
  },
  {
    type: 'paragraph' as const,
    text: [
      '4. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** -- Four-stage pipeline, codecs, MasterDataset',
      '5. **[PROCESS-API.md](docs/PROCESS-API.md)** -- Data API CLI query interface',
      '6. **[SESSION-GUIDES.md](docs/SESSION-GUIDES.md)** -- Planning/Design/Implementation workflows',
      '7. **[GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md)** -- Writing effective Gherkin specs',
      '8. **[ANNOTATION-GUIDE.md](docs/ANNOTATION-GUIDE.md)** -- Annotation mechanics, shape extraction',
    ].join('\n'),
  },

  // --- Team Lead / CI Path ---
  {
    type: 'heading' as const,
    level: 3,
    text: 'For Team Leads / CI',
  },
  {
    type: 'paragraph' as const,
    text: [
      '9. **[PROCESS-GUARD.md](docs/PROCESS-GUARD.md)** -- FSM enforcement, pre-commit hooks',
      '10. **[VALIDATION.md](docs/VALIDATION.md)** -- Lint rules, DoD checks, anti-patterns',
    ].join('\n'),
  },
];

/**
 * Document roles matrix — Audience x Document x Focus.
 *
 * Maps each document to its primary audience and focus area.
 * This section helps readers who know their role find all relevant docs.
 */
export const DOCUMENT_ROLES_SECTIONS: readonly SectionBlock[] = [
  {
    type: 'heading' as const,
    level: 2,
    text: 'Document Roles',
  },
  {
    type: 'table' as const,
    headers: ['Document', 'Audience', 'Focus'],
    rows: [
      ['README.md', 'Everyone', 'Quick start, value proposition'],
      ['METHODOLOGY.md', 'Everyone', 'Why -- core thesis, principles'],
      ['CONFIGURATION.md', 'Users', 'Setup -- presets, tags, config'],
      ['ARCHITECTURE.md', 'Developers', 'How -- pipeline, codecs, schemas'],
      ['PROCESS-API.md', 'AI/Devs', 'Data API CLI query interface'],
      ['SESSION-GUIDES.md', 'AI/Devs', 'Workflow -- day-to-day usage'],
      ['GHERKIN-PATTERNS.md', 'Writers', 'Specs -- writing effective Gherkin'],
      ['PROCESS-GUARD.md', 'Team Leads', 'Governance -- enforcement rules'],
      ['VALIDATION.md', 'CI/CD', 'Quality -- automated checks'],
      ['TAXONOMY.md', 'Reference', 'Lookup -- tag taxonomy and API'],
      ['ANNOTATION-GUIDE.md', 'Developers', 'Reference -- annotation mechanics'],
      ['PUBLISHING.md', 'Maintainers', 'Release -- npm publishing'],
      ['PRODUCT-AREAS.md', 'Everyone', 'Generated -- product area overviews'],
      ['DECISIONS.md', 'Developers', 'Generated -- architecture decisions'],
      ['BUSINESS-RULES.md', 'Developers', 'Generated -- business rules and invariants'],
    ],
  },
];

/**
 * Key concepts glossary — reader-friendly definitions.
 *
 * DD-4: Full preamble, not annotation-derived. Pattern descriptions
 * are too granular for glossary use.
 */
export const KEY_CONCEPTS_SECTIONS: readonly SectionBlock[] = [
  {
    type: 'heading' as const,
    level: 2,
    text: 'Key Concepts',
  },
  {
    type: 'paragraph' as const,
    text: [
      '**Delivery Process** -- A code-first documentation and workflow toolkit. Extracts patterns from annotated TypeScript and Gherkin sources, generates markdown documentation, and validates delivery workflow via pre-commit hooks.',
      '',
      '**Pattern** -- An annotated unit of work tracked by the delivery process. Each pattern has a status (roadmap, active, completed, deferred), belongs to a product area, and has deliverables. Patterns are the atomic unit of the MasterDataset.',
      '',
      '**MasterDataset** -- The single read model (ADR-006) containing all extracted patterns with pre-computed views (byProductArea, byPhase, byStatus, byCategory). All codecs and the Data API consume this dataset. No consumer re-derives data from raw scanner output.',
      '',
      '**Codec** -- A Zod-based transformer that decodes MasterDataset into a RenderableDocument. Each codec produces a specific document type (e.g., PatternsDocumentCodec produces PATTERNS.md). Codecs are pure functions with no I/O.',
      '',
      '**Dual-Source Architecture** -- Feature files own planning metadata (status, phase, dependencies). TypeScript files own implementation metadata (uses, used-by, category). This split prevents ownership conflicts and enables independent annotation cadences.',
      '',
      '**Delivery Workflow FSM** -- A finite state machine enforcing pattern lifecycle: roadmap -> active -> completed. Transitions are validated by Process Guard at commit time. The FSM prevents scope creep (no adding deliverables to active specs) and ensures completion integrity.',
    ].join('\n'),
  },
];

/**
 * Complete preamble for the IndexCodec.
 *
 * Composes all editorial sections in display order:
 * 1. Quick Navigation (highest-value lookup table)
 * 2. Reading Order (audience-specific paths)
 * 3. Document Roles (audience x document matrix)
 * 4. Key Concepts (glossary)
 */
export const INDEX_PREAMBLE_SECTIONS: readonly SectionBlock[] = [
  ...QUICK_NAVIGATION_SECTIONS,
  { type: 'separator' as const },
  ...READING_ORDER_SECTIONS,
  { type: 'separator' as const },
  ...DOCUMENT_ROLES_SECTIONS,
  { type: 'separator' as const },
  ...KEY_CONCEPTS_SECTIONS,
];

// ---------------------------------------------------------------------------
// Example Document Entries (DD-2: static config, not filesystem discovery)
// ---------------------------------------------------------------------------

/**
 * Document entries for the unified inventory.
 *
 * DD-2: Configured statically. The codec does not discover files at
 * generation time. When documents are added or renamed, this list
 * is updated alongside the document change.
 *
 * Documents are organized by topic, not by source directory.
 * The reader sees one unified set of documentation.
 */
export const INDEX_DOCUMENT_ENTRIES: readonly DocumentEntry[] = [
  // --- Getting Started ---
  {
    title: 'README',
    path: 'README.md',
    description: 'Installation, quick start, value proposition',
    audience: 'Everyone',
    topic: 'Getting Started',
  },
  {
    title: 'Configuration',
    path: 'docs/CONFIGURATION.md',
    description: 'Presets, tag prefixes, config files',
    audience: 'Users',
    topic: 'Getting Started',
  },
  {
    title: 'Methodology',
    path: 'docs/METHODOLOGY.md',
    description: 'Core thesis, dual-source architecture principles',
    audience: 'Everyone',
    topic: 'Getting Started',
  },

  // --- Architecture ---
  {
    title: 'Architecture',
    path: 'docs/ARCHITECTURE.md',
    description: 'Four-stage pipeline, codecs, MasterDataset, schemas',
    audience: 'Developers',
    topic: 'Architecture',
  },
  {
    title: 'Product Areas',
    path: 'docs-live/PRODUCT-AREAS.md',
    description: 'Product area overviews with live statistics and diagrams',
    audience: 'Everyone',
    topic: 'Architecture',
  },
  {
    title: 'Architecture Decisions',
    path: 'docs-live/DECISIONS.md',
    description: 'ADRs extracted from decision specs',
    audience: 'Developers',
    topic: 'Architecture',
  },

  // --- Development Workflow ---
  {
    title: 'Session Guides',
    path: 'docs/SESSION-GUIDES.md',
    description: 'Planning, Design, Implementation session workflows',
    audience: 'AI/Devs',
    topic: 'Development Workflow',
  },
  {
    title: 'Process API',
    path: 'docs/PROCESS-API.md',
    description: 'Data API CLI query interface for session context',
    audience: 'AI/Devs',
    topic: 'Development Workflow',
  },

  // --- Authoring ---
  {
    title: 'Gherkin Patterns',
    path: 'docs/GHERKIN-PATTERNS.md',
    description: 'Writing effective Gherkin specs, Rule blocks, DataTables',
    audience: 'Writers',
    topic: 'Authoring',
  },
  {
    title: 'Annotation Guide',
    path: 'docs/ANNOTATION-GUIDE.md',
    description: 'Annotation mechanics, shape extraction, tag reference',
    audience: 'Developers',
    topic: 'Authoring',
  },
  {
    title: 'Taxonomy',
    path: 'docs/TAXONOMY.md',
    description: 'Tag taxonomy structure and format types',
    audience: 'Reference',
    topic: 'Authoring',
  },

  // --- Governance ---
  {
    title: 'Process Guard',
    path: 'docs/PROCESS-GUARD.md',
    description: 'FSM enforcement, pre-commit hooks, error codes',
    audience: 'Team Leads',
    topic: 'Governance',
  },
  {
    title: 'Validation',
    path: 'docs/VALIDATION.md',
    description: 'Lint rules, DoD checks, anti-pattern detection',
    audience: 'CI/CD',
    topic: 'Governance',
  },
  {
    title: 'Business Rules',
    path: 'docs-live/BUSINESS-RULES.md',
    description: 'Business rules and invariants extracted from specs',
    audience: 'Developers',
    topic: 'Governance',
  },

  // --- Operations ---
  {
    title: 'Publishing',
    path: 'docs/PUBLISHING.md',
    description: 'npm publishing workflow, versioning, CI setup',
    audience: 'Maintainers',
    topic: 'Operations',
  },
];

export function _indexPreambleConfigPlaceholder(): never {
  throw new Error('EnhancedIndexGeneration not yet implemented - roadmap pattern');
}
