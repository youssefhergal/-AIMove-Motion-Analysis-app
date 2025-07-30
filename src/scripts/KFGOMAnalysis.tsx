// Main KF-GOM Analysis Component - added by youssef hergal
import { createSignal, onMount, createEffect } from "solid-js"
import KFGOMTable from "./kfgom/components/KFGOMTable"
import { SARIMAXAnalyzer } from "./kfgom/SARIMAXAnalyzer.js"
import { extractBVHDataFromScene } from "./kfgom/utils/bvhParser.js"
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
	selectedJoint, // added by youssef hergal
	axisSelected // added by youssef hergal
} from "./store"

const KFGOMAnalysis = () => {
	const [analyzer, setAnalyzer] = createSignal(null)

	// Initialize SARIMAX analyzer
	onMount(() => {
		const newAnalyzer = new SARIMAXAnalyzer()
		setAnalyzer(newAnalyzer)
		setSarimaxAnalyzer(newAnalyzer)
	})

	// Auto-run SARIMAX analysis when component mounts and BVH data is available
	const runAnalysis = async () => {
		try {
			setIsAnalyzing(true)
			setAnalysisProgress(0)

			// Check if BVH data is available
			if (!myScene.globalResult || !myScene.globalResult.bvhBones) {
				throw new Error("No BVH file loaded. Please upload a BVH file first.")
			}

			// Extract BVH data from scene
			const bvhData = extractBVHDataFromScene(myScene.globalResult)
			if (!bvhData) {
				throw new Error("Failed to extract BVH data from scene")
			}

			// Validate extracted data
			if (!bvhData.motionData || !bvhData.channels) {
				throw new Error("Invalid BVH data structure. Please try uploading the file again.")
			}

			// Set data for one-shot learning (same data for train and test)
			analyzer().setData(bvhData, bvhData)

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

	// Auto-run analysis when component mounts and BVH data is available
	createEffect(() => {
		const results = sarimaxResults()
		const hasBVHData = myScene.globalResult && myScene.globalResult.bvhBones
		const currentJoint = selectedJoint()
		const currentAxis = axisSelected()
		
		if (!results && hasBVHData && analyzer()) {
			console.log("🚀 Auto-running KF-GOM analysis...")
			runAnalysis()
		} else if (!hasBVHData) {
			console.log("⚠️ No BVH file loaded. Please upload a BVH file first.")
		}
	})

	// Re-run analysis when joint or axis selection changes
	createEffect(() => { // added by youssef hergal
		const results = sarimaxResults()
		const hasBVHData = myScene.globalResult && myScene.globalResult.bvhBones
		const currentJoint = selectedJoint()
		const currentAxis = axisSelected()
		
		// Only re-run if we have results and the joint/axis has changed
		if (results && hasBVHData && analyzer()) {
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

	return (
		<div style={{ height: "100%" }}>
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
						<div style={{ display: "flex", gap: "20px", "flex-wrap": "wrap" }}>
							<div>
								<strong>Target:</strong> {sarimaxResults().targetJoint} {sarimaxResults().targetAxis.replace('rotation', '')} {/* added by youssef hergal */}
							</div>
							<div>
								<strong>Method:</strong> {sarimaxConfig().method.toUpperCase()}
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
						</div>
					</div>
				)}

				<KFGOMTable />
			</div>
		</div>
	)
}

export { KFGOMAnalysis } 