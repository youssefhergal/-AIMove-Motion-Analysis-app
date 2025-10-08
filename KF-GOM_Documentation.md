# KF-GOM (Kalman Filter - Gesture Operational Model) Complete Documentation

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

The KF-GOM (Kalman Filter - Gesture Operational Model) is a comprehensive motion analysis system that uses SARIMAX (Seasonal AutoRegressive Integrated Moving Average with eXogenous variables) modeling to analyze motion capture data and identify causal relationships between joint movements.

### Key Features
- **Real-time BVH file analysis** with support for both repository and uploaded files
- **SARIMAX modeling** with multiple estimation methods (OLS, MLE, Ridge)
- **Interactive data visualization** with prediction plots and performance metrics
- **GOM assumption filtering** based on biomechanical principles
- **Variable selection and retraining** for refined analysis
- **Forecasting capabilities** for movement prediction

### Technical Stack
- **Frontend**: Solid.js with TypeScript
- **Data Processing**: Arquero.js for data manipulation
- **Visualization**: ECharts for interactive plots
- **UI Components**: Ark UI and AG-Grid
- **File Processing**: Custom BVH loader and parser

---

## Architecture

The KF-GOM system follows a modular architecture with clear separation of concerns:

```
KF-GOM/
├── components/           # UI Components
│   ├── KFGOMAnalysis.tsx        # Main analysis orchestrator
│   ├── KFGOMTable.tsx           # Interactive results table
│   ├── KFGOMFileSelector.tsx    # File selection interface
│   ├── KFGOMFileList.tsx        # File dropdown list
│   ├── MovementPredictionPlot.tsx # Visualization component
│   └── KFGOMParameterTooltips.tsx # Help tooltips
├── utils/               # Core Utilities
│   ├── bvhLoader.ts            # BVH file loading and parsing
│   ├── gomVariableSelector.ts   # GOM assumption logic
│   ├── bvhParser.js            # Data preparation for SARIMAX
│   ├── metrics.js              # Performance metrics calculation
│   └── forecasting.js          # Movement forecasting utilities
├── core/                # Core Analysis Engine
│   ├── SARIMAX.js              # SARIMAX implementation
│   └── StandardScaler.js       # Data normalization
└── SARIMAXAnalyzer.js   # Main analysis coordinator
```

---

## Components

### 1. KFGOMAnalysis.tsx - Main Analysis Orchestrator

**Purpose**: Coordinates the entire KF-GOM analysis pipeline from data loading to results visualization.

**Key Responsibilities**:
- Manages analysis state and progress tracking
- Converts BVH data to SARIMAX format
- Orchestrates model training and evaluation
- Handles retraining with selected variables
- Manages prediction history and caching

**Key Code Sections**:

```typescript
// Main analysis function
const runUnifiedAnalysis = async (options: { 
  selectedVariables?: string[] | null, 
  includeForecasting?: boolean 
} = {}) => {
  const { selectedVariables = null, includeForecasting = true } = options
  
  try {
    setIsAnalyzing(true)
    setAnalysisProgress({ percentage: 0, message: 'Starting analysis...' })

    // Get current configuration
    const config = sarimaxConfig()
    const targetJoint = selectedJoint()
    const targetAxis = `${axisSelected()}rotation`
    const lags = config.lags || 2
    const method = config.method || 'ols'
    
    // Get or prepare data
    let trainData = parsedTrainData()
    let testData = parsedTestData()
    
    if (!trainData || !testData) {
      // Convert BVH data to SARIMAX format
      trainData = await convertExistingBVHData('train')
      testData = await convertExistingBVHData('test')
      
      // Cache parsed data for performance
      setParsedTrainData(trainData)
      setParsedTestData(testData)
    }

    // Initialize analyzer and run analysis
    const analyzer = new SARIMAXAnalyzer()
    analyzer.setData(trainData, testData)
    
    const results = await analyzer.analyze(
      targetJoint, 
      targetAxis, 
      lags, 
      method,
      (percentage, message) => setAnalysisProgress({ percentage, message })
    )
    
    // Store results and update UI
    setSarimaxResults(results)
    setSarimaxAnalyzer(analyzer)
    
  } catch (error) {
    handleAnalysisError(error)
  } finally {
    setIsAnalyzing(false)
  }
}
```

### 2. KFGOMTable.tsx - Interactive Results Table

**Purpose**: Displays SARIMAX analysis results in an interactive AG-Grid table with filtering and selection capabilities.

**Key Features**:
- Multi-row selection with checkboxes
- GOM assumption filtering
- Significance level filtering
- Persistent selection across tabs
- Real-time selection tracking

**Key Code Sections**:

```typescript
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
  
  // Apply GOM filtering for specific assumptions
  const jointNames = data.map(item => item.jointId)
  const results = sarimaxResults()
  let targetCombined = 'Hips_Xrotation'
  
  if (results && results.targetJoint && results.targetAxis) {
    targetCombined = `${results.targetJoint}_${results.targetAxis}`
  }
  
  const selectedJointNames = gomSelector.selectVariablesByAssumption(
    jointNames, 
    actualAssumptionIndex, 
    targetCombined
  )
  
  return data.filter(item => selectedJointNames.includes(item.jointId))
}

// AG-Grid configuration
const gridOptions = {
  columnDefs: [
    { field: 'jointId', headerName: 'Joint', checkboxSelection: true, headerCheckboxSelection: true },
    { field: 'coefficient', headerName: 'Coefficient', type: 'numericColumn' },
    { field: 'pValue', headerName: 'P-Value', type: 'numericColumn' },
    { field: 'tStat', headerName: 'T-Statistic', type: 'numericColumn' },
    { field: 'significance', headerName: 'Significance' }
  ],
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onSelectionChanged: handleSelectionChanged
}
```

### 3. KFGOMFileSelector.tsx - File Selection Interface

**Purpose**: Manages BVH file selection for training and testing datasets.

**Key Features**:
- Integration with global file management system
- Support for both repository and uploaded files
- Automatic bone data extraction
- File validation and error handling

**Key Code Sections**:

```typescript
// Handle train file selection from selected files
const handleTrainFileSelect = async (fileName) => {
  setTrainFile(fileName)
  
  try {
    // Use fileName directly (no bvh2/ prefix needed)
    const result = await kfgomBVHLoader.loadBVHFile(fileName)
    
    if (kfgomBVHLoader.validateBVHStructure(result)) {
      const bonesData = kfgomBVHLoader.extractBonesData(result)
      setTrainFileBones(bonesData)
      console.log(`✅ Training file loaded: ${fileName} with ${bonesData.length} bones`)
    } else {
      console.error(`❌ Failed to load training file: ${fileName} - Invalid BVH structure`)
    }
  } catch (error) {
    console.error(`❌ Error loading training file: ${fileName}`, error)
  }
}
```

### 4. SARIMAXAnalyzer.js - Core Analysis Engine

**Purpose**: Implements the SARIMAX modeling algorithm with data preprocessing and metrics calculation.

**Key Features**:
- Multiple estimation methods (OLS, MLE, Ridge)
- Data normalization with StandardScaler
- Comprehensive performance metrics
- Forecasting capabilities
- Progress tracking

**Key Code Sections**:

```javascript
async analyze(targetJoint, targetAxis, lags = 2, method = 'ridge', progressCallback = null) {
  try {
    if (!this.trainData || !this.testData) {
      throw new Error('No data set. Call setData() first.')
    }
    
    const targetAngle = `${targetJoint}_${targetAxis}`
    console.log('🎯 Target angle:', targetAngle)

    // Step 1: Prepare data using the enhanced approach
    if (progressCallback) progressCallback(10, 'Preparing BVH data...')
    
    const exogAngles = getAllBVHAngles(this.trainData).filter(angle => angle !== targetAngle)
    
    // Use the enhanced data preparation
    const trainBvhData = prepareForSARIMAX(this.trainData, targetAngle, exogAngles)
    const testBvhData = prepareForSARIMAX(this.testData, targetAngle, exogAngles)
    
    if (progressCallback) progressCallback(30, 'Normalizing data...')
    
    // Step 2: Create separate scalers for endogenous and exogenous data
    const endogScaler = new StandardScaler()
    const exogScaler = new StandardScaler()
    
    // Normalize data
    const endogTrain = trainBvhData.endog.map(val => endogScaler.transform([[val]])[0][0])
    const exogTrain = exogTrainTransposed.map(row => exogScaler.transform([row])[0])
    
    if (progressCallback) progressCallback(50, `Training SARIMAX model (${method.toUpperCase()})...`)
    
    // Step 3: Train SARIMAX model
    this.model = new SARIMAX(lags, method)
    await this.model.fit(endogTrain, exogTrain, progressCallback)
    
    if (progressCallback) progressCallback(80, 'Calculating metrics...')
    
    // Step 4: Make predictions and calculate metrics
    const predictions = this.model.predict(normalizedTestData)
    const denormalizedPredictions = predictions.map(pred => 
      endogScaler.inverseTransform([[pred]])[0][0]
    )
    
    // Calculate comprehensive metrics
    const metrics = this.calculateMetrics(testBvhData.endog, denormalizedPredictions)
    
    if (progressCallback) progressCallback(100, 'Analysis complete!')
    
    return {
      targetJoint,
      targetAxis,
      original: testBvhData.endog,
      predicted: denormalizedPredictions,
      frames: Array.from({length: testBvhData.endog.length}, (_, i) => i),
      metrics,
      modelSummary: createModelSummary(this.model, exogAngles),
      config: { targetJoint, targetAxis, lags, method }
    }
    
  } catch (error) {
    console.error('❌ SARIMAX Analysis Error:', error)
    throw error
  }
}
```

### 5. bvhLoader.ts - BVH File Loading System

**Purpose**: Handles loading and parsing of BVH files from various sources.

**Key Features**:
- Support for both repository and uploaded files
- Flexible file path resolution
- BVH structure validation
- Bone data extraction

**Key Code Sections**:

```typescript
// Load BVH file from selected files (skeletonsArray)
async loadBVHFile(fileName: string): Promise<any> {
  try {
    console.log(`🔄 KF-GOM Loading selected file: ${fileName}`)
    
    // Find the file in skeletonsArray (selected files)
    const skeletons = skeletonsArray()
    console.log(`🔍 KF-GOM Searching for file: ${fileName}`)
    
    // Try to find the file with different formats
    let skeleton = skeletons.find(s => s.fileName === fileName)
    
    if (!skeleton) {
      // Try with bvh2/ prefix
      skeleton = skeletons.find(s => s.fileName === `bvh2/${fileName}`)
    }
    
    if (!skeleton) {
      // Try without bvh2/ prefix (if fileName has it)
      const cleanFileName = fileName.replace('bvh2/', '')
      skeleton = skeletons.find(s => s.fileName === cleanFileName)
    }
    
    if (!skeleton) {
      throw new Error(`File ${fileName} not found in selected files`)
    }
    
    if (skeleton.fileContent) {
      // For uploaded files, parse content directly
      console.log(`✅ KF-GOM Using uploaded file content for: ${fileName}`)
      const result = this.loader.parse(skeleton.fileContent)
      return result
    } else {
      // For repository files, load from public path
      console.log(`✅ KF-GOM Loading repository file: ${fileName}`)
      const publicPath = fileName.startsWith('/') ? fileName : `/${fileName}`
      
      const result = await new Promise((resolve, reject) => {
        this.loader.load(
          publicPath,
          (result) => resolve(result),
          undefined,
          (error) => reject(error)
        )
      })
      
      return result
    }
    
  } catch (error) {
    console.error(`❌ KF-GOM BVH loading error for ${fileName}:`, error)
    throw error
  }
}

// Validate BVH structure
validateBVHStructure(bvhData: any): boolean {
  if (!bvhData || !bvhData.skeleton || !bvhData.skeleton.bones) {
    console.error('❌ Invalid BVH structure: missing skeleton or bones')
    return false
  }
  
  const boneCount = bvhData.skeleton.bones.length
  console.log(`✅ BVH structure validated: ${boneCount} bones`)
  return boneCount > 0
}

// Extract bones data for analysis
extractBonesData(bvhData: any): any[] {
  if (!this.validateBVHStructure(bvhData)) {
    return []
  }
  
  return bvhData.skeleton.bones.map(bone => ({
    name: bone.name,
    position: bone.position,
    rotation: bone.rotation
  }))
}
```

---

## Data Flow

The KF-GOM system follows a structured data flow:

```
1. File Selection
   ↓
2. BVH Loading & Parsing
   ↓
3. Data Conversion to SARIMAX Format
   ↓
4. Data Normalization
   ↓
5. SARIMAX Model Training
   ↓
6. Prediction & Metrics Calculation
   ↓
7. Results Display & Visualization
   ↓
8. Optional: Variable Selection & Retraining
```

### Detailed Data Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐
│  File Manager   │───▶│   BVH Loader    │
│  (Repository/   │    │  (bvhLoader.ts) │
│   Uploaded)     │    └─────────────────┘
└─────────────────┘              │
                                 ▼
┌─────────────────┐    ┌─────────────────┐
│ KFGOMAnalysis   │◀───│  Data Parser    │
│    (Main)       │    │ (bvhParser.js)  │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ SARIMAXAnalyzer │───▶│   SARIMAX Core  │
│                 │    │   (SARIMAX.js)  │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Results &     │◀───│    Metrics      │
│  Visualization  │    │  (metrics.js)   │
└─────────────────┘    └─────────────────┘
```

---

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with ES6 support

### Dependencies

```json
{
  "dependencies": {
    "solid-js": "^1.8.0",
    "@ark-ui/solid": "^2.0.0",
    "ag-grid-community": "^31.0.0",
    "echarts": "^5.4.0",
    "arquero": "^5.4.0",
    "lucide-solid": "^0.294.0"
  }
}
```

### File Structure Setup

Ensure the following directory structure exists:

```
src/
├── scripts/
│   ├── kfgom/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── core/
│   │   └── index.ts
│   ├── stores/
│   │   └── store.js
│   └── utils/
│       ├── eventBus.js
│       ├── logger.js
│       └── errorHandler.js
└── public/
    └── bvh2/  (for repository BVH files)
```

---

## Usage Guide

### Basic Usage

1. **File Selection**
   - Select training and testing BVH files from the dropdown
   - Files can be from repository (bvh2/) or uploaded files
   - Both files must be selected before analysis

2. **Parameter Configuration**
   - **Target Joint**: Select the joint to analyze (e.g., "Hips")
   - **Target Axis**: Choose rotation axis (X, Y, or Z)
   - **Lags**: Set autoregressive lags (default: 2)
   - **Method**: Choose estimation method (OLS, MLE, Ridge)

3. **Run Analysis**
   - Click "Run Analysis" or parameters will auto-trigger analysis
   - Monitor progress bar and status messages
   - Results appear in table and visualization

4. **Interpret Results**
   - **Table**: Shows coefficients, p-values, and significance
   - **Plot**: Displays original vs predicted movements
   - **Metrics**: Performance indicators (R², MAE, MSE, etc.)

### Advanced Usage

#### Variable Selection and Retraining

```typescript
// Select specific variables for retraining
const selectedVariables = ['Hips_Xrotation', 'Spine_Yrotation', 'LeftArm_Zrotation']

// Run analysis with selected variables only
await runUnifiedAnalysis({ 
  selectedVariables, 
  includeForecasting: true 
})
```

#### GOM Assumption Filtering

The system supports 6 GOM assumptions:

1. **GOM Overview** (0): All joints
2. **Transitioning** (2): Autoregressive same joint-axis
3. **Intra-joint Association** (3): Same joint, different axes
4. **Inter-limb Synergy** (4): Opposite side of target joint
5. **Serial Intra-limb Mediation** (5): Neighboring joints in hierarchy
6. **Non-serial Intra-limb Mediation** (6): Non-adjacent joints on same side

#### Custom Metrics Calculation

```javascript
// Calculate custom metrics
const metrics = {
  mse: MSE(original, predicted),
  mae: MAE(original, predicted),
  r2: calculateR2(original, predicted),
  correlation: calculateCorrelation(original, predicted),
  uTheil: UTheil(original, predicted)
}
```

---

## API Reference

### Core Classes

#### SARIMAXAnalyzer

```javascript
class SARIMAXAnalyzer {
  constructor()
  setData(trainData, testData)
  async analyze(targetJoint, targetAxis, lags, method, progressCallback)
  calculateMetrics(original, predicted)
  storeOriginalResults(results)
  getOriginalResults()
}
```

#### KFGOMBVHLoader

```typescript
class KFGOMBVHLoader {
  constructor()
  async loadBVHFile(fileName: string): Promise<any>
  validateBVHStructure(bvhData: any): boolean
  extractBonesData(bvhData: any): any[]
}
```

#### GOMVariableSelector

```typescript
class GOMVariableSelector {
  selectVariablesByAssumption(jointNames: string[], assumptionIndex: number, targetJoint?: string): string[]
  getGOMSummary(jointNames: string[], assumptionIndex: number, targetJoint?: string): GOMSummary
}
```

### Store Signals

```javascript
// Analysis State
const [isAnalyzing, setIsAnalyzing] = createSignal(false)
const [analysisProgress, setAnalysisProgress] = createSignal({ percentage: 0, message: '' })
const [sarimaxResults, setSarimaxResults] = createSignal(null)
const [sarimaxConfig, setSarimaxConfig] = createSignal({ lags: 2, method: 'ridge' })

// File Management
const [trainFile, setTrainFile] = createSignal('')
const [testFile, setTestFile] = createSignal('')
const [trainFileBones, setTrainFileBones] = createSignal([])
const [testFileBones, setTestFileBones] = createSignal([])

// UI State
const [selectedAssumptionsIndex, setSelectedAssumptionsIndex] = createSignal(0)
const [kfgomFilters, setKfgomFilters] = createSignal({ significance: 'all' })
const [predictionHistory, setPredictionHistory] = createSignal([])
```

### Event System

```javascript
// Event Bus Events
const EVENTS = {
  SELECTION_CHANGED: 'selectionChanged',
  ANALYSIS_COMPLETE: 'analysisComplete',
  FILE_LOADED: 'fileLoaded',
  ERROR_OCCURRED: 'errorOccurred'
}

// Emit events
emitSelectionChanged(selectedVariables)
eventBus.emit(EVENTS.ANALYSIS_COMPLETE, results)
```

---

## Code Examples

### Complete Analysis Workflow

```typescript
import { SARIMAXAnalyzer } from './kfgom/SARIMAXAnalyzer.js'
import { kfgomBVHLoader } from './kfgom/utils/bvhLoader.ts'

// 1. Load BVH files
const trainData = await kfgomBVHLoader.loadBVHFile('training_file.bvh')
const testData = await kfgomBVHLoader.loadBVHFile('testing_file.bvh')

// 2. Initialize analyzer
const analyzer = new SARIMAXAnalyzer()
analyzer.setData(trainData, testData)

// 3. Run analysis with progress tracking
const results = await analyzer.analyze(
  'Hips',           // target joint
  'Xrotation',      // target axis
  2,                // lags
  'ridge',          // method
  (progress, message) => {
    console.log(`${progress}%: ${message}`)
  }
)

// 4. Display results
console.log('Analysis Results:', results)
console.log('Performance Metrics:', results.metrics)
console.log('Model Summary:', results.modelSummary)
```

### Custom Variable Selection

```typescript
// Define GOM assumption filtering
const gomSelector = new GOMVariableSelector()
const availableJoints = ['Hips_Xrotation', 'Spine_Yrotation', 'LeftArm_Zrotation']

// Apply specific assumption (e.g., Inter-limb Synergy)
const filteredJoints = gomSelector.selectVariablesByAssumption(
  availableJoints,
  4,  // Inter-limb Synergy assumption
  'Hips_Xrotation'  // target joint
)

// Run analysis with filtered variables
const results = await analyzer.analyzeWithVariables(filteredJoints)
```

### Real-time Progress Tracking

```typescript
const progressCallback = (percentage, message) => {
  // Update UI progress bar
  setAnalysisProgress({ percentage, message })
  
  // Log progress
  console.log(`Analysis Progress: ${percentage}% - ${message}`)
  
  // Custom progress handling
  if (percentage === 100) {
    console.log('🎉 Analysis completed successfully!')
  }
}

await analyzer.analyze('Hips', 'Xrotation', 2, 'ridge', progressCallback)
```

### Error Handling

```typescript
try {
  const results = await analyzer.analyze('Hips', 'Xrotation', 2, 'ridge')
  setSarimaxResults(results)
} catch (error) {
  if (error.message.includes('No data set')) {
    console.error('❌ Data not loaded. Please select training and testing files.')
  } else if (error.message.includes('Invalid BVH structure')) {
    console.error('❌ BVH file format is invalid or corrupted.')
  } else {
    console.error('❌ Analysis failed:', error.message)
  }
  
  // Reset analysis state
  setIsAnalyzing(false)
  setAnalysisProgress({ percentage: 0, message: 'Analysis failed' })
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "File not found in selected files"

**Problem**: BVH file cannot be loaded for analysis.

**Solutions**:
- Ensure the file is selected in the main file management panel
- Check that the file name matches exactly (case-sensitive)
- Verify the file is properly uploaded or exists in the repository

```typescript
// Debug file availability
const skeletons = skeletonsArray()
console.log('Available files:', skeletons.map(s => s.fileName))
```

#### 2. "Invalid BVH structure"

**Problem**: BVH file format is not recognized or corrupted.

**Solutions**:
- Verify the BVH file has proper HIERARCHY and MOTION sections
- Check that bone data is properly formatted
- Ensure the file is not truncated or corrupted

```typescript
// Validate BVH structure manually
const isValid = kfgomBVHLoader.validateBVHStructure(bvhData)
if (!isValid) {
  console.error('BVH validation failed')
}
```

#### 3. "Analysis stuck at 0%"

**Problem**: Analysis doesn't progress beyond initialization.

**Solutions**:
- Check browser console for JavaScript errors
- Ensure both training and testing files are loaded
- Verify sufficient data points for analysis (minimum 10 frames)

```typescript
// Check data availability
if (!trainFileBones().length || !testFileBones().length) {
  console.error('Missing bone data for analysis')
}
```

#### 4. "Memory errors during analysis"

**Problem**: Browser runs out of memory with large BVH files.

**Solutions**:
- Use smaller BVH files or reduce frame count
- Clear browser cache and reload
- Increase browser memory limits

```javascript
// Monitor memory usage
console.log('Memory usage:', performance.memory?.usedJSHeapSize)
```

#### 5. "Predictions are all zeros or NaN"

**Problem**: SARIMAX model produces invalid predictions.

**Solutions**:
- Check for sufficient variation in the target variable
- Ensure data normalization is working correctly
- Try different estimation methods (OLS, MLE, Ridge)
- Reduce the number of lags if data is insufficient

```javascript
// Debug data quality
const targetData = trainBvhData.endog
const variance = targetData.reduce((acc, val, i, arr) => 
  acc + Math.pow(val - arr.reduce((a, b) => a + b) / arr.length, 2), 0
) / targetData.length

console.log('Target variable variance:', variance)
```

### Performance Optimization

#### 1. Data Caching

```typescript
// Cache parsed data to avoid re-parsing
const [parsedTrainData, setParsedTrainData] = createSignal(null)
const [parsedTestData, setParsedTestData] = createSignal(null)

// Use cached data if available
if (!parsedTrainData()) {
  const data = await convertExistingBVHData('train')
  setParsedTrainData(data)
}
```

#### 2. Debounced Updates

```typescript
// Prevent rapid successive updates
const [lastUpdateTime, setLastUpdateTime] = createSignal(0)

const debouncedUpdate = () => {
  const now = Date.now()
  if (now - lastUpdateTime() < 500) return
  
  setLastUpdateTime(now)
  updateAnalysis()
}
```

#### 3. Progress Throttling

```javascript
// Throttle progress updates to improve performance
let lastProgressUpdate = 0
const progressCallback = (percentage, message) => {
  const now = Date.now()
  if (now - lastProgressUpdate > 100) { // Update every 100ms max
    setAnalysisProgress({ percentage, message })
    lastProgressUpdate = now
  }
}
```

---

## Developer Notes

### Code Architecture Decisions

1. **Solid.js Reactivity**: Uses Solid.js signals for efficient reactive updates
2. **Modular Design**: Separates concerns with dedicated modules for each functionality
3. **Performance Optimization**: Implements caching and debouncing for large datasets
4. **Error Handling**: Comprehensive error handling with user-friendly messages
5. **Type Safety**: Uses TypeScript where possible for better development experience

### Future Improvements

1. **WebWorkers**: Move heavy computations to web workers for better UI responsiveness
2. **Streaming Processing**: Process large BVH files in chunks to reduce memory usage
3. **Advanced Metrics**: Add more sophisticated performance metrics and statistical tests
4. **Export Functionality**: Add CSV/JSON export for analysis results
5. **Batch Analysis**: Support for analyzing multiple file pairs simultaneously

### Integration Points

The KF-GOM system integrates with several other components:

- **Main Scene Management**: Uses `skeletonsArray` from the main application
- **File Upload System**: Integrates with the structure change detection system
- **Visualization System**: Shares joint selection with the main 3D viewer
- **Store Management**: Uses centralized Solid.js store for state management

### Testing Considerations

When testing the KF-GOM system:

1. **Unit Tests**: Test individual components like `SARIMAXAnalyzer` and `bvhLoader`
2. **Integration Tests**: Test the complete analysis workflow
3. **Performance Tests**: Verify memory usage and execution time with large files
4. **UI Tests**: Test user interactions and error states
5. **Data Validation**: Test with various BVH file formats and edge cases

---

## Conclusion

The KF-GOM system provides a comprehensive solution for motion capture analysis using advanced statistical modeling. Its modular architecture, robust error handling, and performance optimizations make it suitable for both research and production use.

For additional support or questions, refer to the code comments and console logging throughout the system, which provide detailed debugging information.

---

**Author**: Youssef Hergal  
**Version**: 1.2  
**Last Updated**: sep 2025 
**License**: MIT
