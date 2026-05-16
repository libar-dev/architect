/**
 * `@libar-dev/architect` — meta-package barrel.
 *
 * Re-exports the public APIs of every split package so consumers can do
 * `import { ... } from '@libar-dev/architect'` instead of importing from
 * each split individually. The granular splits remain available for users
 * who want narrower dependency trees.
 */

export * from '@libar-dev/architect-core';
export * from '@libar-dev/architect-projection';
export * from '@libar-dev/architect-guard';
