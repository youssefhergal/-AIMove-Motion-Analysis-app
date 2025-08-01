import { createSignal, createEffect } from "solid-js"
import KFGOMFileList from "./KFGOMFileList"
import { kfgomBVHLoader } from "../utils/bvhLoader"
import { 
	trainFile, 
	setTrainFile, 
	testFile, 
	setTestFile,
	trainFileBones,
	setTrainFileBones,
	testFileBones,
	setTestFileBones
} from "../../store"

export default function KFGOMFileSelector() {
	const [trainFileName, setTrainFileName] = createSignal("No file selected")
	const [testFileName, setTestFileName] = createSignal("No file selected")

	// Handle train file selection from repository
	const handleTrainFileSelect = async (fileName) => {
		console.log(`🔄 Selecting training file: ${fileName}`)
		setTrainFileName(fileName)
		
		try {
			// Load file independently using KF-GOM loader
			const file_path = "bvh2/" + fileName
			const result = await kfgomBVHLoader.loadBVHFile(file_path)
			
			// Validate the BVH structure
			if (kfgomBVHLoader.validateBVHStructure(result)) {
				const bonesData = kfgomBVHLoader.extractBonesData(result)
				setTrainFileBones(bonesData)
				console.log(`✅ Training file loaded: ${fileName} with ${bonesData.length} bones`)
				console.log(`📊 Train file bones signal updated: ${trainFileBones().length} bones`)
			} else {
				console.error(`❌ Failed to load training file: ${fileName} - Invalid BVH structure`)
			}
		} catch (error) {
			console.error(`❌ Error loading training file: ${fileName}`, error)
		}
	}

	// Handle test file selection from repository
	const handleTestFileSelect = async (fileName) => {
		console.log(`🔄 Selecting testing file: ${fileName}`)
		setTestFileName(fileName)
		
		try {
			// Load file independently using KF-GOM loader
			const file_path = "bvh2/" + fileName
			const result = await kfgomBVHLoader.loadBVHFile(file_path)
			
			// Validate the BVH structure
			if (kfgomBVHLoader.validateBVHStructure(result)) {
				const bonesData = kfgomBVHLoader.extractBonesData(result)
				setTestFileBones(bonesData)
				console.log(`✅ Testing file loaded: ${fileName} with ${bonesData.length} bones`)
				console.log(`📊 Test file bones signal updated: ${testFileBones().length} bones`)
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
			"border-radius": "6px",
			"margin-bottom": "15px"
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
						</div>
						<div style={{ 
							"font-size": "10px", 
							color: "#1976d2", 
							"font-weight": "bold",
							"margin-top": "6px"
						}}>
							{trainFileName()}
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
						</div>
						<div style={{ 
							"font-size": "10px", 
							color: "#c2185b", 
							"font-weight": "bold",
							"margin-top": "6px"
						}}>
							{testFileName()}
						</div>
					</div>
				</div>
			</div>

			{/* Status Summary */}
			<div style={{ 
				padding: "8px", 
				"background-color": "#fff", 
				"border-radius": "4px",
				"font-size": "11px",
				"margin-top": "10px",
				"border": "1px solid #e0e0e0"
			}}>
				<div style={{ display: "flex", gap: "15px", "flex-wrap": "wrap" }}>
					<div>
						<strong style={{ color: "#1976d2" }}>Train:</strong> {trainFileBones().length > 0 ? `${trainFileBones().length} bones` : "No data"}
					</div>
					<div>
						<strong style={{ color: "#c2185b" }}>Test:</strong> {testFileBones().length > 0 ? `${testFileBones().length} bones` : "No data"}
					</div>
					<div style={{ color: "#666" }}>
						{trainFileBones().length > 0 && testFileBones().length > 0 ? 
							"✅ Ready for analysis" : 
							trainFileBones().length > 0 ? 
								"⏳ Select testing file" : 
								"⏳ Select training file"
						}
					</div>
				</div>
			</div>
		</div>
	)
} 