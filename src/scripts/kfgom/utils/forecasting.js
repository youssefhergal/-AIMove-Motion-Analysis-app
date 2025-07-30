// Forecasting utilities for SARIMAX analysis - Static forecasting only
import * as math from 'mathjs'

// Static forecasting (one-step-ahead predictions) with 95% confidence intervals
export function staticForecasting(model, testData, targetIndex, exogIndices, scaler, targetColumn, steps, options = {}) {
    try {
        if (!model || !testData || testData.length === 0) {
            throw new Error('Invalid model or test data for static forecasting')
        }

        const predictions = []
        const originalValues = []
        const frameIndices = []

        // For static forecasting, we use actual values for lagged endogenous variables
        for (let i = 0; i < testData.length; i++) {
            const row = testData[i]
            
            // Extract exogenous variables
            const exogContext = exogIndices.map(idx => row[idx])
            
            // Extract lagged endogenous variables (use actual values)
            const endogContext = []
            for (let lag = 1; lag <= model.order; lag++) {
                const lagIndex = i - lag
                if (lagIndex >= 0) {
                    endogContext.push(row[targetIndex])
                } else {
                    // Use the first available value for initial lags
                    endogContext.push(row[targetIndex])
                }
            }

            // Make prediction
            const prediction = model.predict(endogContext, exogContext)

            // Denormalize prediction
            const denormalizedPrediction = scaler.inverseTransform([[prediction]])[0][0]
            
            predictions.push(denormalizedPrediction)
            originalValues.push(row[targetIndex])
            frameIndices.push(i + model.order) // Adjust for lag order
        }

        // Calculate 95% confidence intervals
        const residuals = predictions.map((pred, i) => Math.abs(pred - originalValues[i]))
        const avgResidual = residuals.reduce((sum, res) => sum + res, 0) / residuals.length
        const confidenceInterval = 1.96 * avgResidual // 95% confidence

        const confidence = {
            upper: predictions.map(val => val + confidenceInterval),
            lower: predictions.map(val => val - confidenceInterval),
            level: 95,
            se: avgResidual
        }

        return {
            predStatic: predictions,
            origValues: originalValues,
            frameIndices,
            confidence,
            method: 'static',
            steps: steps
        }

    } catch (error) {
        console.error('Error in static forecasting:', error)
        throw error
    }
} 