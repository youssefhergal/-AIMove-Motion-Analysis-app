import { Collapsible } from "@kobalte/core"
import { createSignal } from "solid-js"
import { VisualizationControlsCard } from "./VisualizationControlsCard"

function CollapsibleVisControls() {
	const [arrow2, setArrow2] = createSignal("\u25BC")

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
					<VisualizationControlsCard />
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleVisControls }