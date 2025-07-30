# KF-GOM (SARIMAX) Module

This module contains the complete Kalman Filter - Gesture Operational Model (KF-GOM) implementation using SARIMAX (Seasonal Autoregressive Integrated Moving Average with Exogenous variables).

## 📁 Folder Structure

```
kfgom/
├── core/                    # Core SARIMAX classes
│   ├── SARIMAX.js         # Main SARIMAX model implementation
│   └── StandardScaler.js  # Data normalization utility
├── utils/                  # Utility functions
│   ├── bvhParser.js       # BVH data extraction and preparation
│   ├── metrics.js         # Performance metrics (MSE, MAE, UTheil, etc.)
│   └── forecasting.js     # Static forecasting method
├── components/            # UI components
│   └── KFGOMTable.tsx    # Results table component
├── SARIMAXAnalyzer.js    # Main orchestrator class
├── index.js              # Module exports
└── README.md            # This file
```

## 🚀 Key Features

### **One-Shot Learning**
- Uses the same BVH file for both training and testing
- Perfect for gesture analysis where you want to analyze a single motion sequence

### **Multiple Estimation Methods**
- **OLS** (Ordinary Least Squares) - Default method
- **MLE** (Maximum Likelihood Estimation)
- **Ridge** (L2 Regularization)

### **Forecasting**
- **Static forecasting** (one-step-ahead predictions)
- **95% confidence intervals** (fixed)

### **Advanced Features**
- **Lags = 2** (configurable)
- **Confidence Intervals** (95% default)
- **Comprehensive Metrics** (MSE, MAE, UTheil, Correlation, R²)

## 📊 Usage

### Basic Import
```javascript
import { SARIMAXAnalyzer, KFGOMTable } from './kfgom/index.js'
```

### Running Analysis
```javascript
// Initialize analyzer
const analyzer = new SARIMAXAnalyzer()

// Set data (one-shot: same data for train and test)
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

### UI Integration
```jsx
// Results table component
<KFGOMTable />
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

### Available Joints (19 predefined joints)
- `Spine`, `Spine1`, `Spine2`, `Spine3`, `Hips`
- `Neck`, `Head`
- `LeftArm`, `LeftForeArm`, `RightArm`, `RightForeArm`
- `LeftShoulder`, `LeftShoulder2`, `RightShoulder`, `RightShoulder2`
- `LeftUpLeg`, `LeftLeg`, `RightUpLeg`, `RightLeg`

**Total: 19 joints × 3 axes = 57 channels**

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

## 🔄 Model Retraining

```javascript
// Retrain model without specific variables
const retrainResult = await analyzer.retrainModelWithoutVariables(
    ['Spine_Xrotation', 'LeftArm_Xrotation'], // Variables to remove
    config,
    progressCallback
)
```

## 📋 Dependencies

- `mathjs` - Mathematical operations
- `ag-grid-community` - Data table component
- `solid-js` - Reactive framework

## 🎯 Example Workflow

1. **Load BVH File** - Upload motion capture data
2. **Select Target** - Choose joint and axis to analyze
3. **Run Analysis** - Click "Run SARIMAX Analysis" button
4. **View Results** - Check table for coefficients and significance
5. **Interpret** - Analyze p-values and correlation metrics

## 🔍 Troubleshooting

### Common Issues
- **"No BVH data found"** - Make sure a BVH file is loaded
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
1. **BVH Extraction** → Extract motion data from scene
2. **Data Preparation** → Normalize and structure for SARIMAX
3. **Model Training** → Fit SARIMAX model with chosen method
4. **Forecasting** → Generate predictions with confidence intervals
5. **Metrics Calculation** → Compute performance metrics
6. **Results Display** → Show in interactive table

This module provides a complete, production-ready implementation of KF-GOM analysis using SARIMAX modeling techniques. 