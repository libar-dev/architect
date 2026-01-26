/**
 * Delivery-process package configuration.
 *
 * Uses @libar-docs- prefix with simplified 3-category taxonomy.
 * This configuration is used when running CLI tools within the package itself.
 *
 * Categories:
 * - @libar-docs-core: Core patterns and utilities
 * - @libar-docs-api: Public API exports
 * - @libar-docs-infra: Infrastructure and configuration
 */
import { createDeliveryProcess } from "./src/index.js";

export default createDeliveryProcess({ preset: "libar-generic" });
