/**
 * Additive mode exports.
 *
 * @module @libar-dev/modular-claude-md/additive
 */

export { generateAdditiveLayer, generateAllAdditiveLayers, getAdditiveLayer } from "./generator.js";

export {
  generateManifestEntries,
  generateManifestContent,
  writeManifest,
  type ManifestEntry,
} from "./manifest.js";
