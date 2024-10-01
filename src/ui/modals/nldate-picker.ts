import { Modal } from 'obsidian';
import NldatepickerComponent from '../components/Nldatepicker.svelte';

export default class NldatePickerModal extends Modal {
    constructor() {
        super(window.app);

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
