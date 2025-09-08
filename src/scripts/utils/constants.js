/**
 * Application Constants
 * 
 * Centralized constants to reduce code duplication
 * and improve maintainability.
 */

/**
 * GOM Assumption Mapping
 * Maps assumption indices to their display names
 */
export const GOM_ASSUMPTIONS = {
    0: 'GOM Overview',
    2: 'Transitioning',
    4: 'Intra-joint Association',
    6: 'Inter-limb Synergy',
    8: 'Serial Intra-limb Mediation',
    10: 'Non-serial Intra-limb Mediation',
    11: 'All Assumptions Statistics'
}

/**
 * GOM Assumption Tab Mapping
 * Maps tab indices to assumption indices
 */
export const GOM_TAB_MAPPING = {
    0: 0,   // GOM Overview
    2: 2,   // Transitioning
    4: 3,   // Intra-joint Association
    6: 4,   // Inter-limb Synergy
    8: 5,   // Serial Intra-limb Mediation
    10: 6   // Non-serial Intra-limb Mediation
}

/**
 * Significance Filter Options
 */
export const SIGNIFICANCE_FILTERS = {
    ALL: 'all',
    SIGNIFICANT: 'significant',
    NON_SIGNIFICANT: 'non-significant'
}

/**
 * Significance Codes
 */
export const SIGNIFICANCE_CODES = {
    HIGHLY_SIGNIFICANT: '***',  // p < 0.001
    VERY_SIGNIFICANT: '**',     // p < 0.01
    SIGNIFICANT: '*',           // p < 0.05
    MARGINAL: '.',              // p < 0.1
    NOT_SIGNIFICANT: '~',       // p >= 0.1
    EMPTY: ''                   // No significance data
}

/**
 * SARIMAX Methods
 */
export const SARIMAX_METHODS = {
    OLS: 'ols',
    MLE: 'mle',
    RIDGE: 'ridge'
}

/**
 * Default Analysis Configuration
 */
export const DEFAULT_ANALYSIS_CONFIG = {
    targetJoint: 'Hips',
    targetAxis: 'Xrotation',
    lags: 2,
    method: SARIMAX_METHODS.RIDGE
}

/**
 * Default Forecast Configuration
 */
export const DEFAULT_FORECAST_CONFIG = {
    steps: 'none',
    includeConfidence: true,
    confidenceLevel: 95
}

/**
 * Default KF-GOM Filters
 */
export const DEFAULT_KFGOM_FILTERS = {
    jointName: '',
    significance: SIGNIFICANCE_FILTERS.ALL
}

/**
 * Animation Constants
 */
export const ANIMATION = {
    DEFAULT_FPS: 90,
    DEFAULT_SAMPLING_FACTOR: 30
}

/**
 * UI Constants
 */
export const UI = {
    DEFAULT_SPLITTER_SIZES: {
        LEFT: 100,
        RIGHT: 0,
        PLOT_LEFT: 50,
        PLOT_RIGHT: 50,
        SKELETON_UP: 50,
        SKELETON_DOWN: 50,
        TABLE: 40,
        PLOT_VECTOR: 60
    },
    DEFAULT_SCALES: {
        X: 1,
        Y: 1
    }
}

/**
 * Chart Types
 */
export const CHART_TYPES = {
    POSITION: 'Position',
    ROTATION: 'Rotation'
}

/**
 * Plot Modes
 */
export const PLOT_MODES = {
    MODE_2D: '2D',
    MODE_3D: '3D'
}

/**
 * Axis Types
 */
export const AXIS_TYPES = {
    X: 'X',
    Y: 'Y',
    Z: 'Z'
}

/**
 * Rotation Axes
 */
export const ROTATION_AXES = {
    X: 'Xrotation',
    Y: 'Yrotation',
    Z: 'Zrotation'
}

/**
 * Joint Side Detection Patterns
 */
export const JOINT_SIDE_PATTERNS = {
    RIGHT: ['right', 'r_', 'r.', 'r-', 'r '],
    LEFT: ['left', 'l_', 'l.', 'l-', 'l ']
}

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
    NO_BVH_DATA: 'No BVH data found. Please load a BVH file first.',
    NO_TRAIN_FILE: 'No training file loaded. Please select a training file first.',
    NO_TEST_FILE: 'No test file loaded. Please select a test file.',
    NO_VARIABLES_SELECTED: 'No variables are currently selected. Please select variables to retrain.',
    ANALYSIS_FAILED: 'Analysis failed. Please check your data and try again.',
    INVALID_PARAMETERS: 'Invalid parameters provided. Please check your input.',
    MATRIX_INVERSION_FAILED: 'Matrix inversion failed. Try Ridge method or different lags.',
    TARGET_ANGLE_NOT_FOUND: 'Target angle not found. Check joint/axis combination.'
}

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
    ANALYSIS_COMPLETE: 'Analysis completed successfully!',
    DATA_LOADED: 'Data loaded successfully!',
    RETRAIN_COMPLETE: 'Retraining completed successfully!',
    FORECAST_COMPLETE: 'Forecasting completed successfully!'
}

/**
 * Log Messages
 */
export const LOG_MESSAGES = {
    ANALYSIS_STARTED: 'Starting analysis...',
    ANALYSIS_PROGRESS: 'Analysis progress:',
    DATA_CONVERSION: 'Converting data for analysis...',
    MODEL_TRAINING: 'Training SARIMAX model...',
    RESULTS_GENERATION: 'Generating results...',
    FORECAST_GENERATION: 'Generating forecasts...',
    SELECTION_SAVED: 'Selection saved successfully',
    FILTER_APPLIED: 'Filter applied successfully'
}

/**
 * Performance Thresholds
 */
export const PERFORMANCE = {
    MAX_LOG_SIZE: 200,
    MAX_ERROR_LOG_SIZE: 100,
    DEBOUNCE_DELAY: 300,
    GRID_UPDATE_DELAY: 200
}
