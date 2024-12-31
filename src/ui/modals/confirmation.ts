import { Modal } from 'obsidian';
import { Component, mount } from 'svelte';
import { ModalManager } from './modals-manager';
import { ConfirmationModal as ConfirmationModalComponent } from '../components';
import { PluginService } from '@/app-service';

type TextContent = string | {
    Component: Component;
    props?: Record<string, any>;
};

export interface IConfirmationDialogParams {
    title: TextContent;
    text: TextContent;
    note?: string | TextContent | null;
    cta: string;
    onAccept: (dontAskAgain: boolean) => Promise<void> | void;
}

export class ConfirmationModal extends Modal {
    constructor(config: IConfirmationDialogParams) {
        const app = PluginService.getPlugin()?.app
        if (!app) return;

        super(app);
        ModalManager.register(this);

        const { contentEl } = this;

        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();

        // Instantiate the Svelte component
        mount(ConfirmationModalComponent, {
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
