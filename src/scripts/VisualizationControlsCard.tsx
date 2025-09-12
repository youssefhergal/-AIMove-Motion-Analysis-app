// Added by Youssef Hergal - Simple visualization controls component - 2025-01-27
import { createSignal } from "solid-js"
import { Select } from "@kobalte/core"
import { Switch } from "@kobalte/core"
// Removed Checkbox import - using HTML checkboxes instead
import { Slider } from "@kobalte/core"
import { initializeWhenLoaded } from "./useSceneSetup"
import {
	bonesList,
	selectedJoint,
	setSelectedJoint,
	currentAnimationTime,
	toggleValue,
	setAppIsLoaded,
	selectedValue,
	setSelectedValue,
	skeletonViewersSig,
	loadingDone,
	mode2DPlot,
	setMode2DPlot,
	mode3DPlot,
	setMode3DPlot,
	setName2DPlot,
	setName3DPlot,
	setSplitterSizePlotL,
	setSplitterSizePlotR,
	setSplitterSizeSkelUp,
	setSplitterSizeSkelDown,
	time_to_frame,
	setCurrentAnimationTime,
	animationDuration,
	playPressed,
	setPlayPressed,
} from "./stores/store"
import { ResizeEverything } from "./ResizeEverything"
import { updatePlot2D, updatePlot3D } from "./plots"

// Added by Youssef Hergal - Clean bone hierarchy function - 2025-01-27
function cleanBoneHierarchy(boneHierarchy) {
	if (typeof boneHierarchy !== "string") {
		console.error("Expected a string but received:", boneHierarchy)
		return ""
	}
	return [boneHierarchy].map((name) => name.replace(/[^a-zA-Z0-9_\s]/g, ""))
}

// Added by Youssef Hergal - Simple visualization controls card component - 2025-01-27
function VisualizationControlsCard() {
	const [plot2D_active, setPlot2D_active] = createSignal(true)
	const [plot3D_active, setPlot3D_active] = createSignal(true)

	// Added by Youssef Hergal - Time navigation functions - 2025-01-27
	function previousTimeValue() {
		return (time_to_frame(currentAnimationTime()) - 1) / 90
	}

	function nextTimeValue() {
		return setCurrentAnimationTime(
			(time_to_frame(currentAnimationTime()) + 1) / 90
		)
	}

	// Added by Youssef Hergal - Plot window resize function - 2025-01-27
	async function resizePlotWindows() {
		let plotActive = false
		if (plot2D_active() && !plot3D_active()) {
			setSplitterSizePlotL(0)
			setSplitterSizePlotR(0)
			setSplitterSizePlotL(100)
			setSplitterSizePlotR(0)
			plotActive = true
		} else if (plot2D_active() && plot3D_active()) {
			setSplitterSizePlotL(0)
			setSplitterSizePlotR(0)
			setSplitterSizePlotL(50)
			setSplitterSizePlotR(50)
			plotActive = true
		} else if (!plot2D_active() && plot3D_active()) {
			setSplitterSizePlotL(0)
			setSplitterSizePlotL(0)
			setSplitterSizePlotL(0)
			setSplitterSizePlotR(100)
			plotActive = true
		}

		if (!plotActive) {
			setSplitterSizeSkelUp(0)
			setSplitterSizeSkelDown(0)
			setSplitterSizeSkelUp(100)
			setSplitterSizeSkelDown(0)
		} else {
			setSplitterSizeSkelUp(0)
			setSplitterSizeSkelDown(0)
			setSplitterSizeSkelUp(50)
			setSplitterSizeSkelDown(50)
		}

		setTimeout(() => {
			ResizeEverything()
		}, 1)
	}

	return (
		<div class="file-management-card">
			
			<div class="card-content">
				{/* Joint Selection Section */}
				<div class="control-section">
					<label class="control-label">Select Joint to Plot</label>
					{loadingDone() && (
						<select 
							value={selectedValue()}
							onChange={async (e) => {
								const newValue = e.target.value
								if (newValue) {
									console.log("newValues joint: ", newValue)
									setSelectedValue(newValue)

									skeletonViewersSig().forEach((viewer) => {
										viewer.sphereMeshes.children[
											viewer.jointIndex[selectedJoint()]
										].material.color.set(0x145e9f)
									})

									setSelectedJoint(cleanBoneHierarchy(newValue)[0])

									skeletonViewersSig().forEach((viewer) => {
										viewer.sphereMeshes.children[
											viewer.jointIndex[selectedJoint()]
										].material.color.set("red")
									})

									await initializeWhenLoaded()
								}
							}}
							class="default-select"
						>
							{bonesList().map((bone) => (
								<option value={bone}>{cleanBoneHierarchy(bone)[0]}</option>
							))}
						</select>
					)}
				</div>

				{/* Animation Controls Section */}
				<div class="control-section">
					<label class="control-label">Animation Controls</label>
					<div class="animation-controls">
						<button
							onClick={() => {
								const prevValue = previousTimeValue()
								skeletonViewersSig().forEach((viewer) => {
									viewer.setAnimationTime(prevValue)
								})
							}}
							class="control-button"
							title="Previous Frame"
						>
							<span class="material-symbols-outlined">navigate_before</span>
						</button>
						<button
							onClick={() => {
								skeletonViewersSig().forEach((viewer) => {
									viewer.play()
								})
							}}
							class="control-button"
							title="Play Animation"
						>
							<span class="material-symbols-outlined">play_arrow</span>
						</button>
						<button
							onClick={() => {
								skeletonViewersSig().forEach((viewer) => {
									viewer.stop()
								})
							}}
							class="control-button"
							title="Pause Animation"
						>
							<span class="material-symbols-outlined">pause</span>
						</button>
						<button
							onClick={() => {
								const nextValue = nextTimeValue()
								skeletonViewersSig().forEach((viewer) => {
									viewer.setAnimationTime(nextValue)
								})
							}}
							class="control-button"
							title="Next Frame"
						>
							<span class="material-symbols-outlined">navigate_next</span>
						</button>
					</div>
					
					{/* Frame Slider - Integrated directly */}
					<div class="frame-slider-container">
						<Slider.Root
							id="SliderBasic"
							class="SliderRoot"
							value={[currentAnimationTime()]}
							onChange={(newValues) => {
								skeletonViewersSig()
								skeletonViewersSig().forEach((viewer) => {
									viewer.setAnimationTime(newValues[0])
								})
								setCurrentAnimationTime(newValues[0])
								setPlayPressed(true)
							}}
							onChangeEnd={(e) => {
								try {
									updatePlot2D(currentAnimationTime())
								} catch (err) {
									console.warn("⚠️ Failed to update 2D plot:", err)
								}
								try {
									updatePlot3D(currentAnimationTime())
								} catch (err) {
									console.warn("⚠️ Failed to update 3D plot:", err)
								}
							}}
							maxValue={animationDuration()}
							step={0.011}
							getValueLabel={() => `${Math.round(currentAnimationTime() * 90)}`}
						>
							<div class="SliderLabel">
								<Slider.Label>frame: </Slider.Label>
								<Slider.ValueLabel>
									{Math.round(currentAnimationTime() * 90)} frames
								</Slider.ValueLabel>
							</div>
							<Slider.Track class="SliderTrack">
								<Slider.Fill class="SliderRange" />
								<Slider.Thumb class="SliderThumb">
									<Slider.Input />
								</Slider.Thumb>
							</Slider.Track>
						</Slider.Root>
					</div>
				</div>

				{/* Plot Parameters Section */}
				<div class="control-section">
					<label class="control-label">Adjust Plot Parameters</label>
					<div class="plot-parameters">
						<div class="parameter-row">
							<label class="file-checkbox-label">
								<input
									type="checkbox"
									class="file-checkbox"
									checked={plot2D_active()}
									onChange={async (e) => {
										setPlot2D_active(e.target.checked)
										await resizePlotWindows()
									}}
								/>
								<span class="parameter-label">2D Plot:</span>
							</label>
							<div class="parameter-controls">
								<Switch.Root
									class="switch"
									checked={mode2DPlot()}
									onChange={async (value) => {
										setMode2DPlot(value)
										if (value) {
											setName2DPlot("Angle")
										} else {
											setName2DPlot("Position")
										}
										await initializeWhenLoaded()
									}}
								>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch.Root>
								<span class="parameter-text">Pos/Ang</span>
							</div>
						</div>
						
						<div class="parameter-row">
							<label class="file-checkbox-label">
								<input
									type="checkbox"
									class="file-checkbox"
									checked={plot3D_active()}
									onChange={async (e) => {
										setPlot3D_active(e.target.checked)
										await resizePlotWindows()
									}}
								/>
								<span class="parameter-label white">3D Plot:</span>
							</label>
							<div class="parameter-controls">
								<Switch.Root
									class="switch"
									checked={mode3DPlot()}
									onChange={async (value) => {
										setMode3DPlot(value)
										if (value) {
											setName3DPlot("Angle")
										} else {
											setName3DPlot("Position")
										}
										await initializeWhenLoaded()
									}}
								>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch.Root>
								<span class="parameter-text">Pos/Ang</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { VisualizationControlsCard }
