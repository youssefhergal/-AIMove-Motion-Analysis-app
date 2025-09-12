import { Collapsible } from "@ark-ui/solid"
import { createSignal } from "solid-js"
import NestedPage from "./NestedPage"

function CollapsibleLoadData() {
	const [arrow1, setArrow1] = createSignal("\u25BC")

	return (
		<Collapsible.Root
			defaultOpen={true}
			class="collapsible"
			onOpenChange={(bool) => {
				if (bool) {
					setArrow1("\u25BC")
				} else {
					setArrow1("\u25BC")
				}
			}}
		>
			<Collapsible.Trigger class="collapsible__trigger">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
				<span>Load Human Motion Data {arrow1()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content2">
				<div class="collapsible__content-text">
					<NestedPage />
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleLoadData }