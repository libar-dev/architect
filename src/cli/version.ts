/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern CLIVersionHelper
 * @libar-docs-status completed
 * @libar-docs-used-by DocumentationGeneratorCLI, LintPatternsCLI, TagTaxonomyCLI, ValidatePatternsCLI
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

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * Get the package version from package.json
 *
 * @returns Package version string (e.g., "0.1.0")
 */
export function getPackageVersion(): string {
  try {
    // Resolve path relative to this file: src/cli/version.ts -> package.json
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packagePath = join(__dirname, "..", "..", "package.json");

    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8")) as {
      version?: string;
      name?: string;
    };
    return packageJson.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Get the package name from package.json
 *
 * @returns Package name (e.g., "@libar-dev/delivery-process")
 */
export function getPackageName(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packagePath = join(__dirname, "..", "..", "package.json");

    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8")) as {
      name?: string;
    };
    return packageJson.name ?? "delivery-process";
  } catch {
    return "delivery-process";
  }
}

/**
 * Print version information and exit
 *
 * @param cliName - Name of the CLI command (e.g., "generate-docs")
 */
export function printVersionAndExit(cliName: string): never {
  console.log(`${cliName} (${getPackageName()}) v${getPackageVersion()}`);
  process.exit(0);
}
