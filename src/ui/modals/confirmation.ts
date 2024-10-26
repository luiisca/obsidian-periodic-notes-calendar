import { Modal } from 'obsidian';
import ConfirmationModalComponent from '../components/ConfirmationModal.svelte';
import { ComponentType } from 'svelte';
import { ModalManager } from './modals-manager';

type TextContent = string | {
    Component: ComponentType;
    props?: Record<string, unknown>;
};

export interface IConfirmationDialogParams {
    title: TextContent;
    text: TextContent;
    cta: string;
    onAccept: (dontAskAgain: boolean) => Promise<void> | void;
    note?: string | TextContent | null;
}

export class ConfirmationModal extends Modal {
    constructor(config: IConfirmationDialogParams) {
        super(window.app);
        ModalManager.register(this);

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
