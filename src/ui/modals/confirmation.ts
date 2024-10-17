import { Modal } from 'obsidian';
import ConfirmationModalComponent from '../components/ConfirmationModal.svelte';

export interface IConfirmationDialogParams {
    text: string;
    title: string;
    cta: string;
    onAccept: (dontAskAgain: boolean) => Promise<void> | void;
    note?: string | null;
}

export class ConfirmationModal extends Modal {
    constructor(config: IConfirmationDialogParams) {
        super(window.app);

        const { contentEl } = this;

        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();

        // Instantiate the Svelte component
        new ConfirmationModalComponent({
            target: svelteContainer,
            props: {
                config,
                modalClass: this
            }
        });
    }
}

export function createConfirmationDialog(params: IConfirmationDialogParams) {
    new ConfirmationModal(params).open();
}
