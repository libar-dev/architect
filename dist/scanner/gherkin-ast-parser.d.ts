/**
 * @libar-docs
 * @libar-docs-scanner
 * @libar-docs-pattern GherkinASTParser
 * @libar-docs-status completed
 * @libar-docs-implements GherkinRulesSupport
 * @libar-docs-uses GherkinTypes
 * @libar-docs-used-by GherkinScanner
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
import { type GherkinFeature, type GherkinScenario, type GherkinFileError, type GherkinBackground, type GherkinRule } from '../validation-schemas/feature.js';
import type { Result } from '../types/index.js';
import { type ProcessStatusValue, type AdrStatusValue, type HierarchyLevel } from '../taxonomy/index.js';
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
export declare function parseFeatureFile(content: string, filePath: string): Result<ParsedFeatureFile, GherkinFileError>;
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
export declare function extractPatternTags(tags: readonly string[]): {
    readonly pattern?: string;
    readonly phase?: number;
    readonly release?: string;
    readonly status?: ProcessStatusValue;
    readonly dependsOn?: readonly string[];
    readonly enables?: readonly string[];
    readonly implementsPatterns?: readonly string[];
    readonly extendsPattern?: string;
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
};
//# sourceMappingURL=gherkin-ast-parser.d.ts.map