import { myScene } from "./myScene"
import BaseScene from "./BaseScene.js"
import SkeletonViewer from "./SkeletonViewer.js"
import { createPlot2D, createPlot3D, updatePlot2D, updatePlot3D } from "./plots"
import { do_gom } from "./tensorflowGOM"
import { DoGOM_init } from "./CheckboxDexAnalysis"
import { ResizeEverything } from "./ResizeEverything"
import { createEffect, createSignal } from "solid-js"
import { formatBoneNames, extractJointNames } from "./utils/boneUtils"

import {
	setAnimationDuration,
	currentAnimationTime,
	setCurrentAnimationTime,
	setPositionsX_2D,
	setPositionsY_2D,
	setPositionsZ_2D,
	setPositionsX_3D,
	setPositionsY_3D,
	setPositionsZ_3D,
	toggleValue,
	bonesList,
	setBonesList,
	setLoadingDone,
	// selectedJoint
	// uploadOutput,
	setUploadOutput,
	mode2DPlot,
	mode3DPlot,
	setSelectedJoint,
	selectedJoint,
	setMainPageLoaded,
	inputGOM,
	setInputGOM,
	setName2DPlot,
	setName3DPlot,
	checkboxValue,
	setAppIsLoaded,
	setCheckboxFistClick,
	selectedValue,
	setSelectedValue,
	skeletonsArray,
	getVisibleSkeletons,
	bvHVisibilityMap,
	skeletonViewersSig,
	setSkeletonViewersSig,
	animationDuration,
	velocities,
	setVelocities,
	accelerations,
	setAccelerations,
	metrics,
	setMetrics,
	worldFramesBones,
	setWorldFramesBones,
	setBaseScene,
	setPlayPressed,
	setIsLoadingUploadedFile,
	isLoadingUploadedFile,
} from "./stores/store"

// import { initMathJax } from "./InitMathJax.js"

const [mixersCount, setMixersCount] = createSignal(0)

let lastPlotsDataUpdate = 0
function preparePlotsData() {
	const now = Date.now()
	if (now - lastPlotsDataUpdate < 1000) {
		console.log(`📊 Skipping preparePlotsData - too soon (${now - lastPlotsDataUpdate}ms ago)`)
		return
	}
	lastPlotsDataUpdate = now
	
	// console.log("PreparePlotsData")

	// Arrays to store data for all viewers
	const positionsX_2D_All = []
	const positionsY_2D_All = []
	const positionsZ_2D_All = []
	const positionsX_3D_All = []
	const positionsY_3D_All = []
	const positionsZ_3D_All = []

	const velocities_All = []
	const accelerations_All = []
	const labels = [] // To store plotLabels for all viewers
	const metrics_All = []

	// Added by Youssef Hergal - Only process visible viewers for plots - 
	// FUNCTIONALITY: Filters out hidden skeletons before processing plot data
	// WHY: Avoids calculating plot data for skeletons that aren't visible
	// PERFORMANCE: Reduces computation time by only processing visible skeletons
	const visibleViewers = skeletonViewersSig().filter(viewer => {
		const fileName = viewer.skeletonPath || viewer.bvhName
		if (fileName) {
			const shortFileName = fileName.replace('bvh2/', '')
			return bvHVisibilityMap()[shortFileName] !== false
		}
		return true // Default to visible if no visibility info
	})

	// Added by Youssef Hergal - Iterate through each visible viewer - 
	// FUNCTIONALITY: Processes only visible skeletons for plot generation
	// WHY: Saves computation time by skipping hidden skeletons
	// PERFORMANCE: O(visible_skeletons) instead of O(total_skeletons)
	visibleViewers.forEach((viewer, index) => {
		console.log(`📊 Processing viewer ${index + 1}/${visibleViewers.length} - ${viewer.label}`)
		// Use the currently selected joint, fallback to first available bone
		const currentJoint = selectedJoint() || (bonesList().length > 0 ? bonesList()[0].replace('•', '') : "hip")
		console.log(`📊 Getting time series for joint: ${currentJoint}`)
		const timeSeriesData = viewer.getTimeSeries(currentJoint)
		console.log(`📊 Time series data length: ${timeSeriesData ? timeSeriesData.length : 'null'}`)
	if (!timeSeriesData || timeSeriesData.length < 8) {
		console.warn(`⚠️ Skipping viewer ${index + 1} - incomplete time series data`)
		return
	}
	
	const [
		originalPositionsX,
		originalPositionsY,
		originalPositionsZ,
		originalAnglesX,
		originalAnglesY,
		originalAnglesZ,
		originalVelocities,
		originalAccelerations,
	] = timeSeriesData
		
		// console.log(`📊 Viewer ${index + 1} data lengths:`, {
		// 	positionsX: originalPositionsX?.length || 0,
		// 	positionsY: originalPositionsY?.length || 0,
		// 	positionsZ: originalPositionsZ?.length || 0,
		// 	anglesX: originalAnglesX?.length || 0,
		// 	anglesY: originalAnglesY?.length || 0,
		// 	anglesZ: originalAnglesZ?.length || 0
		// })
		// console.log("check skeleton:")

		// console.time("getGestureMetrics")
		// const metricsPos = viewer.getGestureMetrics()
		// console.timeEnd("getGestureMetrics")

		// Store the plotLabel
		const label = viewer.plotLabel || `Viewer ${index + 1}`
		labels.push(label)
		// metrics_All.push(metricsPos)

		// velocities_All.push([...originalVelocities])
		// accelerations_All.push([...originalAccelerations])

		if (mode2DPlot() === false) {
			positionsX_2D_All.push([...originalPositionsX])
			positionsY_2D_All.push([...originalPositionsY])
			positionsZ_2D_All.push([...originalPositionsZ])
		} else {
			positionsX_2D_All.push([...originalAnglesX])
			positionsY_2D_All.push([...originalAnglesY])
			positionsZ_2D_All.push([...originalAnglesZ])
		}

		if (mode3DPlot() === false) {
			positionsX_3D_All.push([...originalPositionsX])
			positionsY_3D_All.push([...originalPositionsY])
			positionsZ_3D_All.push([...originalPositionsZ])
		} else {
			positionsX_3D_All.push([...originalAnglesX])
			positionsY_3D_All.push([...originalAnglesY])
			positionsZ_3D_All.push([...originalAnglesZ])
		}

		originalPositionsX.length = 0
		originalPositionsY.length = 0
		originalPositionsZ.length = 0
		originalAnglesX.length = 0
		originalAnglesY.length = 0
		originalAnglesZ.length = 0
		originalVelocities.length = 0
		originalAccelerations.length = 0
	})

	// Keep "Position" and "Angle" names
	if (mode2DPlot() === false) {
		setName2DPlot("Position")
	} else {
		setName2DPlot("Angle")
	}

	if (mode3DPlot() === false) {
		setName3DPlot("Position")
	} else {
		setName3DPlot("Angle")
	}

	
	setPositionsX_2D([...positionsX_2D_All])
	setPositionsY_2D([...positionsY_2D_All])
	setPositionsZ_2D([...positionsZ_2D_All])

	setPositionsX_3D([...positionsX_3D_All])
	setPositionsY_3D([...positionsY_3D_All])
	setPositionsZ_3D([...positionsZ_3D_All])
	setVelocities([...velocities_All])
	setAccelerations([...accelerations_All])
	setMetrics([...metrics_All])
	// console.log("GV: ", metrics_All)

	// Log labels for debugging
	// console.log("Labels for all viewers:", labels)

	// Free memory by clearing arrays
	positionsX_2D_All.length = 0
	positionsY_2D_All.length = 0
	positionsZ_2D_All.length = 0
	positionsX_3D_All.length = 0
	positionsY_3D_All.length = 0
	positionsZ_3D_All.length = 0
	labels.length = 0

	// console.log("Memory freed for arrays.")
}

let isInitializingPlots = false

async function initializeWhenLoaded(forceReload = false) {
	// Prevent infinite loops
	if (isInitializingPlots && !forceReload) {
		console.log("⚠️ Plot initialization already in progress, skipping")
		return
	}
	
	// Additional timing check
	const now = Date.now()
	if (now - lastPlotsDataUpdate < 2000 && !forceReload) {
		console.log(`⚠️ Plot initialization too soon (${now - lastPlotsDataUpdate}ms ago), skipping`)
		return
	}
	
	isInitializingPlots = true
	// console.log("🔄 Starting initializeWhenLoaded function")
	
	try {
		// Only prepare plot data if there are skeletons loaded
		const viewers = skeletonViewersSig()
		if (viewers && viewers.length > 0) {
			// console.log(`📊 Preparing plot data for ${viewers.length} skeleton(s)`)
			// Prepare plot data for all visible skeletons
			// Skip if we're loading an uploaded file (will be called later)
			if (!isLoadingUploadedFile()) {
				preparePlotsData()
			}
			
		// Create plots with the prepared data
		// Add a small delay to ensure DOM elements are ready
		setTimeout(async () => {
			await createPlot2D(currentAnimationTime(), toggleValue())
			await createPlot3D(currentAnimationTime())
		}, 100)
		} else {
			// console.log("⚠️ No skeletons loaded yet, skipping plot preparation")
		}
	} finally {
		isInitializingPlots = false
		// console.log("✅ initializeWhenLoaded completed")
	}
}

async function initialize() {
	console.log("🔄 Starting initialize function")
	let isChanged = false
	let isBonesListReady = false
	const scene = new BaseScene("threePanel")
	setBaseScene(scene)

	await scene.onWindowResize()

	let skeletonViewers = [] // Store the current skeleton viewers

	// Added by Youssef Hergal - Function to add a single skeleton viewer -
	// FUNCTIONALITY: Instead of reloading ALL skeletons when adding one, this function adds only the new skeleton
	// WHY: This dramatically improves performance by avoiding unnecessary reloading of existing skeletons
	// PERFORMANCE: O(1) instead of O(n) where n is the number of existing skeletons
	const addSkeletonViewer = async (skeleton) => {
		const colors = [0x145e9f, 0xdba21c, 0x659d98, 0xa6d5ff, 0x887456, 0x983c58]
		const color_idx = skeletonViewers.length % colors.length
		
		const viewer = new SkeletonViewer(scene.scene, colors[color_idx])
		viewer.skeletonPath = skeleton.fileName
		
		// Check if this is an uploaded file with content
		if (skeleton.fileContent) {
			// For uploaded files, use the content directly
			console.log(`📁 Loading uploaded file: ${skeleton.fileName}`)
			await viewer.loadSkeletonFromContent(skeleton.fileContent)
		} else {
			// For repository files, use the file path
			console.log(`📁 Loading repository file: ${skeleton.fileName}`)
			await viewer.loadSkeleton(skeleton.fileName)
		}
		
		viewer.label = skeleton.label[skeleton.label.length - 1]
		viewer.plotLabel = skeleton.label
		
		skeletonViewers.push(viewer)
		setSkeletonViewersSig([...skeletonViewers])
		
		// Update bones list after skeleton is loaded
		setTimeout(() => {
			getBonesList()
			
			// Manually set visibility for the newly loaded skeleton
			const fileName = skeleton.fileName
			const shortFileName = fileName.replace('bvh2/', '')
			const visibilityMap = bvHVisibilityMap()
			const isVisible = visibilityMap[shortFileName] !== false
			console.log(`🔍 Manual visibility check for ${shortFileName}: ${isVisible}`)
			toggleSkeletonViewer(fileName, isVisible)
			
			// DEBUG: Force visibility to true if skeleton is not visible
			if (!isVisible) {
				console.warn(`⚠️ Skeleton ${shortFileName} is marked as hidden, but forcing visibility for dexterity analysis`)
				toggleSkeletonViewer(fileName, true)
			}
			
			// Wait a bit more for the bones list to be updated before initializing plots
			setTimeout(() => {
				initializeWhenLoaded()
				// Reset loading state after everything is done
				setIsLoadingUploadedFile(false)
			}, 50)
		}, 100)
	}
	
	// Added by Youssef Hergal - Function to remove a single skeleton viewer -
	// FUNCTIONALITY: Removes only the specified skeleton from the scene and memory
	// WHY: Avoids reloading all remaining skeletons, which was causing performance issues
	// PERFORMANCE: O(1) removal instead of O(n) reload of all skeletons
	const removeSkeletonViewer = (fileName) => {
		const viewerIndex = skeletonViewers.findIndex(viewer => 
			viewer.skeletonPath === fileName || viewer.bvhName === fileName
		)
		
		if (viewerIndex !== -1) {
			const viewer = skeletonViewers[viewerIndex]
			
			// Remove from scene
			if (viewer.newParent) {
				viewer.newParent.traverse((child) => {
					if (child.geometry) child.geometry.dispose()
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach((mat) => mat.dispose())
						} else {
							child.material.dispose()
						}
					}
				})
				
				if (viewer.newParent.parent) {
					viewer.newParent.parent.remove(viewer.newParent)
				}
			}
			
			viewer.removeListeners()
			
			// Remove from array
			skeletonViewers.splice(viewerIndex, 1)
			setSkeletonViewersSig([...skeletonViewers])
		}
	}
	
	// Added by Youssef Hergal - Function to show/hide a single skeleton viewer - 
	// FUNCTIONALITY: Toggles visibility of a skeleton without reloading it
	// WHY: Much faster than reloading - just changes the 'visible' property
	// PERFORMANCE: O(1) property change instead of O(n) reload of all skeletons
	const toggleSkeletonViewer = (fileName, isVisible) => {
		const viewer = skeletonViewers.find(viewer => 
			viewer.skeletonPath === fileName || viewer.bvhName === fileName
		)
		
		if (viewer && viewer.newParent) {
			viewer.newParent.visible = isVisible
			console.log(`✅ Set ${fileName} visibility to: ${isVisible}`)
		} else {
			console.warn(`⚠️ Cannot toggle visibility for ${fileName}: viewer or newParent not found`)
		}
	}

	// Added by Youssef Hergal - Function to reload all skeleton viewers (kept for initial load and major changes) - 
	// FUNCTIONALITY: Complete reload of all skeletons - kept for initial load only
	// WHY: Still needed for initial application startup and major structural changes
	// PERFORMANCE: O(n) - only used when absolutely necessary (startup)
	const reloadSkeletonViewers = async () => {
		setAppIsLoaded(false)
		// console.log("Reloading skeleton viewers...")
		setSelectedJoint("Hips")
		setSelectedValue("Hips")

		// Remove all existing skeletons
		skeletonViewers.forEach((viewer, index) => {
			// Remove sphereMeshes
			if (viewer.sphereMeshes) {
				if (Array.isArray(viewer.sphereMeshes)) {
					viewer.sphereMeshes.forEach((mesh) => scene.scene.remove(mesh))
				} else {
					scene.scene.remove(viewer.sphereMeshes)
				}
			}

			// Remove lineMeshes
			if (viewer.lineMeshes) {
				if (Array.isArray(viewer.lineMeshes)) {
					viewer.lineMeshes.forEach((mesh) => scene.scene.remove(mesh))
				} else {
					scene.scene.remove(viewer.lineMeshes)
				}
			}

			// Properly dispose of newParent and remove it from the scene
			if (viewer.newParent) {
				viewer.newParent.traverse((child) => {
					if (child.geometry) {
						child.geometry.dispose()
					}
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach((mat) => mat.dispose())
						} else {
							child.material.dispose()
						}
					}
				})

				// Remove newParent from the scene
				if (viewer.newParent.parent) {
					viewer.newParent.parent.remove(viewer.newParent)
				}

				// Optional: Set newParent to null to avoid references
				viewer.newParent = null

				viewer.removeListeners()
				// 🔴 Clear references
				viewer.color_joints = null
				viewer.mixer = null
				viewer.action = null
				viewer.globalResult = null
				viewer.animationClip = null

				viewer.sphereMeshes = null
				viewer.lineMeshes = null
				viewer.newParent = null

				viewer.boneNames = null
				viewer.boneHierarchy = null
				viewer.jointIndex = null
				viewer.positions = null

				viewer.matLine = null

				viewer.startPosition = null
				viewer.endPosition = null
				viewer.newPosition = null

				viewer.label = null
				viewer.plotLabel = null
				viewer.offset = null
				viewer.rotatedPos = null
				viewer.wordFrames = null
				viewer.bvhName = null
				viewer.left = null
				viewer.right = null
				viewer = null
			}
		})

		// console.log("✅ Old skeleton removed successfully!")

		skeletonViewers = [] // Clear the viewers array

		// Added by Youssef Hergal - Use only visible skeletons for 3D display - 
		const currentSkeletons = getVisibleSkeletons().filter(
			(skeleton) => skeleton.fileName && skeleton.fileName.trim() !== ""
		)
		const colors = [0x145e9f, 0xdba21c, 0x659d98, 0xa6d5ff, 0x887456, 0x983c58]

		let color_idx = 0

		for (const skeleton of currentSkeletons) {
			const viewer = new SkeletonViewer(scene.scene, colors[color_idx])
			color_idx += 1
			viewer.skeletonPath = skeleton.fileName

			// Check if this is an uploaded file with content
			if (skeleton.fileContent) {
				// For uploaded files, use the content directly
				console.log(`📁 Reloading uploaded file: ${skeleton.fileName}`)
				await viewer.loadSkeletonFromContent(skeleton.fileContent)
			} else {
				// For repository files, use the file path
				console.log(`📁 Reloading repository file: ${skeleton.fileName}`)
				await viewer.loadSkeleton(skeleton.fileName)
			}
			
			viewer.label = skeleton.label[skeleton.label.length - 1]
			viewer.plotLabel = skeleton.label

			skeletonViewers.push(viewer) // Add the viewer to the array
		}

		// console.log("Skeleton viewers reloaded:", skeletonViewers)
		setSkeletonViewersSig(skeletonViewers)
		// console.log("joints and values: ", selectedJoint(), selectedValue())
	}

	// Added by Youssef Hergal - Initial load of skeleton viewers - 
	// FUNCTIONALITY: Handles the initial application startup with complete reload
	// WHY: Only time we need complete reload is during initial startup
	// PERFORMANCE: O(n) reload only once at startup, then O(1) operations
	createEffect(async () => {
		const skeletons = skeletonsArray()
		if (skeletons.length > 0 && skeletonViewers.length === 0) {
			// Check if any skeleton has fileContent (uploaded files)
			const hasUploadedFiles = skeletons.some(skeleton => skeleton.fileContent)
			
			if (hasUploadedFiles) {
				console.log(`📁 Detected uploaded files - skipping automatic reload`)
				return // Don't reload automatically for uploaded files
			}
			
			await reloadSkeletonViewers() // Only reload completely on initial load for repository files
		}
	})

	setLoadingDone(true)

	function getMaxDuration() {
		let maxDuration = 0 // Variable to keep track of the maximum duration

		skeletonViewers.forEach((viewer) => {
			const duration = viewer.getAnimationDuration() // Get the animation duration
			// console.log(`Current viewer duration: ${duration}`) // Log each duration for debugging
			maxDuration = Math.max(maxDuration, duration) // Update the maximum duration if this one is larger
		})

		// console.log("Final maximum animation duration:", maxDuration)
		setAnimationDuration(maxDuration) // Update the state with the maximum duration
	}

	// Function moved to module level for export

	// Added by Youssef Hergal - Function to get common bones across all skeletons -
	// FUNCTIONALITY: Finds bones that exist in all loaded skeletons
	// WHY: Prevents "Bone not found" errors by only showing compatible joints
	// PERFORMANCE: O(n*m) where n is number of skeletons, m is average bones per skeleton
	function getCommonBones() {
		if (skeletonViewers.length === 0) return []
		
		// Get bones from the first skeleton as base
		const firstSkeletonBones = Object.keys(skeletonViewers[0].boneIndex || {})
		if (firstSkeletonBones.length === 0) return []
		
		// Find bones that exist in ALL skeletons
		return firstSkeletonBones.filter(boneName => 
			skeletonViewers.every(viewer => 
				viewer.boneIndex && viewer.boneIndex[boneName] !== undefined
			)
		)
	}
	// Animation loop
	scene.animate = function () {
		requestAnimationFrame(() => this.animate())
		this.renderer.clear()
		this.stats.update()
		const delta = this.clock.getDelta()

		if (isChanged) {
			setMixersCount(skeletonViewers.filter((viewer) => viewer.mixer).length) // Count viewers with mixer

			if (mixersCount() === skeletonViewers.length) {
				let maxDuration = 0
				let viewerWithMaxDuration = null

				// Find the viewer with the maximum duration
				skeletonViewers.forEach((viewer) => {
					const duration = viewer.getAnimationDuration()
					if (duration > maxDuration) {
						maxDuration = duration
						viewerWithMaxDuration = viewer
					}
				})
			}
		}
		if (mixersCount() === skeletonViewers.length && mixersCount() > 0) {
			// Update all skeleton viewers
			skeletonViewers.forEach((viewer) => {
				viewer.update(delta)

				if (isChanged) {
					getMaxDuration()
					isChanged = false
				}

				// Only set animation time for the viewer with the maximum duration
				if (viewer.getAnimationDuration() === animationDuration()) {
					setCurrentAnimationTime(viewer.action.time)
				}
			})
		}
		if (isBonesListReady && skeletonViewers.length > 0) {
			if (skeletonViewers.every((viewer) => viewer.boneHierarchy.length > 0)) {
				getBonesList()
				// console.log("run Initialiaze PLOTs")
				initializeWhenLoaded(true)
				skeletonViewers.forEach((viewer) => {
					if (viewer.mixer) {
						viewer.mixer.setTime(0)
						viewer.mixer.timeScale = 0
					}
					viewer.addListeners()
				})

				isBonesListReady = false
				setPlayPressed(true)
			}
		}

		this.gpuPanel.startQuery()
		this.renderer.render(this.scene, this.camera)
		this.gpuPanel.endQuery()
		this.controls.update()
	}

	// Start the animation loop
	scene.animate()

	// Added by Youssef Hergal - Watch for changes in skeletonsArray and handle individually -
	// FUNCTIONALITY: Detects changes in skeleton list and applies only necessary modifications
	// WHY: Replaces the old approach that reloaded ALL skeletons on ANY change
	// PERFORMANCE: Only processes what actually changed instead of everything
	createEffect(async () => {
		const currentSkeletons = skeletonsArray()
		const currentViewers = skeletonViewers
		
		// Added by Youssef Hergal - Find new skeletons to add -
		// FUNCTIONALITY: Compares current skeletons with existing viewers to find new ones
		// WHY: Only adds skeletons that don't already exist, avoiding duplicates
		// PERFORMANCE: O(n*m) comparison but much faster than reloading everything
		const newSkeletons = currentSkeletons.filter(skeleton => 
			!currentViewers.some(viewer => 
				viewer.skeletonPath === skeleton.fileName || viewer.bvhName === skeleton.fileName
			)
		)
		
		// Added by Youssef Hergal - Find skeletons to remove -
		// FUNCTIONALITY: Identifies viewers that no longer exist in the skeleton list
		// WHY: Only removes skeletons that were actually deleted, not all of them
		// PERFORMANCE: Targeted removal instead of complete reload
		const skeletonsToRemove = currentViewers.filter(viewer => 
			!currentSkeletons.some(skeleton => 
				skeleton.fileName === viewer.skeletonPath || skeleton.fileName === viewer.bvhName
			)
		)
		
		// Added by Youssef Hergal - Add new skeletons individually - 
		// FUNCTIONALITY: Adds each new skeleton without affecting existing ones
		// WHY: Granular addition instead of complete reload
		// PERFORMANCE: Only loads what's new, preserves existing skeletons
		for (const skeleton of newSkeletons) {
			await addSkeletonViewer(skeleton)
		}
		
		// Added by Youssef Hergal - Remove old skeletons individually -
		// FUNCTIONALITY: Removes each deleted skeleton without affecting others
		// WHY: Targeted removal instead of complete reload
		// PERFORMANCE: Only removes what's deleted, preserves existing skeletons
		for (const viewer of skeletonsToRemove) {
			removeSkeletonViewer(viewer.skeletonPath || viewer.bvhName)
		}
		
		if (newSkeletons.length > 0 || skeletonsToRemove.length > 0) {
			isChanged = true
			isBonesListReady = true
			// Initialize plots when skeletons are added/removed
			await initializeWhenLoaded(true)
		}
	})
	
	// Added by Youssef Hergal - Watch for changes in BVH visibility and handle individually - 
	// FUNCTIONALITY: Updates skeleton visibility without reloading them
	// WHY: Much faster than reloading - just changes the 'visible' property
	// PERFORMANCE: O(1) property change per skeleton instead of O(n) reload
	createEffect(() => {
		console.log("🔍 Visibility effect triggered")
		const visibilityMap = bvHVisibilityMap()
		const currentViewers = skeletonViewers
		
		console.log("🔍 Visibility effect - viewers count:", currentViewers.length)
		console.log("🔍 Visibility effect - visibility map:", visibilityMap)
		
		// DEBUG: Check if viewers are empty when effect triggers
		if (currentViewers.length === 0) {
			console.warn("⚠️ Visibility effect triggered but no viewers loaded yet - this is likely the cause of invisible skeletons")
			console.warn("⚠️ This happens when bvHVisibilityMap changes before skeletons are loaded")
			
			// Instead of returning early, wait for viewers to be loaded
			const checkForViewers = () => {
				if (skeletonViewers.length > 0) {
					console.log("🔍 Viewers now available, applying visibility settings")
					applyVisibilitySettings()
				} else {
					setTimeout(checkForViewers, 100) // Check again in 100ms
				}
			}
			setTimeout(checkForViewers, 100)
			return
		}
		
		applyVisibilitySettings()
		
		function applyVisibilitySettings() {
			// Added by Youssef Hergal - Update visibility for each viewer - 
			// FUNCTIONALITY: Changes only the visibility property of each skeleton
			// WHY: Avoids reloading skeletons just to show/hide them
			// PERFORMANCE: Instant visibility toggle instead of full reload
			currentViewers.forEach(viewer => {
				const fileName = viewer.skeletonPath || viewer.bvhName
				if (fileName) {
					const shortFileName = fileName.replace('bvh2/', '')
					const isVisible = visibilityMap[shortFileName] !== false
					console.log(`🔍 Setting visibility for ${shortFileName}: ${isVisible}`)
					toggleSkeletonViewer(fileName, isVisible)
				}
			})
			
			isChanged = true
			isBonesListReady = true
		}
	})

	// Initialize function completed
}



function waitForMixerTime() {
	return new Promise<void>((resolve) => {
		// Specify that the Promise does not resolve with any value
		const checkTime = () => {
			if (myScene.action.time > 0) {
				resolve() // No value needed, just signal that the condition is met
			} else {
				setTimeout(checkTime, 100)
			}
		}
		checkTime()
	})
}

function bonesCreation() {
	return new Promise<void>((resolve) => {
		// Specify that the Promise does not resolve with any value
		const checkTime = () => {
			if (myScene.boneNames.length > 0) {
				resolve() // No value needed, just signal that the condition is met
			} else {
				setTimeout(checkTime, 100)
			}
		}
		checkTime()
	})
}

function updateDuration() {
	// Ensure this method is called after the animation has definitely been loaded
	const duration = myScene.getAnimationDuration()
	console.log("Animation Duration:", duration) // Debug: Log the duration to ensure it's correct
	setAnimationDuration(duration)
	setCurrentAnimationTime(myScene.mixer.time)
	console.log("durationnnnn", duration * 90)
	// console.log(myScene.boneNames)
}

async function clearEverything(file) {
	console.log(`🔄 clearEverything called with file: ${file}`)
	setCheckboxFistClick(false)
	setAppIsLoaded(false)
	setMainPageLoaded(false)
	setSelectedJoint("Hips")
	console.log(typeof file, "    ", file)
	setLoadingDone(false)
	await myScene.clearScene()
	myScene.bvhFilePath = file
	console.log(`📁 Set bvhFilePath to: ${myScene.bvhFilePath}`)
	await initialize()
	// Move ResizeEverything() here after initialization is complete
	ResizeEverything()
	console.log(`✅ clearEverything completed for file: ${file}`)
	if (checkboxValue()) {
		DoGOM_init()
	}
}

async function uploadFile(obj, file_path, callback = null) {
	const file = URL.createObjectURL(obj)

	const parts = file_path.split("\\") // Splits the string by '/' into an array
	const lastPart = parts[parts.length - 1] // Gets the last element of the array
	console.log(file)
	// Check if the last part ends with '.bvh'
	if (lastPart.endsWith(".bvh")) {
		await clearEverything(file)
		setUploadOutput(lastPart)
		
		// Call the callback with the result if provided
		if (callback && myScene.globalResult) {
			callback(myScene.globalResult)
		}
	} else {
		setUploadOutput("Please upload a .bvh file only! ")
	}
	URL.revokeObjectURL(file)
}

async function loadFile(file) {
	console.log(`🔄 Loading file: ${file}`)
	await clearEverything(file)
	// Wait for the scene to be fully initialized and globalResult to be available
	return new Promise((resolve) => {
		let attempts = 0
		const maxAttempts = 100 // 10 seconds max wait
		
		const checkResult = () => {
			attempts++
			console.log(`🔍 Checking for globalResult (attempt ${attempts}):`, {
				hasGlobalResult: !!myScene.globalResult,
				hasBvhBones: !!(myScene.globalResult && myScene.globalResult.bvhBones),
				bonesLength: myScene.globalResult?.bvhBones?.length || 0
			})
			
			if (myScene.globalResult && myScene.globalResult.bvhBones) {
				console.log(`✅ File loaded successfully: ${file} with ${myScene.globalResult.bvhBones.length} bones`)
				resolve(myScene.globalResult)
			} else if (attempts >= maxAttempts) {
				console.error(`❌ Timeout loading file: ${file} after ${maxAttempts} attempts`)
				resolve(null)
			} else {
				setTimeout(checkResult, 100)
			}
		}
		checkResult()
	})
}

const play = () => {
	myScene.play()
}
const stop = () => myScene.stop()

// Function to update bones list for joint selector
let lastBonesListUpdate = 0
const getBonesList = () => {
	const now = Date.now()
	if (now - lastBonesListUpdate < 500) {
		console.log(`🦴 Skipping getBonesList - too soon (${now - lastBonesListUpdate}ms ago)`)
		return
	}
	lastBonesListUpdate = now
	
	const viewers = skeletonViewersSig()
	console.log(`🦴 getBonesList called - viewers count: ${viewers.length}`)
	
	if (viewers.length > 0) {
		console.log(`🦴 First viewer boneHierarchy:`, viewers[0].boneHierarchy)
		const formattedBones = formatBoneNames(viewers[0].boneHierarchy)
		
		// Only update if bones list has changed
		const currentBones = bonesList()
		if (JSON.stringify(currentBones) === JSON.stringify(formattedBones)) {
			console.log(`🦴 Bones list unchanged - skipping update`)
			return
		}
		
		// Clear old selections first
		setSelectedValue("")
		setSelectedJoint("")
		
		// Update with new bones
		setBonesList(formattedBones)
		
		// Set new default selections
		if (formattedBones.length > 0) {
			setSelectedValue(formattedBones[0])
			setSelectedJoint(viewers[0].boneHierarchy[0].name)
		}
		
		console.log(`🦴 Updated selectedValue:`, selectedValue())
		console.log(`🦴 Updated selectedJoint:`, selectedJoint())
	} else {
		console.log(`🦴 No viewers available for bones list update`)
	}
}

export {
	loadFile,
	play,
	stop,
	initialize,
	initializeWhenLoaded,
	uploadFile,
	preparePlotsData,
	getBonesList,
}
