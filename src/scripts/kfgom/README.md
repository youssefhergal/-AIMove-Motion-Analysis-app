# KF-GOM Analysis Module

Kinematic Feature-based Granger Causality with Outlier Management (KF-GOM) analysis using SARIMAX modeling.

## 📁 Structure

```
kfgom/
├── core/
│   ├── SARIMAX.js          # SARIMAX model implementation
│   └── StandardScaler.js   # Data normalization
├── utils/
│   ├── metrics.js          # Performance metrics calculation
│   └── forecasting.js      # Forecasting utilities
├── components/
│   └── KFGOMTable.tsx     # Results table component
├── SARIMAXAnalyzer.js      # Main analyzer class
└── index.js               # Module exports
```

## 🔧 Integration

This module integrates with the existing BVH processing pipeline:

- **Uses existing BVH data**: Leverages `rawSkeletenBones` from the main app
- **No duplicate processing**: Converts existing processed data to SARIMAX format
- **Seamless integration**: Works with the main app's file upload/selection system

## 🎯 Usage

```javascript
import { SARIMAXAnalyzer } from './kfgom/SARIMAXAnalyzer.js'

// Create analyzer
const analyzer = new SARIMAXAnalyzer()

// Set data (uses existing BVH processing)
analyzer.setData(bvhData, bvhData)

// Run analysis
const config = {
    targetJoint: "Hips",
    targetAxis: "Xrotation",
    lags: 2,
    method: "ols"
}

const result = await analyzer.analyze(config, (progress, message) => {
    console.log(`Progress: ${progress}% - ${message}`)
})
```

## 🔧 Configuration

### SARIMAX Config
```javascript
const config = {
    targetJoint: "Hips",        // Target joint to analyze
    targetAxis: "Xrotation",    // Target axis (Xrotation, Yrotation, Zrotation)
    lags: 2,                    // Number of lagged values
    method: "ols"               // Estimation method: "ols", "mle", "ridge"
}
```

### Available Joints
Uses all joints available in the BVH file (not limited to predefined set)

### Available Axes
- `Xrotation`, `Yrotation`, `Zrotation`

## 📈 Results

### Model Summary
- **Coefficients**: Model parameters for each variable
- **P-Values**: Statistical significance
- **Significance Codes**: `***` (p<0.001), `**` (p<0.01), `*` (p<0.05), `.` (p<0.1)

### Performance Metrics
- **MSE** (Mean Squared Error)
- **MAE** (Mean Absolute Error)
- **UTheil** (Theil's U statistic)
- **Correlation** (Pearson correlation)
- **R²** (Coefficient of determination)

## 🔄 Data Flow

1. **Main App**: Loads BVH file → Processes → Stores in `rawSkeletenBones`
2. **KF-GOM**: Converts existing data → SARIMAX format → Analysis
3. **Results**: Displayed in interactive table with filtering

## 📋 Dependencies

- `mathjs` - Mathematical operations
- `ag-grid-community` - Data table component
- `solid-js` - Reactive framework

## 🎯 Example Workflow

1. **Load BVH File** - Upload motion capture data (uses existing system)
2. **Select Target** - Choose joint and axis to analyze
3. **Run Analysis** - Click "Run SARIMAX Analysis" button
4. **View Results** - Check table for coefficients and significance
5. **Filter Results** - Use significance filter to focus on important variables

## 🔍 Troubleshooting

### Common Issues
- **"No BVH data found"** - Make sure a BVH file is loaded via main app
- **"Target angle not found"** - Check joint/axis combination
- **"Matrix inversion failed"** - Try Ridge method or different lags

### Performance Tips
- Use `lags: 2` for most analyses
- Start with `method: "ols"` for best results
- Monitor correlation values for model quality

## 📚 Technical Details

### SARIMAX Model
The model implements:
- **Autoregressive (AR)** components with configurable lags
- **Exogenous variables** from other joint angles
- **Multiple estimation methods** (OLS, MLE, Ridge)
- **Confidence intervals** for predictions

### Data Flow
1. **Existing BVH Processing** → Main app processes BVH data
2. **Data Conversion** → Convert to SARIMAX format
3. **Model Training** → Fit SARIMAX model with chosen method
4. **Forecasting** → Generate predictions with confidence intervals
5. **Metrics Calculation** → Compute performance metrics
6. **Results Display** → Show in interactive table

This module provides a complete, production-ready implementation of KF-GOM analysis using SARIMAX modeling techniques, integrated with the existing BVH processing pipeline. 