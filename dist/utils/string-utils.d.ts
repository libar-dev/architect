/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern StringUtilities
 * @libar-docs-status completed
 * @libar-docs-used-by DocExtractor, SectionRenderer
 *
 * ## StringUtilities - Text Transformation Functions
 *
 * Provides shared utilities for string manipulation used across the delivery-process package,
 * including slugification for URLs/filenames and Markdown formatting cleanup.
 *
 * ### When to Use
 *
 * - Use `slugify()` when generating URL-safe identifiers for HTML anchors or filenames
 * - Use when normalizing text for consistent formatting across generated docs
 */
/**
 * Convert a string to a URL/filename-safe slug (lowercase, alphanumeric, hyphens)
 *
 * Transforms text into a normalized format suitable for:
 * - HTML anchor IDs
 * - Filenames
 * - URL slugs
 *
 * **Note:** Non-ASCII characters (including Unicode) are removed, not transliterated.
 * For example, `"hello-日本語"` becomes `"hello"`.
 *
 * @param text - Input text to slugify
 * @returns Slug string (lowercase, alphanumeric with hyphens)
 *
 * @example
 * ```typescript
 * slugify('User Authentication');    // 'user-authentication'
 * slugify('Create User (v2)');       // 'create-user-v2'
 * slugify('---test---');             // 'test'
 * slugify('Hello  World!');          // 'hello-world'
 * slugify('UPPER_CASE_TEXT');        // 'upper-case-text'
 * ```
 */
export declare function slugify(text: string): string;
/**
 * Convert CamelCase or PascalCase text to kebab-case with proper word separation
 *
 * Handles various naming conventions:
 * - PascalCase: `DeciderPattern` → `decider-pattern`
 * - Mixed case: `BddTestingInfrastructure` → `bdd-testing-infrastructure`
 * - Consecutive uppercase: `APIEndpoint` → `api-endpoint`
 * - Numbers: `OAuth2Flow` → `o-auth-2-flow`
 * - Already kebab-case: `already-kebab` → `already-kebab`
 *
 * **Note:** Unlike `slugify()`, this function properly splits CamelCase words
 * instead of just lowercasing them together.
 *
 * @param text - Input text (CamelCase, PascalCase, or mixed)
 * @returns kebab-case string
 *
 * @example
 * ```typescript
 * toKebabCase('DeciderPattern');               // 'decider-pattern'
 * toKebabCase('BddTestingInfrastructure');     // 'bdd-testing-infrastructure'
 * toKebabCase('APIEndpoint');                  // 'api-endpoint'
 * toKebabCase('OAuth2Flow');                   // 'o-auth-2-flow'
 * toKebabCase('DCB');                          // 'dcb'
 * toKebabCase('ProcessGuardLinter');           // 'process-guard-linter'
 * toKebabCase('already-kebab');                // 'already-kebab'
 * toKebabCase('Pattern (v2)');                 // 'pattern-v2'
 * ```
 */
export declare function toKebabCase(text: string): string;
/**
 * Convert CamelCase or PascalCase text to "Title Case" with spaces
 *
 * Handles various naming conventions:
 * - PascalCase: `RemainingWorkEnhancement` → `Remaining Work Enhancement`
 * - Acronyms: `HTTPServer` → `HTTP Server`
 * - Mixed: `OAuth2Client` → `OAuth2 Client`
 * - kebab-case: `remaining-work` → `remaining work`
 * - Known acronyms: `DoDValidator` → `DoD Validator` (not `Do D Validator`)
 *
 * @param text - Input text in CamelCase, PascalCase, or kebab-case
 * @returns Human-readable title case string
 *
 * @example
 * ```typescript
 * camelCaseToTitleCase('RemainingWorkEnhancement'); // 'Remaining Work Enhancement'
 * camelCaseToTitleCase('HTTPServer');                // 'HTTP Server'
 * camelCaseToTitleCase('OAuth2Client');              // 'OAuth2 Client'
 * camelCaseToTitleCase('XMLParser');                 // 'XML Parser'
 * camelCaseToTitleCase('parseJSON');                 // 'parse JSON'
 * camelCaseToTitleCase('DoDValidator');              // 'DoD Validator'
 * camelCaseToTitleCase('TypeScriptAST');             // 'TypeScript AST'
 * ```
 */
export declare function camelCaseToTitleCase(text: string): string;
//# sourceMappingURL=string-utils.d.ts.map