import { createSignal, onMount, createEffect } from "solid-js"
// import { Tabs } from "@kobalte/core/tabs"
import { Separator } from "@kobalte/core/separator"
import { ToggleGroup } from "@kobalte/core/toggle-group"
import { AxisSelector } from "./AxisSelector"
import { ToggleGroupAssumptions } from "./ToggleGroupAssumptions"
import { SplitterV_TableAssumptions } from "./SplitterV_TableAssumptions"
import { KFGOMAnalysis } from "./KFGOMAnalysis"
import {
	scaleX,
	inputGOM,
	df_coef_mod,
	chart2D_predict,
	set_df_pred_sampled,
	selectedAssumptionsIndex,
	setAppIsLoaded,
	df_pred_mod,
	selectedTab,
	setSelectedTab,
	selectedJoint,
	axisSelected,
	sarimaxResults,
	forecastResults,
} from "./store"
import { TabContent, Tabs } from "@ark-ui/solid"
import { pred_ang_coef } from "./tensorflowGOM"
import { createPlot2D_Predict } from "./plots"
import * as aq from "arquero"
import { get_mathjax_svg } from "./InitMathJax"
import * as echarts from "echarts"

async function GenerateMovement() {
	setAppIsLoaded(false)

	const { df_pred_mod: newDfPred_mod } = await pred_ang_coef(
		inputGOM(),
		df_coef_mod()
	)

	console.log(newDfPred_mod)
	await set_df_pred_sampled(newDfPred_mod)
	// await pred_ang_coef(inputGOM(), df_coef_mod())

	await createPlot2D_Predict()
	setAppIsLoaded(true)
	// setSelectedTab("Generated Movement")
}

async function DownloadCSV() {
	const csvFile = await df_pred_mod().toCSV()
	const blob = new Blob([csvFile], { type: "text/csv" })
	const url = URL.createObjectURL(blob)
	// Create a download link
	const link = document.createElement("a")
	link.href = url
	link.download = "data.csv"
	document.body.appendChild(link)
	link.click()

	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

export { DownloadCSV, GenerateMovement }

function TabsGOM_main(props: { valueButton: string }) {
	// Signals for storing prediction data
	const [originalData, setOriginalData] = createSignal([])
	const [initialPrediction, setInitialPrediction] = createSignal([])
	const [retrainedPrediction, setRetrainedPrediction] = createSignal([])
	const [chartInstance, setChartInstance] = createSignal(null)

	const renderMathJax = () => {
		document.getElementById("equation1").innerHTML = get_mathjax_svg(
			"Entity_{1,X}(t) = \\alpha_1 Entity_{1,X}(t-1) + \\alpha_2 Entity_{1,Y}(t-1)"
		)
		document.getElementById("equation1").classList.add("mathElement")
		document.getElementById("equation2").innerHTML = get_mathjax_svg(
			"Entity_{1,X}(t) = \\alpha_1 Entity_{1,X}(t-1) + \\alpha_2 Entity_{1,X}(t-2)"
		)
		document.getElementById("equation2").classList.add("mathElement")
		document.getElementById("equation3").innerHTML = get_mathjax_svg(
			"Entity_{1,X}(t) = Entity_{1,Y}(t-1) + Entity_{1,X}(t-1) + Entity_{1,X}(t-2) + Entity_{2,X}(t-1) + Entity_{3,X}(t-1)"
		)
		document.getElementById("equation3").classList.add("mathElement")
		document.getElementById("equation4").innerHTML = get_mathjax_svg(
			"\\frac{d s_s}{dt} = \\begin{bmatrix} \\alpha_1 & 0 \\\\ 0 & \\alpha_2 \\end{bmatrix} \\begin{bmatrix} Entity_{1,X}(t-1) \\\\ Entity_{1,X}(t-2) \\end{bmatrix}"
		)
		document.getElementById("equation4").classList.add("mathElement")
		document.getElementById("equation5").innerHTML = get_mathjax_svg(
			"RightWrist_X(t) = \\alpha_1 \\cdot RightWrist_X(t-1) - \\alpha_2 \\cdot RightWrist_X(t-2) + \\alpha_3 \\cdot RightWrist_Y(t-1) + \\alpha_4 \\cdot LeftWrist_X(t-1)"
		)
		document.getElementById("equation5").classList.add("mathElement")
		document.getElementById("equation6").innerHTML = get_mathjax_svg(
			"\\frac{d s_s}{dt} = A s_S(t-1) + w(t)"
		)
		document.getElementById("equation6").classList.add("mathElement")
		document.getElementById("equation7").innerHTML = get_mathjax_svg(
			"y = C \\frac{d s_s}{dt} + D u"
		)
		document.getElementById("equation7").classList.add("mathElement")
	}

	createEffect(() => {
		if (selectedAssumptionsIndex() === 0) {
			renderMathJax()
		}
	})

	// Manual trigger to create chart when component mounts
	onMount(() => {
		console.log("🚀 Component mounted")
		if (selectedTab() === "Generated Movement") {
			setTimeout(() => {
				createPredictionChart()
			}, 200)
		}
	})

	async function ResizeGenerate() {
		// Resize ECharts chart if it exists
		if (chartInstance()) {
			chartInstance().resize()
		}
	}

	// Function to create ECharts prediction plot
	const createPredictionChart = () => {
		console.log("🔍 Creating prediction chart...")
		const chartContainer = document.getElementById("prediction-chart")
		if (!chartContainer) {
			console.log("❌ Chart container not found")
			return
		}
		console.log("✅ Chart container found")

		// Dispose existing chart if any
		if (chartInstance()) {
			chartInstance().dispose()
		}

		const chart = echarts.init(chartContainer)
		setChartInstance(chart)
		console.log("✅ ECharts instance created")

		const results = sarimaxResults()
		console.log("📊 SARIMAX results:", results)
		
		if (!results || !results.original || !results.predicted) {
			console.log("❌ No prediction data available")
			// Show empty chart with message
			chart.setOption({
				title: {
					text: "No prediction data available",
					left: "center",
					top: "center",
					textStyle: {
						color: "#999"
					}
				}
			})
			return
		}

		const actual = results.original
		const predicted = results.predicted
		const initialPrediction = (window as any).initialPredictionData || predicted
		const retrained = (window as any).retrainedPredictionData || []

		console.log("📈 Data for chart:", {
			actualLength: actual.length,
			predictedLength: predicted.length,
			retrainedLength: retrained.length,
			sampleActual: actual.slice(0, 5),
			samplePredicted: predicted.slice(0, 5),
			sampleRetrained: retrained.slice(0, 5)
		})

		// Calculate min/max for better y-axis scaling
		let allData = [...actual, ...predicted, ...retrained]
		
		// Include forecast data in scaling if available
		const forecastForScaling = forecastResults()
		if (forecastForScaling && forecastForScaling.predStatic && forecastForScaling.predStatic.length > 0) {
			allData = [...allData, ...forecastForScaling.predStatic]
			// Include confidence bounds if available
			if (forecastForScaling.confidence && forecastForScaling.confidence.lower && forecastForScaling.confidence.upper) {
				allData = [...allData, ...forecastForScaling.confidence.lower, ...forecastForScaling.confidence.upper]
			}
		}
		
		const yMin = Math.min(...allData)
		const yMax = Math.max(...allData)

		function minPlot2D() {
			const yMinValue = Number(yMin)
			const yMaxValue = Number(yMax)
			const value = (yMinValue - (yMaxValue - yMinValue) * 0.3).toFixed(0)
			return parseFloat(value)
		}

		function maxPlot2D() {
			const yMinValue = Number(yMin)
			const yMaxValue = Number(yMax)
			const value = (yMaxValue + (yMaxValue - yMinValue) * 0.3).toFixed(0)
			return parseFloat(value)
		}

		// Create time series data
		const timeData = Array.from({ length: actual.length }, (_, i) => i)

		// Prepare series data - always show all available predictions
		const series = [
			{
				name: "Original Movement",
				type: "line",
				data: actual,
				smooth: false,
				lineStyle: {
					color: "#145e9f",
					width: 2
				},
				itemStyle: {
					color: "#145e9f"
				}
			},
			{
				name: "Initial Prediction",
				type: "line",
				data: initialPrediction,
				smooth: false,
				lineStyle: {
					color: "red",
					type: "dashed",
					width: 2
				},
				itemStyle: {
					color: "red"
				}
			}
		]

		// Add retrained prediction if available (keep it as a third line)
		if (retrained && retrained.length > 0) {
			series.push({
				name: "Retrained Prediction",
				type: "line",
				data: retrained,
				smooth: false,
				lineStyle: {
					color: "#DBA21C",
					type: "dotted",
					width: 2
				},
				itemStyle: {
					color: "#DBA21C"
				}
			})
		}

		// Add forecast data if available
		const forecast = forecastResults()
		if (forecast && forecast.predStatic && forecast.predStatic.length > 0) {
			// Create forecast time indices (starting from the end of actual data)
			const forecastTimeIndices = Array.from(
				{ length: forecast.predStatic.length }, 
				(_, i) => actual.length + i
			)
			
			// Add forecast line
			series.push({
				name: `Forecast (${forecast.config.steps} steps)`,
				type: "line",
				data: forecast.predStatic,
				smooth: false,
				lineStyle: {
					color: "#8B5CF6",
					type: "solid",
					width: 3
				},
				itemStyle: {
					color: "#8B5CF6"
				}
			})

			// Add confidence intervals if available
			if (forecast.confidence && forecast.confidence.lower && forecast.confidence.upper) {
				// Lower confidence bound
				series.push({
					name: `Confidence Lower (${forecast.confidence.level}%)`,
					type: "line",
					data: forecast.confidence.lower,
					smooth: false,
					lineStyle: {
						color: "rgba(139, 92, 246, 0.5)",
						type: "dashed",
						width: 1
					},
					itemStyle: {
						color: "rgba(139, 92, 246, 0.5)"
					}
				})

				// Upper confidence bound
				series.push({
					name: `Confidence Upper (${forecast.confidence.level}%)`,
					type: "line",
					data: forecast.confidence.upper,
					smooth: false,
					lineStyle: {
						color: "rgba(139, 92, 246, 0.5)",
						type: "dashed",
						width: 1
					},
					itemStyle: {
						color: "rgba(139, 92, 246, 0.5)"
					}
				})

				// Note: Confidence band visualization removed due to TypeScript compatibility
				// The upper and lower bounds provide sufficient visualization
			}

			console.log("🔮 Added forecast visualization:", {
				forecastPoints: forecast.predStatic.length,
				hasConfidence: !!forecast.confidence,
				confidenceLevel: forecast.confidence?.level
			})
		}

		const option = {
			tooltip: {
				trigger: "axis",
				axisPointer: {
					type: "cross",
					animation: false,
					label: {
						backgroundColor: "#ccc",
						borderColor: "#aaa",
						borderWidth: 1,
						shadowBlur: 0,
						shadowOffsetX: 0,
						shadowOffsetY: 0,
						color: "#222",
					},
				},
			},
			toolbox: {
				feature: {
					dataZoom: {},
				},
				right: "65px",
			},
			legend: {
				data: series.map(s => s.name),
				orient: "vertical",
				left: "10px",
				top: "0px",
			},
			grid: { left: "40px", right: "80px", bottom: "100px", top: "100px" },
			dataZoom: [
				{ type: "inside", xAxisIndex: 0 },
				{
					type: "slider",
					xAxisIndex: 0,
					filterMode: "none",
					bottom: "20px",
					height: 30,
				},
				{ type: "inside", yAxisIndex: 0, filterMode: "none" },
				{
					type: "slider",
					yAxisIndex: 0,
					filterMode: "none",
					right: "15px",
					width: 30,
				},
			],
			xAxis: {
				type: "category",
				data: timeData,
				axisLine: {
					onZero: false,
				},
			},
			yAxis: {
				type: "value",
				name: `Rotation Value (${selectedJoint()}_${axisSelected()}rotation)`,
				min: minPlot2D(),
				max: maxPlot2D(),
			},
			series: series,
		}

		chart.setOption(option)
		chart.dispatchAction(
			{
				type: "takeGlobalCursor",
				key: "brush",
				brushOption: { brushType: "lineX", brushMode: "single" },
			},
			true
		)

		// Handle window resize
		window.addEventListener("resize", () => {
			chart.resize()
		})
	}

	// Effect to update chart when data changes
	createEffect(() => {
		const results = sarimaxResults()
		console.log("🔄 Effect triggered - SARIMAX results changed:", {
			hasResults: !!results,
			selectedTab: selectedTab(),
			isGeneratedMovement: selectedTab() === "Generated Movement"
		})
		if (results && selectedTab() === "Generated Movement") {
			setTimeout(() => {
				createPredictionChart()
			}, 100)
		}
	})

	// Effect to update chart when tab changes
	createEffect(() => {
		console.log("🔄 Effect triggered - Tab changed:", {
			selectedTab: selectedTab(),
			isGeneratedMovement: selectedTab() === "Generated Movement"
		})
		if (selectedTab() === "Generated Movement") {
			setTimeout(() => {
				createPredictionChart()
			}, 100)
		}
	})

	// Effect to update chart when retrained data changes
	createEffect(() => {
		const retrainedData = (window as any).retrainedPredictionData
		console.log("🔄 Effect triggered - Retrained data changed:", {
			hasRetrainedData: !!retrainedData,
			retrainedDataLength: retrainedData?.length,
			selectedTab: selectedTab(),
			isGeneratedMovement: selectedTab() === "Generated Movement"
		})
		if (retrainedData && selectedTab() === "Generated Movement") {
			setTimeout(() => {
				createPredictionChart()
			}, 100)
		}
	})

	// Effect to update chart when forecast results change
	createEffect(() => {
		const forecast = forecastResults()
		console.log("🔄 Effect triggered - Forecast results changed:", {
			hasForecast: !!forecast,
			forecastPoints: forecast?.predStatic?.length,
			selectedTab: selectedTab(),
			isGeneratedMovement: selectedTab() === "Generated Movement"
		})
		if (forecast && selectedTab() === "Generated Movement") {
			setTimeout(() => {
				createPredictionChart()
			}, 100)
		}
	})
	return (
		<>
			<Tabs.Root
				aria-label="Main navigation"
				class="tabs"
				value={selectedTab()}
				onValueChange={async (e) => {
					setSelectedTab(e.value)
					if (e.value === "Generated Movement") {
						console.log("📊 Tab changed to Generated Movement")
						setTimeout(() => {
							// Create or resize ECharts chart
							createPredictionChart()
							if (chartInstance()) {
								chartInstance().resize()
							}
						}, 100)
					}
				}}
			>
				<Tabs.List class="tabs__list">
					<Tabs.Trigger class="tabs__trigger" value="Assumptions">
						Assumptions
					</Tabs.Trigger>
					<Tabs.Trigger
						class="tabs__trigger"
						value="Generated Movement"
					>
						Generated Movement
					</Tabs.Trigger>
					<Tabs.Indicator class="tabs__indicator" />
				</Tabs.List>
				<Tabs.Content class="tabs__content" value="Assumptions">
					<ToggleGroupAssumptions />

					<div class="plotCoefContainer">
						{selectedAssumptionsIndex() === 0 && (
							<div class="GOM_Info">
								<h2>Gesture Operational Model (GOM) Summary</h2>
								<p>
									The Gesture Operational Model (<b>GOM</b>)
									is designed to describe and simulate the
									complex and coordinated body movements of a
									skilled individual performing professional
									gestures. The model considers theoretical
									knowledge and practical motor skills,
									emphasizing precision and repeatability. The{" "}
									<b>GOM</b> captures how body parts move in a
									multidimensional space over time and
									represents these movements using
									mathematical models.
								</p>

								<h3>Key Concepts:</h3>

								<h3>1. Intrajoint Association:</h3>
								<ul>
									<li>
										Each body part's motion is decomposed
										into movements on the X-axis and Y-axis.
									</li>
									<li>
										There is a bidirectional relationship
										between the X and Y movements.
									</li>
									<li>
										<b>Equation:</b>
									</li>
								</ul>
								<div id="equation1" class="mathElement"></div>

								<h3>2. Transitioning:</h3>
								<ul>
									<li>
										Each variable depends on its own history
										(inertia effect).
									</li>
									<li>
										The current value of each variable is
										influenced by its past values.
									</li>
									<li>
										<b>Equation:</b>
									</li>
								</ul>
								<div id="equation2" class="mathElement"></div>

								<h3>3. Interlimb Synergies:</h3>
								<ul>
									<li>
										Certain body entities work together to
										achieve specific motion trajectories.
									</li>
									<li>
										For example, both hands working together
										when assembling parts.
									</li>
								</ul>

								<h3>4. Intralimb Mediation:</h3>
								<ul>
									<li>
										<b>Interjoint Serial Mediation:</b>{" "}
										Dependencies between neighboring joints
										(e.g., wrist and elbow).
									</li>
									<li>
										<b>Interjoint Non-Serial Mediation:</b>{" "}
										Dependencies between non-neighboring
										joints (e.g., wrist and shoulder).
									</li>
								</ul>

								<h2>Example Equations</h2>

								<h3>1. General Equation for an Entity:</h3>
								<div id="equation3" class="mathElement"></div>

								<h3>2. State Equation for an Entity:</h3>
								<div id="equation4" class="mathElement"></div>

								<h3>
									3. Measurement Equation for Right Wrist:
								</h3>
								<div id="equation5" class="mathElement"></div>

								<h2>Simultaneous Equation System</h2>

								<p>
									The system uses first-order differential
									equations to represent the dynamics of body
									movements. For each body entity and each
									dimension (X and Y), the <b>GOM</b>{" "}
									constructs a set of equations:
								</p>

								<h3>1. State Equation:</h3>
								<div id="equation6" class="mathElement"></div>
								<ul>
									<li>s_S(t): State vector</li>
									<li>A: Transition matrix</li>
									<li>w(t): Gaussian disturbances</li>
								</ul>

								<h3>2. Measurement Equation:</h3>
								<div id="equation7" class="mathElement"></div>
								<ul>
									<li>y: Output vector</li>
									<li>C: Output matrix</li>
									<li>D: Feed-through matrix</li>
									<li>u: Input vector</li>
								</ul>

								<h2>Summary of Model Structure</h2>

								<ul>
									<li>
										The <b>GOM</b> involves a set of 32
										equations for a full-body model, each
										describing the relationship between
										positions on the X and Y axes.
									</li>
									<li>
										It uses second-order autoregressive (AR)
										models to predict future behavior based
										on past behavior.
									</li>
									<li>
										The model effectively combines
										intrajoint association, transitioning,
										interlimb synergies, and intralimb
										mediation to simulate and forecast
										professional gestures.
									</li>
								</ul>

								<h2>Conclusion</h2>

								<p>
									The <b>GOM</b> provides a comprehensive
									framework for understanding and modeling the
									intricate movements of skilled individuals.
									By using a combination of state-space
									representation and simultaneous equations,
									the model captures the dynamic relationships
									between different body parts and their
									movements over time.
								</p>
							</div>
						)}
						{props.valueButton === "KF-GOM" ? (
							<KFGOMAnalysis />
						) : (
							<>
								{selectedAssumptionsIndex() === 0 && (
									<div class="GOM_Info">
										<h2>Gesture Operational Model (GOM) Summary</h2>
										<p>
											The Gesture Operational Model (<b>GOM</b>)
											is designed to describe and simulate the
											complex and coordinated body movements of a
											skilled individual performing professional
											gestures. The model considers theoretical
											knowledge and practical motor skills,
											emphasizing precision and repeatability. The{" "}
											<b>GOM</b> captures how body parts move in a
											multidimensional space over time and
											represents these movements using
											mathematical models.
										</p>

										<h3>Key Concepts:</h3>

										<h3>1. Intrajoint Association:</h3>
										<ul>
											<li>
												Each body part's motion is decomposed
												into movements on the X-axis and Y-axis.
											</li>
											<li>
												There is a bidirectional relationship
												between the X and Y movements.
											</li>
											<li>
												<b>Equation:</b>
											</li>
										</ul>
										<div id="equation1" class="mathElement"></div>

										<h3>2. Transitioning:</h3>
										<ul>
											<li>
												Each variable depends on its own history
												(inertia effect).
											</li>
											<li>
												The current value of each variable is
												influenced by its past values.
											</li>
											<li>
												<b>Equation:</b>
											</li>
										</ul>
										<div id="equation2" class="mathElement"></div>

										<h3>3. Interlimb Synergies:</h3>
										<ul>
											<li>
												Certain body entities work together to
												achieve specific motion trajectories.
											</li>
											<li>
												For example, both hands working together
												when assembling parts.
											</li>
										</ul>

										<h3>4. Intralimb Mediation:</h3>
										<ul>
											<li>
												<b>Interjoint Serial Mediation:</b>{" "}
												Dependencies between neighboring joints
												(e.g., wrist and elbow).
											</li>
											<li>
												<b>Interjoint Non-Serial Mediation:</b>{" "}
												Dependencies between non-neighboring
												joints (e.g., wrist and shoulder).
											</li>
										</ul>

										<h2>Example Equations</h2>

										<h3>1. General Equation for an Entity:</h3>
										<div id="equation3" class="mathElement"></div>

										<h3>2. State Equation for an Entity:</h3>
										<div id="equation4" class="mathElement"></div>

										<h3>
											3. Measurement Equation for Right Wrist:
										</h3>
										<div id="equation5" class="mathElement"></div>

										<h2>Simultaneous Equation System</h2>

										<p>
											The system uses first-order differential
											equations to represent the dynamics of body
											movements. For each body entity and each
											dimension (X and Y), the <b>GOM</b>{" "}
											constructs a set of equations:
										</p>

										<h3>1. State Equation:</h3>
										<div id="equation6" class="mathElement"></div>
										<ul>
											<li>s_S(t): State vector</li>
											<li>A: Transition matrix</li>
											<li>w(t): Gaussian disturbances</li>
										</ul>

										<h3>2. Measurement Equation:</h3>
										<div id="equation7" class="mathElement"></div>
										<ul>
											<li>y: Output vector</li>
											<li>C: Output matrix</li>
											<li>D: Feed-through matrix</li>
											<li>u: Input vector</li>
										</ul>

										<h2>Summary of Model Structure</h2>

										<ul>
											<li>
												The <b>GOM</b> involves a set of 32
												equations for a full-body model, each
												describing the relationship between
												positions on the X and Y axes.
											</li>
											<li>
												It uses second-order autoregressive (AR)
												models to predict future behavior based
												on past behavior.
											</li>
											<li>
												The model effectively combines
												intrajoint association, transitioning,
												interlimb synergies, and intralimb
												mediation to simulate and forecast
												professional gestures.
											</li>
										</ul>

										<h2>Conclusion</h2>

										<p>
											The <b>GOM</b> provides a comprehensive
											framework for understanding and modeling the
											intricate movements of skilled individuals.
											By using a combination of state-space
											representation and simultaneous equations,
											the model captures the dynamic relationships
											between different body parts and their
											movements over time.
										</p>
									</div>
								)}
								<SplitterV_TableAssumptions />
							</>
						)}
						{/* <div class="generateButtons">
							<div
								id="grid-container-generateButtons"
								class="grid-container-buttonCoef"
							>
								<button
									id="generateButton"
									class="buttonCoef"
									onclick={GenerateMovement}
								>
									Generate
								</button>
								<button
									id="downloadButton"
									class="buttonCoef"
									onclick={DownloadCSV}
								>
									Download CSV
								</button>
							</div>
						</div> */}
					</div>
				</Tabs.Content>
				
				<Tabs.Content
					id="tab_content_fixed"
					class="tabs__content"
					value="Generated Movement"
				>
					<div class="plotCoefContainer">
						<div class="plotTitle" id="plotPredict">
							Movement Prediction Analysis
						</div>
						
						{/* Metric Cards - Now above the plot */}
						<div class="metric-cards-container" style={{
							display: "flex",
							"flex-direction": "row",
							"justify-content": "center",
							"align-items": "center",
							gap: "8px",
							"margin-bottom": "15px",
							padding: "0 15px"
						}}>
							{/* Max Angle Card */}
							<div class="metric-card" style={{
								background: "#007bff",
								"border-radius": "4px",
								padding: "6px 10px",
								"text-align": "center",
								"box-shadow": "0 1px 3px rgba(0,0,0,0.15)",
								color: "white",
								"min-width": "60px"
							}}>
								<div class="metric-icon" style={{
									"font-size": "12px",
									"margin-bottom": "3px"
								}}></div>
								<div class="metric-value" style={{
									"font-size": "14px",
									"font-weight": "bold",
									"margin-bottom": "2px"
								}}>
									{sarimaxResults()?.original ? 
										Math.max(...sarimaxResults().original).toFixed(1) : 
										"N/A"
									}°
								</div>
								<div class="metric-label" style={{
									"font-size": "9px",
									opacity: "0.9"
								}}>Max Angle</div>
							</div>

							{/* Min Angle Card */}
							<div class="metric-card" style={{
								background: "#007bff",
								"border-radius": "4px",
								padding: "6px 10px",
								"text-align": "center",
								"box-shadow": "0 1px 3px rgba(0,0,0,0.15)",
								color: "white",
								"min-width": "60px"
							}}>
								<div class="metric-icon" style={{
									"font-size": "12px",
									"margin-bottom": "3px"
								}}></div>
								<div class="metric-value" style={{
									"font-size": "14px",
									"font-weight": "bold",
									"margin-bottom": "2px"
								}}>
									{sarimaxResults()?.original ? 
										Math.min(...sarimaxResults().original).toFixed(1) : 
										"N/A"
									}°
								</div>
								<div class="metric-label" style={{
									"font-size": "9px",
									opacity: "0.9"
								}}>Min Angle</div>
							</div>

							{/* MSE Card */}
							<div class="metric-card" style={{
								background: "#007bff",
								"border-radius": "4px",
								padding: "6px 10px",
								"text-align": "center",
								"box-shadow": "0 1px 3px rgba(0,0,0,0.15)",
								color: "white",
								"min-width": "60px"
							}}>
								<div class="metric-icon" style={{
									"font-size": "12px",
									"margin-bottom": "3px"
								}}></div>
								<div class="metric-value" style={{
									"font-size": "14px",
									"font-weight": "bold",
									"margin-bottom": "2px"
								}}>
									{sarimaxResults()?.metrics?.mse ? 
										sarimaxResults().metrics.mse.toFixed(2) : 
										"N/A"
									}
								</div>
								<div class="metric-label" style={{
									"font-size": "9px",
									opacity: "0.9"
								}}>MSE</div>
							</div>

							{/* R² Card */}
							<div class="metric-card" style={{
								background: "#007bff",
								"border-radius": "4px",
								padding: "6px 10px",
								"text-align": "center",
								"box-shadow": "0 1px 3px rgba(0,0,0,0.15)",
								color: "white",
								"min-width": "60px"
							}}>
								<div class="metric-icon" style={{
									"font-size": "12px",
									"margin-bottom": "3px"
								}}></div>
								<div class="metric-value" style={{
									"font-size": "14px",
									"font-weight": "bold",
									"margin-bottom": "2px"
								}}>
									{sarimaxResults()?.metrics?.correlation ? 
										Math.pow(sarimaxResults().metrics.correlation, 2).toFixed(3) : 
										"N/A"
									}
								</div>
								<div class="metric-label" style={{
									"font-size": "9px",
									opacity: "0.9"
								}}>R²</div>
							</div>
						</div>
						
						<div
							id="prediction-chart"
							style={{ width: "100%", height: "400px" }}
						/>
					</div>
				</Tabs.Content>
			</Tabs.Root>
		</>
	)
}

export { TabsGOM_main }
