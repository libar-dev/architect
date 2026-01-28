/**
 * Utility module exports.
 *
 * @module @libar-dev/modular-claude-md/utils
 */

export { colors, log, logSection, formatStatus, type ColorName } from "./colors.js";
export { estimateTokens } from "./tokens.js";
export {
  writeVariationFile,
  getVariationOutputPath,
  getAdditiveOutputPath,
  createBuildResult,
} from "./writer.js";
