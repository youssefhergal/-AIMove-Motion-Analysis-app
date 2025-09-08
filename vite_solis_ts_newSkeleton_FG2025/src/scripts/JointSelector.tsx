import { Select } from "@kobalte/core"
// import { myScene } from "./myScene"
import { createPlot2D, createPlot3D } from "./plots"
import { initializeWhenLoaded } from "./useSceneSetup"
import { createEffect, onMount } from "solid-js"
// import { TableAndPlotsUpdate } from "./CheckboxDexAnalysis"

import {
	bonesList,
	selectedJoint,
	setSelectedJoint,
	currentAnimationTime,
	toggleValue,
	setAppIsLoaded,
	selectedValue,
	setSelectedValue,
	skeletonViewersSig,
} from "./store"

function cleanBoneHierarchy(boneHierarchy) {
	if (typeof boneHierarchy !== "string") {
		// Check if the bone is a string
		console.error("Expected a string but received:", boneHierarchy)
		return "" // Return an empty string or some default value if not a string
	}

	// This regular expression removes all special characters except for underscore and spaces
	return [boneHierarchy].map((name) => name.replace(/[^a-zA-Z0-9_\s]/g, ""))
}
function JointSelector() {
	// onMount(() => {
	// 	setAppIsLoaded(true)
	// })

	createEffect(async () => {
		selectedValue()
		// await TableAndPlotsUpdate()
	})
	return (
		<>
			<Select.Root
				defaultValue={bonesList()[0]}
				value={selectedValue()}
				allowDuplicateSelectionEvents={false}
				disallowEmptySelection={true}
				options={bonesList()}
				onChange={async (newValues) => {
					if (newValues !== null) {
						console.log("newValues joint: ", newValues)
						setSelectedValue(newValues)

						skeletonViewersSig().forEach((viewer) => {
							viewer.sphereMeshes.children[
								viewer.jointIndex[selectedJoint()]
							].material.color.set(0x145e9f)
						})

						setSelectedJoint(cleanBoneHierarchy(newValues)[0])

						skeletonViewersSig().forEach((viewer) => {
							viewer.sphereMeshes.children[
								viewer.jointIndex[selectedJoint()]
							].material.color.set("red")
						})

						await initializeWhenLoaded()
					}
				}}
				placeholder="Select joint..."
				itemComponent={(props) => (
					<Select.Item item={props.item} class="select__item">
						<Select.ItemLabel>
							{props.item.rawValue}
						</Select.ItemLabel>
						<Select.ItemIndicator class="select__item-indicator"></Select.ItemIndicator>
					</Select.Item>
				)}
			>
				<Select.Trigger class="select__trigger" aria-label="Fruit">
					<Select.Value class="select__value">
						{/* {(state) => cleanBoneHierarchy(state.selectedOption())} */}
						{(state) =>
							state.selectedOption?.()
								? cleanBoneHierarchy(state.selectedOption?.())
								: null
						}
					</Select.Value>
					<Select.Icon class="select__icon"></Select.Icon>
				</Select.Trigger>
				<Select.Description id="jointSelectLabel">
					Select Joint to Plot.
				</Select.Description>
				<Select.Portal>
					<Select.Content class="select__content">
						<Select.Listbox class="select__listbox" />
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</>
	)
}
export { JointSelector }
