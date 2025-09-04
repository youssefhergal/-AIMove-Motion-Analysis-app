import { createSignal, onMount, createEffect } from 'solid-js'
import { createGrid } from 'ag-grid-community'
import { sarimaxResults, sarimaxConfig, kfgomFilters, selectedAssumptionsIndex } from '../../store.js'
import { gomSelector } from '../utils/gomVariableSelector'

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

    // Map to store selected variables (Joint Name -> true)
    const [selectedVariablesMap, setSelectedVariablesMap] = createSignal(new Map())
    
    // Flag to prevent selection events during data updates
    const [isUpdatingData, setIsUpdatingData] = createSignal(false)

    // Save selected variables by joint name
    const saveSelectedVariables = () => {
        const api = gridApi()
        if (!api) return
        
        const selectedRows = api.getSelectedRows()
        const currentMap = new Map(selectedVariablesMap())
        
        selectedRows.forEach(row => {
            currentMap.set(row.jointId, true)
        })
        
        setSelectedVariablesMap(currentMap)
    }

    // Apply selections from the map
    const applySelectionsFromMap = () => {
        const api = gridApi()
        if (!api) return
        
        const currentMap = selectedVariablesMap()
        const totalRows = api.getDisplayedRowCount()
        
        console.log('🎯 Applying selections:', {
            totalRows,
            savedSelections: currentMap.size,
            savedJointNames: Array.from(currentMap.keys())
        })
        
        api.deselectAll()
        
        // Track which joints are actually selected in the current filtered view
        const actuallySelectedJoints = new Set()
        
        for (let i = 0; i < totalRows; i++) {
            const rowNode = api.getDisplayedRowAtIndex(i)
            if (rowNode && rowNode.data) {
                const jointName = rowNode.data.jointId
                if (currentMap.has(jointName)) {
                    rowNode.setSelected(true)
                    actuallySelectedJoints.add(jointName)
                    console.log(`✅ Selected row ${i}: ${jointName}`)
                }
            } else {
                console.log(`❌ Row ${i} not found or no data`)
            }
        }
        
        console.log('✅ Applied selections:', {
            actuallySelected: actuallySelectedJoints.size,
            actuallySelectedJoints: Array.from(actuallySelectedJoints)
        })
        
        api.refreshCells({ force: true })
        // Update selectedJoints to only show joints that are actually selected in current view
        setSelectedJoints(actuallySelectedJoints)
    }

    // Get total selected count
    const getTotalSelectedCount = () => {
        return selectedVariablesMap().size
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
        
        const selectedJointNames = gomSelector.selectVariablesByAssumption(jointNames, actualAssumptionIndex, targetCombined)
        const gomFiltered = data.filter(item => selectedJointNames.includes(item.jointId))
        
        console.log(`🔍 GOM Filter Debug - Tab ${assumptionIndex} (Assumption ${actualAssumptionIndex}):`, {
            targetJoint: targetCombined,
            totalJoints: jointNames.length,
            selectedJoints: selectedJointNames.length,
            filteredData: gomFiltered.length,
            sampleSelected: selectedJointNames.slice(0, 5)
        })
        
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
        setSelectedVariablesMap(new Map())
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

    // Cell renderer for significance with color coding
    const significanceCellRenderer = (params) => {
        const isSignificant = params.value === '***' || params.value === '**' || params.value === '*'
        const color = isSignificant ? '#4CAF50' : '#F44336'
        const backgroundColor = isSignificant ? '#E8F5E8' : '#FFEBEE'
        return `<span style="color: ${color}; font-weight: bold; background-color: ${backgroundColor}; padding: 2px 6px; border-radius: 3px;">${params.value}</span>`
    }

    // Cell renderer for joint ID with built-in checkbox selection
    const jointIdCellRenderer = (params) => {
        return `<span>${params.value}</span>`
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
            
            // Reset selections
            setSelectedVariablesMap(new Map())
            
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
                console.log('🔄 Reapplying selections after filter change')
                applySelectionsFromMap()
                
                // Re-enable selection events
                setIsUpdatingData(false)
            }, 200) // Increased timeout to ensure grid is fully updated
        }
    })

    // Update grid when data changes
    createEffect(() => {
        const data = filteredData()
        const api = gridApi()
        
        if (api && data) {
            // Set flag to prevent selection events during update
            setIsUpdatingData(true)
            
            api.setGridOption('rowData', data)
            
            // Wait for grid to update, then apply selections
            setTimeout(() => {
                console.log('🔄 Reapplying selections after data change')
                applySelectionsFromMap()
                
                // Re-enable selection events
                setIsUpdatingData(false)
            }, 200)
        }
    })

    // Update data when SARIMAX results change
    createEffect(() => {
        const results = sarimaxResults()
        
        if (results) {
            const tableData = convertSARIMAXToTableData(results)
            setKfgomData(tableData)
        } else {
            setKfgomData([])
        }
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
                { field: 'id', headerName: 'ID', width: 80, sortable: true, filter: true },
                { 
                    field: 'jointId', 
                    headerName: 'Joint ID', 
                    width: 220, 
                    sortable: true, 
                    filter: true,
                    cellRenderer: jointIdCellRenderer,
                    checkboxSelection: true,
                    headerCheckboxSelection: true
                },
                { field: 'jointName', headerName: 'Joint Name', width: 200, sortable: true, filter: true },
                { field: 'coefficient', headerName: 'Coefficient', width: 150, sortable: true, filter: true },
                { field: 'pValue', headerName: 'P-Value', width: 120, sortable: true, filter: true },
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
                filter: true
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
                        console.log('⏸️ Skipping selection change during data update')
                        return
                    }
                    
                    const selectedRows = params.api.getSelectedRows()
                    const selectedJointIds = new Set(selectedRows.map(row => row.jointId))
                    setSelectedJoints(selectedJointIds)
                    
                    saveSelectedVariables()
                    
                    ;(window as any).selectedJoints = () => selectedJointIds
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
                margin: "10px 0",
                background: "#f8f9fa",
                border: "1px solid #dee2e6",
                "border-radius": "4px",
                "font-size": "14px"
            }}>
                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                    <div>
                        <strong>Table Info:</strong> Variables from SARIMAX Analysis
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
                {filteredData().length > 0 && (
                    <div style={{ 
                        "margin-top": "8px", 
                        "font-size": "12px", 
                        color: "#666",
                        "font-style": "italic"
                    }}>
                        <div style={{ "margin-bottom": "4px" }}>
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
                        <div>
                            🎯 <strong>Selection Persistence Active:</strong> Your selections are automatically saved and restored when switching between assumptions.
                            {selectedAssumptionsIndex() === 11 && ' Viewing combined selections from all assumptions.'}
                        </div>
                    </div>
                )}
            </div>

            <div id="kfgom-table" class="ag-theme-quartz" style={{ 
                height: "500px", 
                width: "100%"
            }} />
        </div>
    )
} 