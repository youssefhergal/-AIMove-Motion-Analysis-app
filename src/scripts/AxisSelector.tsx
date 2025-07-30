import { Select } from "@kobalte/core"
import { myScene } from "./myScene"
import { TableAndPlotsUpdate } from "./CheckboxDexAnalysis"
import {
	axisSelected,
	setAxisSelected,
	set_df_coef_mod,
	df_coef_mod,
} from "./store"
import * as aq from "arquero"

function AxisSelector() {
	// const [value, setValue] = createSignal("LeftForeArm");
	return (
		<div class="axisSelector">
			<Select.Root
				value={axisSelected()}
				allowDuplicateSelectionEvents={false}
				disallowEmptySelection={true}
				options={["X", "Y", "Z"]}
				onChange={async (newValues) => {
					console.log(newValues[0])
					setAxisSelected(newValues[0])

					TableAndPlotsUpdate()
					// Modify the dataframe with Arquero
				}}
				placeholder="Select Axis..."
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
						<Select.Value<string>>
							{(state) => state.selectedOption()}
						</Select.Value>{" "}
					</Select.Value>
					<Select.Icon class="select__icon"></Select.Icon>
				</Select.Trigger>
				<Select.Description id="jointSelectLabel">
					Select Joint Angle Axis:
				</Select.Description>
				<Select.Portal>
					<Select.Content class="select__content">
						<Select.Listbox class="select__listbox" />
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</div>
	)
}
export { AxisSelector }
