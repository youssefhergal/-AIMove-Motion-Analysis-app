import * as echarts from "echarts"
import "echarts-gl"
import { get_mathjax_svg } from "./InitMathJax"

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
	name2DPlot,
	scaleX,
	skeletonViewersSig,
} from "./store"

import { createSignal, createEffect } from "solid-js"

const colors = [
	"#145e9f", // navy blue
	"#dba21c", // golden yellow
	"#659d98", // muted teal
	"#a6d5ff", // light sky blue
	"#887456", // bronze
	"#983c58", // burgundy
]

const createPlot2D = (currentTime, axis = "x") => {
	const container = document.getElementById("plotPanel_2D")

	if (!chart2D()) {
		const myChart = echarts.init(container)
		setChart2D(myChart) // Store the chart instance the first time
	}
	// const myChart = echarts.init(container)
	// setChart2D(myChart) // Store the chart instance the first time

	// Helper to select axis data
	const getAxisPositions = () => {
		if (axis === "x") return positionsX_2D()
		if (axis === "y") return positionsY_2D()
		return positionsZ_2D()
	}

	const axisData = getAxisPositions()
	
	// Safety check for empty data
	if (!axisData || axisData.length === 0) {
		console.warn("No axis data available for 2D plot")
		return
	}
	
	const maxLength = Math.max(...axisData.map((p) => p.length))
	const xAxisData = Array.from({ length: maxLength }, (_, i) => i)

	const paddedPositions = axisData.map((arr) => [...arr]) // Optionally pad with nulls here if needed

	const allPositions = paddedPositions.flat()
	
	// Safety check for empty positions
	if (allPositions.length === 0) {
		console.warn("No position data available for 2D plot")
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
		toolbox: {
			feature: {
				dataZoom: {},
			},
			right: "65px",
		},
		legend: {
			data: series.map((s) => s.name),
			orient: "vertical",
			left: "20px",
			top: "0px",
		},
		grid: { left: "50px", right: "65px", bottom: "170px", top: "90px" },
		dataZoom: [
			{ type: "inside", xAxisIndex: 0 },
			{
				type: "slider",
				xAxisIndex: 0,
				filterMode: "none",
				bottom: "105px",
				height: 20 * scaleX(),
			},
			{ type: "inside", yAxisIndex: 0, filterMode: "none" },
			{
				type: "slider",
				yAxisIndex: 0,
				filterMode: "none",
				right: "15px",
				width: 20 * scaleX(),
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

const createPlot3D = (currentTime) => {
	const container = document.getElementById("plotPanel_3D")
	// const containers = document.querySelectorAll("#plotPanel_3D")

	// if (containers.length > 1) {
	// 	console.warn(
	// 		"⚠️ Multiple elements with id='plotPanel_3D' found:",
	// 		containers.length
	// 	)
	// 	containers.forEach((el, i) => {
	// 		console.log(`Element [${i}]`, el)
	// 	})
	// }

	if (!chart3D()) {
		const myChart = echarts.init(container)
		setChart3D(myChart) // Store the chart instance the first time
	}

	// const myChart = echarts.init(container)
	const currentPointIndex = Math.round(currentTime * 90)

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
		console.warn("No position data available for 3D plot")
		return
	}

	const xMin = Math.min(...allXPositions)
	const xMax = Math.max(...allXPositions)
	const yMin = Math.min(...allYPositions)
	const yMax = Math.max(...allYPositions)
	const zMin = Math.min(...allZPositions)
	const zMax = Math.max(...allZPositions)

	// Calculate ranges and normalization factors
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

	// Chart options
	const option = {
		tooltip: {
			formatter: function (params) {
				const [x, y, z] = params.value
				const color = params.color

				return `
      <div>    <span style="display:inline-block;margin-right:5px;
          border-radius:10px;width:9px;height:9px;
          background-color:${color};"></span>
        <strong >${params.seriesName}</strong><br/>

		
      
       X: ${y.toFixed(2)}<br>Y: ${z.toFixed(2)}<br>Z: ${x.toFixed(2)}
      </div>
    `
			},
		},
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
		grid3D: {
			boxWidth: normalizedXRange,
			boxHeight: normalizedYRange,
			boxDepth: normalizedZRange,
			left: "0%",
			right: "0%",
			bottom: "0%",
			top: "0%",
			viewControl: {
				distance: 170,
				alpha: 30, // A small tilt from the vertical top-down view
				beta: -70,
			},
		},
		legend: {
			data: flatSeries.map((s) => s.name),
			orient: "vertical",
			left: "20px",
			top: "101px",
		},
		series: flatSeries,
		animation: false,
	}
	chart3D().clear()

	chart3D().setOption(option)
}
const updatePlot3D = (currentTime) => {
	const myChart = chart3D()
	if (!myChart) return

	const updatedSeries = skeletonViewersSig().flatMap((viewer, index) => {
		const xPositions = positionsZ_3D()[index]
		const yPositions = positionsX_3D()[index]
		const zPositions = positionsY_3D()[index]

		// 🔐 Skip this viewer if data is missing
		if (!xPositions || !yPositions || !zPositions) return []

		const color = colors[index % colors.length]
		const label = viewer.plotLabel || `Viewer ${index + 1}`
		const currentPointIndex = Math.round(currentTime * 90)

		const lineSeries = {
			name: `${label} Line`,
			type: "line3D",
			data: xPositions.map((x, i) => [x, yPositions[i], zPositions[i]]),
			lineStyle: {
				width: 2,
				color: color,
			},
		}

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

	myChart.setOption({
		series: updatedSeries,
	})
}

const resizePlots = () => {
	chart2D().resize()
	chart3D().resize()
}

export { createPlot2D, updatePlot2D, createPlot3D, updatePlot3D, resizePlots }

