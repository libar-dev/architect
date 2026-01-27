/**
 * Token estimation utilities.
 *
 * @module @libar-dev/modular-claude-md/utils/tokens
 */

/**
 * Estimate token count from content.
 * Uses a rough approximation of ~4 characters per token.
 *
 * @param content - The content to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}
