import * as THREE from "three"
// import { OrbitControls } from "../../build/OrbitControls.js"
import Stats from "../../build/stats.module.js"
import { GPUStatsPanel } from "../../build/GPUStatsPanel.js"

import { GUI } from "../../build/lil-gui.module.min.js"

import { Line2 } from "../../build/lines/Line2.js"
import { LineMaterial } from "../../build/lines/LineMaterial.js"
import { LineGeometry } from "../../build/lines/LineGeometry.js"

import { BVHLoader } from "../../build/BVHLoader.js"

import { OrbitControls } from "./OrbitControls.js"
import { OrbitControlsGizmo } from "./OrbitControlsGizmo.js"

import {
	currentAnimationTime,
	selectedJoint,
	translateFixerGlobal,
	scaleX,
	setSelectedJoint,
	mouseJointHover,
	setMouseJointHover,
	setSelectedValue,
	bonesList,
	rawSkeletenBones,
	setRawSkeletenBones,
} from "./store.js"

let myScene = {
	// Declare properties for storing objects
	helper: null,
	loader: new BVHLoader(),
	playPressed: false,
	// clonedSkeleton: null,
	animationClip: null,
	boneHierarchy: [],
	boneNames: [],
	jointIndex: [],
	boneIndex: [],
	flexLastVal: null,
	specificBone: null,
	thipsPosition: null,
	container: null,
	renderedScene: null,
	width: null,
	height: null,
	clock: new THREE.Clock(),
	camera: null,
	controls: null,
	scene: null,
	renderer: null,
	grid: null,
	mixer: null,
	action: null,
	sphereMeshes: [],
	lineMeshes: [],
	globalResult: null,
	mouse: new THREE.Vector2(),
	newPosition: null,
	displacement: null,
	loader: new BVHLoader(),
	stats: null,
	gpuPanel: null,
	startPosition: new THREE.Vector3(),
	endPosition: new THREE.Vector3(),
	axesHelper: null,
	positions: new Float32Array([1, 1, 1, 1, 1, 1]),
	matLine: new LineMaterial({
		color: 0x000000,
		linewidth: 1,
		worldUnits: true,
	}),
	// slider: document.getElementById("threePanel"),
	bvhFilePath: "./bvh2/MCEAS02G01R03.bvh",

	clearScene: function () {
		this.action.paused = true
		this.action.stop()
		this.mixer.timeScale = 0

		// Διαγραφή όλων των αντικειμένων από τη σκηνή
		while (this.scene.children.length > 0) {
			const object = this.scene.children[0]
			if (object.geometry) object.geometry.dispose()
			if (object.material) {
				if (object.material.length) {
					for (let i = 0; i < object.material.length; ++i) {
						object.material[i].dispose()
					}
				} else {
					object.material.dispose()
				}
			}
			if (object.texture) object.texture.dispose()
			this.scene.remove(object)
		}

		// Διαγραφή όλων των Meshes
		this.sphereMeshes.forEach((mesh) => {
			if (mesh.geometry) mesh.geometry.dispose()
			if (mesh.material) mesh.material.dispose()
			this.scene.remove(mesh)
		})
		this.lineMeshes.forEach((mesh) => {
			if (mesh.geometry) mesh.geometry.dispose()
			if (mesh.material) mesh.material.dispose()
			this.scene.remove(mesh)
		})
		this.sphereMeshes = []
		this.lineMeshes = []

		// Επαναρχικοποίηση του AnimationMixer
		if (this.mixer) {
			this.mixer.uncacheRoot(this.mixer.getRoot())
			this.mixer = null
		}

		// Καθαρισμός controls, stats, κλπ.
		if (this.controls) this.controls.dispose()
		if (this.helper) this.helper.dispose()
		if (this.stats) this.stats.dom.remove()

		if (this.renderer) {
			const existingCanvas = this.renderer.domElement
			if (existingCanvas && existingCanvas.parentNode) {
				existingCanvas.parentNode.removeChild(existingCanvas)
			}
			this.renderer.dispose()
		}

		// Επαναρχικοποίηση των πόρων και των ρυθμίσεων της κάμερας
		if (this.camera) this.camera = null

		// Επαναρχικοποίηση των υπόλοιπων μεταβλητών
		this.helper = null
		this.flexLastVal = 50
		this.boneHierarchy = []
		this.playPressed = false
		this.animationClip = null
		this.boneNames = []
		this.jointIndex = []
		this.boneIndex = []
		this.specificBone = null
		this.hipsPosition = null
		this.container = null
		this.renderedScene = null
		this.width = null
		this.height = null
		this.clock = new THREE.Clock()
		this.camera = null
		this.controls = null
		this.scene = null
		this.renderer = null
		this.grid = null
		this.mixer = null
		this.action = null
		this.sphereMeshes = []
		this.lineMeshes = []
		this.globalResult = null
		this.mouse = new THREE.Vector2()
		this.newPosition = null
		this.displacement = null
		this.loader = new BVHLoader()
		this.stats = null
		this.gpuPanel = null
		this.startPosition = new THREE.Vector3()
		this.endPosition = new THREE.Vector3()
		this.axesHelper = null
		this.positions = new Float32Array([1, 1, 1, 1, 1, 1])
		this.matLine = new LineMaterial({
			color: 0x000000,
			linewidth: 1,
			worldUnits: true,
		})
		//this.slider= document.getElementById("threePanel");
		this.bvhFilePath = "./bvh2/MCEAS02G01R03.bvh"
		console.log("all cleared")
	},

	// Initialize the application
	init: async function (options) {
		console.log("init started")
		this.options = options

		this.container = document.getElementById("threePanel")
		// this.renderedScene=document.getElementById('threelogs');
		this.width = this.container.clientWidth
		this.height = this.container.clientHeight
		console.log(this.width, this.height)

		this.addListeners()
		this.setupScene()
		if (!this.renderer) {
			this.setupRendererAndCamera()
			//document.getElementById('anim').appendChild(this.renderer.domElement);
		} else {
			// Update renderer size or other properties as needed
			this.renderer.setSize(this.width, this.height)
		}
		this.setupControls()
		//window.addEventListener('resize', () => this.onWindowResize(), false);
		this.renderer.domElement.id = "threeSkeleton"

		this.stats = new Stats()
		this.container.appendChild(this.stats.dom)
		this.stats.dom.id = "myStatsContainer"
		//document.body.appendChild(this.stats.dom);
		this.gpuPanel = new GPUStatsPanel(this.renderer.getContext())
		this.stats.addPanel(this.gpuPanel)
		this.stats.showPanel(0)
		try {
			const result = await this.loadBVHFile(this.bvhFilePath)
			this.handleBVHLoad(result)
		} catch (error) {
			console.error(
				"An error happened during the loading of the BVH file:",
				error
			)
		}
		// await this.createDataframes()
		this.renderer.autoClear = false
		console.log("Setup Done!! for ", this.bvhFilePath)
	},

	animate: function () {
		requestAnimationFrame(() => this.animate())
		this.renderer.clear()
		this.stats.update()
		this.updateSpherePositions()
		this.updateLinePositions()
		const delta = this.clock.getDelta()
		if (this.mixer) {
			this.mixer.update(delta)
			//this.slider.value = this.mixer.time;
			this.options.setCurrentAnimationTime(this.action.time)
		}
		this.gpuPanel.startQuery()

		this.renderer.render(this.scene, this.camera)
		// this.helper.render()

		this.gpuPanel.endQuery()
		this.controls.update()
	},

	loadBVHFile: function (filePath) {
		return new Promise((resolve, reject) => {
			this.loader.load(
				filePath,
				(result) => {
					resolve(result)
				},
				undefined,
				(error) => {
					reject(error)
				}
			)
		})
	},

	// Handle BVH load result and start animation

	cutFirstFrames: function (clip, timeToCut) {
		clip.tracks.forEach((track) => {
			// Filter out keyframes that are within the time to cut
			let times = track.times
			let values = track.values
			let stride = values.length / times.length

			let startIndex = times.findIndex((time) => time >= timeToCut)
			if (startIndex === -1) {
				// No keyframes after the cut time
				startIndex = times.length
			}

			track.times = times.slice(startIndex).map((time) => time - timeToCut)
			track.values = values.slice(startIndex * stride)
		})

		// Adjust the duration of the clip
		clip.duration -= timeToCut
	},

	handleBVHLoad: function (result) {
		console.log("BVH file loaded successfully.")
		this.globalResult = result // Store the result for use within other methods
		const bvhBones = this.globalResult.bvhBones
		console.log("BVHbones: ", bvhBones)
		setRawSkeletenBones(bvhBones)
		// this.clonedSkeleton = result.skeleton.clone()
		// console.log(this.clonedSkeleton.bones)
		this.animationClip = result.clip // Storing the clip in the global scope for later use
		console.log(result.skeleton.bones[0])
		this.scene.add(result.skeleton.bones[0]) // Add skeleton bones to the scene
		// this.setupMixer(result) // Setup the animation mixer with the loaded result
		const fps = 90 // Define the frames per second
		const framesToCut = 5
		const timeToCut = framesToCut / fps
		// Example usage:
		this.cutFirstFrames(result.clip, timeToCut)
		this.setupMixer(result) // Setup the animation mixer with the modified result

		const frameNumber = 1 // Initial frame
		const timeInSeconds = frameNumber / fps // Convert frame number to seconds
		this.mixer.setTime(timeInSeconds) // Set the mixer time

		setTimeout(() => {
			this.reCenter() // Call reCenter to adjust the camera and scene

			// Get the total duration of the animation from the clip
			const totalDuration = this.mixer
				.clipAction(result.clip)
				.getClip().duration
			// Set the maximum value of the animation slider to the total duration
			//document.getElementById('sldSkip2').max = totalDuration;
			this.addLights() // Add lighting to the scene
			this.createSphereMeshes() // Create visual representations for bones
			this.createBoneMeshes() // Optionally create visual representations for bone connections
			//this.animate(); // Start the animation loop
		}, 1000) // Delay to ensure everything is set up properly
	},

	getAnimationDuration: function () {
		return this.mixer && this.action && this.action.getClip()
			? this.action.getClip().duration
			: 0
	},

	setupScene: function () {
		this.scene = new THREE.Scene()
		// this.scene.background = new THREE.Color(0xeeeeee);
		this.scene.background = new THREE.Color(0xeeeeee)
		this.grid = new THREE.GridHelper(400, 10)
		this.scene.add(this.grid)
		this.axesHelper = new THREE.AxesHelper(500)
		this.scene.add(this.axesHelper)
	},

	setupRendererAndCamera: function () {
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		})
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(this.width, this.height)
		this.container.appendChild(this.renderer.domElement)
		this.camera = new THREE.PerspectiveCamera(
			60,
			this.width / this.height,
			0.1,
			1000
		)
		this.camera.position.set(0, 200, -300)
	},

	setupControls: function () {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.zoomSpeed = 1.2
		this.controls.panSpeed = 0.8
	},

	// Setup the animation mixer
	setupMixer: function (result) {
		this.mixer = new THREE.AnimationMixer(result.skeleton.bones[0]) // Create an animation mixer
		this.action = this.mixer.clipAction(result.clip) // Get the action from the clip
		this.action.play() // Play the action
		// this.action.paused = true; // If you need to start with the action paused
		//this.mixer.timeScale = 0; // Initially set the timeScale to 0
		this.action.clampWhenFinished = true
	},

	// Utility method for creating sphere meshes, assuming you're visualizing joints or similar
	createSphereMeshes: function () {
		let geometry

		// Helper function to calculate depth
		function calculateDepth(bone) {
			let depth = 0
			let currentBone = bone
			while (currentBone.parent && currentBone.parent.type !== "Scene") {
				// Assuming the root parent is of type 'Scene'
				currentBone = currentBone.parent
				depth++
			}
			return depth
		}

		this.globalResult.skeleton.bones.forEach((bone, index, array) => {
			const depth = calculateDepth(bone) // Calculate the depth based on parent chain
			if (bone.name === "ENDSITE" && index > 0) {
				// Ensure there is a preceding bone
				const previousBoneName = array[index - 1].name
				bone.name = `${previousBoneName}_end`
			}
			if (bone.name === "LeftFootToe_end" || bone.name === "RightFootToe_end") {
				geometry = new THREE.SphereGeometry(0, 32, 32)
			} else if (depth >= 9) {
				geometry = new THREE.SphereGeometry(1.2, 32, 32)
			} else {
				geometry = new THREE.SphereGeometry(3, 32, 32)
			}

			// const material = new THREE.MeshBasicMaterial({ color: 0x1e406b })
			const material = new THREE.MeshBasicMaterial({ color: 0x145e9f })

			const sphere = new THREE.Mesh(geometry, material)
			bone.getWorldPosition(sphere.position)
			this.scene.add(sphere)
			this.sphereMeshes.push(sphere)
			this.boneNames.push(bone.name)
			if (!bone.name.endsWith("end")) {
				this.boneHierarchy.push({ name: bone.name, depth: depth }) // Add the bone and its depth to the hierarchy list
			}
		})

		// console.log('Type of boneNames: ', typeof this.boneNames);
		// console.log('Bone Names: ', this.boneNames);
		// console.log('Bone Hierarchy: ', this.boneHierarchy);

		// Creating a map of bone names to their indices for quick lookup
		this.jointIndex = this.boneNames.reduce((acc, bone, index) => {
			acc[bone] = index
			return acc
		}, {})

		this.boneIndex = this.boneNames.reduce((acc, bone, index) => {
			// Check if the bone name ends with '_end'
			if (bone.endsWith("_end")) {
				return acc // Skip this bone and do not increment the index for the next bone
			}

			acc[bone] = acc.hasOwnProperty("lastIndex") ? acc["lastIndex"] + 1 : index // Use lastIndex if it exists, otherwise use the current index
			acc["lastIndex"] = acc[bone] // Update lastIndex to the current bone's index
			return acc
		}, {})

		// Clean up the auxiliary property once indexing is complete
		delete this.boneIndex["lastIndex"]

		this.sphereMeshes[this.jointIndex[selectedJoint()]].material.color.set(
			0x00ff00
		) // Set specific joint color to green

		// console.log(this.globalResult.skeleton.bones)
	},

	updateSpherePositions: function () {
		this.globalResult.skeleton.bones.forEach((bone, index) => {
			if (this.sphereMeshes[index]) {
				bone.getWorldPosition(this.sphereMeshes[index].position)
			}
		})
	},

	createBoneMeshes: function () {
		this.globalResult.skeleton.bones.forEach((bone) => {
			const lineGeometry = new LineGeometry()
			// Assuming positions is a property of myScene, like this.positions
			lineGeometry.setPositions(this.positions)

			const lineMesh = new Line2(lineGeometry, this.matLine)
			lineMesh.computeLineDistances()
			lineMesh.scale.set(1, 1, 1)
			this.matLine.linewidth = 2

			if (bone.parent) {
				bone.getWorldPosition(this.startPosition)
				bone.parent.getWorldPosition(this.endPosition)
				this.positions.set(
					[
						this.startPosition.x,
						this.startPosition.y,
						this.startPosition.z,
						this.endPosition.x,
						this.endPosition.y,
						this.endPosition.z,
					],
					0
				)

				if (bone.name === "Hips") {
					lineMesh.visible = false
				}

				lineMesh.geometry.setPositions(this.positions)
				this.lineMeshes.push(lineMesh)
				this.scene.add(lineMesh)
			}
		})
	},

	updateLinePositions: function () {
		this.globalResult.skeleton.bones.forEach((bone, index) => {
			//console.log(bone, index);
			if (bone.parent && this.lineMeshes[index]) {
				bone.getWorldPosition(this.startPosition)
				bone.parent.getWorldPosition(this.endPosition)

				const line = this.lineMeshes[index]
				if (line && line.geometry instanceof LineGeometry) {
					line.geometry.attributes.instanceStart.setXYZ(
						0,
						this.startPosition.x,
						this.startPosition.y,
						this.startPosition.z
					)
					line.geometry.attributes.instanceEnd.setXYZ(
						0,
						this.endPosition.x,
						this.endPosition.y,
						this.endPosition.z
					)
					line.geometry.attributes.instanceStart.needsUpdate = true
					line.geometry.attributes.instanceEnd.needsUpdate = true
				} else {
					console.error(
						"LineGeometry or lineMesh not found or invalid for index:",
						index
					)
				}
			}
		})
	},

	onWindowResize: function () {
		this.container = document.getElementById("threePanel")
		// this.renderedScene=document.getElementById('threelogs');
		this.width = this.container.clientWidth
		this.height = this.container.clientHeight
		this.camera.aspect = this.width / this.height

		this.camera.updateProjectionMatrix()
		this.renderer.setSize(this.width, this.height)

		console.log(this.width, this.height)
	},

	reCenter: function () {
		this.newPosition = new THREE.Vector3()
		this.globalResult.skeleton.bones[0].scale.set(0.5, 0.5, 0.5)
		this.globalResult.skeleton.bones[0].getWorldPosition(this.newPosition) // Get the new position
		let minDistance = Infinity
		let closestBone = null

		this.newPosition.y -= 200 // Adjust Y position

		this.globalResult.skeleton.bones.forEach((bone) => {
			let boneWorldPosition = new THREE.Vector3()
			bone.getWorldPosition(boneWorldPosition)
			let distance = Math.abs(boneWorldPosition.y - this.newPosition.y)
			if (distance < minDistance) {
				minDistance = distance
				closestBone = bone
			}
		})
		console.log("minDistance: ", minDistance)
		console.log("closestBone: ", closestBone)
		this.newPosition.y += minDistance // Adjust Y position

		this.displacement = new THREE.Vector3().subVectors(
			this.newPosition,
			this.grid.position
		) // Calculate displacement

		this.camera.position.add(this.displacement) // Move the camera based on displacement
		this.controls.update() // Update controls
		this.grid.position.copy(this.newPosition) // Update grid position
		this.axesHelper.position.copy(this.newPosition)
		this.specificBone = this.globalResult.skeleton.bones[1]
		this.hipsPosition = new THREE.Vector3()
		this.camera.lookAt(this.specificBone.getWorldPosition(this.hipsPosition)) // Make the camera look at the new position
		this.controls.target.copy(this.hipsPosition) // Update controls target
		this.helper = new OrbitControlsGizmo(this.controls, {
			size: 100,
			padding: 8,
			bubbleSizePrimary: 9,
			bubbleSizeSecondary: 9,
			// fontSize: 8,
		})
		this.helper.domElement.id = "helperElement"
		this.container.appendChild(this.helper.domElement)

		// Scale down the skeleton for visibility
	},

	addLights: function () {
		const small_sphere = new THREE.SphereGeometry(3, 16, 8)
		const directionalLight = new THREE.DirectionalLight(0xffffff, 5) // Create a directional light
		directionalLight.position.copy(this.newPosition) // Position the light at the newPosition
		directionalLight.position.z -= 200
		directionalLight.position.y += 200
		//directionalLight.add(new THREE.Mesh(small_sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 })));

		this.scene.add(directionalLight) // Add the directional light to the scene

		const lightTarget = new THREE.Object3D() // Create an object to target the light
		lightTarget.position.copy(this.newPosition) // Set the light target's position
		this.scene.add(lightTarget) // Add the light target to the scene
		directionalLight.target = lightTarget // Set the directional light's target
	},

	play: function () {
		this.playPressed = true
		if (this.mixer) {
			this.mixer.timeScale = 1
			this.action.paused = false
		}
	},

	stop: function () {
		if (this.mixer) {
			this.mixer.timeScale = 0
		}
	},

	setAnimationTime: function (timeInSeconds) {
		if (this.mixer) {
			if (this.mixer.timeScale === 1) {
				this.mixer.setTime(timeInSeconds)
			}

			if (this.mixer.timeScale === 0) {
				this.mixer.timeScale = 1

				this.mixer.setTime(timeInSeconds)
				this.mixer.timeScale = 0
			}
		}
	},

	addListeners: function () {
		document.addEventListener("mousemove", (event) => this.onMouseMove(event))

		document.addEventListener("click", (event) => {
			let valueSelected = ""
			if (mouseJointHover() !== null) {
				bonesList().forEach((bone) => {
					if (bone.includes(mouseJointHover()[1])) {
						valueSelected = bone
					}
				})

				setSelectedValue(valueSelected)
				this.sphereMeshes[this.jointIndex[selectedJoint()]].material.color.set(
					0x145e9f
				)
				setSelectedJoint(mouseJointHover()[1])
				this.sphereMeshes[this.jointIndex[selectedJoint()]].material.color.set(
					"red"
				)
			}
		})
	},
	getWidthById: function (elementId) {
		try {
			const element = document.getElementById(elementId)
			if (!element) {
				throw new Error(`Element with ID '${elementId}' not found.`)
			}
			if (!document.body.contains(element)) {
				throw new Error(
					`Element with ID '${elementId}' is not in the document.`
				)
			}
			return element.clientWidth
		} catch (error) {
			console.error("Error encountered:", error.message)
			return 0 // Return the last known good value to prevent crashing
		}
	},

	// Convert an object's 3D position to screen position
	toScreenPosition: function (obj) {
		const vector = new THREE.Vector3()
		const widthHalf = 0.5 * this.renderer.getContext().canvas.width
		const heightHalf = 0.5 * this.renderer.getContext().canvas.height

		obj.updateMatrixWorld()
		vector.setFromMatrixPosition(obj.matrixWorld)
		vector.project(this.camera)

		return {
			x: vector.x * widthHalf + widthHalf,
			y: -(vector.y * heightHalf) + heightHalf,
		}
	},

	// Handle mouse move events to update mesh colors and show tooltip
	onMouseMove: function (event) {
		function styleWords(str, style) {
			return str
				.split(" ")
				.map((word) => `<span style="${style}">${word}</span>`)
				.join(" ")
		}

		event.preventDefault()

		function getScreenScaling() {
			let scaleValue =
				1 / window.devicePixelRatio + 0.03 * window.devicePixelRatio

			if (window.devicePixelRatio === 1) {
				scaleValue = 1
			}

			// if (window.devicePixelRatio === 1) {
			// 	scaleValue = 1
			// } else if (window.devicePixelRatio === 1.25) {
			// 	scaleValue = 0.845
			// } else if (window.devicePixelRatio === 1.5) {
			// 	scaleValue = 0.73
			// } else if (window.devicePixelRatio === 1.75) {
			// 	scaleValue = 0.641
			// } else if (window.devicePixelRatio === 2) {
			// 	scaleValue = 0.57
			// } else if (window.devicePixelRatio === 2.25) {
			// 	scaleValue = 0.521
			// }
			return {
				scaleValue: scaleValue,
			}
		}
		const scalingInfo = getScreenScaling()

		// console.log(
		// 	"scaleValue: ",
		// 	scalingInfo.scaleValue,
		// 	window.devicePixelRatio,
		// 	scaleX()
		// )

		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
		const tooltip = document.getElementById("tooltip")
		let tooltipVisible = false
		tooltip.style.display = "block"
		// console.log(window.screen.width);
		setMouseJointHover(null)
		this.sphereMeshes.forEach((mesh, index) => {
			// mesh.material.color.set(0x1E406B); // Reset mesh color to blue
			// mesh.material.color.set(0x005f9f) // Reset mesh color to blue
			mesh.material.color.set(0x145e9f) // Reset mesh color to blue

			if (index === this.jointIndex[selectedJoint()]) {
				mesh.material.color.set("red") // Reset mesh color to green
			}

			const offsetScreenW = document.getElementById("threelogs")
			const offsetScreenH = document.getElementById("footer")
			const pos = this.toScreenPosition(mesh)
			pos.x =
				(pos.x + offsetScreenW.offsetWidth) * scaleX() * scalingInfo.scaleValue
			pos.y =
				(pos.y + offsetScreenH.offsetHeight + 7) *
				scaleX() *
				scalingInfo.scaleValue
			const dx = event.clientX - pos.x
			const dy = event.clientY - pos.y

			if (mouseJointHover() === null) {
				if (dx * dx < 50 && dy * dy < 50) {
					// Check if mouse is close to a mesh
					const exists = bonesList().some((bone) =>
						bone.includes(this.boneNames[index])
					)
					if (!exists) {
						mesh.material.color.set(0x104a7e) // Reset mesh color to green
					} else if (index === this.jointIndex[selectedJoint()]) {
						mesh.material.color.set(0xb30000) // Reset mesh color to green
					} else {
						mesh.material.color.set(0x00ff00) // Change mesh color to green
					}
					tooltip.innerHTML = `<div style="text-align: left; font-weight: 450;">Name: ${
						styleWords(this.boneNames[index], "color: black; font-weight: 550;") // Example style
					}</div>
					<div style=" font-weight: 450;" > X: ${styleWords(
						mesh.position.x.toFixed(2),
						"color: red;"
					)}, Y: ${styleWords(
						mesh.position.y.toFixed(2),
						"color: green;"
					)}, Z: ${styleWords(
						mesh.position.z.toFixed(2),
						"color: blue;"
					)}</div>`
					tooltip.style.left = `${(event.clientX + 15) / scaleX()}px`
					tooltip.style.top = `${(event.clientY + 15) / scaleX()}px`
					tooltip.style.visibility = "visible"
					tooltipVisible = true
					if (exists) {
						setMouseJointHover([bonesList()[index], this.boneNames[index]])
					}
				}
			}
		})

		if (!tooltipVisible) {
			tooltip.style.visibility = "hidden"
		}
	},

	getTimeSeries: function (jointName = "RightArm") {
		//this.mixer.timeScale = 1;

		const baseIndex = this.boneIndex[selectedJoint()] * 2 // Since each bone has two tracks
		const index = this.jointIndex[selectedJoint()]
		let skeleton = this.globalResult.skeleton // Adjust the access based on how you store the skeleton
		// console.log(skeleton)
		let bone = skeleton.bones[index]

		if (!bone) {
			console.error("Bone not found:", jointName)
			return []
		}

		let jointAnimationClip = this.animationClip
		//let positionTrack = jointAnimationClip.tracks[index];
		let rotationTrack = jointAnimationClip.tracks[baseIndex + 1] // Quaternion rotation track index

		console.log("Selected Bone: ", selectedJoint(), "    ", rotationTrack, bone)
		if (!rotationTrack) {
			console.error("No position track found at index", index)
			return []
		}

		let positionsX = []
		let positionsY = []
		let positionsZ = []

		let anglesX = [],
			anglesY = [],
			anglesZ = []

		for (let i = 0; i < rotationTrack.times.length; i++) {
			let time = rotationTrack.times[i]
			this.mixer.setTime(time) // Set the time in the mixer to update the skeleton state
			this.mixer.update(1 / 90) // Update the mixer state

			// Compute the world coordinates
			bone.updateMatrixWorld(true)
			bone.updateMatrix()
			let worldPosition = new THREE.Vector3()
			bone.getWorldPosition(worldPosition)

			positionsX.push(worldPosition.x)
			positionsY.push(worldPosition.y)
			positionsZ.push(worldPosition.z)

			// Compute the world orientation for angles

			// let quaternion = new THREE.Quaternion()
			// bone.getWorldQuaternion(quaternion)

			// let quaternion = new THREE.Quaternion(
			// 	rotationTrack.values[4 * i], // x
			// 	rotationTrack.values[4 * i + 1], // y
			// 	rotationTrack.values[4 * i + 2], // z
			// 	rotationTrack.values[4 * i + 3] // w
			// )

			// let euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ")

			let euler = bone.rotation

			// Convert radians to degrees
			// anglesX.push((euler.x * 180) / Math.PI)
			// anglesY.push((euler.y * 180) / Math.PI)
			// anglesZ.push((euler.z * 180) / Math.PI)

			anglesX.push(THREE.MathUtils.radToDeg(euler.x))
			anglesY.push(THREE.MathUtils.radToDeg(euler.y))
			anglesZ.push(THREE.MathUtils.radToDeg(euler.z))

			// anglesX.push(adjustAngle(THREE.MathUtils.radToDeg(euler.x)))
			// anglesY.push(adjustAngle(THREE.MathUtils.radToDeg(euler.y)))
			// anglesZ.push(adjustAngle(THREE.MathUtils.radToDeg(euler.z)))

			// function adjustAngle(angle) {
			// 	// This function adjusts angles from -180 to 180 range to -90 to 90 range
			// 	if (angle > 90) {
			// 		angle -= 180
			// 	} else if (angle < -90) {
			// 		angle += 180
			// 	}
			// 	return angle
			console.log()
		}

		return [positionsX, positionsY, positionsZ, anglesX, anglesY, anglesZ]
	},

	createDataframes: async function () {
		const variablesOpt = [
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

		let finalAnglesArray = []
		let finalWoldPosArray = []

		variablesOpt.forEach((jointName) => {
			// console.log(jointName)
			const index = this.jointIndex[jointName]
			let skeleton = this.globalResult.skeleton
			let bone = skeleton.bones[index]

			if (!bone) {
				console.error("Bone not found:", jointName)
				return
			}

			let jointAnimationClip = this.animationClip
			const baseIndex = this.boneIndex[jointName] * 2
			let rotationTrack = jointAnimationClip.tracks[baseIndex + 1]

			if (!rotationTrack) {
				console.error("No rotation track found for", jointName)
				return
			}

			let anglesX = []
			let anglesY = []
			let anglesZ = []

			let positionsX = []
			let positionsY = []
			let positionsZ = []

			for (let i = 0; i < rotationTrack.times.length; i++) {
				let time = rotationTrack.times[i]
				this.mixer.setTime(time)
				this.mixer.update(1 / 90)

				bone.updateMatrixWorld(true)
				bone.updateMatrix()
				let worldPosition = new THREE.Vector3()
				bone.getWorldPosition(worldPosition)

				positionsX.push(worldPosition.x)
				positionsY.push(worldPosition.y)
				positionsZ.push(worldPosition.z)

				let euler = bone.rotation

				anglesX.push(THREE.MathUtils.radToDeg(euler.x))
				anglesY.push(THREE.MathUtils.radToDeg(euler.y))
				anglesZ.push(THREE.MathUtils.radToDeg(euler.z))
			}

			for (let j = 0; j < anglesX.length; j++) {
				if (!finalAnglesArray[j]) {
					finalAnglesArray[j] = []
				}
				if (!finalWoldPosArray[j]) {
					finalWoldPosArray[j] = []
				}
				finalAnglesArray[j].push(anglesX[j], anglesY[j], anglesZ[j])
				finalWoldPosArray[j].push(positionsX[j], positionsY[j], positionsZ[j])
			}
		})

		// console.log(finalAnglesArray)
		// console.log(finalWoldPosArray)
		return [finalAnglesArray]
		// const numFrames = finalArray.length
		// const numElementsPerFrame = finalArray[0] ? finalArray[0].length : 0
		// console.log(
		// 	"Shape of final array: ",
		// 	numFrames,
		// 	"x",
		// 	numElementsPerFrame
		// )
	},

	// Additional utility methods as required by your application
}

export { myScene }

// createSphereMeshes: function() {
//   this.globalResult.skeleton.bones.forEach((bone) => {
//     if(bone.type!=='Scene'){
//       if(bone.name!=='ENDSITE'){
//       const geometry = new THREE.SphereGeometry(1, 32, 32); // Sphere geometry
//       const material = new THREE.MeshBasicMaterial({color: 0xff0000}); // Red color
//       const sphere = new THREE.Mesh(geometry, material);
//       bone.getWorldPosition(sphere.position);
//       this.scene.add(sphere);
//       this.sphereMeshes.push(sphere);
//       this.boneNames.push(bone.name);  // Add the bone's name to the list
//     }
//   }
//   });
// },

// updateSpherePositions: function() {
//   let indexFixer=0;
//   this.globalResult.skeleton.bones.forEach((bone, index) => {
//     if(bone.type!=='Scene'){
//       if(bone.name!=='ENDSITE'){

//       if (this.sphereMeshes[index-indexFixer]) {
//           bone.getWorldPosition(this.sphereMeshes[index-indexFixer].position);
//     }

//   }
//   else {
//     indexFixer+=1;
//     }
// }
// else {
//   indexFixer+=1;
//   }

//   });
// },
