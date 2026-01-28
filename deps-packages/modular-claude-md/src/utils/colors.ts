/**
 * ANSI color helpers for terminal output.
 *
 * @module @libar-dev/modular-claude-md/utils/colors
 */

/** ANSI color codes */
export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
} as const;

export type ColorName = keyof typeof colors;

/**
 * Log a message with an optional color.
 */
export function log(message: string, color: ColorName = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Log a section header.
 */
export function logSection(title: string): void {
  console.log();
  log(`━━━ ${title} ━━━`, "cyan");
}

/**
 * Format a success/failure status.
 */
export function formatStatus(value: number, budget: number): { text: string; color: ColorName } {
  if (value <= budget) {
    return { text: `✓ within budget`, color: "green" };
  }
  return { text: `⚠ over budget by ${value - budget}`, color: "yellow" };
}
