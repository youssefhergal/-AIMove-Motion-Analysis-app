import { createSignal, onMount, createEffect } from 'solid-js'
import { createGrid } from 'ag-grid-community'
import { sarimaxResults, sarimaxConfig, kfgomFilters, setKfgomFilters, selectedAssumptionsIndex } from '../../store.js'
import { myScene } from '../../myScene.js'
import { selectGOMVariablesByAssumption, getGOMSummary } from '../utils/gomVariableSelector.js'

export default function KFGOMTable() {
    const [kfgomData, setKfgomData] = createSignal([])
    const [filteredData, setFilteredData] = createSignal([])
    const [gridApi, setGridApi] = createSignal(null)
    const [selectedJoints, setSelectedJoints] = createSignal(new Set())
    const [gomFilteredData, setGomFilteredData] = createSignal([]) // New: GOM filtered data
    const [gomSummary, setGomSummary] = createSignal({}) // New: GOM summary statistics

    // Filter data based on significance
    const filterDataBySignificance = (data, significanceFilter) => {
        console.log('🔍 filterDataBySignificance called with:', { significanceFilter, dataLength: data.length })
        
        if (significanceFilter === 'all') {
            console.log('🔍 Returning all data:', data.length)
            return data
        }
        
        // Count significance levels for debugging
        const significanceCounts = {
            '***': data.filter(item => item.significance === '***').length,
            '**': data.filter(item => item.significance === '**').length,
            '*': data.filter(item => item.significance === '*').length,
            '.': data.filter(item => item.significance === '.').length,
            '~': data.filter(item => item.significance === '~').length,
            'empty': data.filter(item => item.significance === '' || item.significance === undefined).length
        }
        console.log('🔍 Significance distribution:', significanceCounts)
        
        const filtered = data.filter(item => {
            // Define what constitutes "significant" (including marginal significance)
            const isSignificant = item.significance === '***' || item.significance === '**' || item.significance === '*' || item.significance === '.' || item.significance === '~'
            
            if (significanceFilter === 'significant') {
                return isSignificant // Return only significant variables
            } else if (significanceFilter === 'non-significant') {
                return !isSignificant // Return only non-significant variables
            }
            
            return false // Should never reach here
        })
        
        console.log('🔍 Filter result:', { 
            filterType: significanceFilter, 
            originalCount: data.length, 
            filteredCount: filtered.length,
            sampleFiltered: filtered.slice(0, 3).map(v => ({ jointId: v.jointId, significance: v.significance }))
        })
        
        return filtered
    }

    // NEW: Filter data based on GOM assumptions
    const filterDataByGOMAssumption = (data, assumptionIndex) => {
        if (!data || data.length === 0) {
            console.log('🔍 No data to filter by GOM assumption')
            return []
        }

        // Extract channel names from the data
        const channels = data.map(item => item.jointId)
        
        // Get GOM filtered channels
        const gomFilteredChannels = selectGOMVariablesByAssumption(channels, assumptionIndex)
        
        // Filter the data to only include GOM-selected variables
        const filtered = data.filter(item => gomFilteredChannels.includes(item.jointId))
        
        console.log('🔍 GOM assumption filter result:', {
            assumptionIndex,
            originalCount: data.length,
            gomFilteredCount: gomFilteredChannels.length,
            finalFilteredCount: filtered.length,
            sampleFiltered: filtered.slice(0, 3).map(v => v.jointId)
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
            if (checked) {
                newSet.add(jointId)
            } else {
                newSet.delete(jointId)
            }
            setSelectedJoints(newSet)
            console.log('🔍 Joint selection updated:', { jointId, checked, selectedCount: newSet.size })
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
        console.log('🔄 SARIMAX results changed in table:', {
            hasResults: !!results,
            resultsKeys: results ? Object.keys(results) : [],
            hasModelSummary: !!results?.modelSummary,
            modelSummaryKeys: results?.modelSummary ? Object.keys(results.modelSummary) : []
        })
        
        if (results) {
            const tableData = convertSARIMAXToTableData(results)
            setKfgomData(tableData)
            console.log('📊 Table data updated:', {
                tableDataLength: tableData.length,
                sampleData: tableData.slice(0, 3)
            })
            // Don't set filtered data here - let the filter effect handle it
        } else {
            console.log('⚠️ No SARIMAX results available for table')
            setKfgomData([])
        }
    })

    // Apply significance filter when data or filter changes
    createEffect(() => {
        const data = kfgomData()
        const filters = kfgomFilters()
        const assumptionIndex = selectedAssumptionsIndex()
        
        if (data && data.length > 0) {
            // Step 1: Apply GOM assumption filter first
            let gomFiltered = data
            if (assumptionIndex !== null && assumptionIndex !== 2) { // Skip if "All assumptions statistics"
                gomFiltered = filterDataByGOMAssumption(data, assumptionIndex)
                console.log('🔍 GOM assumption filter applied:', {
                    assumptionIndex,
                    originalCount: data.length,
                    gomFilteredCount: gomFiltered.length
                })
            }
            
            // Step 2: Apply significance filter on top of GOM filtered data
            if (filters.significance === 'all') {
                // Show all GOM-filtered variables but don't select any
                setFilteredData(gomFiltered)
                setSelectedJoints(new Set()) // No variables selected
                console.log('🔍 Showing all GOM-filtered variables with no selection')
            } else {
                // Show only significant/non-significant variables from GOM-filtered data
                const filtered = filterDataBySignificance(gomFiltered, filters.significance)
                setFilteredData(filtered) // Only show filtered variables
                const filteredJointIds = filtered.map(item => item.jointId)
                setSelectedJoints(new Set(filteredJointIds)) // Select all filtered variables
                console.log('🔍 Showing GOM + significance filtered variables with all selected:', {
                    assumptionIndex,
                    filterType: filters.significance,
                    gomFilteredCount: gomFiltered.length,
                    finalFilteredCount: filtered.length,
                    selectedCount: filteredJointIds.length
                })
            }
            
            // Note: Filter changes don't auto-retrain - user must click "Retrain" button
            console.log('ℹ️ Variables filtered by GOM + significance. Click "Retrain" to apply changes.')
        }
    })

    // Refresh grid cells when selection changes
    createEffect(() => {
        const selected = selectedJoints()
        const api = gridApi()
        
        if (api) {
            // Force refresh of all cells to update checkboxes
            api.refreshCells({ force: true })
            console.log('🔄 Grid cells refreshed due to selection change:', selected.size)
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

    // Get current assumption name for display
    const getCurrentAssumptionName = () => {
        const assumptionIndex = selectedAssumptionsIndex()
        const assumptionNames = [
            'GOM',
            '=',
            'Transitioning', 
            '+',
            'Intra-joint association',
            '+',
            'Inter-limb synergy',
            '+',
            'Serial intra-limb mediation',
            '+',
            'Non-serial intra-limb mediation',
            'All assumptions statistics'
        ]
        return assumptionNames[assumptionIndex] || 'Unknown'
    }

    return (
        <div class="plotTableContainer">
            {/* GOM Status Display */}
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
                        <strong>GOM Assumption:</strong> {getCurrentAssumptionName()}
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                        <span>
                            <strong>Total Variables:</strong> {kfgomData().length}
                        </span>
                        <span>
                            <strong>GOM Filtered:</strong> {gomFilteredData().length}
                        </span>
                        <span>
                            <strong>Currently Selected:</strong> {selectedJoints().size}
                        </span>
                    </div>
                </div>
                {gomFilteredData().length > 0 && (
                    <div style={{ 
                        "margin-top": "8px", 
                        "font-size": "12px", 
                        color: "#666",
                        "font-style": "italic"
                    }}>
                        💡 Variables automatically filtered by GOM assumption. Click "Retrain" to use selected variables.
                    </div>
                )}
            </div>

            <div id="kfgom-table" class="ag-theme-quartz"></div>
            


            {/* Metrics Display */}
        </div>
    )
} 