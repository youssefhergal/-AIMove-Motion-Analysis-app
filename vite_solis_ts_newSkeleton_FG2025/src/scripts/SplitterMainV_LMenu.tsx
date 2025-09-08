import { Splitter } from "@ark-ui/solid"

import { CollapsibleLoadData } from "./CollapsibleLoadData"
import { CollapsibleVisControls } from "./CollapsibleVisControls"
import { CollapsibleDexterityAnalysis } from "./CollapsibleAnalysis"

import { ResizeEverything } from "./ResizeEverything"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"

import { SplitterH_Skel_Plots } from "./SplitterH_Skel_Plots"
// import { myScene } from "./myScene_hide"

const SplitterMainV_LMenu = () => {
	function thisOnChange() {
		ResizeEverything()
	}
	const mystyle = {
		width: "100% ",
		height: "100%",
		flex: 1,
		overflow: "auto",
	}

	return (
		<Splitter.Root
			size={[
				{ id: "viewer-panel", size: 18 },
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
				<div style={mystyle}>
					<SplitterH_Skel_Plots />
				</div>{" "}
			</Splitter.Panel>
		</Splitter.Root>
	)
}

export { SplitterMainV_LMenu }
