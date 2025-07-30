import { Collapsible, Splitter } from "@ark-ui/solid"
import { myScene } from "./myScene"
import { resizePlots } from "./plots"
import { CollapsibleLoadData } from "./CollapsibleLoadData"
import { CollapsibleVisControls } from "./CollapsibleVisControls"
import { ResizeEverything } from "./ResizeEverything"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { SplitterV_SkelL_DexR } from "./SplitterV_SkelL_DexR"
import { CollapsibleAnalysis } from "./CollapsibleAnalysis"

// import danfojs from "https://cdn.jsdelivr.net/npm/danfojs@1.1.2/+esm"

const SplitterMainV_LMenu = () => {
	function thisOnChange() {
		ResizeEverything()
	}

	return (
		<Splitter.Root
			size={[
				{ id: "viewer-panel", size: 14 },
				{ id: "control-panel", size: 86 },
			]}
			onSizeChangeEnd={async (e) => {
				// await setSplitterSizeL(50)
				// await setSplitterSizeR(50)
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
					<CollapsibleAnalysis />
				</div>
			</Splitter.Panel>
			<Splitter.ResizeTrigger
				id="viewer-panel:control-panel"
				class="mainVericalSplitter"
			/>
			<Splitter.Panel id="control-panel">
				<SplitterV_SkelL_DexR />
			</Splitter.Panel>
		</Splitter.Root>
	)
}

export { SplitterMainV_LMenu }
