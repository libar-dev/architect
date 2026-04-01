/**
 * @architect
 * @architect-pattern ReferenceDocumentCodec
 * @architect-status active
 * @architect-implements CodecDrivenReferenceGeneration
 * @architect-convention codec-registry
 * @architect-product-area:Generation
 *
 * ## ReferenceDocumentCodec
 *
 * A single codec factory that creates reference document codecs from
 * configuration objects. Convention content is sourced from
 * decision records tagged with @architect-convention.
 *
 * **Purpose:** Scoped reference documentation assembling four content layers (conventions, diagrams, shapes, behaviors) into a single document.
 *
 * **Output Files:** Configured per-instance (e.g., `docs/REFERENCE-SAMPLE.md`, `_claude-md/architecture/reference-sample.md`)
 *
 * ### 4-Layer Composition (in order)
 *
 * 1. **Convention content** -- Extracted from `@architect-convention`-tagged patterns (rules, invariants, tables)
 * 2. **Scoped diagrams** -- Mermaid diagrams filtered by `archContext`, `archLayer`, `patterns`, or `include` tags
 * 3. **TypeScript shapes** -- API surfaces from `shapeSelectors` (declaration-level filtering)
 * 4. **Behavior content** -- Gherkin-sourced patterns from `behaviorCategories`
 *
 * ### Key Options (ReferenceDocConfig)
 *
 * | Option | Type | Description |
 * | --- | --- | --- |
 * | conventionTags | string[] | Convention tag values to extract from decision records |
 * | diagramScopes | DiagramScope[] | Multiple diagrams |
 * | shapeSelectors | ShapeSelector[] | Fine-grained declaration-level shape filtering |
 * | behaviorCategories | string[] | Category tags for behavior pattern content |
 * | includeTags | string[] | Cross-cutting content routing via include tags |
 * | preamble | SectionBlock[] | Static editorial sections prepended before generated content |
 * | productArea | string | Pre-filter all content sources to matching product area |
 * | excludeSourcePaths | string[] | Exclude patterns by source path prefix |
 *
 * ### DiagramScope.diagramType Values
 *
 * | Type | Description |
 * | --- | --- |
 * | graph (default) | Flowchart with subgraphs by archContext, custom node shapes |
 * | sequenceDiagram | Sequence diagram with typed messages between participants |
 * | stateDiagram-v2 | State diagram with transitions from dependsOn relationships |
 * | C4Context | C4 context diagram with boundaries, systems, and relationships |
 * | classDiagram | Class diagram with archRole stereotypes and typed arrows |
 *
 * ### ShapeSelector Variants
 *
 * | Variant | Example | Behavior |
 * | --- | --- | --- |
 * | group only | `{ group: "api-types" }` | Match shapes by group tag |
 * | source + names | `{ source: "src/types.ts", names: ["Config"] }` | Named shapes from file |
 * | source only | `{ source: "src/path/*.ts" }` | All tagged shapes from glob |
 *
 * ### When to Use
 *
 * - When generating reference documentation from convention-tagged decisions
 * - When creating scoped product area documents with live diagrams
 * - When creating both detailed (docs/) and summary (_claude-md/) outputs
 * - When assembling multi-layer documents that combine conventions, diagrams, shapes, and behaviors
 *
 * ### Factory Pattern
 *
 * ```typescript
 * const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
 * const doc = codec.decode(dataset);
 * ```
 */

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  list,
  document,
} from '../schema.js';
import {
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
  createDecodeOnlyCodec,
} from './types/base.js';
import { extractConventions, extractConventionsFromPatterns } from './convention-extractor.js';
import { filterShapesBySelectors } from './shape-matcher.js';
import type { ExtractedShape } from '../../validation-schemas/extracted-shape.js';

// Re-export all types so existing consumers continue to work without changes
export type {
  DiagramSource,
  DiagramScope,
  ReferenceDocConfig,
  ProductAreaMeta,
  ReferenceCodecOptions,
} from './reference-types.js';
export { DIAGRAM_SOURCE_VALUES } from './reference-types.js';
export {
  PRODUCT_AREA_ARCH_CONTEXT_MAP,
  PRODUCT_AREA_META,
  PRODUCT_AREA_KEYS,
  isProductAreaKey,
  type ProductAreaKey,
} from './product-area-metadata.js';
export {
  buildConventionSections,
  buildBehaviorSectionsFromPatterns,
  buildBusinessRulesCompactSection,
  buildTableOfContents,
  buildShapeSections,
  buildBoundarySummary,
} from './reference-builders.js';
export {
  buildScopedDiagram,
  collectScopePatterns,
  collectNeighborPatterns,
} from './reference-diagrams.js';

// Import types we need internally (after re-exports to avoid conflict)
import type { DiagramScope, ReferenceDocConfig, ReferenceCodecOptions } from './reference-types.js';
import {
  PRODUCT_AREA_ARCH_CONTEXT_MAP,
  PRODUCT_AREA_META,
  isProductAreaKey,
} from './product-area-metadata.js';
import {
  buildConventionSections,
  buildBehaviorSectionsFromPatterns,
  buildBusinessRulesCompactSection,
  buildTableOfContents,
  buildShapeSections,
  buildBoundarySummary,
} from './reference-builders.js';
import { buildScopedDiagram } from './reference-diagrams.js';

// ============================================================================
// Reference Codec Options
// ============================================================================

const DEFAULT_REFERENCE_OPTIONS: Required<ReferenceCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  detailLevel: 'standard',
};

// ============================================================================
// Codec Factory
// ============================================================================

/**
 * Creates a reference document codec from configuration.
 *
 * The codec composes a RenderableDocument from up to four sources:
 * 1. Convention content from convention-tagged decision records
 * 2. Scoped relationship diagram (if diagramScopes configured)
 * 3. TypeScript shapes from selector-matched patterns
 * 4. Behavior content from category-tagged patterns
 *
 * @param config - Reference document configuration
 * @param options - Codec options including DetailLevel
 */
export function createReferenceCodec(
  config: ReferenceDocConfig,
  options?: ReferenceCodecOptions
): DocumentCodec {
  const opts = mergeOptions(DEFAULT_REFERENCE_OPTIONS, options);

  return createDecodeOnlyCodec(({ dataset }) => {
    const sections: SectionBlock[] = [];

    // Product area filtering: when set, pre-filter and auto-derive content sources
    // Preamble is applied inside decodeProductArea() — not here, to avoid dead code
    if (config.productArea !== undefined) {
      return decodeProductArea(dataset, config, opts);
    }

    // DD-1 (CrossCuttingDocumentInclusion): Pre-compute include set for additive merging
    const includeSet =
      config.includeTags !== undefined && config.includeTags.length > 0
        ? new Set(config.includeTags)
        : undefined;

    // 1. Convention content from tagged decision records
    const conventions = extractConventions(dataset, config.conventionTags ?? []);

    // DD-1: Merge include-tagged convention patterns (additive)
    if (includeSet !== undefined) {
      const existingNames = new Set(conventions.flatMap((b) => b.sourceDecisions));
      const includedConventionPatterns = dataset.patterns.filter(
        (p) =>
          !existingNames.has(p.name) &&
          p.include?.some((v) => includeSet.has(v)) === true &&
          p.convention !== undefined &&
          p.convention.length > 0
      );
      if (includedConventionPatterns.length > 0) {
        // Build bundles from included convention patterns
        const includedConventions = extractConventionsFromPatterns(includedConventionPatterns);
        conventions.push(...includedConventions);
      }
    }

    const conventionBlocks =
      conventions.length > 0 ? buildConventionSections(conventions, opts.detailLevel) : [];

    // 2. Scoped relationship diagrams
    const diagramBlocks: SectionBlock[] = [];
    if (opts.detailLevel !== 'summary') {
      const scopes: readonly DiagramScope[] = config.diagramScopes ?? [];

      for (const scope of scopes) {
        const diagramSections = buildScopedDiagram(dataset, scope);
        if (diagramSections.length > 0) {
          diagramBlocks.push(...diagramSections);
        }
      }
    }

    // 3. Shape extraction: selector-based filtering only
    const shapeBlocks: SectionBlock[] = [];
    {
      const allShapes =
        config.shapeSelectors !== undefined && config.shapeSelectors.length > 0
          ? [...filterShapesBySelectors(dataset, config.shapeSelectors)]
          : ([] as ExtractedShape[]);
      const seenNames = new Set(allShapes.map((s) => s.name));

      // DD-1: Merge include-tagged shapes (additive)
      if (includeSet !== undefined) {
        for (const pattern of dataset.patterns) {
          if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0)
            continue;
          for (const shape of pattern.extractedShapes) {
            if (
              !seenNames.has(shape.name) &&
              shape.includes?.some((v) => includeSet.has(v)) === true
            ) {
              seenNames.add(shape.name);
              allShapes.push(shape);
            }
          }
        }
      }

      if (allShapes.length > 0) {
        shapeBlocks.push(...buildShapeSections(allShapes, opts.detailLevel));
      }
    }

    // 4. Behavior content from tagged patterns
    const behaviorPatterns =
      (config.behaviorCategories ?? []).length > 0
        ? dataset.patterns.filter((p) => (config.behaviorCategories ?? []).includes(p.category))
        : [];

    // DD-1: Merge include-tagged behavior patterns (additive)
    if (includeSet !== undefined) {
      const existingNames = new Set(behaviorPatterns.map((p) => p.name));
      const includedBehaviors = dataset.patterns.filter(
        (p) =>
          !existingNames.has(p.name) &&
          p.include?.some((v) => includeSet.has(v)) === true &&
          (p.directive.description.length > 0 || (p.rules !== undefined && p.rules.length > 0))
      );
      behaviorPatterns.push(...includedBehaviors);
    }

    const behaviorBlocks =
      behaviorPatterns.length > 0
        ? buildBehaviorSectionsFromPatterns(behaviorPatterns, opts.detailLevel)
        : [];

    // Static preamble: editorial sections before generated content
    if (config.preamble !== undefined && config.preamble.length > 0) {
      sections.push(...config.preamble);
      sections.push(separator());
    }

    // DD-4 (GeneratedDocQuality): Assemble in configured order
    if (config.shapesFirst === true) {
      sections.push(...shapeBlocks, ...conventionBlocks, ...diagramBlocks, ...behaviorBlocks);
    } else {
      sections.push(...conventionBlocks, ...diagramBlocks, ...shapeBlocks, ...behaviorBlocks);
    }

    if (sections.length === 0) {
      const diagnostics: string[] = [];
      if ((config.conventionTags ?? []).length > 0) {
        diagnostics.push(`conventions [${(config.conventionTags ?? []).join(', ')}]`);
      }
      if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
        diagnostics.push(`selectors [${config.shapeSelectors.length} selectors]`);
      }
      if ((config.behaviorCategories ?? []).length > 0) {
        diagnostics.push(`behaviors [${(config.behaviorCategories ?? []).join(', ')}]`);
      }
      if (includeSet !== undefined) {
        diagnostics.push(`includeTags [${[...includeSet].join(', ')}]`);
      }
      sections.push(paragraph(`No content found. Sources checked: ${diagnostics.join('; ')}.`));
    }

    return document(config.title, sections, {
      purpose: `Reference document: ${config.title}`,
      detailLevel: opts.detailLevel === 'summary' ? 'Compact summary' : 'Full reference',
    });
  });
}

// ============================================================================
// Product Area Decode Path
// ============================================================================

/**
 * Decode a product-area-scoped reference document.
 *
 * When `config.productArea` is set, this function replaces the standard decode
 * path. It pre-filters all patterns by product area and auto-derives content
 * sources from the filtered set rather than relying on explicit config arrays.
 *
 * Document structure:
 * 1. Intro (reader question + coverage from ADR-001 metadata)
 * 2. Invariant rules from executable specs (conventions + behavior rules)
 * 3. Architecture diagrams (auto-scoped via productArea→archContext mapping)
 * 4. Key API types (shapes from TypeScript patterns in this area)
 * 5. Behavior specifications (all patterns with rules/descriptions)
 */
function decodeProductArea(
  dataset: MasterDataset,
  config: ReferenceDocConfig,
  opts: Required<ReferenceCodecOptions>
): RenderableDocument {
  const area = config.productArea;
  if (area === undefined || !isProductAreaKey(area)) {
    return document('Error', [paragraph('No product area specified.')], {});
  }
  const sections: SectionBlock[] = [];

  // Static preamble: editorial sections before generated content
  if (config.preamble !== undefined && config.preamble.length > 0) {
    sections.push(...config.preamble);
    sections.push(separator());
  }

  // Pre-computed view: O(1) lookup instead of linear filter
  const areaPatterns = dataset.byProductArea[area] ?? [];

  // Collect TypeScript patterns by explicit archContext tag (for shapes + diagrams)
  // Note: archIndex.byContext includes inferred contexts — use explicit filter to match only tagged patterns
  const archContexts = PRODUCT_AREA_ARCH_CONTEXT_MAP[area];
  const contextSet = new Set(archContexts);
  const tsPatterns =
    contextSet.size > 0
      ? dataset.patterns.filter((p) => p.archContext !== undefined && contextSet.has(p.archContext))
      : [];

  // 1. Intro section from ADR-001 metadata with key invariants
  const meta = PRODUCT_AREA_META[area];
  sections.push(paragraph(`**${meta.question}** ${meta.intro}`));

  if (meta.introSections !== undefined && opts.detailLevel === 'detailed') {
    sections.push(...meta.introSections);
  }

  if (meta.keyInvariants.length > 0) {
    sections.push(heading(2, 'Key Invariants'));
    sections.push(list([...meta.keyInvariants]));
  }
  sections.push(separator());

  // 2. Convention/invariant content from area patterns with convention tags
  const conventionPatterns = areaPatterns.filter(
    (p) => p.convention !== undefined && p.convention.length > 0
  );
  if (conventionPatterns.length > 0) {
    const conventions = extractConventionsFromPatterns(conventionPatterns);
    if (conventions.length > 0) {
      sections.push(...buildConventionSections(conventions, opts.detailLevel));
    }
  }

  // 3. Architecture diagrams — priority: config > meta > auto-generate
  if (opts.detailLevel !== 'summary') {
    const scopes: readonly DiagramScope[] = config.diagramScopes ?? meta.diagramScopes ?? [];

    if (scopes.length > 0) {
      // Explicit scopes from config or meta — always render
      for (const scope of scopes) {
        const diagramSections = buildScopedDiagram(dataset, scope);
        if (diagramSections.length > 0) {
          sections.push(...diagramSections);
        }
      }
    } else if (archContexts.length > 0) {
      // Auto-generate fallback — only when archContext mappings exist
      const autoScope: DiagramScope = {
        archContext: archContexts,
        direction: 'TB',
        title: `${area} Components`,
      };
      const diagramSections = buildScopedDiagram(dataset, autoScope);
      if (diagramSections.length > 0) {
        sections.push(...diagramSections);
      }
    }
  } else {
    // Compact boundary summary for summary-level documents (replaces diagrams)
    const scopes: readonly DiagramScope[] = config.diagramScopes ?? meta.diagramScopes ?? [];
    const summary = buildBoundarySummary(dataset, scopes);
    if (summary !== undefined) {
      sections.push(summary);
    }
  }

  // 4. Shapes from TypeScript patterns in this product area
  {
    const allShapes: ExtractedShape[] = [];
    const seenNames = new Set<string>();
    const seenPatternNames = new Set<string>();

    // Collect shapes from all patterns associated with this area
    for (const pattern of [...areaPatterns, ...tsPatterns]) {
      if (seenPatternNames.has(pattern.name)) continue;
      seenPatternNames.add(pattern.name);
      if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0) continue;
      for (const shape of pattern.extractedShapes) {
        if (!seenNames.has(shape.name)) {
          seenNames.add(shape.name);
          allShapes.push(shape);
        }
      }
    }

    if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
      for (const shape of filterShapesBySelectors(dataset, config.shapeSelectors)) {
        if (!seenNames.has(shape.name)) {
          seenNames.add(shape.name);
          allShapes.push(shape);
        }
      }
    }

    if (allShapes.length > 0) {
      // Prioritize interfaces and types over functions/variables to keep
      // product area docs focused on key API types, not implementation details.
      const kindOrder: Readonly<Record<string, number>> = {
        interface: 0,
        type: 1,
        enum: 2,
        function: 3,
        const: 4,
      };
      const sorted = [...allShapes].sort(
        (a, b) => (kindOrder[a.kind] ?? 5) - (kindOrder[b.kind] ?? 5)
      );
      const maxShapes = opts.detailLevel === 'detailed' ? 30 : 20;
      const limited = sorted.slice(0, maxShapes);
      sections.push(...buildShapeSections(limited, opts.detailLevel));
    }
  }

  // 5. Compact business rules index (replaces verbose Behavior Specifications)
  // Shows only rule name, invariant, and rationale per rule in tables
  const rulesPatterns = areaPatterns.filter(
    (p) =>
      (config.excludeSourcePaths === undefined ||
        config.excludeSourcePaths.length === 0 ||
        !config.excludeSourcePaths.some((prefix) => p.source.file.startsWith(prefix))) &&
      p.rules !== undefined &&
      p.rules.length > 0
  );
  if (rulesPatterns.length > 0) {
    sections.push(...buildBusinessRulesCompactSection(rulesPatterns, opts.detailLevel));
  }

  // DD-4 (GeneratedDocQuality): Insert TOC after intro for large product area docs
  const tocBlocks = buildTableOfContents(sections);
  if (tocBlocks.length > 0) {
    const firstSepIdx = sections.findIndex((s) => s.type === 'separator');
    if (firstSepIdx >= 0) {
      sections.splice(firstSepIdx + 1, 0, ...tocBlocks);
    }
  }

  if (sections.length === 0) {
    sections.push(
      paragraph(
        `No content found for product area "${area}". ` +
          `Checked ${areaPatterns.length} patterns by productArea tag, ` +
          `${tsPatterns.length} patterns by archContext [${archContexts.join(', ')}].`
      )
    );
  }

  return document(config.title, sections, {
    purpose: `${area} product area overview`,
    detailLevel: opts.detailLevel === 'summary' ? 'Compact summary' : 'Full reference',
  });
}
