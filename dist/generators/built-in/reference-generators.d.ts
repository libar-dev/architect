/**
 * @libar-docs
 * @libar-docs-pattern ReferenceGeneratorRegistration
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Reference Generator Registrations
 *
 * Registers all 11 reference document generators. Each config produces
 * TWO generators: detailed (docs/) and summary (_claude-md/).
 */
import type { GeneratorRegistry } from '../registry.js';
import { type ReferenceDocConfig } from '../../renderable/codecs/reference.js';
/**
 * All reference document configurations.
 *
 * Each entry defines one reference document's convention sources and shape globs.
 */
export declare const REFERENCE_CONFIGS: readonly ReferenceDocConfig[];
/**
 * Registers all reference generators in the GeneratorRegistry.
 *
 * Registers:
 * - "reference-docs" meta-generator (produces all 22 files at once)
 * - 22 individual generators for selective invocation:
 *   "{name}-reference" -> detailed, "{name}-reference-claude" -> summary
 */
export declare function registerReferenceGenerators(registry: GeneratorRegistry): void;
//# sourceMappingURL=reference-generators.d.ts.map