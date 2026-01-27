import { z } from 'zod';

// =============================================================================
// RUNTIME GHERKIN TYPES (from Cucumber parser)
// =============================================================================
// These schemas match the raw AST output from @cucumber/gherkin parser.
// They are more permissive than Parsed* schemas to handle all valid Gherkin.

/**
 * A row in a Gherkin DataTable - maps column headers to cell values
 */
export type GherkinDataTableRow = Readonly<Record<string, string>>;

/**
 * Schema for a Gherkin DataTable attached to a step
 *
 * DataTables provide structured data for steps, commonly used for:
 * - Deliverables lists in Background sections
 * - Test data for scenarios
 * - Configuration parameters
 */
export const GherkinDataTableSchema = z
  .object({
    /** Column headers from the first row */
    headers: z.array(z.string()).readonly(),
    /** Data rows (excluding header row), each row maps column name to value */
    rows: z.array(z.record(z.string(), z.string())).readonly(),
  })
  .strict();

/**
 * Schema for a DocString attached to a step
 *
 * DocStrings can have an optional mediaType that specifies the content language
 * (e.g., "typescript", "json", "jsdoc") for proper syntax highlighting.
 */
export const GherkinDocStringSchema = z
  .object({
    /** The DocString content */
    content: z.string(),
    /** Optional media type / language hint (e.g., "typescript", "json", "jsdoc") */
    mediaType: z.string().optional(),
  })
  .strict();

export type GherkinDocString = z.infer<typeof GherkinDocStringSchema>;

/**
 * Schema for a step within a Background or Scenario
 *
 * Uses flexible string for keyword to handle any Cucumber parser output.
 */
export const GherkinStepSchema = z
  .object({
    /** Step keyword (Given, When, Then, And, But) - flexible string for parser compat */
    keyword: z.string().min(1),
    /** Step text */
    text: z.string(),
    /** Optional DataTable attached to this step */
    dataTable: GherkinDataTableSchema.optional(),
    /** Optional DocString attached to this step (with content and optional mediaType) */
    docString: GherkinDocStringSchema.optional(),
  })
  .strict();

/**
 * Schema for a Background section that runs before each scenario
 *
 * Used for shared setup steps and, in our case, deliverables metadata.
 */
export const GherkinBackgroundSchema = z
  .object({
    /** Background name (often empty or "Deliverables") */
    name: z.string(),
    /** Background description (if any) */
    description: z.string().optional(),
    /** Background steps with potential DataTables */
    steps: z.array(GherkinStepSchema).readonly(),
    /** Line number where background starts */
    line: z.number().int().positive(),
  })
  .strict();

/**
 * Schema for a single scenario within a Gherkin feature
 */
export const GherkinScenarioSchema = z
  .object({
    /** Scenario name */
    name: z.string(),
    /** Scenario description (if any) */
    description: z.string().optional(),
    /** Tags applied to this scenario */
    tags: z.array(z.string()).readonly(),
    /** Scenario steps with full DataTable/DocString support */
    steps: z.array(GherkinStepSchema).readonly(),
    /** Line number where scenario starts */
    line: z.number().int().positive(),
  })
  .strict();

/**
 * Schema for a Gherkin Rule (business rule grouping)
 *
 * Rules group related scenarios under a business rule name.
 * The description often contains rationale, exceptions, and see-also references.
 *
 * @example
 * ```gherkin
 * Rule: Tag registry must define all new metadata tags
 *
 *   The tag registry is the single source of truth for all process metadata.
 *   Each new tag must be fully specified with format, purpose, and examples.
 *
 *   # RATIONALE: Centralized tag definitions prevent inconsistent usage
 *   # SEE-ALSO: src/taxonomy/, PDR-003
 *
 *   @acceptance-criteria
 *   Scenario: New tags are defined in tag registry
 *     Given the src/taxonomy/ TypeScript module
 *     Then it should contain metadataTags for risk, effort-actual...
 * ```
 */
export const GherkinRuleSchema = z
  .object({
    /** Rule name (the business rule statement) */
    name: z.string(),
    /** Rule description with context, rationale, exceptions */
    description: z.string(),
    /** Tags applied to this rule */
    tags: z.array(z.string()).readonly(),
    /** Scenarios that verify this rule */
    scenarios: z.array(GherkinScenarioSchema).readonly(),
    /** Line number where rule starts */
    line: z.number().int().positive(),
  })
  .strict();

/**
 * Schema for a Gherkin feature file's parsed content
 */
export const GherkinFeatureSchema = z
  .object({
    /** Feature name */
    name: z.string(),
    /** Feature description */
    description: z.string(),
    /** Tags applied to the feature */
    tags: z.array(z.string()).readonly(),
    /** Language of the feature file (default: 'en') */
    language: z.string().default('en'),
    /** Line number where feature starts */
    line: z.number().int().positive(),
  })
  .strict();

/**
 * Schema for result of scanning a single .feature file
 */
export const ScannedGherkinFileSchema = z
  .object({
    /** Absolute path to the feature file */
    filePath: z.string(),
    /** Parsed feature information */
    feature: GherkinFeatureSchema,
    /** Background section (if present) - used for deliverables */
    background: GherkinBackgroundSchema.optional(),
    /** Rules in this feature (Gherkin v6+ business rule groupings) */
    rules: z.array(GherkinRuleSchema).readonly().optional(),
    /** Scenarios in this feature (includes those flattened from Rules for backward compat) */
    scenarios: z.array(GherkinScenarioSchema).readonly(),
  })
  .strict();

/**
 * Schema for information about a feature file that failed to parse
 */
export const GherkinFileErrorSchema = z
  .object({
    file: z.string(),
    error: z
      .object({
        message: z.string(),
        line: z.number().optional(),
        column: z.number().optional(),
      })
      .strict(),
  })
  .strict();

/**
 * Schema for results of scanning multiple .feature files
 */
export const GherkinScanResultsSchema = z
  .object({
    /** Successfully scanned feature files */
    files: z.array(ScannedGherkinFileSchema).readonly(),
    /** Files that failed to parse */
    errors: z.array(GherkinFileErrorSchema).readonly(),
  })
  .strict();

// Export inferred runtime types (replaces gherkin-types.ts interfaces)
export type GherkinDataTable = z.infer<typeof GherkinDataTableSchema>;
export type GherkinStep = z.infer<typeof GherkinStepSchema>;
export type GherkinBackground = z.infer<typeof GherkinBackgroundSchema>;
export type GherkinScenario = z.infer<typeof GherkinScenarioSchema>;
export type GherkinRule = z.infer<typeof GherkinRuleSchema>;
export type GherkinFeature = z.infer<typeof GherkinFeatureSchema>;
export type ScannedGherkinFile = z.infer<typeof ScannedGherkinFileSchema>;
export type GherkinFileError = z.infer<typeof GherkinFileErrorSchema>;
export type GherkinScanResults = z.infer<typeof GherkinScanResultsSchema>;

// =============================================================================
// PROCESSED/VALIDATED FEATURE TYPES (for extraction pipeline)
// =============================================================================
// These schemas are for processed feature data after transformation.
// They have stricter requirements for validation.

/**
 * Schema for a processed Gherkin step (Given/When/Then/And/But)
 *
 * Uses enum for keyword to enforce valid step types after processing.
 */
export const ParsedStepSchema = z.object({
  keyword: z.enum(['Given', 'When', 'Then', 'And', 'But']),
  text: z.string().min(1),
  dataTable: z.array(z.record(z.string(), z.string())).optional(),
  docString: GherkinDocStringSchema.optional(),
});

/**
 * Schema for a processed Gherkin scenario
 */
export const ParsedScenarioSchema = z.object({
  name: z.string().min(1),
  tags: z.array(z.string()),
  steps: z.array(ParsedStepSchema),
});

/**
 * Schema for processed Gherkin background
 *
 * Includes full step data (with dataTable/docString) for rich extraction.
 */
export const ParsedBackgroundSchema = z.object({
  /** Background name (optional, e.g., "Deliverables") */
  name: z.string().optional(),
  /** Background description text */
  description: z.string().optional(),
  /** Background steps with full Given/When/Then data */
  steps: z.array(ParsedStepSchema),
  /** Source line number */
  line: z.number().int().positive().optional(),
});

/**
 * Schema for a complete processed Gherkin feature
 */
export const ParsedFeatureSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()),
  background: ParsedBackgroundSchema.optional(),
  scenarios: z.array(ParsedScenarioSchema),
});

/**
 * Schema for a feature file with path
 */
export const FeatureFileSchema = z.object({
  filePath: z.string(),
  feature: ParsedFeatureSchema,
});

// Export inferred processed types
export type ParsedStep = z.infer<typeof ParsedStepSchema>;
export type ParsedScenario = z.infer<typeof ParsedScenarioSchema>;
export type ParsedBackground = z.infer<typeof ParsedBackgroundSchema>;
export type ParsedFeature = z.infer<typeof ParsedFeatureSchema>;
export type FeatureFile = z.infer<typeof FeatureFileSchema>;
