import { Modal } from 'obsidian';
import NldatepickerComponent from '../components/Nldatepicker.svelte';
import { ModalManager } from './modals-manager';
import { mount } from "svelte";
import { Moment } from 'moment';
import { PluginService } from '@/app-service';

export interface NldPlugin {
    parseDate: (dateString: string) => NldResult;
}
interface NldResult {
    formattedString: string;
    date: Date;
    moment: Moment;
}
export default class NldatePickerModal extends Modal {
    constructor() {
        const app = PluginService.getPlugin()?.app
        if (!app) return;

        super(app);
        ModalManager.register(this);

        const { contentEl } = this;

        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();

        // Instantiate the Svelte component
        mount(NldatepickerComponent, {
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
