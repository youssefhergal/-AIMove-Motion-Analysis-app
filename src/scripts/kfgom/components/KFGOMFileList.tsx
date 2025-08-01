import { Select } from "@kobalte/core"

// List of available BVH files for KF-GOM analysis
const BVH_FILES = [
	"GBBSS01G03R01.bvh",
	"GBBSS01G03R02.bvh", 
	"GBBSS01G03R03.bvh",
	"GBBSS01G03R04.bvh",
	"GBBSS01G03R05.bvh",
	"MCEAS02G01R01.bvh",
	"MCEAS02G01R02.bvh",
	"MCEAS02G01R03.bvh",
	"pirouette.bvh",
	"PLNS01P02R05.bvh",
	"PLNS02P03R02.bvh",
	"running.bvh",
	"S4P07R1.bvh",
	"S4P07R2.bvh",
	"S4P07R3.bvh",
	"SWMLS01G01R01.bvh",
	"SWMLS01G01R02.bvh",
	"Test_Bending.bvh",
	"Test_Glassblowing.bvh",
	"Train_Bending.bvh",
	"Train_Glassblowing.bvh",
	"TV_S01P01R13.bvh",
	"TVBS01P01R02.bvh",
	"TVBS01P02R07.bvh",
	"TVBS01P03R09.bvh"
]

interface KFGOMFileListProps {
	onFileSelect: (fileName: string) => void
	placeholder?: string
	selectedFile?: string
}

export default function KFGOMFileList(props: KFGOMFileListProps) {
	return (
		<Select.Root
			defaultValue={props.selectedFile}
			options={BVH_FILES}
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