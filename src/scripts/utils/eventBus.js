/**
 * Event Bus for Component Communication
 * 
 * Provides a centralized event system for component communication
 * without relying on global window pollution or prop drilling.
 */

/**
 * Event Bus Class
 */
export class EventBus {
    constructor() {
        this.events = new Map()
        this.maxListeners = 50
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to execute
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, options = {}) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set())
        }

        const eventSet = this.events.get(eventName)
        
        if (eventSet.size >= this.maxListeners) {
            console.warn(`⚠️ EventBus: Maximum listeners (${this.maxListeners}) reached for event "${eventName}"`)
            return () => {}
        }

        const listener = {
            callback,
            once: options.once || false,
            id: Date.now() + Math.random()
        }

        eventSet.add(listener)

        // Return unsubscribe function
        return () => {
            eventSet.delete(listener)
            if (eventSet.size === 0) {
                this.events.delete(eventName)
            }
        }
    }

    /**
     * Subscribe to an event that fires only once
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to execute
     * @returns {Function} Unsubscribe function
     */
    once(eventName, callback) {
        return this.on(eventName, callback, { once: true })
    }

    /**
     * Emit an event
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to listeners
     */
    emit(eventName, data = null) {
        if (!this.events.has(eventName)) {
            return
        }

        const eventSet = this.events.get(eventName)
        const listenersToRemove = []

        eventSet.forEach(listener => {
            try {
                listener.callback(data)
                
                if (listener.once) {
                    listenersToRemove.push(listener)
                }
            } catch (error) {
                console.error(`❌ EventBus: Error in listener for event "${eventName}":`, error)
            }
        })

        // Remove once listeners
        listenersToRemove.forEach(listener => {
            eventSet.delete(listener)
        })

        if (eventSet.size === 0) {
            this.events.delete(eventName)
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Name of the event
     */
    off(eventName) {
        this.events.delete(eventName)
    }

    /**
     * Remove all listeners
     */
    clear() {
        this.events.clear()
    }

    /**
     * Get listener count for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of listeners
     */
    listenerCount(eventName) {
        return this.events.has(eventName) ? this.events.get(eventName).size : 0
    }

    /**
     * Get all event names
     * @returns {Array} Array of event names
     */
    eventNames() {
        return Array.from(this.events.keys())
    }

    /**
     * Get statistics about the event bus
     * @returns {Object} Event bus statistics
     */
    getStats() {
        const stats = {
            totalEvents: this.events.size,
            totalListeners: 0,
            events: {}
        }

        this.events.forEach((listeners, eventName) => {
            stats.events[eventName] = listeners.size
            stats.totalListeners += listeners.size
        })

        return stats
    }
}

// Create global event bus instance
export const eventBus = new EventBus()

// Common event names for better organization
export const EVENTS = {
    // Analysis events
    ANALYSIS_STARTED: 'analysis:started',
    ANALYSIS_PROGRESS: 'analysis:progress',
    ANALYSIS_COMPLETED: 'analysis:completed',
    ANALYSIS_FAILED: 'analysis:failed',
    
    // Data events
    DATA_LOADED: 'data:loaded',
    DATA_CHANGED: 'data:changed',
    FILE_SELECTED: 'file:selected',
    
    // UI events
    SELECTION_CHANGED: 'selection:changed',
    FILTER_CHANGED: 'filter:changed',
    TAB_CHANGED: 'tab:changed',
    JOINT_SELECTED: 'joint:selected',
    
    // Table events
    TABLE_DATA_UPDATED: 'table:data:updated',
    TABLE_SELECTION_CHANGED: 'table:selection:changed',
    TABLE_FILTER_APPLIED: 'table:filter:applied',
    
    // Retraining events
    RETRAIN_STARTED: 'retrain:started',
    RETRAIN_COMPLETED: 'retrain:completed',
    RETRAIN_FAILED: 'retrain:failed',
    
    // Forecasting events
    FORECAST_STARTED: 'forecast:started',
    FORECAST_COMPLETED: 'forecast:completed',
    FORECAST_FAILED: 'forecast:failed',
    
    // Error events
    ERROR_OCCURRED: 'error:occurred',
    WARNING_OCCURRED: 'warning:occurred'
}

// Convenience functions for common event patterns
export const emitAnalysisStarted = (data) => {
    eventBus.emit(EVENTS.ANALYSIS_STARTED, data)
}

export const emitAnalysisProgress = (data) => {
    eventBus.emit(EVENTS.ANALYSIS_PROGRESS, data)
}

export const emitAnalysisCompleted = (data) => {
    eventBus.emit(EVENTS.ANALYSIS_COMPLETED, data)
}

export const emitAnalysisFailed = (data) => {
    eventBus.emit(EVENTS.ANALYSIS_FAILED, data)
}

export const emitDataLoaded = (data) => {
    eventBus.emit(EVENTS.DATA_LOADED, data)
}

export const emitSelectionChanged = (data) => {
    eventBus.emit(EVENTS.SELECTION_CHANGED, data)
}

export const emitFilterChanged = (data) => {
    eventBus.emit(EVENTS.FILTER_CHANGED, data)
}

export const emitTableDataUpdated = (data) => {
    eventBus.emit(EVENTS.TABLE_DATA_UPDATED, data)
}

export const emitError = (data) => {
    eventBus.emit(EVENTS.ERROR_OCCURRED, data)
}

export const emitWarning = (data) => {
    eventBus.emit(EVENTS.WARNING_OCCURRED, data)
}
