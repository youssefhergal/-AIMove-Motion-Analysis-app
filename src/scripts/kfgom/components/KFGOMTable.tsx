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

    // 🆕 PERSISTENT SELECTION: Map of assumption index -> array of selected variables
    // This gives us fast array lookups (your idea) + clear structure
    const [assumptionSelections, setAssumptionSelections] = createSignal(new Map())
    
    // 🆕 TRACK: Current assumption index for selection management
    const [currentAssumptionIndex, setCurrentAssumptionIndex] = createSignal(selectedAssumptionsIndex())

    // Filter data based on GOM assumptions first, then significance
    const filterDataByGOMAssumption = (data, assumptionIndex) => {
        let actualAssumptionIndex = 0
        
        if (assumptionIndex === 0) {
            actualAssumptionIndex = 0
        } else if (assumptionIndex === 2) {
            actualAssumptionIndex = 2
        } else if (assumptionIndex === 4) {
            actualAssumptionIndex = 3
        } else if (assumptionIndex === 6) {
            actualAssumptionIndex = 4
        } else if (assumptionIndex === 8) {
            actualAssumptionIndex = 5
        } else if (assumptionIndex === 10) {
            actualAssumptionIndex = 0
        } else if (assumptionIndex === 12) {
            actualAssumptionIndex = 0
        }
        
        if (actualAssumptionIndex === 0) {
            return data
        }
        
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
        
        return gomFiltered
    }

    // Filter data based on significance only
    const filterDataBySignificance = (data, significanceFilter) => {
        if (significanceFilter === 'all') {
            return data
        }
        
        const filtered = data.filter(item => {
            if (significanceFilter === 'significant') {
                return item.significance === '***' || item.significance === '**' || item.significance === '*'
            } else if (significanceFilter === 'non-significant') {
                return item.significance === '.' || item.significance === '~'
            }
            return true
        })
        
        return filtered
    }

    // 🆕 PERSISTENT SELECTION: Save current selections for current assumption
    const saveCurrentSelections = (assumptionIndex: number) => {
        const api = gridApi()
        if (!api) return
        
        const selectedRows = api.getSelectedRows()
        // 🎯 NEW: Save ROW IDs instead of joint names for universal compatibility
        const selectedRowIds = selectedRows.map(row => row.id) // Use row.id (1, 2, 3, 4...)
        
        // Only save if there are actual selections
        if (selectedRowIds.length > 0) {
            const currentSelections = new Map(assumptionSelections())
            currentSelections.set(assumptionIndex, selectedRowIds)
            setAssumptionSelections(currentSelections)
        }
    }

    // 🆕 PERSISTENT SELECTION: Restore selections for a specific assumption
    const restoreAssumptionSelections = (assumptionIndex: number) => {
        const api = gridApi()
        if (!api) return
        
        const savedSelections = assumptionSelections().get(assumptionIndex)
        if (!savedSelections || savedSelections.length === 0) {
            // No saved selections for this assumption, clear all
            api.deselectAll()
            setSelectedJoints(new Set())
            return
        }
        
        // 🎯 FAST ARRAY LOOKUP (your idea!) - O(1) array operations
        const allRows = api.getRenderedNodes()
        let restoredCount = 0
        
        allRows.forEach(node => {
            if (savedSelections.includes(node.data.id)) { // 🔥 Array.includes() - super fast!
                node.setSelected(true)
                restoredCount++
            } else {
                node.setSelected(false)
            }
        })
        
        // Force grid to update selection state
        api.refreshCells({ force: true })
        
        setSelectedJoints(new Set(savedSelections))
    }

    // 🆕 PERSISTENT SELECTION: Get combined selections from all assumptions
    const getCombinedAssumptionSelections = () => {
        const allSelections = new Set<number>() // 🎯 NEW: Use numbers for row IDs
        const currentSelections = assumptionSelections()
        
        currentSelections.forEach((selections, assumptionIndex) => {
            // 🎯 ARRAY ITERATION (your idea!) - fast and simple
            selections.forEach(rowId => allSelections.add(rowId))
        })
        
        return allSelections
    }

    // 🆕 PERSISTENT SELECTION: Apply combined selections for "All Assumptions" view
    const applyCombinedSelections = () => {
        const api = gridApi()
        if (!api) return
        
        const combinedSelections = getCombinedAssumptionSelections()
        
        if (combinedSelections.size === 0) {
            // No combined selections, clear all
            api.deselectAll()
            setSelectedJoints(new Set())
            return
        }
        
        // Apply combined selections
        const allRows = api.getRenderedNodes()
        let appliedCount = 0
        
        allRows.forEach(node => {
            if (combinedSelections.has(node.data.id)) { // Use node.data.id for exact match
                node.setSelected(true)
                appliedCount++
            } else {
                node.setSelected(false)
            }
        })
        
        // Force grid to update selection state
        api.refreshCells({ force: true })
        
        setSelectedJoints(combinedSelections)
    }

    // 🆕 PERSISTENT SELECTION: Get selection summary for display
    const getSelectionSummary = () => {
        const summary = []
        const assumptionNames = [
            'GOM Overview',
            'Transitioning',
            'Intra-joint Association',
            'Inter-limb Synergy',
            'Serial Intra-limb Mediation',
            'Non-serial Intra-limb Mediation',
            'All Assumptions Statistics'
        ]
        
        assumptionSelections().forEach((selections, assumptionIndex) => {
            if (selections.length > 0) { // 🎯 ARRAY LENGTH (your idea!)
                const name = assumptionNames[Math.floor(assumptionIndex / 2)] || `Assumption ${assumptionIndex}`
                summary.push(`${name}: ${selections.length} joints`)
            }
        })
        
        return summary
    }

    // 🆕 PERSISTENT SELECTION: Clear all saved selections
    const clearAllSelections = () => {
        setAssumptionSelections(new Map())
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

    // Cell renderer for joint ID (simplified - no custom checkboxes)
    const jointIdCellRenderer = (params) => {
        return `<span>${params.value}</span>`
    }

    // ✅ REMOVED: Custom checkbox handling - now using AG-Grid's built-in selection

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
                    // ✅ NEW: Add checkbox selection to Joint ID column
                    checkboxSelection: true,
                    headerCheckboxSelection: true,
                    headerCheckboxSelectionFilteredOnly: true
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
            // ✅ NEW: Enable AG-Grid's built-in multi-row selection with checkboxes
            rowSelection: 'multiple' as const,
            rowMultiSelectWithClick: true,
            suppressRowClickSelection: true,
            headerCheckboxSelection: true,
            headerCheckboxSelectionFilteredOnly: true,
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
                
                // ✅ NEW: Listen for AG-Grid's built-in selection changes
                params.api.addEventListener('selectionChanged', () => {
                    const selectedRows = params.api.getSelectedRows()
                    const selectedJointIds = new Set(selectedRows.map(row => row.jointId))
                    setSelectedJoints(selectedJointIds)
                    
                    // Update global selectedJoints for retraining
                    ;(window as any).selectedJoints = () => selectedJointIds
                })
            }
        }

        const gridDiv = document.getElementById('kfgom-table')
        if (gridDiv) {
            createGrid(gridDiv, gridOptions)
        }
    })

    // Update grid when data changes
    createEffect(() => {
        const data = filteredData()
        const api = gridApi()
        
        if (api && data) {
            api.setRowData(data)
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

    // 🆕 PERSISTENT SELECTION: Handle assumption changes and selection persistence
    createEffect(() => {
        const assumptionIndex = selectedAssumptionsIndex()
        const data = kfgomData()
        const filters = kfgomFilters()
        
        if (data && data.length > 0) {
            // Save selections for previous assumption before switching
            if (currentAssumptionIndex() !== assumptionIndex) {
                saveCurrentSelections(currentAssumptionIndex())
                setCurrentAssumptionIndex(assumptionIndex)
            }
            
            const gomFilteredData = filterDataByGOMAssumption(data, assumptionIndex)
            
            let finalFilteredData
            let selectedJointIds
            
            if (filters.significance === 'all') {
                finalFilteredData = gomFilteredData
                selectedJointIds = new Set()
            } else {
                finalFilteredData = filterDataBySignificance(gomFilteredData, filters.significance)
                selectedJointIds = new Set(finalFilteredData.map(item => item.jointId))
            }
            
            setFilteredData(finalFilteredData)
            
            const api = gridApi()
            if (api) {
                api.setGridOption('rowData', finalFilteredData)
                
                // 🆕 PERSISTENT SELECTION: Restore or apply selections based on assumption
                
                if (assumptionIndex === 11) { // 🎯 FIXED: "All Assumptions" is index 11, not 12
                    // "All Assumptions" view - show combined selections
                    setTimeout(() => applyCombinedSelections(), 100) // Small delay to ensure grid is ready
                } else {
                    // Specific assumption view - restore saved selections
                    setTimeout(() => restoreAssumptionSelections(assumptionIndex), 100) // Small delay to ensure grid is ready
                }
            }
        }
    })

    // ✅ REMOVED: Manual grid refresh - AG-Grid handles selection updates automatically
    // createEffect(() => {
    //     const api = gridApi()
    //     
    //     if (api) {
    //         api.refreshCells({ force: true })
    //     }
    // })

    return (
        <div class="plotTableContainer">
            {/* Basic Table Info */}
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
                                const assumptionNames = [
                                    'GOM Overview',
                                    'Transitioning',
                                    'Intra-joint Association',
                                    'Inter-limb Synergy',
                                    'Serial Intra-limb Mediation',
                                    'Non-serial Intra-limb Mediation',
                                    'All Assumptions Statistics'
                                ]
                                const index = selectedAssumptionsIndex()
                                return assumptionNames[Math.floor(index / 2)] || 'Unknown'
                            })()}
                        </div>
                        <div>
                            🎯 <strong>Selection Persistence Active:</strong> Your selections are automatically saved and restored when switching between assumptions.
                            {currentAssumptionIndex() === 11 && ' Viewing combined selections from all assumptions.'}
                        </div>
                    </div>
                )}
            </div>

            <div id="kfgom-table" class="ag-theme-quartz" />
        </div>
    )
} 