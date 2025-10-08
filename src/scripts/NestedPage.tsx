import { createEffect, onMount, createSignal } from "solid-js"
import { initializeWhenLoaded } from "./useSceneSetup"
import {
	setSelectedBVH,
	selectedBVH,
	skeletonsArray,
	setSkeletonsArray,
	uploadOutput,
	setUploadOutput,
	setIsBVHdefault,
	currentImportMode,
	setCurrentImportMode,
	openAlert,
	setOpenAlert,
	// Added by Youssef Hergal - Import new signals and functions 
	selectedBVHList,
	setSelectedBVHList,
	bvHVisibilityMap,
	setBVHVisibilityMap,
	initializeSkeletonArray,
	// Structure change dialog
	showStructureChangeDialog,
	setShowStructureChangeDialog,
	dialogFileName,
	setDialogFileName,
	pendingUploadedFiles,
	setPendingUploadedFiles,
	skeletonViewersSig,
	hasStructureChanged,
	setHasStructureChanged
} from "./stores/store" // Import shared state

// Added by Youssef Hergal - Simple file management component - 
function FileManagementCard() {
	const bvhFiles = [
		"GBBSS01G03R01.bvh", "GBBSS01G03R02.bvh", "GBBSS01G03R03.bvh",
		"GBBSS01G03R04.bvh", "GBBSS01G03R05.bvh", "MCEAS02G01R01.bvh",
		"MCEAS02G01R02.bvh", "MCEAS02G01R03.bvh", "PLNS01P02R05.bvh",
		"PLNS02P03R02.bvh", "S4P07R1.bvh", "S4P07R2.bvh", "S4P07R3.bvh",
		"SWMLS01G01R01.bvh", "SWMLS01G01R02.bvh", "Test_Bending.bvh",
		"Test_Glassblowing.bvh", "Train_Bending.bvh", "Train_Glassblowing.bvh",
		"TV_S01P01R13.bvh", "TVBS01P01R02.bvh", "TVBS01P02R07.bvh", "TVBS01P03R09.bvh"
	]

	const [selectedFileNames, setSelectedFileNames] = createSignal("No file chosen")

	const handleFileUpload = async (event) => {
		const files = Array.from(event.target.files)
		if (files.length > 0) {
			const fileNames = files.map((f: File) => f.name).join(", ")
			setSelectedFileNames(fileNames)
		} else {
			setSelectedFileNames("No file chosen")
		}
		
		// Store all uploaded files for potential structure change
		const uploadedFiles = []
		for (const file of files) {
			try {
				console.log(`📁 Processing file: ${(file as File).name}`)
				console.log(`📁 File size: ${(file as File).size} bytes`)
				console.log(`📁 File type: ${(file as File).type}`)
				
				const fileContent = await (file as File).text()
				console.log(`📁 File content length: ${fileContent.length} characters`)
				console.log(`📁 First 100 chars: ${fileContent.substring(0, 100)}`)
				
				uploadedFiles.push({
					name: (file as File).name,
					content: fileContent
				})
			} catch (error) {
				console.error(`❌ Error reading file ${(file as File).name}:`, error)
			}
		}
		
		// Store all uploaded files
		setPendingUploadedFiles(uploadedFiles)
		
		// Process only the first file for structure detection
		if (uploadedFiles.length > 0) {
			const firstFile = uploadedFiles[0]
			await addBVH(firstFile.name, firstFile.content)
		}
	}

	const handleSelectFile = async (fileName) => {
		if (fileName) {
			// Reset structure changed flag when selecting from repository
			setHasStructureChanged(false)
			await addBVH(fileName)
		}
	}

	const removeFile = (fileName) => {
		removeBVH(fileName)
	}

	// Added by Youssef Hergal - Structure detection function
	// FUNCTIONALITY: Compares bone count between uploaded file and existing files
	// WHY: Simple and reliable method to detect structure changes
	// PERFORMANCE: Fast comparison using bone count only
	const detectStructureChange = async (fileName, fileContent) => {
		try {
			// Get existing skeleton viewers to compare structure
			const existingViewers = skeletonViewersSig()
			if (existingViewers.length === 0) {
				// No existing files, so no structure change
				console.log(`🔍 No existing files - no structure change`)
				return false
			}
			
			// Get bone count from first existing skeleton
			const firstViewer = existingViewers[0]
			const existingBoneCount = firstViewer.boneIndex ? Object.keys(firstViewer.boneIndex).length : 0
			
			console.log(`🔍 EXISTING BONE COUNT: ${existingBoneCount}`)
			
			// Use the file content directly (already uploaded)
			const bvhContent = fileContent
			
			// Debug: show first 30 lines of uploaded file to understand format
			console.log(`🔍 DEBUG - First 30 lines of uploaded file:`)
			const lines = bvhContent.split('\n').slice(0, 30)
			lines.forEach((line, index) => {
				console.log(`  Line ${index + 1}: ${line.trim()}`)
			})
			
			// Count bones in uploaded file - try multiple patterns
			let jointMatches = bvhContent.match(/JOINT\s+\w+/g)
			if (!jointMatches) {
				// Try alternative patterns
				jointMatches = bvhContent.match(/JOINT\s+[A-Za-z0-9_]+/g)
			}
			if (!jointMatches) {
				// Try even more flexible pattern
				jointMatches = bvhContent.match(/JOINT\s+[^\s\n\r]+/g)
			}
			if (!jointMatches) {
				// Try without spaces
				jointMatches = bvhContent.match(/JOINT[A-Za-z0-9_]+/g)
			}
			
			const uploadedBoneCount = jointMatches ? jointMatches.length : 0
			
			console.log(`🔍 UPLOADED BONE COUNT: ${uploadedBoneCount}`)
			if (jointMatches) {
				console.log(`🔍 FOUND JOINTS: ${jointMatches.slice(0, 5).join(', ')}${jointMatches.length > 5 ? '...' : ''}`)
			}
			
			// Calculate difference
			const boneCountDifference = Math.abs(existingBoneCount - uploadedBoneCount)
			const differencePercentage = (boneCountDifference / existingBoneCount) * 100
			
			console.log(`🔍 BONE COUNT DIFFERENCE: ${boneCountDifference} (${differencePercentage.toFixed(1)}%)`)
			
			// Consider it a structure change if difference is significant
			// Allow 5% difference threshold (only significant differences trigger structure change)
			const isStructureChange = differencePercentage > 5
			
			if (isStructureChange) {
				console.log(`⚠️ STRUCTURE CHANGE DETECTED - Difference too large: ${differencePercentage.toFixed(1)}%`)
			} else {
				console.log(`✅ SAME STRUCTURE - Difference acceptable: ${differencePercentage.toFixed(1)}%`)
			}
			
			return isStructureChange
		} catch (error) {
			console.error(`❌ Error detecting structure change for ${fileName}:`, error)
			// If we can't detect, assume it's a different structure to be safe
			return true
		}
	}

	// Added by Youssef Hergal - Add BVH file to selection and 3D scene - 
	// FUNCTIONALITY: Adds a BVH file to both the selection list and 3D skeleton array
	// WHY: Ensures both UI state and 3D rendering are synchronized
	// PERFORMANCE: Updates both arrays in one operation to maintain consistency
		const addBVH = async (fileName, fileContent = null) => {
		const currentList = selectedBVHList()
		if (!currentList.includes(fileName)) {
			// Check if this is an uploaded file (not from repository)
			const isUploadedFile = !fileName.startsWith('bvh2/') && !fileName.includes('/')
			
			if (isUploadedFile) {
				// For uploaded files, test structure compatibility
				console.log(`🔄 Detected uploaded file: ${fileName}`)
				console.log(`🔄 File content received: ${fileContent ? 'YES' : 'NO'}`)
				console.log(`🔄 File content length: ${fileContent ? fileContent.length : 'N/A'}`)
				
				// Check if this is a real upload (with content) or selection from list
				if (fileContent) {
					// Real uploaded file with content - test structure
					const hasStructureChange = await detectStructureChange(fileName, fileContent)
					
					if (hasStructureChange) {
						// Different structure - show confirmation modal
						console.log(`⚠️ Structure change detected for: ${fileName}`)
						setDialogFileName(fileName)
						setShowStructureChangeDialog(true)
						return
					} else {
						// Same structure - add directly without modal
						console.log(`✅ Same structure detected for: ${fileName} - adding directly`)
						// Add the file directly (same logic as repository files)
						setSelectedBVHList([...currentList, fileName])
						
						// Add to skeletonsArray for 3D display
						const currentSkeletons = skeletonsArray()
						const newSkeleton = {
							label: `Skeleton ${currentSkeletons.length + 1}`,
							fileName: fileName, // Keep direct name for uploaded files
							fileContent: fileContent // Store file content for uploaded files
						}
						setSkeletonsArray([...currentSkeletons, newSkeleton])
						
						// Set visibility to true by default
						const currentVisibility = bvHVisibilityMap()
						setBVHVisibilityMap({
							...currentVisibility,
							[fileName]: true
						})
						return
					}
				} else {
					// File selected from list (not uploaded) - add directly without structure check
					console.log(`📋 File selected from list: ${fileName} - adding directly`)
					// Add the file directly (same logic as repository files)
					setSelectedBVHList([...currentList, fileName])
					
					// Add to skeletonsArray for 3D display
					const currentSkeletons = skeletonsArray()
					const newSkeleton = {
						label: `Skeleton ${currentSkeletons.length + 1}`,
						fileName: `bvh2/${fileName}`
					}
					setSkeletonsArray([...currentSkeletons, newSkeleton])
					
					// Set visibility to true by default
					const currentVisibility = bvHVisibilityMap()
					setBVHVisibilityMap({
						...currentVisibility,
						[fileName]: true
					})
					return
				}
			}
			
			// For repository files, add normally
			setSelectedBVHList([...currentList, fileName])
			
			// Added by Youssef Hergal - Also add to skeletonsArray for 3D display -
			const currentSkeletons = skeletonsArray()
			const newSkeleton = {
				label: `Skeleton ${currentSkeletons.length + 1}`,
				fileName: `bvh2/${fileName}` // Ensure proper path format
			}
			setSkeletonsArray([...currentSkeletons, newSkeleton])
			
			// Added by Youssef Hergal - Set visibility to true by default - 
			const currentVisibility = bvHVisibilityMap()
			setBVHVisibilityMap({
				...currentVisibility,
				[fileName]: true
			})
		}
	}

	// Added by Youssef Hergal - Remove BVH file from selection and 3D scene - 
	// FUNCTIONALITY: Removes a BVH file from both selection list and 3D skeleton array
	// WHY: Ensures complete cleanup when a file is deleted
	// PERFORMANCE: Removes from both arrays in one operation to maintain consistency
	const removeBVH = async (fileName) => {
		const currentList = selectedBVHList()
		if (currentList.length > 1) {
			const updatedList = currentList.filter(bvh => bvh !== fileName)
			setSelectedBVHList(updatedList)
			
			// Added by Youssef Hergal - Also remove from skeletonsArray - 
			const currentSkeletons = skeletonsArray()
			const updatedSkeletons = currentSkeletons.filter(skeleton => skeleton.fileName !== `bvh2/${fileName}`)
			setSkeletonsArray(updatedSkeletons)
			
			// Added by Youssef Hergal - Remove from visibility map - 
			const currentVisibility = bvHVisibilityMap()
			const { [fileName]: removed, ...updatedVisibility } = currentVisibility
			setBVHVisibilityMap(updatedVisibility)
			
			// Refresh plot data after removing file
			try {
				await initializeWhenLoaded()
			} catch (error) {
				console.error("Error refreshing plot data after file removal:", error)
			}
		}
	}

	// Added by Youssef Hergal - Toggle visibility for display/hide functionality - 2025-08-28
	// FUNCTIONALITY: Toggles the visibility state of a BVH file without removing it
	// WHY: Allows users to hide/show files without losing their selection
	// PERFORMANCE: Simple state toggle, much faster than add/remove operations
	const toggleFileSelection = async (fileName) => {
		// Added by Youssef Hergal - Toggle visibility for display/hide functionality - 2025-08-28
		const currentVisibility = bvHVisibilityMap()
		const isCurrentlyVisible = currentVisibility[fileName] !== false // Default to true if not set
		
		// Prevent hiding the last visible file
		const visibleFiles = selectedBVHList().filter(file => 
			currentVisibility[file] !== false
		)
		
		if (isCurrentlyVisible && visibleFiles.length === 1) {
			console.warn("Cannot hide the last visible file. Please select another file first.")
			return
		}
		
		setBVHVisibilityMap({
			...currentVisibility,
			[fileName]: !isCurrentlyVisible
		})
		
		console.log(`Toggling visibility for: ${fileName} - Now ${!isCurrentlyVisible ? 'visible' : 'hidden'}`)
		
		// Refresh plot data after toggling visibility
		try {
			await initializeWhenLoaded()
		} catch (error) {
			console.error("Error refreshing plot data after visibility toggle:", error)
		}
	}

	return (
		<div class="file-management-card">
			
			<div class="card-content">
				<div class="upload-section">
					<label for="file-upload" class="upload-label">Upload BVH Files (Multiple)</label>
					<div class="file-input-wrapper">
						<input
							id="file-upload"
							type="file"
							accept=".bvh"
							multiple
							onChange={handleFileUpload}
							class="file-input"
						/>
						<label for="file-upload" class="file-input-button">
							Choose Files
						</label>
						<span class="file-input-text">{selectedFileNames()}</span>
					</div>
				</div>
				
				<div class="divider">or</div>
				
				<div class="default-files-section">
					<label class="default-label">Select from Repository</label>
					<select 
						onChange={(e) => handleSelectFile(e.target.value)}
						class="default-select"
						disabled={hasStructureChanged()}
					>
						<option value="">Choose a file...</option>
						{bvhFiles.map((file) => (
							<option value={file}>{file}</option>
						))}
					</select>
					{hasStructureChanged() && (
						<div style={{
							"font-size": "11px",
							color: "#666",
							"margin-top": "4px",
							"font-style": "italic"
						}}>
							Repository selection disabled - structure changed
						</div>
					)}
				</div>

				{/* Selected Files Display */}
				{selectedBVHList().length > 0 && (
					<div class="files-list-section">
						<div class="files-label">Selected Files ({selectedBVHList().length})</div>
						<div class="files-list">
							{selectedBVHList().map((fileName) => {
								const isVisible = bvHVisibilityMap()[fileName] !== false
								const visibleFiles = selectedBVHList().filter(file => 
									bvHVisibilityMap()[file] !== false
								)
								const isLastVisible = isVisible && visibleFiles.length === 1
								
								return (
									<div class={`file-item ${!isVisible ? 'hidden' : ''}`}>
										<input
											type="checkbox"
											checked={isVisible}
											onChange={() => toggleFileSelection(fileName)}
											class="file-checkbox"
											disabled={isLastVisible}
											title={isLastVisible ? "Cannot hide the last visible file" : ""}
										/>
										<span class="file-name">{fileName}</span>
										<button
											onClick={() => removeFile(fileName)}
											class="remove-button"
											title="Remove file"
											disabled={selectedBVHList().length === 1}
										>
											×
										</button>
									</div>
								)
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default function SimplifiedForm() {
	let fileIsChanged = false
	let previousBVH = null // Keep track of the previous value of selectedBVH
	let lastMode = "repo"
	let isFirstRun = true // Initialize the flag

	createEffect(() => {
		selectedBVH()
		if (isFirstRun) {
			isFirstRun = false // Skip the first execution
		} else {
			fileIsChanged = true // Your logic here
		}
	})

	function checkModes() {
		const mode = currentImportMode()

		if (mode !== lastMode && skeletonsArray().length !== 1) {
			console.log("NOPE!")
			setOpenAlert(true)
			// console.log("mode: ", lastMode)
		}
		if (mode !== lastMode) {
			lastMode = mode
			// console.log("changed")
		}
	}

	async function uploadFile(obj, file_path) {
		const file = URL.createObjectURL(obj)

		const parts = file_path.split("\\") // Splits the string by '/' into an array
		const lastPart = parts[parts.length - 1] // Gets the last element of the array

		if (lastPart.endsWith(".bvh")) {
			// Update uploadOutput with the new file
			setUploadOutput((prev) => ({ ...prev, uploaded: lastPart }))
			setSelectedBVH(file) // Keep the URL if needed
		} else {
			setUploadOutput((prev) => ({
				...prev,
				uploaded: "Please upload a .bvh file only!",
			}))
		}
	}

	function createSkeletonArray(fileName) {
		// This logic was previously inside createEffect
		if (!fileName || fileName === previousBVH) {
			// console.log("No change detected in selected BVH.")
			return
		}

		previousBVH = fileName
		// console.log("Selected BVH updated reactively:", fileName)

		// The rest of the logic remains the same
		const updatedSkeletons = [...skeletonsArray()]
		const label = `Skeleton 1`

		const cleanedSkeletons = updatedSkeletons.filter(
			(skeleton) => skeleton.fileName && skeleton.fileName.trim() !== ""
		)

		const existingIndex = cleanedSkeletons.findIndex(
			(skeleton) => skeleton.label === label
		)

		if (existingIndex !== -1) {
			cleanedSkeletons[existingIndex].fileName = fileName
		} else {
			cleanedSkeletons.push({ label, fileName })
		}

		setSkeletonsArray(cleanedSkeletons)
		checkModes()
		// console.log("Updated skeletons array:", cleanedSkeletons)
	}

	onMount(() => {
		// Added by Youssef Hergal - Initialize with default BVH and setup - 
		createSkeletonArray("bvh2/MCEAS02G01R03.bvh")
		setSelectedBVH("bvh2/MCEAS02G01R03.bvh")
		setIsBVHdefault(false)
		
		// Initialize the skeleton array with the default BVH
		initializeSkeletonArray()
		
		// Added by Youssef Hergal - Initialize visibility for default BVH - 2025-08-28
		setBVHVisibilityMap({
			"MCEAS02G01R03.bvh": true
		})
	})

	return (
		<>
			{/* Added by Youssef Hergal - New file management component - 2025-08-28 */}
			<FileManagementCard />
		</>
	)
}
