import { AlertDialog } from "@kobalte/core/alert-dialog"

import { openAlert, setOpenAlert } from "./store"
function AlertWrongMode() {
	return (
		<AlertDialog open={openAlert()} onOpenChange={setOpenAlert}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay class="alert-dialog__overlay" />
				<div class="alert-dialog__positioner">
					<AlertDialog.Content class="alert-dialog__content">
						<div class="alert-dialog__header">
							<AlertDialog.Title class="alert-dialog__title">
								⚠️ Attention: Mixed Skeleton Sources Detected{" "}
							</AlertDialog.Title>
							<AlertDialog.CloseButton class="alert-dialog__close-button">
								X{" "}
							</AlertDialog.CloseButton>
						</div>
						<AlertDialog.Description class="alert-dialog__description">
							You are attempting to mix skeletons from different
							sources (e.g., uploaded files and repository files).
							This combination is not supported and may cause
							unexpected behavior.
							<br />
							<br />
							<strong>Please refresh the page</strong>
						</AlertDialog.Description>
					</AlertDialog.Content>
				</div>
			</AlertDialog.Portal>
		</AlertDialog>
	)
}

export { AlertWrongMode }
