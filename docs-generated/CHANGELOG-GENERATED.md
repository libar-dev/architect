# Changelog

**Purpose:** Project changelog in Keep a Changelog format

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **Deliverable Status Taxonomy**: Canonical status values for deliverables in Gherkin Background tables.
- **Config Resolver**: Resolves a raw `DeliveryProcessProjectConfig` into a fully-resolved `ResolvedConfig` with all defaults applied, stubs...
- **Project Config Types**: Unified project configuration for the delivery-process package.
- **Project Config Schema**: Zod validation schema for `DeliveryProcessProjectConfig`.
- **Source Merger**: Computes effective sources for a specific generator by applying per-generator overrides to the base resolved sources.
- **Define Config**: Identity function for type-safe project configuration.
- **File Cache**: Simple Map-based cache for file contents during a single generation run.
- **Process API CLI Impl**: Exposes ProcessStateAPI methods as CLI subcommands with JSON output.
- **Output Pipeline Impl**: Post-processing pipeline that transforms raw API results into shaped CLI output.
- **Lint Process CLI**: Validates git changes against delivery process rules.
- **Process State Types**: :MasterDataset Type definitions for the ProcessStateAPI query interface.
- **Pattern Summarizer Impl**: Projects the full ExtractedPattern (~3.5KB per pattern) down to a PatternSummary (~100 bytes) for list queries.
- **Stub Resolver Impl**: Identifies design session stubs in the MasterDataset and resolves them against the filesystem to determine...
- **Process State API**: TypeScript interface for querying delivery process state.
- **Pattern Helpers**: Common helper functions used by context-assembler, arch-queries, and other API modules that need pattern name...
- **API Module**: Central export for the Process State API, providing a TypeScript interface for querying delivery process state.
- **Fuzzy Matcher Impl**: Provides fuzzy matching for pattern names with tiered scoring: exact (1.0) > prefix (0.9) > substring (0.7) >...
- **Coverage Analyzer Impl**: Reports annotation completeness by comparing scannable files (from glob) against annotated patterns in MasterDataset.
- **Context Formatter Impl**: First plain-text formatter in the codebase.
- **Context Assembler Impl**: Pure function composition over MasterDataset.
- **Arch Queries Impl**: Pure functions over MasterDataset for deep architecture exploration.
- **FSM Validator**: :PDR005MvpWorkflow Pure validation functions following the Decider pattern: - No I/O, no side effects - Return...
- **FSM Transitions**: :PDR005MvpWorkflow Defines valid transitions between FSM states per PDR-005: ``` roadmap ──→ active ──→ completed │  ...
- **FSM States**: :PDR005MvpWorkflow Defines the 4-state FSM from PDR-005 MVP Workflow: - roadmap: Planned work (fully editable) -...
- **FSM Module**: :PDR005MvpWorkflow Central export for the 4-state FSM defined in PDR-005: ``` roadmap ──→ active ──→ completed │     ...
- **Reference Document Codec**: A single codec factory that creates reference document codecs from configuration objects.
- **Composite Codec**: Assembles reference documents from multiple codec outputs by concatenating RenderableDocument sections.
- **Process Guard Types**: :FSMValidator Defines types for the process guard linter including: - Process state derived from file annotations -...
- **Process Guard Module**: :FSMValidator,DeriveProcessState,DetectChanges,ProcessGuardDecider Enforces delivery process rules by validating...
- **Detect Changes**: Detects changes from git diff including: - Modified, added, deleted files - Status transitions (@libar-docs-status...
- **Derive Process State**: :GherkinScanner,FSMValidator Derives process state from @libar-docs-* annotations in files.
- **Process Guard Decider**: :FSMValidator,DeriveProcessState,DetectChanges Pure function that validates changes against process rules.
- **Reference Generator Registration**: Registers all reference document generators.
- **Reference Doc Showcase**: The Reference Generation Sample document exercises a small fraction of the reference codec's capabilities: 2...
- **Process State API Relationship Queries**: Problem: ProcessStateAPI currently supports dependency queries (`uses`, `usedBy`, `dependsOn`, `enables`) but lacks...
- **Declaration Level Shape Tagging**: The current shape extraction system operates at file granularity.
- **ADR 010 Pattern Naming Conventions**: The annotation system uses a tag-based approach where TypeScript JSDoc and Gherkin tags drive documentation generation.

---

## [v1.0.0]

### Added

- **TypeScript Taxonomy Implementation**: As a delivery-process developer I want taxonomy defined in TypeScript with Zod integration So that I get compile-time...
- **Process Guard Linter**: During planning and implementation sessions, accidental modifications occur: - Specs outside the intended scope get...
- **Phase State Machine Validation**: Phase lifecycle state transitions are not enforced programmatically despite being documented in PROCESS_SETUP.md.
- **Pattern Relationship Model**: Problem: The delivery process lacks a comprehensive relationship model between artifacts.
- **Mvp Workflow Implementation**: PDR-005 defines a 4-state workflow FSM (`roadmap, active, completed, deferred`) but the delivery-process package...
- **Gherkin Rules Support**: Feature files were limited to flat scenario lists.

---

## [Earlier]

### Added

- **Public API**: Main entry point for the @libar-dev/delivery-process package.
- **Workflow Config Schema**: Zod schemas for validating workflow configuration files that define status models, phase definitions, and artifact...
- **Tag Registry Configuration**: Defines the structure and validation for tag taxonomy configuration.
- **Output Schemas**: Zod schemas for JSON output formats used by CLI tools.
- **Master Dataset**: Defines the schema for a pre-computed dataset that holds all extracted patterns along with derived views (by status,...
- **Extracted Shape Schema**: Zod schema for TypeScript type definitions extracted from source files via the @libar-docs-extract-shapes tag.
- **Extracted Pattern Schema**: Zod schema for validating complete extracted patterns with code, metadata, relationships, and source information.
- **Dual Source Schemas**: Zod schemas for dual-source extraction types.
- **Doc Directive Schema**: Zod schemas for validating parsed @libar-docs-* directives from JSDoc comments.
- **Codec Utils**: Provides factory functions for creating type-safe JSON parsing and serialization pipelines using Zod schemas.
- **DoD Validation Types**: Types and schemas for Definition of Done (DoD) validation and anti-pattern detection.
- **Validation Module**: Barrel export for validation module providing: - Definition of Done (DoD) validation for completed phases -...
- **DoD Validator**: Validates that completed phases meet Definition of Done criteria: 1.
- **Anti Pattern Detector**: Detects violations of the dual-source documentation architecture and process hygiene issues that lead to...
- **String Utilities**: Provides shared utilities for string manipulation used across the delivery-process package, including slugification...
- **Utils Module**: Common helper functions used across the delivery-process package.
- **Pattern Id Generator**: Generates unique, deterministic pattern IDs based on file path and line number.
- **Collection Utilities**: Provides shared utilities for working with arrays and collections, such as grouping items by a key function.
- **Status Values**: THE single source of truth for FSM state values in the monorepo (per PDR-005 FSM).
- **Risk Levels**: Three-tier risk classification for roadmap planning.
- **Tag Registry Builder**: Constructs a complete TagRegistry from TypeScript constants.
- **Normalized Status**: The delivery-process system uses a two-level status taxonomy: 1.
- **Layer Types**: Inferred from feature file directory paths: - timeline: Process/workflow features (delivery-process) - domain:...
- **Hierarchy Levels**: Three-level hierarchy for organizing work: - epic: Multi-quarter strategic initiatives - phase: Standard work units...
- **Format Types**: Defines how tag values are parsed and validated.
- **Category Definitions**: Categories are used to classify patterns and organize documentation.
- **Renderable Utils**: Utility functions for document codecs.
- **Renderable Document**: Universal intermediate format for all generated documentation.
- **Universal Renderer**: Converts RenderableDocument to output strings.
- **Renderable Document Model(RDM)**: Unified document generation using codecs and a universal renderer.
- **Document Generator**: Simplified document generation using codecs.
- **Pattern Scanner**: Discovers TypeScript files matching glob patterns and filters to only those with `@libar-docs` opt-in.
- **Gherkin Scanner**: Scans .feature files for pattern metadata encoded in Gherkin tags.
- **Gherkin AST Parser**: Parses Gherkin feature files using @cucumber/gherkin and extracts structured data including feature metadata, tags,...
- **TypeScript AST Parser**: Parses TypeScript source files using @typescript-eslint/typescript-estree to extract @libar-docs-* directives with...
- **Lint Rules**: Defines lint rules that check @libar-docs-* directives for completeness and quality.
- **Lint Module**: Provides lint rules and engine for pattern annotation quality checking.
- **Lint Engine**: Orchestrates lint rule execution against parsed directives.
- **Warning Collector**: Provides a unified system for capturing, categorizing, and reporting non-fatal issues during document generation.
- **Generator Types**: Minimal interface for pluggable generators that produce documentation from patterns.
- **Source Mapping Validator**: Performs pre-flight checks on source mapping tables before extraction begins.
- **Source Mapper**: Aggregates content from multiple source files based on source mapping tables parsed from decision documents.
- **Generator Registry**: Manages registration and lookup of document generators (both built-in and custom).
- **Documentation Generation Orchestrator**: Orchestrates the complete documentation generation pipeline: Scanner → Extractor → Generators → File Writer Extracts...
- **Content Deduplicator**: Identifies and merges duplicate sections extracted from multiple sources.
- **Codec Based Generator**: Adapts the new RenderableDocument Model (RDM) codec system to the existing DocumentGenerator interface.
- **Shape Extractor**: Extracts TypeScript type definitions (interfaces, type aliases, enums, function signatures) from source files for...
- **Layer Inference**: Infers feature file layer (timeline, domain, integration, e2e, component) from directory path patterns.
- **Gherkin Extractor**: Transforms scanned Gherkin feature files into ExtractedPattern objects for inclusion in generated documentation.
- **Dual Source Extractor**: Extracts pattern metadata from both TypeScript code stubs (@libar-docs-*) and Gherkin feature files (@libar-docs-*),...
- **Document Extractor**: Converts scanned file data into complete ExtractedPattern objects with unique IDs, inferred names, categories, and...
- **Workflow Loader**: Loads and validates workflow configuration from JSON files in the catalogue.
- **Configuration Types**: Type definitions for the delivery process configuration system.
- **Regex Builders**: Type-safe regex factory functions for tag detection and normalization.
- **Configuration Presets**: Predefined configuration presets for common use cases.
- **Delivery Process Factory**: Main factory function for creating configured delivery process instances.
- **Configuration Defaults**: Centralized default constants for the delivery-process package.
- **Config Loader**: Discovers and loads `delivery-process.config.ts` files for hierarchical configuration.
- **CLI Version Helper**: Reads package version from package.json for CLI --version flag.
- **Validate Patterns CLI**: Cross-validates TypeScript patterns vs Gherkin feature files.
- **Lint Patterns CLI**: Validates pattern annotations for quality and completeness.
- **Documentation Generator CLI**: Replaces multiple specialized CLIs with one unified interface that supports multiple generators in a single run.
- **CLI Error Handler**: Provides type-safe error handling for all CLI commands using the DocError discriminated union pattern.
- **Scope Validator Impl**: Pure function composition over ProcessStateAPI and MasterDataset.
- **Handoff Generator Impl**: Pure function that assembles a handoff document from ProcessStateAPI and MasterDataset.
- **Validation Rules Codec**: Transforms MasterDataset into a RenderableDocument for Process Guard validation rules reference.
- **Timeline Codec**: Transforms MasterDataset into RenderableDocuments for timeline outputs: - ROADMAP.md (phase breakdown with progress)...
- **Taxonomy Codec**: Transforms MasterDataset into a RenderableDocument for taxonomy reference output.
- **Shared Codec Schema**: Provides a simplified RenderableDocument output schema for use with Zod 4 codecs.
- **Session Codec**: Transforms MasterDataset into RenderableDocuments for session/planning outputs: - SESSION-CONTEXT.md (current session...
- **Requirements Codec**: Transforms MasterDataset into RenderableDocument for PRD/requirements output.
- **Reporting Codecs**: Transforms MasterDataset into RenderableDocuments for reporting outputs: - CHANGELOG-GENERATED.md (Keep a Changelog...
- **Pr Changes Codec**: Transforms MasterDataset into RenderableDocument for PR-scoped output.
- **Planning Codecs**: Transforms MasterDataset into RenderableDocuments for planning outputs: - PLANNING-CHECKLIST.md (pre-planning...
- **Patterns Codec**: Transforms MasterDataset into a RenderableDocument for pattern registry output.
- **Document Codecs**: Barrel export for all document codecs.
- **Rich Content Helpers**: Shared helper functions for rendering Gherkin rich content in document codecs.
- **Decision Doc Codec**: Parses decision documents (ADR/PDR in .feature format) and extracts content for documentation generation.
- **Business Rules Codec**: Transforms MasterDataset into a RenderableDocument for business rules output.
- **Architecture Codec**: Transforms MasterDataset into a RenderableDocument containing architecture diagrams (Mermaid) generated from source...
- **Adr Document Codec**: Transforms MasterDataset into RenderableDocument for Architecture Decision Records.
- **Built In Generators**: Registers all codec-based generators on import using the RDM (RenderableDocument Model) architecture.
- **Decision Doc Generator**: Orchestrates the full pipeline for generating documentation from decision documents (ADR/PDR in .feature format): 1.
- **Codec Generator Registration**: Registers codec-based generators for the RenderableDocument Model (RDM) system.
- **Transform Dataset**: Transforms raw extracted patterns into a MasterDataset with all pre-computed views.
- **Pipeline Module**: Barrel export for the unified transformation pipeline components.
- **Codec Base Options**: Shared types, interfaces, and utilities for all document codecs.
- **Universal Doc Generator Robustness**: This feature transforms the PoC document generator into a production-ready universal generator capable of operating...
- **Shape Extraction**: Documentation comments duplicate type definitions that exist in the same file.
- **Scoped Architectural View**: Full architecture diagrams show every annotated pattern in the project.
- **Process State API CLI**: The ProcessStateAPI provides 27 typed query methods for efficient state queries, but Claude Code sessions cannot use...
- **Doc Generation Proof Of Concept**: Status: SUPERSEDED - This POC has been implemented.
- **Data API Stub Integration**: Design sessions produce code stubs in `delivery-process/stubs/` with rich metadata: `@target` (destination file...
- **Data API Design Session Support**: Starting a design or implementation session requires manually compiling elaborate context prompts.
- **Data API Output Shaping**: The ProcessStateAPI CLI returns raw `ExtractedPattern` objects via `JSON.stringify`.
- **Data API Context Assembly**: Starting a Claude Code design or implementation session requires assembling 30-100KB of curated, multi-source context...
- **Data API Architecture Queries**: The current `arch` subcommand provides basic queries (roles, context, layer, graph) but lacks deeper analysis needed...
- **Codec Driven Reference Generation**: Each reference document (Process Guard, Taxonomy, Validation, etc.) required a hand-coded recipe feature that...
- **PDR 001 Self Documentation**
- **Process Guard**: The delivery workflow needs protection against accidental modifications: - Completed specs get modified without...
- **ADR 005 Configurable Tag Prefix**: The delivery process uses `@libar-docs-*` as the default tag prefix for all metadata annotations.
- **ADR 004 Gherkin Only Testing**: The delivery-process package had dual test approaches creating inconsistency.
- **ADR 003 Ephemeral Persistent Separation**: Generated documentation mixed session-specific content with persistent docs.
- **ADR 002 Progressive Disclosure Architecture**: Single-file PRD documentation became unwieldy at scale.
- **ADR 001 Problem Solution Descriptions**: Feature descriptions in Gherkin files lacked consistent structure.

---
