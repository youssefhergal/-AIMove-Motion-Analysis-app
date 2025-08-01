import { myScene } from "./myScene"
import { createPlot2D, createPlot3D } from "./plots"
import { do_gom } from "./tensorflowGOM"
import { DoGOM_init } from "./CheckboxDexAnalysis"
import { ResizeEverything } from "./ResizeEverything"

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
} from "./store"

// import { initMathJax } from "./InitMathJax.js"

async function initialize() {
	console.log("🔄 Starting initialize function")
	await myScene.init({
		setCurrentAnimationTime, // Pass the SolidJS setter
	})

	console.log("✅ myScene.init completed, globalResult:", {
		hasGlobalResult: !!myScene.globalResult,
		hasBvhBones: !!(myScene.globalResult && myScene.globalResult.bvhBones),
		bonesLength: myScene.globalResult?.bvhBones?.length || 0
	})

	await myScene.onWindowResize()
	await updateDuration()
	await waitForMixerTime()
	await bonesCreation()
	await setBonesList(formatBoneNames(myScene.boneHierarchy))
	// setBonesList(extractJointNames(bonesList()))
	await setSelectedValue(bonesList()[0])
	await preparePlotsData()

	console.log("start_dataframe_creation")
	let [val] = await myScene.createDataframes()

	// console.log("VAL:", val)
	setInputGOM(val)
	console.log("finish_dataframe_creation")

	//console.log('yo ',formatBoneNames(myScene.boneHierarchy))
	setLoadingDone(true)

	//updateMarkerPosition(0.2)
	myScene.mixer.timeScale = 0
	await myScene.animate()
	console.log("PreparePLotsDataAgaiin???", selectedJoint())
	await createPlot2D(currentAnimationTime(), toggleValue())
	await createPlot3D(currentAnimationTime())

	console.log("✅ Initialize function completed")

	// await initMathJax()
	// do_gom(val).then(({ df_coef, df_pred }) => {
	// 	console.log(df_pred)
	// 	console.log(df_coef)
	// })

	// let { df_coef, df_pred } = do_gom(val)
	// console.log(df_pred)
	// console.log(df_coef)

	// console.log(formatBoneNames(myScene.boneHierarchy))
}

async function preparePlotsData() {
	console.log("PreparePLotsData")
	const [
		originalPositionsX,
		originalPositionsY,
		originalPositionsZ,
		originalAnglesX,
		originalAnglesY,
		originalAnglesZ,
	] = myScene.getTimeSeries("Hips")

	if (mode2DPlot() === false) {
		setName2DPlot("Position")
		setPositionsX_2D([...originalPositionsX])
		setPositionsY_2D([...originalPositionsY])
		setPositionsZ_2D([...originalPositionsZ])
	} else {
		setName2DPlot("Angle")
		setPositionsX_2D([...originalAnglesX])
		setPositionsY_2D([...originalAnglesY])
		setPositionsZ_2D([...originalAnglesZ])
	}

	if (mode3DPlot() === false) {
		setName3DPlot("Position")
		setPositionsX_3D([...originalPositionsX])
		setPositionsY_3D([...originalPositionsY])
		setPositionsZ_3D([...originalPositionsZ])
	} else {
		setName3DPlot("Angle")
		setPositionsX_3D([...originalAnglesX])
		setPositionsY_3D([...originalAnglesY])
		setPositionsZ_3D([...originalAnglesZ])
	}
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
function formatBoneNames(bones) {
	return bones.map((bone) => {
		const level = bone.depth // Assume each bone object has a 'depth' property
		const prefix = "-".repeat(level * 1) // Create indentation based on depth (4 spaces per level)
		return `•${prefix}${bone.name}` // Return only the formatted name with indentation
	})
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

export {
	loadFile,
	play,
	stop,
	initialize,
	uploadFile,
	preparePlotsData,
	formatBoneNames,
	extractJointNames,
}
