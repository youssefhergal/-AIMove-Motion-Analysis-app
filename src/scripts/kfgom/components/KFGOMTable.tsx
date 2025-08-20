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
 * 
 * @author youssef hergal
 */
export default function KFGOMTable() {
    const [kfgomData, setKfgomData] = createSignal([])
    const [filteredData, setFilteredData] = createSignal([])
    const [gridApi, setGridApi] = createSignal(null)
    const [selectedJoints, setSelectedJoints] = createSignal(new Set())

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
        
        console.log('🔍 GOM Filter Applied:', {
            assumption: assumptionIndex,
            target: targetCombined,
            original: data.length,
            filtered: gomFiltered.length
        })
        
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
        
        console.log('🔍 Significance Filter Applied:', {
            filter: significanceFilter,
            original: data.length,
            filtered: filtered.length
        })
        
        return filtered
    }

    // Convert SARIMAX results to table data format
    const convertSARIMAXToTableData = (results) => {
        if (!results || !results.modelSummary || !results.modelSummary.variables) {
            console.warn('⚠️ No model summary variables found')
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
                    
                    console.log('🔍 AG-Grid Selection Changed:', {
                        selectedCount: selectedJointIds.size,
                        totalRows: params.api.getDisplayedRowCount()
                    })
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
            console.log('📊 SARIMAX Results Loaded:', {
                target: `${results.targetJoint}_${results.targetAxis}`,
                variables: tableData.length
            })
        } else {
            setKfgomData([])
        }
    })

    // Apply GOM assumption and significance filters when data, filters, or assumption changes
    createEffect(() => {
        const data = kfgomData()
        const filters = kfgomFilters()
        const assumptionIndex = selectedAssumptionsIndex()
        
        if (data && data.length > 0) {
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
            setSelectedJoints(selectedJointIds)
            
            const api = gridApi()
            if (api) {
                api.setGridOption('rowData', finalFilteredData)
                console.log('🔄 Table Updated:', {
                    assumption: assumptionIndex,
                    significance: filters.significance,
                    total: data.length,
                    filtered: finalFilteredData.length,
                    selected: selectedJointIds.size
                })
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
                            Use significance filter to show specific variables. Click "Retrain" to use selected variables.
                        </div>
                    </div>
                )}
            </div>

            <div id="kfgom-table" class="ag-theme-quartz" />
        </div>
    )
} 