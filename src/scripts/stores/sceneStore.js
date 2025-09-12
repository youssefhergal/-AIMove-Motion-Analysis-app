/**
 * Scene Store
 * 
 * Manages all 3D scene and skeleton-related state including:
 * - 3D scene instances
 * - Skeleton data and viewers
 * - Animation states
 * - BVH file management
 */

import { createSignal } from "solid-js"

// 3D Scene
const [baseScene, setBaseScene] = createSignal([])

// Skeleton data
const [skeletons, setSkeletons] = createSignal([])
const [skeletonsArray, setSkeletonsArray] = createSignal([])
const [skeletonViewersSig, setSkeletonViewersSig] = createSignal([])

// Animation states
const [playPressed, setPlayPressed] = createSignal(false)
const [toolTipVisibility, setToolTipVisibility] = createSignal([])

// BVH file management
const [selectedBVH, setSelectedBVH] = createSignal("MCEAS02G01R03.bvh")
const [selectedBVHList, setSelectedBVHList] = createSignal(["MCEAS02G01R03.bvh"])
const [bvHVisibilityMap, setBVHVisibilityMap] = createSignal({})
const [isBVHdefault, setIsBVHdefault] = createSignal(true)

// Helper functions
function getCurrentActiveBVH() {
	const list = selectedBVHList()
	return list.length > 0 ? list[0] : "MCEAS02G01R03.bvh"
}

function getVisibleBVHFiles() {
	const list = selectedBVHList()
	const visibilityMap = bvHVisibilityMap()
	
	return list.filter(fileName => visibilityMap[fileName] !== false)
}

function getVisibleSkeletons() {
	const skeletons = skeletonsArray()
	const visibilityMap = bvHVisibilityMap()
	
	return skeletons.filter(skeleton => {
		const fileName = skeleton.fileName.replace('bvh2/', '')
		return visibilityMap[fileName] !== false
	})
}

function initializeSkeletonArray() {
	const currentSkeletons = skeletonsArray()
	if (currentSkeletons.length === 0) {
		const defaultSkeleton = {
			label: "Skeleton 1",
			fileName: "bvh2/MCEAS02G01R03.bvh"
		}
		setSkeletonsArray([defaultSkeleton])
	}
}

export {
	// 3D Scene
	baseScene, setBaseScene,
	
	// Skeleton data
	skeletons, setSkeletons,
	skeletonsArray, setSkeletonsArray,
	skeletonViewersSig, setSkeletonViewersSig,
	
	// Animation states
	playPressed, setPlayPressed,
	toolTipVisibility, setToolTipVisibility,
	
	// BVH management
	selectedBVH, setSelectedBVH,
	selectedBVHList, setSelectedBVHList,
	bvHVisibilityMap, setBVHVisibilityMap,
	isBVHdefault, setIsBVHdefault,
	
	// Helper functions
	getCurrentActiveBVH,
	getVisibleBVHFiles,
	getVisibleSkeletons,
	initializeSkeletonArray
}
