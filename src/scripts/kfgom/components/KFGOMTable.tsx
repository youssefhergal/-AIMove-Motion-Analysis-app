import { createSignal, onMount, createEffect } from 'solid-js'
import { createGrid } from 'ag-grid-community'
import { sarimaxResults, sarimaxConfig, kfgomFilters, selectedAssumptionsIndex, setSelectedAssumptionsIndex, trainFileBones, testFileBones } from '../../stores/store.js'
import { gomSelector } from '../utils/gomVariableSelector'
import { eventBus, EVENTS, emitSelectionChanged } from '../../utils/eventBus.js'
import { logUI, logUIError } from '../../utils/logger.js'

/**
 * KFGOM Table Component
 * 
 * Displays SARIMAX analysis results in an interactive AG-Grid table.
 * 
 * ✅ FEATURES:
 * - AG-Grid built-in multi-row selection with checkboxes
 * - Header checkbox for select all/deselect all
 * - Shift+Click for range selection
 * - GOM assumption filtering with significance filtering
 * - Real-time selection state tracking
 * - Integration with retraining functionality
 * - 🆕 PERSISTENT SELECTION: Maintains selections across different assumptions
 * 
 * @author youssef hergal
 */
export default function KFGOMTable() {
    const [kfgomData, setKfgomData] = createSignal([])
    const [filteredData, setFilteredData] = createSignal([])
    const [gridApi, setGridApi] = createSignal(null)
    const [selectedJoints, setSelectedJoints] = createSignal(new Set())

    // Map to store selected variables (Joint Name -> true) - Global across all tabs
    const [selectedVariablesMap, setSelectedVariablesMap] = createSignal(new Map())
    
    // Global map that persists across all assumption tabs
    let globalSelectedVariables = new Map()
    
    // Reactive signal for total selected count
    const [totalSelectedCount, setTotalSelectedCount] = createSignal(0)
    
    // Flag to prevent selection events during data updates
    const [isUpdatingData, setIsUpdatingData] = createSignal(false)
    
    // Auto-checking removed - users manually select variables
    
    // Track last update to prevent rapid successive updates
    const [lastUpdateTime, setLastUpdateTime] = createSignal(0)

    // Save selected variables by joint name
    const saveSelectedVariables = () => {
        const api = gridApi()
        if (!api) return
        
        const selectedRows = api.getSelectedRows()
        const selectedJointIds = new Set(selectedRows.map(row => row.jointId))
        
        // Update global map with current tab selections
        // Keep all previously selected joints from other tabs
        const currentAssumption = selectedAssumptionsIndex()
        const newGlobalMap = new Map(globalSelectedVariables)
        
        // Remove all joints from current assumption
        const currentData = kfgomData()
        if (currentData && currentData.length > 0) {
            const currentAssumptionData = filterDataByGOMAssumption(currentData, currentAssumption)
            currentAssumptionData.forEach(item => {
                if (item.jointId) {
                    newGlobalMap.delete(item.jointId)
                }
            })
        }
        
        // Add currently selected joints from this tab
        selectedJointIds.forEach(jointId => {
            newGlobalMap.set(jointId, true)
        })
        
        // Update global map
        globalSelectedVariables = newGlobalMap
        setSelectedVariablesMap(newGlobalMap)
        setTotalSelectedCount(newGlobalMap.size)
    }

    // Apply selections from the map
    const applySelectionsFromMap = () => {
        const api = gridApi()
        if (!api) return
        
        // Use global map for total count, but only show current tab selections
        const globalMap = globalSelectedVariables
        const totalRows = api.getDisplayedRowCount()
        
        // Apply selections silently
        api.deselectAll()
        
        // Track which joints are actually selected in the current filtered view
        const actuallySelectedJoints = new Set()
        
        for (let i = 0; i < totalRows; i++) {
            const rowNode = api.getDisplayedRowAtIndex(i)
            if (rowNode && rowNode.data) {
                const jointName = rowNode.data.jointId
                if (globalMap.has(jointName)) {
                    rowNode.setSelected(true)
                    actuallySelectedJoints.add(jointName)
                }
            }
        }
        
        // Selections applied
        api.refreshCells({ force: true })
        // Update selectedJoints to only show joints that are actually selected in current view
        setSelectedJoints(actuallySelectedJoints)
        
        // Update local map to reflect global state
        setSelectedVariablesMap(globalMap)
        setTotalSelectedCount(globalMap.size)
    }

    // Get total selected count (reactive) - uses reactive signal
    const getTotalSelectedCount = () => {
        return totalSelectedCount()
    }

    // Filter data based on GOM assumptions
    const filterDataByGOMAssumption = (data, assumptionIndex) => {
        // "All Assumptions" tab shows full dataset
        if (assumptionIndex === 11) {
            return data
        }
        
        // Map tab indices to GOM assumption indices
        const assumptionMapping = {
            0: 0,   // GOM Overview
            2: 2,   // Transitioning
            4: 3,   // Intra-joint Association
            6: 4,   // Inter-limb Synergy
            8: 5,   // Serial Intra-limb Mediation
            10: 6   // Non-serial Intra-limb Mediation
        }
        
        const actualAssumptionIndex = assumptionMapping[assumptionIndex] || 0
        
        
        // If it's GOM Overview, return all data
        if (actualAssumptionIndex === 0) {
            return data
        }
        
        // Apply GOM filtering for specific assumptions
        const jointNames = data.map(item => item.jointId)
        const results = sarimaxResults()
        let targetCombined = 'Hips_Xrotation'
        
        if (results && results.targetJoint && results.targetAxis) {
            targetCombined = `${results.targetJoint}_${results.targetAxis}`
        } else {
            const cfg = sarimaxConfig()
            targetCombined = cfg ? `${cfg.targetJoint}_${cfg.targetAxis}` : 'Hips_Xrotation'
        }
        
        // Map assumption index to assumption type name
        const assumptionTypeMap = {
            2: 'transitioning',
            3: 'intra-joint association', 
            4: 'inter-limb synergies',
            5: 'serial intra-limb mediation',
            6: 'non-serial intra-limb mediation'
        }
        
        const assumptionType = assumptionTypeMap[actualAssumptionIndex] || 'transitioning'
        const selectedJointNames = gomSelector.selectVariablesByAssumption(assumptionType, jointNames, targetCombined)
        const gomFiltered = data.filter(item => selectedJointNames.includes(item.jointId))
        
        return gomFiltered
    }

    // Filter data based on significance
    const filterDataBySignificance = (data, significanceFilter) => {
        if (significanceFilter === 'all') {
            return data
        }
        

        
        const filtered = data.filter(item => {
            if (significanceFilter === 'significant') {
                return item.significance === '***' || item.significance === '**' || item.significance === '*'
            } else if (significanceFilter === 'non-significant') {
                return item.significance === '.' || item.significance === '~' || item.significance === ''
            }
            return true
        })
        
        return filtered
    }

    // Clear all saved selections
    const clearAllSelections = () => {
        globalSelectedVariables = new Map()
        setSelectedVariablesMap(new Map())
        setTotalSelectedCount(0)
        const api = gridApi()
        if (api) {
            api.deselectAll()
            setSelectedJoints(new Set())
        }
    }

    // Convert SARIMAX results to table data format
    const convertSARIMAXToTableData = (results) => {
        if (!results || !results.modelSummary || !results.modelSummary.variables) {
            return []
        }

        const tableData = results.modelSummary.variables.map((variable, index) => ({
            id: index + 1,
            jointId: variable.variable,
            jointName: variable.variable,
            coefficient: variable.coefficient.toFixed(6),
            pValue: variable.pValue.toFixed(6),
            significance: variable.significance,
            selected: false
        }))
        
        return tableData
    }

    // Cell renderer for significance with color coding and tooltip
    const significanceCellRenderer = (params) => {
        const isSignificant = params.value === '***' || params.value === '**' || params.value === '*'
        const color = isSignificant ? '#4CAF50' : '#F44336'
        const backgroundColor = isSignificant ? '#E8F5E8' : '#FFEBEE'
        const tooltipText = isSignificant ? 'Significant' : 'Not Significant'
        return `<span title="${tooltipText}: ${params.value}" style="color: ${color}; font-weight: bold; background-color: ${backgroundColor}; padding: 2px 6px; border-radius: 3px;">${params.value}</span>`
    }

    // Cell renderer for joint ID with built-in checkbox selection
    const jointIdCellRenderer = (params) => {
        return `<span title="${params.value}">${params.value}</span>`
    }

    // Cell renderer for coefficient with tooltip
    const coefficientCellRenderer = (params) => {
        return `<span title="${params.value}">${params.value}</span>`
    }

    // Cell renderer for p-value with tooltip
    const pValueCellRenderer = (params) => {
        return `<span title="${params.value}">${params.value}</span>`
    }

    // Cell renderer for joint name with tooltip
    const jointNameCellRenderer = (params) => {
        return `<span title="${params.value}">${params.value}</span>`
    }

    // Handle selection changes
    const onSelectionChanged = () => {
        saveSelectedVariables()
    }

    // Handle row selection
    const onRowSelected = () => {
        saveSelectedVariables()
    }

    // Reset everything when target joint changes
    createEffect(() => {
        const results = sarimaxResults()
        const config = sarimaxConfig()
        
        // Get current target joint
        let currentTarget = 'Hips_Xrotation'
        if (results && results.targetJoint && results.targetAxis) {
            currentTarget = `${results.targetJoint}_${results.targetAxis}`
        } else if (config) {
            currentTarget = `${config.targetJoint}_${config.targetAxis}`
        }
        
        // Store previous target to detect changes
        const previousTarget = (window as any).previousTargetJoint
        
        // If target joint changed, reset everything
        if (previousTarget && previousTarget !== currentTarget) {
            
            // Reset global selections when target changes
            globalSelectedVariables = new Map()
            setSelectedVariablesMap(new Map())
            setTotalSelectedCount(0)
            
            // Reset selected joints
            setSelectedJoints(new Set())
            
            // Clear grid selections
            const api = gridApi()
            if (api) {
                api.deselectAll()
            }
            
        }
        
        // Store current target for next comparison
        ;(window as any).previousTargetJoint = currentTarget
    })

    // Clean and simple data flow
    createEffect(() => {
        const assumptionIndex = selectedAssumptionsIndex()
        const data = kfgomData()
        const filters = kfgomFilters()
        
        if (!data || data.length === 0) return
        
        // Apply filtering
        let filteredData = filterDataByGOMAssumption(data, assumptionIndex)
        
        if (filters.significance !== 'all') {
            filteredData = filterDataBySignificance(filteredData, filters.significance)
            
        } else {
            // When switching to "All", keep existing selections but don't auto-check everything
            // Switched to "All" filter
        }
        
        // Update the grid
        setFilteredData(filteredData)
        
        const api = gridApi()
        if (api) {
            // Set flag to prevent selection events during update
            setIsUpdatingData(true)
            
            api.setGridOption('rowData', filteredData)
            
            // Wait for grid to update, then apply selections
            setTimeout(() => {
                applySelectionsFromMap()
                setIsUpdatingData(false)
            }, 200)
        }
    })

    // Update grid when data changes - with debouncing to prevent loops
    createEffect(() => {
        const data = filteredData()
        const api = gridApi()
        const now = Date.now()
        
        // Prevent infinite loop - more aggressive check
        if (isUpdatingData()) {
            return
        }
        
        // Debounce rapid updates (minimum 100ms between updates)
        if (now - lastUpdateTime() < 100) {
            return
        }
        
        if (!api || !data || data.length === 0) {
            return
        }
        
        // Set flags to prevent selection events during update
        setIsUpdatingData(true)
        setLastUpdateTime(now)
        
        api.setGridOption('rowData', data)
        
        // Use requestAnimationFrame instead of setTimeout for better timing
        requestAnimationFrame(() => {
            applySelectionsFromMap()
            setIsUpdatingData(false)
        })
    })

    // Update data when SARIMAX results change - with proper reactivity
    createEffect(() => {
        const results = sarimaxResults()
        const config = sarimaxConfig()
        
        if (results) {
            const tableData = convertSARIMAXToTableData(results)
            setKfgomData(tableData)
        } else {
            setKfgomData([])
        }
    })

    // Auto-check variables when significance filter changes (separate effect to avoid loops)
    createEffect(() => {
        const filters = kfgomFilters()
        const data = kfgomData()
        const assumptionIndex = selectedAssumptionsIndex()

        if (!data || data.length === 0) return
        
        // Filter now only shows variables without auto-selecting them
        // Users can manually select the variables they want to include
    })


    onMount(() => {
        const results = sarimaxResults()
        
        if (results) {
            const tableData = convertSARIMAXToTableData(results)
            setKfgomData(tableData)
        } else {
            setKfgomData([])
            setFilteredData([])
        }

        const gridOptions = {
            columnDefs: [
                { field: 'id', headerName: 'ID', width: 60, sortable: true, filter: true },
                { 
                    field: 'jointId', 
                    headerName: 'Joint ID', 
                    width: 140, 
                    sortable: true, 
                    filter: true,
                    cellRenderer: jointIdCellRenderer,
                    checkboxSelection: true,
                    headerCheckboxSelection: true
                },
                { 
                    field: 'jointName', 
                    headerName: 'Joint Name', 
                    width: 120, 
                    sortable: true, 
                    filter: true,
                    cellRenderer: jointNameCellRenderer
                },
                { 
                    field: 'coefficient', 
                    headerName: 'Coefficient', 
                    width: 150, 
                    sortable: true, 
                    filter: true,
                    cellRenderer: coefficientCellRenderer
                },
                { 
                    field: 'pValue', 
                    headerName: 'P-Value', 
                    width: 120, 
                    sortable: true, 
                    filter: true,
                    cellRenderer: pValueCellRenderer
                },
                { 
                    field: 'significance', 
                    headerName: 'Significance', 
                    width: 120, 
                    sortable: true, 
                    filter: true,
                    cellRenderer: significanceCellRenderer
                }
            ],
            rowSelection: 'multiple' as const,
            rowMultiSelectWithClick: true,
            suppressRowClickSelection: true,
            rowData: filteredData(),
            defaultColDef: {
                resizable: true,
                sortable: true,
                filter: true,
                cellStyle: { fontSize: '11px' },
                headerClass: 'ag-header-cell-text'
            },
            suppressColumnVirtualisation: true,
            suppressRowVirtualisation: false,
            pagination: true,
            paginationPageSize: 200,
            paginationPageSizeSelector: [200],
            domLayout: 'normal' as const,
            onGridReady: (params) => {
                setGridApi(params.api)
                
                params.api.addEventListener('selectionChanged', () => {
                    // Don't process selection changes during data updates
                    if (isUpdatingData()) {
                        return
                    }
                    
                    const selectedRows = params.api.getSelectedRows()
                    const selectedJointIds = new Set(selectedRows.map(row => row.jointId))
                    setSelectedJoints(selectedJointIds)
                    
                    saveSelectedVariables()
                    
                    // Emit selection change event instead of global window pollution
                    emitSelectionChanged({
                        selectedJoints: Array.from(selectedJointIds),
                        totalSelected: getTotalSelectedCount(),
                        assumptionIndex: selectedAssumptionsIndex()
                    })
                })
            }
        }

        const gridDiv = document.getElementById('kfgom-table')
        if (gridDiv) {
            createGrid(gridDiv, gridOptions)
        }
    })



    return (
        <div class="plotTableContainer">
            {/* Table Info */}
                <div style={{
                padding: "10px",
                background: "#f8f9fa",
                            border: "1px solid #dee2e6",
                "border-radius": "4px",
                "font-size": "12px"
            }}>
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                    <div>
                        <strong>GOM Assumption:</strong> {(() => {
                            const index = selectedAssumptionsIndex()
                            if (index === 11) return 'All Assumptions Statistics'
                            if (index === 0) return 'GOM Overview'
                            if (index === 2) return 'Transitioning'
                            if (index === 4) return 'Intra-joint Association'
                            if (index === 6) return 'Inter-limb Synergy'
                            if (index === 8) return 'Serial Intra-limb Mediation'
                            if (index === 10) return 'Non-serial Intra-limb Mediation'
                            return 'Unknown'
                        })()}
                            </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <span>
                            <strong>Total Variables:</strong> {kfgomData().length}
                        </span>
                        <span>
                            <strong>Filtered:</strong> {filteredData().length}
                        </span>
                        <span>
                            <strong>Currently Selected:</strong> {selectedJoints().size}
                        </span>
                        <span>
                            <strong>Total Selected:</strong> {getTotalSelectedCount()}
                        </span>
                        {selectedJoints().size !== getTotalSelectedCount() && (
                            <span style={{ color: "#666", "font-size": "12px" }}>
                                ({getTotalSelectedCount() - selectedJoints().size} hidden by filter)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div id="kfgom-table" class="ag-theme-quartz" style={{ 
                width: "100%"
            }} />
        </div>
    )
} 