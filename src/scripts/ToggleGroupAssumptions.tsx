import { createSignal, onMount } from "solid-js"
import { selectedAssumptionsIndex, setSelectedAssumptionsIndex } from "./stores/store"

function ToggleGroupAssumptions() {
	const [indicatorStyle, setIndicatorStyle] = createSignal({
		width: "0px",
		transform: "translateX(0px)",
	})

	const items = [
		"GOM",
		"=",
		// "(",
		"Transitioning",
		"+",
		"Intra-joint association",
		"+",
		"Inter-limb synergy",
		"+",
		"Serial intra-limb mediation",
		"+",
		"Non-serial intra-limb mediation",
		// ")",
		"All assumptions statistics",
	]

	const handleSelect = (index) => {
		setSelectedAssumptionsIndex(index)
		updateIndicatorStyle(index)
	}

	const updateIndicatorStyle = (index) => {
		const item = document.querySelectorAll(".custom-toggle-group__item")[
			index
		] as HTMLElement
		if (item) {
			const { offsetWidth, offsetLeft } = item
			setIndicatorStyle({
				width: `${offsetWidth}px`,
				transform: `translateX(${offsetLeft}px)`,
			})
		}
	}

	onMount(() => {
		handleSelect(selectedAssumptionsIndex())
	})

	return (
		<div class="custom-toggle-group">
			{items.map((item, index) => (
				<button
					class={`custom-toggle-group__item ${selectedAssumptionsIndex() === index ? 'selected' : ''}`}
					onClick={() => {
						if (item !== "+" && item !== "=") {
							handleSelect(index)
						}
					}}
					disabled={item === "+" || item === "="}
					aria-selected={selectedAssumptionsIndex() === index}
				>
					{item}
				</button>
			))}
			<div
				class="custom-toggle-group__indicator"
				style={indicatorStyle()}
			/>
		</div>
	)
}

export { ToggleGroupAssumptions }
