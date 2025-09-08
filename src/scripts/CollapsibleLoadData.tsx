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