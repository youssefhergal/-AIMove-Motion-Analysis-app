import * as echarts from "echarts"
import "echarts-gl"
import {
	chart2D,
	setChart2D,
	positionsX_2D,
	positionsY_2D,
	positionsZ_2D,
	positionsX_3D,
	positionsY_3D,
	positionsZ_3D,
	chart3D,
	setChart3D,
	chartVector,
	setChartVector,
	name2DPlot,
	name3DPlot,
	selectedJoint,
	samplingFactor,
	selectedRow,
	set_df_coef_mod,
	df_coef_mod,
	chart2D_predict,
	setChart2D_predict,
	axisSelected,
	scaleX,
	skeletonViewersSig,
	currentAnimationTime,
	toggleValue,
} from "./stores/store"
import * as aq from "arquero"
import { createSignal } from "solid-js"

const colors = [
	"#dba21c", // golden yellow (first color - more visible)
	"#145e9f", // navy blue (moved to second)
	"#659d98", // muted teal
	"#a6d5ff", // light sky blue
	"#887456", // bronze
	"#983c58", // burgundy
]


async function createVectorPLot(dataSeriesUnmod, dataSeriesMod) {
	const [moveY, setMoveY] = createSignal(0)
	const [isDragging, setIsDragging] = createSignal(false)

	function sampleEveryNthElement(arr, n) {
		let sampledArray = []
		for (let i = 0; i < arr.length; i += n) {
			sampledArray.push(arr[i])
		}
		// Data series length after sampling
		return sampledArray
	}

	const container = document.getElementById("tablePlots")
	if (!container) {
		// Vector plot container not found
		return
	}

	// Check container dimensions
	const containerInfo = {
		offsetWidth: container.offsetWidth,
		offsetHeight: container.offsetHeight,
		clientWidth: container.clientWidth,
		clientHeight: container.clientHeight,
		visible: container.offsetParent !== null,
		display: window.getComputedStyle(container).display,
		visibility: window.getComputedStyle(container).visibility
	}

	// If container has no dimensions or is not visible, use ResizeObserver
	if (containerInfo.offsetWidth === 0 || containerInfo.offsetHeight === 0 || !containerInfo.visible || containerInfo.display === 'none' || containerInfo.visibility === 'hidden') {
		const resizeObserver = new ResizeObserver((entries) => {
			const target = entries[0].target as HTMLElement
			if (target.offsetWidth > 0 && target.offsetHeight > 0) {
				resizeObserver.disconnect()
				createVectorPLot(dataSeriesUnmod, dataSeriesMod)
			}
		})
		
		resizeObserver.observe(container)
		
		// Fallback timeout (3 seconds max)
		setTimeout(() => {
			resizeObserver.disconnect()
			createVectorPLot(dataSeriesUnmod, dataSeriesMod)
		}, 3000)
		
		return
	}

	if (!chartVector()) {
		// Check if there's already an ECharts instance on this container
		const existingInstance = echarts.getInstanceByDom(container)
		if (existingInstance) {
			setChartVector(existingInstance)
		} else {
			try {
				const myChart = echarts.init(container)
				setChartVector(myChart) // Store the chart instance the first time
			} catch (error) {
				console.error("❌ Error creating vector chart:", error)
				// Retry with ResizeObserver
				const resizeObserver = new ResizeObserver((entries) => {
					const target = entries[0].target as HTMLElement
					if (target.offsetWidth > 0 && target.offsetHeight > 0) {
						resizeObserver.disconnect()
						createVectorPLot(dataSeriesUnmod, dataSeriesMod)
					}
				})
				resizeObserver.observe(container)
				return
			}
		}
	}

	function enableBrush(brushType) {
		myChart.dispatchAction({
			type: "takeGlobalCursor",
			key: "brush",
			brushOption: {
				brushType: brushType,
			},
		})
	}

	const myChart = chartVector()
	if (!myChart) {
		console.error("❌ Vector chart not available")
		return
	}
	
	var symbolSize = 7
	const generalInterval = samplingFactor()

	// let data = sampleEveryNthElement(dataSeries, generalInterval)
	let data = [...dataSeriesMod]

	let unmodifiableData = [...dataSeriesUnmod]

	// const yMin = Math.min(...data)
	// const yMax = Math.max(...data)

	let selectedItems = []
	let initialPosition = null

	// Ensure container is still valid before setting options
	if (container.offsetWidth === 0 || container.offsetHeight === 0) {
		const resizeObserver = new ResizeObserver((entries) => {
			const target = entries[0].target as HTMLElement
			if (target.offsetWidth > 0 && target.offsetHeight > 0) {
				resizeObserver.disconnect()
				createVectorPLot(dataSeriesUnmod, dataSeriesMod)
			}
		})
		resizeObserver.observe(container)
		return
	}

	myChart.setOption({
		tooltip: {
			triggerOn: "none",
			formatter: function (params) {
				return (
					"X: " +
					params.data[0].toFixed(2) +
					"<br />Y: " +
					params.data[1].toFixed(2)
				)
			},
		},
		brush: {
			xAxisIndex: "all",
			brushLink: "all",
			outOfBrush: { colorAlpha: 0.1 },
			toolbox: ["rect", "keep", "clear"],
			inBrush: {
				color: "#437CC0",
			},
			brushStyle: {
				borderWidth: 1,
				color: "rgb(67, 124, 192, 0.01)",
				borderColor: "rgb(67, 124, 192, 0.8)",
			},
			z: 99,
		},
		toolbox: {
			feature: {
				brush: { type: ["rect", "clear"] },
			},
		},
		legend: {
			data: [
				{
					name: "Modifiable Data",
					lineStyle: {
						width: 1.5, // setting width is important to have regular dashes
						type: "dashed",

						color: "#DBA21C",
					},
					itemStyle: {
						color: "#DBA21C",
					},
				},
				{
					name: "Unmodifiable Data",
					symbolSize: 0,
					lineStyle: {
						color: "#c0def7",
						type: "solid",
					},
					itemStyle: { color: "transparent" },
				},
			],
			orient: "vertical", // Orientation of the legend: 'vertical' or 'horizontal'
			left: "25px", // Position of the legend: 'left', 'right', 'top', 'bottom'
			top: "30px", // Vertical alignment when left/right is used
		},
		grid: { left: "60px", right: "60px", bottom: "205px", top: "130px" },
		dataZoom: [
			{ type: "inside", xAxisIndex: 0 },

			{
				type: "slider",
				xAxisIndex: 0,
				filterMode: "none",
				bottom: "135px",
				height: 15 * scaleX(),
				textStyle: {
					fontSize: 8
				},
				handleStyle: {
					width: 6,
					height: 15
				}
			},
			{ type: "inside", yAxisIndex: 0, filterMode: "none" }, // Inside zoom for yAxis
			{
				type: "slider",
				yAxisIndex: 0,
				filterMode: "none",
				width: 15 * scaleX(),
				textStyle: {
					fontSize: 8
				},
				handleStyle: {
					width: 6,
					height: 15
				}
			},
		],
		xAxis: {
			type: "category",
			data: data.map((_, index) => index),
			axisLine: { onZero: false },
			axisLabel: {
				formatter: function (value) {
					return value * generalInterval
				},
			},
			axisTick: {
				interval: 0,
			},
			triggerEvent: true,
		},
		yAxis: {
			type: "value",
			name: "position",
			axisLine: { onZero: false },
		},
		series: [
			{
				id: "a",
				name: "Modifiable Data",
				type: "line",
				smooth: true,
				symbolSize: symbolSize,
				symbol: "circle",
				showAllSymbol: true,
				lineStyle: {
					color: "#DBA21C",
					type: "dashed",
				},
				//green
				itemStyle: {
					color: function (params) {
						return selectedItems.includes(params.dataIndex)
							? "#145e9f"
							: "#DBA21C"
					},
				},

				data: data.map((item, index) => [index, item]),
				// triggerLineEvent: true,
			},

			{
				id: "b",
				name: "Unmodifiable Data",
				type: "line",
				symbol: "none",
				smooth: true,
				symbolSize: 0, // Hide symbols for unmodifiable data
				lineStyle: {
					color: "#c0def7",
					// type: "dashed",
				},
				data: unmodifiableData.map((item, index) => [index, item]),
			},
		],
	})

	enableBrush("rect")

	setTimeout(function () {
		// Add shadow circles (which are not visible) to enable drag.
		myChart.setOption({
			graphic: data.map(function (item, dataIndex) {
				return {
					type: "circle",
					position: myChart.convertToPixel("grid", [dataIndex, item]),
					shape: {
						cx: 0,
						cy: 0,
						r: symbolSize,
					},
					invisible: true,
					draggable: true,
					onmousedown: function () {
						initialPosition = myChart.convertFromPixel("grid", [
							this.x,
							this.y,
						])
					},
					ondrag: function (dx, dy) {
						onPointDragging(dataIndex, [this.x, this.y])
						if (selectedItems.length > 0) {
							moveBrushByDeltaY(moveY())
							enableBrush("rect")
						}
					},
					ondragstart: function () {
						updatePosition()
						setIsDragging(true)
					},
					ondragend: function () {
						updatePosition()
						setIsDragging(false)
						if (selectedItems.length > 0) {
							moveBrushByDeltaY(moveY())
							enableBrush("rect")
						}
						getSeriesData()
					},
					onmousemove: function () {
						showTooltip(dataIndex)
					},
					onmouseout: function () {
						hideTooltip(dataIndex)
					},
					z: 100,
				}
			}),
		})
	}, 0)

	window.addEventListener("resize", function () {
		updatePosition()
		myChart.resize()
	})

	const resetButton = document.getElementById("resetButton")
	if (resetButton) {
		resetButton.addEventListener("click", function () {
			resetButtonFunc()
		})
	}

	async function resetButtonFunc() {
		data = [...dataSeriesUnmod]
		myChart.setOption({
			series: [
				{
					id: "a",
					name: "Modifiable Data",
					type: "line",
					smooth: true,
					symbolSize: symbolSize,
					symbol: "circle",
					showAllSymbol: true,
					lineStyle: {
						color: "#DBA21C",
					},
					//green
					itemStyle: {
						color: function (params) {
							return selectedItems.includes(params.dataIndex)
								? "#145e9f"
								: "#DBA21C"
						},
					},

					data: data.map((item, index) => [index, item]),
					// triggerLineEvent: true,
				},
			],
		})
		getSeriesData()
	}
	myChart.on("dataZoom", updatePosition)
	let currentBrushCoords = null

	myChart.on("brushSelected", function (params) {
		const brushComponent = params.batch[0]

		if (brushComponent.areas.length > 0) {
			const brushArea = brushComponent.areas[0]
			currentBrushCoords = brushArea.coordRange
		}
		if (!isDragging()) {
			selectedItems = []

			brushComponent.areas.forEach((area) => {
				const coordRange = area.coordRange
				const xAxisIndices = coordRange[0]
				const yAxisRange = coordRange[1]
				for (let i = xAxisIndices[0]; i <= xAxisIndices[1]; i++) {
					const yValue = data[i]
					if (yValue >= yAxisRange[0] && yValue <= yAxisRange[1]) {
						selectedItems.push(i)
					}
				}
			})
		}
		updatePosition()
	})

	async function getSeriesData() {
		var chartOption = myChart.getOption()
		var series = chartOption.series
		let secondValuesArray = series[0].data.map((subArray) => subArray[1])
		const columnSelected = {}
		columnSelected[selectedRow()] = secondValuesArray
		
		// Modify the dataframe with Arquero
		const modifiedDataFrame = await df_coef_mod().assign(
			aq.table(columnSelected)
		)
		set_df_coef_mod(modifiedDataFrame)
	}

	function updatePosition(dataType = data) {
		try {
			myChart.setOption({
				graphic: dataType.map(function (item, dataIndex) {
					return {
						type: "circle",
						position: myChart.convertToPixel("grid", [
							dataIndex,
							item,
						]),
					}
				}),
			})
		} catch (error) {
			console.error(error)
		}
	}

	function showTooltip(dataIndex) {
		myChart.dispatchAction({
			type: "showTip",
			seriesIndex: 0,
			dataIndex: dataIndex,
		})
	}

	function hideTooltip(dataIndex) {
		myChart.dispatchAction({
			type: "hideTip",
		})
	}

	function moveBrushByDeltaY(deltaY) {
		if (currentBrushCoords) {
			const [[startX, endX], [startY, endY]] = currentBrushCoords

			// Update the Y coordinates
			const newStartY = startY + deltaY
			const newEndY = endY + deltaY

			// Move the brush to the new position
			myChart.dispatchAction({
				type: "brush",
				areas: [
					{
						brushType: "rect",
						// xAxisIndex: 0,
						coordRange: [
							[startX, endX],
							[startY + deltaY, endY + deltaY],
						],
						// yAxisIndex: 0,
						range: [
							[startX, endX],
							[startY + deltaY, endY + deltaY],
						],
						xAxisIndex: 0,
						yAxisIndex: 0,
					},
				],
			})

			// Update the stored brush coordinates
			currentBrushCoords = [startX, endX, newStartY, newEndY]
		} else {
			console.log("No brush area found.")
		}
	}

	function onPointDragging(dataIndex, pos) {
		if (selectedItems.length === 0) {
			data[dataIndex] = myChart.convertFromPixel("grid", pos)[1] // Only update the y-coordinate

			// Update data
			myChart.setOption({
				series: [
					{
						id: "a",
						data: data.map((y, x) => [x, y]), // Convert 1D array to 2D for series
					},
				],
			})
		} else {
			const currentPos = myChart.convertFromPixel("grid", pos)
			const deltaY = currentPos[1] - initialPosition[1] // Calculate the y-offset
			setMoveY(deltaY)
			// Apply the same y-offset to all selected items
			selectedItems.forEach((selectedIndex) => {
				data[selectedIndex] += deltaY
			})

			// Update data
			myChart.setOption({
				series: [
					{
						id: "a",
						data: data.map((y, x) => [x, y]), // Convert 1D array to 2D for series
						//green
						itemStyle: {
							color: function (params) {
								return selectedItems.includes(params.dataIndex)
									? "#145e9f"
									: "#DBA21C"
							},
						},
					},
				],
			})

			// Update the initial position
			initialPosition = currentPos
		}
	}
}

function LineTitle2D() {
	return name2DPlot() + " Trajectory"
}

function ScatterTitle2D() {
	return "Current " + name2DPlot()
}

function plot2DTitle(axis) {
	return (
		"2D " +
		name2DPlot() +
		" Trajectory of " +
		selectedJoint() +
		" on " +
		axis.toUpperCase() +
		"-Axis"
	)
}
function percentageToPixels(percentage, parentElement) {
	const parentWidth = parentElement.clientWidth
	return (percentage / 100) * parentWidth
}
// ######################################
// ######################################
// ######################################
// #############################################################################################################################################################
// ######################################
// ######################################
// ######################################

const createPlot2D = (currentTime, axis = "x") => {
	const container = document.getElementById("plotPanel_2D")
	
	if (!container) {
		console.error('❌ plotPanel_2D container not found')
		return
	}

	// If container has no dimensions, use ResizeObserver
	if (container.offsetWidth === 0 || container.offsetHeight === 0) {
		const resizeObserver = new ResizeObserver((entries) => {
			const target = entries[0].target as HTMLElement
			if (target.offsetWidth > 0 && target.offsetHeight > 0) {
				resizeObserver.disconnect()
				createPlot2D(currentTime, axis)
			}
		})
		
		resizeObserver.observe(container)
		
		// Fallback timeout (3 seconds max)
		setTimeout(() => {
			resizeObserver.disconnect()
			createPlot2D(currentTime, axis)
		}, 3000)
		
		return
	}

	// Check if there's already an ECharts instance on this container
	const existingInstance = echarts.getInstanceByDom(container)
	if (existingInstance) {
		setChart2D(existingInstance)
	} else {
		const myChart = echarts.init(container)
		setChart2D(myChart)
	}

	// Helper to select axis data
	const getAxisPositions = () => {
		if (axis === "x") return positionsX_2D()
		if (axis === "y") return positionsY_2D()
		return positionsZ_2D()
	}

	const axisData = getAxisPositions()
	
	// Create a simple test plot if no data
	if (!axisData || axisData.length === 0) {
		return
	}
	
	const maxLength = Math.max(...axisData.map((p) => p.length))
	const xAxisData = Array.from({ length: maxLength }, (_, i) => i)

	const paddedPositions = axisData.map((arr) => [...arr]) // Optionally pad with nulls here if needed

	const allPositions = paddedPositions.flat()
	
	// Safety check for empty positions
	if (allPositions.length === 0) {
		return
	}
	
	const yMin = Math.min(...allPositions)
	const yMax = Math.max(...allPositions)

	const paddedLimits = (() => {
		const range = yMax - yMin
		return {
			min: parseFloat((yMin - range).toFixed(0)),
			max: parseFloat((yMax + range).toFixed(0)),
		}
	})()

	function getPositionSeries() {
		return skeletonViewersSig().map((viewer, index) => {
			const label = viewer.plotLabel || `Viewer ${index + 1}`
			const color = colors[index % colors.length]
			const data = paddedPositions[index]

			// Skip this viewer if data is missing
			if (!data) {
				return null
			}

			return {
				name: `${label}`,
				type: "line",
				data: data,
				smooth: false,
				lineStyle: { color },
				itemStyle: { color },
			}
		}).filter(Boolean)
	}

	const series = getPositionSeries()

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
					color: "#222",
				},
			},
		},
		legend: {
			data: series.map((s) => s.name),
			orient: "horizontal",
			left: "1px",
			top: "0px",
			textStyle: {
				fontSize: 10
			},

		},
		grid: { left: "30px", right: "35px", bottom: "120px", top: "50px" },
		dataZoom: [
			{ type: "inside", xAxisIndex: 0 },
			{
				type: "slider",
				xAxisIndex: 0,
				filterMode: "none",
				bottom: "90px",
				height: 7 * scaleX(),
				textStyle: {
					fontSize: 10
				},
				handleStyle: {
					width: 6,
					height: 15
				}
			},
			{ type: "inside", yAxisIndex: 0, filterMode: "none" },
			{
				type: "slider",
				yAxisIndex: 0,
				filterMode: "none",
				right: "15px",
				width: 7 * scaleX(),
				textStyle: {
					fontSize: 10
				},
				handleStyle: {
					width: 6,
					height: 15
				}
			},
		],
		xAxis: {
			type: "category",
			data: xAxisData,
			axisLine: {
				onZero: false,
			},
		},
		yAxis: {
			type: "value",
			name: name2DPlot(),
			min: paddedLimits.min,
			max: paddedLimits.max,
		},
		series: series,
	}

	chart2D().clear()

	chart2D().setOption(option)

	chart2D().dispatchAction({
		type: "takeGlobalCursor",
		key: "brush",
		brushOption: { brushType: "lineX", brushMode: "single" },
	})
}

const updatePlot2D = (currentTime) => {
	const myChart = chart2D()
	if (!myChart) return

	const currentPointIndex = Math.round(currentTime * 90)

	myChart.setOption({
		series: [
			{
				markLine: {
					silent: true,
					data: [
						{
							xAxis: currentPointIndex,
						},
					],
					lineStyle: {
						color: "#999",
						width: 1,
						type: "dashed",
						opacity: 0.6,
					},
					symbol: ["none", "none"],
					animation: false,
				},
			},
		],
	})
}

function LineTitle3D() {
	return name3DPlot() + " Trajectory"
}

function ScatterTitle3D() {
	return "Current " + name3DPlot()
}

const createPlot3D = (currentTime) => {
	const container = document.getElementById("plotPanel_3D")
	
	if (!container) {
		console.error('❌ plotPanel_3D container not found')
		return
	}


	// If container has no dimensions, use ResizeObserver
	if (container.offsetWidth === 0 || container.offsetHeight === 0) {
		const resizeObserver = new ResizeObserver((entries) => {
			const target = entries[0].target as HTMLElement
			if (target.offsetWidth > 0 && target.offsetHeight > 0) {
				resizeObserver.disconnect()
				createPlot3D(currentTime)
			}
		})
		
		resizeObserver.observe(container)
		
		// Fallback timeout (3 seconds max)
		setTimeout(() => {
			resizeObserver.disconnect()
			createPlot3D(currentTime)
		}, 3000)
		
		return
	}

	// Check if there's already an ECharts instance on this container
	const existingInstance = echarts.getInstanceByDom(container)
	if (existingInstance) {
		setChart3D(existingInstance)
	} else {
		const myChart = echarts.init(container)
		setChart3D(myChart)
	}

	const currentPointIndex = Math.round(currentTime * 90)

	// Create a simple test plot if no data
	if (!skeletonViewersSig() || skeletonViewersSig().length === 0) {
		return
	}

	// Prepare data for all viewers
	const series = skeletonViewersSig().map((viewer, index) => {
		const label = viewer.plotLabel || `Viewer ${index + 1}`
		const xPositions = positionsZ_3D()[index] // Z-axis
		const yPositions = positionsX_3D()[index] // X-axis
		const zPositions = positionsY_3D()[index] // Y-axis
		const color = colors[index % colors.length]


		// Skip this viewer if data is missing
		if (!xPositions || !yPositions || !zPositions) {
			return null
		}


		// Line3D series for each viewer
		const lineSeries = {
			name: `${label} Line`,
			type: "line3D",
			data: xPositions.map((x, i) => [x, yPositions[i], zPositions[i]]),
			lineStyle: {
				width: 2,
				color: color,
			},
		}

		// Scatter3D series for each viewer's current point
		const scatterSeries = {
			name: `${label} Point`,
			type: "scatter3D",
			data: [
				[
					xPositions[currentPointIndex],
					yPositions[currentPointIndex],
					zPositions[currentPointIndex],
				],
			],
			symbolSize: 8,
			itemStyle: {
				color: color,
			},
		}

		return [lineSeries, scatterSeries]
	})

	// Flatten series for the chart and filter out null values
	const flatSeries = series.filter(Boolean).flat()

	// Find global min and max across all viewers for each axis
	const allXPositions = skeletonViewersSig().flatMap(
		(_, index) => positionsZ_3D()[index] || []
	)
	const allYPositions = skeletonViewersSig().flatMap(
		(_, index) => positionsX_3D()[index] || []
	)
	const allZPositions = skeletonViewersSig().flatMap(
		(_, index) => positionsY_3D()[index] || []
	)

	// Safety check for empty arrays
	if (allXPositions.length === 0 || allYPositions.length === 0 || allZPositions.length === 0) {
		return
	}


	const xMin = Math.min(...allXPositions)
	const xMax = Math.max(...allXPositions)
	const yMin = Math.min(...allYPositions)
	const yMax = Math.max(...allYPositions)
	const zMin = Math.min(...allZPositions)
	const zMax = Math.max(...allZPositions)

	// Calculate the range of each axis
	const xRange = xMax - xMin
	const yRange = yMax - yMin
	const zRange = zMax - zMin

	const scaleFactor = 80

	const normalizedXRange =
		(xRange / Math.max(xRange, yRange, zRange)) * scaleFactor
	const normalizedYRange =
		(yRange / Math.max(xRange, yRange, zRange)) * scaleFactor
	const normalizedZRange =
		(zRange / Math.max(xRange, yRange, zRange)) * scaleFactor

	const option = {
		tooltip: {},
		xAxis3D: {
			type: "value",
			min: Math.round(xMin),
			max: Math.round(xMax),
			name: "Z",
		},
		yAxis3D: {
			type: "value",
			min: Math.round(yMin),
			max: Math.round(yMax),
			name: "X",
		},
		zAxis3D: {
			type: "value",
			min: Math.round(zMin),
			max: Math.round(zMax),
			name: "Y",
		},
		axisLabel: {
			fontSize: 10,
		},
		grid3D: {
			boxWidth: normalizedXRange,
			boxHeight: normalizedYRange,
			boxDepth: normalizedZRange,
			left: "0%",
			right: "0%",
			bottom: "0%",
			top: "-10%",
			viewControl: {
				distance: 170,
				alpha: 30,
				beta: -70,
			},
		},
		legend: {
			data: flatSeries.map((s) => s.name),
			orient: "vertical",
			left: "10px",
			top: "10px",
			textStyle: {
				fontSize: 10
			},
		},
		series: flatSeries,
		animation: false,
	}

	chart3D().clear()
	chart3D().setOption(option, false)
}

const updatePlot3D = (currentTime) => {
	const myChart = chart3D()
	if (!myChart) return

	const currentPointIndex = Math.round(currentTime * 90)

	// Update scatter points for all viewers
	const scatterSeries = skeletonViewersSig().map((viewer, index) => {
		const label = viewer.plotLabel || `Viewer ${index + 1}`
		const xPositions = positionsZ_3D()[index]
		const yPositions = positionsX_3D()[index]
		const zPositions = positionsY_3D()[index]
		const color = colors[index % colors.length]

		if (!xPositions || !yPositions || !zPositions) {
			return null
		}

		return {
			name: `${label} Point`,
			type: "scatter3D",
			data: [
				[
					xPositions[currentPointIndex],
					yPositions[currentPointIndex],
					zPositions[currentPointIndex],
				],
			],
			symbolSize: 8,
			itemStyle: {
				color: color,
			},
		}
	}).filter(Boolean)

	// Update only the scatter series (points)
	myChart.setOption({
		series: scatterSeries.map((s, index) => ({
			...s,
			seriesIndex: index * 2 + 1, // Scatter series are at odd indices
		})),
	})
}


const resizePlots = () => {
	try {
		setTimeout(() => {
			if (chart2D()) {
				chart2D().resize()
			}
			if (chart3D()) {
				chart3D().resize()
			}
			if (chartVector()) {
				try {
					chartVector().resize()
				} catch (error) {
					console.warn("⚠️ Error resizing vector chart:", error)
				}
			}
			if (chart2D_predict()) {
				chart2D_predict().resize()
			}
			
			// After resize, try to recreate plots if they're empty
			setTimeout(() => {
				const container2D = document.getElementById("plotPanel_2D")
				const container3D = document.getElementById("plotPanel_3D")
				
				if (container2D && container2D.children.length === 0) {
					createPlot2D(currentAnimationTime(), toggleValue())
				}
				
				if (container3D && container3D.children.length === 0) {
					createPlot3D(currentAnimationTime())
				}
			}, 200)
		}, 100)
	} catch (error) {
		console.error("❌ Error resizing plots:", error)
	}
}

export {
	createPlot2D,
	updatePlot2D,
	createPlot3D,
	updatePlot3D,
	resizePlots,
	createVectorPLot
}
