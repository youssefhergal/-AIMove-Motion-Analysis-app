import { Splitter } from "@ark-ui/solid"
import { myScene } from "./myScene"
import { resizePlots } from "./plots"
import { TabsGOM_main, DownloadCSV, GenerateMovement} from "./TabsGOM_main"
import {
	splitterSizeL,
	splitterSizeR,
	selectedAssumptionsIndex,
	selectedTab,
} from "./stores/store"
import { SplitterH_Skel_Plots } from "./SplitterH_Skel_Plots"
import { ResizeEverything } from "./ResizeEverything"
import { Separator } from "@kobalte/core/separator"
import { ToggleGroup } from "@kobalte/core/toggle-group"
import { AxisSelector } from "./AxisSelector"
import { createSignal, onMount, createEffect } from "solid-js"
import KFGOMFileSelector from "./kfgom/components/KFGOMFileSelector"

const SplitterV_SkelL_DexR = () => {
	function thisOnChange() {
		ResizeEverything()
	}
	
	// Force re-render when sizes change
	createEffect(() => {
		const leftSize = splitterSizeL()
		const rightSize = splitterSizeR()
		
		// Force resize after size change
		setTimeout(() => {
			ResizeEverything()
		}, 10)
	})
	const mystyle = {
		width: "100%",
		height: "100%",
		overflow: "hidden",
	}

	const [valueButton, setValueButton] = createSignal("KF-GOM")

	// Effect to handle tab changes and refresh data
	createEffect(() => {
		const currentValue = valueButton()
		console.log("🔄 Tab changed to:", currentValue)
		
		// When switching back to ATT-RGOM, refresh the data
		if (currentValue === "ATT-RGOM") {
			setTimeout(async () => {
				console.log("🔄 Refreshing ATT-RGOM data...")
				// Import and call the necessary functions to refresh data
				const { displayTableSwitcher } = await import("./CheckboxDexAnalysis")
				await displayTableSwitcher()
				console.log("✅ ATT-RGOM data refreshed")
			}, 100)
		}
		
		// When switching to KF-GOM, ensure data is available
		if (currentValue === "KF-GOM") {
			setTimeout(() => {
				console.log("🔄 KF-GOM tab activated")
				// Force resize to ensure proper display
				ResizeEverything()
			}, 100)
		}
	})

	return (
		<Splitter.Root
			style={{ width: "100%", height: "100%" }}
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
							style="width: 100%; grid-template-columns: 2fr 1fr; margin-top:5px;"
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
											defaultValue="KF-GOM"
											value={valueButton()}
										>
											<ToggleGroup.Item
												class="toggle-group__item"
												value="ATT-RGOM"
												aria-label="Bold"
												disabled={true}
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
						
						{/* KF-GOM File Selection - Only show when KF-GOM is selected */}
						{valueButton() === "KF-GOM" && (
							<div style="margin-top: -10px;">
								<KFGOMFileSelector />
							</div>
						)}
					</div>

					{/* KF-GOM File Selection - Moved to dexterity settings above */}

					<div style={{ flex: 1, overflow: "hidden" }}>
						<TabsGOM_main valueButton={valueButton()} />
					</div>
				</div>
			</Splitter.Panel>
		</Splitter.Root>
	)
}

export { SplitterV_SkelL_DexR }
