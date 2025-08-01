/**
 * KF-GOM Analysis Pipeline
 * ========================
 * 
 * Kinematic Feature-based Granger Causality with Outlier Management (KF-GOM)
 * 
 * This component implements a complete pipeline for analyzing motion capture data
 * using SARIMAX (Seasonal AutoRegressive Integrated Moving Average with eXogenous variables)
 * modeling to identify causal relationships between joint movements.
 * 
 * Pipeline Overview:
 * 1. Data Loading & Validation
 * 2. Data Conversion & Preprocessing
 * 3. SARIMAX Model Training
 * 4. Performance Metrics Calculation
 * 5. Results Visualization & Analysis
 * 
 * Key Features:
 * - Integrates with existing BVH processing pipeline
 * - Real-time analysis with progress tracking
 * - Interactive metric cards and results table
 * - Support for multiple estimation methods (OLS, MLE, Ridge)
 * - Automatic re-analysis when parameters change
 * 
 * @author youssef hergal
 * @version 1.0
 */

// Main KF-GOM Analysis Component - added by youssef hergal
import { createSignal, onMount, createEffect } from "solid-js"
import KFGOMTable from "./kfgom/components/KFGOMTable"
import KFGOMFileSelector from "./kfgom/components/KFGOMFileSelector"
import { SARIMAXAnalyzer } from "./kfgom/SARIMAXAnalyzer.js"
import { myScene } from "./myScene"
import {
	sarimaxAnalyzer,
	setSarimaxAnalyzer,
	sarimaxResults,
	setSarimaxResults,
	sarimaxConfig,
	setSarimaxConfig,
	isAnalyzing,
	setIsAnalyzing,
	analysisProgress,
	setAnalysisProgress,
	selectedJoint,
	axisSelected, 
	kfgomFilters, 
	setKfgomFilters,
	rawSkeletenBones,
	trainFileBones,
	testFileBones
} from "./store"

const KFGOMAnalysis = () => {
	/**
	 * Main KF-GOM Analysis Component
	 * 
	 * This component orchestrates the entire KF-GOM analysis pipeline:
	 * 1. Initializes the SARIMAX analyzer
	 * 2. Converts existing BVH data to SARIMAX format
	 * 3. Runs analysis with progress tracking
	 * 4. Manages reactive updates and UI state
	 * 5. Displays results with interactive metrics
	 */
	
	const [analyzer, setAnalyzer] = createSignal(null)

	/**
	 * STEP 1: Initialize SARIMAX Analyzer
	 * ====================================
	 * 
	 * Creates and initializes the SARIMAX analyzer instance when the component mounts.
	 * This analyzer is responsible for:
	 * - Data preprocessing and scaling
	 * - SARIMAX model training
	 * - Performance metrics calculation
	 * - Results generation
	 */
	onMount(() => {
		const newAnalyzer = new SARIMAXAnalyzer()
		setAnalyzer(newAnalyzer)
		setSarimaxAnalyzer(newAnalyzer)
	})

	/**
	 * STEP 2: Data Conversion & Preprocessing
	 * =======================================
	 * 
	 * Converts existing BVH motion capture data to SARIMAX-compatible format.
	 * This function bridges the gap between the main app's BVH processing
	 * and the KF-GOM analysis pipeline.
	 * 
	 * Process:
	 * 1. Extracts rotation channels from BVH bones data
	 * 2. Creates time series data for each joint rotation
	 * 3. Organizes data into channels and motion data arrays
	 * 4. Validates data structure and completeness
	 * 
	 * @param {Array} bvhBones - Processed BVH bones data from main app
	 * @returns {Object} SARIMAX-compatible data structure
	 * @throws {Error} If no BVH data is available or invalid structure
	 */
	const convertExistingBVHData = (bvhBones) => {
		console.log('🔍 Converting existing BVH data for SARIMAX:', {
			hasBvhBones: !!bvhBones,
			bvhBonesLength: bvhBones?.length || 0
		})
		
		if (!bvhBones || bvhBones.length === 0) {
			throw new Error("No BVH bones data available")
		}

		// Extract channels and motion data from existing processed data
		const channels = []
		const motionData = []
		let frameCount = 0

		// Get frame count from first bone
		if (bvhBones.length > 0 && bvhBones[0].frames && bvhBones[0].frames.length > 0) {
			frameCount = bvhBones[0].frames.length
		}

		// Extract only rotation channels from existing bone data
		let totalChannels = 0
		let rotationChannels = 0
		let positionChannels = 0
		
		bvhBones.forEach(bone => {
			if (bone.channels && bone.type !== 'ENDSITE') {
				totalChannels += bone.channels.length
				bone.channels.forEach(channel => {
					if (channel.includes('position')) {
						positionChannels++
					} else if (channel.includes('rotation')) {
						rotationChannels++
						const channelName = `${bone.name}_${channel}`
						if (!channels.includes(channelName)) {
							channels.push(channelName)
						}
					}
				})
			}
		})
		
		console.log('📊 Channel Analysis:', {
			totalChannels,
			positionChannels,
			rotationChannels,
			rotationVariables: channels.length,
			sampleRotationChannels: channels.slice(0, 10)
		})

		// Extract motion data for each frame from existing processed data (rotation only)
		for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
			const frameData = []
			
			bvhBones.forEach(bone => {
				if (bone.frames && bone.frames[frameIndex] && bone.frames[frameIndex].rawRotation) {
					bone.channels.forEach(channel => {
						// Only include rotation channels, exclude position channels
						if (channel.includes('rotation')) {
							const value = bone.frames[frameIndex].rawRotation[channel] || 0
							frameData.push(value)
						}
					})
				}
			})
			
			motionData.push(frameData)
		}

		const bvhData = {
			channels,
			motionData,
			frameCount
		}

		console.log('✅ Converted existing BVH data (rotation only):', {
			frameCount: bvhData.frameCount,
			channels: bvhData.channels.length,
			sampleChannels: bvhData.channels.slice(0, 5),
			sampleMotionData: bvhData.motionData[0]?.slice(0, 5) || []
		})

		return bvhData
	}

	/**
	 * STEP 3: Main Analysis Pipeline
	 * ===============================
	 * 
	 * Orchestrates the complete KF-GOM analysis workflow:
	 * 
	 * 1. Data Validation & Loading
	 *    - Validates training and test data availability
	 *    - Converts BVH data to SARIMAX format
	 *    - Handles both single-file and train/test scenarios
	 * 
	 * 2. Model Configuration
	 *    - Sets target joint and axis from UI selections
	 *    - Configures SARIMAX parameters (lags, method)
	 *    - Prepares analysis configuration
	 * 
	 * 3. Analysis Execution
	 *    - Runs SARIMAX analysis with progress tracking
	 *    - Handles errors and provides user feedback
	 *    - Updates results state for UI display
	 * 
	 * 4. Results Processing
	 *    - Stores analysis results in global state
	 *    - Triggers UI updates for metrics and table
	 *    - Enables interactive exploration of results
	 * 
	 * @async
	 * @throws {Error} If data validation fails or analysis errors occur
	 */
	const runAnalysis = async () => {
		try {
			setIsAnalyzing(true)
			setAnalysisProgress(0)

			// Check if train data is available
			const trainBones = trainFileBones()
			const testBones = testFileBones()
			
			if (!trainBones || trainBones.length === 0) {
				throw new Error("No training file loaded. Please select a training file first.")
			}

			// Convert training data to SARIMAX format
			const trainData = convertExistingBVHData(trainBones)
			if (!trainData) {
				throw new Error("Failed to convert training data")
			}

			// Use test data if available, otherwise use training data for both
			let testData = trainData
			if (testBones && testBones.length > 0) {
				testData = convertExistingBVHData(testBones)
				if (!testData) {
					throw new Error("Failed to convert test data")
				}
			}

			// Validate converted data
			if (!trainData.motionData || !trainData.channels) {
				throw new Error("Invalid training data structure.")
			}

			// Set data for training and testing
			analyzer().setData(trainData, testData)

			// Update configuration with selected joint and axis
			const currentConfig = sarimaxConfig()
			const updatedConfig = { // added by youssef hergal
				...currentConfig,
				targetJoint: selectedJoint(),
				targetAxis: `${axisSelected()}rotation`
			}
			
			console.log('🎯 Using selected joint and axis:', { // added by youssef hergal
				joint: selectedJoint(),
				axis: axisSelected(),
				targetAngle: `${selectedJoint()}_${axisSelected()}rotation`
			})

			// Run analysis with progress callback
			const result = await analyzer().analyze(updatedConfig, (progress, message) => {
				setAnalysisProgress(progress)
				console.log(`Progress: ${progress}% - ${message}`)
			})

			if (result.success) {
				setSarimaxResults(result.results)
				console.log("✅ SARIMAX analysis completed successfully")
			} else {
				console.error("❌ SARIMAX analysis failed:", result.error)
			}

		} catch (error) {
			console.error("❌ Error running SARIMAX analysis:", error)
		} finally {
			setIsAnalyzing(false)
		}
	}

	/**
	 * STEP 4: Reactive Analysis Triggers
	 * ===================================
	 * 
	 * Manages automatic analysis execution based on data availability:
	 * 
	 * 1. Initial Analysis Trigger
	 *    - Monitors training data availability
	 *    - Automatically runs analysis when data becomes available
	 *    - Prevents unnecessary re-analysis when results exist
	 * 
	 * 2. Data State Monitoring
	 *    - Tracks BVH data loading status
	 *    - Validates analyzer initialization
	 *    - Provides user feedback for missing data
	 * 
	 * 3. Smart Analysis Logic
	 *    - Only runs analysis when no results exist
	 *    - Ensures analyzer is properly initialized
	 *    - Handles edge cases and error states
	 */
	createEffect(() => {
		const results = sarimaxResults()
		const hasTrainData = trainFileBones() && trainFileBones().length > 0
		const currentJoint = selectedJoint()
		const currentAxis = axisSelected()
		
		console.log("🔍 KFGOM Analysis Effect Check:", {
			hasResults: !!results,
			hasTrainData,
			trainBonesLength: trainFileBones()?.length || 0,
			hasAnalyzer: !!analyzer(),
			currentJoint,
			currentAxis
		})
		
		if (!results && hasTrainData && analyzer()) {
			console.log("🚀 Auto-running KF-GOM analysis...")
			runAnalysis()
		} else if (!hasTrainData) {
			console.log("⚠️ No training file loaded. Please select a training file first.")
		}
	})

	/**
	 * STEP 5: Parameter Change Detection
	 * ===================================
	 * 
	 * Monitors changes in analysis parameters and triggers re-analysis:
	 * 
	 * 1. Target Parameter Monitoring
	 *    - Tracks changes in selected joint and axis
	 *    - Compares current target with previous results
	 *    - Triggers re-analysis only when parameters actually change
	 * 
	 * 2. Smart Re-analysis Logic
	 *    - Only re-runs when results exist and parameters change
	 *    - Prevents unnecessary analysis cycles
	 *    - Provides clear logging of parameter changes
	 * 
	 * 3. State Validation
	 *    - Ensures training data is available
	 *    - Validates analyzer is initialized
	 *    - Maintains analysis consistency
	 */
	createEffect(() => { // added by youssef hergal
		const results = sarimaxResults()
		const hasTrainData = trainFileBones() && trainFileBones().length > 0
		const currentJoint = selectedJoint()
		const currentAxis = axisSelected()
		
		// Only re-run if we have results and the joint/axis has changed
		if (results && hasTrainData && analyzer()) {
			const currentTarget = `${results.targetJoint}_${results.targetAxis}`
			const newTarget = `${currentJoint}_${currentAxis}rotation`
			
			if (currentTarget !== newTarget) {
				console.log("🔄 Joint/Axis changed, re-running KF-GOM analysis...") // added by youssef hergal
				console.log("📊 Change:", { from: currentTarget, to: newTarget }) // added by youssef hergal
				runAnalysis()
			}
		}
	})

	// Update table when SARIMAX results change
	createEffect(() => {
		const results = sarimaxResults()
		if (results) {
			console.log("📊 SARIMAX results updated:", results)
		}
	})

	/**
	 * STEP 6: User Interaction Handlers
	 * ==================================
	 * 
	 * Manages user interactions with the analysis interface:
	 * 
	 * 1. Significance Filter Handler
	 *    - Updates filter state for results table
	 *    - Controls which variables are displayed
	 *    - Provides real-time filtering of results
	 * 
	 * 2. Method Selection Handler
	 *    - Updates SARIMAX estimation method
	 *    - Triggers re-analysis with new method
	 *    - Supports OLS, MLE, and Ridge methods
	 * 
	 * 3. State Management
	 *    - Updates global state for reactive UI
	 *    - Maintains consistency across components
	 *    - Provides user feedback through logging
	 */
	
	// Handle significance filter change
	const handleSignificanceFilterChange = (event) => {
		const newFilter = event.target.value
		setKfgomFilters({ ...kfgomFilters(), significance: newFilter })
		console.log('🔍 Significance filter changed to:', newFilter)
	}

	// Handle method change
	const handleMethodChange = (event) => {
		const newMethod = event.target.value
		setSarimaxConfig({ ...sarimaxConfig(), method: newMethod })
		console.log('🔧 Method changed to:', newMethod)
	}

	/**
	 * STEP 7: UI Rendering & Results Display
	 * =======================================
	 * 
	 * Renders the complete KF-GOM analysis interface:
	 * 
	 * 1. File Selection Interface
	 *    - Allows users to select training and test files
	 *    - Integrates with existing BVH file system
	 *    - Provides file validation and feedback
	 * 
	 * 2. Analysis Progress Tracking
	 *    - Shows real-time analysis progress
	 *    - Displays current analysis stage
	 *    - Provides visual feedback during processing
	 * 
	 * 3. Results Summary Section
	 *    - Displays key analysis parameters
	 *    - Shows target joint and axis information
	 *    - Provides method and lag configuration
	 * 
	 * 4. Interactive Metric Cards
	 *    - Real-time performance metrics display
	 *    - MSE, Correlation, RMSE, and MAE values
	 *    - Responsive design for different screen sizes
	 * 
	 * 5. Results Table
	 *    - Interactive table with model coefficients
	 *    - Significance filtering and sorting
	 *    - Detailed statistical information
	 */
	return (
		<div style={{ height: "100%" }}>
			{/* File Selection Section */}
			<KFGOMFileSelector />
			
			<div class="plotCoefContainer">
				<div class="plotTitle" id="kfgomTableTitle">
					KF-GOM Analysis Results
				</div>
				
				{/* Analysis Progress */}
				{isAnalyzing() && (
					<div style={{ 
						padding: "10px", 
						"border-bottom": "1px solid #ccc",
						display: "flex",
						gap: "15px",
						"align-items": "center",
						"flex-wrap": "wrap"
					}}>
						<div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
							<span style={{ "font-weight": "bold", color: "#007bff" }}>
								Running KF-GOM Analysis...
							</span>
							<div style={{ 
								width: "200px", 
								height: "8px", 
								"background-color": "#f0f0f0", 
								"border-radius": "4px",
								overflow: "hidden"
							}}>
								<div style={{
									width: `${analysisProgress()}%`,
									height: "100%",
									"background-color": "#007bff",
									transition: "width 0.3s ease"
								}} />
							</div>
							<span style={{ "font-size": "12px" }}>{analysisProgress()}%</span>
						</div>
					</div>
				)}

				{/* Results Summary */}
				{sarimaxResults() && (
					<div style={{ 
						padding: "10px", 
						"background-color": "#f8f9fa",
						"border-bottom": "1px solid #ccc",
						"font-size": "12px"
					}}>
						<div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap", "align-items": "center" }}>
							<div>
								<strong>Target:</strong> {sarimaxResults().targetJoint} {sarimaxResults().targetAxis.replace('rotation', '')} {/* added by youssef hergal */}
							</div>
							<div>
								<strong>Method:</strong> 
								<select 
									value={sarimaxConfig().method}
									onChange={handleMethodChange}
									style={{
										"margin-left": "5px",
										padding: "2px 6px",
										"border": "1px solid #ccc",
										"border-radius": "3px",
										"background-color": "white",
										"font-size": "11px"
									}}
								>
									<option value="ols">OLS</option>
									<option value="ridge">Ridge</option>
									<option value="mle">MLE</option>
								</select>
							</div>
							<div>
								<strong>Lags:</strong> {sarimaxConfig().lags}
							</div>
							<div>
								<strong>MSE:</strong> {sarimaxResults().metrics?.mse?.toFixed(4) || "N/A"}
							</div>
							<div>
								<strong>Correlation:</strong> {sarimaxResults().metrics?.correlation?.toFixed(4) || "N/A"}
							</div>
							<div>
								<strong>Variables:</strong> {sarimaxResults().modelSummary?.variables?.length || "N/A"} {/* added by youssef hergal */}
							</div>
							<div>
								<strong>Filter:</strong> 
								<select 
									value={kfgomFilters().significance}
									onChange={handleSignificanceFilterChange}
									style={{
										"margin-left": "5px",
										padding: "2px 6px",
										"border": "1px solid #ccc",
										"border-radius": "3px",
										"background-color": "white",
										"font-size": "11px"
									}}
								>
									<option value="all">All</option>
									<option value="significant">Significant</option>
									<option value="non-significant">Non-significant</option>
								</select>
							</div>
						</div>
					</div>
				)}

				{/* Metric Cards */}
				{sarimaxResults() && (
					<div style={{ 
						padding: "6px 10px", 
						"background-color": "#f8f9fa",
						"border-bottom": "1px solid #ccc",
						"font-size": "12px"
					}}>
						<div style={{ 
							display: 'flex', 
							gap: '6px', 
							"align-items": "center",
							"flex-wrap": "wrap",
							"justify-content": "flex-start"
						}}>
							{/* MSE Card */}
							<div style={{
								background: '#007bff',
								borderRadius: '3px',
								padding: '3px 6px',
								color: 'white',
								boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
								textAlign: 'center',
								display: 'inline-flex',
								"align-items": "center",
								gap: '3px',
								"font-size": "10px",
								"font-weight": "bold",
								"min-width": "fit-content",
								"white-space": "nowrap"
							}}>
								<span>MSE:</span>
								<span>{sarimaxResults().metrics?.mse?.toFixed(4) || "N/A"}</span>
							</div>

							{/* Correlation Card */}
							<div style={{
								background: '#007bff',
								borderRadius: '3px',
								padding: '3px 6px',
								color: 'white',
								boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
								textAlign: 'center',
								display: 'inline-flex',
								"align-items": "center",
								gap: '3px',
								"font-size": "10px",
								"font-weight": "bold",
								"min-width": "fit-content",
								"white-space": "nowrap"
							}}>
								<span>Corr:</span>
								<span>{sarimaxResults().metrics?.correlation?.toFixed(4) || "N/A"}</span>
							</div>

							{/* RMSE Card */}
							<div style={{
								background: '#007bff',
								borderRadius: '3px',
								padding: '3px 6px',
								color: 'white',
								boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
								textAlign: 'center',
								display: 'inline-flex',
								"align-items": "center",
								gap: '3px',
								"font-size": "10px",
								"font-weight": "bold",
								"min-width": "fit-content",
								"white-space": "nowrap"
							}}>
								<span>RMSE:</span>
								<span>
									{sarimaxResults().metrics?.rmse?.toFixed(4) || 
									 (sarimaxResults().metrics?.mse ? Math.sqrt(sarimaxResults().metrics.mse).toFixed(4) : "N/A")}
								</span>
							</div>

							{/* MAE Card */}
							<div style={{
								background: '#007bff',
								borderRadius: '3px',
								padding: '3px 6px',
								color: 'white',
								boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
								textAlign: 'center',
								display: 'inline-flex',
								"align-items": "center",
								gap: '3px',
								"font-size": "10px",
								"font-weight": "bold",
								"min-width": "fit-content",
								"white-space": "nowrap"
							}}>
								<span>MAE:</span>
								<span>{sarimaxResults().metrics?.mae?.toFixed(4) || "N/A"}</span>
							</div>
						</div>
					</div>
				)}

				<KFGOMTable />
			</div>
		</div>
	)
}

export { KFGOMAnalysis } 