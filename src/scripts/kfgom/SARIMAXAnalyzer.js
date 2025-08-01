// Main SARIMAX Analyzer class for KF-GOM analysis - added by youssef hergal
import { SARIMAX } from './core/SARIMAX.js'
import { StandardScaler } from './core/StandardScaler.js'
import { MSE, MAE, UTheil, calculateCorrelation, calculateR2 } from './utils/metrics.js'
import { staticForecasting } from './utils/forecasting.js'

export class SARIMAXAnalyzer {
    constructor() {
        this.scaler = new StandardScaler()
        this.trainData = null
        this.testData = null
        this.model = null
        this.results = null
    }

    setData(trainData, testData) {
        this.trainData = trainData
        this.testData = testData
        console.log('📊 Data set for SARIMAX analyzer:', {
            trainDataLength: trainData?.motionData?.length || 0,
            testDataLength: testData?.motionData?.length || 0,
            trainChannels: trainData?.channels?.length || 0,
            testChannels: testData?.channels?.length || 0
        })
    }

    async analyze(config, progressCallback = null) {
        try {
            console.log('🚀 Starting SARIMAX analysis with config:', config)
            
            if (!this.trainData || !this.testData) {
                throw new Error('No data set. Call setData() first.')
            }

            const { targetJoint, targetAxis, lags = 2, method = 'ols' } = config
            const targetAngle = `${targetJoint}_${targetAxis}`
            
            console.log('🎯 Target angle:', targetAngle)

            // Find target angle in channels
            const targetIndex = this.trainData.channels.findIndex(channel => channel === targetAngle)
            if (targetIndex === -1) {
                throw new Error(`Target angle ${targetAngle} not found in BVH channels`)
            }

            // Get all other angles as exogenous variables
            const exogAngles = this.trainData.channels.filter((_, index) => index !== targetIndex)
            
            console.log('📊 Analysis setup:', {
                targetAngle,
                targetIndex,
                exogAnglesCount: exogAngles.length,
                sampleExogAngles: exogAngles.slice(0, 5)
            })

            // Prepare data for SARIMAX
            const { endog, exog } = this.prepareDataForSARIMAX(targetIndex, exogAngles)
            
            if (progressCallback) progressCallback(20, 'Data prepared')

            // Scale the data
            const scaledEndog = this.scaler.fitTransform(endog)
            const scaledExog = exog.map(col => this.scaler.fitTransform(col))
            

            
            if (progressCallback) progressCallback(40, 'Data scaled')

            // Create and fit SARIMAX model
            this.model = new SARIMAX(scaledEndog, scaledExog, lags, method)
            this.model.fit()
            
            if (progressCallback) progressCallback(60, 'Model fitted')

            // Generate predictions using the trained model
            const predictions = this.generatePredictions(scaledEndog, scaledExog)
            
            if (progressCallback) progressCallback(80, 'Predictions generated')

            // Calculate metrics
            // Use only the predictions that correspond to actual data (skip the first 'order' elements)
            const actualForMetrics = endog.slice(this.model.order)
            const metrics = this.calculateMetrics(actualForMetrics, predictions)
            
            if (progressCallback) progressCallback(90, 'Metrics calculated')

            // Create model summary
            const modelSummary = this.createModelSummary(targetAngle, exogAngles)
            
            if (progressCallback) progressCallback(100, 'Analysis complete')

            this.results = {
                targetJoint,
                targetAxis,
                method,
                lags,
                metrics,
                modelSummary,
                predictions: predictions.slice(0, 100), // Limit for performance
                actual: endog.slice(0, 100),
                modelStatistics: this.model.summary() // Include full model statistics
            }

            console.log('✅ SARIMAX analysis completed successfully')
            return { success: true, results: this.results }

        } catch (error) {
            console.error('❌ SARIMAX analysis failed:', error)
            return { success: false, error: error.message }
        }
    }

    prepareDataForSARIMAX(targetIndex, exogAngles) {
        const { motionData, channels } = this.trainData
        
        // Extract endogenous (target) data
        const endog = motionData.map(frame => frame[targetIndex])

        // Extract exogenous data
        const exogIndices = exogAngles.map(angle => {
            return channels.findIndex(channel => channel === angle)
        }).filter(index => index !== -1)

        const exog = exogIndices.map(index => 
            motionData.map(frame => frame[index])
        )

        console.log('📊 SARIMAX data preparation:', {
            endogLength: endog.length,
            exogLength: exog.length,
            exogIndicesCount: exogIndices.length
        })

        return { endog, exog }
    }

    generatePredictions(endog, exog) {
        if (!this.model || !this.model.trained) {
            throw new Error('Model not trained')
        }

        const predictions = []
        const order = this.model.order
        const exogCount = exog.length

        // For each time step, generate prediction
        for (let t = order; t < endog.length; t++) {
            // Prepare endogenous context (lagged values)
            const endoContext = []
            for (let lag = 1; lag <= order; lag++) {
                endoContext.push(endog[t - lag])
            }

            // Prepare exogenous context (current values)
            // During training: laggedExog[i] contains all exogenous variables at time i + order
            // So for prediction at time t, we need exogenous variables at time t
            const exogContext = exog.map(row => row[t])

            // Generate prediction
            const prediction = this.model.predict(endoContext, exogContext)
            predictions.push(prediction)
            
            // Only log the first prediction to avoid spam
            if (t === order) {
                console.log('🔍 First prediction debug:', {
                    endoContextLength: endoContext.length,
                    exogContextLength: exogContext.length,
                    totalInputLength: endoContext.length + exogContext.length,
                    modelCoefficientsLength: this.model.coefficients.length,
                    timeStep: t
                })
            }
        }

        console.log('📊 Generated predictions:', {
            predictionsLength: predictions.length,
            samplePredictions: predictions.slice(0, 5)
        })

        return predictions
    }

    calculateMetrics(actual, predicted) {
        const mse = MSE(actual, predicted)
        const mae = MAE(actual, predicted)
        const rmse = Math.sqrt(mse) // Calculate RMSE from MSE
        const utheil = UTheil(actual, predicted)
        const correlation = calculateCorrelation(actual, predicted)
        const r2 = calculateR2(actual, predicted)

        return {
            mse,
            mae,
            rmse,
            utheil,
            correlation,
            r2
        }
    }

    createModelSummary(targetAngle, exogAngles) {
        if (!this.model || !this.model.coefficients) {
            return { variables: [] }
        }

        // Get the model summary with proper statistical information
        const summary = this.model.summary()
        const coefficients = summary.coefficients
        const pValues = summary.pValues
        const stdErrors = summary.stdErrors
        const tStats = summary.tStats

        const variables = []

        // Add exogenous variables
        exogAngles.forEach((angle, index) => {
            if (index < coefficients.length - this.model.order) {
                variables.push({
                    variable: angle,
                    coefficient: coefficients[index],
                    pValue: pValues[index], // Real p-value from statistical test
                    significance: this.getSignificance(pValues[index]),
                    stdError: stdErrors[index],
                    tStat: tStats[index]
                })
            }
        })

        // Add AR terms
        for (let i = 0; i < this.model.order; i++) {
            const arIndex = exogAngles.length + i
            if (arIndex < coefficients.length) {
                variables.push({
                    variable: `AR(${i + 1})`,
                    coefficient: coefficients[arIndex],
                    pValue: pValues[arIndex], // Real p-value from statistical test
                    significance: this.getSignificance(pValues[arIndex]),
                    stdError: stdErrors[arIndex],
                    tStat: tStats[arIndex]
                })
            }
        }

        return { 
            variables,
            statistics: {
                rSquared: summary.rSquared,
                mse: summary.mse,
                aic: summary.aic,
                bic: summary.bic
            }
        }
    }

    getSignificance(pValue) {
        if (pValue < 0.001) return '***'
        if (pValue < 0.01) return '**'
        if (pValue < 0.05) return '*'
        if (pValue < 0.1) return '.'
        return ''
    }

    getResults() {
        return this.results
    }
} 