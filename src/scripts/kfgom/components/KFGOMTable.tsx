import { createSignal, onMount, createEffect } from 'solid-js'
import { createGrid } from 'ag-grid-community'
import { sarimaxResults, sarimaxConfig, kfgomFilters, setKfgomFilters } from '../../store.js'
import { myScene } from '../../myScene.js'

export default function KFGOMTable() {
    const [kfgomData, setKfgomData] = createSignal([])
    const [filteredData, setFilteredData] = createSignal([])
    const [gridApi, setGridApi] = createSignal(null)
    const [selectedJoints, setSelectedJoints] = createSignal(new Set())

    // Filter data based on significance
    const filterDataBySignificance = (data, significanceFilter) => {
        if (significanceFilter === 'all') {
            return data
        }
        
        const filtered = data.filter(item => {
            // Include variables with any significance level (including marginal '~')
            const isSignificant = item.significance === '***' || item.significance === '**' || item.significance === '*' || item.significance === '.' || item.significance === '~'
            const shouldInclude = significanceFilter === 'significant' ? isSignificant : !isSignificant
            return shouldInclude
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
        
        if (data && data.length > 0) {
            // Always show all data in the table
            setFilteredData(data)
            
            // But only select variables based on significance filter
            if (filters.significance === 'all') {
                // Select all variables
                const allJointIds = data.map(item => item.jointId)
                setSelectedJoints(new Set(allJointIds))
                console.log('🔍 Auto-selected all variables for retraining:', allJointIds.length)
            } else {
                // Select only significant or non-significant variables
                const filtered = filterDataBySignificance(data, filters.significance)
                const filteredJointIds = filtered.map(item => item.jointId)
                setSelectedJoints(new Set(filteredJointIds))
                console.log('🔍 Auto-selected filtered variables for retraining:', filteredJointIds.length)
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

    return (
        <div class="plotTableContainer">
            <div id="kfgom-table" class="ag-theme-quartz"></div>
            
            {kfgomData().length === 0 && (
                <div class="no-data">
                    <p>
                        No training file selected. Please select a training file first to run KF-GOM analysis.
                    </p>
                </div>
            )}

            {/* Metrics Display */}
            {getMetrics() && (
                <div style={{
                    "margin-top": "20px",
                    padding: "15px",
                    "background-color": "#f8f9fa",
                    "border-radius": "8px",
                    border: "1px solid #e9ecef"
                }}>
                    <h4 style={{
                        margin: "0 0 15px 0",
                        color: "#495057",
                        "font-size": "16px",
                        "font-weight": "600"
                    }}>
                        Model Performance Metrics
                    </h4>
                    
                    <div style={{
                        display: "grid",
                        "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "15px"
                    }}>
                        <div style={{
                            padding: "12px",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6",
                            textAlign: "center"
                        }}>
                            <div style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginBottom: "5px"
                            }}>
                                Mean Squared Error (MSE)
                            </div>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#495057"
                            }}>
                                {getMetrics().mse?.toFixed(6) || "N/A"}
                            </div>
                        </div>

                        <div style={{
                            padding: "12px",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6",
                            textAlign: "center"
                        }}>
                            <div style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginBottom: "5px"
                            }}>
                                Mean Absolute Error (MAE)
                            </div>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#495057"
                            }}>
                                {getMetrics().mae?.toFixed(6) || "N/A"}
                            </div>
                        </div>

                        <div style={{
                            padding: "12px",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6",
                            textAlign: "center"
                        }}>
                            <div style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginBottom: "5px"
                            }}>
                                Correlation Coefficient
                            </div>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#495057"
                            }}>
                                {getMetrics().correlation?.toFixed(6) || "N/A"}
                            </div>
                        </div>

                        <div style={{
                            padding: "12px",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6",
                            textAlign: "center"
                        }}>
                            <div style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginBottom: "5px"
                            }}>
                                R-squared (R²)
                            </div>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#495057"
                            }}>
                                {getMetrics().r2?.toFixed(6) || "N/A"}
                            </div>
                        </div>

                        <div style={{
                            padding: "12px",
                            backgroundColor: "#fff",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6",
                            textAlign: "center"
                        }}>
                            <div style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginBottom: "5px"
                            }}>
                                Theil's U Statistic
                            </div>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#495057"
                            }}>
                                {getMetrics().utheil?.toFixed(6) || "N/A"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 