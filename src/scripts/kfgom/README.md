# KF-GOM Module

## Overview
The KF-GOM (Kalman Filter - Gait Optimization Model) module provides comprehensive analysis tools for movement prediction and gait optimization using SARIMAX modeling.

## Components

### 🎯 KFGOMAnalysis
Main analysis component that orchestrates the entire KF-GOM pipeline:
- SARIMAX model initialization and training
- Data conversion from BVH motion capture format
- Interactive analysis with progress tracking
- Results visualization and metrics display

### 📊 MovementPredictionPlot
Interactive time series plot showing:
- **Original data** (ground truth)
- **Initial prediction** (first model training)
- **Retrain predictions** (Retrain 1, 2, 3...)
- Interactive legend to show/hide different predictions
- Color-coded visualization for easy comparison

### 📋 KFGOMTable
Interactive data grid displaying:
- SARIMAX analysis results
- Variable coefficients and significance
- Multi-row selection for retraining
- GOM assumption filtering
- Real-time selection state tracking

### 📁 KFGOMFileSelector & KFGOMFileList
File management components for:
- Training and testing file selection
- BVH file loading and validation
- File change detection and automatic re-analysis

## Features

### 🔄 Automatic Re-analysis
- **File changes**: Automatically retrains when train/test files change
- **Parameter changes**: Relaunches analysis when joint/axis changes
- **History management**: Maintains prediction history across changes

### 📈 Prediction History
- Stores all predictions (initial + retrains)
- Tracks parameters and metrics for each prediction
- Provides visual comparison of different models
- Supports retraining with selected variables

### 🎨 Interactive Visualization
- Real-time plot updates
- Responsive design
- Color-coded predictions
- Interactive tooltips and legends

## Usage

```tsx
import { KFGOMAnalysis } from './kfgom'

// Use in your component
<KFGOMAnalysis />
```

## Dependencies
- **ECharts**: For interactive plotting
- **AG-Grid**: For data table display
- **SolidJS**: For reactive state management
- **TensorFlow.js**: For GOM analysis

## File Structure
```
kfgom/
├── components/
│   ├── KFGOMTable.tsx
│   ├── MovementPredictionPlot.tsx
│   ├── KFGOMFileSelector.tsx
│   └── KFGOMFileList.tsx
├── utils/
│   ├── bvhLoader.ts
│   └── gomVariableSelector.ts
├── SARIMAXAnalyzer.js
├── types.ts
├── index.ts
└── README.md
```

## Author
**youssef hergal** - KF-GOM Module Development