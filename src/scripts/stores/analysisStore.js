/**
 * Analysis Store
 * 
 * Manages all analysis-related state including:
 * - SARIMAX analysis configuration and results
 * - KF-GOM data and filters
 * - Forecasting configuration and results
 * - Retraining history
 */

import { createSignal } from "solid-js"

// SARIMAX Analysis
const [sarimaxAnalyzer, setSarimaxAnalyzer] = createSignal(null)
const [sarimaxResults, setSarimaxResults] = createSignal(null)
const [sarimaxConfig, setSarimaxConfig] = createSignal({
    targetJoint: "Hips",
    targetAxis: "Xrotation", 
    lags: 2,
    method: "ridge"
})
const [isAnalyzing, setIsAnalyzing] = createSignal(false)
const [analysisProgress, setAnalysisProgress] = createSignal(0)

// KF-GOM Data and Filters
const [kfgomData, setKfgomData] = createSignal([])
const [kfgomFilters, setKfgomFilters] = createSignal({
    jointName: "",
    significance: "all"
})

// Selected joints for retraining
const [selectedJoints, setSelectedJoints] = createSignal([])

// GOM Assumptions
const [selectedAssumptionsIndex, setSelectedAssumptionsIndex] = createSignal(2)
const [inputGOM, setInputGOM] = createSignal([])
const [outputGOM, setOutputGOM] = createSignal([])

// Forecasting
const [forecastConfig, setForecastConfig] = createSignal({
    steps: "none", // Default to "none" to avoid confusion with significant filter
    includeConfidence: true,
    confidenceLevel: 95 // Fixed at 95%
})
const [forecastResults, setForecastResults] = createSignal(null)

// Retraining History
const [retrainHistory, setRetrainHistory] = createSignal([])
const [currentRetrainIndex, setCurrentRetrainIndex] = createSignal(0)

// Prediction History - New system for storing all predictions
const [predictionHistory, setPredictionHistory] = createSignal([])
const [currentPredictionIndex, setCurrentPredictionIndex] = createSignal(0)

// Data Frames (legacy - consider refactoring)
const [df_coef, set_df_coef] = createSignal([])
const [df_pred, set_df_pred] = createSignal([])
const [df_pred_sampled, set_df_pred_sampled] = createSignal([])
const [df_coef_mod, set_df_coef_mod] = createSignal([])
const [df_pred_mod, set_df_pred_mod] = createSignal([])
const [df_coef_sub, set_df_coef_sub] = createSignal([])
const [df_A1, set_df_A1] = createSignal([])
const [df_A2, set_df_A2] = createSignal([])
const [df_A3, set_df_A3] = createSignal([])
const [df_A4, set_df_A4] = createSignal([])
const [df_A5, set_df_A5] = createSignal([])
const [df_A6, set_df_A6] = createSignal([])

export {
    // SARIMAX
    sarimaxAnalyzer, setSarimaxAnalyzer,
    sarimaxResults, setSarimaxResults,
    sarimaxConfig, setSarimaxConfig,
    isAnalyzing, setIsAnalyzing,
    analysisProgress, setAnalysisProgress,
    
    // KF-GOM
    kfgomData, setKfgomData,
    kfgomFilters, setKfgomFilters,
    selectedJoints, setSelectedJoints,
    
    // GOM Assumptions
    selectedAssumptionsIndex, setSelectedAssumptionsIndex,
    inputGOM, setInputGOM,
    outputGOM, setOutputGOM,
    
    // Forecasting
    forecastConfig, setForecastConfig,
    forecastResults, setForecastResults,
    
    // Retraining
    retrainHistory, setRetrainHistory,
    currentRetrainIndex, setCurrentRetrainIndex,
    
    // Prediction History
    predictionHistory, setPredictionHistory,
    currentPredictionIndex, setCurrentPredictionIndex,
    
    // Data Frames (legacy)
    df_coef, set_df_coef,
    df_pred, set_df_pred,
    df_pred_sampled, set_df_pred_sampled,
    df_coef_mod, set_df_coef_mod,
    df_pred_mod, set_df_pred_mod,
    df_coef_sub, set_df_coef_sub,
    df_A1, set_df_A1,
    df_A2, set_df_A2,
    df_A3, set_df_A3,
    df_A4, set_df_A4,
    df_A5, set_df_A5,
    df_A6, set_df_A6
}
