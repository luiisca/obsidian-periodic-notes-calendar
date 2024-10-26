import { Modal } from 'obsidian';
import NldatepickerComponent from '../components/Nldatepicker.svelte';
import { ModalManager } from './modals-manager';

export default class NldatePickerModal extends Modal {
    constructor() {
        super(window.app);
        ModalManager.register(this);

        const { contentEl } = this;

        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();

        // Instantiate the Svelte component
        new NldatepickerComponent({
            target: svelteContainer,
            props: {
                modalClass: this,
            }
        });
    }
}

export function createNldatePickerDialog() {
    new NldatePickerModal().open();
}
