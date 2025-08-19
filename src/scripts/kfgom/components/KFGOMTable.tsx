import { createSignal, onMount, createEffect } from 'solid-js'
import { createGrid } from 'ag-grid-community'
import { sarimaxResults, sarimaxConfig, kfgomFilters, setKfgomFilters, selectedAssumptionsIndex } from '../../store.js'
import { myScene } from '../../myScene.js'
import { gomSelector } from '../utils/gomVariableSelector'

export default function KFGOMTable() {
    const [kfgomData, setKfgomData] = createSignal([])
    const [filteredData, setFilteredData] = createSignal([])
    const [gridApi, setGridApi] = createSignal(null)
    const [selectedJoints, setSelectedJoints] = createSignal(new Set())

    // Filter data based on GOM assumptions first, then significance
    const filterDataByGOMAssumption = (data, assumptionIndex) => {
        // Map GOM tab indices to actual assumption indices
        // GOM tabs: 0="GOM", 2="Transitioning", 4="Intra-joint association", etc.
        let actualAssumptionIndex = 0
        
        if (assumptionIndex === 0) {
            // "GOM" tab - show all joints
            actualAssumptionIndex = 0
        } else if (assumptionIndex === 2) {
            // "Transitioning" tab - apply transitioning filtering
            actualAssumptionIndex = 2
        } else if (assumptionIndex === 4) {
            // "Intra-joint association" tab - apply bilateral filtering
            actualAssumptionIndex = 3 // Bilateral (left + right, no center)
        		} else if (assumptionIndex === 6) {
			// "Inter-limb synergy" tab - apply inter-limb synergies filtering
			actualAssumptionIndex = 4
        } else if (assumptionIndex === 8) {
            // "Serial intra-limb mediation" tab - show all joints for now
            actualAssumptionIndex = 0
        } else if (assumptionIndex === 10) {
            // "Non-serial intra-limb mediation" tab - show all joints for now
            actualAssumptionIndex = 0
        } else if (assumptionIndex === 12) {
            // "All assumptions statistics" tab - show all joints
            actualAssumptionIndex = 0
        }
        
        if (actualAssumptionIndex === 0) {
            // All joints - no filtering needed
            return data
        }
        
        // Extract joint names from the data
        const jointNames = data.map(item => item.jointId)
        
        // Apply GOM assumption filtering (combine target joint + axis for Transitioning)
        // Use the actual SARIMAX results to get the current target, not the config
        const results = sarimaxResults()
        let targetCombined = 'Hips_Xrotation' // fallback
        
        if (results && results.targetJoint && results.targetAxis) {
            targetCombined = `${results.targetJoint}_${results.targetAxis}`
        } else {
            const cfg = sarimaxConfig()
            targetCombined = cfg ? `${cfg.targetJoint}_${cfg.targetAxis}` : 'Hips_Xrotation'
        }
        
        const selectedJointNames = gomSelector.selectVariablesByAssumption(jointNames, actualAssumptionIndex, targetCombined)
        
        // Filter the data to only include selected joints
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
        
        // Filter by significance level
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
        console.log('🔍 Converting SARIMAX results to table data:', {
            hasResults: !!results,
            hasModelSummary: !!results?.modelSummary,
            hasVariables: !!results?.modelSummary?.variables,
            variablesLength: results?.modelSummary?.variables?.length || 0,
            sampleVariables: results?.modelSummary?.variables?.slice(0, 3) || []
        })
        
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
        
        // Log p-value distribution for debugging
        const pValueRanges = {
            'p < 0.001': tableData.filter(v => v.pValue < 0.001).length,
            'p < 0.01': tableData.filter(v => v.pValue < 0.01).length,
            'p < 0.05': tableData.filter(v => v.pValue < 0.05).length,
            'p < 0.1': tableData.filter(v => v.pValue < 0.1).length,
            'p < 0.2': tableData.filter(v => v.pValue < 0.2).length,
            'p >= 0.2': tableData.filter(v => v.pValue >= 0.2).length
        }
        console.log('📊 P-value distribution:', pValueRanges)
        
        console.log('✅ Converted table data:', {
            tableDataLength: tableData.length,
            sampleTableData: tableData.slice(0, 3)
        })
        
        return tableData
    }

    // Cell renderer for significance with color coding
    const significanceCellRenderer = (params) => {
        const isSignificant = params.value === '***' || params.value === '**' || params.value === '*'
        const color = isSignificant ? '#4CAF50' : '#F44336' // Green for significant, Red for not significant
        const backgroundColor = isSignificant ? '#E8F5E8' : '#FFEBEE' // Light green/red background
        return `<span style="color: ${color}; font-weight: bold; background-color: ${backgroundColor}; padding: 2px 6px; border-radius: 3px;">${params.value}</span>`
    }

    // Cell renderer for joint ID with checkbox
    const jointIdCellRenderer = (params) => {
        // Check if this joint is in the selectedJoints Set
        const isSelected = selectedJoints().has(params.data.jointId)
        const checked = isSelected ? 'checked' : ''
        
        return `<div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" ${checked} onchange="window.toggleJointSelection('${params.data.jointId}', this.checked)" style="margin: 0;" />
            <span>${params.value}</span>
        </div>`
    }

    // Add global function for checkbox handling
    if (typeof window !== 'undefined') {
        (window as any).toggleJointSelection = (jointId: string, checked: boolean) => {
            const current = selectedJoints()
            const newSet = new Set(current)
            // Update selectedJoints state
            if (checked) {
                newSet.add(jointId)
            } else {
                newSet.delete(jointId)
            }
            setSelectedJoints(newSet)
            
            // Expose selectedJoints globally for retraining
            ;(window as any).selectedJoints = () => newSet
            
            console.log('🔍 Variable Selection:', { 
                jointId, 
                action: checked ? 'selected' : 'deselected', 
                totalSelected: newSet.size 
            })
        }
        
        // Expose selectedJoints globally for retraining
        (window as any).selectedJoints = selectedJoints
    }

    onMount(() => {
        // Initialize with SARIMAX results if available, otherwise empty array
        const results = sarimaxResults()
        
        if (results) {
            const tableData = convertSARIMAXToTableData(results)
            setKfgomData(tableData)
            // Don't set filtered data here - let the filter effect handle it
        } else {
            setKfgomData([])
            setFilteredData([])
        }

        // Create AG-Grid
        const gridOptions = {
            columnDefs: [
                { field: 'id', headerName: 'ID', width: 80, sortable: true, filter: true },
                { 
                    field: 'jointId', 
                    headerName: 'Joint ID', 
                    width: 220, 
                    sortable: true, 
                    filter: true,
                    cellRenderer: jointIdCellRenderer
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
            }
        }

        const gridDiv = document.getElementById('kfgom-table')
        if (gridDiv) {
            const grid = createGrid(gridDiv, gridOptions)
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
            // Step 1: Apply GOM assumption filtering
            const gomFilteredData = filterDataByGOMAssumption(data, assumptionIndex)
            
            // Step 2: Apply significance filter on top of GOM filtered data
            let finalFilteredData
            let selectedJointIds
            
            if (filters.significance === 'all') {
                // Show all variables after GOM filter but don't select any
                finalFilteredData = gomFilteredData
                selectedJointIds = new Set() // No variables selected
            } else {
                // Show only significant/non-significant variables from GOM filtered data
                finalFilteredData = filterDataBySignificance(gomFilteredData, filters.significance)
                selectedJointIds = new Set(finalFilteredData.map(item => item.jointId))
            }
            
            // Set the final filtered data and selected joints
            setFilteredData(finalFilteredData)
            setSelectedJoints(selectedJointIds)
            
            // Update the AG-Grid with the new filtered data
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

    // Refresh grid cells when selection changes
    createEffect(() => {
        const selected = selectedJoints()
        const api = gridApi()
        
        if (api) {
            // Force refresh of all cells to update checkboxes
            api.refreshCells({ force: true })
        }
    })

    // Extract metrics from SARIMAX results
    const getMetrics = () => {
        const results = sarimaxResults()
        if (!results || !results.metrics) {
            return null
        }
        return results.metrics
    }

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

            <div id="kfgom-table" class="ag-theme-quartz"></div>
            


            {/* Metrics Display */}
        </div>
    )
} 