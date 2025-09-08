/**
 * Centralized Logging System
 * 
 * Provides consistent logging across the application
 * with different log levels and formatting.
 */

/**
 * Log levels
 */
export const LOG_LEVEL = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
}

/**
 * Log categories for better organization
 */
export const LOG_CATEGORY = {
    ANALYSIS: 'analysis',
    UI: 'ui',
    DATA: 'data',
    PERFORMANCE: 'performance',
    USER_ACTION: 'user_action',
    SYSTEM: 'system'
}

/**
 * Logger Class
 */
export class Logger {
    constructor() {
        this.logs = []
        this.maxLogSize = 200
        this.enabledLevels = new Set([LOG_LEVEL.INFO, LOG_LEVEL.WARN, LOG_LEVEL.ERROR])
    }

    /**
     * Enable/disable specific log levels
     * @param {Array} levels - Array of log levels to enable
     */
    setEnabledLevels(levels) {
        this.enabledLevels = new Set(levels)
    }

    /**
     * Log a message with level and category
     * @param {string} level - Log level
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {*} data - Additional data to log
     */
    log(level, category, message, data = null) {
        if (!this.enabledLevels.has(level)) {
            return
        }

        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            data
        }

        // Add to logs
        this.logs.unshift(logEntry)
        if (this.logs.length > this.maxLogSize) {
            this.logs = this.logs.slice(0, this.maxLogSize)
        }

        // Log to console
        this._logToConsole(logEntry)
    }

    /**
     * Log to console with appropriate formatting
     * @private
     */
    _logToConsole(logEntry) {
        const { level, category, message, data } = logEntry
        const timestamp = new Date().toLocaleTimeString()
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`

        switch (level) {
            case LOG_LEVEL.DEBUG:
                console.debug(`${prefix} ${message}`, data || '')
                break
            case LOG_LEVEL.INFO:
                console.log(`ℹ️ ${prefix} ${message}`, data || '')
                break
            case LOG_LEVEL.WARN:
                console.warn(`⚠️ ${prefix} ${message}`, data || '')
                break
            case LOG_LEVEL.ERROR:
                console.error(`❌ ${prefix} ${message}`, data || '')
                break
        }
    }

    /**
     * Debug level logging
     */
    debug(category, message, data = null) {
        this.log(LOG_LEVEL.DEBUG, category, message, data)
    }

    /**
     * Info level logging
     */
    info(category, message, data = null) {
        this.log(LOG_LEVEL.INFO, category, message, data)
    }

    /**
     * Warning level logging
     */
    warn(category, message, data = null) {
        this.log(LOG_LEVEL.WARN, category, message, data)
    }

    /**
     * Error level logging
     */
    error(category, message, data = null) {
        this.log(LOG_LEVEL.ERROR, category, message, data)
    }

    /**
     * Get recent logs
     * @param {number} limit - Number of recent logs to return
     * @returns {Array} Recent log entries
     */
    getRecentLogs(limit = 50) {
        return this.logs.slice(0, limit)
    }

    /**
     * Get logs by category
     * @param {string} category - Log category to filter by
     * @returns {Array} Filtered log entries
     */
    getLogsByCategory(category) {
        return this.logs.filter(log => log.category === category)
    }

    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = []
    }

    /**
     * Get log statistics
     * @returns {Object} Log statistics
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byCategory: {},
            recent: this.logs.slice(0, 10)
        }

        // Count by level
        Object.values(LOG_LEVEL).forEach(level => {
            stats.byLevel[level] = this.logs.filter(l => l.level === level).length
        })

        // Count by category
        Object.values(LOG_CATEGORY).forEach(category => {
            stats.byCategory[category] = this.logs.filter(l => l.category === category).length
        })

        return stats
    }
}

// Create global logger instance
export const logger = new Logger()

// Convenience functions for common logging patterns
export const logAnalysis = (message, data = null) => {
    logger.info(LOG_CATEGORY.ANALYSIS, message, data)
}

export const logUI = (message, data = null) => {
    logger.info(LOG_CATEGORY.UI, message, data)
}

export const logData = (message, data = null) => {
    logger.info(LOG_CATEGORY.DATA, message, data)
}

export const logPerformance = (message, data = null) => {
    logger.info(LOG_CATEGORY.PERFORMANCE, message, data)
}

export const logUserAction = (message, data = null) => {
    logger.info(LOG_CATEGORY.USER_ACTION, message, data)
}

export const logSystem = (message, data = null) => {
    logger.info(LOG_CATEGORY.SYSTEM, message, data)
}

// Error logging shortcuts
export const logAnalysisError = (message, data = null) => {
    logger.error(LOG_CATEGORY.ANALYSIS, message, data)
}

export const logDataError = (message, data = null) => {
    logger.error(LOG_CATEGORY.DATA, message, data)
}

export const logUIError = (message, data = null) => {
    logger.error(LOG_CATEGORY.UI, message, data)
}
