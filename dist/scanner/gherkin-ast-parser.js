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
import { Parser, AstBuilder, GherkinClassicTokenMatcher, GherkinInMarkdownTokenMatcher, } from '@cucumber/gherkin';
import * as Messages from '@cucumber/messages';
import { GherkinFeatureSchema, GherkinScenarioSchema, GherkinBackgroundSchema, GherkinRuleSchema, } from '../validation-schemas/feature.js';
import { Result as R } from '../types/index.js';
import { buildRegistry, } from '../taxonomy/index.js';
import { createRegexBuilders } from '../config/regex-builders.js';
import { createDefaultTagRegistry } from '../validation-schemas/tag-registry.js';
/**
 * Default regex builders for tag normalization.
 * Uses the default registry configuration.
 */
const DEFAULT_BUILDERS = (() => {
    const registry = createDefaultTagRegistry();
    return createRegexBuilders(registry.tagPrefix, registry.fileOptInTag);
})();
/**
 * Module-level lookup map from tag name to its registry definition.
 * Built once from the TagRegistry, reused across all extractPatternTags() calls.
 */
const TAG_LOOKUP = new Map(buildRegistry().metadataTags.map((def) => [def.tag, def]));
/** Convert kebab-case to camelCase (e.g., "depends-on" → "dependsOn") */
function kebabToCamel(s) {
    return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
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
function normalizeTag(tag, registry) {
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
 * Extract a DataTable from a Cucumber Messages DataTable
 *
 * Converts the Cucumber AST DataTable format to our simplified structure
 * with headers and row objects.
 *
 * @param dataTable - Cucumber Messages DataTable
 * @returns GherkinDataTable with headers and rows
 */
function extractDataTable(dataTable) {
    const rows = dataTable.rows;
    if (rows.length === 0) {
        return { headers: [], rows: [] };
    }
    // First row is headers
    const headerRow = rows[0];
    const headers = headerRow?.cells.map((cell) => cell.value) ?? [];
    // Remaining rows are data
    const dataRows = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row)
            continue;
        const rowObj = {};
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
function extractSteps(steps) {
    return steps.map((step) => {
        const gherkinStep = {
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
function extractExamples(examples, registry) {
    return examples
        .filter((ex) => ex.tableHeader) // Only process examples with valid headers
        .map((ex) => {
        // Extract headers from tableHeader
        const headers = ex.tableHeader?.cells.map((c) => c.value) ?? [];
        // Extract rows as header->value maps
        const rows = ex.tableBody.map((row) => {
            const rowObj = {};
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
export function parseFeatureFile(content, filePath) {
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
        const feature = {
            name: cucumberFeature.name,
            description: cucumberFeature.description.trim(),
            tags: cucumberFeature.tags.map((tag) => normalizeTag(tag.name)),
            language: cucumberFeature.language,
            line: cucumberFeature.location.line,
        };
        // Extract background (if present)
        let background;
        // Extract rules (Gherkin v6+ business rule groupings)
        const rules = [];
        // Extract scenarios (including those nested inside Rules for backward compat)
        const scenarios = [];
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
                const ruleScenarios = [];
                // Extract scenarios nested inside the Rule
                for (const ruleChild of cucumberRule.children) {
                    if (ruleChild.scenario) {
                        const scenario = ruleChild.scenario;
                        const scenarioTags = scenario.tags.map((tag) => normalizeTag(tag.name));
                        const examples = extractExamples(scenario.examples);
                        const parsedScenario = {
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
    }
    catch (error) {
        // Handle Gherkin parse errors
        if (error !== null && typeof error === 'object' && 'errors' in error) {
            const gherkinError = error;
            const firstError = gherkinError.errors[0];
            const errorObj = {
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
export function extractPatternTags(tags) {
    const metadata = {};
    for (const tag of tags) {
        const normalized = normalizeTag(tag);
        const colonIdx = normalized.indexOf(':');
        if (colonIdx === -1) {
            // Check if this is a registered flag-type tag (e.g., 'core')
            const flagDef = TAG_LOOKUP.get(normalized);
            if (flagDef?.format === 'flag') {
                metadata[kebabToCamel(normalized)] = true;
                continue;
            }
            // No colon: category tag (e.g., @ddd, @event-sourcing)
            // Skip known non-category tags
            if (normalized !== 'acceptance-criteria' &&
                !normalized.startsWith('happy-path') &&
                normalized !== 'libar-docs') {
                const existing = metadata['categories'];
                metadata['categories'] = [...(existing ?? []), normalized];
            }
            continue;
        }
        const tagName = normalized.substring(0, colonIdx);
        const rawValue = normalized.substring(colonIdx + 1);
        const def = TAG_LOOKUP.get(tagName);
        if (def === undefined)
            continue;
        const key = def.metadataKey ?? kebabToCamel(tagName);
        switch (def.format) {
            case 'number': {
                const num = parseInt(rawValue, 10);
                if (!isNaN(num)) {
                    metadata[key] = num;
                }
                break;
            }
            case 'enum': {
                if (def.values?.includes(rawValue) === true) {
                    metadata[key] = rawValue;
                }
                break;
            }
            case 'csv': {
                const values = rawValue
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                const validated = def.values !== undefined
                    ? values.filter((v) => def.values?.includes(v) === true)
                    : values;
                const transformed = def.transform !== undefined ? validated.map(def.transform) : validated;
                const existing = metadata[key];
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
                const value = def.transform !== undefined ? def.transform(rawValue) : rawValue;
                if (def.repeatable === true) {
                    const existing = metadata[key];
                    metadata[key] = [...(existing ?? []), value];
                }
                else {
                    metadata[key] = value;
                }
                break;
            }
        }
    }
    return metadata;
}
//# sourceMappingURL=gherkin-ast-parser.js.map