/**
 * Shared utilities for the vitest-cucumber step linter.
 */

/**
 * Strip content inside quoted strings (single and double quotes) from text.
 *
 * Returns the text with quoted content replaced by empty quote pairs.
 * This allows lint checks to detect problematic characters (like $ or #)
 * only when they appear OUTSIDE of quoted string values in step text.
 *
 * Example: `parse JSON '{"$schema": "..."}' now` → `parse JSON '' now`
 */
export function stripQuotedContent(text: string): string {
  return text.replace(/"[^"]*"|'[^']*'/g, (match) => {
    // Preserve the quote characters but remove inner content
    const quote = match.charAt(0);
    return `${quote}${quote}`;
  });
}

/**
 * Count the net brace balance on a line: +1 for {, -1 for }.
 * Ignores braces inside string literals (single/double/backtick quotes).
 *
 * Used by both step-checks and cross-checks to track scenario block
 * boundaries via brace depth counting.
 */
export function countBraceBalance(line: string): number {
  let balance = 0;
  let inString: string | null = null;
  let escaped = false;

  for (const ch of line) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (inString !== null) {
      if (ch === inString) {
        inString = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '{') balance++;
    if (ch === '}') balance--;
  }

  return balance;
}
