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

	async function ResizeGenerate() {
		chart2D_predict().resize()
	}

	// Function to create ECharts prediction plot
	const createPredictionChart = () => {
		const chartContainer = document.getElementById("prediction-chart")
		if (!chartContainer) return

		// Dispose existing chart if any
		if (chartInstance()) {
			chartInstance().dispose()
		}

		const chart = echarts.init(chartContainer)
		setChartInstance(chart)

		const results = sarimaxResults()
		if (!results || !results.actual || !results.predicted) {
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

		const actual = results.actual
		const predicted = results.predicted
		const retrained = (window as any).retrainedPredictionData || []

		// Create time series data
		const timeData = Array.from({ length: actual.length }, (_, i) => i + 1)

		// Prepare series data
		const series = [
			{
				name: "Original",
				type: "line",
				data: actual,
				smooth: true,
				lineStyle: { width: 2 },
				itemStyle: { color: "#5470c6" }
			},
			{
				name: "Initial Prediction",
				type: "line",
				data: predicted,
				smooth: true,
				lineStyle: { width: 2 },
				itemStyle: { color: "#91cc75" }
			}
		]

		// Add retrained prediction if available
		if (retrained && retrained.length > 0) {
			series.push({
				name: "Retrained Prediction",
				type: "line",
				data: retrained,
				smooth: true,
				lineStyle: { width: 2 },
				itemStyle: { color: "#ee6666" }
			})
		}

		const option = {
			title: {
				text: `Movement Prediction: ${selectedJoint()}_${axisSelected()}rotation`,
				left: "center",
				textStyle: {
					fontSize: 14,
					fontWeight: "bold"
				}
			},
			tooltip: {
				trigger: "axis",
				formatter: function(params) {
					let result = `Time: ${params[0].axisValue}<br/>`
					params.forEach(param => {
						result += `${param.seriesName}: ${param.value.toFixed(4)}<br/>`
					})
					return result
				}
			},
			legend: {
				data: series.map(s => s.name),
				top: 30
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true
			},
			xAxis: {
				type: "category",
				data: timeData,
				name: "Time Steps",
				nameLocation: "middle",
				nameGap: 30
			},
			yAxis: {
				type: "value",
				name: "Rotation Value",
				nameLocation: "middle",
				nameGap: 40
			},
			series: series,
			animation: true
		}

		chart.setOption(option)

		// Handle window resize
		window.addEventListener("resize", () => {
			chart.resize()
		})
	}

	// Effect to update chart when data changes
	createEffect(() => {
		const results = sarimaxResults()
		if (results && selectedTab() === "Generated Movement") {
			setTimeout(() => {
				createPredictionChart()
			}, 100)
		}
	})

	// Effect to update chart when tab changes
	createEffect(() => {
		if (selectedTab() === "Generated Movement") {
			setTimeout(() => {
				createPredictionChart()
			}, 100)
		}
	})

	// Effect to update chart when retrained data changes
	createEffect(() => {
		const retrainedData = (window as any).retrainedPredictionData
		if (retrainedData && selectedTab() === "Generated Movement") {
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
						setTimeout(() => {
							chart2D_predict().resize()
						}, 1)
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
