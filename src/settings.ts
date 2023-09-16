import { App, PluginSettingTab, Setting } from "obsidian";
import type DailyNoteFlexPlugin from "./main";

export interface ISettings {
	viewOpen: boolean;
}

export const DEFAULT_SETTINGS = Object.freeze({
    viewOpen: false,
})


export class SettingsTab extends PluginSettingTab {
	plugin: DailyNoteFlexPlugin;

	constructor(app: App, plugin: DailyNoteFlexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();

		// TODO: improve wording
		new Setting(containerEl)
			.setName('Ribbon icon opens Calendar view')
			.setDesc('Show Calendar view when clicking on ribbon icon instead of default popup')
			.addToggle((viewOpen) =>
				viewOpen.setValue(this.plugin.settings.viewOpen).onChange(async (viewOpen) => {
					console.log('ON toggle setting ⚙️');
					console.log('ViewOpen Setting', viewOpen)

					// destroy popup when no longer active
					viewOpen && this.plugin.popupCalendar && this.plugin.cleanupPopup();

					await this.plugin.saveSettings(() => ({
						viewOpen
					}));

					// rerender popup when reactivated
					!viewOpen && this.plugin.handlePopup();
				})
			);
	}
}