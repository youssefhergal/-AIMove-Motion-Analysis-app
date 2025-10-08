# Variable Selection Feature Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Data Flow](#data-flow)
5. [Installation & Setup](#installation--setup)
6. [Usage Guide](#usage-guide)
7. [API Reference](#api-reference)
8. [Code Examples](#code-examples)
9. [Troubleshooting](#troubleshooting)
10. [Developer Notes](#developer-notes)

---

## Overview

The Variable Selection feature is a sophisticated system that allows users to interactively select specific variables from SARIMAX analysis results and retrain machine learning models using only those selected variables. This feature integrates seamlessly with GOM (Gesture Operational Model) assumptions and significance filtering to provide intelligent variable selection capabilities.

### Key Features
- **Interactive variable selection** with checkboxes in data tables
- **GOM assumption filtering** based on biomechanical principles
- **Significance level filtering** for statistical relevance
- **Model retraining** with selected variables only
- **Real-time feedback** and validation
- **Error handling** with user-friendly messages

### Technical Stack
- **Frontend**: Solid.js with TypeScript
- **Data Grid**: AG-Grid for interactive tables
- **State Management**: Solid.js signals
- **Data Processing**: SARIMAX analysis integration
- **UI Components**: Custom checkboxes and filters

---

## Architecture

The Variable Selection system follows a modular architecture with clear separation of concerns:

```
VariableSelection/
├── components/                    # UI Components
│   ├── KFGOMAnalysis.tsx         # Main analysis controller
│   ├── KFGOMTable.tsx            # Interactive data table
│   └── ToggleGroupAssumptions.tsx # GOM assumption tabs
├── utils/                        # Business Logic
│   └── gomVariableSelector.ts    # GOM filtering logic
├── stores/                       # State Management
│   └── store.js                  # Global state signals
└── types/                        # Type Definitions
    └── interfaces.ts             # TypeScript interfaces
```

### Core Architecture Principles
1. **Separation of Concerns**: UI, business logic, and state management are clearly separated
2. **Reactive State Management**: Uses Solid.js signals for efficient updates
3. **Modular Design**: Each component has a single responsibility
4. **Type Safety**: Full TypeScript integration for better development experience

---

## Components

### KFGOMAnalysis.tsx
**Purpose**: Main analysis controller and retraining orchestrator

**Key Responsibilities**:
- Initial SARIMAX analysis execution
- Model retraining with selected variables
- Analysis configuration management
- Error handling and user feedback

**Key Functions**:
```typescript
async function runAnalysis()
async function retrainWithSelectedVariables()
function configureAnalysis()
```

### KFGOMTable.tsx
**Purpose**: Interactive data table with variable selection capabilities

**Key Responsibilities**:
- Display SARIMAX results in tabular format
- Handle variable selection via checkboxes
- Apply GOM assumption filtering
- Apply significance level filtering
- Maintain selection state

**Key Functions**:
```typescript
function convertSARIMAXToTableData(results)
function filterDataByGOMAssumption(data, assumptionIndex)
function filterDataBySignificance(data, filterType)
function handleJointSelection(jointName, isSelected)
```

### ToggleGroupAssumptions.tsx
**Purpose**: GOM assumption tab interface

**Key Responsibilities**:
- Display GOM assumption tabs
- Handle tab selection
- Update global assumption state

### gomVariableSelector.ts
**Purpose**: Core GOM assumption filtering logic

**Key Responsibilities**:
- Implement biomechanical filtering rules
- Route to appropriate assumption functions
- Handle different joint relationship types

**Key Functions**:
```typescript
function selectVariablesByAssumption(data, assumptionIndex, targetJoint)
function applyTransitioningAssumption(data, targetJoint)
function applyIntraJointXY(data, targetJoint)
function applyInterLimbSynergies(data, targetJoint)
function applySerialMediation(data, targetJoint)
```

---

## Data Flow

The Variable Selection feature follows a clear data flow pipeline:

```
SARIMAX Analysis → Table Conversion → GOM Filtering → Significance Filtering → Variable Selection → Model Retraining
```

### Detailed Data Flow

1. **Initial Analysis**
   - User triggers SARIMAX analysis
   - Results stored in `sarimaxResults` signal
   - Table data conversion triggered

2. **Data Processing**
   - SARIMAX results converted to table format
   - Initial data stored in `kfgomData` signal
   - Filtering pipeline activated

3. **GOM Filtering**
   - GOM assumption applied based on selected tab
   - Biomechanical rules filter relevant variables
   - Filtered data stored in intermediate state

4. **Significance Filtering**
   - Statistical significance filter applied
   - Variables filtered by significance level
   - Final filtered data stored in `filteredData` signal

5. **Variable Selection**
   - User interacts with checkboxes
   - Selection state updated in real-time
   - Selected variables exposed globally

6. **Model Retraining**
   - Selected variables retrieved from global state
   - Training data filtered for selected variables
   - Model retrained with filtered data
   - New results displayed

### State Management Flow

```
sarimaxResults → kfgomData → gomFiltered → significanceFiltered → selectedVariables → retrainedModel
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Solid.js application setup
- AG-Grid license (for advanced features)

### Installation Steps

1. **Install Dependencies**
```bash
npm install @ag-grid-community/core @ag-grid-community/solid
npm install arquero
npm install solid-js
```

2. **Import Required Components**
```typescript
import { KFGOMAnalysis } from './components/KFGOMAnalysis'
import { KFGOMTable } from './components/KFGOMTable'
import { ToggleGroupAssumptions } from './components/ToggleGroupAssumptions'
```

3. **Setup State Management**
```typescript
// In your store.js
import { createSignal } from 'solid-js'

export const [sarimaxResults, setSarimaxResults] = createSignal(null)
export const [selectedAssumptionsIndex, setSelectedAssumptionsIndex] = createSignal(0)
export const [kfgomFilters, setKfgomFilters] = createSignal('all')
export const [kfgomData, setKfgomData] = createSignal([])
export const [filteredData, setFilteredData] = createSignal([])
```

4. **Configure AG-Grid**
```typescript
import { AgGridSolid } from '@ag-grid-community/solid'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
```

---

## Usage Guide

### Basic Usage

#### 1. Initial Analysis
```typescript
// Trigger SARIMAX analysis
const runAnalysis = async () => {
    const analyzer = new KFGOMAnalyzer(trainData, testData)
    const results = await analyzer.analyze({
        targetJoint: selectedJoint(),
        method: 'sarimax',
        lags: 3,
        forecastSteps: 10
    })
    setSarimaxResults(results)
}
```

#### 2. Apply GOM Filtering
```typescript
// Select GOM assumption tab
setSelectedAssumptionsIndex(2) // Transitioning assumption

// Filtering is applied automatically via createEffect
createEffect(() => {
    const data = kfgomData()
    const assumptionIndex = selectedAssumptionsIndex()
    if (data && data.length > 0) {
        const filtered = filterDataByGOMAssumption(data, assumptionIndex)
        setFilteredData(filtered)
    }
})
```

#### 3. Apply Significance Filtering
```typescript
// Set significance filter
setKfgomFilters('significant') // Show only significant variables

// Combined filtering
const applyFilters = () => {
    let data = kfgomData()
    
    // Apply GOM filtering
    data = filterDataByGOMAssumption(data, selectedAssumptionsIndex())
    
    // Apply significance filtering
    data = filterDataBySignificance(data, kfgomFilters())
    
    setFilteredData(data)
}
```

#### 4. Select Variables
```typescript
// Handle checkbox selection
const handleJointSelection = (jointName, isSelected) => {
    const currentData = filteredData()
    const updatedData = currentData.map(item => 
        item.jointName === jointName 
            ? { ...item, selected: isSelected }
            : item
    )
    setFilteredData(updatedData)
    
    // Update global selection
    const selectedJoints = new Set(
        updatedData
            .filter(item => item.selected)
            .map(item => item.jointName)
    )
    (window as any).selectedJoints = () => selectedJoints
}
```

#### 5. Retrain Model
```typescript
// Retrain with selected variables
const retrainWithSelectedVariables = async () => {
    const selectedJoints = (window as any).selectedJoints
    const selectedJointArray = selectedJoints ? Array.from(selectedJoints()) : []
    
    if (selectedJointArray.length === 0) {
        alert('No variables selected for retraining!')
        return
    }
    
    const filteredTrainData = filterDataForSelectedVariables(trainData, selectedJointArray)
    const filteredTestData = filterDataForSelectedVariables(testData, selectedJointArray)
    
    const newAnalyzer = new KFGOMAnalyzer(filteredTrainData, filteredTestData)
    const newResults = await newAnalyzer.analyze({
        targetJoint: selectedJoint(),
        method: 'sarimax',
        lags: 3,
        forecastSteps: 10
    })
    
    setSarimaxResults(newResults)
}
```

### Advanced Usage

#### Custom GOM Assumptions
```typescript
// Implement custom GOM assumption
const applyCustomAssumption = (data, targetJoint) => {
    // Custom filtering logic
    return data.filter(item => {
        // Your custom criteria
        return customCriteria(item, targetJoint)
    })
}

// Register custom assumption
const customGOMSelector = {
    selectVariablesByAssumption: (data, assumptionIndex, targetJoint) => {
        switch(assumptionIndex) {
            case 99: // Custom assumption index
                return applyCustomAssumption(data, targetJoint)
            default:
                return standardGOMSelector.selectVariablesByAssumption(data, assumptionIndex, targetJoint)
        }
    }
}
```

#### Batch Variable Selection
```typescript
// Select all significant variables
const selectAllSignificant = () => {
    const currentData = filteredData()
    const updatedData = currentData.map(item => ({
        ...item,
        selected: item.significance === '***' || 
                 item.significance === '**' || 
                 item.significance === '*'
    }))
    setFilteredData(updatedData)
}

// Select by joint type
const selectByJointType = (jointType) => {
    const currentData = filteredData()
    const updatedData = currentData.map(item => ({
        ...item,
        selected: item.jointName.includes(jointType)
    }))
    setFilteredData(updatedData)
}
```

---

## API Reference

### Core Functions

#### Analysis Functions
```typescript
runAnalysis(): Promise<void>
// Performs initial SARIMAX analysis on all variables
// Stores results in sarimaxResults signal

retrainWithSelectedVariables(): Promise<void>
// Retrains model using only selected variables
// Updates sarimaxResults with new results

configureAnalysis(config: AnalysisConfig): void
// Sets analysis configuration parameters
```

#### Filtering Functions
```typescript
filterDataByGOMAssumption(data: any[], assumptionIndex: number): any[]
// Applies GOM assumption filtering based on biomechanical rules
// Returns filtered array of variables

filterDataBySignificance(data: any[], filterType: string): any[]
// Filters variables by statistical significance level
// filterType: 'all' | 'significant' | 'non-significant'

convertSARIMAXToTableData(results: any): any[]
// Converts SARIMAX analysis results to table format
// Includes significance levels and joint names
```

#### Selection Functions
```typescript
handleJointSelection(jointName: string, isSelected: boolean): void
// Handles individual variable selection/deselection
// Updates both local and global selection state

getSelectedVariables(): string[]
// Returns array of currently selected variable names

clearAllSelections(): void
// Clears all variable selections
```

#### GOM Logic Functions
```typescript
selectVariablesByAssumption(data: any[], assumptionIndex: number, targetJoint: string): any[]
// Main GOM filtering function, routes to specific assumption handlers

applyTransitioningAssumption(data: any[], targetJoint: string): any[]
// Filters for same joint-axis relationships (autoregressive)

applyIntraJointXY(data: any[], targetJoint: string): any[]
// Filters for same joint, different axes relationships

applyInterLimbSynergies(data: any[], targetJoint: string): any[]
// Filters for opposite side, same joint type relationships

applySerialMediation(data: any[], targetJoint: string): any[]
// Filters for neighboring joints on same side relationships
```

### Signals and State

#### Analysis State
```typescript
sarimaxResults: Signal<any>
// Current SARIMAX analysis results

sarimaxConfig: Signal<AnalysisConfig>
// Analysis configuration parameters
```

#### UI State
```typescript
selectedAssumptionsIndex: Signal<number>
// Currently selected GOM assumption tab (0, 2, 4, 6, 8, 10, 12)

kfgomFilters: Signal<string>
// Current significance filter ('all' | 'significant' | 'non-significant')
```

#### Data State
```typescript
kfgomData: Signal<any[]>
// Raw table data converted from SARIMAX results

filteredData: Signal<any[]>
// Data after applying GOM and significance filters
```

### Type Definitions

```typescript
interface AnalysisConfig {
    targetJoint: string
    method: 'sarimax' | 'ols' | 'mle' | 'ridge'
    lags: number
    forecastSteps: number
}

interface VariableData {
    jointName: string
    coefficient: number
    pValue: number
    significance: string
    selected: boolean
}

interface GOMAssumption {
    index: number
    name: string
    description: string
    filterFunction: (data: any[], targetJoint: string) => any[]
}
```

---

## Code Examples

### Complete Integration Example

```typescript
// Main component integrating all features
import { createSignal, createEffect } from 'solid-js'
import { KFGOMAnalysis } from './components/KFGOMAnalysis'
import { KFGOMTable } from './components/KFGOMTable'
import { ToggleGroupAssumptions } from './components/ToggleGroupAssumptions'

export default function VariableSelectionApp() {
    const [analysisComplete, setAnalysisComplete] = createSignal(false)
    
    // Handle analysis completion
    createEffect(() => {
        const results = sarimaxResults()
        if (results) {
            setAnalysisComplete(true)
            console.log('Analysis completed with', results.variables.length, 'variables')
        }
    })
    
    return (
        <div class="variable-selection-app">
            {/* Analysis Control */}
            <KFGOMAnalysis 
                onAnalysisComplete={() => setAnalysisComplete(true)}
                onRetrainComplete={(results) => console.log('Retrain completed:', results)}
            />
            
            {/* GOM Assumption Tabs */}
            <ToggleGroupAssumptions />
            
            {/* Interactive Data Table */}
            {analysisComplete() && (
                <KFGOMTable 
                    onSelectionChange={(count) => console.log('Selected variables:', count)}
                />
            )}
        </div>
    )
}
```

### Custom GOM Assumption Example

```typescript
// Custom GOM assumption for cross-body relationships
const applyCrossBodyAssumption = (data, targetJoint) => {
    // Extract joint base name and side
    const getJointInfo = (jointName) => {
        const isLeft = jointName.includes('Left')
        const isRight = jointName.includes('Right')
        const baseName = jointName.replace(/(Left|Right)/, '').replace(/[XYZ]$/, '')
        const axis = jointName.match(/[XYZ]$/)?.[0] || ''
        
        return { baseName, side: isLeft ? 'Left' : isRight ? 'Right' : '', axis }
    }
    
    const targetInfo = getJointInfo(targetJoint)
    
    return data.filter(item => {
        const itemInfo = getJointInfo(item.jointName)
        
        // Cross-body: same joint type, opposite side, same axis
        return itemInfo.baseName === targetInfo.baseName &&
               itemInfo.side !== targetInfo.side &&
               itemInfo.axis === targetInfo.axis
    })
}

// Register custom assumption
const customGOMSelector = new GOMVariableSelector()
customGOMSelector.registerAssumption(99, 'Cross-body coordination', applyCrossBodyAssumption)
```

### Advanced Filtering Example

```typescript
// Multi-criteria filtering with custom logic
const advancedFilter = (data, criteria) => {
    return data.filter(item => {
        // Significance filter
        if (criteria.significance && !criteria.significance.includes(item.significance)) {
            return false
        }
        
        // Coefficient threshold
        if (criteria.minCoefficient && Math.abs(item.coefficient) < criteria.minCoefficient) {
            return false
        }
        
        // Joint type filter
        if (criteria.jointTypes && !criteria.jointTypes.some(type => item.jointName.includes(type))) {
            return false
        }
        
        // Custom predicate
        if (criteria.customPredicate && !criteria.customPredicate(item)) {
            return false
        }
        
        return true
    })
}

// Usage
const filteredData = advancedFilter(rawData, {
    significance: ['***', '**', '*'],
    minCoefficient: 0.1,
    jointTypes: ['Hip', 'Knee', 'Ankle'],
    customPredicate: (item) => item.jointName.includes('Left')
})
```

### Selection State Management Example

```typescript
// Advanced selection state management
class SelectionManager {
    private selections = new Map<string, Set<string>>()
    
    saveSelection(name: string, selectedJoints: Set<string>) {
        this.selections.set(name, new Set(selectedJoints))
        localStorage.setItem('variableSelections', JSON.stringify(
            Array.from(this.selections.entries()).map(([key, value]) => [key, Array.from(value)])
        ))
    }
    
    loadSelection(name: string): Set<string> | null {
        return this.selections.get(name) || null
    }
    
    restoreFromStorage() {
        const stored = localStorage.getItem('variableSelections')
        if (stored) {
            const data = JSON.parse(stored)
            this.selections = new Map(
                data.map(([key, value]) => [key, new Set(value)])
            )
        }
    }
    
    getSelectionNames(): string[] {
        return Array.from(this.selections.keys())
    }
}

// Usage
const selectionManager = new SelectionManager()
selectionManager.restoreFromStorage()

// Save current selection
const currentSelection = (window as any).selectedJoints?.() || new Set()
selectionManager.saveSelection('Analysis_1', currentSelection)

// Load saved selection
const savedSelection = selectionManager.loadSelection('Analysis_1')
if (savedSelection) {
    applySelection(savedSelection)
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: No Variables Selected for Retraining
**Symptoms**: User clicks retrain but gets "No variables selected" error

**Causes**:
- User hasn't selected any variables via checkboxes
- GOM filter is too restrictive and shows no variables
- Significance filter excludes all variables

**Solutions**:
```typescript
// Add validation before retraining
const validateSelection = () => {
    const selectedJoints = (window as any).selectedJoints
    const selectedCount = selectedJoints ? selectedJoints().size : 0
    
    if (selectedCount === 0) {
        // Guide user through selection process
        const filteredCount = filteredData().length
        if (filteredCount === 0) {
            alert('No variables available. Try changing GOM assumption or significance filter.')
        } else {
            alert(`${filteredCount} variables available. Please select variables using checkboxes.`)
        }
        return false
    }
    return true
}
```

#### Issue 2: Empty Table After Filtering
**Symptoms**: Table shows no data after applying filters

**Causes**:
- SARIMAX analysis hasn't completed
- GOM assumption filter is too restrictive
- Target joint doesn't match any variables

**Solutions**:
```typescript
// Add comprehensive data validation
const validateTableData = () => {
    const rawData = kfgomData()
    const filteredCount = filteredData().length
    
    console.log('Data validation:', {
        rawDataCount: rawData.length,
        filteredCount: filteredCount,
        assumptionIndex: selectedAssumptionsIndex(),
        significanceFilter: kfgomFilters(),
        targetJoint: selectedJoint()
    })
    
    if (rawData.length === 0) {
        console.error('No SARIMAX results available')
        return false
    }
    
    if (filteredCount === 0) {
        console.warn('All variables filtered out. Consider adjusting filters.')
        return false
    }
    
    return true
}
```

#### Issue 3: Selection State Not Persisting
**Symptoms**: Checkbox selections disappear after filtering

**Causes**:
- Selection state not properly maintained during filtering
- Global state not synchronized with local state

**Solutions**:
```typescript
// Preserve selection during filtering
const preserveSelectionDuringFilter = (newData, previousSelections) => {
    return newData.map(item => ({
        ...item,
        selected: previousSelections.has(item.jointName)
    }))
}

// Usage in filter function
const applyFiltersWithSelection = () => {
    const currentSelections = new Set(
        filteredData()
            .filter(item => item.selected)
            .map(item => item.jointName)
    )
    
    let data = kfgomData()
    data = filterDataByGOMAssumption(data, selectedAssumptionsIndex())
    data = filterDataBySignificance(data, kfgomFilters())
    data = preserveSelectionDuringFilter(data, currentSelections)
    
    setFilteredData(data)
}
```

#### Issue 4: Retraining Fails with Selected Variables
**Symptoms**: Model retraining throws errors despite having selected variables

**Causes**:
- Selected variables don't exist in training data
- Data format mismatch between selection and training data
- Insufficient data for selected variables

**Solutions**:
```typescript
// Validate selected variables against training data
const validateSelectedVariables = (selectedJoints, trainData) => {
    const availableVariables = Object.keys(trainData[0] || {})
    const missingVariables = selectedJoints.filter(joint => 
        !availableVariables.includes(joint)
    )
    
    if (missingVariables.length > 0) {
        console.error('Missing variables in training data:', missingVariables)
        throw new Error(`Variables not found in training data: ${missingVariables.join(', ')}`)
    }
    
    // Check data sufficiency
    const minDataPoints = 50 // Minimum required data points
    if (trainData.length < minDataPoints) {
        throw new Error(`Insufficient training data: ${trainData.length} < ${minDataPoints}`)
    }
    
    return true
}
```

### Debug Tools

#### Debug Console Commands
```typescript
// Add to browser console for debugging
window.debugVariableSelection = {
    // Get current state
    getState: () => ({
        sarimaxResults: sarimaxResults(),
        kfgomData: kfgomData(),
        filteredData: filteredData(),
        selectedAssumption: selectedAssumptionsIndex(),
        significanceFilter: kfgomFilters(),
        selectedJoints: (window as any).selectedJoints?.() || new Set()
    }),
    
    // Force refresh
    refresh: () => {
        const data = kfgomData()
        if (data.length > 0) {
            applyFilters()
        }
    },
    
    // Simulate selection
    selectAll: () => {
        const data = filteredData()
        data.forEach((_, index) => {
            handleJointSelection(data[index].jointName, true)
        })
    },
    
    // Clear selections
    clearAll: () => {
        const data = filteredData()
        data.forEach((_, index) => {
            handleJointSelection(data[index].jointName, false)
        })
    }
}
```

#### Logging Configuration
```typescript
// Enhanced logging for debugging
const createLogger = (component) => ({
    info: (message, data) => console.log(`[${component}] ${message}`, data),
    warn: (message, data) => console.warn(`[${component}] ${message}`, data),
    error: (message, data) => console.error(`[${component}] ${message}`, data),
    debug: (message, data) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${component}] ${message}`, data)
        }
    }
})

// Usage
const logger = createLogger('VariableSelection')
logger.info('Filter applied', { assumption: assumptionIndex, count: filteredData.length })
```

---

## Developer Notes

### Performance Considerations

1. **Large Dataset Handling**
   - Use virtualization for tables with > 1000 rows
   - Implement pagination for better performance
   - Consider using Web Workers for heavy filtering operations

2. **Memory Management**
   - Clean up event listeners on component unmount
   - Use object pooling for frequently created objects
   - Implement proper cleanup in createEffect

3. **State Updates**
   - Batch state updates to avoid excessive re-renders
   - Use fine-grained reactivity where possible
   - Debounce user interactions for better UX

### Best Practices

1. **Error Handling**
   - Always validate data before processing
   - Provide meaningful error messages to users
   - Implement graceful degradation for edge cases

2. **User Experience**
   - Show loading states during analysis
   - Provide clear feedback for user actions
   - Implement keyboard shortcuts for power users

3. **Code Organization**
   - Keep components focused on single responsibilities
   - Extract complex logic into utility functions
   - Use TypeScript for better type safety

### Extension Points

The Variable Selection feature is designed to be extensible:

1. **Custom GOM Assumptions**
   - Implement new filtering logic in gomVariableSelector.ts
   - Add new tabs to ToggleGroupAssumptions.tsx
   - Register new assumption indices in the mapping

2. **Additional Filters**
   - Extend significance filtering with custom levels
   - Add joint type filters
   - Implement coefficient threshold filters

3. **Export/Import**
   - Add selection persistence to localStorage
   - Implement CSV export for selected variables
   - Add configuration import/export functionality

### Future Roadmap

1. **Short Term**
   - Implement select all checkbox
   - Add bulk selection operations
   - Improve error messages and validation

2. **Medium Term**
   - Add advanced filtering options
   - Implement selection persistence
   - Add export/import functionality

3. **Long Term**
   - Machine learning-based variable recommendation
   - Advanced visualization of variable relationships
   - Integration with external analysis tools

---

**Author**: Youssef Hergal  
**Date**: sep 2025 
**Version**: 2.0  
**Status**: Complete Documentation