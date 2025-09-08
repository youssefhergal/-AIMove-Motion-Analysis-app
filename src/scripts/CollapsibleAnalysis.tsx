import { Collapsible } from "@kobalte/core"
import { Checkbox } from "@kobalte/core"
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
} from "./store"
import { ResizeEverything } from "./ResizeEverything"
import { formatBoneNames, extractJointNames } from "./useSceneSetup"

// Added by Youssef Hergal - Dexterity Analysis collapsible component - 2025-01-27
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
	async function handleDexterityAnalysisChange(enabled) {
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
				console.log("🔄 Starting prepareGOMData function")
				const viewers = skeletonViewersSig()
				console.log("🔍 Skeleton viewers check:", {
					viewers: viewers,
					length: viewers?.length,
					isArray: Array.isArray(viewers)
				})
				
				if (viewers && viewers.length > 0) {
					console.log("🔄 Preparing GOM data from skeleton...")
					try {
						// Use the first skeleton for GOM analysis
						const firstViewer = viewers[0]
						const [gomData] = await firstViewer.createDataframes()
						console.log("📊 GOM data prepared:", {
							isArray: Array.isArray(gomData),
							length: gomData?.length,
							firstElement: gomData?.[0]
						})
						
						// Set the GOM data in the store
						setInputGOM(gomData)
						console.log("✅ GOM data set in store")
						
						// Now initialize GOM analysis with the prepared data
						console.log("🔍 checkboxFistClick status:", checkboxFistClick())
						console.log("🔄 Calling DoGOM_init()...")
						await DoGOM_init()
						console.log("✅ DoGOM_init() completed")
						
						// Wait a moment for tables to be created, then display them
						setTimeout(async () => {
							console.log("🔄 Calling displayTableSwitcher...")
							await displayTableSwitcher()
							console.log("✅ displayTableSwitcher completed")
						}, 100)
						
						// Re-initialize 3D scene to ensure skeleton displays properly
						setTimeout(async () => {
							console.log("🔄 Re-initializing 3D scene after GOM analysis...")
							try {
								await initialize()
								console.log("✅ 3D scene re-initialized successfully")
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
			console.log("🔄 Calling prepareGOMData...")
			prepareGOMData()
		} else {
			// Disable dexterity analysis
			await setSplitterSizeL(100)
			await setSplitterSizeR(0)
			ResizeEverything()
			
			// Restore original bones list
			const viewers = skeletonViewersSig()
			if (viewers && viewers.length > 0) {
				setBonesList(formatBoneNames(viewers[0].boneHierarchy))
			} else {
				setBonesList(formatBoneNames(myScene.boneHierarchy))
			}
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
						<Checkbox.Root 
							class="checkbox" 
							checked={dexterityAnalysisEnabled()} 
							onChange={handleDexterityAnalysisChange}
						>
							<Checkbox.Input class="checkbox__input" />
							<Checkbox.Control class="checkbox__control">
								<Checkbox.Indicator>✔</Checkbox.Indicator>
							</Checkbox.Control>
							<Checkbox.Label class="checkbox__label">Dexterity Analysis</Checkbox.Label>
						</Checkbox.Root>
					</div>
					<button
						onclick={exportBVHFunc}
						id="exportBVHButton"
						class="buttonCoef"
						style="margin-top: 10px;"
					>
						Export BVH
					</button>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleDexterityAnalysis }