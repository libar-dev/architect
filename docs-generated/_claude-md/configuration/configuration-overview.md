=== CONFIGURATION OVERVIEW ===

Purpose: Configuration product area overview
Detail Level: Compact summary

**How do I configure the tool?** Config loading, presets, resolution.


=== API TYPES ===

| Type | Kind |
| --- | --- |
| CreateDeliveryProcessOptions | interface |
| createDeliveryProcess | function |
| ConfigDiscoveryResult | interface |
| ConfigLoadError | interface |
| ConfigLoadResult | type |
| findConfigFile | function |
| loadConfig | function |
| formatConfigError | function |


=== BEHAVIOR SPECIFICATIONS ===

--- SourceMerging ---

| Rule | Description |
| --- | --- |
| No override returns base unchanged |  |
| Feature overrides control feature source selection |  |
| TypeScript source overrides append additional input |  |
| Combined overrides apply together |  |
| Exclude is always inherited from base |  |

--- ProjectConfigLoader ---

| Rule | Description |
| --- | --- |
| Missing config returns defaults |  |
| New-style config is loaded and resolved |  |
| Legacy config is loaded with backward compatibility |  |
| Invalid configs produce clear errors |  |

--- PresetSystem ---

| Rule | Description |
| --- | --- |
| Generic preset provides minimal taxonomy |  |
| Libar generic preset provides minimal taxonomy with libar prefix |  |
| DDD-ES-CQRS preset provides full taxonomy |  |
| Presets can be accessed by name |  |

--- DefineConfigTesting ---

| Rule | Description |
| --- | --- |
| defineConfig is an identity function |  |
| Schema validates correct configurations |  |
| Schema rejects invalid configurations |  |
| Type guards distinguish config formats |  |

--- ConfigurationAPI ---

| Rule | Description |
| --- | --- |
| Factory creates configured instances with correct defaults |  |
| Custom prefix configuration works correctly |  |
| Preset categories replace base categories entirely |  |
| Regex builders use configured prefix |  |

--- ConfigResolution ---

| Rule | Description |
| --- | --- |
| Default config provides sensible fallbacks |  |
| Preset creates correct taxonomy instance |  |
| Stubs are merged into typescript sources |  |
| Output defaults are applied |  |
| Generator defaults are applied |  |
| Context inference rules are prepended |  |
| Config path is carried from options |  |

--- ConfigLoaderTesting ---

| Rule | Description |
| --- | --- |
| Config files are discovered by walking up directories |  |
| Config discovery stops at repo root |  |
| Config is loaded and validated |  |
| Config errors are formatted for display |  |
