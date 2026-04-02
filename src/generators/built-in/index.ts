/**
 * @architect
 * @architect-generator
 * @architect-pattern BuiltInGenerators
 * @architect-status completed
 * @architect-uses GeneratorRegistry, CodecBasedGenerator
 *
 * ## BuiltInGenerators - Default Generator Bootstrap
 *
 * Registers all codec-based generators on import using the RDM
 * (RenderableDocument Model) architecture.
 *
 * All generators use Zod 4 codecs to transform PatternGraph
 * into RenderableDocuments, which are then rendered to markdown.
 *
 * ### When to Use
 *
 * - Use when setting up documentation generation for a project
 * - Import this module to register all default generators
 */

// Import to register codec-based generators (RDM architecture)
import './codec-generators.js';
