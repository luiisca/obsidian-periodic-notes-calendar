import { Modal } from 'obsidian';
import StickerModalComponent from '../components/StickerModal.svelte';
import type { TNotesStore } from '@/stores';
import type { Writable } from 'svelte/store';

export interface IStickerDialogParams {
	noteStore: Writable<TNotesStore>;
	noteDateUID: string;
}

export class StickerModal extends Modal {
	constructor(params: IStickerDialogParams) {
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
				...params
            }
		});
	}
}

export function createStickerDialog(params: IStickerDialogParams) {
	new StickerModal(params).open();
}
