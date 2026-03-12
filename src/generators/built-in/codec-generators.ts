/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern CodecGeneratorRegistration
 * @libar-docs-status completed
 *
 * ## Codec-Based Generator Registration
 *
 * Registers codec-based generators for the RenderableDocument Model (RDM) system.
 * These generators use Zod 4 codecs to transform MasterDataset into RenderableDocuments,
 * which are then rendered to markdown via the universal renderer.
 *
 * ### When to Use
 *
 * - When initializing the generator registry with built-in generators
 * - When understanding which generators are available out-of-the-box
 * - When extending with custom generators (use as reference for registration pattern)
 *
 * Available generators:
 * - `patterns` - Pattern registry with category details
 * - `roadmap` - Development roadmap by phase
 * - `milestones` - Historical completed milestones
 * - `requirements` - Product requirements by area/role
 * - `session` - Current session context and focus
 * - `remaining` - Aggregate view of incomplete work
 */

import { generatorRegistry } from '../registry.js';
import { createCodecGenerator } from '../codec-based.js';
import { createDecisionDocGenerator } from './decision-doc-generator.js';
import { createDesignReviewGenerator } from './design-review-generator.js';
import { createProcessApiReferenceGenerator } from './process-api-reference-generator.js';
import { createCliRecipeGenerator } from './cli-recipe-generator.js';
import { loadPreambleFromMarkdown } from '../../renderable/load-preamble.js';
import type { SectionBlock } from '../../renderable/schema.js';
// registerReferenceGenerators is now called from orchestrator.ts with config-provided configs

// ═══════════════════════════════════════════════════════════════════════════
// Codec-Based Generators (RDM Architecture)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pattern Registry Generator
 * Generates PATTERNS.md + patterns/*.md category files
 */
generatorRegistry.register(createCodecGenerator('patterns', 'patterns'));

/**
 * Roadmap Generator
 * Generates ROADMAP.md + phases/*.md detail files
 */
generatorRegistry.register(createCodecGenerator('roadmap', 'roadmap'));

/**
 * Completed Milestones Generator
 * Generates COMPLETED-MILESTONES.md + milestones/*.md quarterly files
 */
generatorRegistry.register(createCodecGenerator('milestones', 'milestones'));

/**
 * Product Requirements Generator
 * Generates PRODUCT-REQUIREMENTS.md + requirements/*.md
 */
generatorRegistry.register(createCodecGenerator('requirements', 'requirements'));

/**
 * Session Context Generator
 * Generates SESSION-CONTEXT.md + sessions/*.md phase files
 */
generatorRegistry.register(createCodecGenerator('session', 'session'));

/**
 * Remaining Work Generator
 * Generates REMAINING-WORK.md + remaining/*.md phase files
 */
generatorRegistry.register(createCodecGenerator('remaining', 'remaining'));

/**
 * Current Work Generator
 * Generates CURRENT-WORK.md + current/*.md phase files (active patterns only)
 */
generatorRegistry.register(createCodecGenerator('current', 'current'));

/**
 * PR Changes Generator
 * Generates working/PR-CHANGES.md (filtered by changed files or release tag)
 */
generatorRegistry.register(createCodecGenerator('pr-changes', 'pr-changes'));

/**
 * ADR (Architecture Decision Records) Generator
 * Generates DECISIONS.md + decisions/*.md category files
 */
generatorRegistry.register(createCodecGenerator('adrs', 'adrs'));

/**
 * Planning Checklist Generator
 * Generates PLANNING-CHECKLIST.md (pre-planning questions and DoD)
 */
generatorRegistry.register(createCodecGenerator('planning-checklist', 'planning-checklist'));

/**
 * Session Plan Generator
 * Generates SESSION-PLAN.md (implementation plans for phases)
 */
generatorRegistry.register(createCodecGenerator('session-plan', 'session-plan'));

/**
 * Session Findings Generator
 * Generates SESSION-FINDINGS.md (retrospective discoveries)
 */
generatorRegistry.register(createCodecGenerator('session-findings', 'session-findings'));

/**
 * Changelog Generator
 * Generates CHANGELOG-GENERATED.md (Keep a Changelog format)
 */
generatorRegistry.register(createCodecGenerator('changelog', 'changelog'));

/**
 * Traceability Generator
 * Generates TRACEABILITY.md (timeline to behavior file coverage)
 */
generatorRegistry.register(createCodecGenerator('traceability', 'traceability'));

/**
 * Overview Generator (RDM)
 * Generates OVERVIEW.md (project architecture overview)
 */
generatorRegistry.register(createCodecGenerator('overview-rdm', 'overview'));

/**
 * Business Rules Generator
 * Generates BUSINESS-RULES.md (domain constraints and invariants by domain)
 */
generatorRegistry.register(createCodecGenerator('business-rules', 'business-rules'));

/**
 * Architecture Diagram Generator
 * Generates ARCHITECTURE.md (component and layered architecture diagrams)
 */
generatorRegistry.register(createCodecGenerator('architecture', 'architecture'));

/**
 * Taxonomy Reference Generator
 * Generates TAXONOMY.md + taxonomy/*.md detail files
 */
generatorRegistry.register(createCodecGenerator('taxonomy', 'taxonomy'));

/**
 * Validation Rules Generator
 * Generates VALIDATION-RULES.md + validation/*.md detail files
 */
generatorRegistry.register(createCodecGenerator('validation-rules', 'validation-rules'));

/**
 * Claude Module Generator
 * Generates CLAUDE-MODULES.md index + {section}/{module}.md files
 */
generatorRegistry.register(createCodecGenerator('claude-modules', 'claude-modules'));

/**
 * Index Generator
 * Generates INDEX.md navigation hub with editorial preamble + MasterDataset statistics
 */
generatorRegistry.register(createCodecGenerator('index', 'index'));

// ═══════════════════════════════════════════════════════════════════════════
// Decision Document Generator (Pattern-Based, not Codec-Based)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Decision Document Generator
 * Generates documentation from ADR/PDR decision documents with source mappings.
 * Produces both compact (_claude-md/) and detailed (docs/) outputs.
 */
generatorRegistry.register(createDecisionDocGenerator());

// ═══════════════════════════════════════════════════════════════════════════
// Design Review Generator (Sequence + Component Diagrams)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Design Review Generator
 * Generates design review documents with sequence and component diagrams
 * from @libar-docs-sequence-* annotations on feature specs.
 */
generatorRegistry.register(createDesignReviewGenerator());

// ═══════════════════════════════════════════════════════════════════════════
// Process API Reference Generator (Schema-Based, not Codec-Based)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process API CLI Reference Generator
 * Generates PROCESS-API-REFERENCE.md from declarative CLI schema.
 * Standalone: does not consume MasterDataset (ADR-006).
 */
generatorRegistry.register(createProcessApiReferenceGenerator());

// ═══════════════════════════════════════════════════════════════════════════
// CLI Recipe Generator (Schema-Based, not Codec-Based)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CLI Recipe & Workflow Guide Generator
 * Generates PROCESS-API-RECIPES.md from declarative CLI schema.
 * Standalone: does not consume MasterDataset (ADR-006).
 */
let cliRecipePreamble: readonly SectionBlock[] = [];
try {
  cliRecipePreamble = loadPreambleFromMarkdown('docs-sources/process-api-recipes.md');
} catch {
  // Preamble file may not exist in test environments (e.g., CLI integration tests
  // that run generate-docs in a temp directory). Fall back to empty preamble.
}
generatorRegistry.register(createCliRecipeGenerator(cliRecipePreamble));

// ═══════════════════════════════════════════════════════════════════════════
// Reference Document Generators (Convention-Based, Codec-Driven)
// ═══════════════════════════════════════════════════════════════════════════
//
// Reference generators are registered at orchestration time from project config
// (referenceDocConfigs field), not at import time. See generateFromConfig() in
// orchestrator.ts for the registration call.
