import { App, PluginSettingTab, Setting } from 'obsidian';

import type DailyNoteFlexPlugin from '@/main';
import { get } from 'svelte/store';
import locales from './locales';
import type { IGranularity } from './calendar-io';
import { setupPopover } from './calendar-ui/popovers';
import { CALENDAR_POPOVER_ID } from './constants';
import View from './View.svelte';
import { defaultWeekdays, sysLocaleKey, sysWeekStartId } from './localization';
import { getNewValidFormats } from './calendar-io/validation';
import { VIEW_TYPE_CALENDAR } from './view';
import { settingsStore, setupLocale, updateLocale, updateWeekStart, updateWeekdays } from './stores';

export interface ISettings {
	viewLeafPosition: 'Left' | 'Right';
	viewOpen: boolean;
	shouldConfirmBeforeCreate: boolean;
	yearsRangesStart: 2020;
	autoHoverPreview: boolean;
	openPopoverOnRibbonHover: boolean;
	crrNldModalGranularity: IGranularity;

	localeSettings: {
		showWeekNums: boolean;
		localeOverride: string;
		weekStartId: number;
	};

	popoversCloseData: {
		closePopoversOneByOneOnClickOut: boolean;
		closePopoversOneByOneOnEscKeydown: boolean;
		searchInputOnEscKeydown: 'close-popover' | 'reset';
	};

	validFormats: Record<IGranularity, string[]>;
	allowLocalesSwitchFromCommandPalette: boolean;
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
	viewLeafPosition: 'Left',
	viewOpen: false,
	shouldConfirmBeforeCreate: true,
	yearsRangesStart: 2020,
	autoHoverPreview: false,
	openPopoverOnRibbonHover: false,
	crrNldModalGranularity: 'day',

	localeSettings: {
		showWeekNums: false,
		localeOverride: sysLocaleKey,
		weekStartId: sysWeekStartId
	},

	popoversCloseData: {
		closePopoversOneByOneOnClickOut: false,
		closePopoversOneByOneOnEscKeydown: true,
		searchInputOnEscKeydown: 'close-popover' as 'close-popover' | 'reset'
	},

	validFormats: getNewValidFormats(),
	allowLocalesSwitchFromCommandPalette: false
});

export class SettingsTab extends PluginSettingTab {
	plugin: DailyNoteFlexPlugin;

	constructor(app: App, plugin: DailyNoteFlexPlugin) {
		super(app, plugin);
		this.plugin = plugin;

		setupLocale();
	}

	display() {
		console.log('Displaying setttings ⚙️');

		this.containerEl.empty();

		this.containerEl.createEl('h3', {
			text: 'General'
		});

		this.addViewLeafPositionSetting();
		this.addPopoverSetting();
		this.addOpenPopoverOnRibbonHoverSetting();
		this.addConfirmCreateSetting();
		this.addConfirmAutoHoverPreviewSetting();
		this.addShowWeeklyNoteSetting();

		this.containerEl.createEl('h3', {
			text: 'Locale'
		});
		this.addLocaleOverrideSetting();
		this.addWeekStartSetting();
		this.addAllowLocalesSwitchFromCommandPaletteSetting();

		if (!get(settingsStore).viewOpen) {
			this.containerEl.createEl('h3', {
				text: 'Popovers close conditions'
			});

			this.addClosePopoversOneByOneOnClickOutSetting();
			this.addClosePopoversOneByBoneOnEscKeydownSetting();
			if (get(settingsStore).popoversCloseData.closePopoversOneByOneOnEscKeydown) {
				this.addSpSearchInputOnEscKeydownSetting();
			}
		}
	}

	addViewLeafPositionSetting() {
		new Setting(this.containerEl)
			.setName('Calendar view position')
			.setDesc('Which sidebar should calendar view be on?')
			.addDropdown((viewLeafPosition) => {
				viewLeafPosition
					.addOption('Left', 'Left')
					.addOption('Right', 'Right')
					.setValue(get(settingsStore).viewLeafPosition)
					.onChange(async (position) => {
						this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);

						await this.app.workspace[`get${position as 'Left' | 'Right'}Leaf`](false).setViewState({
							type: VIEW_TYPE_CALENDAR,
							active: false
						});
						await this.plugin.saveSettings(() => ({
							viewLeafPosition: position as 'Left' | 'Right'
						}));
					});
			});
	}
	addPopoverSetting() {
		// TODO: improve wording
		new Setting(this.containerEl)
			.setName('Ribbon icon opens Calendar view')
			.setDesc('Show Calendar view when clicking on ribbon icon instead of default popover')
			.addToggle((viewOpen) =>
				viewOpen.setValue(get(settingsStore).viewOpen).onChange(async (viewOpen) => {
					if (this.plugin.popoversCleanups.length > 0) {
						this.plugin.popoversCleanups.forEach((cleanup) => cleanup());
						this.plugin.popoversCleanups = [];
					}

					if (!viewOpen) {
						setupPopover({
							id: CALENDAR_POPOVER_ID,
							view: {
								Component: View
							}
						});
					}

					await this.plugin.saveSettings(() => ({
						viewOpen
					}));

					this.display(); // hide/show popovers close conditions settings
				})
			);
	}
	addOpenPopoverOnRibbonHoverSetting() {
		// TODO: improve wording
		new Setting(this.containerEl).setName('Open popover on Ribbon hover').addToggle((el) =>
			el
				.setValue(get(settingsStore).openPopoverOnRibbonHover)
				.onChange(async (openPopoverOnRibbonHover) => {
					console.log('setting() > popoversCleanups: 🧹🧹🧹 🌬️ ', this.plugin.popoversCleanups);
					if (this.plugin.popoversCleanups.length > 0) {
						this.plugin.popoversCleanups.forEach((cleanup) => cleanup());
						this.plugin.popoversCleanups = [];
					}

					console.log('setting() > openPopoverOnRibbonHover: ', openPopoverOnRibbonHover);

					await this.plugin.saveSettings(() => ({
						openPopoverOnRibbonHover
					}));

					setupPopover({
						id: CALENDAR_POPOVER_ID,
						view: {
							Component: View
						}
					});
				})
		);
	}

	addConfirmCreateSetting(): void {
		new Setting(this.containerEl)
			.setName('Confirm before creating new note')
			.setDesc('Display a confirmation dialog before creating a new note')
			.addToggle((toggle) => {
				toggle.setValue(get(settingsStore).shouldConfirmBeforeCreate);
				toggle.onChange(async (value) => {
					this.plugin.saveSettings(() => ({
						shouldConfirmBeforeCreate: value
					}));
				});
			});
	}
	addConfirmAutoHoverPreviewSetting() {
		// TODO: improve wording
		new Setting(this.containerEl)
			.setName('Automatically preview note on hover')
			.setDesc('Require special key combination (Shift + mouse hover) to preview note')
			.addToggle((toggle) => {
				toggle.setValue(get(settingsStore).autoHoverPreview);
				toggle.onChange(async (value) => {
					this.plugin.saveSettings(() => ({
						autoHoverPreview: value
					}));
				});
			});
	}

	addShowWeeklyNoteSetting(): void {
		new Setting(this.containerEl)
			.setName('Show week number')
			.setDesc('Enable this to add a column with the week number')
			.addToggle((toggle) => {
				toggle.setValue(get(settingsStore).localeSettings.showWeekNums);
				toggle.onChange(async (value) => {
					this.plugin.saveSettings((settings) => ({
						localeSettings: {
							...settings.localeSettings,
							showWeekNums: value
						}
					}));
				});
			});
	}

	addLocaleOverrideSetting() {
		const localeSettings = get(settingsStore).localeSettings;

		new Setting(this.containerEl)
			.setName('Override locale:')
			.setDesc('Set this if you want to use a locale different from the default')
			.addDropdown((dropdown) => {
				dropdown.addOption(
					sysLocaleKey,
					`Same as system - ${locales.get(sysLocaleKey) || sysLocaleKey}`
				);
				window.moment.locales().forEach((momentLocale) => {
					// use a name like "English" when available in static locales file otherwise use localeKey
					dropdown.addOption(momentLocale, locales.get(momentLocale) || momentLocale);
				});

				dropdown.setValue(localeSettings.localeOverride);

				dropdown.onChange((localeKey) => {
					updateLocale(localeKey);
					updateWeekStart();
					updateWeekdays();

					this.display();
				});
			});
	}

	addWeekStartSetting() {
		const { localeSettings } = get(settingsStore);
		console.log('addWeekStartSetting() > localeSettings: ', localeSettings);

		// TODO: improve wording
		new Setting(this.containerEl)
			.setName('Start week on:')
			.setDesc(
				"Choose what day of the week to start. Select 'Locale default' to use the default specified by moment.js"
			)
			.addDropdown((dropdown) => {
				dropdown.addOption(
					defaultWeekdays[window.moment.localeData().firstDayOfWeek()],
					`Locale default - ${
						window.moment.localeData().weekdays()[window.moment.localeData().firstDayOfWeek()]
					}`
				);
				console.log(
					'addWeekStartSetting() > locale weekdays: ',
					window.moment.localeData().weekdays()
				);
				window.moment
					.localeData()
					.weekdays()
					.forEach((localizedDay, i) => {
						dropdown.addOption(defaultWeekdays[i], localizedDay);
					});

				console.log('addWeekStartSetting() > weekStartId: ', localeSettings.weekStartId);
				console.log('addWeekStartSetting() > defaultWeekdays: ', defaultWeekdays);
				console.log(
					'addWeekStartSetting() > defaultWeekdays[weekStartId]: ',
					defaultWeekdays[localeSettings.weekStartId]
				);
				dropdown.setValue(defaultWeekdays[localeSettings.weekStartId]);

				dropdown.onChange((weekday) => {
					const newWeekStartId = defaultWeekdays.indexOf(weekday);
					console.log('setting() > newWeekStartId: ', newWeekStartId);

					updateWeekStart(newWeekStartId);
					updateWeekdays();
				});
			});
	}
	addAllowLocalesSwitchFromCommandPaletteSetting() {
		new Setting(this.containerEl)
			// TODO: improve wording
			.setName('Allow switching locales from command palette')
			.setDesc(
				'Select a new locale directly from the command palette. Note that this requires you to restart the app.'
			)
			.addToggle((toggle) => {
				toggle.setValue(get(settingsStore).allowLocalesSwitchFromCommandPalette);
				toggle.onChange((value) => {
					this.plugin.saveSettings(() => ({
						allowLocalesSwitchFromCommandPalette: value
					}));

				});
			});
	}

	addClosePopoversOneByOneOnClickOutSetting() {
		const settingEl = new Setting(this.containerEl)
			.setName('Close popovers one by one on click outside')
			.addToggle((toggle) => {
				toggle.setValue(get(settingsStore).popoversCloseData.closePopoversOneByOneOnClickOut);
				toggle.onChange((value) => {
					this.plugin.saveSettings((settings) => ({
						popoversCloseData: {
							...settings.popoversCloseData,
							closePopoversOneByOneOnClickOut: value
						}
					}));
				});
			}).settingEl;
		settingEl.style.flexWrap = 'wrap';
	}

	addClosePopoversOneByBoneOnEscKeydownSetting() {
		new Setting(this.containerEl)
			.setName('Close popovers one by one on `Esc` key pressed')
			.addToggle((toggle) => {
				toggle.setValue(get(settingsStore).popoversCloseData.closePopoversOneByOneOnEscKeydown);
				toggle.onChange((value) => {
					this.plugin.saveSettings((settings) => ({
						popoversCloseData: {
							...settings.popoversCloseData,
							closePopoversOneByOneOnEscKeydown: value
						}
					}));

					this.display();
				});
			});
	}
	addSpSearchInputOnEscKeydownSetting() {
		console.log('👟 RUNNING addSpSearchInputOnEscKeydownSetting()');

		new Setting(this.containerEl)
			.setName("On sticker popover's search input `Esc` keydown")
			.setDesc("Decide what to do when `Esc` pressed in sticker popover's search input")
			.addDropdown((dropdown) => {
				console.log(
					'value in store: ',
					get(settingsStore).popoversCloseData.searchInputOnEscKeydown
				);
				// dropdown.setValue(get(settingsStore).popoversCloseData.searchInputOnEscKeydown);
				dropdown.addOption('close-popover', 'Close sticker popover');
				dropdown.addOption('reset', 'Erase search input');
				dropdown.setValue(get(settingsStore).popoversCloseData.searchInputOnEscKeydown);

				dropdown.onChange((value) => {
					console.log('from addSpSearchInputONEscKeydownSetting(), value: ', value);
					const typedValue = value as 'close-popover' | 'reset';
					this.plugin.saveSettings((settings) => ({
						popoversCloseData: {
							...settings.popoversCloseData,
							searchInputOnEscKeydown: typedValue
						}
					}));
				});
			});
	}
}
