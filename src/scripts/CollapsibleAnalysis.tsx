import { Collapsible } from "@kobalte/core"
// Removed Checkbox import - using HTML checkbox instead
import { createSignal, createEffect } from "solid-js"
import { myScene } from "./myScene"
import { exportBVH } from "./ExportBVH"
import { DoGOM_init, displayTableSwitcher } from "./CheckboxDexAnalysis"
import { initialize } from "./useSceneSetup"
import { 
	checkboxValue, 
	setCheckboxValue, 
	splitterSizeL, 
	splitterSizeR, 
	setSplitterSizeL, 
	setSplitterSizeR,
	checkboxFistClick,
	bonesList,
	setBonesList,
	skeletonViewersSig,
	setInputGOM
} from "./stores/store"
import { ResizeEverything } from "./ResizeEverything"
import { formatBoneNames, extractJointNames } from "./utils/boneUtils"

// Added by Youssef Hergal - Dexterity Analysis collapsible component - 
// FUNCTIONALITY: Collapsible section with simple checkbox for dexterity analysis
// WHY: Provides organized access to dexterity analysis features
// PERFORMANCE: Uses Kobalte's efficient collapsible implementation
function CollapsibleDexterityAnalysis() {
	const [arrow, setArrow] = createSignal("\u25BC")
	
	// Use global state for dexterity analysis checkbox
	const dexterityAnalysisEnabled = () => checkboxValue()
	const setDexterityAnalysisEnabled = setCheckboxValue

	async function exportBVHFunc() {
		const bvhData = await exportBVH(
			myScene.globalResult.skeleton,
			myScene.animationClip
		)

		const blob = new Blob([bvhData], { type: "text/plain" })
		const url = URL.createObjectURL(blob)
		// Create a download link
		const link = document.createElement("a")
		link.href = url
		link.download = "animation.bvh"
		document.body.appendChild(link)
		link.click()

		document.body.removeChild(link)
		URL.revokeObjectURL(url)

		console.log(bvhData)
	}

	// Dexterity analysis functionality - simplified to match original working approach
	async function handleDexterityAnalysisChange(event) {
		const enabled = event.target.checked
		setDexterityAnalysisEnabled(enabled)
		
		if (enabled) {
			// Enable dexterity analysis - use original working approach
			await setSplitterSizeL(45)
			await setSplitterSizeR(55)
			
			// Call resize function like original
			ResizeEverything()
			
			// Force multiple resize events to ensure 3D scene updates properly
			setTimeout(() => {
				console.log("🔄 First resize attempt for 3D scene")
				ResizeEverything()
			}, 100)
			setTimeout(() => {
				console.log("🔄 Second resize attempt for 3D scene")
				ResizeEverything()
			}, 300)
			setTimeout(() => {
				console.log("🔄 Third resize attempt for 3D scene")
				ResizeEverything()
				// Trigger a custom resize event
				window.dispatchEvent(new CustomEvent('resize'))
			}, 500)
			
			// Update bones list for dexterity analysis
			setBonesList(extractJointNames(bonesList()))
			
			// Wait for skeleton data to be available, then prepare GOM data
			const prepareGOMData = async () => {
				// Starting prepareGOMData
				const viewers = skeletonViewersSig()
				// Skeleton viewers check
				
				if (viewers && viewers.length > 0) {
					// Preparing GOM data from skeleton
					try {
						// Use the first skeleton for GOM analysis
						const firstViewer = viewers[0]
						const [gomData] = await firstViewer.createDataframes()
						// GOM data prepared
						
						// Set the GOM data in the store
						setInputGOM(gomData)
						// GOM data set in store
						
						// Now initialize GOM analysis with the prepared data
						await DoGOM_init()
						
			// Wait a moment for tables to be created, then display them
			setTimeout(async () => {
				await displayTableSwitcher()
				
				// Recreate plots after dexterity analysis is complete
				setTimeout(async () => {
					const { createPlot2D, createPlot3D } = await import("./plots")
					const { currentAnimationTime, toggleValue } = await import("./stores/store")
					
					await createPlot2D(currentAnimationTime(), toggleValue())
					await createPlot3D(currentAnimationTime())
				}, 500)
			}, 100)
						
						// Re-initialize 3D scene to ensure skeleton displays properly
						setTimeout(async () => {
							// Re-initializing 3D scene after GOM analysis
							try {
								await initialize()
								// 3D scene re-initialized
								// Force one more resize after scene re-initialization
								setTimeout(() => {
									ResizeEverything()
								}, 100)
							} catch (error) {
								console.error("❌ Error re-initializing 3D scene:", error)
							}
						}, 200)
					} catch (error) {
						console.error("❌ Error preparing GOM data:", error)
					}
				} else {
					console.warn("⚠️ No skeleton viewers available, retrying in 500ms...")
					// Retry after a short delay
					setTimeout(prepareGOMData, 500)
				}
			}
			
			// Start the GOM data preparation
			// Calling prepareGOMData
			prepareGOMData()
		} else {
			// Disable dexterity analysis
			console.log("🔄 Disabling dexterity analysis...")
			await setSplitterSizeL(100)
			await setSplitterSizeR(0)
			ResizeEverything()
			
			// Force resize to ensure proper layout restoration
			setTimeout(() => {
				console.log("🔄 Resizing after dexterity analysis disable...")
				ResizeEverything()
			}, 100)
			
			// Restore original bones list
			const viewers = skeletonViewersSig()
			if (viewers && viewers.length > 0) {
				setBonesList(formatBoneNames(viewers[0].boneHierarchy))
			} else {
				setBonesList(formatBoneNames(myScene.boneHierarchy))
			}
			
			// Re-initialize 3D scene to ensure skeleton displays properly
			setTimeout(async () => {
				console.log("🔄 Re-initializing 3D scene after dexterity analysis disable...")
				await initialize()
				
				// Recreate plots after scene re-initialization
				setTimeout(async () => {
					console.log("🔄 Recreating plots after dexterity analysis disable...")
					const { createPlot2D, createPlot3D } = await import("./plots")
					const { currentAnimationTime, toggleValue, skeletonViewersSig } = await import("./stores/store")
					
					// Check if skeleton data is available before recreating plots
					const viewers = skeletonViewersSig()
					if (viewers && viewers.length > 0) {
						await createPlot2D(currentAnimationTime(), toggleValue())
						await createPlot3D(currentAnimationTime())
						console.log("✅ Plots recreated after dexterity analysis disable")
					} else {
						console.log("⚠️ No skeleton data available for plot recreation")
					}
				}, 200)
			}, 200)
			
			console.log("✅ Dexterity analysis disabled successfully")
		}
	}

	return (
		<Collapsible.Root
			defaultOpen={true}
			class="collapsible"
			onOpenChange={(bool) => {
				if (bool) {
					setArrow("\u25BC")
				} else {
					setArrow("\u25B2")
				}
			}}
		>
			<Collapsible.Trigger
				class="collapsible__trigger"
				id="CollapsibleDexterityAnalysis"
			>
				<span> Analysis {arrow()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content">
				<div class="collapsible__content-text">
					<div class="dexterity-analysis-simple">
						<label class="file-checkbox-label">
							<input
								type="checkbox"
								class="file-checkbox"
								checked={dexterityAnalysisEnabled()}
								onChange={handleDexterityAnalysisChange}
							/>
							<span class="parameter-label">Dexterity Analysis</span>
						</label>
					</div>
					<button
						onclick={exportBVHFunc}
						id="exportBVHButton"
						class="buttonCoef"
						style="margin-top: 6px; font-size: 10px; padding: 2px 4px;"
					>
						Export BVH
					</button>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleDexterityAnalysis }