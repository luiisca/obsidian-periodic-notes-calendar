import ConfirmationModalComponent from './components/ConfirmationModal.svelte';

export interface IConfirmationDialogParams<T> {
	cta: string;
	// eslint-disable-next-line
	onAccept: () => Promise<T>;
	text: string;
	title: string;
}

export class ConfirmationModal<T> extends Modal {
	constructor(config: IConfirmationDialogParams<T>) {
		super(window.app);

		const { contentEl } = this;

		// Create a div to mount the Svelte component
		const svelteContainer = contentEl.createDiv();

		// Instantiate the Svelte component
		new ConfirmationModalComponent({
			target: svelteContainer,
			props: {
				config,
				modalClass: this,
			}
		});
	}
}

export function createConfirmationDialog<T>(params: IConfirmationDialogParams<T>) {
	new ConfirmationModal(params).open();
}
