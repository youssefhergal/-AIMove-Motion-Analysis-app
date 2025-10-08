# Vite Solis TS V5 - Advanced Skeleton Analysis & Movement Prediction Platform

## 🚀 Project Overview

This is an advanced 3D skeleton analysis and movement prediction platform built with **Solid.js**, **Three.js**, and **TypeScript**. The application provides comprehensive tools for analyzing human movement data, implementing KF-GOM (Kalman Filter - Gesture Operational Model) predictions, and visualizing complex biomechanical data.

## ✨ Key Features

- **🎯 Multi-Skeleton Rendering** - Optimized individual skeleton management system
- **📊 KF-GOM Analysis** - Advanced SARIMAX modeling for movement prediction
- **🔍 Variable Selection** - Interactive variable selection and model retraining
- **🎛️ GOM Assumptions** - Biomechanical filtering based on gesture operational models
- **📈 Real-time Visualization** - Interactive 2D/3D plots and movement predictions
- **🔄 Auto-Training** - Intelligent model retraining with selected variables
- **📁 File Management** - Support for both repository and uploaded BVH files
- **🎨 Modern UI/UX** - Responsive design with accessible components

## 🏗️ Technical Architecture

### Core Technologies
- **Solid.js** - Reactive UI framework with TypeScript
- **Three.js** - 3D graphics and skeleton rendering
- **ECharts** - Advanced data visualization
- **AG-Grid** - High-performance data tables
- **Ark UI** - Accessible component library

### Key Design Patterns
- **Reactive Programming** - Using Solid.js signals for state management
- **Component Composition** - Modular, reusable components
- **Performance Optimization** - Individual skeleton management and efficient rendering

## 📚 Documentation

This project includes comprehensive documentation for all major features:

### 📖 Complete Feature Documentation

1. **[KF-GOM Documentation](KF-GOM_Documentation.md)**
   - Complete SARIMAX analysis system
   - Movement prediction algorithms
   - Component architecture and API reference
   - Usage examples and troubleshooting

2. **[Variable Selection Documentation](VARIABLE_SELECTION_DOCUMENTATION.md)**
   - Interactive variable selection system
   - GOM assumption filtering
   - Model retraining workflows
   - Advanced filtering and selection features

3. **[Skeleton Rendering Optimization Documentation](Skeleton_Rendering_Optimization_Documentation.md)**
   - Performance optimization details
   - Individual skeleton management system
   - Memory management and resource cleanup
   - Before/after performance comparisons

### 🎯 Quick Start Guide

1. **Installation**
   ```bash
   npm install
   npm run dev
   ```

2. **Basic Usage**
   - Upload or select BVH files from repository
   - Configure analysis parameters
   - Run KF-GOM analysis
   - Select variables for retraining
   - Visualize results in interactive plots

3. **Advanced Features**
   - Apply GOM assumption filters
   - Use significance-based filtering
   - Perform multi-variable selection
   - Enable auto-training for real-time updates

## 🚀 Performance Highlights

- ⚡ **90% faster** skeleton operations through individual management
- 🧠 **60% reduced** memory usage with optimized rendering
- 🔄 **Smooth 60fps** UI interactions
- 📈 **Real-time** plot updates and analysis

## 🎯 Key Components

### Analysis System
- **KFGOMAnalysis.tsx** - Main analysis orchestrator
- **KFGOMTable.tsx** - Interactive results table with variable selection
- **MovementPredictionPlot.tsx** - Advanced visualization component

### Rendering System
- **SkeletonViewer.js** - Individual skeleton management
- **useSceneSetup.tsx** - Optimized scene management
- **BaseScene.js** - 3D scene foundation

### File Management
- **BVH Loader** - Custom BVH file processing
- **File Selector** - Repository and upload integration
- **Structure Detection** - Automatic structure change detection

## 🔧 Development

### Prerequisites
- Node.js 18+
- TypeScript knowledge
- Solid.js framework familiarity

### Project Structure
```
src/
├── scripts/
│   ├── kfgom/                 # KF-GOM analysis module
│   │   ├── components/        # UI components
│   │   ├── utils/            # Utility functions
│   │   └── types.ts          # TypeScript definitions
│   ├── stores/               # State management
│   ├── utils/                # Shared utilities
│   └── components/           # Main UI components
├── App.css                   # Global styles
└── index.tsx                 # Application entry point
```

### Key Development Files
- **Store Management**: `src/scripts/stores/`
- **KF-GOM Components**: `src/scripts/kfgom/components/`
- **3D Rendering**: `src/scripts/SkeletonViewer.js`
- **Scene Setup**: `src/scripts/useSceneSetup.tsx`

## 📊 Usage Examples

### Running Analysis
```typescript
// Basic KF-GOM analysis
const analyzer = new KFGOMAnalyzer(trainData, testData)
const results = await analyzer.analyze({
    targetJoint: 'Hips',
    method: 'sarimax',
    lags: 3,
    forecastSteps: 10
})
```

### Variable Selection
```typescript
// Select variables for retraining
const selectedVariables = ['LeftHip', 'RightHip', 'Spine']
const retrainedModel = await retrainWithSelectedVariables(selectedVariables)
```

### Skeleton Management
```typescript
// Add skeleton individually (optimized)
const viewer = new SkeletonViewer(scene, color)
await viewer.loadSkeletonFromContent(fileContent)

// Toggle visibility without reloading
viewer.setVisible(false)
```

## 🔍 Troubleshooting

For detailed troubleshooting guides, please refer to the specific documentation:

- **KF-GOM Issues**: See [KF-GOM Documentation](KF-GOM_Documentation.md#troubleshooting)
- **Variable Selection Problems**: See [Variable Selection Documentation](VARIABLE_SELECTION_DOCUMENTATION.md#troubleshooting)
- **Rendering Performance**: See [Skeleton Rendering Documentation](Skeleton_Rendering_Optimization_Documentation.md#troubleshooting-guide)

## 🚀 Future Enhancements

### Planned Features
- 🔄 Real-time collaboration for multi-user analysis
- 📱 Mobile app version
- 🤖 AI-powered movement analysis
- 📊 Advanced statistical visualizations
- 🔗 API integration for external data sources

### Technical Improvements
- 🧹 Code cleanup and refactoring
- 📚 Documentation expansion
- 🧪 Test coverage improvement
- ⚡ Performance monitoring

## 👥 Contributing

This project was developed by **Youssef Hergal** as part of advanced biomechanical analysis research. The codebase demonstrates modern web development practices with a focus on performance, usability, and maintainability.

For detailed implementation information, please refer to the comprehensive documentation files included in this repository.

## 📄 License

This project is proprietary software developed for research purposes. All rights reserved.

---

## 📚 Documentation Quick Reference

| Feature | Documentation | Description |
|---------|---------------|-------------|
| **KF-GOM Analysis** | [KF-GOM_Documentation.md](KF-GOM_Documentation.md) | Complete SARIMAX analysis system with movement prediction |
| **Variable Selection** | [VARIABLE_SELECTION_DOCUMENTATION.md](VARIABLE_SELECTION_DOCUMENTATION.md) | Interactive variable selection and model retraining |
| **Skeleton Rendering** | [Skeleton_Rendering_Optimization_Documentation.md](Skeleton_Rendering_Optimization_Documentation.md) | Performance optimization and individual skeleton management |

---

*Last updated: sep 2025*  
*Version: 5.0.0*  
*Author: Youssef Hergal*