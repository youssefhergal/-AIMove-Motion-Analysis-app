/**
 * KF-GOM Module Types
 * 
 * TypeScript type definitions for KF-GOM components
 * 
 * @author youssef hergal
 */

export interface KFGOMConfig {
    targetJoint: string
    targetAxis: string
    lags: number
    method: 'ols' | 'ridge' | 'mle'
    selectedVariables?: string[]
    significanceFilter: 'all' | 'significant' | 'non-significant'
    forecastSteps: number | 'none'
    forecastConfidence: number
}

export interface PredictionEntry {
    id: string
    type: 'initial' | 'retrain'
    timestamp: string
    parameters: {
        targetJoint: string
        targetAxis: string
        method: string
        lags: number
        selectedVariables: string[] | 'all'
        selectedVariablesCount?: number
        significanceFilter: string
        forecastSteps: number | 'none'
        forecastConfidence: number
    }
    results: {
        original: number[]
        prediction: number[]
        metrics: {
            mse?: number
            correlation?: number
            r2?: number
            mae?: number
        }
    }
}

export interface AnalysisResult {
    success: boolean
    targetJoint: string
    targetAxis: string
    frames: number[]
    original: number[]
    predicted: number[]
    metrics: {
        mse: number
        correlation: number
        r2: number
        mae: number
    }
    modelSummary: {
        variables: Array<{
            variable: string
            coefficient: number
            pValue: number
            significance: string
        }>
    }
}

export interface KFGOMFilters {
    jointName: string
    significance: 'all' | 'significant' | 'non-significant'
}

export interface ForecastConfig {
    steps: number | 'none'
    includeConfidence: boolean
    confidenceLevel: number
}
