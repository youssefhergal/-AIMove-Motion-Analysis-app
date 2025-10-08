import "./App.css"
import { onMount, onCleanup, createSignal } from "solid-js"
import { myScene } from "./scripts/myScene"
import { resizePlots } from "./scripts/plots"
import { MainPage } from "./scripts/MainPage"
import { scaleApp } from "./scripts/MainPage"
import { ResizeEverything } from "./scripts/ResizeEverything"
import StructureChangeDialog from "./scripts/components/StructureChangeDialog"
import { 
	showStructureChangeDialog, 
	setShowStructureChangeDialog,
	dialogFileName,
	selectedBVHList,
	setSelectedBVHList,
	skeletonsArray,
	setSkeletonsArray,
	bvHVisibilityMap,
	setBVHVisibilityMap,
	pendingUploadedFiles,
	setPendingUploadedFiles,
	isLoadingUploadedFile,
	setIsLoadingUploadedFile,
	hasStructureChanged,
	setHasStructureChanged
} from "./scripts/stores/sceneStore"
import { getBonesList } from "./scripts/useSceneSetup"

function App() {
	const handler = () => {
		ResizeEverything()
		scaleApp()
	}

	onMount(() => {
		window.addEventListener("resize", handler)
		document.addEventListener("resize", handler)

		document.addEventListener("fullscreenchange", handler)
		document.addEventListener("webkitfullscreenchange", handler)
		document.addEventListener("mozfullscreenchange", handler)
		document.addEventListener("msfullscreenchange", handler)
	})

	// createSignal(() => {
	// 	window.addEventListener("resize", handler)
	// 	document.addEventListener("resize", handler)

	// 	document.addEventListener("fullscreenchange", handler)
	// 	document.addEventListener("webkitfullscreenchange", handler)
	// 	document.addEventListener("mozfullscreenchange", handler)
	// 	document.addEventListener("msfullscreenchange", handler)
	// 	console.log("lalalalal")
	// })

	onCleanup(() => {
		window.removeEventListener("resize", handler)
	})

	return (
		<>
			<MainPage />
			<StructureChangeDialog 
				isOpen={showStructureChangeDialog()}
				onClose={() => {
					setShowStructureChangeDialog(false)
					// Clear pending files when user cancels
					setPendingUploadedFiles([])
					console.log(`❌ User cancelled structure change - cleared pending files`)
				}}
				onConfirm={async () => {
					setShowStructureChangeDialog(false)
					
					// User confirmed structure change - replace everything
					const uploadedFiles = pendingUploadedFiles()
					if (uploadedFiles.length > 0) {
						console.log(`✅ User confirmed structure change`)
						console.log(`🔄 Replacing all existing files with ${uploadedFiles.length} new files...`)
						
						// Set loading state to prevent MainPage from calling initializeWhenLoaded
						setIsLoadingUploadedFile(true)
						
						// Mark that structure has changed (this will disable repository selector)
						setHasStructureChanged(true)
						
						// 1. Clear all existing files
						setSelectedBVHList([])
						setSkeletonsArray([])
						setBVHVisibilityMap({})
						
						console.log(`🗑️ Cleared all existing files`)
						
						// 2. Add all uploaded files
						const fileNames = uploadedFiles.map(file => file.name)
						setSelectedBVHList(fileNames)
						
						// 3. Add all to skeletonsArray with file content
						const newSkeletons = uploadedFiles.map((file, index) => ({
							label: `Skeleton ${index + 1}`,
							fileName: file.name, // Keep direct name for uploaded files
							fileContent: file.content // Store file content for uploaded files
						}))
						setSkeletonsArray(newSkeletons)
						
						// 4. Set visibility to true by default for all
						const visibilityMap = {}
						uploadedFiles.forEach(file => {
							visibilityMap[file.name] = true
						})
						setBVHVisibilityMap(visibilityMap)
						
						// 5. Clear pending files
						setPendingUploadedFiles([])
						
						// Note: getBonesList() is now called automatically in addSkeletonViewer
						
						console.log(`✅ Replaced with new structure: ${fileNames.join(', ')}`)
						console.log(`🎯 First file (${fileNames[0]}) is now the default`)
					}
				}}
				fileName={dialogFileName()}
			/>
		</>
	)
}

export default App
