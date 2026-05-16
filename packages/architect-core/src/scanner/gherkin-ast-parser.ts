/**
 * @architect
 * @architect-pattern GherkinAstParser
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:scanner
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
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
  type AcceptedStatusValue,
  type AdrStatusValue,
  type HierarchyLevel,
} from '../taxonomy/index.js';
import { createRegexBuilders } from '../config/regex-builders.js';
import {
  createDefaultTagRegistry,
  type MetadataTagDefinition,
  type TagRegistry,
} from '../validation-schemas/tag-registry.js';

const DEFAULT_BUILDERS = (() => {
  const registry = createDefaultTagRegistry();
  return createRegexBuilders(registry.tagPrefix, registry.fileOptInTag);
})();

function buildRoleLookup(roles: readonly { tag: string; aliases?: readonly string[] }[]): {
  readonly canonical: ReadonlyMap<string, string>;
  readonly aliases: ReadonlyMap<string, string>;
  readonly all: ReadonlySet<string>;
} {
  const canonical = new Map<string, string>();
  const aliases = new Map<string, string>();
  for (const role of roles) {
    canonical.set(role.tag, role.tag);
    for (const alias of role.aliases ?? []) aliases.set(alias, role.tag);
  }
  return { canonical, aliases, all: new Set([...canonical.keys(), ...aliases.keys()]) };
}

function resolveCanonicalRole(
  rawValue: string,
  lookup: ReturnType<typeof buildRoleLookup>
): string | undefined {
  if (lookup.canonical.has(rawValue)) return rawValue;
  return lookup.aliases.get(rawValue);
}

const IMPLICIT_BARE_ROLE_TAG_PATTERNS = [/^opportunity-\d+$/, /^capstone$/] as const;

function isImplicitBareRoleTag(
  rawValue: string,
  roleLookup: ReturnType<typeof buildRoleLookup>
): boolean {
  return (
    roleLookup.all.has(rawValue) ||
    IMPLICIT_BARE_ROLE_TAG_PATTERNS.some((pattern) => pattern.test(rawValue))
  );
}

function kebabToCamel(value: string): string {
  return value.replace(/-([a-z])/g, (_match: string, c: string) => c.toUpperCase());
}

function normalizeTag(tag: string, registry?: TagRegistry): string {
  const builders = registry
    ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
    : DEFAULT_BUILDERS;

  let normalized = builders.normalizeTag(tag);
  if (normalized.startsWith('@')) normalized = normalized.substring(1);
  return normalized;
}

export interface ParsedFeatureFile {
  readonly feature: GherkinFeature;
  readonly background?: GherkinBackground;
  readonly rules?: readonly GherkinRule[];
  readonly scenarios: readonly GherkinScenario[];
}

function extractDataTable(dataTable: Messages.DataTable): GherkinDataTable {
  const rows = dataTable.rows;
  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0]?.cells.map((cell) => cell.value) ?? [];
  const dataRows: GherkinDataTableRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const rowObj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const cell = row.cells[j];
      if (header !== undefined) rowObj[header] = cell?.value ?? '';
    }
    dataRows.push(rowObj);
  }
  return { headers, rows: dataRows };
}

function extractSteps(steps: readonly Messages.Step[]): GherkinStep[] {
  return steps.map((step) => ({
    keyword: step.keyword.trim(),
    text: step.text,
    ...(step.dataTable && { dataTable: extractDataTable(step.dataTable) }),
    ...(step.docString && {
      docString: {
        content: step.docString.content,
        ...(step.docString.mediaType && { mediaType: step.docString.mediaType }),
      },
    }),
  }));
}

function extractExamples(
  examples: readonly Messages.Examples[],
  registry?: TagRegistry
): GherkinExamples[] {
  return examples
    .filter((example) => example.tableHeader)
    .map((example) => {
      const headers = example.tableHeader?.cells.map((cell) => cell.value) ?? [];
      const rows: GherkinDataTableRow[] = example.tableBody.map((row) => {
        const rowObj: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObj[header] = row.cells[index]?.value ?? '';
        });
        return rowObj;
      });
      const description = example.description.trim();

      return {
        name: example.name,
        ...(description && { description }),
        tags: example.tags.map((tag) => normalizeTag(tag.name, registry)),
        headers,
        rows,
        line: example.location.line,
      };
    });
}

export function parseFeatureFile(
  content: string,
  filePath: string
): Result<ParsedFeatureFile, GherkinFileError> {
  try {
    const tokenMatcher = filePath.endsWith('.feature.md')
      ? new GherkinInMarkdownTokenMatcher()
      : new GherkinClassicTokenMatcher();
    const parser = new Parser(new AstBuilder(Messages.IdGenerator.uuid()), tokenMatcher);
    const gherkinDocument = parser.parse(content);

    if (!gherkinDocument.feature) {
      return R.err({ file: filePath, error: { message: 'No feature found in file' } });
    }

    const cucumberFeature = gherkinDocument.feature;
    const feature: GherkinFeature = {
      name: cucumberFeature.name,
      description: cucumberFeature.description.trim(),
      tags: cucumberFeature.tags.map((tag) => normalizeTag(tag.name)),
      language: cucumberFeature.language,
      line: cucumberFeature.location.line,
    };

    let background: GherkinBackground | undefined;
    const rules: GherkinRule[] = [];
    const scenarios: GherkinScenario[] = [];

    for (const child of cucumberFeature.children) {
      if (child.background) {
        const bg = child.background;
        const desc = bg.description.trim();
        background = {
          name: bg.name,
          ...(desc && { description: desc }),
          steps: extractSteps(bg.steps),
          line: bg.location.line,
        };
      } else if (child.scenario) {
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
      } else if (child.rule) {
        const cucumberRule = child.rule;
        const ruleTags = cucumberRule.tags.map((tag) => normalizeTag(tag.name));
        const ruleScenarios: GherkinScenario[] = [];

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
            ruleScenarios.push(parsedScenario);
            scenarios.push({
              ...parsedScenario,
              tags: [
                ...ruleTags,
                ...scenarioTags,
                `rule:${cucumberRule.name.replace(/\s+/g, '-')}`,
              ],
            });
          } else if (ruleChild.background && !background) {
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

        rules.push({
          name: cucumberRule.name,
          description: cucumberRule.description.trim(),
          tags: ruleTags,
          scenarios: ruleScenarios,
          line: cucumberRule.location.line,
        });
      }
    }

    const featureValidation = GherkinFeatureSchema.safeParse(feature);
    if (!featureValidation.success) {
      return R.err({
        file: filePath,
        error: {
          message: `Feature validation failed: ${featureValidation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
          line: feature.line,
        },
      });
    }

    if (background) {
      const backgroundValidation = GherkinBackgroundSchema.safeParse(background);
      if (!backgroundValidation.success) {
        return R.err({
          file: filePath,
          error: {
            message: `Background validation failed: ${backgroundValidation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
            line: background.line,
          },
        });
      }
    }

    for (const scenario of scenarios) {
      const scenarioValidation = GherkinScenarioSchema.safeParse(scenario);
      if (!scenarioValidation.success) {
        return R.err({
          file: filePath,
          error: {
            message: `Scenario "${scenario.name}" validation failed: ${scenarioValidation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
            line: scenario.line,
          },
        });
      }
    }

    for (const rule of rules) {
      const ruleValidation = GherkinRuleSchema.safeParse(rule);
      if (!ruleValidation.success) {
        return R.err({
          file: filePath,
          error: {
            message: `Rule "${rule.name}" validation failed: ${ruleValidation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
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
    if (error !== null && typeof error === 'object' && 'errors' in error) {
      const gherkinError = error as {
        errors: { message: string; location?: { line: number; column: number } }[];
      };
      const firstError = gherkinError.errors[0];
      return R.err({
        file: filePath,
        error: {
          message: firstError?.message ?? 'Unknown Gherkin parse error',
          ...(firstError?.location?.line !== undefined && { line: firstError.location.line }),
          ...(firstError?.location?.column !== undefined && { column: firstError.location.column }),
        },
      });
    }

    return R.err({
      file: filePath,
      error: { message: error instanceof Error ? error.message : String(error) },
    });
  }
}

export function recoverPatternNameFromFeatureText(
  content: string,
  registry: TagRegistry = createDefaultTagRegistry()
): string | undefined {
  const patternTagPrefix = `${registry.tagPrefix}pattern:`;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(patternTagPrefix)) continue;

    const value = trimmed.slice(patternTagPrefix.length).trim();
    return value.length > 0 ? value : undefined;
  }

  return undefined;
}

export function extractPatternTags(
  tags: readonly string[],
  registry: TagRegistry = createDefaultTagRegistry()
): {
  readonly pattern?: string;
  readonly boundedContext?: string;
  readonly phase?: number;
  readonly release?: string;
  readonly status?: AcceptedStatusValue;
  readonly unlockReason?: string;
  readonly uses?: readonly string[];
  readonly implementsPatterns?: readonly string[];
  readonly extendsPattern?: string;
  readonly seeAlso?: readonly string[];
  readonly apiRef?: readonly string[];
  readonly role?: string;
  readonly quarter?: string;
  readonly completed?: string;
  readonly effort?: string;
  readonly effortActual?: string;
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
  readonly adrTheme?: string;
  readonly adrLayer?: string;
  readonly target?: string;
  readonly since?: string;
  readonly convention?: readonly string[];
  readonly executableSpecs?: readonly string[];
  readonly roadmapSpec?: string;
  readonly archRole?: string;
  readonly _deprecatedTags?: readonly string[];
  readonly _roleTagValues?: readonly string[];
  readonly _unrecognizedRoleValues?: readonly string[];
  readonly include?: readonly string[];
  readonly usecase?: string;
  readonly [key: string]: unknown;
} {
  interface UnrecognizedEnumEntry {
    tag: string;
    value: string;
    validValues: readonly string[];
  }

  const getTransform = (
    transform: MetadataTagDefinition['transform'] | undefined
  ): ((value: string) => string) | undefined => {
    if (typeof transform !== 'function') return undefined;
    return (value: string) => {
      const result = (transform as (value: string) => unknown)(value);
      return typeof result === 'string' ? result : value;
    };
  };

  const metadata: Record<string, unknown> = {};
  const tagLookup = new Map<string, MetadataTagDefinition>(
    registry.metadataTags.map((definition) => [definition.tag, definition] as const)
  );
  const roleLookup = buildRoleLookup(registry.roles);
  const deprecatedTags: string[] = [];
  const roleTagValues: string[] = [];
  const unrecognizedRoleValues: string[] = [];
  let resolvedRole: string | undefined;

  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    const colonIdx = normalized.indexOf(':');

    if (colonIdx === -1) {
      if (
        normalized !== 'acceptance-criteria' &&
        !normalized.startsWith('happy-path') &&
        normalized !== 'architect' &&
        isImplicitBareRoleTag(normalized, roleLookup)
      ) {
        deprecatedTags.push(normalized);
      }
      continue;
    }

    const tagName = normalized.substring(0, colonIdx);
    const rawValue = normalized.substring(colonIdx + 1);
    const definition = tagLookup.get(tagName);

    if (tagName === 'role') {
      roleTagValues.push(rawValue);
      const canonicalRole = resolveCanonicalRole(rawValue, roleLookup);
      if (canonicalRole === undefined) unrecognizedRoleValues.push(rawValue);
      else resolvedRole ??= canonicalRole;
      continue;
    }

    if (tagName === 'arch-role' || tagName === 'arch-context' || tagName === 'arch-layer') {
      deprecatedTags.push(normalized);
      continue;
    }

    if (definition === undefined) continue;

    const key = definition.metadataKey ?? kebabToCamel(tagName);
    const transform = getTransform(definition.transform);

    switch (definition.format) {
      case 'number': {
        const num = parseInt(rawValue, 10);
        if (!isNaN(num)) metadata[key] = num;
        break;
      }
      case 'enum': {
        if (definition.values?.includes(rawValue) === true) {
          metadata[key] = rawValue;
        } else if (definition.values !== undefined) {
          const existing = metadata['_unrecognizedEnums'] as UnrecognizedEnumEntry[] | undefined;
          metadata['_unrecognizedEnums'] = [
            ...(existing ?? []),
            { tag: tagName, value: rawValue, validValues: definition.values },
          ];
        }
        break;
      }
      case 'csv': {
        const values = rawValue
          .split(',')
          .map((value) => value.trim())
          .filter((value) => value.length > 0);
        const validValues = definition.values;
        const validated =
          validValues !== undefined
            ? values.filter((value) => validValues.includes(value))
            : values;
        const transformed = transform !== undefined ? validated.map(transform) : validated;
        const existing = metadata[key] as string[] | undefined;
        metadata[key] = [...(existing ?? []), ...transformed];
        break;
      }
      case 'flag': {
        metadata[key] = true;
        break;
      }
      case 'quoted-value':
      case 'value':
      default: {
        if (definition.values !== undefined && !definition.values.includes(rawValue)) {
          const existing = metadata['_unrecognizedEnums'] as UnrecognizedEnumEntry[] | undefined;
          metadata['_unrecognizedEnums'] = [
            ...(existing ?? []),
            { tag: tagName, value: rawValue, validValues: definition.values },
          ];
          break;
        }
        const value = transform !== undefined ? transform(rawValue) : rawValue;
        if (definition.repeatable) {
          const existing = metadata[key] as string[] | undefined;
          metadata[key] = [...(existing ?? []), value];
        } else {
          metadata[key] = value;
        }
        break;
      }
    }
  }

  if (resolvedRole !== undefined) metadata['role'] = resolvedRole;
  if (deprecatedTags.length > 0) metadata['_deprecatedTags'] = deprecatedTags;
  if (roleTagValues.length > 0) metadata['_roleTagValues'] = roleTagValues;
  if (unrecognizedRoleValues.length > 0)
    metadata['_unrecognizedRoleValues'] = unrecognizedRoleValues;

  return metadata;
}
