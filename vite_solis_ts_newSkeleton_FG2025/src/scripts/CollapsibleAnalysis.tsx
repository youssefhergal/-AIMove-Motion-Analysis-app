import { Collapsible } from "@kobalte/core"
import { Checkbox } from "@kobalte/core"
import { createSignal } from "solid-js"
import { myScene } from "./myScene"
import { exportBVH } from "./ExportBVH"

// Added by Youssef Hergal - Dexterity Analysis collapsible component - 2025-01-27
// FUNCTIONALITY: Collapsible section with simple checkbox for dexterity analysis
// WHY: Provides organized access to dexterity analysis features
// PERFORMANCE: Uses Kobalte's efficient collapsible implementation
function CollapsibleDexterityAnalysis() {
	const [arrow, setArrow] = createSignal("\u25BC")
	const [dexterityAnalysisEnabled, setDexterityAnalysisEnabled] = createSignal(false)

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
					setArrow("\u25BC")
				} else {
					setArrow("\u25B2")
				}
			}}
		>
			<Collapsible.Trigger
				class="collapsible__trigger"
				id="CollapsibleDexterityAnalysis"
			>
				<span> Analysis {arrow()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content">
				<div class="collapsible__content-text">
					<div class="dexterity-analysis-simple">
						<Checkbox.Root 
							class="checkbox" 
							checked={dexterityAnalysisEnabled()} 
							onChange={setDexterityAnalysisEnabled}
						>
							<Checkbox.Input class="checkbox__input" />
							<Checkbox.Control class="checkbox__control">
								<Checkbox.Indicator>✔</Checkbox.Indicator>
							</Checkbox.Control>
							<Checkbox.Label class="checkbox__label">Dexterity Analysis</Checkbox.Label>
						</Checkbox.Root>
					</div>
					<button
						onclick={exportBVHFunc}
						id="exportBVHButton"
						class="buttonCoef"
						style="margin-top: 10px;"
					>
						Export BVH
					</button>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleDexterityAnalysis }
