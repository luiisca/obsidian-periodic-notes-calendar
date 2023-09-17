import { App, PluginSettingTab, Setting } from 'obsidian';
import type DailyNoteFlexPlugin from './main';
import type {
	ILocaleOverride,
	IWeekStartOption
} from 'obsidian-calendar-ui';
import { settingsStore } from './ui/stores';
import type { Unsubscriber } from 'svelte/store';
import { configureGlobalMomentLocale } from './localization';

export interface ISettings {
	weekStart: IWeekStartOption;
	viewOpen: boolean;

	localeOverride: ILocaleOverride;
}

export const DEFAULT_SETTINGS = Object.freeze({
	weekStart: 'locale' as IWeekStartOption,
	viewOpen: false,

	localeOverride: 'system-default'
});

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export class SettingsTab extends PluginSettingTab {
	plugin: DailyNoteFlexPlugin;
	private unsubscribeSettingsStore: Unsubscriber;
	private localeChanged: boolean;

	constructor(app: App, plugin: DailyNoteFlexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		console.log('Displaying setttings ⚙️');
		if (!this.unsubscribeSettingsStore) {
			this.unsubscribeSettingsStore = settingsStore.subscribe((settings) => {
				configureGlobalMomentLocale(settings.localeOverride, settings.weekStart);
				if (this.localeChanged) {
					this.localeChanged = false;
					this.display();
				}
			});
		}

		this.containerEl.empty();

		this.containerEl.createEl('h3', {
			text: 'General Settings'
		});

		this.addWeekStartSetting();
		this.addPopoverSetting();

		this.containerEl.createEl('h3', {
			text: 'Advanced Settings'
		});
		this.addLocaleOverrideSetting();
	}

	hide() {
		this.unsubscribeSettingsStore();
		console.log('HIding settings 🏵️');
	}

	addWeekStartSetting() {
		const { moment } = window;

		const localizedWeekdays = moment.weekdays();
		const localeWeekStartNum = moment.localeData()._defaultWeek.dow;
		const localeWeekStartDay = localizedWeekdays[localeWeekStartNum];

		// reset default week start
		moment.updateLocale(moment.locale(), {
			week: {
				dow: localeWeekStartNum,
			}
		})

		new Setting(this.containerEl)
			.setName('Start week on:')
			.setDesc(
				"Choose what day of the week to start. Select 'Locale default' to use the default specified by moment.js"
			)
			.addDropdown((dropdown) => {
				dropdown.addOption('locale', `Locale default (${localeWeekStartDay})`);
				localizedWeekdays.forEach((day, i) => {
					dropdown.addOption(weekdays[i], day);
				});
				dropdown.setValue('locale');
				dropdown.onChange(async (value) => {
					this.plugin.saveSettings(() => ({
						weekStart: value as IWeekStartOption
					}));
				});
			});
	}

	addPopoverSetting() {
		// TODO: improve wording
		new Setting(this.containerEl)
			.setName('Ribbon icon opens Calendar view')
			.setDesc('Show Calendar view when clicking on ribbon icon instead of default popup')
			.addToggle((viewOpen) =>
				viewOpen.setValue(this.plugin.settings.viewOpen).onChange(async (viewOpen) => {
					console.log('ON toggle setting ⚙️');
					console.log('ViewOpen Setting', viewOpen);

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

	addLocaleOverrideSetting() {
		const { moment } = window;

		const sysLocale = navigator.language?.toLowerCase();

		new Setting(this.containerEl)
			.setName('Override locale:')
			.setDesc('Set this if you want to use a locale different from the default')
			.addDropdown((dropdown) => {
				dropdown.addOption('system-default', `Same as system (${sysLocale})`);
				moment.locales().forEach((locale) => {
					dropdown.addOption(locale, locale);
				});
				dropdown.setValue(this.plugin.settings.localeOverride);
				dropdown.onChange(async (value) => {
					console.log('dropdown.onChange() -> NEW LOCALE!! 🏳️‍🌈');
					this.localeChanged = true;
					this.plugin.saveSettings(() => ({
						localeOverride: value as ILocaleOverride
					}));
				});
			});
	}
}
