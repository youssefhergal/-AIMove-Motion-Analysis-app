import { Splitter } from "@ark-ui/solid"
import { createEffect } from "solid-js"

import { CollapsibleLoadData } from "./CollapsibleLoadData"
import { CollapsibleVisControls } from "./CollapsibleVisControls"
import { CollapsibleDexterityAnalysis } from "./CollapsibleAnalysis"

import { ResizeEverything } from "./ResizeEverything"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"

import { SplitterH_Skel_Plots } from "./SplitterH_Skel_Plots"
import { SplitterV_SkelL_DexR } from "./SplitterV_SkelL_DexR"
import { checkboxValue } from "./stores/store"

// import danfojs from "https://cdn.jsdelivr.net/npm/danfojs@1.1.2/+esm"

const SplitterMainV_LMenu = () => {
	function thisOnChange() {
		ResizeEverything()
	}

	// Force re-render when checkboxValue changes
	createEffect(() => {
		const value = checkboxValue()
		console.log("🔄 checkboxValue changed:", value)
		// Force a small delay to ensure layout updates
		setTimeout(() => {
			ResizeEverything()
		}, 50)
	})

	return (
		<Splitter.Root
			style={{ width: "100vw", height: "100vh" }}
			size={[
				{ id: "viewer-panel", size: 15 },
				{ id: "control-panel", size: 82 },
			]}
			onSizeChangeEnd={async (e) => {
				thisOnChange()
				console.log(e.size[0].size)
			}}
		>
			<Splitter.Panel id="viewer-panel">
				<div
					id="threelogs"
					style={{ overflow: "auto", height: "100%" }}
				>
					<CollapsibleLoadData />
					<CollapsibleVisControls />
					<CollapsibleDexterityAnalysis />
				</div>
			</Splitter.Panel>
			<Splitter.ResizeTrigger
				id="viewer-panel:control-panel"
				class="mainVericalSplitter"
			/>
			<Splitter.Panel id="control-panel">
				<div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
					{checkboxValue() ? <SplitterV_SkelL_DexR /> : <SplitterH_Skel_Plots />}
				</div>
			</Splitter.Panel>
		</Splitter.Root>
	)
}

export { SplitterMainV_LMenu }
