import { Modal } from 'obsidian';
import StickerModalComponent from '../components/StickerModal.svelte';

export interface IConfirmationDialogParams<T> {
	text: string;
	title: string;
	cta: string;
	onAccept: () => Promise<T>;
	note?: string | null;
}

export class StickerModal extends Modal {
	constructor() {
		super(window.app);

		this.titleEl.empty();
		this.modalEl.id = 'emoji-modal';
		const { contentEl } = this;

		// Create a div to mount the Svelte component
		const svelteContainer = contentEl.createDiv();

		// Instantiate the Svelte component
		new StickerModalComponent({
			target: svelteContainer,
			props: {
				modalClass: this,
            }
		});
	}
}

export function createStickerDialog() {
	new StickerModal().open();
}
