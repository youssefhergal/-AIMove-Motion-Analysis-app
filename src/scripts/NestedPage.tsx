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

	const handleFileUpload = (event) => {
		const files = Array.from(event.target.files)
		if (files.length > 0) {
			const fileNames = files.map((f: File) => f.name).join(", ")
			setSelectedFileNames(fileNames)
		} else {
			setSelectedFileNames("No file chosen")
		}
		files.forEach((file: File) => addBVH(file.name))
	}

	const handleSelectFile = (fileName) => {
		if (fileName) addBVH(fileName)
	}

	const removeFile = (fileName) => {
		removeBVH(fileName)
	}

	// Added by Youssef Hergal - Add BVH file to selection and 3D scene - 
	// FUNCTIONALITY: Adds a BVH file to both the selection list and 3D skeleton array
	// WHY: Ensures both UI state and 3D rendering are synchronized
	// PERFORMANCE: Updates both arrays in one operation to maintain consistency
	const addBVH = (fileName) => {
		const currentList = selectedBVHList()
		if (!currentList.includes(fileName)) {
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
					>
						<option value="">Choose a file...</option>
						{bvhFiles.map((file) => (
							<option value={file}>{file}</option>
						))}
					</select>
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
