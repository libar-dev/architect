/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern GeneratorConfigSchema
 * @libar-docs-status completed
 * @libar-docs-used-by GeneratorFactory, BuiltInGenerators
 *
 * ## GeneratorConfigSchema - JSON-Based Generator Validation
 *
 * Zod schemas for declarative JSON-based generator configuration.
 * Enables zero-code generator creation via section composition.
 *
 * ### When to Use
 *
 * - Use when creating document formats via JSON configuration
 * - Use when validating generator configuration files
 * - Use when composing documents from built-in sections
 */
import { z } from 'zod';
import { ACCEPTANCE_CRITERIA_FORMAT, ADR_LIST_GROUP_BY, CONSTRAINTS_GROUP_BY, CORE_PATTERNS_FORMAT, DELIVERABLES_FORMAT, DELIVERABLES_GROUP_BY, DEPENDENCIES_FORMAT, LAYER_TYPES, PATTERN_LIST_FORMAT, PR_CHANGES_SORT_BY, PRD_FEATURES_GROUP_BY, REMAINING_WORK_GROUP_BY, REMAINING_WORK_SORT_BY, SESSION_FINDINGS_GROUP_BY, TIMELINE_GROUP_BY, } from '../taxonomy/index.js';
// Section configurations (discriminated union by type)
const SectionConfigSchema = z.union([
    z.object({
        type: z.literal('header'),
        title: z.string(),
        purpose: z.string().optional(),
        detailLevel: z.string().optional(),
    }),
    z.object({
        type: z.literal('core-patterns'),
        format: z.enum(CORE_PATTERNS_FORMAT).default('table'),
    }),
    z.object({
        type: z.literal('quick-navigation'),
        categoryOrder: z.array(z.string()).optional(),
        categoryFilesDir: z.string().optional(),
    }),
    z.object({
        type: z.literal('use-cases'),
    }),
    z.object({
        type: z.literal('dependencies'),
        format: z.enum(DEPENDENCIES_FORMAT).default('mermaid'),
    }),
    z.object({
        type: z.literal('category-details'),
        outputDir: z.string().optional(),
    }),
    z.object({
        type: z.literal('pattern-list'),
        filterBy: z
            .object({
            aggregationTag: z.string().optional(),
            category: z.string().optional(),
            status: z.string().optional(),
        })
            .optional(),
        format: z.enum(PATTERN_LIST_FORMAT).default('full'),
        numberPrefix: z.string().optional(),
    }),
    z.object({
        type: z.literal('scenarios'),
    }),
    z.object({
        type: z.literal('cross-references'),
        refs: z.array(z.object({
            resource: z.string(),
            location: z.string(),
        })),
    }),
    z.object({
        type: z.literal('phase-overview'),
    }),
    z.object({
        type: z.literal('fragment-include'),
        fragmentName: z.string(),
        context: z.record(z.string(), z.unknown()).optional(),
    }),
    // Roadmap section renderers
    z.object({
        type: z.literal('roadmap-status-summary'),
        /** Show status counts (default: true) */
        showCounts: z.boolean().optional().default(true),
        /** Show progress bar (default: true) */
        showProgress: z.boolean().optional().default(true),
    }),
    z.object({
        type: z.literal('roadmap-phases'),
        /** Include process metadata (quarter, effort, team) (default: true) */
        includeProcess: z.boolean().optional().default(true),
        /** Include deliverables from Background tables (default: false) */
        includeDeliverables: z.boolean().optional().default(false),
    }),
    // Timeline section renderers
    z.object({
        type: z.literal('timeline-summary'),
        /** Group by quarter or phase (default: quarter) */
        groupBy: z.enum(TIMELINE_GROUP_BY).optional().default('quarter'),
    }),
    z.object({
        type: z.literal('completed-phases'),
        /** Include deliverables from Background tables (default: true) */
        includeDeliverables: z.boolean().optional().default(true),
        /** Include links to brief documents (default: true) */
        includeLinks: z.boolean().optional().default(true),
    }),
    z.object({
        type: z.literal('deliverables-summary'),
        /** Output format: table, checklist, or progress-bar (default: table) */
        format: z.enum(DELIVERABLES_FORMAT).optional().default('table'),
        /** Group deliverables by: status, phase, location, or none (default: status) */
        groupBy: z.enum(DELIVERABLES_GROUP_BY).optional().default('status'),
        /** Show completion statistics (default: true) */
        showStats: z.boolean().optional().default(true),
        /** Show visual progress bar (default: true) */
        showProgress: z.boolean().optional().default(true),
        /** Filter deliverables by status (e.g., "Complete", "In Progress") */
        filterByStatus: z.string().optional(),
    }),
    // PRD section renderers
    z.object({
        type: z.literal('prd-features'),
        /** Group features by: product-area, user-role, or phase (default: product-area) */
        groupBy: z.enum(PRD_FEATURES_GROUP_BY).optional().default('product-area'),
        /** Include acceptance criteria scenarios (default: true) */
        includeScenarios: z.boolean().optional().default(true),
        /** Include full Given/When/Then steps for acceptance criteria (default: true) */
        includeScenarioSteps: z.boolean().optional().default(true),
        /** Include business value and user role metadata (default: true) */
        includeBusinessValue: z.boolean().optional().default(true),
        /** Filter scenarios by layer (timeline, domain, integration, e2e, component) */
        filterByLayer: z.enum(LAYER_TYPES).optional(),
        /** Progressive disclosure configuration for multi-file PRD output */
        progressiveDisclosure: z
            .object({
            /** Enable progressive disclosure (default: false) */
            enabled: z.boolean().default(false),
            /** Output directory for detail files (e.g., "requirements/") */
            outputDir: z.string().default('requirements/'),
        })
            .optional(),
    }),
    z.object({
        type: z.literal('acceptance-criteria'),
        /** Output format: gherkin, bullet-points, or table (default: gherkin) */
        format: z.enum(ACCEPTANCE_CRITERIA_FORMAT).optional().default('gherkin'),
        /** Filter scenarios by layer (timeline, domain, integration, e2e, component) */
        filterByLayer: z.enum(LAYER_TYPES).optional(),
    }),
    // Session context section - comprehensive active phase view for LLM planning
    z.object({
        type: z.literal('session-context'),
        /** Include full description from feature file (default: true) */
        includeDescription: z.boolean().optional().default(true),
        /** Include acceptance criteria with Given/When/Then steps (default: true) */
        includeAcceptanceCriteria: z.boolean().optional().default(true),
        /** Include dependency information (default: true) */
        includeDependencies: z.boolean().optional().default(true),
        /** Include deliverables with progress (default: true) */
        includeDeliverables: z.boolean().optional().default(true),
        /** Include related patterns from uses/usedBy (default: false) */
        includeRelatedPatterns: z.boolean().optional().default(false),
        /** Output directory for detail files (e.g., "session-context/") */
        outputDir: z.string().optional(),
        /** Include handoff context (discoveries, paused indicators, template links) (default: true) */
        includeHandoffContext: z.boolean().optional().default(true),
    }),
    // Remaining work section - cross-phase incomplete work aggregation
    z.object({
        type: z.literal('remaining-work'),
        /** Include incomplete deliverables by phase (default: true) */
        includeIncomplete: z.boolean().optional().default(true),
        /** Include blocked phases with unmet dependencies (default: true) */
        includeBlocked: z.boolean().optional().default(true),
        /** Include next actionable roadmap phases (default: true) */
        includeNextActionable: z.boolean().optional().default(true),
        /** Maximum phases to show in next actionable (default: 5) */
        maxNextActionable: z.number().optional().default(5),
        /** Include overall statistics (default: true) */
        includeStats: z.boolean().optional().default(true),
        /** Include discovered gaps as potential roadmap items (default: false) */
        includeDiscoveredGaps: z.boolean().optional().default(false),
        /** Output directory for detail files (e.g., "remaining-work/") */
        outputDir: z.string().optional(),
        /** Sort order for Next Actionable section (default: phase) */
        sortBy: z.enum(REMAINING_WORK_SORT_BY).optional().default('phase'),
        /** Grouping for planned phases in Incomplete Deliverables (default: none) */
        groupPlannedBy: z.enum(REMAINING_WORK_GROUP_BY).optional().default('none'),
        /** Maximum planned phases before progressive disclosure (default: 20) */
        maxPlannedToShow: z.number().optional().default(20),
    }),
    // Planning checklist section - pre-planning questions and DoD validation
    z.object({
        type: z.literal('planning-checklist'),
        /** Include pre-planning questions (default: true) */
        includePrePlanning: z.boolean().optional().default(true),
        /** Include Definition of Done checklist (default: true) */
        includeDoD: z.boolean().optional().default(true),
        /** Include risk assessment questions (default: true) */
        includeRiskAssessment: z.boolean().optional().default(true),
        /** Include validation steps (default: true) */
        includeValidationSteps: z.boolean().optional().default(true),
        /** Generate checklists for active phases (default: true) */
        forActivePhases: z.boolean().optional().default(true),
        /** Generate checklists for next actionable phases (default: true) */
        forNextActionable: z.boolean().optional().default(true),
        /** Output directory for detail files (e.g., "planning-checklist/") */
        outputDir: z.string().optional(),
    }),
    // Session plan section - implementation plan for Elaboration phase
    z.object({
        type: z.literal('session-plan'),
        /** Include implementation approach derived from description (default: true) */
        includeImplementationApproach: z.boolean().optional().default(true),
        /** Include deliverables as checkbox list (default: true) */
        includeDeliverables: z.boolean().optional().default(true),
        /** Include acceptance criteria with Given/When/Then steps (default: true) */
        includeAcceptanceCriteria: z.boolean().optional().default(true),
        /** Include execution steps template (Setup, Implementation, Validation, Documentation) (default: true) */
        includeExecutionSteps: z.boolean().optional().default(true),
        /** Include pre-planning questions (default: true) */
        includePrePlanning: z.boolean().optional().default(true),
        /** Include risk assessment from @libar-process-risk tags (default: true) */
        includeRiskAssessment: z.boolean().optional().default(true),
        /** Filter by status: roadmap, active, or both (default: ["roadmap", "active"]) */
        statusFilter: z.array(z.string()).optional().default(['roadmap', 'active']),
        /** Output directory for detail files (e.g., "session-plans/") for progressive disclosure */
        outputDir: z.string().optional(),
    }),
    // Session findings section - aggregated discoveries from completed phases
    z.object({
        type: z.literal('session-findings'),
        /** Include gaps section (default: true) */
        includeGaps: z.boolean().optional().default(true),
        /** Include improvements section (default: true) */
        includeImprovements: z.boolean().optional().default(true),
        /** Include risks section (default: true) */
        includeRisks: z.boolean().optional().default(true),
        /** Include learnings section (default: true) */
        includeLearnings: z.boolean().optional().default(true),
        /** Show source phase for each finding (default: true) */
        showSourcePhase: z.boolean().optional().default(true),
        /** Include links to feature files (default: true) */
        includeLinks: z.boolean().optional().default(true),
        /** Group by: category (default) or phase */
        groupBy: z.enum(SESSION_FINDINGS_GROUP_BY).optional().default('category'),
    }),
    // Changelog section - Keep a Changelog format from completed phases
    z.object({
        type: z.literal('changelog'),
        /** Include unreleased phases without @libar-process-release tag (default: true) */
        includeUnreleased: z.boolean().optional().default(true),
        /** Custom workflow-to-category mapping (overrides defaults) */
        categoryMapping: z.record(z.string(), z.string()).optional(),
        /** Show phase links in entries (default: true) */
        includeLinks: z.boolean().optional().default(true),
    }),
    // Traceability section - timeline → behavior file coverage report
    z.object({
        type: z.literal('traceability'),
        /** Include coverage gap reporting (default: true) */
        includeGaps: z.boolean().optional().default(true),
        /** Include coverage statistics (default: true) */
        includeStats: z.boolean().optional().default(true),
        /** Include phases with behavioral tests table (default: true) */
        includeCovered: z.boolean().optional().default(true),
    }),
    // Constraints index section - technical constraints from @libar-process-constraint tags
    z.object({
        type: z.literal('constraints-index'),
        /** Group constraints by: product-area (default) or constraint */
        groupBy: z.enum(CONSTRAINTS_GROUP_BY).optional().default('product-area'),
    }),
    // ADR list section - Architecture Decision Records from @libar-process-adr-* tags
    z.object({
        type: z.literal('adr-list'),
        /** Group ADRs by: status (default) or category */
        groupBy: z.enum(ADR_LIST_GROUP_BY).optional().default('status'),
        /** Include context section (default: true) */
        includeContext: z.boolean().optional().default(true),
        /** Include decision section (default: true) */
        includeDecision: z.boolean().optional().default(true),
        /** Include consequences section (default: true) */
        includeConsequences: z.boolean().optional().default(true),
        /** Progressive disclosure configuration for multi-file ADR output */
        progressiveDisclosure: z
            .object({
            /** Enable progressive disclosure (default: false) */
            enabled: z.boolean().default(false),
            /** Output directory for detail files (e.g., "decisions/") */
            outputDir: z.string().default('decisions/'),
        })
            .optional(),
    }),
    // PR changes section - unreleased work summary for PR descriptions and code reviews
    z.object({
        type: z.literal('pr-changes'),
        /** Include deliverables table (default: true) */
        includeDeliverables: z.boolean().optional().default(true),
        /** Include acceptance criteria as review checklist (default: true) */
        includeReviewChecklist: z.boolean().optional().default(true),
        /** Include business value in summaries (default: true) */
        includeBusinessValue: z.boolean().optional().default(true),
        /** Include dependency information - what this enables and depends on (default: true) */
        includeDependencies: z.boolean().optional().default(true),
        /** Sort order for changes (default: phase) */
        sortBy: z.enum(PR_CHANGES_SORT_BY).optional().default('phase'),
        /** Filter by specific release version (e.g., "v0.2.0"). If not set, shows unreleased changes only */
        releaseFilter: z.string().optional(),
    }),
]);
// Built-in generator configuration (JSON-based, composed from sections)
const BuiltInGeneratorConfigSchema = z.object({
    type: z.literal('built-in'),
    output: z.string(),
    filterBy: z
        .object({
        aggregationTag: z.string().optional(),
        category: z.string().optional(),
        /** Filter by pattern status (roadmap, active, completed, implemented, partial) */
        status: z.string().optional(),
    })
        .optional(),
    sections: z.array(SectionConfigSchema),
});
// Custom TypeScript generator configuration
const CustomGeneratorConfigSchema = z.object({
    type: z.literal('custom'),
    path: z.string(),
    options: z.record(z.string(), z.unknown()).optional(),
});
const GeneratorConfigSchema = z.union([BuiltInGeneratorConfigSchema, CustomGeneratorConfigSchema]);
// Root configuration file schema
export const GeneratorsConfigFileSchema = z.object({
    generators: z.record(z.string(), GeneratorConfigSchema),
    // Global defaults
    input: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    baseDir: z.string().optional(),
    tagRegistry: z.string().optional(),
    features: z.string().optional(),
});
//# sourceMappingURL=generator-config.js.map