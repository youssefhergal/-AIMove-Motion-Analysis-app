import { createSignal, createEffect, onMount } from 'solid-js'
import * as echarts from 'echarts'
import { predictionHistory, sarimaxResults, scaleY } from '../../stores/store.js'

/**
 * Movement Prediction Plot Component
 * 
 * Displays a comprehensive plot showing:
 * - Original data (ground truth)
 * - Initial prediction
 * - All retrain predictions (Retrain 1, 2, 3...)
 * 
 * Features:
 * - Interactive legend to show/hide different predictions
 * - Time series visualization
 * - Color-coded predictions
 * - Responsive design
 * 
 * @author youssef hergal
 */
export default function MovementPredictionPlot() {
    const [chart, setChart] = createSignal(null)
    const [containerRef, setContainerRef] = createSignal<HTMLDivElement>()
    const [isUpdating, setIsUpdating] = createSignal(false)
    const [lastUpdateTime, setLastUpdateTime] = createSignal(0)

    // Create the prediction plot
    const createPredictionPlot = () => {
        const container = containerRef()
        
        if (!container) {
            return
        }

        // Prevent multiple concurrent updates
        if (isUpdating()) {
            return
        }

        setIsUpdating(true)

        // Dispose existing chart
        if (chart()) {
            chart().dispose()
        }

        // Create new chart
        const newChart = echarts.init(container)
        setChart(newChart)

        // Get data
        const results = sarimaxResults()
        const history = predictionHistory()

        // Check if we have data to display
        const hasHistory = history && history.length > 0
        const hasResults = results && results.original && results.predicted

        if (hasHistory || hasResults) {
            // Use history if available, otherwise fall back to SARIMAX results
            let originalData = null
            let initialPrediction = null
            
            if (hasHistory) {
                // Get original data from first entry (should be the same for all)
                originalData = history[0].results.original
                
                // Get initial prediction from first entry (type: "initial")
                const initialEntry = history.find(entry => entry.type === 'initial')
                if (initialEntry) {
                    initialPrediction = initialEntry.results.prediction || initialEntry.results.predicted
                }
            } else if (hasResults) {
                originalData = results.original
                initialPrediction = results.predicted
            }

            if (!originalData) return

            // Create time axis (frame numbers) - skip first frame
            const frameCount = originalData.length - 1
            const timeAxis = Array.from({ length: frameCount }, (_, i) => i + 2) // Start from frame 2

            // Calculate data range for better scaling (exclude first frame like in display)
            const allDataArrays = [originalData.slice(1)] // Skip first frame for scaling too
            
            // Add initial prediction if available (skip first frame)
            if (initialPrediction && Array.isArray(initialPrediction)) {
                allDataArrays.push(initialPrediction.slice(1))
            }
            
            // Add retrain predictions if available (skip first frame)
            if (hasHistory) {
                const retrainEntries = history.filter(entry => entry.type === 'retrain')
                retrainEntries.forEach(entry => {
                    if (entry.results.prediction && Array.isArray(entry.results.prediction)) {
                        allDataArrays.push(entry.results.prediction.slice(1))
                    }
                })
            }
            
            // Flatten all data and filter out invalid values
            const allData = allDataArrays.flat().filter(value => 
                typeof value === 'number' && !isNaN(value) && isFinite(value)
            )
            
            let yAxisMin, yAxisMax
            if (allData.length > 0) {
                const minValue = Math.min(...allData)
                const maxValue = Math.max(...allData)
                const range = maxValue - minValue
                const padding = range * 0.2 // 20% padding
                
                yAxisMin = minValue - padding
                yAxisMax = maxValue + padding
                
            }

            // Prepare series data
            const series = []
            const legendData = []

            // Helper function to create detailed legend labels
            const createLegendLabel = (type, entry, index = null) => {
                let baseName = type
                if (index !== null) {
                    baseName = `${type} ${index + 1}`
                }
                
                if (entry && entry.parameters) {
                    const params = entry.parameters
                    const variables = params.selectedVariables === "all" ? "all" : 
                                    (Array.isArray(params.selectedVariables) ? params.selectedVariables.length : "N/A")
                    const lags = params.lags || "N/A"
                    const method = params.method || "N/A"
                    const mae = entry.results?.metrics?.mae ? entry.results.metrics.mae.toFixed(3) : "N/A"
                    const steps = params.forecastSteps || "N/A"
                    
                    return `${baseName} (vars: ${variables}, lags: ${lags}, method: ${method}, mae: ${mae}, steps: ${steps})`
                }
                
                return baseName
            }

            // Add original data (skip first frame)
            series.push({
                name: 'Original',
                type: 'line',
                data: originalData.slice(1), // Skip first frame
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#2E8B57'
                },
                itemStyle: {
                    color: '#2E8B57'
                }
            })
            legendData.push('Original')

            // Add initial prediction if available (skip first frame)
            if (initialPrediction) {
                let initialEntry = null
                if (hasHistory) {
                    initialEntry = history.find(entry => entry.type === 'initial')
                }
                
                const seriesName = createLegendLabel('Initial Prediction', initialEntry)
                
                series.push({
                    name: seriesName,
                    type: 'line',
                    data: initialPrediction.slice(1), // Skip first frame
                    smooth: true,
                    lineStyle: {
                        width: 2,
                        color: '#FF6B6B'
                    },
                    itemStyle: {
                        color: '#FF6B6B'
                    }
                })
                legendData.push(seriesName)
            }

            // Add retrain predictions from history (skip first frame)
            if (hasHistory) {
                const retrainEntries = history.filter(entry => entry.type === 'retrain')
                retrainEntries.forEach((entry, index) => {
                    if (entry.results.prediction) {
                        const seriesName = createLegendLabel('Retrain', entry, index)
                        
                        series.push({
                            name: seriesName,
                            type: 'line',
                            data: entry.results.prediction.slice(1), // Skip first frame
                            smooth: true,
                            lineStyle: {
                                width: 2,
                                color: `hsl(${(index * 60) % 360}, 70%, 50%)`
                            },
                            itemStyle: {
                                color: `hsl(${(index * 60) % 360}, 70%, 50%)`
                            }
                        })
                        legendData.push(seriesName)
                    }
                })
            }

            // Chart configuration
            const option = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        label: {
                            backgroundColor: '#6a7985'
                        }
                    },
                    formatter: function (params) {
                        let result = `Frame: ${params[0].axisValue}<br/>`
                        params.forEach(param => {
                            result += `${param.seriesName}: ${param.value?.toFixed(4) || 'N/A'}<br/>`
                        })
                        return result
                    }
                },
                legend: {
                    data: legendData,
                    top: 0,
                    left: 'left',
                    orient: 'vertical',
                    textStyle: {
                        fontSize: 12
                    }
                },
                grid: {
                    left: '4%',
                    right: '7%',
                    bottom: '20%', // Leave space for X slider
                    top: '40%',
                    containLabel: true
                },
                dataZoom: [
                    { type: 'inside', xAxisIndex: 0 },
                    {
                        type: 'slider',
                        xAxisIndex: 0,
                        filterMode: 'none',
                        bottom: '0px',
                        height: 20 * scaleY(),
                        textStyle: {
                            fontSize: 10
                        },
                        handleStyle: {
                            width: 6,
                            height: 15
                        }
                    },
                    { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
                    {
                        type: 'slider',
                        yAxisIndex: 0,
                        filterMode: 'none',
                        right: '15px',
                        width: 20 * scaleY(),

                        textStyle: {
                            fontSize: 10
                        },
                        handleStyle: {
                            width: 6,
                            height: 15
                        }
                    }
                ],
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: timeAxis,
                    name: 'Frame',
                    nameLocation: 'middle',
                    nameGap: 30,
                    axisLabel: {
                        fontSize: 11
                    }
                },
                yAxis: {
                    type: 'value',
                    name: 'Angle',
                    nameLocation: 'center',
                    nameGap: 50,
                    min: yAxisMin,
                    max: yAxisMax,
                    axisLabel: {
                        fontSize: 11,
                        formatter: function (value) {
                            return value.toFixed(3)
                        }
                    }
                },
                series: series,
                animation: true,
                animationDuration: 1000,
                animationEasing: 'cubicOut' as any
            }

            newChart.setOption(option)
            
            // Force resize to ensure visibility
            setTimeout(() => {
                if (newChart) {
                    newChart.resize()
                }
            }, 100)

        }

        // Reset updating flag
        setIsUpdating(false)

        // Handle window resize
        const handleResize = () => {
            if (newChart) {
                newChart.resize()
            }
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }

    // Update plot when prediction history or SARIMAX results change
    createEffect(() => {
        const history = predictionHistory()
        const results = sarimaxResults()
        const now = Date.now()
        
        // Debounce rapid updates (minimum 500ms between updates)
        if (now - lastUpdateTime() < 500) {
            return
        }
        
        // Check if we have data to display
        const hasHistory = history && history.length > 0
        const hasResults = results && results.original && results.predicted
        
        if (containerRef() && (hasHistory || hasResults) && !isUpdating()) {
            setLastUpdateTime(now)
            requestAnimationFrame(() => {
                createPredictionPlot()
            })
        }
    })

    // Create plot when component mounts
    onMount(() => {
        if (containerRef()) {
            createPredictionPlot()
        }
    })

    
    return (
        <div 
            ref={setContainerRef}
            style={{
                'margin-left': '2.5%',
                width: '95%',
                height: '300px',
                'min-height': '240px',
                padding: '10px'
            }}
        />
    )
}