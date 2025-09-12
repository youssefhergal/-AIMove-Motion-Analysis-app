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
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
					<path d="M3 3v18h18"/>
					<path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
				</svg>
				<span>Visualization Controls{arrow2()}</span>
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