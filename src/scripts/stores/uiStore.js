/**
 * UI Store
 * 
 * Manages all UI-related state including:
 * - Layout and splitter configurations
 * - Selection states
 * - Loading states
 * - UI interactions
 */

import { createSignal } from "solid-js"

// Layout and splitters
const [splitterSizeL, setSplitterSizeL] = createSignal(100)
const [splitterSizeR, setSplitterSizeR] = createSignal(0)
const [splitterSizePlotL, setSplitterSizePlotL] = createSignal(50)
const [splitterSizePlotR, setSplitterSizePlotR] = createSignal(50)
const [splitterSizeSkelUp, setSplitterSizeSkelUp] = createSignal(50)
const [splitterSizeSkelDown, setSplitterSizeSkelDown] = createSignal(50)
const [splitterVtable, setSplitterVtable] = createSignal(40)
const [splitterVplotVector, setSplitterVplotVector] = createSignal(60)

// Selection states
const [selectedJoint, setSelectedJoint] = createSignal("Hips")
const [selectedValue, setSelectedValue] = createSignal("Hips")
const [selectedRow, setSelectedRow] = createSignal("Hips")
const [toggleValue, setToggleValue] = createSignal("x")
const [axisSelected, setAxisSelected] = createSignal("X")
const [selectedTab, setSelectedTab] = createSignal("Assumptions")

// Loading and app states
const [loadingDone, setLoadingDone] = createSignal(false)
const [mainPageLoaded, setMainPageLoaded] = createSignal(false)
const [appIsLoaded, setAppIsLoaded] = createSignal(false)
const [uploadOutput, setUploadOutput] = createSignal("No file uploaded")

// UI interactions
const [checkboxFistClick, setCheckboxFistClick] = createSignal(false)
const [checkboxValue, setCheckboxValue] = createSignal(false)
const [scrollBarWidth, setScrollBarWidth] = createSignal(0)

// Bones and data
const [bonesList, setBonesList] = createSignal([])

// Additional splitter configurations
const [splitterSizePlotsRow1, setSplitterSizePlotsRow1] = createSignal(50)
const [splitterSizePlotsRow2, setSplitterSizePlotsRow2] = createSignal(50)
const [splitterSizePlotRow2Col1, setsplitterSizePlotRow2Col1] = createSignal(33)
const [splitterSizePlotRow2Col2, setsplitterSizePlotRow2Col2] = createSignal(34)
const [splitterSizePlotRow2Col3, setsplitterSizePlotRow2Col3] = createSignal(33)

// Additional UI states
const [currentImportMode, setCurrentImportMode] = createSignal("repo")
const [openAlert, setOpenAlert] = createSignal(false)

export {
    // Layout
    splitterSizeL, setSplitterSizeL,
    splitterSizeR, setSplitterSizeR,
    splitterSizePlotL, setSplitterSizePlotL,
    splitterSizePlotR, setSplitterSizePlotR,
    splitterSizeSkelUp, setSplitterSizeSkelUp,
    splitterSizeSkelDown, setSplitterSizeSkelDown,
    splitterVtable, setSplitterVtable,
    splitterVplotVector, setSplitterVplotVector,
    
    // Selections
    selectedJoint, setSelectedJoint,
    selectedValue, setSelectedValue,
    selectedRow, setSelectedRow,
    toggleValue, setToggleValue,
    axisSelected, setAxisSelected,
    selectedTab, setSelectedTab,
    
    // Loading states
    loadingDone, setLoadingDone,
    mainPageLoaded, setMainPageLoaded,
    appIsLoaded, setAppIsLoaded,
    uploadOutput, setUploadOutput,
    
    // UI interactions
    checkboxFistClick, setCheckboxFistClick,
    checkboxValue, setCheckboxValue,
    scrollBarWidth, setScrollBarWidth,
    
    // Data
    bonesList, setBonesList,
    
    // Additional splitters
    splitterSizePlotsRow1, setSplitterSizePlotsRow1,
    splitterSizePlotsRow2, setSplitterSizePlotsRow2,
    splitterSizePlotRow2Col1, setsplitterSizePlotRow2Col1,
    splitterSizePlotRow2Col2, setsplitterSizePlotRow2Col2,
    splitterSizePlotRow2Col3, setsplitterSizePlotRow2Col3,
    
    // Additional UI states
    currentImportMode, setCurrentImportMode,
    openAlert, setOpenAlert
}
