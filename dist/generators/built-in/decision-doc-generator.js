/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DecisionDocGenerator
 * @libar-docs-status completed
 * @libar-docs-phase 27
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-depends-on DecisionDocCodec,SourceMapper
 *
 * ## Decision Doc Generator - Documentation from Decision Documents
 *
 * Orchestrates the full pipeline for generating documentation from decision
 * documents (ADR/PDR in .feature format):
 *
 * 1. Decision parsing - Extract source mappings, rules, DocStrings
 * 2. Source mapping - Aggregate content from TypeScript, Gherkin, decision sources
 * 3. Content assembly - Build RenderableDocument from aggregated sections
 * 4. Multi-level output - Generate compact (_claude-md/) and detailed (docs/) versions
 *
 * ### When to Use
 *
 * - When generating documentation from ADR/PDR decision documents
 * - When decision documents contain source mapping tables
 * - When building progressive disclosure docs at multiple detail levels
 *
 * ### Output Path Convention
 *
 * - Compact: `_claude-md/{section}/{module}.md` (~50 lines)
 * - Detailed: `docs/{PATTERN-NAME}.md` (~300 lines)
 */
import { heading, paragraph, code, table, list, separator, collapsible, document as createDocument, } from '../../renderable/schema.js';
import { renderToMarkdown } from '../../renderable/render.js';
import { parseDecisionDocument, } from '../../renderable/codecs/decision-doc.js';
import { parseDescriptionWithDocStrings, parseBusinessRuleAnnotations, renderPropertyDocsTable, } from '../../renderable/codecs/helpers.js';
import { extractTablesFromDescription } from '../../renderable/codecs/convention-extractor.js';
import { executeSourceMapping, } from '../source-mapper.js';
import { toKebabCase, toUpperKebabCase } from '../../utils/string-utils.js';
import { createWarningCollector, } from '../warning-collector.js';
import { validateSourceMappingTable } from '../source-mapping-validator.js';
import { deduplicateSections } from '../content-deduplicator.js';
// =============================================================================
// Tag Helpers
// =============================================================================
/**
 * Extract claude-md-section from pattern tags
 *
 * Looks for `@libar-docs-claude-md-section:VALUE` tag and extracts the value.
 * Returns undefined if tag not found.
 *
 * @param pattern - Extracted pattern with directive tags
 * @returns Section value (e.g., "validation") or undefined
 *
 * @example
 * ```typescript
 * // Pattern with @libar-docs-claude-md-section:validation tag
 * const section = extractClaudeMdSection(pattern);
 * // Returns: "validation"
 * ```
 */
export function extractClaudeMdSection(pattern) {
    const tags = pattern.directive.tags;
    for (const tag of tags) {
        // Match @libar-docs-claude-md-section:VALUE or @docs-claude-md-section:VALUE
        const match = /^@(?:libar-)?docs-claude-md-section[:\s]+(.+)$/i.exec(tag);
        if (match?.[1]) {
            return match[1].trim();
        }
    }
    return undefined;
}
// =============================================================================
// Output Path Resolution
// =============================================================================
/**
 * Determine output paths from decision metadata
 *
 * Uses pattern name and optional section to compute paths:
 * - Compact: _claude-md/{section}/{module}.md
 * - Detailed: docs/{PATTERN-NAME}.md
 *
 * @param patternName - Pattern name from decision document
 * @param options - Generator options including section override
 * @returns Computed output paths
 *
 * @example
 * ```typescript
 * const paths = determineOutputPaths('ProcessGuard', { section: 'validation' });
 * // Returns:
 * // {
 * //   compact: '_claude-md/validation/process-guard.md',
 * //   detailed: 'docs/PROCESS-GUARD.md'
 * // }
 * ```
 */
export function determineOutputPaths(patternName, options) {
    // Convert PatternName to kebab-case for module name
    const moduleName = toKebabCase(patternName);
    // Use provided section or default to 'generated'
    const section = options?.section ?? 'generated';
    // Convert PatternName to UPPER-KEBAB-CASE for detailed path
    const upperKebab = toUpperKebabCase(patternName);
    return {
        compact: `_claude-md/${section}/${moduleName}.md`,
        detailed: `docs/${upperKebab}.md`,
    };
}
// =============================================================================
// Content Generation
// =============================================================================
/**
 * Generate compact/summary output (~50 lines)
 *
 * Includes only essential tables and type definitions.
 * Suitable for Claude MD context files.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for compact output
 */
export function generateCompactOutput(decisionContent, aggregatedContent) {
    const sections = [];
    // Title and brief
    sections.push(heading(2, 'Overview'));
    // Extract key tables and types from aggregated sections
    for (const extracted of aggregatedContent.sections) {
        // Only include sections with substantial content
        if (!extracted.content || extracted.content.trim().length === 0) {
            continue;
        }
        // For compact output, only include:
        // 1. Type/interface definitions (shapes)
        // 2. Key tables
        if (extracted.shapes && extracted.shapes.length > 0) {
            sections.push(heading(3, extracted.section));
            // Render shapes as compact type list
            const typeList = extracted.shapes.map((shape) => `\`${shape.name}\` - ${shape.kind}`);
            sections.push(list(typeList));
        }
        else if (extracted.content.includes('|')) {
            // Content contains a table - include it
            sections.push(heading(3, extracted.section));
            sections.push(paragraph(extracted.content));
        }
    }
    // If no sections were added, add a placeholder
    if (sections.length <= 1) {
        sections.push(paragraph('*No structured content extracted.*'));
    }
    return createDocument(decisionContent.patternName, sections, {
        purpose: 'Compact reference for Claude context',
        detailLevel: 'summary',
    });
}
/**
 * Render a rule description using structured annotation parsing.
 *
 * Extracts `**Invariant:**`, `**Rationale:**`, `**Verified by:**`, tables, and
 * code examples for polished output with proper table formatting.
 *
 * @param description - Raw rule description text from Gherkin Rule: block
 * @returns Array of SectionBlocks with structured content
 */
function renderRuleDescription(description) {
    const blocks = [];
    const annotations = parseBusinessRuleAnnotations(description);
    // 1. Render structured annotations first (extracted cleanly)
    if (annotations.invariant) {
        blocks.push(paragraph(`**Invariant:** ${annotations.invariant}`));
    }
    if (annotations.rationale) {
        blocks.push(paragraph(`**Rationale:** ${annotations.rationale}`));
    }
    // 2. Extract tables and render with proper markdown formatting (separator rows)
    const tables = extractTablesFromDescription(description);
    for (const tbl of tables) {
        const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
        blocks.push(table([...tbl.headers], rows));
    }
    // 3. Render remaining content with interleaved DocStrings preserved.
    //    Strip known annotations and table lines from the original description,
    //    then pass through parseDescriptionWithDocStrings which preserves
    //    text → code → text → code ordering.
    let stripped = description;
    stripped = stripped.replace(/\*\*Invariant:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
    stripped = stripped.replace(/\*\*Rationale:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
    stripped = stripped.replace(/\*\*Verified by:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
    stripped = stripped
        .split('\n')
        .filter((line) => {
        const trimmed = line.trim();
        return !(trimmed.startsWith('|') && trimmed.endsWith('|'));
    })
        .join('\n');
    const strippedTrimmed = stripped.trim();
    if (strippedTrimmed.length > 0) {
        blocks.push(...parseDescriptionWithDocStrings(strippedTrimmed));
    }
    // 4. Render verified-by list last
    if (annotations.verifiedBy && annotations.verifiedBy.length > 0) {
        blocks.push(paragraph('**Verified by:**'));
        blocks.push(list([...annotations.verifiedBy]));
    }
    return blocks;
}
/**
 * Generate detailed output (~300 lines)
 *
 * Includes everything: JSDoc, examples, full descriptions.
 * Suitable for docs/ directory.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for detailed output
 */
export function generateDetailedOutput(decisionContent, aggregatedContent) {
    const sections = [];
    // Track rendered DocString content to prevent duplicates
    // Key is content hash (language + content) to identify unique DocStrings
    const renderedDocStrings = new Set();
    // Feature description
    if (decisionContent.description && decisionContent.description.trim().length > 0) {
        sections.push(paragraph(decisionContent.description));
        sections.push(separator());
    }
    // Context section from rules
    if (decisionContent.rules.context.length > 0) {
        sections.push(heading(2, 'Context'));
        for (const rule of decisionContent.rules.context) {
            sections.push(heading(3, rule.name.replace(/^Context\s*[-:]\s*/i, '')));
            if (rule.description) {
                sections.push(...renderRuleDescription(rule.description));
            }
        }
    }
    // Decision section from rules
    if (decisionContent.rules.decision.length > 0) {
        sections.push(heading(2, 'Decision'));
        for (const rule of decisionContent.rules.decision) {
            sections.push(heading(3, rule.name.replace(/^Decision\s*[-:]\s*/i, '')));
            if (rule.description) {
                sections.push(...renderRuleDescription(rule.description));
            }
        }
    }
    // Aggregated content sections
    // Include all sections from Source Mapping - both external files AND self-references
    // The Source Mapping table defines the canonical order of content
    // Self-references to rules will be rendered here, and we filter them from "Other rules" below
    const nonDuplicateSections = aggregatedContent.sections.filter((extracted) => {
        // Skip empty content
        if (!extracted.content || extracted.content.trim().length === 0) {
            return false;
        }
        return true;
    });
    if (nonDuplicateSections.length > 0) {
        sections.push(heading(2, 'Implementation Details'));
        for (const extracted of nonDuplicateSections) {
            sections.push(heading(3, extracted.section));
            // Handle different content types
            if (extracted.shapes && extracted.shapes.length > 0) {
                // Render full shape definitions with JSDoc
                for (const shape of extracted.shapes) {
                    // Include JSDoc as part of the code block (combined with source)
                    const fullSource = shape.jsDoc ? `${shape.jsDoc}\n${shape.sourceText}` : shape.sourceText;
                    sections.push(code(fullSource, 'typescript'));
                    // Add property description table for interfaces with documented properties
                    const propertyTable = renderPropertyDocsTable(shape.propertyDocs);
                    if (propertyTable) {
                        sections.push(paragraph(propertyTable));
                    }
                }
            }
            else if (extracted.docStrings && extracted.docStrings.length > 0) {
                // Check if content has meaningful text beyond just DocStrings
                // Rule block extractions include context text, tables, AND DocStrings
                // We should render full content to preserve all text, not just DocStrings
                const contentWithoutDocStrings = extracted.content
                    .replace(/"""[\w]*\n[\s\S]*?"""/g, '') // Remove Gherkin DocStrings
                    .replace(/```[\w]*\n[\s\S]*?```/g, '') // Remove markdown code blocks
                    .trim();
                if (contentWithoutDocStrings.length > 0) {
                    // Content has text beyond DocStrings - render full content with inline DocStrings
                    sections.push(...parseDescriptionWithDocStrings(extracted.content));
                }
                else {
                    // Content is ONLY DocStrings - render them as code blocks, skipping duplicates
                    for (const ds of extracted.docStrings) {
                        const contentKey = `${ds.language}:${ds.content}`;
                        if (!renderedDocStrings.has(contentKey)) {
                            renderedDocStrings.add(contentKey);
                            sections.push(code(ds.content, ds.language));
                        }
                    }
                }
            }
            else {
                // Plain content - convert DocStrings to code fences
                sections.push(...parseDescriptionWithDocStrings(extracted.content));
            }
        }
    }
    // Consequences section from rules
    if (decisionContent.rules.consequences.length > 0) {
        sections.push(heading(2, 'Consequences'));
        for (const rule of decisionContent.rules.consequences) {
            sections.push(heading(3, rule.name.replace(/^Consequence[s]?\s*[-:]\s*/i, '')));
            if (rule.description) {
                sections.push(...renderRuleDescription(rule.description));
            }
        }
    }
    // Other rules (custom sections)
    // Skip if these rules are already covered by Source Mapping entries
    // to prevent duplicate content in reference documentation
    if (decisionContent.rules.other.length > 0) {
        // Build set of section names from Source Mapping (both self-references and external files)
        const sourceMappedSectionNames = new Set();
        for (const mapping of decisionContent.sourceMappings) {
            // Normalize section name for matching (case-insensitive)
            const normalizedSection = mapping.section.toLowerCase().trim();
            sourceMappedSectionNames.add(normalizedSection);
        }
        // Helper: extract significant words (3+ chars) for fuzzy matching
        const getWords = (text) => new Set(text
            .toLowerCase()
            .split(/[^a-z]+/)
            .filter((w) => w.length >= 3));
        // Only render rules that aren't covered by Source Mapping section names
        for (const rule of decisionContent.rules.other) {
            const ruleName = rule.name.toLowerCase().trim();
            const ruleWords = getWords(ruleName);
            // Check if any Source Mapping section matches this rule name
            // Match if: exact match, substring match, or 2+ words overlap
            const isCovered = Array.from(sourceMappedSectionNames).some((sectionName) => {
                // Exact or substring match
                if (ruleName === sectionName ||
                    ruleName.includes(sectionName) ||
                    sectionName.includes(ruleName)) {
                    return true;
                }
                // Word overlap match (at least 2 significant words)
                const sectionWords = getWords(sectionName);
                let matches = 0;
                for (const word of ruleWords) {
                    if (sectionWords.has(word))
                        matches++;
                }
                return matches >= 2;
            });
            if (!isCovered) {
                sections.push(heading(2, rule.name));
                if (rule.description) {
                    sections.push(...renderRuleDescription(rule.description));
                }
            }
        }
    }
    // DocStrings if not already included
    if (decisionContent.docStrings.length > 0 && aggregatedContent.sections.length === 0) {
        sections.push(heading(2, 'Examples'));
        for (const ds of decisionContent.docStrings) {
            sections.push(code(ds.content, ds.language));
        }
    }
    // Add generation warnings if any
    if (aggregatedContent.warnings.length > 0) {
        sections.push(separator());
        sections.push(collapsible('Generation Warnings', aggregatedContent.warnings.map((w) => paragraph(`- ${w.severity}: ${w.message}`))));
    }
    return createDocument(decisionContent.patternName, sections, {
        purpose: 'Full documentation generated from decision document',
        detailLevel: 'detailed',
    });
}
/**
 * Generate standard output (~150 lines)
 *
 * Balance between compact and detailed: tables, types, key descriptions.
 * Suitable for general documentation.
 *
 * @param decisionContent - Parsed decision document
 * @param aggregatedContent - Content from source mapping execution
 * @returns RenderableDocument for standard output
 */
export function generateStandardOutput(decisionContent, aggregatedContent) {
    const sections = [];
    // Brief description
    if (decisionContent.description && decisionContent.description.trim().length > 0) {
        const briefDesc = decisionContent.description.split('\n').slice(0, 3).join('\n');
        sections.push(paragraph(briefDesc));
        sections.push(separator());
    }
    // Context summary
    if (decisionContent.rules.context.length > 0) {
        sections.push(heading(2, 'Context'));
        const contextNames = decisionContent.rules.context.map((r) => r.name.replace(/^Context\s*[-:]\s*/i, ''));
        sections.push(list(contextNames));
    }
    // Decision summary
    if (decisionContent.rules.decision.length > 0) {
        sections.push(heading(2, 'Decision'));
        for (const rule of decisionContent.rules.decision) {
            sections.push(heading(3, rule.name.replace(/^Decision\s*[-:]\s*/i, '')));
            // First paragraph only
            if (rule.description) {
                const firstPara = rule.description.split('\n\n')[0] ?? '';
                sections.push(paragraph(firstPara));
            }
        }
    }
    // Aggregated content with moderate detail
    for (const extracted of aggregatedContent.sections) {
        if (!extracted.content || extracted.content.trim().length === 0) {
            continue;
        }
        sections.push(heading(3, extracted.section));
        if (extracted.shapes && extracted.shapes.length > 0) {
            // Type definitions without full JSDoc
            for (const shape of extracted.shapes) {
                sections.push(code(shape.sourceText, 'typescript'));
            }
        }
        else {
            sections.push(paragraph(extracted.content));
        }
    }
    return createDocument(decisionContent.patternName, sections, {
        purpose: 'Standard documentation from decision document',
        detailLevel: 'standard',
    });
}
/**
 * Execute the generation pipeline: validation, extraction, deduplication
 *
 * Internal function that performs the expensive work once. Both single-level
 * and multi-level generators use this to avoid duplicate work.
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Pipeline result or error
 */
async function executePipeline(pattern, options) {
    // Default options - all robustness features enabled by default
    const enableValidation = options.enableValidation ?? true;
    const enableDeduplication = options.enableDeduplication ?? true;
    const enableWarningCollection = options.enableWarningCollection ?? true;
    // Step 1: Create WarningCollector for unified warning handling
    const warningCollector = enableWarningCollection
        ? createWarningCollector()
        : undefined;
    // Pattern name can come from directive.patternName or pattern.patternName or pattern.name
    // directive.patternName and pattern.patternName are optional, pattern.name is required
    // Use helper function to catch both null/undefined AND empty strings
    const getPatternName = () => {
        if (pattern.directive.patternName?.trim()) {
            return pattern.directive.patternName;
        }
        if (pattern.patternName?.trim()) {
            return pattern.patternName;
        }
        return pattern.name;
    };
    const patternName = getPatternName();
    const description = pattern.directive.description;
    const rules = pattern.rules ?? [];
    // Step 2: Parse decision document
    const decisionContent = parseDecisionDocument(patternName, description, rules);
    // Step 3 & 4: Validate and execute source mapping (if mappings exist)
    let aggregatedContent = {
        sections: [],
        warnings: [],
        success: true,
    };
    // Deduplication warnings when warningCollector is not used
    const dedupWarnings = [];
    if (decisionContent.sourceMappings.length > 0) {
        // Step 3: PRE-FLIGHT VALIDATION (if enabled)
        if (enableValidation) {
            const validatorOptions = warningCollector
                ? { baseDir: options.baseDir, warningCollector }
                : { baseDir: options.baseDir };
            const validationResult = validateSourceMappingTable(decisionContent.sourceMappings, validatorOptions);
            // Capture validation warnings after successful validation (Issue #4 fix)
            if (validationResult.isValid && warningCollector && validationResult.warnings.length > 0) {
                for (const warning of validationResult.warnings) {
                    warningCollector.capture(warning);
                }
            }
            // If validation fails with errors, return early
            if (!validationResult.isValid) {
                const warnings = warningCollector
                    ? warningCollector.getAll().map((w) => `${w.category}: ${w.message}`)
                    : [];
                return {
                    warnings,
                    errors: validationResult.errors.map((e) => {
                        // Include suggestions if available
                        if (e.suggestions && e.suggestions.length > 0) {
                            return `${e.message}. Did you mean: ${e.suggestions.join(', ')}?`;
                        }
                        return e.message;
                    }),
                };
            }
        }
        // Step 4: EXECUTE SOURCE MAPPING (with warning collector)
        const baseMapperOptions = {
            baseDir: options.baseDir,
            decisionDocPath: pattern.source.file,
            decisionContent,
            detailLevel: options.detailLevel ?? 'standard',
        };
        const mapperOptions = warningCollector
            ? { ...baseMapperOptions, warningCollector }
            : baseMapperOptions;
        aggregatedContent = await executeSourceMapping(decisionContent.sourceMappings, mapperOptions);
        // Step 5: DEDUPLICATE SECTIONS (if enabled)
        if (enableDeduplication && aggregatedContent.sections.length > 0) {
            const dedupOptions = warningCollector ? { warningCollector } : undefined;
            const dedupResult = deduplicateSections(aggregatedContent.sections, dedupOptions);
            aggregatedContent.sections = dedupResult.sections;
            // Capture deduplication warnings when not using collector
            // (When collector is present, warnings are captured via side-effect)
            if (!warningCollector && dedupResult.warnings.length > 0) {
                dedupWarnings.push(...dedupResult.warnings);
            }
        }
    }
    return { decisionContent, aggregatedContent, warningCollector, patternName, dedupWarnings };
}
/**
 * Check if pipeline result is an error
 */
function isPipelineError(result) {
    return 'errors' in result;
}
// =============================================================================
// Main Generation Function
// =============================================================================
/**
 * Generate documentation from a decision document
 *
 * Main entry point that orchestrates the full pipeline:
 * 1. Create WarningCollector for unified warning handling
 * 2. Parse decision document to extract content
 * 3. Validate source mappings (if enabled) - fails fast on validation errors
 * 4. Execute source mapping to aggregate content from referenced files
 * 5. Deduplicate sections (if enabled)
 * 6. Generate output at specified detail level(s)
 * 7. Return output files with all warnings
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Generation result with files and warnings
 *
 * @example
 * ```typescript
 * const result = await generateFromDecision(processGuardPattern, {
 *   baseDir: process.cwd(),
 *   detailLevel: 'detailed',
 *   claudeMdSection: 'validation',
 * });
 *
 * for (const file of result.files) {
 *   fs.writeFileSync(file.path, file.content);
 * }
 * ```
 */
export async function generateFromDecision(pattern, options) {
    // Execute the pipeline
    const pipelineResult = await executePipeline(pattern, options);
    // If pipeline failed, return errors
    if (isPipelineError(pipelineResult)) {
        return {
            files: [],
            warnings: pipelineResult.warnings,
            errors: pipelineResult.errors,
            success: false,
        };
    }
    const { decisionContent, aggregatedContent, warningCollector, patternName, dedupWarnings } = pipelineResult;
    // Generate output at requested detail level
    const sectionOption = options.claudeMdSection;
    const outputPaths = determineOutputPaths(patternName, sectionOption ? { section: sectionOption } : undefined);
    const detailLevel = options.detailLevel ?? 'standard';
    // Generate based on detail level
    let doc;
    let outputPath;
    switch (detailLevel) {
        case 'summary':
            doc = generateCompactOutput(decisionContent, aggregatedContent);
            outputPath = outputPaths.compact;
            break;
        case 'detailed':
            doc = generateDetailedOutput(decisionContent, aggregatedContent);
            outputPath = outputPaths.detailed;
            break;
        case 'standard':
        default:
            doc = generateStandardOutput(decisionContent, aggregatedContent);
            outputPath = outputPaths.detailed;
            break;
    }
    // Render to markdown
    const content = renderToMarkdown(doc);
    const files = [{ path: outputPath, content }];
    // Collect all warnings and return
    // When warningCollector is present, it captures all warnings via side-effects
    // When not present, we need to merge extraction warnings with deduplication warnings
    const warnings = warningCollector
        ? warningCollector.getAll().map((w) => `${w.category}: ${w.message}`)
        : [
            ...aggregatedContent.warnings.map((w) => `${w.severity}: ${w.message}`),
            ...dedupWarnings.map((w) => `${w.category}: ${w.message}`),
        ];
    return { files, warnings, errors: [], success: true };
}
/**
 * Generate both compact and detailed outputs
 *
 * Runs the pipeline once and generates documentation at both detail levels.
 * More efficient than calling generateFromDecision twice.
 *
 * @param pattern - Extracted pattern with decision document content
 * @param options - Generator options
 * @returns Generation result with both output files
 */
export async function generateFromDecisionMultiLevel(pattern, options) {
    // Execute the pipeline ONCE
    const pipelineResult = await executePipeline(pattern, options);
    // If pipeline failed, return errors
    if (isPipelineError(pipelineResult)) {
        return {
            files: [],
            warnings: pipelineResult.warnings,
            errors: pipelineResult.errors,
            success: false,
        };
    }
    const { decisionContent, aggregatedContent, warningCollector, patternName, dedupWarnings } = pipelineResult;
    // Determine output paths
    const sectionOption = options.claudeMdSection;
    const outputPaths = determineOutputPaths(patternName, sectionOption ? { section: sectionOption } : undefined);
    // Generate BOTH outputs from the same processed data
    const compactDoc = generateCompactOutput(decisionContent, aggregatedContent);
    const detailedDoc = generateDetailedOutput(decisionContent, aggregatedContent);
    const compactContent = renderToMarkdown(compactDoc);
    const detailedContent = renderToMarkdown(detailedDoc);
    const files = [
        { path: outputPaths.compact, content: compactContent },
        { path: outputPaths.detailed, content: detailedContent },
    ];
    // Collect all warnings
    // When warningCollector is present, it captures all warnings via side-effects
    // When not present, we need to merge extraction warnings with deduplication warnings
    const warnings = warningCollector
        ? warningCollector.getAll().map((w) => `${w.category}: ${w.message}`)
        : [
            ...aggregatedContent.warnings.map((w) => `${w.severity}: ${w.message}`),
            ...dedupWarnings.map((w) => `${w.category}: ${w.message}`),
        ];
    return { files, warnings, errors: [], success: true };
}
// =============================================================================
// DocumentGenerator Implementation
// =============================================================================
/**
 * Decision Doc Generator for registry integration
 *
 * Implements DocumentGenerator interface for use with the generator registry.
 * Filters patterns by type to find ADR/PDR decision documents with source mappings.
 */
export class DecisionDocGeneratorImpl {
    name = 'doc-from-decision';
    description = 'Generate documentation from ADR/PDR decision documents';
    async generate(patterns, context) {
        const allFiles = [];
        // Filter for decision documents (ADR/PDR patterns with source mappings)
        const decisionPatterns = patterns.filter((p) => {
            // Check if pattern has source mapping table in description or rules
            const description = p.directive.description;
            const hasSourceMappingInDesc = description.includes('| Section |') &&
                (description.includes('| Source File |') || description.includes('| Source |'));
            // Check rules for source mapping tables
            const hasSourceMappingInRules = (p.rules ?? []).some((rule) => rule.description.includes('| Section |') &&
                (rule.description.includes('| Source File |') || rule.description.includes('| Source |')));
            return hasSourceMappingInDesc || hasSourceMappingInRules;
        });
        // Collect all warnings and errors for metadata instead of console output
        const allWarnings = [];
        const allErrors = [];
        if (decisionPatterns.length === 0) {
            allWarnings.push('No decision documents with source mappings found. Ensure patterns have source mapping tables.');
            return {
                files: [],
                metadata: {
                    warnings: allWarnings,
                    errors: allErrors,
                    patternsProcessed: 0,
                },
            };
        }
        // Generate documentation for each decision pattern
        for (const pattern of decisionPatterns) {
            // Extract section from pattern tags or default to 'generated'
            const section = extractClaudeMdSection(pattern) ?? 'generated';
            const result = await generateFromDecisionMultiLevel(pattern, {
                baseDir: context.baseDir,
                detailLevel: 'detailed', // Generate both levels
                claudeMdSection: section,
            });
            allFiles.push(...result.files);
            // Collect errors and warnings (but don't fail)
            allErrors.push(...result.errors);
            allWarnings.push(...result.warnings);
        }
        return {
            files: allFiles,
            metadata: {
                warnings: allWarnings,
                errors: allErrors,
                patternsProcessed: decisionPatterns.length,
            },
        };
    }
}
/**
 * Create decision doc generator instance
 */
export function createDecisionDocGenerator() {
    return new DecisionDocGeneratorImpl();
}
//# sourceMappingURL=decision-doc-generator.js.map