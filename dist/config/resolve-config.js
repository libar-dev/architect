/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ConfigResolver
 * @libar-docs-status active
 * @libar-docs-arch-layer application
 * @libar-docs-arch-context config
 * @libar-docs-arch-role service
 * @libar-docs-uses ProjectConfigTypes, DeliveryProcessFactory, ConfigurationDefaults
 * @libar-docs-used-by ConfigLoader
 *
 * ## Config Resolution
 *
 * Resolves a raw `DeliveryProcessProjectConfig` into a fully-resolved `ResolvedConfig`
 * with all defaults applied, stubs merged into TypeScript sources, and context inference
 * rules prepended to defaults.
 *
 * ### Architecture
 *
 * ```
 * DeliveryProcessProjectConfig (user-authored)
 *     |
 *     v
 * resolveProjectConfig() -- creates instance, merges sources, applies defaults
 *     |
 *     v
 * ResolvedConfig { instance, project, isDefault, configPath }
 * ```
 *
 * ### When to Use
 *
 * - Called by `loadProjectConfig()` after Zod validation succeeds
 * - Called directly in tests to resolve a config without file I/O
 * - `createDefaultResolvedConfig()` provides a fallback when no config file exists
 */
import { DEFAULT_CONTEXT_INFERENCE_RULES } from './defaults.js';
import { createDeliveryProcess } from './factory.js';
/**
 * Resolves a raw project config into a fully-resolved config with all defaults applied.
 *
 * Resolution steps:
 * 1. Create taxonomy instance from preset/override fields
 * 2. Merge stub globs into TypeScript sources
 * 3. Apply output defaults (directory, overwrite)
 * 4. Default generators to `['patterns']`
 * 5. Prepend user context inference rules before defaults
 * 6. Carry forward remaining fields with defaults
 *
 * @param raw - The raw project configuration (post-Zod validation)
 * @param options - Optional resolution options
 * @returns Fully resolved configuration ready for use by orchestrator and CLIs
 */
export function resolveProjectConfig(raw, options) {
    // 1. Create taxonomy instance from preset/override fields
    const instanceOptions = {};
    if (raw.preset !== undefined) {
        instanceOptions.preset = raw.preset;
    }
    if (raw.tagPrefix !== undefined) {
        instanceOptions.tagPrefix = raw.tagPrefix;
    }
    if (raw.fileOptInTag !== undefined) {
        instanceOptions.fileOptInTag = raw.fileOptInTag;
    }
    if (raw.categories !== undefined) {
        instanceOptions.categories = raw.categories;
    }
    const instance = createDeliveryProcess(instanceOptions);
    // 2. Resolve sources — merge stubs into typescript
    const typescript = [
        ...(raw.sources?.typescript ?? []),
        ...(raw.sources?.stubs ?? []),
    ];
    const features = raw.sources?.features ?? [];
    const exclude = raw.sources?.exclude ?? [];
    const sources = {
        typescript,
        features,
        exclude,
    };
    // 3. Resolve output — apply defaults
    const output = {
        directory: raw.output?.directory ?? 'docs/architecture',
        overwrite: raw.output?.overwrite ?? false,
    };
    // 4. Resolve generators — default to ['patterns']
    const generators = raw.generators ?? ['patterns'];
    // 5. Resolve context inference rules — prepend user rules to defaults
    const contextInferenceRules = [
        ...(raw.contextInferenceRules ?? []),
        ...DEFAULT_CONTEXT_INFERENCE_RULES,
    ];
    // 6. Copy remaining fields with defaults
    const generatorOverrides = raw.generatorOverrides ?? {};
    const workflowPath = raw.workflowPath ?? null;
    // 7. Reference document configs (explicit opt-in, empty by default)
    const referenceDocConfigs = raw.referenceDocConfigs ?? [];
    const project = {
        sources,
        output,
        generators,
        generatorOverrides,
        contextInferenceRules,
        workflowPath,
        ...(raw.codecOptions !== undefined && { codecOptions: raw.codecOptions }),
        referenceDocConfigs,
    };
    return {
        instance,
        project,
        isDefault: false,
        configPath: options.configPath,
    };
}
/**
 * Creates a default resolved config for when no config file is found.
 *
 * Uses the libar-generic preset with empty sources and standard defaults.
 * The `isDefault` flag is set to `true` so consumers can detect that
 * no user config was loaded.
 *
 * @returns A default ResolvedConfig with empty sources and standard defaults
 */
export function createDefaultResolvedConfig() {
    const instance = createDeliveryProcess();
    const sources = {
        typescript: [],
        features: [],
        exclude: [],
    };
    const project = {
        sources,
        output: {
            directory: 'docs/architecture',
            overwrite: false,
        },
        generators: ['patterns'],
        generatorOverrides: {},
        contextInferenceRules: [...DEFAULT_CONTEXT_INFERENCE_RULES],
        workflowPath: null,
        referenceDocConfigs: [],
    };
    return {
        instance,
        project,
        isDefault: true,
        configPath: undefined,
    };
}
//# sourceMappingURL=resolve-config.js.map