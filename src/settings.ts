import { App, DropdownComponent, Notice, PluginSettingTab, Setting } from 'obsidian';

import type DailyNoteFlexPlugin from '@/main';
import { settingsStore } from '@/stores';
import type { Unsubscriber } from 'svelte/store';
import { fetchWithRetry } from './utils';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import locales from './locales';
import type { IGranularity } from './calendar-io';
import { registerTogglePopoverOnHover } from './popover';

dayjs.extend(weekday);
dayjs.extend(localeData);

export interface ISettings {
	viewOpen: boolean;
	shouldConfirmBeforeCreate: boolean;
	yearsRangesStart: 2020;
	autoHoverPreview: boolean;
	openPopoverOnRibbonHover: boolean;
	crrNldModalGranularity: IGranularity;

	localeData: {
		loading: boolean;
		weekStart: string;
		showWeekNums: boolean;
		sysLocale: string;
		localeOverride: string | null;
		localizedWeekdays: string[];
		localizedWeekdaysShort: string[];
	};
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
	viewOpen: false,
	shouldConfirmBeforeCreate: true,
	yearsRangesStart: 2020,
	autoHoverPreview: false,
	openPopoverOnRibbonHover: false,
	crrNldModalGranularity: 'day',

	localeData: {
		loading: false,
		weekStart: dayjs.weekdays()[dayjs().weekday(0).day()],
		showWeekNums: false,
		sysLocale:
			navigator.languages.find((locale) => locales.has(locale.toLocaleLowerCase())) ||
			navigator.languages[0],
		localeOverride: null,
		localizedWeekdays: dayjs.weekdays(),
		localizedWeekdaysShort: dayjs.weekdaysShort()
	}
});

export class SettingsTab extends PluginSettingTab {
	plugin: DailyNoteFlexPlugin;
	private unsubscribeSettingsStore: Unsubscriber;
	private locales = locales;
	private localesUpdated = false;
	private settings: ISettings = DEFAULT_SETTINGS;
	private firstRender = true;

	constructor(app: App, plugin: DailyNoteFlexPlugin) {
		super(app, plugin);
		this.plugin = plugin;

		window.dayjs = dayjs;
	}

	display() {
		console.log('Displaying setttings ⚙️');

		if (!this.unsubscribeSettingsStore) {
			this.unsubscribeSettingsStore = settingsStore.subscribe((settings) => {
				console.log('Subscribed to store!');
				this.settings = settings;
			});
		}

		if (this.firstRender) {
			this.firstRender = false;

			this.loadLocale(
				this.settings.localeData.localeOverride || this.settings.localeData.sysLocale
			);
		}

		this.containerEl.empty();

		this.containerEl.createEl('h3', {
			text: 'General Settings'
		});

		this.addPopoverSetting();
		this.addOpenPopoverOnRibbonHoverSetting();
		this.addConfirmCreateSetting();
		this.addConfirmAutoHoverPreviewSetting();
		this.addShowWeeklyNoteSetting();

		this.containerEl.createEl('h3', {
			text: 'Locale Settings'
		});
		this.addWeekStartSetting();
		this.addLocaleOverrideSetting();
	}

	hide() {
		this.unsubscribeSettingsStore();
		console.log('HIding settings 🏵️');
	}

	addPopoverSetting() {
		// TODO: improve wording
		new Setting(this.containerEl)
			.setName('Ribbon icon opens Calendar view')
			.setDesc('Show Calendar view when clicking on ribbon icon instead of default popover')
			.addToggle((viewOpen) =>
				viewOpen.setValue(this.plugin.settings.viewOpen).onChange(async (viewOpen) => {
					this.plugin.cleanupPopover && this.plugin.cleanupPopover();
					if (!viewOpen && this.plugin.settings.openPopoverOnRibbonHover) {
						registerTogglePopoverOnHover({ plugin: this.plugin });
					}

					await this.plugin.saveSettings(() => ({
						viewOpen
					}));
				})
			);
	}
	addOpenPopoverOnRibbonHoverSetting() {
		// TODO: improve wording
		new Setting(this.containerEl).setName('Open popover on Ribbon hover').addToggle((el) =>
			el
				.setValue(this.plugin.settings.openPopoverOnRibbonHover)
				.onChange(async (openPopoverOnRibbonHover) => {
					this.plugin.cleanupPopover && this.plugin.cleanupPopover();
					if (openPopoverOnRibbonHover) {
						registerTogglePopoverOnHover({plugin: this.plugin})
					}

					await this.plugin.saveSettings(() => ({
						openPopoverOnRibbonHover
					}));
				})
		);
	}

	addConfirmCreateSetting(): void {
		new Setting(this.containerEl)
			.setName('Confirm before creating new note')
			.setDesc('Display a confirmation dialog before creating a new note')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.shouldConfirmBeforeCreate);
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
				toggle.setValue(this.plugin.settings.autoHoverPreview);
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
				toggle.setValue(this.plugin.settings.localeData.showWeekNums);
				toggle.onChange(async (value) => {
					this.plugin.saveSettings((settings) => ({
						localeData: {
							...settings.localeData,
							showWeekNums: value
						}
					}));
					this.display(); // show/hide weekly settings
				});
			});
	}

	addWeekStartSetting() {
		console.log('running addWEekStart setting 🙌');

		const removeAllOptions = (dropdown: DropdownComponent) => {
			const selectNode = dropdown.selectEl;
			while (selectNode.firstChild) {
				selectNode.removeChild(selectNode.firstChild);
			}
		};

		const weekStart = this.settings.localeData.weekStart;
		const localizedWeekdays = this.settings.localeData.localizedWeekdays;
		const loading = this.settings.localeData.loading;

		new Setting(this.containerEl)
			.setName('Start week on:')
			.setDesc(
				"Choose what day of the week to start. Select 'Locale default' to use the default specified by day.js"
			)
			.addDropdown((dropdown) => {
				removeAllOptions(dropdown);

				if (weekStart && localizedWeekdays && !loading) {
					dropdown.addOption(weekStart, `Locale default - ${weekStart}`);

					localizedWeekdays.forEach((day) => {
						dropdown.addOption(day, day);
					});

					dropdown.setValue(weekStart);

					dropdown.onChange(async (value) => {
						this.plugin.saveSettings((settings) => ({
							localeData: {
								...settings.localeData,
								weekStart: value
							}
						}));
					});
				} else {
					dropdown.addOption('loading', 'Loading...');

					// add invisible option to reduce layout shifting when actual data is loaded
					dropdown.addOption('invisible', '.'.repeat(40));
					dropdown.selectEl.options[1].disabled = true;
					dropdown.selectEl.options[1].style.display = 'none';
					dropdown.setDisabled(true);
				}
			});
	}

	addLocaleOverrideSetting() {
		const navLocales = navigator.languages;
		const sysLocale = this.settings.localeData.sysLocale;
		const localeOverride = this.settings.localeData.localeOverride;

		new Setting(this.containerEl)
			.setName('Override locale:')
			.setDesc('Set this if you want to use a locale different from the default')
			.addDropdown(async (dropdown) => {
				console.log('Running locale override dropdown 👟');

				//// Load default locale based on local locales file
				const fetchableSysLocaleValue = this.locales.get(sysLocale) || navLocales[0];

				// add default option even if system locale is not fetchable
				dropdown.addOption(sysLocale, `Same as system - ${fetchableSysLocaleValue}`);

				// set temporary default value
				dropdown.setValue(localeOverride || sysLocale);
				//

				//// Request locales list from the internet if connection available and locales are not updated already, otherwise load from local file
				if (navigator.onLine) {
					if (!this.localesUpdated) {
						console.log('Requesting locales 🤲');

						// add invisible option to ensure <select /> doesn't break
						dropdown.addOption('invisible', '.'.repeat(60));
						dropdown.selectEl.options[1].disabled = true;
						dropdown.selectEl.options[1].style.display = 'none';

						// add loading option
						dropdown.addOption('loading', 'Loading...');
						dropdown.selectEl.options[2].disabled = true;

						try {
							const localesArr = await fetchWithRetry<{ key: string; name: string }[]>(
								'https://cdn.jsdelivr.net/npm/dayjs@1/locale.json'
							);

							if (!localesArr) {
								this.locales = locales;
							} else {
								const localesMap = new Map() as Map<string, string>;
								localesArr.forEach((obj) => {
									localesMap.set(obj.key, obj.name);
								});

								this.locales = localesMap;
								this.localesUpdated = true;

								new Notice('Locales loaded');
							}

							// remove loading option
							dropdown.selectEl.remove(2);
						} catch (error) {
							console.error(error);

							new Notice(error as string);
						}
					}
				} else {
					console.log('Offline 😥');
					this.locales = locales;
				}

				////
				// Add options once locales loaded from the internet or local file
				this.locales.forEach((value, key) => {
					dropdown.addOption(key, value);
				});

				// update dropdown value to avoid reset after locale list loading
				dropdown.setValue(localeOverride || sysLocale);
				////

				dropdown.onChange(async (localeKey) => {
					this.loadLocale(localeKey);
				});
			});
	}

	// helpers
	loadLocale(localeKey: string) {
		const loadLocaleWithRetry = (locale: string, retries = 0): Promise<string> => {
			return new Promise((resolve, reject) => {
				// resolve if locale already loaded
				if (
					document.querySelector(
						`script[src="https://cdn.jsdelivr.net/npm/dayjs@1/locale/${locale}.js"]`
					)
				) {
					resolve(locale);

					return;
				}

				const script = document.createElement('script');
				script.src = `https://cdn.jsdelivr.net/npm/dayjs@1/locale/${locale}.js`;
				document.body.appendChild(script);

				script.onload = () => {
					resolve(locale); // Resolve with the selected locale
				};

				script.onerror = () => {
					if (retries < 3) {
						new Notice(`Retrying to load locale: ${locale}, attempt ${retries + 1}`);
						loadLocaleWithRetry(locale, retries + 1)
							.then(resolve) // Resolve with the selected locale after successful retry
							.catch(reject);
					} else {
						new Notice(`Failed to load locale: ${locale} after ${retries} attempts`);

						// Resolve to default English if locale cannot be fetched
						new Notice('Defaulting to English - en');
						resolve('en');
					}
				};
			});
		};

		const defaultToEnglish = () => {
			console.log('Defaulting to English 🏴󠁧󠁢!');
			const { dayjs } = window;
			dayjs.locale('en');

			this.plugin.saveSettings((settings) => ({
				localeData: {
					...settings.localeData,
					weekStart: dayjs.weekdays()[dayjs().weekday(0).day()],
					localeOverride: 'en',
					localizedWeekdays: dayjs.weekdays(),
					localizedWeekdaysShort: dayjs.weekdaysShort()
				}
			}));

			this.display();
		};

		(async () => {
			try {
				if (!localeKey || localeKey === 'en') {
					defaultToEnglish();
				} else {
					if (!this.settings.localeData.loading) {
						this.plugin.saveSettings((settings) => ({
							localeData: {
								...settings.localeData,
								loading: true
							}
						}));

						this.display();
					}
					const selectedLocale = await loadLocaleWithRetry(localeKey);

					if (selectedLocale === 'en') {
						defaultToEnglish();
					} else {
						const { dayjs } = window;
						dayjs.locale(selectedLocale);

						this.plugin.saveSettings((settings) => ({
							localeData: {
								...settings.localeData,
								loading: false,
								weekStart: dayjs.weekdays()[dayjs().weekday(0).day()],
								localeOverride: localeKey,
								localizedWeekdays: dayjs.weekdays(),
								localizedWeekdaysShort: dayjs.weekdaysShort()
							}
						}));

						this.display();
					}
				}
			} catch (error) {
				console.error(error);
			}
		})();
	}
}
