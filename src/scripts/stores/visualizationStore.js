/**
 * Visualization Store
 * 
 * Manages all visualization-related state including:
 * - 3D scene animation and timing
 * - Chart instances and data
 * - Plot modes and configurations
 * - UI scaling and positioning
 */

import { createSignal } from "solid-js"

// Animation and timing
const [animationDuration, setAnimationDuration] = createSignal(0)
const [currentAnimationTime, setCurrentAnimationTime] = createSignal(0)

// 3D positions
const [positionsX_3D, setPositionsX_3D] = createSignal([])
const [positionsY_3D, setPositionsY_3D] = createSignal([])
const [positionsZ_3D, setPositionsZ_3D] = createSignal([])

// 2D positions
const [positionsX_2D, setPositionsX_2D] = createSignal([])
const [positionsY_2D, setPositionsY_2D] = createSignal([])
const [positionsZ_2D, setPositionsZ_2D] = createSignal([])

// Plot modes
const [mode2DPlot, setMode2DPlot] = createSignal(false)
const [mode3DPlot, setMode3DPlot] = createSignal(false)

// Plot names
const [name2DPlot, setName2DPlot] = createSignal("Position")
const [name3DPlot, setName3DPlot] = createSignal("Position")

// Chart instances
const [chart2D, setChart2D] = createSignal(null)
const [chart3D, setChart3D] = createSignal(null)
const [chart2D_predict, setChart2D_predict] = createSignal(null)
const [chartVector, setChartVector] = createSignal(null)

// UI scaling and positioning
const [scaleX, setScaleX] = createSignal(1)
const [scaleY, setScaleY] = createSignal(1)
const [translateFixerGlobal, setTranslateFixerGlobal] = createSignal(0)
const [mouseJointHover, setMouseJointHover] = createSignal(null)

// Sampling and data processing
const [samplingFactor, setSamplingFactor] = createSignal(30)

// Utility function
function time_to_frame(time) {
    return Math.round(time * 90)
}

export {
    // Animation
    animationDuration, setAnimationDuration,
    currentAnimationTime, setCurrentAnimationTime,
    time_to_frame,
    
    // 3D positions
    positionsX_3D, setPositionsX_3D,
    positionsY_3D, setPositionsY_3D,
    positionsZ_3D, setPositionsZ_3D,
    
    // 2D positions
    positionsX_2D, setPositionsX_2D,
    positionsY_2D, setPositionsY_2D,
    positionsZ_2D, setPositionsZ_2D,
    
    // Plot modes
    mode2DPlot, setMode2DPlot,
    mode3DPlot, setMode3DPlot,
    
    // Plot names
    name2DPlot, setName2DPlot,
    name3DPlot, setName3DPlot,
    
    // Charts
    chart2D, setChart2D,
    chart3D, setChart3D,
    chart2D_predict, setChart2D_predict,
    chartVector, setChartVector,
    
    // UI scaling
    scaleX, setScaleX,
    scaleY, setScaleY,
    translateFixerGlobal, setTranslateFixerGlobal,
    mouseJointHover, setMouseJointHover,
    
    // Data processing
    samplingFactor, setSamplingFactor
}
