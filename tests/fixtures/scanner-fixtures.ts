/**
 * Scanner Fixtures - Content Builders for BDD Tests
 *
 * Provides TypeScript and Gherkin content builders for scanner domain tests.
 * These builders create various export types and directive configurations
 * needed to test the AST parser comprehensively.
 *
 * @libar-docs
 */

// =============================================================================
// TypeScript Export Type Builders
// =============================================================================

export type ExportType =
  | 'function'
  | 'type'
  | 'interface'
  | 'const'
  | 'class'
  | 'enum'
  | 'const-enum'
  | 'abstract-class'
  | 'arrow-function'
  | 'async-function'
  | 'generic-function'
  | 'default-function'
  | 're-export'
  | 'multiple-const';

/**
 * Options for building TypeScript content with @libar-docs directives.
 */
export interface TsContentOptions {
  /** Export type to generate */
  exportType?: ExportType;
  /** Name of the exported item */
  name?: string;
  /** Category tag (e.g., "core", "ddd") */
  category?: string;
  /** Pattern name */
  patternName?: string;
  /** Status value */
  status?: string;
  /** Description text */
  description?: string;
  /** Additional tags (besides category) */
  additionalTags?: string[];
  /** Example code blocks */
  examples?: string[];
  /** Uses relationships */
  uses?: string[];
  /** Used-by relationships */
  usedBy?: string[];
  /** When to use bullets (heading format) */
  whenToUse?: string[];
  /** When to use inline format (single string) */
  whenToUseInline?: string;
  /** Include file-level @libar-docs opt-in */
  includeFileOptIn?: boolean;
  /** Use asterisk bullets instead of dashes in When to Use */
  useAsteriskBullets?: boolean;
}

/**
 * Build TypeScript file content with @libar-docs directive.
 *
 * @example
 * ```typescript
 * const content = buildTsContent({
 *   exportType: "function",
 *   name: "authenticate",
 *   category: "core",
 *   description: "Authenticate a user",
 * });
 * ```
 */
export function buildTsContent(options: TsContentOptions = {}): string {
  const {
    exportType = 'function',
    name = 'testExport',
    category = 'core',
    patternName,
    status,
    description = 'Test description',
    additionalTags = [],
    examples = [],
    uses = [],
    usedBy = [],
    whenToUse = [],
    whenToUseInline,
    includeFileOptIn = false,
    useAsteriskBullets = false,
  } = options;

  const lines: string[] = [];

  // File-level opt-in (separate comment block)
  if (includeFileOptIn) {
    lines.push('/** @libar-docs */');
    lines.push('');
  }

  // Build directive block
  lines.push('/**');

  // Category tags on first line
  const categoryTags = [
    `@libar-docs-${category}`,
    ...additionalTags.map((t) => `@libar-docs-${t}`),
  ];
  lines.push(` * ${categoryTags.join(' ')}`);

  // Pattern name
  if (patternName) {
    lines.push(` * @libar-docs-pattern ${patternName}`);
  }

  // Status
  if (status) {
    lines.push(` * @libar-docs-status ${status}`);
  }

  // Uses relationships
  if (uses.length > 0) {
    lines.push(` * @libar-docs-uses ${uses.join(', ')}`);
  }

  // Used-by relationships
  if (usedBy.length > 0) {
    lines.push(` * @libar-docs-used-by ${usedBy.join(', ')}`);
  }

  // Description
  lines.push(' *');
  lines.push(` * ${description}`);

  // When to Use section (heading format with bullets)
  if (whenToUse.length > 0) {
    lines.push(' *');
    lines.push(' * ### When to Use');
    lines.push(' *');
    const bullet = useAsteriskBullets ? '*' : '-';
    for (const item of whenToUse) {
      lines.push(` * ${bullet} ${item}`);
    }
  }

  // When to use inline format
  if (whenToUseInline) {
    lines.push(' *');
    lines.push(` * **When to use:** ${whenToUseInline}`);
  }

  // Examples
  for (const example of examples) {
    lines.push(' *');
    lines.push(' * @example');
    lines.push(' * ```typescript');
    for (const exampleLine of example.split('\n')) {
      lines.push(` * ${exampleLine}`);
    }
    lines.push(' * ```');
  }

  lines.push(' */');

  // Generate export based on type
  lines.push(buildExportStatement(exportType, name));

  return lines.join('\n');
}

/**
 * Build the export statement based on export type.
 */
function buildExportStatement(exportType: ExportType, name: string): string {
  switch (exportType) {
    case 'function':
      return `export function ${name}(input: string): string {\n  return input;\n}`;

    case 'type':
      return `export type ${name} = {\n  id: string;\n  name: string;\n};`;

    case 'interface':
      return `export interface ${name} {\n  id: string;\n  value: number;\n}`;

    case 'const':
      return `export const ${name} = {\n  key: 'value'\n};`;

    case 'class':
      return `export class ${name} {\n  constructor(private value: string) {}\n  getValue() { return this.value; }\n}`;

    case 'enum':
      return `export enum ${name} {\n  Active = 'active',\n  Inactive = 'inactive'\n}`;

    case 'const-enum':
      return `export const enum ${name} {\n  Up = 1,\n  Down = 2\n}`;

    case 'abstract-class':
      return `export abstract class ${name} {\n  abstract process(): void;\n  log(msg: string) { console.log(msg); }\n}`;

    case 'arrow-function':
      return `export const ${name} = async (url: string): Promise<Response> => {\n  return fetch(url);\n};`;

    case 'async-function':
      return `export async function ${name}(id: string): Promise<Data> {\n  const response = await fetch(\`/api/\${id}\`);\n  return response.json();\n}`;

    case 'generic-function':
      return `export function ${name}<T, U>(items: T[], fn: (item: T) => U): U[] {\n  return items.map(fn);\n}`;

    case 'default-function':
      return `export default function ${name}() {\n  return true;\n}`;

    case 're-export':
      return `export { foo, bar } from './utils';`;

    case 'multiple-const':
      return `export const ${name}_A = 'a', ${name}_B = 'b';`;

    default:
      return `export function ${name}() { return true; }`;
  }
}

// =============================================================================
// Content Builders for Specific Test Scenarios
// =============================================================================

/**
 * Build content with tags mentioned in description (should NOT be extracted).
 */
export function buildContentWithTagsInDescription(category: string): string {
  return `/**
 * @libar-docs-${category}
 *
 * This function works with @libar-docs-api patterns.
 * It supports @libar-docs-saga for orchestration.
 */
export function processRequest() {
  return true;
}`;
}

/**
 * Build content with tags in @example section (should NOT be extracted).
 */
export function buildContentWithTagsInExample(category: string): string {
  return `/**
 * @libar-docs-${category}
 * Test function
 *
 * @example
 * \`\`\`typescript
 * hasTag('@libar-docs-example'); // checking for a tag
 * hasTag('@libar-docs-saga'); // another example
 * \`\`\`
 */
export function hasTag(tag: string): boolean {
  return tag.startsWith('@libar-docs');
}`;
}

/**
 * Build content with multiple directives in same file.
 */
export function buildContentWithMultipleDirectives(
  items: Array<{ category: string; name: string; description: string }>
): string {
  return items
    .map(
      (item) => `/**
 * @libar-docs-${item.category}
 * ${item.description}
 */
export function ${item.name}() {
  return '${item.name}';
}`
    )
    .join('\n\n');
}

/**
 * Build malformed TypeScript content (missing closing paren).
 */
export function buildMalformedTsContent(): string {
  return `/**
 * @libar-docs-core
 * This will fail to parse
 */
export function broken(
  // Missing closing parenthesis and function body`;
}

/**
 * Build content with line number verification (comments before directive).
 */
export function buildContentWithLineNumbers(): string {
  return `// Line 1
// Line 2
/**
 * @libar-docs-core
 * Test
 */
export function test() {
  return 'test';
}`;
}

/**
 * Build content without @libar-docs-* tags (regular JSDoc).
 */
export function buildContentWithoutDirective(): string {
  return `/**
 * Regular JSDoc comment
 * @param foo - parameter
 * @returns result
 */
export function regular(foo: string) {
  return foo;
}`;
}

/**
 * Build content with inline comment (not block comment).
 */
export function buildContentWithInlineComment(): string {
  return `// @libar-docs-core - This is an inline comment
export function test() {
  return 'test';
}`;
}

/**
 * Build content with @param and @returns that should be ignored in description.
 */
export function buildContentWithJsDocTags(): string {
  return `/**
 * @libar-docs-core
 * Test function
 *
 * @param input - The input string
 * @returns The processed output
 */
export function test(input: string): string {
  return input;
}`;
}

/**
 * Build content with unicode characters in description.
 */
export function buildContentWithUnicode(): string {
  return `/**
 * @libar-docs-core
 * Función de autenticación con émojis
 */
export function autenticar() {
  return true;
}`;
}

/**
 * Build content with detailed multi-line description.
 */
export function buildContentWithMultilineDescription(): string {
  return `/**
 * @libar-docs-core
 *
 * This is a detailed description
 * that spans multiple lines
 * and should be captured.
 */
export function test() {
  return 'test';
}`;
}

// =============================================================================
// Gherkin Content Builders
// =============================================================================

/**
 * Options for building Gherkin feature content.
 */
export interface GherkinContentOptions {
  /** Feature name */
  featureName?: string;
  /** Feature description */
  description?: string;
  /** Phase number */
  phase?: number;
  /** Status (completed, in_progress, planned) */
  status?: string;
  /** Quarter (Q1-2025, etc.) */
  quarter?: string;
  /** Effort estimate (1w, 2d, etc.) */
  effort?: string;
  /** Team (platform, frontend, etc.) */
  team?: string;
  /** Pattern name from @libar-pattern tag */
  patternName?: string;
  /** Dependencies (depends-on) */
  dependencies?: string[];
  /** Enables */
  enables?: string[];
  /** Category tags */
  categories?: string[];
  /** Brief path */
  briefPath?: string;
  /** Scenario names */
  scenarios?: Array<{ name: string; status?: string }>;
  /** Include malformed Gherkin (for error testing) */
  malformed?: boolean;
  /** Exclude Feature keyword (for error testing) */
  omitFeature?: boolean;
}

/**
 * Build Gherkin feature file content with @libar-process-* tags.
 *
 * @example
 * ```typescript
 * const content = buildGherkinContent({
 *   featureName: "Order Processing",
 *   phase: 1,
 *   status: "completed",
 *   scenarios: [{ name: "Create order" }],
 * });
 * ```
 */
export function buildGherkinContent(options: GherkinContentOptions = {}): string {
  const {
    featureName = 'Test Feature',
    description = 'A test feature',
    phase,
    status,
    quarter,
    effort,
    team,
    patternName,
    dependencies = [],
    enables = [],
    categories = [],
    briefPath,
    scenarios = [],
    malformed = false,
    omitFeature = false,
  } = options;

  if (malformed) {
    return `This is not valid Gherkin
It has no Feature keyword
Just random text`;
  }

  if (omitFeature) {
    return `@some-tag
Scenario: Orphan scenario
  Given something`;
  }

  const lines: string[] = [];

  // Process metadata tags (using @libar-docs-* prefix per PDR-004)
  if (phase !== undefined) {
    lines.push(`@libar-docs-phase:${phase}`);
  }
  if (status) {
    lines.push(`@libar-docs-status:${status}`);
  }
  if (quarter) {
    lines.push(`@libar-docs-quarter:${quarter}`);
  }
  if (effort) {
    lines.push(`@libar-docs-effort:${effort}`);
  }
  if (team) {
    lines.push(`@libar-docs-team:${team}`);
  }
  if (patternName) {
    lines.push(`@libar-docs-pattern:${patternName}`);
  }
  if (briefPath) {
    lines.push(`@libar-docs-brief:${briefPath}`);
  }
  for (const dep of dependencies) {
    lines.push(`@libar-docs-depends-on:${dep}`);
  }
  for (const enable of enables) {
    lines.push(`@libar-docs-enables:${enable}`);
  }
  for (const cat of categories) {
    lines.push(`@${cat}`);
  }

  // Feature line
  lines.push(`Feature: ${featureName}`);
  lines.push(`  ${description}`);
  lines.push('');

  // Scenarios
  for (const scenario of scenarios) {
    if (scenario.status) {
      lines.push(`  @libar-docs-status:${scenario.status}`);
    }
    lines.push(`  Scenario: ${scenario.name}`);
    lines.push(`    Given some precondition`);
    lines.push(`    When an action occurs`);
    lines.push(`    Then an outcome happens`);
    lines.push('');
  }

  return lines.join('\n');
}

// =============================================================================
// State Factory for Scanner Tests
// =============================================================================

import type { ScannerScenarioState } from '../support/world.js';

/**
 * Create initial scanner scenario state.
 * Used by step definitions to initialize module-level state.
 */
export function createScannerState(
  overrides: Partial<ScannerScenarioState> = {}
): ScannerScenarioState {
  return {
    tempDir: null,
    files: new Map(),
    result: null,
    patterns: [],
    baseDir: '',
    ...overrides,
  };
}
