import { Collapsible, Switch } from "@kobalte/core"
import { createSignal } from "solid-js"
import { JointSelector } from "./JointSelector"
import { SliderBasic } from "./SliderBasic"
import { myScene } from "./myScene"
import { play, stop, preparePlotsData } from "./useSceneSetup"
import { createPlot2D, createPlot3D } from "./plots"
import { Separator } from "@kobalte/core/separator"

import {
	currentAnimationTime,
	loadingDone,
	mode2DPlot,
	time_to_frame,
	setCurrentAnimationTime,
	setMode2DPlot,
	mode3DPlot,
	setMode3DPlot,
	toggleValue,
	setName2DPlot,
	setName3DPlot,
} from "./store"
import { CheckboxDexAnalysis } from "./CheckboxDexAnalysis"

function CollapsibleVisControls() {
	const [arrow2, setArrow2] = createSignal("\u25BC")

	function previousTimeValue() {
		return (time_to_frame(currentAnimationTime()) - 1) / 90
	}

	function nextTimeValue() {
		return setCurrentAnimationTime(
			(time_to_frame(currentAnimationTime()) + 1) / 90
		)
	}

	return (
		<Collapsible.Root
			defaultOpen={true}
			class="collapsible"
			onOpenChange={(bool) => {
				if (bool) {
					setArrow2("\u25BC")
				} else {
					setArrow2("\u25B2")
				}
			}}
		>
			<Collapsible.Trigger
				class="collapsible__trigger"
				id="CollapsibleVisControls"
			>
				<span>Visualization Controls {arrow2()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content">
				<div class="collapsible__content-text">
					{loadingDone() && <JointSelector />}
					<div class="grid-container">
						<div
							class="grid-item full-width"
							style="margin-bottom: 20px;"
						>
							<SliderBasic />
						</div>

						<div class="grid-item">
							<button
								onClick={() => {
									myScene.setAnimationTime(
										previousTimeValue()
									)
									//myScene.playPressed=true;
								}}
								class="player_buttons"
								id="previousButton"
								title="Previous Frame"
							>
								<span class="material-symbols-outlined">
									navigate_before
								</span>
							</button>
						</div>
						<div class="grid-item">
							<button
								onClick={play}
								class="player_buttons"
								id="playButton"
								title="Play Animation"
							>
								<span class="material-symbols-outlined">
									play_arrow
								</span>
							</button>
						</div>
						<div class="grid-item">
							<button
								onClick={stop}
								class="player_buttons"
								id="stopButton"
								title="Pause Animation"
							>
								<span class="material-symbols-outlined">
									pause
								</span>
							</button>
						</div>
						<div class="grid-item">
							<button
								onClick={() => {
									myScene.setAnimationTime(nextTimeValue())
									//myScene.playPressed=true;
								}}
								class="player_buttons"
								id="nextButton"
								title="Next Frame"
							>
								<span class="material-symbols-outlined">
									navigate_next
								</span>
							</button>
						</div>
					</div>
					<Separator class="separator" />
					<div
						class="toolbarDescription"
						style={"margin-bottom: 10px; margin-top: 30px"}
					>
						{" "}
						Adjust Plot Parameters:{" "}
					</div>

					<div class="plot-mode-grid">
						<div class="plot-type-section top-left">2D Plot:</div>
						<div class="plot-mode-section top-right">
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
									myScene.mixer.timeScale = 1
									await preparePlotsData()
									await createPlot2D(
										currentAnimationTime(),
										toggleValue()
									)
									myScene.mixer.timeScale = 0
								}}
							>
								<Switch.Label class="switch__label">
									Positions
								</Switch.Label>
								<Switch.Input class="switch__input" />
								<Switch.Control class="switch__control">
									<Switch.Thumb class="switch__thumb" />
								</Switch.Control>
								<Switch.Label class="switch__label">
									Angles
								</Switch.Label>
							</Switch.Root>
						</div>
						<div class="plot-type-section bottom-left">
							3D Plot:
						</div>
						<div class="plot-mode-section bottom-right">
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
									myScene.mixer.timeScale = 1
									await preparePlotsData()
									await createPlot3D(currentAnimationTime())
									myScene.mixer.timeScale = 0
								}}
							>
								<Switch.Label class="switch__label">
									Positions
								</Switch.Label>
								<Switch.Input class="switch__input" />
								<Switch.Control class="switch__control">
									<Switch.Thumb class="switch__thumb" />
								</Switch.Control>
								<Switch.Label class="switch__label">
									Angles
								</Switch.Label>
							</Switch.Root>
						</div>
					</div>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleVisControls }
