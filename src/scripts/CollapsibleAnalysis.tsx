import { Collapsible } from "@kobalte/core"
import { createSignal } from "solid-js"
import { BVHSelector } from "./bvhSelector"
import { uploadOutput } from "./store"
import { uploadFile } from "./useSceneSetup"
import { CheckboxDexAnalysis } from "./CheckboxDexAnalysis"
import { myScene } from "./myScene"

import { exportBVH } from "./ExportBVH"

function CollapsibleAnalysis() {
	const [arrow1, setArrow1] = createSignal("\u25BC")

	async function exportBVHFunc() {
		const bvhData = await exportBVH(
			myScene.globalResult.skeleton,
			myScene.animationClip
		)

		const blob = new Blob([bvhData], { type: "text/plain" })
		const url = URL.createObjectURL(blob)
		// Create a download link
		const link = document.createElement("a")
		link.href = url
		link.download = "animation.bvh"
		document.body.appendChild(link)
		link.click()

		document.body.removeChild(link)
		URL.revokeObjectURL(url)

		console.log(bvhData)
	}

	return (
		<Collapsible.Root
			defaultOpen={true}
			class="collapsible"
			onOpenChange={(bool) => {
				if (bool) {
					setArrow1("\u25BC")
				} else {
					setArrow1("\u25B2")
				}
			}}
		>
			<Collapsible.Trigger class="collapsible__trigger">
				<span>Analysis {arrow1()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content">
				<div class="collapsible__content-text">
					<div style="display:flex; margin-top:10px; margin-bottom:10px;">
						<CheckboxDexAnalysis />
					</div>
				</div>
				<button
					onclick={exportBVHFunc}
					id="resetAllButton"
					class="buttonCoef"
				>
					export BVH{" "}
				</button>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleAnalysis }
