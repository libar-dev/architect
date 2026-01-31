import { z } from 'zod';
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
export declare const GherkinDataTableSchema: z.ZodObject<{
    headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
}, z.core.$strict>;
/**
 * Schema for a DocString attached to a step
 *
 * DocStrings can have an optional mediaType that specifies the content language
 * (e.g., "typescript", "json", "jsdoc") for proper syntax highlighting.
 */
export declare const GherkinDocStringSchema: z.ZodObject<{
    content: z.ZodString;
    mediaType: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type GherkinDocString = z.infer<typeof GherkinDocStringSchema>;
/**
 * Schema for an Examples table in a Scenario Outline
 *
 * Examples tables define parameter values for Scenario Outline iterations.
 * Each Examples block can have its own name, tags, and data rows.
 */
export declare const GherkinExamplesSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
    line: z.ZodNumber;
}, z.core.$strict>;
export type GherkinExamples = z.infer<typeof GherkinExamplesSchema>;
/**
 * Schema for a step within a Background or Scenario
 *
 * Uses flexible string for keyword to handle any Cucumber parser output.
 */
export declare const GherkinStepSchema: z.ZodObject<{
    keyword: z.ZodString;
    text: z.ZodString;
    dataTable: z.ZodOptional<z.ZodObject<{
        headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
    }, z.core.$strict>>;
    docString: z.ZodOptional<z.ZodObject<{
        content: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
/**
 * Schema for a Background section that runs before each scenario
 *
 * Used for shared setup steps and, in our case, deliverables metadata.
 */
export declare const GherkinBackgroundSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        keyword: z.ZodString;
        text: z.ZodString;
        dataTable: z.ZodOptional<z.ZodObject<{
            headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
        }, z.core.$strict>>;
        docString: z.ZodOptional<z.ZodObject<{
            content: z.ZodString;
            mediaType: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    line: z.ZodNumber;
}, z.core.$strict>;
/**
 * Schema for a single scenario within a Gherkin feature
 *
 * For Scenario Outlines, the examples field contains the Examples tables.
 * Regular Scenarios have no examples (field is undefined or empty).
 */
export declare const GherkinScenarioSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        keyword: z.ZodString;
        text: z.ZodString;
        dataTable: z.ZodOptional<z.ZodObject<{
            headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
        }, z.core.$strict>>;
        docString: z.ZodOptional<z.ZodObject<{
            content: z.ZodString;
            mediaType: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    examples: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
        line: z.ZodNumber;
    }, z.core.$strict>>>>;
    line: z.ZodNumber;
}, z.core.$strict>;
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
export declare const GherkinRuleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    scenarios: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
            keyword: z.ZodString;
            text: z.ZodString;
            dataTable: z.ZodOptional<z.ZodObject<{
                headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
            }, z.core.$strict>>;
            docString: z.ZodOptional<z.ZodObject<{
                content: z.ZodString;
                mediaType: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>>>;
        examples: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
            line: z.ZodNumber;
        }, z.core.$strict>>>>;
        line: z.ZodNumber;
    }, z.core.$strict>>>;
    line: z.ZodNumber;
}, z.core.$strict>;
/**
 * Schema for a Gherkin feature file's parsed content
 */
export declare const GherkinFeatureSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    language: z.ZodDefault<z.ZodString>;
    line: z.ZodNumber;
}, z.core.$strict>;
/**
 * Schema for result of scanning a single .feature file
 */
export declare const ScannedGherkinFileSchema: z.ZodObject<{
    filePath: z.ZodString;
    feature: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        language: z.ZodDefault<z.ZodString>;
        line: z.ZodNumber;
    }, z.core.$strict>;
    background: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
            keyword: z.ZodString;
            text: z.ZodString;
            dataTable: z.ZodOptional<z.ZodObject<{
                headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
            }, z.core.$strict>>;
            docString: z.ZodOptional<z.ZodObject<{
                content: z.ZodString;
                mediaType: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>>>;
        line: z.ZodNumber;
    }, z.core.$strict>>;
    rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        scenarios: z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
                keyword: z.ZodString;
                text: z.ZodString;
                dataTable: z.ZodOptional<z.ZodObject<{
                    headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                    rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                }, z.core.$strict>>;
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strict>>>;
            examples: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                line: z.ZodNumber;
            }, z.core.$strict>>>>;
            line: z.ZodNumber;
        }, z.core.$strict>>>;
        line: z.ZodNumber;
    }, z.core.$strict>>>>;
    scenarios: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
            keyword: z.ZodString;
            text: z.ZodString;
            dataTable: z.ZodOptional<z.ZodObject<{
                headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
            }, z.core.$strict>>;
            docString: z.ZodOptional<z.ZodObject<{
                content: z.ZodString;
                mediaType: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>>>;
        examples: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
            line: z.ZodNumber;
        }, z.core.$strict>>>>;
        line: z.ZodNumber;
    }, z.core.$strict>>>;
}, z.core.$strict>;
/**
 * Schema for information about a feature file that failed to parse
 */
export declare const GherkinFileErrorSchema: z.ZodObject<{
    file: z.ZodString;
    error: z.ZodObject<{
        message: z.ZodString;
        line: z.ZodOptional<z.ZodNumber>;
        column: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
}, z.core.$strict>;
/**
 * Schema for results of scanning multiple .feature files
 */
export declare const GherkinScanResultsSchema: z.ZodObject<{
    files: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        feature: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            language: z.ZodDefault<z.ZodString>;
            line: z.ZodNumber;
        }, z.core.$strict>;
        background: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
                keyword: z.ZodString;
                text: z.ZodString;
                dataTable: z.ZodOptional<z.ZodObject<{
                    headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                    rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                }, z.core.$strict>>;
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strict>>>;
            line: z.ZodNumber;
        }, z.core.$strict>>;
        rules: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            scenarios: z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    keyword: z.ZodString;
                    text: z.ZodString;
                    dataTable: z.ZodOptional<z.ZodObject<{
                        headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                        rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                    }, z.core.$strict>>;
                    docString: z.ZodOptional<z.ZodObject<{
                        content: z.ZodString;
                        mediaType: z.ZodOptional<z.ZodString>;
                    }, z.core.$strict>>;
                }, z.core.$strict>>>;
                examples: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodOptional<z.ZodString>;
                    tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                    headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                    rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                    line: z.ZodNumber;
                }, z.core.$strict>>>>;
                line: z.ZodNumber;
            }, z.core.$strict>>>;
            line: z.ZodNumber;
        }, z.core.$strict>>>>;
        scenarios: z.ZodReadonly<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
            steps: z.ZodReadonly<z.ZodArray<z.ZodObject<{
                keyword: z.ZodString;
                text: z.ZodString;
                dataTable: z.ZodOptional<z.ZodObject<{
                    headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                    rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                }, z.core.$strict>>;
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strict>>>;
            examples: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                tags: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                headers: z.ZodReadonly<z.ZodArray<z.ZodString>>;
                rows: z.ZodReadonly<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                line: z.ZodNumber;
            }, z.core.$strict>>>>;
            line: z.ZodNumber;
        }, z.core.$strict>>>;
    }, z.core.$strict>>>;
    errors: z.ZodReadonly<z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        error: z.ZodObject<{
            message: z.ZodString;
            line: z.ZodOptional<z.ZodNumber>;
            column: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type GherkinDataTable = z.infer<typeof GherkinDataTableSchema>;
export type GherkinStep = z.infer<typeof GherkinStepSchema>;
export type GherkinBackground = z.infer<typeof GherkinBackgroundSchema>;
export type GherkinScenario = z.infer<typeof GherkinScenarioSchema>;
export type GherkinRule = z.infer<typeof GherkinRuleSchema>;
export type GherkinFeature = z.infer<typeof GherkinFeatureSchema>;
export type ScannedGherkinFile = z.infer<typeof ScannedGherkinFileSchema>;
export type GherkinFileError = z.infer<typeof GherkinFileErrorSchema>;
export type GherkinScanResults = z.infer<typeof GherkinScanResultsSchema>;
/**
 * Schema for a processed Gherkin step (Given/When/Then/And/But)
 *
 * Uses enum for keyword to enforce valid step types after processing.
 */
export declare const ParsedStepSchema: z.ZodObject<{
    keyword: z.ZodEnum<{
        Given: "Given";
        When: "When";
        Then: "Then";
        And: "And";
        But: "But";
    }>;
    text: z.ZodString;
    dataTable: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
    docString: z.ZodOptional<z.ZodObject<{
        content: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strip>;
/**
 * Schema for a processed Gherkin scenario
 */
export declare const ParsedScenarioSchema: z.ZodObject<{
    name: z.ZodString;
    tags: z.ZodArray<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        keyword: z.ZodEnum<{
            Given: "Given";
            When: "When";
            Then: "Then";
            And: "And";
            But: "But";
        }>;
        text: z.ZodString;
        dataTable: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
        docString: z.ZodOptional<z.ZodObject<{
            content: z.ZodString;
            mediaType: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Schema for processed Gherkin background
 *
 * Includes full step data (with dataTable/docString) for rich extraction.
 */
export declare const ParsedBackgroundSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        keyword: z.ZodEnum<{
            Given: "Given";
            When: "When";
            Then: "Then";
            And: "And";
            But: "But";
        }>;
        text: z.ZodString;
        dataTable: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
        docString: z.ZodOptional<z.ZodObject<{
            content: z.ZodString;
            mediaType: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strip>>;
    line: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Schema for a complete processed Gherkin feature
 */
export declare const ParsedFeatureSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    tags: z.ZodArray<z.ZodString>;
    background: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodArray<z.ZodObject<{
            keyword: z.ZodEnum<{
                Given: "Given";
                When: "When";
                Then: "Then";
                And: "And";
                But: "But";
            }>;
            text: z.ZodString;
            dataTable: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
            docString: z.ZodOptional<z.ZodObject<{
                content: z.ZodString;
                mediaType: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strip>>;
        line: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    scenarios: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        tags: z.ZodArray<z.ZodString>;
        steps: z.ZodArray<z.ZodObject<{
            keyword: z.ZodEnum<{
                Given: "Given";
                When: "When";
                Then: "Then";
                And: "And";
                But: "But";
            }>;
            text: z.ZodString;
            dataTable: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
            docString: z.ZodOptional<z.ZodObject<{
                content: z.ZodString;
                mediaType: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Schema for a feature file with path
 */
export declare const FeatureFileSchema: z.ZodObject<{
    filePath: z.ZodString;
    feature: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        tags: z.ZodArray<z.ZodString>;
        background: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            steps: z.ZodArray<z.ZodObject<{
                keyword: z.ZodEnum<{
                    Given: "Given";
                    When: "When";
                    Then: "Then";
                    And: "And";
                    But: "But";
                }>;
                text: z.ZodString;
                dataTable: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strip>>;
            line: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        scenarios: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            tags: z.ZodArray<z.ZodString>;
            steps: z.ZodArray<z.ZodObject<{
                keyword: z.ZodEnum<{
                    Given: "Given";
                    When: "When";
                    Then: "Then";
                    And: "And";
                    But: "But";
                }>;
                text: z.ZodString;
                dataTable: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodString>>>;
                docString: z.ZodOptional<z.ZodObject<{
                    content: z.ZodString;
                    mediaType: z.ZodOptional<z.ZodString>;
                }, z.core.$strict>>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ParsedStep = z.infer<typeof ParsedStepSchema>;
export type ParsedScenario = z.infer<typeof ParsedScenarioSchema>;
export type ParsedBackground = z.infer<typeof ParsedBackgroundSchema>;
export type ParsedFeature = z.infer<typeof ParsedFeatureSchema>;
export type FeatureFile = z.infer<typeof FeatureFileSchema>;
//# sourceMappingURL=feature.d.ts.map