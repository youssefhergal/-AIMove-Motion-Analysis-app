// Metrics utility functions for SARIMAX analysis
import * as math from 'mathjs'

// Mean Squared Error
export function MSE(actual, predicted) {
    if (!actual || !predicted || actual.length !== predicted.length) {
        throw new Error('Invalid input for MSE calculation')
    }

    const n = actual.length
    let sum = 0

    for (let i = 0; i < n; i++) {
        sum += Math.pow(actual[i] - predicted[i], 2)
    }

    return sum / n
}

// Mean Absolute Error
export function MAE(actual, predicted) {
    if (!actual || !predicted || actual.length !== predicted.length) {
        throw new Error('Invalid input for MAE calculation')
    }

    const n = actual.length
    let sum = 0

    for (let i = 0; i < n; i++) {
        sum += Math.abs(actual[i] - predicted[i])
    }

    return sum / n
}

// Theil's U statistic
export function UTheil(actual, predicted) {
    if (!actual || !predicted || actual.length !== predicted.length) {
        throw new Error('Invalid input for UTheil calculation')
    }

    const n = actual.length
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
        numerator += Math.pow(actual[i] - predicted[i], 2)
        denominator += Math.pow(actual[i], 2)
    }

    if (denominator === 0) {
        return 1 // Worst case scenario
    }

    return Math.sqrt(numerator / denominator)
}

// Calculate correlation coefficient
export function calculateCorrelation(actual, predicted) {
    if (!actual || !predicted || actual.length !== predicted.length) {
        throw new Error('Invalid input for correlation calculation')
    }

    const n = actual.length
    if (n === 0) return 0

    // Calculate means
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / n
    const predictedMean = predicted.reduce((sum, val) => sum + val, 0) / n

    // Calculate numerator and denominators
    let numerator = 0
    let actualSumSq = 0
    let predictedSumSq = 0

    for (let i = 0; i < n; i++) {
        const actualDiff = actual[i] - actualMean
        const predictedDiff = predicted[i] - predictedMean
        
        numerator += actualDiff * predictedDiff
        actualSumSq += actualDiff * actualDiff
        predictedSumSq += predictedDiff * predictedDiff
    }

    // Calculate correlation
    const denominator = Math.sqrt(actualSumSq * predictedSumSq)
    
    if (denominator === 0) {
        return 0
    }

    return numerator / denominator
}

// Calculate R-squared (coefficient of determination)
export function calculateR2(actual, predicted) {
    if (!actual || !predicted || actual.length !== predicted.length) {
        throw new Error('Invalid input for R² calculation')
    }

    const n = actual.length
    if (n === 0) return 0

    // Calculate mean of actual values
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / n

    // Calculate total sum of squares (TSS)
    let tss = 0
    for (let i = 0; i < n; i++) {
        tss += Math.pow(actual[i] - actualMean, 2)
    }

    // Calculate residual sum of squares (RSS)
    let rss = 0
    for (let i = 0; i < n; i++) {
        rss += Math.pow(actual[i] - predicted[i], 2)
    }

    // Calculate R-squared
    if (tss === 0) {
        return 0
    }

    return 1 - (rss / tss)
}

// Create model summary for table display
export function createModelSummary(model, bvhAngles, targetAngle, exogIndices) {
    try {
        if (!model || !model.summary) {
            throw new Error('Model not trained or invalid')
        }

        const summary = model.summary()
        const variables = []

        // Add exogenous variables (coefficients)
        for (let i = 0; i < exogIndices.length && i < summary.coefficients.length; i++) {
            const exogIndex = exogIndices[i]
            const variableName = bvhAngles[exogIndex] || `exog_${i}`
            
            variables.push({
                variable: variableName,
                coefficient: summary.coefficients[i],
                pValue: summary.pValues[i],
                significance: getSignificanceCode(summary.pValues[i])
            })
        }

        // Add lagged endogenous variables
        const numExog = exogIndices.length
        for (let lag = 1; lag <= model.order; lag++) {
            const coeffIndex = numExog + lag - 1
            if (coeffIndex < summary.coefficients.length) {
                variables.push({
                    variable: `${targetAngle}_T-${lag}`,
                    coefficient: summary.coefficients[coeffIndex],
                    pValue: summary.pValues[coeffIndex],
                    significance: getSignificanceCode(summary.pValues[coeffIndex])
                })
            }
        }

        return {
            variables,
            statistics: {
                rSquared: summary.rSquared || 0,
                mse: summary.mse || 0,
                aic: summary.aic || 0,
                bic: summary.bic || 0
            }
        }

    } catch (error) {
        console.error('Error creating model summary:', error)
        return {
            variables: [],
            statistics: { rSquared: 0, mse: 0, aic: 0, bic: 0 }
        }
    }
}

// Get significance code based on p-value
function getSignificanceCode(pValue) {
    if (pValue < 0.001) return '***'
    if (pValue < 0.01) return '**'
    if (pValue < 0.05) return '*'
    if (pValue < 0.1) return '.'
    return ''
}

 