import { Modal } from 'obsidian';
import NldatepickerComponent from '../components/Nldatepicker.svelte';
import { ModalManager } from './modals-manager';
import { mount } from "svelte";
import { Moment } from 'moment';

export interface NldPlugin {
    parseDate: (dateString: string) => NldResult;
}
interface NldResult {
    formattedString: string;
    date: Date;
    moment: Moment;
}
export default class NldatePickerModal extends Modal {
    constructor(nlDatesPlugin: NldPlugin) {
        super(window.app);
        ModalManager.register(this);

        const { contentEl } = this;

        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();

        // Instantiate the Svelte component
        mount(NldatepickerComponent, {
            target: svelteContainer,
            props: {
                modalClass: this,
                nlDatesPlugin
            }
        });
    }
}

export function createNldatePickerDialog(nlDatesPlugin: NldPlugin) {
    new NldatePickerModal(nlDatesPlugin).open();
}
