import { Select } from "@kobalte/core"
import { createSignal, createEffect, onMount } from "solid-js"
import { selectedBVHList } from "../../stores/store"

interface KFGOMFileListProps {
	onFileSelect: (fileName: string) => void
	placeholder?: string
	selectedFile?: string
}

export default function KFGOMFileList(props: KFGOMFileListProps) {
	// Use selectedBVHList directly for reactivity
	const availableFiles = () => {
		const files = selectedBVHList()
		return files || []
	}
	
	// If no files are selected in "Load Human Motion Data", show a message
	if (availableFiles().length === 0) {
		return (
			<div style={{
				padding: "8px 12px",
				border: "1px solid #ccc",
				"border-radius": "4px",
				"background-color": "#f5f5f5",
				color: "#666",
				"font-size": "12px",
				"text-align": "center"
			}}>
				No files selected in "Load Human Motion Data"
			</div>
		)
	}
	
	
	return (
		<Select.Root
			defaultValue={props.selectedFile}
			options={availableFiles()}
			allowDuplicateSelectionEvents={false}
			disallowEmptySelection={true}
			onChange={(file) => {
				props.onFileSelect(file)
			}}
			placeholder={props.placeholder || "Choose file..."}
			itemComponent={(itemProps) => (
				<Select.Item item={itemProps.item} class="select__item">
					<Select.ItemLabel>
						{itemProps.item.rawValue}
					</Select.ItemLabel>
					<Select.ItemIndicator class="select__item-indicator"></Select.ItemIndicator>
				</Select.Item>
			)}
		>
			<Select.Trigger 
				class="select__trigger" 
				aria-label="BVH File"
			>
				<Select.Value class="select__value">
					{(state) => (state.selectedOption() as string) || props.placeholder || "Choose file..."}
				</Select.Value>
				<Select.Icon class="select__icon"></Select.Icon>
			</Select.Trigger>
	

			<Select.Portal>
				<Select.Content class="select__content">
					<Select.Listbox class="select__listbox" />
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	)
} 