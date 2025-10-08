import { Dialog } from "@ark-ui/solid"

interface StructureChangeDialogProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	fileName: string
}

export default function StructureChangeDialog(props: StructureChangeDialogProps) {
	return (
		<Dialog.Root open={props.isOpen} onOpenChange={(e) => {
			if (!e.open) props.onClose()
		}}>
			<Dialog.Backdrop class="dialog-backdrop" />
			<Dialog.Positioner class="dialog-positioner">
				<Dialog.Content class="dialog-content">
					<div class="dialog-header">
						<Dialog.Title class="dialog-title">
							🔄 Structure Change Detected!
						</Dialog.Title>
						<Dialog.Description class="dialog-description">
							File "<strong>{props.fileName}</strong>" has a different bone structure than your current files.
							<br /><br />
							Do you want to continue and add this file?
						</Dialog.Description>
					</div>
					<div class="dialog-footer">
						<button class="dialog-button dialog-button-cancel" onClick={props.onClose}>
							Cancel
						</button>
						<button class="dialog-button dialog-button-confirm" onClick={props.onConfirm}>
							Continue
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	)
}