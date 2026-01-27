/**
 * Path transformation for relative links.
 *
 * @module @libar-dev/modular-claude-md/builder/transformer
 */

/**
 * Transform relative paths in module content to be correct for the variation's output location.
 *
 * Paths in source modules are written relative to the project root (e.g., `docs/architecture/...`).
 * When a variation outputs to a subdirectory, these paths need to be adjusted with `../` prefixes.
 *
 * @example
 * // Source path: `docs/architecture/COMPONENT_ISOLATION.md`
 * // Variation path: `/packages/@libar-dev` (2 levels deep)
 * // Transformed: `../../docs/architecture/COMPONENT_ISOLATION.md`
 *
 * @param content - The markdown content to transform
 * @param variationPath - The variation's output path (e.g., "/" or "/packages/foo")
 * @returns Transformed content with adjusted paths
 */
export function transformPaths(content: string, variationPath: string): string {
  // Root variation doesn't need transformation
  if (variationPath === "/") {
    return content;
  }

  // Calculate depth: count path segments (e.g., /packages/@libar-dev = 2 levels)
  const segments = variationPath.split("/").filter((s) => s.length > 0);
  const depth = segments.length;
  const prefix = "../".repeat(depth);

  // Transform markdown links: [text](relative/path)
  // Only transform paths that:
  // 1. Don't start with http(s):// (external URLs)
  // 2. Don't start with / (absolute paths)
  // 3. Don't start with # (anchor links)
  // 4. Don't start with ../ (already relative to parent)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  return content.replace(linkPattern, (match, text: string, url: string) => {
    // Skip URLs with any URI scheme (http, https, mailto, tel, data, etc.)
    // Also skip absolute paths, anchors, and already-prefixed paths
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
    if (hasScheme || url.startsWith("/") || url.startsWith("#") || url.startsWith("../")) {
      return match;
    }

    // Transform the path
    return `[${text}](${prefix}${url})`;
  });
}

/**
 * Transform paths for an additive layer's output location.
 *
 * @param content - The markdown content to transform
 * @param outputDir - The layer's output directory (e.g., ".claude-layers/delivery-process")
 * @returns Transformed content with adjusted paths
 */
export function transformAdditiveLayerPaths(content: string, outputDir: string): string {
  // Calculate depth from output directory
  const segments = outputDir.split("/").filter((s) => s.length > 0);
  const depth = segments.length;
  const prefix = "../".repeat(depth);

  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  return content.replace(linkPattern, (match, text: string, url: string) => {
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
    if (hasScheme || url.startsWith("/") || url.startsWith("#") || url.startsWith("../")) {
      return match;
    }
    return `[${text}](${prefix}${url})`;
  });
}
