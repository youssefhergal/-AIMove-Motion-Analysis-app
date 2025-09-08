/**
 * Centralized Error Handling System
 * 
 * Provides consistent error handling across the application
 * with proper logging, user feedback, and error recovery.
 */

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
}

/**
 * Error categories for better organization
 */
export const ERROR_CATEGORY = {
    ANALYSIS: 'analysis',
    UI: 'ui',
    DATA: 'data',
    NETWORK: 'network',
    VALIDATION: 'validation',
    UNKNOWN: 'unknown'
}

/**
 * Error Handler Class
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = []
        this.maxLogSize = 100
    }

    /**
     * Handle an error with context and severity
     * @param {Error|string} error - The error to handle
     * @param {string} context - Where the error occurred
     * @param {string} severity - Error severity level
     * @param {string} category - Error category
     * @param {Object} metadata - Additional error metadata
     */
    handle(error, context, severity = ERROR_SEVERITY.MEDIUM, category = ERROR_CATEGORY.UNKNOWN, metadata = {}) {
        const errorEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : null,
            context,
            severity,
            category,
            metadata
        }

        // Add to error log
        this.errorLog.unshift(errorEntry)
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize)
        }

        // Log based on severity
        this._logError(errorEntry)

        // Handle based on severity
        this._handleBySeverity(errorEntry)

        return errorEntry
    }

    /**
     * Log error to console with appropriate level
     * @private
     */
    _logError(errorEntry) {
        const { error, context, severity, category } = errorEntry
        const prefix = `❌ [${severity.toUpperCase()}] [${category}] ${context}:`
        
        switch (severity) {
            case ERROR_SEVERITY.LOW:
                console.warn(`${prefix}`, error)
                break
            case ERROR_SEVERITY.MEDIUM:
                console.error(`${prefix}`, error)
                break
            case ERROR_SEVERITY.HIGH:
                console.error(`${prefix}`, error, errorEntry.metadata)
                break
            case ERROR_SEVERITY.CRITICAL:
                console.error(`${prefix}`, error, errorEntry.metadata)
                console.error('Stack trace:', errorEntry.stack)
                break
        }
    }

    /**
     * Handle error based on severity level
     * @private
     */
    _handleBySeverity(errorEntry) {
        const { severity, category, context } = errorEntry

        switch (severity) {
            case ERROR_SEVERITY.LOW:
                // Just log, no user notification
                break
                
            case ERROR_SEVERITY.MEDIUM:
                // Show user-friendly message in console
                console.warn(`⚠️ ${context}: ${errorEntry.error}`)
                break
                
            case ERROR_SEVERITY.HIGH:
                // Show user-friendly message and suggest recovery
                console.error(`🚨 ${context}: ${errorEntry.error}`)
                this._suggestRecovery(errorEntry)
                break
                
            case ERROR_SEVERITY.CRITICAL:
                // Critical error - show detailed message
                console.error(`💥 CRITICAL ERROR in ${context}: ${errorEntry.error}`)
                this._suggestRecovery(errorEntry)
                break
        }
    }

    /**
     * Suggest recovery actions based on error category
     * @private
     */
    _suggestRecovery(errorEntry) {
        const { category, context } = errorEntry

        switch (category) {
            case ERROR_CATEGORY.ANALYSIS:
                console.info('💡 Suggestion: Try different analysis parameters or check your data')
                break
            case ERROR_CATEGORY.DATA:
                console.info('💡 Suggestion: Check if your BVH files are properly loaded')
                break
            case ERROR_CATEGORY.VALIDATION:
                console.info('💡 Suggestion: Verify your input parameters are valid')
                break
            case ERROR_CATEGORY.UI:
                console.info('💡 Suggestion: Try refreshing the page or clearing your selections')
                break
            default:
                console.info('💡 Suggestion: Check the console for more details or try refreshing the page')
        }
    }

    /**
     * Get recent errors
     * @param {number} limit - Number of recent errors to return
     * @returns {Array} Recent error entries
     */
    getRecentErrors(limit = 10) {
        return this.errorLog.slice(0, limit)
    }

    /**
     * Get errors by category
     * @param {string} category - Error category to filter by
     * @returns {Array} Filtered error entries
     */
    getErrorsByCategory(category) {
        return this.errorLog.filter(error => error.category === category)
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = []
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getStats() {
        const stats = {
            total: this.errorLog.length,
            bySeverity: {},
            byCategory: {},
            recent: this.errorLog.slice(0, 5)
        }

        // Count by severity
        Object.values(ERROR_SEVERITY).forEach(severity => {
            stats.bySeverity[severity] = this.errorLog.filter(e => e.severity === severity).length
        })

        // Count by category
        Object.values(ERROR_CATEGORY).forEach(category => {
            stats.byCategory[category] = this.errorLog.filter(e => e.category === category).length
        })

        return stats
    }
}

// Create global error handler instance
export const errorHandler = new ErrorHandler()

// Convenience functions for common error patterns
export const handleAnalysisError = (error, context, metadata = {}) => {
    return errorHandler.handle(error, context, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORY.ANALYSIS, metadata)
}

export const handleDataError = (error, context, metadata = {}) => {
    return errorHandler.handle(error, context, ERROR_SEVERITY.HIGH, ERROR_CATEGORY.DATA, metadata)
}

export const handleUIError = (error, context, metadata = {}) => {
    return errorHandler.handle(error, context, ERROR_SEVERITY.LOW, ERROR_CATEGORY.UI, metadata)
}

export const handleValidationError = (error, context, metadata = {}) => {
    return errorHandler.handle(error, context, ERROR_SEVERITY.MEDIUM, ERROR_CATEGORY.VALIDATION, metadata)
}

export const handleCriticalError = (error, context, metadata = {}) => {
    return errorHandler.handle(error, context, ERROR_SEVERITY.CRITICAL, ERROR_CATEGORY.UNKNOWN, metadata)
}
