/**
 * @architect
 * @architect-pattern CLIVersionHelper
 * @architect-cli
 * @architect-status completed
 * @architect-role:utility
 * @architect-bounded-context:cli
 * @architect-uses CLIRuntimePaths
 * LintPatternsCLI, TagTaxonomyCLI, ValidatePatternsCLI
 *
 * ## CLIVersionHelper - Package Version Reader
 *
 * Reads package version from package.json for CLI --version flag.
 *
 * ### When to Use
 *
 * - Use in CLI entry points to display package version
 * - Call early in argument parsing before other operations
 */

import { readCliPackageMetadata } from './runtime-helpers.js';

/**
 * Get the package version from package.json
 *
 * @returns Package version string (e.g., "0.1.0")
 */
export function getPackageVersion(): string {
  try {
    return readCliPackageMetadata().version;
  } catch {
    return 'unknown';
  }
}

/**
 * Get the package name from package.json
 *
 * @returns Package name (e.g., "@libar-dev/architect-cli")
 */
export function getPackageName(): string {
  try {
    return readCliPackageMetadata().name;
  } catch {
    return 'architect';
  }
}

/**
 * Print version information and exit
 *
 * @param cliName - Name of the CLI command (e.g., "architect-generate")
 */
export function printVersionAndExit(cliName: string): never {
  process.stdout.write(`${cliName} (${getPackageName()}) v${getPackageVersion()}\n`);
  process.exit(0);
}
