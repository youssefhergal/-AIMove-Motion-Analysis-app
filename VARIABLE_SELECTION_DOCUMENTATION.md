# Variable Selection Feature Documentation

## 🎯 Feature Overview
The Variable Selection feature allows users to select specific variables from SARIMAX analysis results and retrain the model using only those selected variables. It integrates with GOM assumptions and significance filtering.

## 🔄 Complete User Flow & Function Calls

### **Phase 1: Initial Analysis**
```
1. "Dexterity Analysis" button
   ↓
2. KFGOMAnalysis.tsx: runAnalysis() function called
   ↓
3. SARIMAX analysis runs → results stored in sarimaxResults signal
   ↓
4. KFGOMTable.tsx: createEffect() triggered by SARIMAX results change
   ↓
5. convertSARIMAXToTableData() converts results to table format
   ↓
6. setKfgomData() stores table data
   ↓
7. createEffect() for filtering triggered
```

### **Phase 2: GOM & Significance Filtering**
```
8. filterDataByGOMAssumption() applies GOM filtering based on active tab
   ↓
9. gomSelector.selectVariablesByAssumption() filters by GOM assumption
   ↓
10. filterDataBySignificance() applies significance filter
   ↓
11. setFilteredData() and setSelectedJoints() update state
   ↓
12. AG-Grid displays filtered data with checkboxes
```

### **Phase 3: Variable Selection**
```
13. USER selects variables using checkboxes
   ↓
14. handleJointSelection() updates selectedJoints state
   ↓
15. selectedJoints exposed globally via (window as any).selectedJoints
```

### **Phase 4: Model Retraining**
```
16. USER clicks "Retrain with Selected" button
   ↓
17. retrainWithSelectedVariables() function called
   ↓
18. Reads (window as any).selectedJoints for selected variables
   ↓
19. filterDataForSelectedVariables() filters BVH data
   ↓
20. analyzer.analyze() retrains model with selected variables
   ↓
21. New results displayed in table and charts
```

## 📁 Key Files & Functions

### **1. KFGOMAnalysis.tsx**
- **`runAnalysis()`** - Initial SARIMAX analysis
- **`retrainWithSelectedVariables()`** - Retraining with selected variables

### **2. KFGOMTable.tsx**
- **`filterDataByGOMAssumption()`** - GOM assumption filtering
- **`filterDataBySignificance()`** - Significance filtering
- **`handleJointSelection()`** - Individual checkbox handling

### **3. gomVariableSelector.ts**
- **`selectVariablesByAssumption()`** - Core GOM filtering logic
- **`applyTransitioningAssumption()`** - Autoregressive filtering
- **`applyIntraJointXY()`** - Same joint, different axes
- **`applyInterLimbSynergies()`** - Opposite side, same joint type

### **4. store.js**
- **`selectedAssumptionsIndex`** - Active GOM tab (0, 2, 4, 6, 8, 10, 12)
- **`kfgomFilters`** - Significance filter state ('all', 'significant', 'non-significant')
- **`sarimaxResults`** - Analysis results and target joint
- **`sarimaxConfig`** - Analysis configuration

### **5. ToggleGroupAssumptions.tsx**
- **Updates `selectedAssumptionsIndex`** when tabs are clicked

## 🎛️ GOM Assumption Mapping

| Tab Index | Tab Name | Assumption Index | Function | Description |
|-----------|----------|------------------|----------|-------------|
| 0 | GOM | 0 | None | Show all joints |
| 2 | Transitioning | 2 | `applyTransitioningAssumption` | Same joint-axis (autoregressive) |
| 4 | Intra-joint association | 3 | `applyIntraJointXY` | Same joint, different axes |
| 6 | Inter-limb synergy | 4 | `applyInterLimbSynergies` | Opposite side, same joint type |
| 8 | Serial intra-limb mediation | 0 | None | Show all joints (not implemented) |
| 10 | Non-serial intra-limb mediation | 0 | None | Show all joints (not implemented) |
| 12 | All assumptions statistics | 0 | None | Show all joints (not implemented) |

## 🔍 Significance Filtering

- **`'all'`** - Shows all variables after GOM filtering, but selects none
- **`'significant'`** - Shows only variables with significance: `***`, `**`, `*`
- **`'non-significant'`** - Shows only variables with significance: `.`, `~`

## 📊 Data Flow Architecture

```
SARIMAX Results → Table Data → GOM Filter → Significance Filter → Display
     ↓              ↓           ↓           ↓              ↓
sarimaxResults → kfgomData → gomFiltered → finalFiltered → AG-Grid
     ↓              ↓           ↓           ↓              ↓
  Target Joint → Joint Names → Selected → Selected → Checkboxes
```

## 🚨 Error Handling

### **No Variables Selected for Retraining**
- Shows user-friendly alert with step-by-step instructions
- Prevents silent failures
- Guides user through the selection process

### **Missing Analysis Data**
- Checks for analyzer, train data, and test data
- Throws descriptive error messages
- Ensures proper setup before retraining

## 🔧 Technical Implementation Details

### **Global State Exposure**
```typescript
// KFGOMTable.tsx exposes selectedJoints globally
(window as any).selectedJoints = () => newSet

// KFGOMAnalysis.tsx reads selectedJoints globally
const selectedJoints = (window as any).selectedJoints
const selectedJointArray = selectedJoints ? Array.from(selectedJoints()) : []
```

### **Signal-Based Reactivity**
- Uses Solid.js signals for state management
- Automatic updates when dependencies change
- Efficient re-rendering of components

### **AG-Grid Integration**
- Custom cell renderers for checkboxes
- Real-time selection state updates
- Automatic grid refresh on data changes

## 📝 Logging Strategy

### **Essential Logs Kept:**
- **GOM Filter Applied** - Shows assumption, target, input/output counts
- **Significance Filter Applied** - Shows filter type and counts
- **Table Updated** - Shows assumption, significance, total, filtered, selected counts
- **Variable Selection** - Shows individual selection actions and total count
- **SARIMAX Results Loaded** - Shows target and variable count
- **Retraining Progress** - Shows retraining status and variable count

### **Logs Removed:**
- Excessive debugging information
- Verbose data dumps
- Redundant state tracking
- Unnecessary intermediate calculations

## 🎯 User Experience Features

1. **Clear Visual Feedback** - Checkboxes show selection state
2. **Smart Filtering** - GOM + significance filters work together
3. **Intuitive Controls** - Easy variable selection and deselection
4. **Helpful Error Messages** - Clear guidance when things go wrong
5. **Real-time Updates** - Immediate feedback on all actions

## 🚀 Future Enhancements

1. **Select All Checkbox** - In column header for bulk selection
2. **Advanced GOM Assumptions** - Serial and non-serial mediation
3. **Selection Persistence** - Remember selections across sessions
4. **Bulk Operations** - Select by significance level, joint type, etc.
5. **Export Selections** - Save/load variable selection sets
