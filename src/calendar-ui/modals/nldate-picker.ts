import { Modal } from 'obsidian';
import NldatepickerComponent from '../components/Nldatepicker.svelte';
import type DailyNoteFlexPlugin from '@/main';

export default class NldatePickerModal extends Modal {
	constructor(plugin: DailyNoteFlexPlugin) {
		super(window.app);

        const {contentEl} = this;

		// Create a div to mount the Svelte component
		const svelteContainer = contentEl.createDiv();

		// Instantiate the Svelte component
		new NldatepickerComponent({
			target: svelteContainer,
			props: {
				modalClass: this,
				pluginClass: plugin
			}
		});
	}
}

export function createNldatePickerDialog(plugin: DailyNoteFlexPlugin) {
	new NldatePickerModal(plugin).open();
}