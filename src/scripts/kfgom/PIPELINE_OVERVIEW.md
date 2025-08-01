# KF-GOM Analysis Pipeline Overview

## 🎯 What is KF-GOM?

**Kinematic Feature-based Granger Causality with Outlier Management (KF-GOM)** is an advanced motion capture analysis system that uses SARIMAX (Seasonal AutoRegressive Integrated Moving Average with eXogenous variables) modeling to identify causal relationships between joint movements in motion capture data.

## 📊 Complete Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KF-GOM ANALYSIS PIPELINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Data Loading & Validation                            │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   BVH File     │───▶│  Data Validation│───▶│  Error      │ │
│  │   Selection    │    │  & Preprocessing│    │  Handling   │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                                 │
│  STEP 2: Data Conversion & Preprocessing                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Existing BVH   │───▶│  Channel        │───▶│  SARIMAX    │ │
│  │  Processing     │    │  Extraction     │    │  Format     │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                                 │
│  STEP 3: SARIMAX Model Training                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Data Scaling   │───▶│  Model Fitting  │───▶│  Coefficient│ │
│  │  & Normalization│    │  (OLS/MLE/Ridge)│    │  Estimation │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                                 │
│  STEP 4: Performance Metrics Calculation                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Prediction     │───▶│  Metrics        │───▶│  MSE, MAE,  │ │
│  │  Generation     │    │  Computation    │    │  Correlation│ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                                 │
│  STEP 5: Results Visualization & Analysis                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Interactive    │───▶│  Metric Cards   │───▶│  Results    │ │
│  │  UI Components  │    │  & Real-time    │    │  Table      │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Detailed Pipeline Steps

### Step 1: Data Loading & Validation
**Purpose**: Ensure data availability and integrity before analysis

**Process**:
- **File Selection**: Users select training and test BVH files
- **Data Validation**: Check for BVH bones data availability
- **Error Handling**: Provide clear feedback for missing or invalid data
- **State Management**: Update global state with file information

**Key Components**:
- `KFGOMFileSelector` - File selection interface
- `trainFileBones()` / `testFileBones()` - Global state management
- Error handling for missing data scenarios

### Step 2: Data Conversion & Preprocessing
**Purpose**: Convert existing BVH data to SARIMAX-compatible format

**Process**:
- **Channel Extraction**: Extract rotation channels from BVH bones
- **Time Series Creation**: Organize data into time series format
- **Data Structure**: Create channels and motion data arrays
- **Validation**: Ensure data completeness and structure

**Key Functions**:
- `convertExistingBVHData()` - Main conversion function
- Rotation channel filtering (excludes position data)
- Frame-by-frame data extraction

**Data Flow**:
```
BVH Bones → Rotation Channels → Time Series → SARIMAX Format
```

### Step 3: SARIMAX Model Training
**Purpose**: Train SARIMAX model to identify causal relationships

**Process**:
- **Data Scaling**: Normalize data using StandardScaler
- **Model Configuration**: Set target joint, axis, lags, and method
- **Model Fitting**: Train SARIMAX with chosen estimation method
- **Coefficient Estimation**: Calculate model coefficients and significance

**Available Methods**:
- **OLS (Ordinary Least Squares)**: Standard linear regression
- **MLE (Maximum Likelihood Estimation)**: Probabilistic approach
- **Ridge Regression**: Regularized regression for stability

**Model Parameters**:
- `targetJoint`: Joint to analyze (e.g., "Hips", "Spine")
- `targetAxis`: Rotation axis (Xrotation, Yrotation, Zrotation)
- `lags`: Number of previous time steps (default: 2)
- `method`: Estimation method (OLS, MLE, Ridge)

### Step 4: Performance Metrics Calculation
**Purpose**: Evaluate model performance and quality

**Metrics Calculated**:
- **MSE (Mean Squared Error)**: Average squared prediction error
- **MAE (Mean Absolute Error)**: Average absolute prediction error
- **RMSE (Root Mean Squared Error)**: Square root of MSE
- **Correlation**: Pearson correlation between actual and predicted values

**Calculation Process**:
1. Generate predictions using trained model
2. Compare predictions with actual values
3. Calculate performance metrics
4. Store results for UI display

### Step 5: Results Visualization & Analysis
**Purpose**: Present results in an interactive, user-friendly interface

**UI Components**:
- **Progress Tracking**: Real-time analysis progress display
- **Results Summary**: Key parameters and configuration
- **Metric Cards**: Interactive performance metrics
- **Results Table**: Detailed coefficient analysis with filtering

**Interactive Features**:
- **Significance Filtering**: Filter results by statistical significance
- **Method Switching**: Change estimation method and re-analyze
- **Parameter Updates**: Modify target joint/axis and re-run analysis
- **Real-time Updates**: Reactive UI updates based on state changes

## 🎛️ Configuration Options

### Analysis Parameters
```javascript
const config = {
    targetJoint: "Hips",        // Target joint to analyze
    targetAxis: "Xrotation",    // Rotation axis
    lags: 2,                    // Number of lagged values
    method: "ols"               // Estimation method
}
```

### Available Joints
All joints available in the BVH file (dynamically determined)

### Available Axes
- `Xrotation` - Rotation around X-axis
- `Yrotation` - Rotation around Y-axis  
- `Zrotation` - Rotation around Z-axis

### Estimation Methods
- **OLS**: Standard linear regression (recommended for most cases)
- **MLE**: Maximum likelihood estimation (probabilistic approach)
- **Ridge**: Regularized regression (for numerical stability)

## 📈 Results Interpretation

### Model Coefficients
- **Exogenous Variables**: Other joint rotations affecting target
- **Lagged Variables**: Previous values of target joint
- **P-Values**: Statistical significance of each coefficient
- **Significance Codes**: `***` (p<0.001), `**` (p<0.01), `*` (p<0.05)

### Performance Metrics
- **MSE**: Lower values indicate better fit
- **Correlation**: Higher values (closer to 1.0) indicate better prediction
- **RMSE**: Same scale as original data, easier to interpret
- **MAE**: Robust to outliers, absolute error measure

### Causal Relationships
- **Positive Coefficients**: Positive causal relationship
- **Negative Coefficients**: Negative causal relationship
- **Significant Variables**: Joints that significantly affect target
- **Non-significant Variables**: Joints with minimal causal effect

## 🔄 Reactive Analysis System

### Automatic Triggers
1. **Data Availability**: Analysis runs when training data is loaded
2. **Parameter Changes**: Re-analysis when joint/axis selection changes
3. **Method Updates**: Re-analysis when estimation method changes

### Smart Re-analysis Logic
- Only re-runs when parameters actually change
- Prevents unnecessary analysis cycles
- Maintains analysis consistency
- Provides clear progress feedback

## 🛠️ Technical Implementation

### Core Components
- **SARIMAXAnalyzer**: Main analysis engine
- **SARIMAX Model**: Statistical modeling implementation
- **StandardScaler**: Data normalization
- **Metrics Calculator**: Performance evaluation
- **UI Components**: Interactive interface

### State Management
- **Global State**: Analysis results and configuration
- **Reactive Updates**: Automatic UI updates
- **Progress Tracking**: Real-time analysis progress
- **Error Handling**: Comprehensive error management

### Integration Points
- **Existing BVH Pipeline**: Leverages main app's data processing
- **File System**: Integrates with file upload/selection
- **UI Framework**: SolidJS reactive components
- **Data Flow**: Seamless data conversion and analysis

## 🎯 Use Cases

### Motion Analysis
- Identify which joints influence specific movements
- Understand causal relationships in complex motions
- Analyze movement patterns and dependencies

### Biomechanical Research
- Study joint coordination and timing
- Analyze movement efficiency and optimization
- Research injury prevention and rehabilitation

### Animation & Gaming
- Create realistic character animations
- Understand motion dependencies for procedural animation
- Develop motion synthesis algorithms

## 🔍 Troubleshooting

### Common Issues
- **"No BVH data found"**: Ensure training file is loaded
- **"Target angle not found"**: Check joint/axis combination
- **"Matrix inversion failed"**: Try Ridge method or different lags

### Performance Tips
- Use `lags: 2` for most analyses
- Start with `method: "ols"` for best results
- Monitor correlation values for model quality
- Check significance levels for meaningful results

## 📚 References

- **SARIMAX Modeling**: Time series analysis with exogenous variables
- **Granger Causality**: Statistical method for causal inference
- **Motion Capture Analysis**: Biomechanical data processing
- **Statistical Significance**: P-value interpretation and thresholds

---

*This pipeline provides a complete, production-ready implementation of KF-GOM analysis using SARIMAX modeling techniques, integrated with the existing BVH processing pipeline.* 