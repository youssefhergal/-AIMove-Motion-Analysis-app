import { createEffect, createSignal } from "solid-js"
import { createPlot2D, createPlot3D, updatePlot2D, updatePlot3D } from "./plots"

import BaseScene from "./BaseScene.js"
import SkeletonViewer from "./SkeletonViewer.js"
import {
	setLoadingDone,
	setBaseScene,
	skeletonsArray,
	getVisibleSkeletons,
	bvHVisibilityMap,
	skeletonViewersSig,
	setSkeletonViewersSig,
	currentAnimationTime,
	setCurrentAnimationTime,
	animationDuration,
	setAnimationDuration,
	bonesList,
	setBonesList,
	setSelectedValue,
	setPositionsX_2D,
	setPositionsY_2D,
	setPositionsZ_2D,
	setPositionsX_3D,
	setPositionsY_3D,
	setPositionsZ_3D,
	mode2DPlot,
	mode3DPlot,
	selectedJoint,
	setAppIsLoaded,
	setSelectedJoint,
	setName2DPlot,
	setName3DPlot,
	toggleValue,
	checkboxValue,
	setPlayPressed,
	setInputGOM,
	selectedValue,
	velocities,
	setVelocities,
	accelerations,
	setAccelerations,
	metrics,
	setMetrics,
	metricName,
	worldFramesBones,
	setWorldFramesBones,
} from "./store"

const [mixersCount, setMixersCount] = createSignal(0)

async function initialize() {
	let isChanged = false
	let isBonesListReady = false
	const scene = new BaseScene("threePanel")
	setBaseScene(scene)

	await scene.onWindowResize()

	let skeletonViewers = [] // Store the current skeleton viewers

	// Added by Youssef Hergal - Function to add a single skeleton viewer - 2025-01-27
	// FUNCTIONALITY: Instead of reloading ALL skeletons when adding one, this function adds only the new skeleton
	// WHY: This dramatically improves performance by avoiding unnecessary reloading of existing skeletons
	// PERFORMANCE: O(1) instead of O(n) where n is the number of existing skeletons
	const addSkeletonViewer = async (skeleton) => {
		const colors = [0x145e9f, 0xdba21c, 0x659d98, 0xa6d5ff, 0x887456, 0x983c58]
		const color_idx = skeletonViewers.length % colors.length
		
		const viewer = new SkeletonViewer(scene.scene, colors[color_idx])
		viewer.skeletonPath = skeleton.fileName
		
		await viewer.loadSkeleton(skeleton.fileName)
		viewer.label = skeleton.label[skeleton.label.length - 1]
		viewer.plotLabel = skeleton.label
		
		skeletonViewers.push(viewer)
		setSkeletonViewersSig([...skeletonViewers])
	}
	
	// Added by Youssef Hergal - Function to remove a single skeleton viewer - 2025-01-27
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
	
	// Added by Youssef Hergal - Function to show/hide a single skeleton viewer - 2025-01-27
	// FUNCTIONALITY: Toggles visibility of a skeleton without reloading it
	// WHY: Much faster than reloading - just changes the 'visible' property
	// PERFORMANCE: O(1) property change instead of O(n) reload of all skeletons
	const toggleSkeletonViewer = (fileName, isVisible) => {
		const viewer = skeletonViewers.find(viewer => 
			viewer.skeletonPath === fileName || viewer.bvhName === fileName
		)
		
		if (viewer && viewer.newParent) {
			viewer.newParent.visible = isVisible
		}
	}

	// Added by Youssef Hergal - Function to reload all skeleton viewers (kept for initial load and major changes) - 2025-01-27
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

		// Added by Youssef Hergal - Use only visible skeletons for 3D display - 2025-01-27
		const currentSkeletons = getVisibleSkeletons().filter(
			(skeleton) => skeleton.fileName && skeleton.fileName.trim() !== ""
		)
		const colors = [0x145e9f, 0xdba21c, 0x659d98, 0xa6d5ff, 0x887456, 0x983c58]

		let color_idx = 0

		for (const skeleton of currentSkeletons) {
			const viewer = new SkeletonViewer(scene.scene, colors[color_idx])
			color_idx += 1
			viewer.skeletonPath = skeleton.fileName

			// console.log(`Loading skeleton: ${skeleton.fileName}`)
			await viewer.loadSkeleton(skeleton.fileName) // Wait for the skeleton to load
			viewer.label = skeleton.label[skeleton.label.length - 1]
			viewer.plotLabel = skeleton.label

			skeletonViewers.push(viewer) // Add the viewer to the array
		}

		// console.log("Skeleton viewers reloaded:", skeletonViewers)
		setSkeletonViewersSig(skeletonViewers)
		// console.log("joints and values: ", selectedJoint(), selectedValue())
	}

	// Added by Youssef Hergal - Initial load of skeleton viewers - 2025-01-27
	// FUNCTIONALITY: Handles the initial application startup with complete reload
	// WHY: Only time we need complete reload is during initial startup
	// PERFORMANCE: O(n) reload only once at startup, then O(1) operations
	createEffect(async () => {
		const skeletons = skeletonsArray()
		if (skeletons.length > 0 && skeletonViewers.length === 0) {
			await reloadSkeletonViewers() // Only reload completely on initial load
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

	function getBonesList() {
		setBonesList(formatBoneNames(skeletonViewers[0].boneHierarchy))
		setSelectedValue(bonesList()[0])
		setSelectedJoint(skeletonViewers[0].boneHierarchy[0].name)

		// console.log(
		// 	"setSelectedJointsetSelectedJoint: ",
		// 	selectedJoint(),
		// 	bonesList()[0],
		// 	skeletonViewers[0].boneHierarchy[0]
		// )
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
					viewer.mixer.setTime(0)
					viewer.mixer.timeScale = 0
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

	// Added by Youssef Hergal - Watch for changes in skeletonsArray and handle individually - 2025-01-27
	// FUNCTIONALITY: Detects changes in skeleton list and applies only necessary modifications
	// WHY: Replaces the old approach that reloaded ALL skeletons on ANY change
	// PERFORMANCE: Only processes what actually changed instead of everything
	createEffect(async () => {
		const currentSkeletons = skeletonsArray()
		const currentViewers = skeletonViewers
		
		// Added by Youssef Hergal - Find new skeletons to add - 2025-01-27
		// FUNCTIONALITY: Compares current skeletons with existing viewers to find new ones
		// WHY: Only adds skeletons that don't already exist, avoiding duplicates
		// PERFORMANCE: O(n*m) comparison but much faster than reloading everything
		const newSkeletons = currentSkeletons.filter(skeleton => 
			!currentViewers.some(viewer => 
				viewer.skeletonPath === skeleton.fileName || viewer.bvhName === skeleton.fileName
			)
		)
		
		// Added by Youssef Hergal - Find skeletons to remove - 2025-01-27
		// FUNCTIONALITY: Identifies viewers that no longer exist in the skeleton list
		// WHY: Only removes skeletons that were actually deleted, not all of them
		// PERFORMANCE: Targeted removal instead of complete reload
		const skeletonsToRemove = currentViewers.filter(viewer => 
			!currentSkeletons.some(skeleton => 
				skeleton.fileName === viewer.skeletonPath || skeleton.fileName === viewer.bvhName
			)
		)
		
		// Added by Youssef Hergal - Add new skeletons individually - 2025-01-27
		// FUNCTIONALITY: Adds each new skeleton without affecting existing ones
		// WHY: Granular addition instead of complete reload
		// PERFORMANCE: Only loads what's new, preserves existing skeletons
		for (const skeleton of newSkeletons) {
			await addSkeletonViewer(skeleton)
		}
		
		// Added by Youssef Hergal - Remove old skeletons individually - 2025-01-27
		// FUNCTIONALITY: Removes each deleted skeleton without affecting others
		// WHY: Targeted removal instead of complete reload
		// PERFORMANCE: Only removes what's deleted, preserves existing skeletons
		for (const viewer of skeletonsToRemove) {
			removeSkeletonViewer(viewer.skeletonPath || viewer.bvhName)
		}
		
		if (newSkeletons.length > 0 || skeletonsToRemove.length > 0) {
			isChanged = true
			isBonesListReady = true
		}
	})
	
	// Added by Youssef Hergal - Watch for changes in BVH visibility and handle individually - 2025-01-27
	// FUNCTIONALITY: Updates skeleton visibility without reloading them
	// WHY: Much faster than reloading - just changes the 'visible' property
	// PERFORMANCE: O(1) property change per skeleton instead of O(n) reload
	createEffect(() => {
		const visibilityMap = bvHVisibilityMap()
		const currentViewers = skeletonViewers
		
		// Added by Youssef Hergal - Update visibility for each viewer - 2025-01-27
		// FUNCTIONALITY: Changes only the visibility property of each skeleton
		// WHY: Avoids reloading skeletons just to show/hide them
		// PERFORMANCE: Instant visibility toggle instead of full reload
		currentViewers.forEach(viewer => {
			const fileName = viewer.skeletonPath || viewer.bvhName
			if (fileName) {
				const shortFileName = fileName.replace('bvh2/', '')
				const isVisible = visibilityMap[shortFileName] !== false
				toggleSkeletonViewer(fileName, isVisible)
			}
		})
		
		isChanged = true
		isBonesListReady = true
	})
}

async function clearEverything(file, label) {
	// console.log("Clearing and loading new skeleton: ", file)
	const groupLabel = label || `Skeleton ${skeletonsArray().length + 1}`

	// You can optionally modify the skeletonsArray here if needed
}

async function loadFile(file, label) {
	await clearEverything(file, label) // Clear current scene and load a new file for the given label
}
function formatBoneNames(bones) {
	return bones.map((bone) => {
		const level = bone.depth // Assume each bone object has a 'depth' property
		const prefix = "-".repeat(level * 1) // Create indentation based on depth (4 spaces per level)
		return `•${prefix}${bone.name}` // Return only the formatted name with indentation
	})
}
function extractJointNames(variables) {
	const jointNames = [
		"Spine",
		"Spine1",
		"Spine2",
		"Spine3",
		"Hips",
		"Neck",
		"Head",
		"LeftArm",
		"LeftForeArm",
		"RightArm",
		"RightForeArm",
		"LeftShoulder",
		"LeftShoulder2",
		"RightShoulder",
		"RightShoulder2",
		"LeftUpLeg",
		"LeftLeg",
		"RightUpLeg",
		"RightLeg",
	]

	return variables.filter((variable) =>
		jointNames.some((joint) => variable.includes(joint))
	)
}

async function initializeWhenLoaded(isDataFrameOn = false) {
	skeletonViewersSig().forEach((viewer) => {
		viewer.mixer.timeScale = 1
	})

	await preparePlotsData()

	createPlot2D(0, toggleValue())
	createPlot3D(0)

	skeletonViewersSig().forEach((viewer) => {
		viewer.mixer.setTime(0)

		viewer.mixer.timeScale = 0
		viewer.stop()
	})

	if (!checkboxValue()) {
		setLoadingDone(true)
	}
	setAppIsLoaded(true)

	function preparePlotsData() {
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

		// Added by Youssef Hergal - Only process visible viewers for plots - 2025-01-27
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

		// Added by Youssef Hergal - Iterate through each visible viewer - 2025-01-27
		// FUNCTIONALITY: Processes only visible skeletons for plot generation
		// WHY: Saves computation time by skipping hidden skeletons
		// PERFORMANCE: O(visible_skeletons) instead of O(total_skeletons)
		visibleViewers.forEach((viewer, index) => {
			const [
				originalPositionsX,
				originalPositionsY,
				originalPositionsZ,
				originalAnglesX,
				originalAnglesY,
				originalAnglesZ,
				originalVelocities,
				originalAccelerations,
			] = viewer.getTimeSeries("Hips")
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

		// Create new arrays before passing to set functions
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
}

export {
	loadFile,
	initialize,
	initializeWhenLoaded,
	formatBoneNames,
	extractJointNames,
}
