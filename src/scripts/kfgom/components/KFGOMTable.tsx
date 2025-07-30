import { createSignal, onMount, createEffect } from 'solid-js'
import { createGrid } from 'ag-grid-community'
import { sarimaxResults, sarimaxConfig } from '../../store.js'
import { myScene } from '../../myScene.js'

export default function KFGOMTable() {
    const [kfgomData, setKfgomData] = createSignal([])
    const [filteredData, setFilteredData] = createSignal([])
    const [gridApi, setGridApi] = createSignal(null)
    const [selectedJoints, setSelectedJoints] = createSignal(new Set())

    // Convert SARIMAX results to table data format
    const convertSARIMAXToTableData = (results) => { // added by youssef hergal
        console.log('🔍 Converting SARIMAX results to table data:', { // added by youssef hergal
            hasResults: !!results,
            hasModelSummary: !!results?.modelSummary,
            hasVariables: !!results?.modelSummary?.variables,
            variablesLength: results?.modelSummary?.variables?.length || 0,
            sampleVariable: results?.modelSummary?.variables?.[0]
        })
        
        if (!results || !results.modelSummary || !results.modelSummary.variables) {
            console.warn('⚠️ Missing data for table conversion') // added by youssef hergal
            return []
        }

        const tableData = results.modelSummary.variables.map((variable, index) => ({ // added by youssef hergal
            id: index + 1,
            jointId: variable.variable,
            jointName: variable.variable,
            coefficient: variable.coefficient.toFixed(6),
            pValue: variable.pValue.toFixed(6),
            significance: variable.significance,
            selected: false // added by youssef hergal
        }))
        
        console.log('✅ Table data converted:', { // added by youssef hergal
            tableDataLength: tableData.length,
            sampleRow: tableData[0]
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
            console.log('🔍 Selected joints:', Array.from(newSet))
        }
    }

    onMount(() => { // added by youssef hergal
        console.log('🔧 KFGOMTable component mounted') // added by youssef hergal
        
        // Initialize with SARIMAX results if available, otherwise empty array
        const results = sarimaxResults()
        console.log('📊 Initial SARIMAX results on mount:', { // added by youssef hergal
            hasResults: !!results,
            resultsKeys: results ? Object.keys(results) : []
        })
        
        if (results) {
            const tableData = convertSARIMAXToTableData(results)
            setKfgomData(tableData)
            setFilteredData(tableData)
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
    createEffect(() => { // added by youssef hergal
        const data = filteredData()
        const api = gridApi()
        console.log('🔄 Grid data update:', { // added by youssef hergal
            hasData: !!data,
            dataLength: data?.length || 0,
            hasApi: !!api
        })
        
        if (api && data) {
            api.setRowData(data)
            console.log('✅ Grid updated with data') // added by youssef hergal
        }
    })

    // Update data when SARIMAX results change
    createEffect(() => { // added by youssef hergal
        const results = sarimaxResults()
        console.log('🔄 SARIMAX results changed:', { // added by youssef hergal
            hasResults: !!results,
            resultsKeys: results ? Object.keys(results) : []
        })
        
        if (results) {
            const tableData = convertSARIMAXToTableData(results)
            console.log('📊 Setting table data:', { // added by youssef hergal
                tableDataLength: tableData.length,
                kfgomDataLength: kfgomData().length
            })
            setKfgomData(tableData)
            setFilteredData(tableData)
        }
    })

    return (
        <div class="plotTableContainer">
            <div id="kfgom-table" class="ag-theme-quartz"></div>
            
            {kfgomData().length === 0 && (
                <div class="no-data">
                    <p>
                        {myScene.globalResult && myScene.globalResult.bvhBones ? 
                            "Loading KF-GOM analysis results..." : 
                            "No BVH file loaded. Please upload a BVH file first to run KF-GOM analysis."
                        }
                    </p>
                </div>
            )}
        </div>
    )
} 