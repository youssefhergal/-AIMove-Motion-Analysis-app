/**
 * Centralized Store Index
 * 
 * Re-exports all domain-specific stores for backward compatibility
 * while providing a clean, organized structure.
 */

// Re-export all stores
export * from './visualizationStore.js'
export * from './uiStore.js'
export * from './analysisStore.js'
export * from './dataStore.js'
export * from './sceneStore.js'

// Store categories for better organization
export { 
    // Visualization
    animationDuration, setAnimationDuration,
    currentAnimationTime, setCurrentAnimationTime,
    positionsX_3D, setPositionsX_3D,
    positionsY_3D, setPositionsY_3D,
    positionsZ_3D, setPositionsZ_3D,
    positionsX_2D, setPositionsX_2D,
    positionsY_2D, setPositionsY_2D,
    positionsZ_2D, setPositionsZ_2D,
    mode2DPlot, setMode2DPlot,
    mode3DPlot, setMode3DPlot,
    name2DPlot, setName2DPlot,
    name3DPlot, setName3DPlot,
    chart2D, setChart2D,
    chart3D, setChart3D,
    chart2D_predict, setChart2D_predict,
    chartVector, setChartVector,
    scaleX, setScaleX,
    scaleY, setScaleY,
    translateFixerGlobal, setTranslateFixerGlobal,
    mouseJointHover, setMouseJointHover,
    samplingFactor, setSamplingFactor,
    time_to_frame
} from './visualizationStore.js'

export {
    // UI
    splitterSizeL, setSplitterSizeL,
    splitterSizeR, setSplitterSizeR,
    splitterSizePlotL, setSplitterSizePlotL,
    splitterSizePlotR, setSplitterSizePlotR,
    splitterSizeSkelUp, setSplitterSizeSkelUp,
    splitterSizeSkelDown, setSplitterSizeSkelDown,
    splitterVtable, setSplitterVtable,
    splitterVplotVector, setSplitterVplotVector,
    selectedJoint, setSelectedJoint,
    selectedValue, setSelectedValue,
    selectedRow, setSelectedRow,
    toggleValue, setToggleValue,
    axisSelected, setAxisSelected,
    selectedTab, setSelectedTab,
    loadingDone, setLoadingDone,
    mainPageLoaded, setMainPageLoaded,
    appIsLoaded, setAppIsLoaded,
    uploadOutput, setUploadOutput,
    checkboxFistClick, setCheckboxFistClick,
    checkboxValue, setCheckboxValue,
    scrollBarWidth, setScrollBarWidth,
    bonesList, setBonesList
} from './uiStore.js'

export {
    // Analysis
    sarimaxAnalyzer, setSarimaxAnalyzer,
    sarimaxResults, setSarimaxResults,
    sarimaxConfig, setSarimaxConfig,
    isAnalyzing, setIsAnalyzing,
    analysisProgress, setAnalysisProgress,
    kfgomData, setKfgomData,
    kfgomFilters, setKfgomFilters,
    selectedAssumptionsIndex, setSelectedAssumptionsIndex,
    inputGOM, setInputGOM,
    outputGOM, setOutputGOM,
    forecastConfig, setForecastConfig,
    forecastResults, setForecastResults,
    retrainHistory, setRetrainHistory,
    currentRetrainIndex, setCurrentRetrainIndex,
    df_coef, set_df_coef,
    df_pred, set_df_pred,
    df_pred_sampled, set_df_pred_sampled,
    df_coef_mod, set_df_coef_mod,
    df_pred_mod, set_df_pred_mod,
    df_coef_sub, set_df_coef_sub,
    df_A1, set_df_A1,
    df_A2, set_df_A2,
    df_A3, set_df_A3,
    df_A4, set_df_A4,
    df_A5, set_df_A5,
    df_A6, set_df_A6
} from './analysisStore.js'

export {
    // Data
    rawSkeletenBones, setRawSkeletenBones,
    trainFile, setTrainFile,
    testFile, setTestFile,
    trainFileBones, setTrainFileBones,
    testFileBones, setTestFileBones
} from './dataStore.js'

export {
    // Scene
    baseScene, setBaseScene,
    skeletons, setSkeletons,
    skeletonsArray, setSkeletonsArray,
    skeletonViewersSig, setSkeletonViewersSig,
    playPressed, setPlayPressed,
    toolTipVisibility, setToolTipVisibility,
    selectedBVH, setSelectedBVH,
    selectedBVHList, setSelectedBVHList,
    bvHVisibilityMap, setBVHVisibilityMap,
    isBVHdefault, setIsBVHdefault,
    getCurrentActiveBVH,
    getVisibleBVHFiles,
    getVisibleSkeletons,
    initializeSkeletonArray
} from './sceneStore.js'
