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
/**
 * Get the package version from package.json
 *
 * @returns Package version string (e.g., "0.1.0")
 */
export declare function getPackageVersion(): string;
/**
 * Get the package name from package.json
 *
 * @returns Package name (e.g., "@libar-dev/delivery-process")
 */
export declare function getPackageName(): string;
/**
 * Print version information and exit
 *
 * @param cliName - Name of the CLI command (e.g., "generate-docs")
 */
export declare function printVersionAndExit(cliName: string): never;
//# sourceMappingURL=version.d.ts.map