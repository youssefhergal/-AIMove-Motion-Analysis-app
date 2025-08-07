// Enhanced SARIMAX Analyzer class for KF-GOM analysis
import { SARIMAX } from './core/SARIMAX.js'
import { StandardScaler } from './core/StandardScaler.js'
import { MSE, MAE, UTheil, calculateCorrelation, calculateR2, createModelSummary } from './utils/metrics.js'
import { staticForecasting } from './utils/forecasting.js'
import { getAllBVHAngles, prepareForSARIMAX } from './utils/bvhParser.js'

export class SARIMAXAnalyzer {
    constructor() {
        this.trainData = null
        this.testData = null
        this.model = null
        this.scaler = null
        this.results = null
        this.originalResults = null // Store original results for comparison
        console.log('🔧 SARIMAXAnalyzer constructor called - ENHANCED VERSION')
    }

    setData(trainData, testData) {
        this.trainData = trainData
        this.testData = testData
        console.log('📊 Data set in analyzer:', {
            trainFrames: trainData?.frameCount,
            testFrames: testData?.frameCount,
            trainChannels: trainData?.channels?.length,
            testChannels: testData?.channels?.length
        })
    }

    // Store original results for comparison
    storeOriginalResults(results) {
        this.originalResults = results
    }

    // Get original results for comparison
    getOriginalResults() {
        return this.originalResults
    }

    async analyze(targetJoint, targetAxis, lags = 2, method = 'ridge', progressCallback = null) {
        try {
            console.log('🚀 Starting ENHANCED SARIMAX analysis with parameters:', {
                targetJoint,
                targetAxis,
                lags,
                method
            })
            
            if (!this.trainData || !this.testData) {
                throw new Error('No data set. Call setData() first.')
            }
            
            const targetAngle = `${targetJoint}_${targetAxis}`
            console.log('🎯 Target angle:', targetAngle)

            // Step 1: Prepare data using the enhanced approach
            if (progressCallback) progressCallback(10, 'Preparing BVH data...')
            
            const exogAngles = getAllBVHAngles(this.trainData).filter(angle => angle !== targetAngle)
            
            // Use the enhanced data preparation
            const trainBvhData = prepareForSARIMAX(this.trainData, targetAngle, exogAngles)
            const testBvhData = prepareForSARIMAX(this.testData, targetAngle, exogAngles)
            
            console.log('🔄 Train Bvh Data:', trainBvhData)
            console.log('🔄 Test Bvh Data:', testBvhData)
            
            if (progressCallback) progressCallback(30, 'Normalizing data...')
            
            // Step 2: Create separate scalers for endogenous and exogenous data
            const endogScaler = new StandardScaler()
            const exogScaler = new StandardScaler()
            
            // Prepare data for scaling
            const allEndogData = [...trainBvhData.endog, ...testBvhData.endog]
            const allExogData = [...trainBvhData.exog, ...testBvhData.exog]
            
            const endogDataFor2D = allEndogData.map(val => [val])
            const exogDataFor2D = allExogData
            
            endogScaler.fit(endogDataFor2D)
            exogScaler.fit(exogDataFor2D)
            
            // Normalize training data
            const endogTrain = trainBvhData.endog.map(val => endogScaler.transform([[val]])[0][0])
            
            // Transpose exog data from [variable][frame] to [frame][variable] for normalization
            const exogTrainTransposed = []
            for (let frame = 0; frame < trainBvhData.frameCount; frame++) {
                const frameData = []
                for (let v = 0; v < trainBvhData.exog.length; v++) {
                    frameData.push(trainBvhData.exog[v][frame])
                }
                exogTrainTransposed.push(frameData)
            }
            const exogTrain = exogTrainTransposed.map(row => exogScaler.transform([row])[0])
            
            // Normalize test data
            const normalizedTestData = []
            for (let i = 0; i < testBvhData.frameCount; i++) {
                const normalizedEndog = endogScaler.transform([[testBvhData.endog[i]]])[0][0]
                
                // Transpose test exog data for this frame
                const frameExogData = []
                for (let v = 0; v < testBvhData.exog.length; v++) {
                    frameExogData.push(testBvhData.exog[v][i])
                }
                const normalizedExog = exogScaler.transform([frameExogData])[0]
                normalizedTestData.push([normalizedEndog, ...normalizedExog])
            }
            
            // Store scalers for denormalization
            this.endogScaler = endogScaler
            this.exogScaler = exogScaler
            
            if (progressCallback) progressCallback(50, 'Training SARIMAX model...')
            
            // Step 3: Train model with enhanced SARIMAX
            this.model = new SARIMAX(endogTrain, exogTrain, lags, method)
            this.model.fit()
            
            if (progressCallback) progressCallback(70, 'Generating forecasts...')
            
            // Step 4: Generate predictions using enhanced static forecasting
            const forecastingOptions = {
                includeConfidence: true,
                confidenceLevel: 95
            }
            
            const staticResults = staticForecasting(
                this.model,
                normalizedTestData,
                0, // targetIndex
                Array.from({length: testBvhData.exog.length}, (_, i) => i + 1), // exogIndices
                this.endogScaler,
                0, // targetColumn
                1, // steps
                forecastingOptions
            )
            
            if (progressCallback) progressCallback(90, 'Calculating metrics...')
            
            // Step 5: Calculate metrics
            const staticMetrics = {
                mse: MSE(staticResults.origValues, staticResults.predStatic),
                mae: MAE(staticResults.origValues, staticResults.predStatic),
                uTheil: UTheil(staticResults.origValues, staticResults.predStatic),
                correlation: calculateCorrelation(staticResults.origValues, staticResults.predStatic)
            }
            
            // Step 6: Create model summary
            const bvhAngles = [targetAngle, ...exogAngles]
            const exogIndices = Array.from({length: exogTrain[0].length}, (_, i) => i + 1)
            const modelSummaryData = createModelSummary(this.model, bvhAngles, targetAngle, exogIndices)
            
            // Step 7: Prepare confidence intervals
            let confidenceUpper, confidenceLower
            if (staticResults.confidence) {
                confidenceUpper = staticResults.confidence.upper
                confidenceLower = staticResults.confidence.lower
            } else {
                // Fallback: Calculate confidence intervals
                const residuals = staticResults.predStatic.map((pred, i) => Math.abs(pred - staticResults.origValues[i]))
                const avgResidual = residuals.reduce((sum, res) => sum + res, 0) / residuals.length
                const confidenceInterval = 1.96 * avgResidual
                confidenceUpper = staticResults.predStatic.map(val => val + confidenceInterval)
                confidenceLower = staticResults.predStatic.map(val => val - confidenceInterval)
            }
            
            // Step 8: Create final results
            const framesArray = staticResults.frameIndices || Array.from(
                {length: staticResults.origValues.length}, 
                (_, i) => i + this.model.order
            )
            
            this.results = {
                targetJoint,
                targetAxis,
                frames: framesArray,
                original: staticResults.origValues,
                predicted: staticResults.predStatic,
                confidence_upper: confidenceUpper,
                confidence_lower: confidenceLower,
                confidence_level: staticResults.confidence?.level || 95,
                confidence_se: staticResults.confidence?.se || null,
                metrics: staticMetrics,
                modelSummary: this.formatModelSummary(modelSummaryData, bvhAngles, exogIndices),
                method: staticResults.method,
                steps: staticResults.steps,
                lags: lags
            }

            // Store original results for comparison
            this.storeOriginalResults(this.results)

            if (progressCallback) progressCallback(100, 'Analysis complete!')
            
            return {
                success: true,
                results: this.results
            }
            
        } catch (error) {
            console.error('❌ SARIMAX analysis failed:', error)
            return {
                success: false,
                error: error.message,
                results: null
            }
        }
    }

    // New method to retrain model without specific variables
    async retrainModelWithoutVariables(removedVariables, config, progressCallback = null) {
        try {
            console.log('🔄 Retraining model without variables:', removedVariables)
            
            if (progressCallback) progressCallback(10, 'Preparing data for retraining...')
            
            const targetAngle = `${config.targetJoint}_${config.targetAxis}`
            const exogAngles = getAllBVHAngles(this.trainData).filter(angle => angle !== targetAngle)
            
            // Filter out removed variables from exogenous angles
            const filteredExogAngles = exogAngles.filter(angle => !removedVariables.includes(angle))
            
            console.log('📊 Original exogenous variables:', exogAngles.length)
            console.log('📊 Filtered exogenous variables:', filteredExogAngles.length)
            console.log('📊 Removed variables:', removedVariables)
            
            // Prepare data with filtered variables
            const trainBvhData = prepareForSARIMAX(this.trainData, targetAngle, filteredExogAngles)
            const testBvhData = prepareForSARIMAX(this.testData, targetAngle, filteredExogAngles)

            console.log('🔄 Train Bvh Data:', trainBvhData)
            console.log('🔄 Test Bvh Data:', testBvhData)
            
            if (progressCallback) progressCallback(30, 'Normalizing filtered data...')
            
            // Create new scalers for the filtered data
            const endogScaler = new StandardScaler()
            const exogScaler = new StandardScaler()
            
            // Prepare data for scaling
            const allEndogData = [...trainBvhData.endog, ...testBvhData.endog]
            const allExogData = [...trainBvhData.exog, ...testBvhData.exog]
            
            const endogDataFor2D = allEndogData.map(val => [val])
            const exogDataFor2D = allExogData
            
            endogScaler.fit(endogDataFor2D)
            exogScaler.fit(exogDataFor2D)
            
            // Normalize training data
            const endogTrain = trainBvhData.endog.map(val => endogScaler.transform([[val]])[0][0])
            
            // Transpose exog data from [variable][frame] to [frame][variable] for normalization
            const exogTrainTransposed = []
            for (let frame = 0; frame < trainBvhData.frameCount; frame++) {
                const frameData = []
                for (let v = 0; v < trainBvhData.exog.length; v++) {
                    frameData.push(trainBvhData.exog[v][frame])
                }
                exogTrainTransposed.push(frameData)
            }
            const exogTrain = exogTrainTransposed.map(row => exogScaler.transform([row])[0])
            
            // Normalize test data
            const normalizedTestData = []
            for (let i = 0; i < testBvhData.frameCount; i++) {
                const normalizedEndog = endogScaler.transform([[testBvhData.endog[i]]])[0][0]
                
                // Transpose test exog data for this frame
                const frameExogData = []
                for (let v = 0; v < testBvhData.exog.length; v++) {
                    frameExogData.push(testBvhData.exog[v][i])
                }
                const normalizedExog = exogScaler.transform([frameExogData])[0]
                normalizedTestData.push([normalizedEndog, ...normalizedExog])
            }
            
            if (progressCallback) progressCallback(50, 'Training retrained SARIMAX model...')
            
            // Train new model with filtered data
            const estimationMethod = config.resolver || 'ridge'
            const retrainedModel = new SARIMAX(endogTrain, exogTrain, config.lags || 2, estimationMethod)
            retrainedModel.fit()
            
            if (progressCallback) progressCallback(70, 'Generating retrained forecasts...')
            
            // Generate predictions using static forecasting
            const forecastingOptions = {
                includeConfidence: true,
                confidenceLevel: config.confidenceLevel || 95
            }
            
            // Prepare test data in the format expected by staticForecasting
            const testData = []
            for (let i = 0; i < testBvhData.frameCount; i++) {
                const row = [testBvhData.endog[i], ...testBvhData.exog[i]]
                testData.push(row)
            }
            
            const staticResults = staticForecasting(
                retrainedModel,
                testData,
                0, // targetIndex
                Array.from({length: testBvhData.exog[0].length}, (_, i) => i + 1), // exogIndices
                endogScaler,
                0, // targetColumn
                config.steps || 1,
                forecastingOptions
            )
            
            if (progressCallback) progressCallback(90, 'Calculating retrained metrics...')
            
            // Calculate metrics for retrained model
            const staticMetrics = {
                mse: MSE(staticResults.origValues, staticResults.predStatic),
                mae: MAE(staticResults.origValues, staticResults.predStatic),
                uTheil: UTheil(staticResults.origValues, staticResults.predStatic),
                correlation: calculateCorrelation(staticResults.origValues, staticResults.predStatic)
            }
            
            // Create model summary for retrained model
            const bvhAngles = [targetAngle, ...filteredExogAngles]
            const exogIndices = Array.from({length: exogTrain[0].length}, (_, i) => i + 1)
            const modelSummaryData = createModelSummary(retrainedModel, bvhAngles, targetAngle, exogIndices)
            
            // Prepare confidence intervals
            let confidenceUpper, confidenceLower
            if (staticResults.confidence) {
                confidenceUpper = staticResults.confidence.upper
                confidenceLower = staticResults.confidence.lower
            } else {
                // Fallback: Calculate confidence intervals
                const residuals = staticResults.predStatic.map((pred, i) => Math.abs(pred - staticResults.origValues[i]))
                const avgResidual = residuals.reduce((sum, res) => sum + res, 0) / residuals.length
                const confidenceInterval = 1.96 * avgResidual
                confidenceUpper = staticResults.predStatic.map(val => val + confidenceInterval)
                confidenceLower = staticResults.predStatic.map(val => val - confidenceInterval)
            }
            
            // Create frames array
            const framesArray = Array.from({ length: staticResults.origValues.length }, (_, i) => i + 1)
            
            const retrainedResults = {
                targetJoint: config.targetJoint,
                targetAxis: config.targetAxis,
                frames: framesArray,
                original: staticResults.origValues,
                predicted: staticResults.predStatic,
                confidence_upper: confidenceUpper,
                confidence_lower: confidenceLower,
                confidence_level: staticResults.confidence?.level || 95,
                confidence_se: staticResults.confidence?.se || null,
                metrics: staticMetrics,
                modelSummary: this.formatModelSummary(modelSummaryData, bvhAngles, exogIndices),
                method: staticResults.method,
                steps: staticResults.steps,
                lags: config.lags || 2,
                removedVariables: removedVariables // Store which variables were removed
            }
            
            if (progressCallback) progressCallback(100, 'Retraining complete!')
            
            return {
                success: true,
                results: retrainedResults,
                originalResults: this.originalResults
            }
            
        } catch (error) {
            console.error('❌ Retraining Error:', error)
            return {
                success: false,
                error: error.message,
                results: null
            }
        }
    }

    formatModelSummary(modelSummaryData, bvhAngles, exogIndices) {
        try {
            // Check if required parameters exist
            if (!modelSummaryData || !bvhAngles || !exogIndices) {
                console.warn('Missing required parameters for model summary formatting')
                return {
                    variables: [],
                    statistics: { rSquared: 0, mse: 0, aic: 0, bic: 0 }
                }
            }
            
            // The createModelSummary function already returns the correct format
            // Just return it directly since it already has the variables and statistics
            console.log('✅ Model summary data:', {
                hasVariables: !!modelSummaryData.variables,
                variablesLength: modelSummaryData.variables?.length || 0,
                sampleVariables: modelSummaryData.variables?.slice(0, 3) || []
            })
            
            return modelSummaryData
            
        } catch (error) {
            console.error('Error formatting model summary:', error)
            return {
                variables: [],
                statistics: { rSquared: 0, mse: 0, aic: 0, bic: 0 }
            }
        }
    }

    getSignificanceCode(pValue) {
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