/**
 * @architect
 * @architect-pattern GherkinAstParser
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:scanner
 */
import { z } from 'zod';
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
  ADR_CATEGORY_VALUES,
  ADR_LAYER_VALUES,
  ADR_STATUS_VALUES,
  ADR_THEME_VALUES,
  ACCEPTED_STATUS_VALUES,
  HIERARCHY_LEVELS,
  type AcceptedStatusValue,
  type AdrStatusValue,
  type HierarchyLevel,
} from '../taxonomy/index.js';
import { applyKnownTransform } from '../taxonomy/metadata-transforms.js';
import { createRegexBuilders } from '../config/regex-builders.js';
import {
  createDefaultTagRegistry,
  isKnownRoleTag,
  resolveCanonicalRole,
  type MetadataTagDefinition,
  type TagRegistry,
} from '../validation-schemas/tag-registry.js';

const DEFAULT_BUILDERS = (() => {
  const registry = createDefaultTagRegistry();
  return createRegexBuilders(registry.tagPrefix, registry.fileOptInTag);
})();

const IMPLICIT_BARE_ROLE_TAG_PATTERNS = [/^opportunity-\d+$/, /^capstone$/] as const;

function isImplicitBareRoleTag(rawValue: string, registry: TagRegistry): boolean {
  return (
    isKnownRoleTag(registry, rawValue) ||
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

const UnrecognizedEnumEntrySchema = z.strictObject({
  tag: z.string(),
  value: z.string(),
  validValues: z.array(z.string()).readonly(),
});

const CustomMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()).readonly(),
]);

export const FeatureTagMetadataSchema = z.strictObject({
  pattern: z.string().optional(),
  boundedContext: z.string().optional(),
  phase: z.number().int().positive().optional(),
  release: z.string().optional(),
  status: z.enum(ACCEPTED_STATUS_VALUES).optional(),
  unlockReason: z.string().optional(),
  uses: z.array(z.string()).readonly().optional(),
  implementsPatterns: z.array(z.string()).readonly().optional(),
  extendsPattern: z.string().optional(),
  seeAlso: z.array(z.string()).readonly().optional(),
  enforcesDecisions: z.array(z.string()).readonly().optional(),
  apiRef: z.array(z.string()).readonly().optional(),
  role: z.string().optional(),
  quarter: z.string().optional(),
  completed: z.string().optional(),
  effort: z.string().optional(),
  effortActual: z.string().optional(),
  team: z.string().optional(),
  workflow: z.string().optional(),
  risk: z.string().optional(),
  priority: z.string().optional(),
  productArea: z.string().optional(),
  userRole: z.string().optional(),
  businessValue: z.string().optional(),
  level: z.enum(HIERARCHY_LEVELS).optional(),
  parent: z.string().optional(),
  title: z.string().optional(),
  behaviorFile: z.string().optional(),
  discoveredGaps: z.array(z.string()).readonly().optional(),
  discoveredImprovements: z.array(z.string()).readonly().optional(),
  discoveredRisks: z.array(z.string()).readonly().optional(),
  discoveredLearnings: z.array(z.string()).readonly().optional(),
  constraints: z.array(z.string()).readonly().optional(),
  adr: z.string().optional(),
  adrStatus: z.enum(ADR_STATUS_VALUES).optional(),
  adrCategory: z.enum(ADR_CATEGORY_VALUES).optional(),
  adrSupersedes: z.string().optional(),
  adrSupersededBy: z.string().optional(),
  adrTheme: z.enum(ADR_THEME_VALUES).optional(),
  adrLayer: z.enum(ADR_LAYER_VALUES).optional(),
  target: z.string().optional(),
  since: z.string().optional(),
  convention: z.array(z.string()).readonly().optional(),
  executableSpecs: z.array(z.string()).readonly().optional(),
  roadmapSpec: z.string().optional(),
  archRole: z.string().optional(),
  include: z.array(z.string()).readonly().optional(),
  usecase: z.string().optional(),
  customMetadata: z.record(z.string(), CustomMetadataValueSchema).readonly().optional(),
  _deprecatedTags: z.array(z.string()).readonly().optional(),
  _roleTagValues: z.array(z.string()).readonly().optional(),
  _unrecognizedRoleValues: z.array(z.string()).readonly().optional(),
  _unrecognizedEnums: z.array(UnrecognizedEnumEntrySchema).readonly().optional(),
});

export type FeatureTagMetadata = z.output<typeof FeatureTagMetadataSchema>;

function appendStringValues(
  existing: readonly string[] | undefined,
  values: readonly string[],
): readonly string[] {
  return existing === undefined ? [...values] : [...existing, ...values];
}

function appendSingleStringValue(
  existing: readonly string[] | undefined,
  value: string,
): readonly string[] {
  return existing === undefined ? [value] : [...existing, value];
}

function readCustomStringArray(
  value: z.output<typeof CustomMetadataValueSchema> | undefined,
): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const stringValues = value.filter((entry): entry is string => typeof entry === 'string');
  return stringValues.length === value.length ? stringValues : undefined;
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
  registry?: TagRegistry,
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
  filePath: string,
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
  registry: TagRegistry = createDefaultTagRegistry(),
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
  registry: TagRegistry = createDefaultTagRegistry(),
): FeatureTagMetadata {
  const tagLookup = new Map<string, MetadataTagDefinition>(
    registry.metadataTags.map((definition) => [definition.tag, definition] as const),
  );
  const deprecatedTags: string[] = [];
  const roleTagValues: string[] = [];
  const unrecognizedRoleValues: string[] = [];
  const unrecognizedEnums: z.output<typeof UnrecognizedEnumEntrySchema>[] = [];
  let resolvedRole: string | undefined;
  let pattern: string | undefined;
  let boundedContext: string | undefined;
  let phase: number | undefined;
  let release: string | undefined;
  let status: AcceptedStatusValue | undefined;
  let unlockReason: string | undefined;
  let uses: readonly string[] | undefined;
  let implementsPatterns: readonly string[] | undefined;
  let extendsPattern: string | undefined;
  let seeAlso: readonly string[] | undefined;
  let enforcesDecisions: readonly string[] | undefined;
  let apiRef: readonly string[] | undefined;
  let quarter: string | undefined;
  let completed: string | undefined;
  let effort: string | undefined;
  let effortActual: string | undefined;
  let team: string | undefined;
  let workflow: string | undefined;
  let risk: string | undefined;
  let priority: string | undefined;
  let productArea: string | undefined;
  let userRole: string | undefined;
  let businessValue: string | undefined;
  let level: HierarchyLevel | undefined;
  let parent: string | undefined;
  let title: string | undefined;
  let behaviorFile: string | undefined;
  let discoveredGaps: readonly string[] | undefined;
  let discoveredImprovements: readonly string[] | undefined;
  let discoveredRisks: readonly string[] | undefined;
  let discoveredLearnings: readonly string[] | undefined;
  let constraints: readonly string[] | undefined;
  let adr: string | undefined;
  let adrStatus: AdrStatusValue | undefined;
  let adrCategory: string | undefined;
  let adrSupersedes: string | undefined;
  let adrSupersededBy: string | undefined;
  let adrTheme: string | undefined;
  let adrLayer: string | undefined;
  let target: string | undefined;
  let since: string | undefined;
  let convention: readonly string[] | undefined;
  let executableSpecs: readonly string[] | undefined;
  let roadmapSpec: string | undefined;
  let archRole: string | undefined;
  let include: readonly string[] | undefined;
  let usecase: string | undefined;
  let customMetadata: Record<string, z.output<typeof CustomMetadataValueSchema>> | undefined;

  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    const colonIdx = normalized.indexOf(':');

    if (colonIdx === -1) {
      if (
        normalized !== 'acceptance-criteria' &&
        !normalized.startsWith('happy-path') &&
        normalized !== 'architect' &&
        isImplicitBareRoleTag(normalized, registry)
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
      const canonicalRole = resolveCanonicalRole(registry, rawValue);
      if (canonicalRole === undefined) unrecognizedRoleValues.push(rawValue);
      else resolvedRole ??= canonicalRole;
      continue;
    }

    if (definition === undefined) continue;

    const key = definition.metadataKey ?? kebabToCamel(tagName);

    switch (definition.format) {
      case 'number': {
        const num = Number.parseInt(rawValue, 10);
        if (!Number.isNaN(num)) {
          if (key === 'phase') {
            phase = num;
          } else {
            customMetadata = { ...(customMetadata ?? {}), [key]: num };
          }
        }
        break;
      }
      case 'enum': {
        if (definition.values?.includes(rawValue) === true) {
          switch (key) {
            case 'status':
              status = rawValue as AcceptedStatusValue;
              break;
            case 'level':
              level = rawValue as HierarchyLevel;
              break;
            case 'adrStatus':
              adrStatus = rawValue as AdrStatusValue;
              break;
            case 'adrTheme':
              adrTheme = rawValue;
              break;
            case 'adrLayer':
              adrLayer = rawValue;
              break;
            default:
              customMetadata = { ...(customMetadata ?? {}), [key]: rawValue };
              break;
          }
        } else if (definition.values !== undefined) {
          unrecognizedEnums.push({ tag: tagName, value: rawValue, validValues: definition.values });
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
        const transformed = validated.map((value) =>
          applyKnownTransform(definition.transform, value),
        );
        switch (key) {
          case 'uses':
            uses = appendStringValues(uses, transformed);
            break;
          case 'implementsPatterns':
            implementsPatterns = appendStringValues(implementsPatterns, transformed);
            break;
          case 'seeAlso':
            seeAlso = appendStringValues(seeAlso, transformed);
            break;
          case 'enforcesDecisions':
            enforcesDecisions = appendStringValues(enforcesDecisions, transformed);
            break;
          case 'apiRef':
            apiRef = appendStringValues(apiRef, transformed);
            break;
          case 'discoveredGaps':
            discoveredGaps = appendStringValues(discoveredGaps, transformed);
            break;
          case 'discoveredImprovements':
            discoveredImprovements = appendStringValues(discoveredImprovements, transformed);
            break;
          case 'discoveredRisks':
            discoveredRisks = appendStringValues(discoveredRisks, transformed);
            break;
          case 'discoveredLearnings':
            discoveredLearnings = appendStringValues(discoveredLearnings, transformed);
            break;
          case 'constraints':
            constraints = appendStringValues(constraints, transformed);
            break;
          case 'convention':
            convention = appendStringValues(convention, transformed);
            break;
          case 'executableSpecs':
            executableSpecs = appendStringValues(executableSpecs, transformed);
            break;
          case 'include':
            include = appendStringValues(include, transformed);
            break;
          default:
            customMetadata = { ...(customMetadata ?? {}), [key]: transformed };
            break;
        }
        break;
      }
      case 'flag': {
        customMetadata = { ...(customMetadata ?? {}), [key]: true };
        break;
      }
      case 'quoted-value':
      case 'value':
      default: {
        if (definition.values !== undefined && !definition.values.includes(rawValue)) {
          unrecognizedEnums.push({ tag: tagName, value: rawValue, validValues: definition.values });
          break;
        }
        const value = applyKnownTransform(definition.transform, rawValue);
        if (definition.repeatable) {
          const existingCustomValue =
            customMetadata === undefined ? undefined : customMetadata[key];
          customMetadata = {
            ...(customMetadata ?? {}),
            [key]: appendSingleStringValue(readCustomStringArray(existingCustomValue), value),
          };
        } else {
          switch (key) {
            case 'pattern':
              pattern = value;
              break;
            case 'boundedContext':
              boundedContext = value;
              break;
            case 'release':
              release = value;
              break;
            case 'unlockReason':
              unlockReason = value;
              break;
            case 'extendsPattern':
              extendsPattern = value;
              break;
            case 'quarter':
              quarter = value;
              break;
            case 'completed':
              completed = value;
              break;
            case 'effort':
              effort = value;
              break;
            case 'effortActual':
              effortActual = value;
              break;
            case 'team':
              team = value;
              break;
            case 'workflow':
              workflow = value;
              break;
            case 'risk':
              risk = value;
              break;
            case 'priority':
              priority = value;
              break;
            case 'productArea':
              productArea = value;
              break;
            case 'userRole':
              userRole = value;
              break;
            case 'businessValue':
              businessValue = value;
              break;
            case 'parent':
              parent = value;
              break;
            case 'title':
              title = value;
              break;
            case 'behaviorFile':
              behaviorFile = value;
              break;
            case 'adr':
              adr = value;
              break;
            case 'adrCategory':
              adrCategory = value;
              break;
            case 'adrSupersedes':
              adrSupersedes = value;
              break;
            case 'adrSupersededBy':
              adrSupersededBy = value;
              break;
            case 'target':
              target = value;
              break;
            case 'since':
              since = value;
              break;
            case 'roadmapSpec':
              roadmapSpec = value;
              break;
            case 'archRole':
              archRole = value;
              break;
            case 'usecase':
              usecase = value;
              break;
            default:
              customMetadata = { ...(customMetadata ?? {}), [key]: value };
              break;
          }
        }
        break;
      }
    }
  }

  return FeatureTagMetadataSchema.parse({
    ...(pattern !== undefined ? { pattern } : {}),
    ...(boundedContext !== undefined ? { boundedContext } : {}),
    ...(phase !== undefined ? { phase } : {}),
    ...(release !== undefined ? { release } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(unlockReason !== undefined ? { unlockReason } : {}),
    ...(uses !== undefined ? { uses } : {}),
    ...(implementsPatterns !== undefined ? { implementsPatterns } : {}),
    ...(extendsPattern !== undefined ? { extendsPattern } : {}),
    ...(seeAlso !== undefined ? { seeAlso } : {}),
    ...(enforcesDecisions !== undefined ? { enforcesDecisions } : {}),
    ...(apiRef !== undefined ? { apiRef } : {}),
    ...(resolvedRole !== undefined ? { role: resolvedRole } : {}),
    ...(quarter !== undefined ? { quarter } : {}),
    ...(completed !== undefined ? { completed } : {}),
    ...(effort !== undefined ? { effort } : {}),
    ...(effortActual !== undefined ? { effortActual } : {}),
    ...(team !== undefined ? { team } : {}),
    ...(workflow !== undefined ? { workflow } : {}),
    ...(risk !== undefined ? { risk } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(productArea !== undefined ? { productArea } : {}),
    ...(userRole !== undefined ? { userRole } : {}),
    ...(businessValue !== undefined ? { businessValue } : {}),
    ...(level !== undefined ? { level } : {}),
    ...(parent !== undefined ? { parent } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(behaviorFile !== undefined ? { behaviorFile } : {}),
    ...(discoveredGaps !== undefined ? { discoveredGaps } : {}),
    ...(discoveredImprovements !== undefined ? { discoveredImprovements } : {}),
    ...(discoveredRisks !== undefined ? { discoveredRisks } : {}),
    ...(discoveredLearnings !== undefined ? { discoveredLearnings } : {}),
    ...(constraints !== undefined ? { constraints } : {}),
    ...(adr !== undefined ? { adr } : {}),
    ...(adrStatus !== undefined ? { adrStatus } : {}),
    ...(adrCategory !== undefined ? { adrCategory } : {}),
    ...(adrSupersedes !== undefined ? { adrSupersedes } : {}),
    ...(adrSupersededBy !== undefined ? { adrSupersededBy } : {}),
    ...(adrTheme !== undefined ? { adrTheme } : {}),
    ...(adrLayer !== undefined ? { adrLayer } : {}),
    ...(target !== undefined ? { target } : {}),
    ...(since !== undefined ? { since } : {}),
    ...(convention !== undefined ? { convention } : {}),
    ...(executableSpecs !== undefined ? { executableSpecs } : {}),
    ...(roadmapSpec !== undefined ? { roadmapSpec } : {}),
    ...(archRole !== undefined ? { archRole } : {}),
    ...(include !== undefined ? { include } : {}),
    ...(usecase !== undefined ? { usecase } : {}),
    ...(customMetadata !== undefined ? { customMetadata } : {}),
    ...(deprecatedTags.length > 0 ? { _deprecatedTags: deprecatedTags } : {}),
    ...(roleTagValues.length > 0 ? { _roleTagValues: roleTagValues } : {}),
    ...(unrecognizedRoleValues.length > 0
      ? { _unrecognizedRoleValues: unrecognizedRoleValues }
      : {}),
    ...(unrecognizedEnums.length > 0 ? { _unrecognizedEnums: unrecognizedEnums } : {}),
  });
}
