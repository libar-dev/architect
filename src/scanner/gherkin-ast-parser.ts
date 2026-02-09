/**
 * @libar-docs
 * @libar-docs-scanner
 * @libar-docs-pattern GherkinASTParser
 * @libar-docs-status completed
 * @libar-docs-implements GherkinRulesSupport
 * @libar-docs-uses GherkinTypes
 * @libar-docs-used-by GherkinScanner
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context scanner
 * @libar-docs-arch-layer infrastructure
 *
 * ## GherkinASTParser - Parse Feature Files Using Cucumber Gherkin
 *
 * Parses Gherkin feature files using @cucumber/gherkin and extracts structured data
 * including feature metadata, tags, scenarios, and steps.
 *
 * ### Supported Formats
 *
 * - **Classic Gherkin** (`.feature`) - Standard Gherkin syntax
 * - **MDG - Markdown with Gherkin** (`.feature.md`) - Rich Markdown with embedded Gherkin
 *
 * MDG files use Markdown headers for keywords (`# Feature:`, `## Scenario:`) and
 * list items for steps (`* Given`, `* When`, `* Then`). They render beautifully
 * in GitHub while remaining parseable for documentation generation.
 *
 * ### Rule Keyword Support
 *
 * Both formats support the Gherkin v6+ `Rule:` keyword for grouping scenarios
 * under business rules. Scenarios inside Rules are extracted with a synthetic
 * `rule:Rule-Name` tag for traceability.
 *
 * ### When to Use
 *
 * - When parsing Gherkin .feature files for pattern extraction
 * - When parsing MDG .feature.md files for PRD generation
 * - When converting acceptance criteria to documentation
 * - When building multi-source documentation pipelines
 */

import {
  Parser,
  AstBuilder,
  GherkinClassicTokenMatcher,
  GherkinInMarkdownTokenMatcher,
} from '@cucumber/gherkin';
import * as Messages from '@cucumber/messages';
import {
  GherkinFeatureSchema,
  GherkinScenarioSchema,
  GherkinBackgroundSchema,
  GherkinRuleSchema,
  type GherkinFeature,
  type GherkinScenario,
  type GherkinFileError,
  type GherkinBackground,
  type GherkinStep,
  type GherkinDataTable,
  type GherkinDataTableRow,
  type GherkinRule,
  type GherkinExamples,
} from '../validation-schemas/feature.js';
import type { Result } from '../types/index.js';
import { Result as R } from '../types/index.js';
import {
  PROCESS_STATUS_VALUES,
  ADR_STATUS_VALUES,
  HIERARCHY_LEVELS,
  type ProcessStatusValue,
  type AdrStatusValue,
  type HierarchyLevel,
} from '../taxonomy/index.js';
import { createRegexBuilders } from '../config/regex-builders.js';
import { createDefaultTagRegistry, type TagRegistry } from '../validation-schemas/tag-registry.js';

/**
 * Default regex builders for tag normalization.
 * Uses the default registry configuration.
 */
const DEFAULT_BUILDERS = (() => {
  const registry = createDefaultTagRegistry();
  return createRegexBuilders(registry.tagPrefix, registry.fileOptInTag);
})();

/**
 * Normalize a Gherkin tag by stripping prefixes
 *
 * Removes `@` prefix and then the configured tag prefix (from registry)
 * to produce a canonical tag name.
 *
 * @param tag - Tag string to normalize (e.g., "@libar-docs-pattern:MyPattern")
 * @param registry - Optional TagRegistry for custom prefix configuration
 * @returns Normalized tag name (e.g., "pattern:MyPattern")
 *
 * @example
 * normalizeTag("@libar-docs-pattern:MyPattern") // "pattern:MyPattern"
 * normalizeTag("@acceptance-criteria")          // "acceptance-criteria"
 *
 * // With custom registry
 * const registry = { tagPrefix: "@docs-", fileOptInTag: "@docs", ... };
 * normalizeTag("@docs-pattern:MyPattern", registry) // "pattern:MyPattern"
 */
function normalizeTag(tag: string, registry?: TagRegistry): string {
  // Use registry-based builders if provided, otherwise use defaults
  const builders = registry
    ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
    : DEFAULT_BUILDERS;

  // Normalize using the registry-configured prefix
  let normalized = builders.normalizeTag(tag);

  // Strip @ prefix if still present after normalization
  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }

  return normalized;
}

/**
 * Result of parsing a single feature file
 */
export interface ParsedFeatureFile {
  readonly feature: GherkinFeature;
  readonly background?: GherkinBackground;
  /** Rules with their nested scenarios (Gherkin v6+) */
  readonly rules?: readonly GherkinRule[];
  /** All scenarios (including those flattened from Rules for backward compat) */
  readonly scenarios: readonly GherkinScenario[];
}

/**
 * Extract a DataTable from a Cucumber Messages DataTable
 *
 * Converts the Cucumber AST DataTable format to our simplified structure
 * with headers and row objects.
 *
 * @param dataTable - Cucumber Messages DataTable
 * @returns GherkinDataTable with headers and rows
 */
function extractDataTable(dataTable: Messages.DataTable): GherkinDataTable {
  const rows = dataTable.rows;
  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  // First row is headers
  const headerRow = rows[0];
  const headers = headerRow?.cells.map((cell) => cell.value) ?? [];

  // Remaining rows are data
  const dataRows: GherkinDataTableRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rowObj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const cell = row.cells[j];
      if (header !== undefined) {
        rowObj[header] = cell?.value ?? '';
      }
    }
    dataRows.push(rowObj);
  }

  return { headers, rows: dataRows };
}

/**
 * Extract steps from Cucumber AST steps, including DataTables and DocStrings
 *
 * @param steps - Cucumber AST steps
 * @returns Array of GherkinStep with optional dataTable and docString
 */
function extractSteps(steps: readonly Messages.Step[]): GherkinStep[] {
  return steps.map((step) => {
    const gherkinStep: GherkinStep = {
      keyword: step.keyword.trim(),
      text: step.text,
      ...(step.dataTable && { dataTable: extractDataTable(step.dataTable) }),
      ...(step.docString && {
        docString: {
          content: step.docString.content,
          ...(step.docString.mediaType && { mediaType: step.docString.mediaType }),
        },
      }),
    };
    return gherkinStep;
  });
}

/**
 * Extract Examples tables from a Scenario Outline
 *
 * Converts Cucumber AST Examples tables to our simplified structure with
 * headers and row objects. Each Examples block can have its own name and tags.
 *
 * @param examples - Cucumber AST Examples array from a Scenario Outline
 * @param registry - Optional TagRegistry for tag normalization
 * @returns Array of GherkinExamples with headers and rows
 */
function extractExamples(
  examples: readonly Messages.Examples[],
  registry?: TagRegistry
): GherkinExamples[] {
  return examples
    .filter((ex) => ex.tableHeader) // Only process examples with valid headers
    .map((ex) => {
      // Extract headers from tableHeader
      const headers = ex.tableHeader?.cells.map((c) => c.value) ?? [];

      // Extract rows as header->value maps
      const rows: GherkinDataTableRow[] = ex.tableBody.map((row) => {
        const rowObj: Record<string, string> = {};
        headers.forEach((h, i) => {
          rowObj[h] = row.cells[i]?.value ?? '';
        });
        return rowObj;
      });

      const desc = ex.description.trim();

      return {
        name: ex.name,
        ...(desc && { description: desc }),
        tags: ex.tags.map((t) => normalizeTag(t.name, registry)),
        headers,
        rows,
        line: ex.location.line,
      };
    });
}

/**
 * Parse a Gherkin feature file and extract structured data
 *
 * @param content - Feature file content
 * @param filePath - Path to the feature file (for error reporting)
 * @returns Result containing parsed feature data or error
 *
 * @example
 * ```typescript
 * const content = `
 * @pattern:MyPattern @phase:15 @status:roadmap
 * Feature: My Pattern
 *   A description of the pattern.
 *
 *   @acceptance-criteria
 *   Scenario: Happy path
 *     Given initial state
 *     When action occurs
 *     Then outcome happens
 * `;
 *
 * const result = parseFeatureFile(content, 'my-pattern.feature');
 * if (result.ok) {
 *   const { feature, scenarios } = result.value;
 *   console.log(feature.name); // "My Pattern"
 *   console.log(feature.tags); // ["pattern:MyPattern", "phase:15", "status:roadmap"]
 *   console.log(scenarios.length); // 1
 * }
 * ```
 */
export function parseFeatureFile(
  content: string,
  filePath: string
): Result<ParsedFeatureFile, GherkinFileError> {
  try {
    // Detect MDG (Markdown with Gherkin) format based on file extension
    // MDG files use .feature.md extension and require GherkinInMarkdownTokenMatcher
    const isMDG = filePath.endsWith('.feature.md');
    const tokenMatcher = isMDG
      ? new GherkinInMarkdownTokenMatcher()
      : new GherkinClassicTokenMatcher();

    const parser = new Parser(new AstBuilder(Messages.IdGenerator.uuid()), tokenMatcher);

    const gherkinDocument = parser.parse(content);

    if (!gherkinDocument.feature) {
      return R.err({
        file: filePath,
        error: {
          message: 'No feature found in file',
        },
      });
    }

    const cucumberFeature = gherkinDocument.feature;

    // Extract feature-level data
    const feature: GherkinFeature = {
      name: cucumberFeature.name,
      description: cucumberFeature.description.trim(),
      tags: cucumberFeature.tags.map((tag) => normalizeTag(tag.name)),
      language: cucumberFeature.language,
      line: cucumberFeature.location.line,
    };

    // Extract background (if present)
    let background: GherkinBackground | undefined;

    // Extract rules (Gherkin v6+ business rule groupings)
    const rules: GherkinRule[] = [];

    // Extract scenarios (including those nested inside Rules for backward compat)
    const scenarios: GherkinScenario[] = [];

    for (const child of cucumberFeature.children) {
      // Handle Background section
      if (child.background) {
        const bg = child.background;
        const desc = bg.description.trim();
        background = {
          name: bg.name,
          // Use spread to conditionally include description (exactOptionalPropertyTypes)
          ...(desc && { description: desc }),
          steps: extractSteps(bg.steps),
          line: bg.location.line,
        };
      }
      // Handle Scenario (at feature level)
      else if (child.scenario) {
        const scenario = child.scenario;
        const examples = extractExamples(scenario.examples);
        scenarios.push({
          name: scenario.name,
          description: scenario.description.trim(),
          tags: scenario.tags.map((tag) => normalizeTag(tag.name)),
          steps: extractSteps(scenario.steps),
          ...(examples.length > 0 && { examples }),
          line: scenario.location.line,
        });
      }
      // Handle Rule keyword (Gherkin v6+) - capture as first-class entity
      // Rules group scenarios under business rules with rich descriptions
      else if (child.rule) {
        const cucumberRule = child.rule;
        const ruleTags = cucumberRule.tags.map((tag) => normalizeTag(tag.name));
        const ruleScenarios: GherkinScenario[] = [];

        // Extract scenarios nested inside the Rule
        for (const ruleChild of cucumberRule.children) {
          if (ruleChild.scenario) {
            const scenario = ruleChild.scenario;
            const scenarioTags = scenario.tags.map((tag) => normalizeTag(tag.name));
            const examples = extractExamples(scenario.examples);

            const parsedScenario: GherkinScenario = {
              name: scenario.name,
              description: scenario.description.trim(),
              tags: scenarioTags,
              steps: extractSteps(scenario.steps),
              ...(examples.length > 0 && { examples }),
              line: scenario.location.line,
            };

            // Add to rule's scenarios
            ruleScenarios.push(parsedScenario);

            // Also add to flat scenarios for backward compat
            // Include rule context in scenario tags for traceability
            const ruleNameTag = `rule:${cucumberRule.name.replace(/\s+/g, '-')}`;
            scenarios.push({
              ...parsedScenario,
              // Merge rule tags with scenario tags, add rule context
              tags: [...ruleTags, ...scenarioTags, ruleNameTag],
            });
          }
          // Handle Background inside Rule
          else if (ruleChild.background && !background) {
            const bg = ruleChild.background;
            const desc = bg.description.trim();
            background = {
              name: bg.name,
              ...(desc && { description: desc }),
              steps: extractSteps(bg.steps),
              line: bg.location.line,
            };
          }
        }

        // Add the rule with its scenarios
        rules.push({
          name: cucumberRule.name,
          description: cucumberRule.description.trim(),
          tags: ruleTags,
          scenarios: ruleScenarios,
          line: cucumberRule.location.line,
        });
      }
    }

    // Validate parsed data against schemas (schema-first enforcement)
    const featureValidation = GherkinFeatureSchema.safeParse(feature);
    if (!featureValidation.success) {
      return R.err({
        file: filePath,
        error: {
          message: `Feature validation failed: ${featureValidation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
          line: feature.line,
        },
      });
    }

    // Validate background if present
    if (background) {
      const backgroundValidation = GherkinBackgroundSchema.safeParse(background);
      if (!backgroundValidation.success) {
        return R.err({
          file: filePath,
          error: {
            message: `Background validation failed: ${backgroundValidation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
            line: background.line,
          },
        });
      }
    }

    // Validate scenarios
    for (const scenario of scenarios) {
      const scenarioValidation = GherkinScenarioSchema.safeParse(scenario);
      if (!scenarioValidation.success) {
        return R.err({
          file: filePath,
          error: {
            message: `Scenario "${scenario.name}" validation failed: ${scenarioValidation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
            line: scenario.line,
          },
        });
      }
    }

    // Validate rules
    for (const rule of rules) {
      const ruleValidation = GherkinRuleSchema.safeParse(rule);
      if (!ruleValidation.success) {
        return R.err({
          file: filePath,
          error: {
            message: `Rule "${rule.name}" validation failed: ${ruleValidation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
            line: rule.line,
          },
        });
      }
    }

    return R.ok({
      feature: featureValidation.data,
      ...(background && { background }),
      ...(rules.length > 0 && { rules }),
      scenarios,
    });
  } catch (error) {
    // Handle Gherkin parse errors
    if (error !== null && typeof error === 'object' && 'errors' in error) {
      const gherkinError = error as {
        errors: Array<{ message: string; location?: { line: number; column: number } }>;
      };
      const firstError = gherkinError.errors[0];

      const errorObj: GherkinFileError = {
        file: filePath,
        error: {
          message: firstError?.message ?? 'Unknown Gherkin parse error',
          ...(firstError?.location?.line !== undefined && { line: firstError.location.line }),
          ...(firstError?.location?.column !== undefined && { column: firstError.location.column }),
        },
      };

      return R.err(errorObj);
    }

    // Handle other errors
    return R.err({
      file: filePath,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

/**
 * Extract pattern-related tags from feature tags
 *
 * Maps Gherkin tags like @pattern:Name, @phase:15, @status:roadmap
 * to pattern metadata.
 *
 * @param tags - Array of tag strings (without @ prefix)
 * @returns Object with pattern metadata
 *
 * @example
 * ```typescript
 * const tags = ["pattern:MyPattern", "phase:15", "status:roadmap", "depends-on:OtherPattern"];
 * const metadata = extractPatternTags(tags);
 * // {
 * //   pattern: "MyPattern",
 * //   phase: 15,
 * //   status: "roadmap",
 * //   dependsOn: ["OtherPattern"]
 * // }
 * ```
 */
export function extractPatternTags(tags: readonly string[]): {
  readonly pattern?: string;
  readonly phase?: number;
  readonly release?: string;
  readonly status?: ProcessStatusValue;
  readonly dependsOn?: readonly string[];
  readonly enables?: readonly string[];
  // UML-inspired relationship tags (PatternRelationshipModel)
  readonly implementsPatterns?: readonly string[];
  readonly extendsPattern?: string;
  // Cross-reference and API navigation tags (PatternRelationshipModel enhancement)
  readonly seeAlso?: readonly string[];
  readonly apiRef?: readonly string[];
  readonly brief?: string;
  readonly categories?: readonly string[];
  readonly quarter?: string;
  readonly completed?: string;
  readonly effort?: string;
  readonly team?: string;
  readonly workflow?: string;
  readonly risk?: string;
  readonly priority?: string;
  readonly productArea?: string;
  readonly userRole?: string;
  readonly businessValue?: string;
  readonly level?: HierarchyLevel;
  readonly parent?: string;
  readonly title?: string;
  readonly behaviorFile?: string;
  readonly discoveredGaps?: readonly string[];
  readonly discoveredImprovements?: readonly string[];
  readonly discoveredRisks?: readonly string[];
  readonly discoveredLearnings?: readonly string[];
  readonly constraints?: readonly string[];
  readonly adr?: string;
  readonly adrStatus?: AdrStatusValue;
  readonly adrCategory?: string;
  readonly adrSupersedes?: string;
  readonly adrSupersededBy?: string;
  // Design session stub metadata
  readonly target?: string;
  readonly since?: string;
} {
  const metadata: {
    pattern?: string;
    phase?: number;
    release?: string;
    status?: ProcessStatusValue;
    dependsOn?: string[];
    enables?: string[];
    // UML-inspired relationship tags (PatternRelationshipModel)
    implementsPatterns?: string[];
    extendsPattern?: string;
    // Cross-reference and API navigation tags (PatternRelationshipModel enhancement)
    seeAlso?: string[];
    apiRef?: string[];
    brief?: string;
    categories?: string[];
    quarter?: string;
    completed?: string;
    effort?: string;
    team?: string;
    workflow?: string;
    risk?: string;
    priority?: string;
    productArea?: string;
    userRole?: string;
    businessValue?: string;
    level?: HierarchyLevel;
    parent?: string;
    title?: string;
    behaviorFile?: string;
    discoveredGaps?: string[];
    discoveredImprovements?: string[];
    discoveredRisks?: string[];
    discoveredLearnings?: string[];
    constraints?: string[];
    adr?: string;
    adrStatus?: AdrStatusValue;
    adrCategory?: string;
    adrSupersedes?: string;
    adrSupersededBy?: string;
    // Design session stub metadata
    target?: string;
    since?: string;
  } = {};

  for (const tag of tags) {
    // Normalize tag (strips @ and configured prefix like @libar-docs-)
    const normalized = normalizeTag(tag);

    // @pattern:Name
    if (normalized.startsWith('pattern:')) {
      metadata.pattern = normalized.substring(8);
    }
    // @phase:N
    else if (normalized.startsWith('phase:')) {
      const phaseNum = parseInt(normalized.substring(6), 10);
      if (!isNaN(phaseNum)) {
        metadata.phase = phaseNum;
      }
    }
    // @release:v0.1.0 or @release:vNEXT
    else if (normalized.startsWith('release:')) {
      metadata.release = normalized.substring(8);
    }
    // @status:roadmap|active|completed|deferred (per PDR-005 FSM, from taxonomy)
    else if (normalized.startsWith('status:')) {
      const status = normalized.substring(7);
      if ((PROCESS_STATUS_VALUES as readonly string[]).includes(status)) {
        metadata.status = status as (typeof PROCESS_STATUS_VALUES)[number];
      }
    }
    // @depends-on:Pattern
    else if (normalized.startsWith('depends-on:')) {
      const deps = normalized
        .substring(11)
        .split(',')
        .map((s) => s.trim());
      metadata.dependsOn = [...(metadata.dependsOn ?? []), ...deps];
    }
    // @enables:Pattern
    else if (normalized.startsWith('enables:')) {
      const enables = normalized
        .substring(8)
        .split(',')
        .map((s) => s.trim());
      metadata.enables = [...(metadata.enables ?? []), ...enables];
    }
    // @implements:Pattern1,Pattern2 (UML-inspired realization relationship)
    else if (normalized.startsWith('implements:')) {
      const impl = normalized
        .substring(11)
        .split(',')
        .map((s) => s.trim());
      metadata.implementsPatterns = [...(metadata.implementsPatterns ?? []), ...impl];
    }
    // @extends:BasePattern (UML-inspired generalization relationship)
    else if (normalized.startsWith('extends:')) {
      metadata.extendsPattern = normalized.substring(8);
    }
    // @see-also:Pattern1,Pattern2 (cross-reference without dependency)
    else if (normalized.startsWith('see-also:')) {
      const related = normalized
        .substring(9)
        .split(',')
        .map((s) => s.trim());
      metadata.seeAlso = [...(metadata.seeAlso ?? []), ...related];
    }
    // @api-ref:path/to/file.ts,another/file.ts (implementation API paths)
    else if (normalized.startsWith('api-ref:')) {
      const refs = normalized
        .substring(8)
        .split(',')
        .map((s) => s.trim());
      metadata.apiRef = [...(metadata.apiRef ?? []), ...refs];
    }
    // @brief:path
    else if (normalized.startsWith('brief:')) {
      metadata.brief = normalized.substring(6);
    }
    // @quarter:Q4-2024
    else if (normalized.startsWith('quarter:')) {
      metadata.quarter = normalized.substring(8);
    }
    // @completed:2024-12-15
    else if (normalized.startsWith('completed:')) {
      metadata.completed = normalized.substring(10);
    }
    // @effort:4w
    else if (normalized.startsWith('effort:')) {
      metadata.effort = normalized.substring(7);
    }
    // @team:platform
    else if (normalized.startsWith('team:')) {
      metadata.team = normalized.substring(5);
    }
    // @workflow:implementation
    else if (normalized.startsWith('workflow:')) {
      metadata.workflow = normalized.substring(9);
    }
    // @risk:medium
    else if (normalized.startsWith('risk:')) {
      metadata.risk = normalized.substring(5);
    }
    // @priority:high
    else if (normalized.startsWith('priority:')) {
      metadata.priority = normalized.substring(9);
    }
    // @product-area:Generators
    else if (normalized.startsWith('product-area:')) {
      metadata.productArea = normalized.substring(13);
    }
    // @user-role:Developer
    else if (normalized.startsWith('user-role:')) {
      metadata.userRole = normalized.substring(10);
    }
    // @business-value:Transform-features...
    else if (normalized.startsWith('business-value:')) {
      // Business value may use hyphens for spaces - convert back for display
      metadata.businessValue = normalized.substring(15).replace(/-/g, ' ');
    }
    // @level:epic|phase|task (from taxonomy)
    else if (normalized.startsWith('level:')) {
      const level = normalized.substring(6);
      if ((HIERARCHY_LEVELS as readonly string[]).includes(level)) {
        metadata.level = level as HierarchyLevel;
      }
    }
    // @parent:ParentPatternName
    else if (normalized.startsWith('parent:')) {
      metadata.parent = normalized.substring(7);
    }
    // @title:"Human Readable Title" - supports quoted values for titles with spaces
    else if (normalized.startsWith('title:')) {
      const value = normalized.substring(6);
      // Remove surrounding quotes if present
      metadata.title = value.replace(/^["']|["']$/g, '');
    }
    // @behavior-file:path/to/file.feature
    else if (normalized.startsWith('behavior-file:')) {
      metadata.behaviorFile = normalized.substring(14);
    }
    // @discovered-gap:Value
    else if (normalized.startsWith('discovered-gap:')) {
      const value = normalized.substring(15).replace(/-/g, ' ');
      metadata.discoveredGaps = [...(metadata.discoveredGaps ?? []), value];
    }
    // @discovered-improvement:Value
    else if (normalized.startsWith('discovered-improvement:')) {
      const value = normalized.substring(23).replace(/-/g, ' ');
      metadata.discoveredImprovements = [...(metadata.discoveredImprovements ?? []), value];
    }
    // @discovered-risk:Value
    else if (normalized.startsWith('discovered-risk:')) {
      const value = normalized.substring(16).replace(/-/g, ' ');
      metadata.discoveredRisks = [...(metadata.discoveredRisks ?? []), value];
    }
    // @discovered-learning:Value
    else if (normalized.startsWith('discovered-learning:')) {
      const value = normalized.substring(20).replace(/-/g, ' ');
      metadata.discoveredLearnings = [...(metadata.discoveredLearnings ?? []), value];
    }
    // @constraint:Value
    else if (normalized.startsWith('constraint:')) {
      const value = normalized.substring(11).replace(/-/g, ' ');
      metadata.constraints = [...(metadata.constraints ?? []), value];
    }
    // @libar-docs-adr:001 or @adr:001 (ADR number)
    else if (normalized.startsWith('adr:')) {
      // Pad to 3 digits for consistent formatting (e.g., "1" -> "001")
      metadata.adr = normalized.substring(4).padStart(3, '0');
    }
    // @libar-docs-adr-status:accepted or @adr-status:accepted (from taxonomy)
    else if (normalized.startsWith('adr-status:')) {
      const status = normalized.substring(11);
      if ((ADR_STATUS_VALUES as readonly string[]).includes(status)) {
        metadata.adrStatus = status as AdrStatusValue;
      }
    }
    // @libar-docs-adr-category:process or @adr-category:process
    else if (normalized.startsWith('adr-category:')) {
      metadata.adrCategory = normalized.substring(13);
    }
    // @libar-docs-adr-supersedes:001 or @adr-supersedes:001
    else if (normalized.startsWith('adr-supersedes:')) {
      metadata.adrSupersedes = normalized.substring(15).padStart(3, '0');
    }
    // @libar-docs-adr-superseded-by:005 or @adr-superseded-by:005
    else if (normalized.startsWith('adr-superseded-by:')) {
      metadata.adrSupersededBy = normalized.substring(18).padStart(3, '0');
    }
    // @libar-docs-target:src/api/stub-resolver.ts
    else if (normalized.startsWith('target:')) {
      metadata.target = normalized.substring(7);
    }
    // @libar-docs-since:DS-A
    else if (normalized.startsWith('since:')) {
      metadata.since = normalized.substring(6);
    }
    // Category tags: @ddd, @core, @event-sourcing, etc.
    // These don't have a colon, so treat them as category tags
    // Skip "libar-docs" (the bare opt-in marker) - it's not a domain category
    else if (
      !normalized.includes(':') &&
      !normalized.startsWith('acceptance-criteria') &&
      !normalized.startsWith('happy-path') &&
      normalized !== 'libar-docs'
    ) {
      metadata.categories = [...(metadata.categories ?? []), normalized];
    }
  }

  return metadata;
}
