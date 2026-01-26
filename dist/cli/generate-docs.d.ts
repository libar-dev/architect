#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-core @libar-docs-cli
 * @libar-docs-pattern Documentation Generator CLI
 * @libar-docs-status completed
 * @libar-docs-uses Orchestrator, Generator Registry, Tag Registry Loader, Artefact Set Loader
 * @libar-docs-used-by npm scripts, CI pipelines
 * @libar-docs-usecase "When generating documentation from command line"
 * @libar-docs-usecase "When integrating doc generation into npm scripts"
 * @libar-docs-usecase "When using JSON config files for reproducible builds"
 * @libar-docs-usecase "When using predefined artefact sets for quick setup"
 *
 * ## generate-docs - Single Entry Point for All Documentation Generation
 *
 * Replaces multiple specialized CLIs with one unified interface that supports
 * multiple generators in a single run.
 *
 * ### When to Use
 *
 * - Generating any documentation from annotated TypeScript source
 * - Running multiple generators in one command
 * - Using JSON config files for reproducible builds
 * - Using predefined artefact sets (--artefact-set minimal, --artefact-set full)
 *
 * ### Key Concepts
 *
 * - **Multi-Generator**: Run patterns, adrs, overview, custom generators together
 * - **Config Files**: JSON configuration for complex setups
 * - **Explicit Registration**: Generators must be registered before use
 * - **Artefact Sets**: Predefined generator groupings for common use cases
 */
import "../generators/built-in/index.js";
//# sourceMappingURL=generate-docs.d.ts.map