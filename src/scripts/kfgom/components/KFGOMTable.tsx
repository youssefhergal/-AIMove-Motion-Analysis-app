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
            const isSignificant = item.significance === '***' || item.significance === '**' || item.significance === '*'
            const shouldInclude = significanceFilter === 'significant' ? isSignificant : !isSignificant
            return shouldInclude
        })
        
        return filtered
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
        const color = isSignificant ? '#4CAF50' : '#F44336' // Green for significant, Red for not significant
        const backgroundColor = isSignificant ? '#E8F5E8' : '#FFEBEE' // Light green/red background
        return `<span style="color: ${color}; font-weight: bold; background-color: ${backgroundColor}; padding: 2px 6px; border-radius: 3px;">${params.value}</span>`
    }

    // Cell renderer for joint ID with checkbox
    const jointIdCellRenderer = (params) => {
        const checked = params.data.selected ? 'checked' : ''
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

        }
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
            // Don't set filtered data here - let the filter effect handle it
        }
    })

    // Apply significance filter when data or filter changes
    createEffect(() => {
        const data = kfgomData()
        const filters = kfgomFilters()
        
        if (data && data.length > 0) {
            const filtered = filterDataBySignificance(data, filters.significance)
            setFilteredData(filtered)
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