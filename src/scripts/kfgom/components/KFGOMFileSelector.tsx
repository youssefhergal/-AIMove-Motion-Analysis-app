import { createEffect } from "solid-js"
import KFGOMFileList from "./KFGOMFileList"
import { kfgomBVHLoader } from "../utils/bvhLoader"
import { 
	trainFileBones,
	setTrainFileBones,
	testFileBones,
	setTestFileBones,
	trainFile,
	setTrainFile,
	testFile,
	setTestFile
} from "../../stores/store"

export default function KFGOMFileSelector() {
	// Use global store signals for file names instead of local signals
	const trainFileName = () => trainFile() || "No file selected"
	const testFileName = () => testFile() || "No file selected"

	// Sync file names with bones data when switching modes
	createEffect(() => {
		// If we have bones data but no file name, set a default
		if (trainFileBones().length > 0 && !trainFile()) {
			setTrainFile("File loaded")
		}
		
		if (testFileBones().length > 0 && !testFile()) {
			setTestFile("File loaded")
		}
	})

	// Handle train file selection from repository
	const handleTrainFileSelect = async (fileName) => {
		setTrainFile(fileName)
		
		try {
			const file_path = "bvh2/" + fileName
			const result = await kfgomBVHLoader.loadBVHFile(file_path)
			
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

	// Handle test file selection from repository
	const handleTestFileSelect = async (fileName) => {
		setTestFile(fileName)
		
		try {
			const file_path = "bvh2/" + fileName
			const result = await kfgomBVHLoader.loadBVHFile(file_path)
			
			if (kfgomBVHLoader.validateBVHStructure(result)) {
				const bonesData = kfgomBVHLoader.extractBonesData(result)
				setTestFileBones(bonesData)
				console.log(`✅ Testing file loaded: ${fileName} with ${bonesData.length} bones`)
			} else {
				console.error(`❌ Failed to load testing file: ${fileName} - Invalid BVH structure`)
			}
		} catch (error) {
			console.error(`❌ Error loading testing file: ${fileName}`, error)
		}
	}

	return (
		<div style={{ 
			padding: "12px", 
			"background-color": "#f5f5f5",
			"border-radius": "6px"
		}}>
			<div style={{ 
				display: "flex", 
				gap: "15px",
				"align-items": "flex-start"
			}}>
				{/* Training File Selection */}
				<div style={{ flex: 1 }}>
					<div style={{ 
						"background-color": "#e3f2fd", 
						padding: "10px",
						"border-radius": "4px",
						"border-left": "3px solid #2196f3"
					}}>
						<div style={{ 
							"margin-bottom": "6px",
							display: "flex",
							"align-items": "center",
							gap: "8px"
						}}>
							<div style={{ 
								"font-size": "12px",
								color: "#1976d2",
								"font-weight": "bold",
								"white-space": "nowrap"
							}}>
								Training:
							</div>
							<div style={{ flex: 1 }}>
								<KFGOMFileList 
									onFileSelect={handleTrainFileSelect}
									selectedFile={trainFileName()}
									placeholder="Choose training file..."
								/>
							</div>
							<div style={{ 
								"font-size": "11px", 
								color: "#1976d2", 
								"font-weight": "bold",
								"white-space": "nowrap"
							}}>
								<strong>Train:</strong> {trainFileBones().length > 0 ? `${trainFileBones().length} bones` : "No data"}
							</div>
						</div>
					</div>
				</div>

				{/* Testing File Selection */}
				<div style={{ flex: 1 }}>
					<div style={{ 
						"background-color": "#fce4ec", 
						padding: "10px",
						"border-radius": "4px",
						"border-left": "3px solid #e91e63"
					}}>
						<div style={{ 
							"margin-bottom": "6px",
							display: "flex",
							"align-items": "center",
							gap: "8px"
						}}>
							<div style={{ 
								"font-size": "12px",
								color: "#c2185b",
								"font-weight": "bold",
								"white-space": "nowrap"
							}}>
								Testing:
							</div>
							<div style={{ flex: 1 }}>
								<KFGOMFileList 
									onFileSelect={handleTestFileSelect}
									selectedFile={testFileName()}
									placeholder="Choose testing file..."
								/>
							</div>
							<div style={{ 
								"font-size": "11px", 
								color: "#c2185b", 
								"font-weight": "bold",
								"white-space": "nowrap"
							}}>
								<strong>Test:</strong> {testFileBones().length > 0 ? `${testFileBones().length} bones` : "No data"}
							</div>
						</div>
					</div>
				</div>
			</div>

		</div>
	)
} 