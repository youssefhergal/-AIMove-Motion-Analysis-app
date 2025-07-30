import { Splitter } from "@ark-ui/solid"
import { myScene } from "./myScene"
import { resizePlots } from "./plots"
import { TabsGOM_main, DownloadCSV, GenerateMovement } from "./TabsGOM_main"
import {
	splitterSizeL,
	splitterSizeR,
	selectedAssumptionsIndex,
	selectedTab,
} from "./store"
import { SplitterH_Skel_Plots } from "./SplitterH_Skel_Plots"
import { ResizeEverything } from "./ResizeEverything"
import { Separator } from "@kobalte/core/separator"
import { ToggleGroup } from "@kobalte/core/toggle-group"
import { AxisSelector } from "./AxisSelector"
import { createSignal, onMount } from "solid-js"

const SplitterV_SkelL_DexR = () => {
	function thisOnChange() {
		ResizeEverything()
	}
	const mystyle = {
		width: "100% ",
		height: "100%",
		flex: 1,
		overflow: "auto",
	}

	const [valueButton, setValueButton] = createSignal("ATT-RGOM")

	return (
		<Splitter.Root
			size={[
				{ id: "main-panel", size: splitterSizeL() },
				{ id: "dex_analysis-panel", size: splitterSizeR() },
			]}
			onSizeChangeEnd={() => {
				thisOnChange()
			}}
		>
			<Splitter.Panel id="main-panel">
				<div style={mystyle}>
					<SplitterH_Skel_Plots />
				</div>
			</Splitter.Panel>
			<Splitter.ResizeTrigger
				id="main-panel:dex_analysis-panel"
				class="mainVericalSplitter"
			/>
			<Splitter.Panel id="dex_analysis-panel">
				<div class="plotCoefContainer">
					<div class="plotTitle" id="dexterityAnalysisTitle">
						Dexterity Analysis
					</div>
					<div class="dexteritySettings">
						<div
							class="grid-container"
							style="width: 100%; grid-template-columns: 1fr 1fr; margin-top:10px;"
						>
							<div class="grid-item" id="Analysis_Title_small">
								<div class="Analysis_Title">Prediction</div>
							</div>
							<div class="grid-item" id="Analysis_Title_small">
								<div class="Analysis_Title">Training</div>
							</div>
						</div>

						{/* <div class="Analysis_Title">Training</div> */}
						<Separator class="separator" />
						<div
							class="grid-container"
							style="width: 100%; grid-template-columns: 3fr 5fr; margin-top:5px;"
						>
							<div class="grid-item" id="Analysis_Title_small">
								<AxisSelector />
							</div>
							<div class="grid-item" id="Analysis_Title_small">
								<div
									class="grid-container"
									style="width: 100%; grid-template-columns: repeat(2, 1fr);"
								>
									<div
										class="grid-item"
										id="Analysis_Title_small"
									>
										Data-intensive
										<ToggleGroup
											class="toggle-group"
											defaultValue="ATT-RGOM"
											value={valueButton()}
										>
											<ToggleGroup.Item
												class="toggle-group__item"
												value="ATT-RGOM"
												aria-label="Bold"
												onClick={() => {
													setValueButton("ATT-RGOM")
												}}
											>
												ATT-RGOM
											</ToggleGroup.Item>
											<ToggleGroup.Item
												class="toggle-group__item"
												value="VAE-RGOM"
												aria-label="Bold"
												disabled={true}
											>
												VAE-RGOM
											</ToggleGroup.Item>
											<ToggleGroup.Item
												class="toggle-group__item"
												value="T-RGOM"
												aria-label="Bold"
												disabled={true}
											>
												T-RGOM
											</ToggleGroup.Item>
										</ToggleGroup>
									</div>
									<div
										class="grid-item"
										id="Analysis_Title_small"
									>
										One-Shot
										<ToggleGroup
											class="toggle-group"
											value={valueButton()}
										>
											<ToggleGroup.Item
												class="toggle-group__item"
												value="KF-GOM"
												aria-label="Bold"
												onClick={() => {
													setValueButton("KF-GOM")
												}}
											>
												KF-GOM
											</ToggleGroup.Item>
										</ToggleGroup>
									</div>
								</div>
							</div>
						</div>
					</div>

					<TabsGOM_main valueButton={valueButton()} />
					{(selectedAssumptionsIndex() !== 0 ||
						selectedTab() === "Generated Movement" ||
						valueButton() === "KF-GOM") && (
						<div class="generateButtons">
							<div
								id="grid-container-generateButtons"
								class="grid-container-buttonCoef"
							>
								<button
									id="generateButton"
									class="buttonCoef"
									onclick={valueButton() === "KF-GOM" ? () => console.log("KF-GOM Analysis") : GenerateMovement}
								>
									{valueButton() === "KF-GOM" ? "Analyze" : "Generate"}
								</button>
								<button
									id="downloadButton"
									class="buttonCoef"
									onclick={valueButton() === "KF-GOM" ? () => console.log("Download KF-GOM Results") : DownloadCSV}
								>
									{valueButton() === "KF-GOM" ? "Download Results" : "Download CSV"}
								</button>
							</div>
						</div>
					)}
				</div>
			</Splitter.Panel>
		</Splitter.Root>
	)
}

export { SplitterV_SkelL_DexR }
