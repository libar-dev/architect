/**
 * @libar-docs
 * @libar-docs-generator
 * @libar-docs-pattern BuiltInGenerators
 * @libar-docs-status completed
 * @libar-docs-uses GeneratorRegistry, CodecBasedGenerator
 *
 * ## BuiltInGenerators - Default Generator Bootstrap
 *
 * Registers all codec-based generators on import using the RDM
 * (RenderableDocument Model) architecture.
 *
 * All generators use Zod 4 codecs to transform MasterDataset
 * into RenderableDocuments, which are then rendered to markdown.
 *
 * ### When to Use
 *
 * - Use when setting up documentation generation for a project
 * - Import this module to register all default generators
 */
import "./codec-generators.js";
//# sourceMappingURL=index.d.ts.map