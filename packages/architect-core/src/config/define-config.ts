/**
 * @architect
 * @architect-pattern DefineConfig
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:configuration
 *
 * ## DefineConfig - Type-helper for `architect.config.ts`
 *
 * Pass-through generic that lets users author `defineConfig({...})` and
 * have TypeScript infer the exact `ArchitectProjectConfig` shape for
 * autocomplete + validation feedback in their config file.
 *
 * ### When to Use
 *
 * - Project root `architect.config.ts`: wrap the literal in `defineConfig`
 */
import type { ArchitectProjectConfig } from './project-config.js';

export function defineConfig<TConfig extends ArchitectProjectConfig>(config: TConfig): TConfig {
  return config;
}
