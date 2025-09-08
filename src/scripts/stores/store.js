/**
 * Legacy Store - Backward Compatibility
 * 
 * This file maintains backward compatibility while delegating
 * to the new domain-specific stores. This allows for gradual migration.
 * 
 * @deprecated Use individual store files from ./stores/ directory
 */

// Re-export everything from the new domain-specific stores
export * from './index.js'

