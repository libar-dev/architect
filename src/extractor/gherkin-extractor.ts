/**
 * @libar-docs
 * @libar-docs-extractor
 * @libar-docs-pattern GherkinExtractor
 * @libar-docs-status completed
 * @libar-docs-uses GherkinTypes, GherkinASTParser
 * @libar-docs-used-by DualSourceExtractor, Orchestrator
 *
 * ## GherkinExtractor - Convert Feature Files to Pattern Documentation
 *
 * Transforms scanned Gherkin feature files into ExtractedPattern objects
 * for inclusion in generated documentation. Maps feature tags, descriptions,
 * and scenarios to pattern metadata.
 *
 * ### When to Use
 *
 * - When building multi-source documentation (TypeScript + Gherkin)
 * - When converting acceptance criteria to pattern documentation
 * - When defining roadmap patterns in .feature files before implementation
 *
 * ### Key Concepts
 *
 * - **Feature → Pattern**: Feature name becomes pattern name
 * - **Tags → Metadata**: @pattern:Name, @phase:N map to pattern fields
 * - **Scenarios → Use Cases**: Acceptance criteria become "When to Use" examples
 */

// TODO: Abstract filesystem operations for future Convex migration.
// Direct fs/path usage should be moved to injected interface (via GherkinExtractorConfig)
// or deferred to CLI-layer orchestration. See PR-79 comment #042.
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ScannedGherkinFile } from '../validation-schemas/feature.js';
import {
  ExtractedPatternSchema,
  type ExtractedPattern,
} from '../validation-schemas/extracted-pattern.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import type { DirectiveTag } from '../types/branded.js';
import { extractPatternTags } from '../scanner/gherkin-ast-parser.js';
import { asPatternId, asCategoryName, asSourceFilePath, asDirectiveTag } from '../types/branded.js';
import { inferFeatureLayer } from './layer-inference.js';
import { extractDeliverables } from './dual-source-extractor.js';
import {
  createGherkinPatternValidationError,
  type GherkinPatternValidationError,
} from '../types/errors.js';
import { generatePatternId } from '../utils/index.js';

/**
 * Assign a property to an object only if the value is defined (not undefined/null).
 *
 * Performance optimization: Avoids creating intermediate objects from conditional spreads.
 * Instead of `...(x && { field: x })` which creates a temporary object,
 * this directly assigns to the target object.
 *
 * @internal
 */
function assignIfDefined(obj: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined && value !== null) {
    obj[key] = value;
  }
}

/**
 * Assign a property to an object only if the array is non-empty.
 *
 * @internal
 */
function assignIfNonEmpty(
  obj: Record<string, unknown>,
  key: string,
  arr: readonly unknown[] | undefined
): void {
  if (arr && arr.length > 0) {
    obj[key] = arr;
  }
}

/**
 * Configuration for Gherkin extractor
 */
export interface GherkinExtractorConfig {
  /** Base directory for computing relative paths */
  readonly baseDir: string;
  /** Tag registry for category inference */
  readonly tagRegistry?: TagRegistry;
  /** Convert scenarios to "When to Use" examples (default: true) */
  readonly scenariosAsUseCases?: boolean;
}

/**
 * Result of Gherkin pattern extraction
 *
 * Contains both successfully extracted patterns and any validation errors
 * encountered during extraction. This enables partial success scenarios
 * where some patterns extract successfully while others fail validation.
 */
export interface GherkinExtractionResult {
  /** Successfully extracted patterns */
  readonly patterns: readonly ExtractedPattern[];
  /** Validation errors for patterns that failed extraction */
  readonly errors: readonly GherkinPatternValidationError[];
}

/**
 * Extract patterns from scanned Gherkin feature files
 *
 * Converts feature file metadata into ExtractedPattern objects that can be
 * merged with TypeScript-sourced patterns for unified documentation generation.
 *
 * Returns both successfully extracted patterns and validation errors for
 * patterns that failed extraction. This enables partial success scenarios.
 *
 * @param scannedFiles - Array of scanned Gherkin files
 * @param config - Extractor configuration (requires baseDir for relative paths)
 * @returns Object containing extracted patterns and any validation errors
 *
 * @example
 * ```typescript
 * const scanResult = await scanGherkinFiles({
 *   patterns: 'tests/features/roadmap/**\/*.feature'
 * });
 *
 * if (scanResult.ok) {
 *   const { patterns, errors } = extractPatternsFromGherkin(scanResult.value.files, {
 *     baseDir: process.cwd()
 *   });
 *   console.log(`${patterns.length} patterns extracted, ${errors.length} errors`);
 * }
 * ```
 */
export function extractPatternsFromGherkin(
  scannedFiles: readonly ScannedGherkinFile[],
  config: GherkinExtractorConfig
): GherkinExtractionResult {
  const patterns: ExtractedPattern[] = [];
  const errors: GherkinPatternValidationError[] = [];
  const { baseDir } = config;
  const scenariosAsUseCases = config.scenariosAsUseCases ?? true;

  for (const file of scannedFiles) {
    const { feature, scenarios, rules, filePath } = file;

    // Convert absolute path to relative path from baseDir
    const relativePath = path.relative(baseDir, filePath);

    // Extract pattern metadata from feature tags
    const metadata = extractPatternTags(feature.tags);

    // Skip if no pattern tag (not a pattern definition)
    if (!metadata.pattern) {
      continue;
    }

    // Skip if no status tag (pattern reference for scenario mapping, not a pattern definition)
    // Roadmap patterns MUST have @status:roadmap, @status:implemented, or @status:partial
    if (!metadata.status) {
      continue;
    }

    // Determine pattern name (from @pattern:Name tag or feature name)
    const patternName = metadata.pattern || feature.name;

    // Determine category (from category tags or default to first one)
    const categories = metadata.categories ?? [];
    const primaryCategory = categories[0] ?? 'ddd';

    // Extract "When to Use" from scenarios if enabled
    const whenToUse: string[] = [];
    if (scenariosAsUseCases) {
      for (const scenario of scenarios) {
        // Only include scenarios tagged with @acceptance-criteria
        if (scenario.tags.includes('acceptance-criteria')) {
          whenToUse.push(`When ${scenario.name.toLowerCase()}`);
        }
      }
    }

    // Create pattern ID from file path and line number (deterministic)
    const patternId = asPatternId(generatePatternId(relativePath, feature.line));

    // Extract deliverables from Background table
    const deliverables = extractDeliverables(file);

    // Infer and verify behavior file for traceability
    let behaviorFile = metadata.behaviorFile;
    let behaviorFileVerified: boolean | undefined;

    if (!behaviorFile) {
      // Infer from convention: timeline/phase-N-name.feature → behavior/name.feature
      const inferred = inferBehaviorFilePath(relativePath);
      if (inferred) {
        behaviorFile = inferred;
        // Verify file exists on disk
        const absolutePath = path.join(baseDir, inferred);
        behaviorFileVerified = fileExistsSync(absolutePath);
      }
    } else {
      // Verify explicit tag path exists
      const absolutePath = path.join(baseDir, behaviorFile);
      behaviorFileVerified = fileExistsSync(absolutePath);
    }

    // Build raw pattern object using explicit property assignment for performance
    // This avoids ~50 intermediate objects created by conditional spreads
    const directive: Record<string, unknown> = {
      tags: feature.tags
        .filter((tag) => !tag.includes(':'))
        .map((tag) => asDirectiveTag(`@libar-docs-${tag}`)) as readonly DirectiveTag[],
      description: feature.description,
      examples: [],
      position: {
        startLine: feature.line,
        endLine: feature.line,
      },
      status: metadata.status,
      phase: metadata.phase,
    };
    // Directive optional fields
    assignIfDefined(directive, 'patternName', metadata.pattern);
    assignIfDefined(directive, 'brief', metadata.brief);
    assignIfNonEmpty(directive, 'dependsOn', metadata.dependsOn);
    assignIfNonEmpty(directive, 'enables', metadata.enables);
    assignIfDefined(directive, 'quarter', metadata.quarter);
    assignIfDefined(directive, 'completed', metadata.completed);
    assignIfDefined(directive, 'effort', metadata.effort);
    assignIfDefined(directive, 'team', metadata.team);
    assignIfDefined(directive, 'workflow', metadata.workflow);
    assignIfDefined(directive, 'risk', metadata.risk);
    assignIfDefined(directive, 'priority', metadata.priority);

    const rawPattern: Record<string, unknown> = {
      id: patternId,
      name: patternName,
      category: asCategoryName(primaryCategory),
      directive,
      code: '', // No code for Gherkin-sourced patterns
      source: {
        file: asSourceFilePath(relativePath),
        lines: [feature.line, feature.line] as const,
      },
      exports: [],
      extractedAt: new Date().toISOString(),
      patternName,
      status: metadata.status,
    };

    // Pattern-level optional fields (explicit assignment avoids intermediate objects)
    if (metadata.phase !== undefined) rawPattern['phase'] = metadata.phase;
    assignIfDefined(rawPattern, 'release', metadata.release);
    assignIfDefined(rawPattern, 'brief', metadata.brief);
    assignIfNonEmpty(rawPattern, 'dependsOn', metadata.dependsOn);
    assignIfNonEmpty(rawPattern, 'enables', metadata.enables);
    // UML-inspired relationship fields (PatternRelationshipModel)
    assignIfNonEmpty(rawPattern, 'implementsPatterns', metadata.implementsPatterns);
    assignIfDefined(rawPattern, 'extendsPattern', metadata.extendsPattern);
    assignIfDefined(rawPattern, 'quarter', metadata.quarter);
    assignIfDefined(rawPattern, 'completed', metadata.completed);
    assignIfDefined(rawPattern, 'effort', metadata.effort);
    assignIfDefined(rawPattern, 'team', metadata.team);
    assignIfDefined(rawPattern, 'workflow', metadata.workflow);
    assignIfDefined(rawPattern, 'risk', metadata.risk);
    assignIfDefined(rawPattern, 'priority', metadata.priority);
    assignIfDefined(rawPattern, 'productArea', metadata.productArea);
    assignIfDefined(rawPattern, 'userRole', metadata.userRole);
    assignIfDefined(rawPattern, 'businessValue', metadata.businessValue);

    // Hierarchy support (epic/phase/task)
    assignIfDefined(rawPattern, 'level', metadata.level);
    assignIfDefined(rawPattern, 'parent', metadata.parent);

    // Discovery findings from retrospective tags
    assignIfNonEmpty(rawPattern, 'discoveredGaps', metadata.discoveredGaps);
    assignIfNonEmpty(rawPattern, 'discoveredImprovements', metadata.discoveredImprovements);
    assignIfNonEmpty(rawPattern, 'discoveredRisks', metadata.discoveredRisks);
    assignIfNonEmpty(rawPattern, 'discoveredLearnings', metadata.discoveredLearnings);

    // Technical constraints from @libar-process-constraint tags
    assignIfNonEmpty(rawPattern, 'constraints', metadata.constraints);

    // ADR (Architecture Decision Record) fields
    assignIfDefined(rawPattern, 'adr', metadata.adr);
    assignIfDefined(rawPattern, 'adrStatus', metadata.adrStatus);
    assignIfDefined(rawPattern, 'adrCategory', metadata.adrCategory);
    assignIfDefined(rawPattern, 'adrSupersedes', metadata.adrSupersedes);
    assignIfDefined(rawPattern, 'adrSupersededBy', metadata.adrSupersededBy);
    // NOTE: ADR content is now derived from Gherkin Rule: keywords
    // (Context, Decision, Consequences) instead of parsed markdown.
    // The rules array is populated below and rendered by the ADR codec.

    // When to use
    assignIfNonEmpty(rawPattern, 'whenToUse', whenToUse);

    // Map scenarios to scenario refs with full structure including steps
    if (scenarios.length > 0) {
      rawPattern['scenarios'] = scenarios.map((scenario) => {
        const scenarioRef: Record<string, unknown> = {
          featureFile: relativePath,
          featureName: feature.name,
          featureDescription: feature.description,
          scenarioName: scenario.name,
          semanticTags: scenario.tags.filter((tag) =>
            [
              'happy-path',
              'validation',
              'business-failure',
              'business-rule',
              'compensation',
              'idempotency',
              'expiration',
              'workflow-state',
            ].includes(tag)
          ),
          tags: scenario.tags,
          layer: inferFeatureLayer(filePath),
          line: scenario.line,
        };
        // Include full step data for enhanced acceptance criteria rendering
        if (scenario.steps.length > 0) {
          scenarioRef['steps'] = scenario.steps.map((step) => {
            const stepObj: Record<string, unknown> = {
              keyword: step.keyword,
              text: step.text,
            };
            assignIfDefined(stepObj, 'dataTable', step.dataTable);
            assignIfDefined(stepObj, 'docString', step.docString);
            return stepObj;
          });
        }
        return scenarioRef;
      });
    }

    // Add deliverables if present (from Background table)
    assignIfNonEmpty(rawPattern, 'deliverables', deliverables);

    // Add behavior file traceability fields
    assignIfDefined(rawPattern, 'behaviorFile', behaviorFile);
    if (behaviorFileVerified !== undefined) {
      rawPattern['behaviorFileVerified'] = behaviorFileVerified;
    }

    // Add rules if present (Gherkin v6+ business rule groupings)
    if (rules && rules.length > 0) {
      rawPattern['rules'] = rules.map((rule) => ({
        name: rule.name,
        description: rule.description,
        scenarioCount: rule.scenarios.length,
        scenarioNames: rule.scenarios.map((s) => s.name),
      }));
    }

    // Validate against schema (schema-first enforcement)
    const validation = ExtractedPatternSchema.safeParse(rawPattern);

    if (!validation.success) {
      // Collect validation error instead of console.warn
      errors.push(
        createGherkinPatternValidationError(
          relativePath,
          patternName,
          'Schema validation failed',
          validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
        )
      );
      continue;
    }

    patterns.push(validation.data);
  }

  return { patterns, errors };
}

/**
 * Infer behavior file path from timeline feature file path using convention
 *
 * Convention: `timeline/phase-N[suffix]-name.feature` → `behavior/name.feature`
 *
 * Handles edge cases:
 * - `phase-37-remaining-work-enhancement.feature` → `remaining-work-enhancement.feature`
 * - `phase-02b-enhanced-dogfooding.feature` → `enhanced-dogfooding.feature`
 * - `phase-03-watch-mode.feature` → `watch-mode.feature`
 *
 * @param timelineFilePath - Relative path to timeline feature file
 * @returns Inferred behavior file path, or undefined if not a timeline file
 */
export function inferBehaviorFilePath(timelineFilePath: string): string | undefined {
  // Match: phase-NN[a-z]?-name.feature (supports phase-02b, phase-37, etc.)
  const match = /phase-\d+[a-z]?-(.+)\.feature$/.exec(timelineFilePath);
  if (match?.[1]) {
    return `tests/features/behavior/${match[1]}.feature`;
  }
  return undefined;
}

/**
 * Check if a file exists at the given path (sync)
 *
 * @param filePath - Absolute path to check
 * @returns true if file exists, false otherwise
 */
function fileExistsSync(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Check if a file exists at the given path (async)
 *
 * @param filePath - Absolute path to check
 * @returns Promise resolving to true if file exists, false otherwise
 */
async function fileExistsAsync(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract patterns from scanned Gherkin feature files (async variant)
 *
 * This is the async version of `extractPatternsFromGherkin` that performs
 * file existence checks asynchronously in parallel, avoiding event loop blocking.
 *
 * Use this variant when processing many feature files or when running on
 * systems with slow disk I/O.
 *
 * @param scannedFiles - Array of scanned Gherkin files
 * @param config - Extractor configuration (requires baseDir for relative paths)
 * @returns Promise resolving to extracted patterns and validation errors
 *
 * @example
 * ```typescript
 * const scanResult = await scanGherkinFiles({
 *   patterns: 'tests/features/roadmap/**\/*.feature'
 * });
 *
 * if (scanResult.ok) {
 *   const { patterns, errors } = await extractPatternsFromGherkinAsync(
 *     scanResult.value.files,
 *     { baseDir: process.cwd() }
 *   );
 * }
 * ```
 */
export async function extractPatternsFromGherkinAsync(
  scannedFiles: readonly ScannedGherkinFile[],
  config: GherkinExtractorConfig
): Promise<GherkinExtractionResult> {
  const { baseDir } = config;
  const scenariosAsUseCases = config.scenariosAsUseCases ?? true;

  // First pass: Extract patterns without behavior file verification
  // Collect paths that need async verification
  interface PatternWithPendingVerification {
    pattern: ExtractedPattern;
    behaviorPathToVerify?: string;
  }

  const patternsToVerify: PatternWithPendingVerification[] = [];
  const errors: GherkinPatternValidationError[] = [];

  for (const file of scannedFiles) {
    const { feature, scenarios, rules, filePath } = file;
    const relativePath = path.relative(baseDir, filePath);
    const metadata = extractPatternTags(feature.tags);

    // Skip if no pattern or status tag
    if (!metadata.pattern || !metadata.status) continue;

    const patternName = metadata.pattern || feature.name;
    const categories = metadata.categories ?? [];
    const primaryCategory = categories[0] ?? 'ddd';

    const whenToUse: string[] = [];
    if (scenariosAsUseCases) {
      for (const scenario of scenarios) {
        if (scenario.tags.includes('acceptance-criteria')) {
          whenToUse.push(`When ${scenario.name.toLowerCase()}`);
        }
      }
    }

    const patternId = asPatternId(generatePatternId(relativePath, feature.line));
    const deliverables = extractDeliverables(file);

    // Infer behavior file path but DON'T verify yet
    let behaviorFile = metadata.behaviorFile;
    let behaviorPathToVerify: string | undefined;

    if (!behaviorFile) {
      const inferred = inferBehaviorFilePath(relativePath);
      if (inferred) {
        behaviorFile = inferred;
        behaviorPathToVerify = path.join(baseDir, inferred);
      }
    } else {
      behaviorPathToVerify = path.join(baseDir, behaviorFile);
    }

    // Build pattern object (same as sync version but without behaviorFileVerified)
    const directive: Record<string, unknown> = {
      tags: feature.tags
        .filter((tag) => !tag.includes(':'))
        .map((tag) => asDirectiveTag(`@libar-docs-${tag}`)) as readonly DirectiveTag[],
      description: feature.description,
      examples: [],
      position: { startLine: feature.line, endLine: feature.line },
      status: metadata.status,
      phase: metadata.phase,
    };
    assignIfDefined(directive, 'patternName', metadata.pattern);
    assignIfDefined(directive, 'brief', metadata.brief);
    assignIfNonEmpty(directive, 'dependsOn', metadata.dependsOn);
    assignIfNonEmpty(directive, 'enables', metadata.enables);
    assignIfDefined(directive, 'quarter', metadata.quarter);
    assignIfDefined(directive, 'completed', metadata.completed);
    assignIfDefined(directive, 'effort', metadata.effort);
    assignIfDefined(directive, 'team', metadata.team);
    assignIfDefined(directive, 'workflow', metadata.workflow);
    assignIfDefined(directive, 'risk', metadata.risk);
    assignIfDefined(directive, 'priority', metadata.priority);

    const rawPattern: Record<string, unknown> = {
      id: patternId,
      name: patternName,
      category: asCategoryName(primaryCategory),
      directive,
      code: '',
      source: {
        file: asSourceFilePath(relativePath),
        lines: [feature.line, feature.line] as const,
      },
      exports: [],
      extractedAt: new Date().toISOString(),
      patternName,
      status: metadata.status,
    };

    if (metadata.phase !== undefined) rawPattern['phase'] = metadata.phase;
    assignIfDefined(rawPattern, 'release', metadata.release);
    assignIfDefined(rawPattern, 'brief', metadata.brief);
    assignIfNonEmpty(rawPattern, 'dependsOn', metadata.dependsOn);
    assignIfNonEmpty(rawPattern, 'enables', metadata.enables);
    // UML-inspired relationship fields (PatternRelationshipModel)
    assignIfNonEmpty(rawPattern, 'implementsPatterns', metadata.implementsPatterns);
    assignIfDefined(rawPattern, 'extendsPattern', metadata.extendsPattern);
    assignIfDefined(rawPattern, 'quarter', metadata.quarter);
    assignIfDefined(rawPattern, 'completed', metadata.completed);
    assignIfDefined(rawPattern, 'effort', metadata.effort);
    assignIfDefined(rawPattern, 'team', metadata.team);
    assignIfDefined(rawPattern, 'workflow', metadata.workflow);
    assignIfDefined(rawPattern, 'risk', metadata.risk);
    assignIfDefined(rawPattern, 'priority', metadata.priority);
    assignIfDefined(rawPattern, 'productArea', metadata.productArea);
    assignIfDefined(rawPattern, 'userRole', metadata.userRole);
    assignIfDefined(rawPattern, 'businessValue', metadata.businessValue);
    assignIfDefined(rawPattern, 'level', metadata.level);
    assignIfDefined(rawPattern, 'parent', metadata.parent);
    assignIfNonEmpty(rawPattern, 'discoveredGaps', metadata.discoveredGaps);
    assignIfNonEmpty(rawPattern, 'discoveredImprovements', metadata.discoveredImprovements);
    assignIfNonEmpty(rawPattern, 'discoveredRisks', metadata.discoveredRisks);
    assignIfNonEmpty(rawPattern, 'discoveredLearnings', metadata.discoveredLearnings);
    assignIfNonEmpty(rawPattern, 'constraints', metadata.constraints);
    assignIfDefined(rawPattern, 'adr', metadata.adr);
    assignIfDefined(rawPattern, 'adrStatus', metadata.adrStatus);
    assignIfDefined(rawPattern, 'adrCategory', metadata.adrCategory);
    assignIfDefined(rawPattern, 'adrSupersedes', metadata.adrSupersedes);
    assignIfDefined(rawPattern, 'adrSupersededBy', metadata.adrSupersededBy);
    // NOTE: ADR content derived from Gherkin Rule: keywords, not parsed markdown
    assignIfNonEmpty(rawPattern, 'whenToUse', whenToUse);

    if (scenarios.length > 0) {
      rawPattern['scenarios'] = scenarios.map((scenario) => {
        const scenarioRef: Record<string, unknown> = {
          featureFile: relativePath,
          featureName: feature.name,
          featureDescription: feature.description,
          scenarioName: scenario.name,
          semanticTags: scenario.tags.filter((tag) =>
            [
              'happy-path',
              'validation',
              'business-failure',
              'business-rule',
              'compensation',
              'idempotency',
              'expiration',
              'workflow-state',
            ].includes(tag)
          ),
          tags: scenario.tags,
          layer: inferFeatureLayer(filePath),
          line: scenario.line,
        };
        if (scenario.steps.length > 0) {
          scenarioRef['steps'] = scenario.steps.map((step) => {
            const stepObj: Record<string, unknown> = { keyword: step.keyword, text: step.text };
            assignIfDefined(stepObj, 'dataTable', step.dataTable);
            assignIfDefined(stepObj, 'docString', step.docString);
            return stepObj;
          });
        }
        return scenarioRef;
      });
    }

    assignIfNonEmpty(rawPattern, 'deliverables', deliverables);
    assignIfDefined(rawPattern, 'behaviorFile', behaviorFile);

    if (rules && rules.length > 0) {
      rawPattern['rules'] = rules.map((rule) => ({
        name: rule.name,
        description: rule.description,
        scenarioCount: rule.scenarios.length,
        scenarioNames: rule.scenarios.map((s) => s.name),
      }));
    }

    const validation = ExtractedPatternSchema.safeParse(rawPattern);
    if (!validation.success) {
      errors.push(
        createGherkinPatternValidationError(
          relativePath,
          patternName,
          'Schema validation failed',
          validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
        )
      );
      continue;
    }

    // Use explicit conditional to satisfy exactOptionalPropertyTypes
    // (undefined is not the same as "property not present")
    if (behaviorPathToVerify !== undefined) {
      patternsToVerify.push({ pattern: validation.data, behaviorPathToVerify });
    } else {
      patternsToVerify.push({ pattern: validation.data });
    }
  }

  // Second pass: Batch async verification of all behavior file paths
  const verificationPromises = patternsToVerify.map(async ({ pattern, behaviorPathToVerify }) => {
    if (behaviorPathToVerify) {
      const exists = await fileExistsAsync(behaviorPathToVerify);
      // Return pattern with behaviorFileVerified set
      return { ...pattern, behaviorFileVerified: exists } as ExtractedPattern;
    }
    return pattern;
  });

  const patterns = await Promise.all(verificationPromises);

  return { patterns, errors };
}

// NOTE: extractAdrContent() was removed as part of Issue #99.
// ADR content (context, decision, consequences) is now derived from
// Gherkin Rule: keywords instead of parsed markdown in feature descriptions.
// Rules prefixed with "Context -", "Decision -", "Consequences -" are
// semantically detected and rendered by the ADR codec.

/**
 * Compute children arrays from parent references
 *
 * Post-processing step that populates the `children` field on each pattern
 * by finding all patterns that reference it via their `parent` field.
 *
 * This enables bidirectional hierarchy navigation:
 * - Child → Parent: via `parent` field (explicit in feature file)
 * - Parent → Children: via `children` field (computed here)
 *
 * **Performance Note:** This function does NOT re-validate patterns through
 * the schema because:
 * 1. Input patterns have already been validated by extractPatternsFromGherkin()
 * 2. We're only adding a `children: string[]` field which matches the schema
 * 3. Re-validation of the complex ExtractedPatternSchema is expensive (~320 lines)
 *
 * This invariant is safe because:
 * - The children array is derived from validated pattern names
 * - ExtractedPatternSchema.children is defined as `z.array(z.string()).readonly().optional()`
 *
 * @param patterns - Array of validated ExtractedPattern objects
 * @returns New array with `children` populated (does not mutate input)
 *
 * @example
 * ```typescript
 * const rawPatterns = extractPatternsFromGherkin(files, config);
 * const patternsWithHierarchy = computeHierarchyChildren(rawPatterns);
 *
 * // Now epic patterns have children arrays
 * const epic = patternsWithHierarchy.find(p => p.level === 'epic');
 * console.log(epic.children); // ["PhaseA", "PhaseB"]
 * ```
 */
export function computeHierarchyChildren(
  patterns: readonly ExtractedPattern[]
): ExtractedPattern[] {
  // Build a map: parent name → child names
  const parentToChildren = new Map<string, string[]>();

  for (const pattern of patterns) {
    if (pattern.parent) {
      const children = parentToChildren.get(pattern.parent) ?? [];
      // Use patternName if available, otherwise fall back to name
      const childName = pattern.patternName ?? pattern.name;
      children.push(childName);
      parentToChildren.set(pattern.parent, children);
    }
  }

  // Apply children arrays to patterns
  // No re-validation needed - input is already validated and we're only adding children: string[]
  return patterns.map((pattern) => {
    const patternName = pattern.patternName ?? pattern.name;
    const children = parentToChildren.get(patternName);

    if (children && children.length > 0) {
      // Type-safe spread: pattern is validated ExtractedPattern, children is string[]
      // This matches ExtractedPatternSchema.children: z.array(z.string()).readonly().optional()
      return { ...pattern, children } as ExtractedPattern;
    }

    return pattern;
  });
}
