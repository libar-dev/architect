#!/usr/bin/env node
/**
 * @libar-docs
 * @libar-docs-core @libar-docs-cli
 * @libar-docs-pattern ProcessAPICLIImpl
 * @libar-docs-status active
 * @libar-docs-implements ProcessStateAPICLI
 * @libar-docs-arch-role service
 * @libar-docs-arch-context cli
 * @libar-docs-arch-layer application
 * @libar-docs-uses ProcessStateAPI, MasterDataset, Pattern Scanner, Doc Extractor, Gherkin Scanner, Gherkin Extractor, PatternSummarizerImpl, FuzzyMatcherImpl, OutputPipelineImpl
 * @libar-docs-used-by npm scripts, Claude Code sessions
 * @libar-docs-usecase "When querying delivery process state from CLI"
 * @libar-docs-usecase "When Claude Code needs real-time delivery state queries"
 *
 * ## process-api - CLI Query Interface to ProcessStateAPI
 *
 * Exposes ProcessStateAPI methods as CLI subcommands with JSON output.
 * Runs pipeline steps 1-8 (config -> scan -> extract -> transform),
 * then routes subcommands to API methods.
 *
 * ### When to Use
 *
 * - When Claude Code needs real-time delivery state queries
 * - When AI agents need structured JSON instead of regenerating markdown
 * - When scripting delivery process queries in CI/CD
 *
 * ### Key Concepts
 *
 * - **Subcommand Routing**: CLI subcommands map to ProcessStateAPI methods
 * - **JSON Output**: All output is JSON to stdout, errors to stderr
 * - **Pipeline Reuse**: Steps 1-8 match generate-docs exactly
 * - **QueryResult Envelope**: All output wrapped in success/error discriminated union
 * - **Output Shaping**: 594KB -> 4KB via summarization and modifiers
 */
export {};
//# sourceMappingURL=process-api.d.ts.map