import { CALENDAR_POPOVER_ID, VIEW_TYPE } from "@/constants";
import locales from "@/locales";
import { defaultWeekdays, sysLocaleKey } from "@/localization";
import PeriodicNotesCalendarPlugin from "@/main";
import { setupLocale, updateLocale, updateWeekdays, updateWeekStart } from "@/stores";
import { Popover } from "@/ui/popovers";
import { App, PluginSettingTab, Setting } from 'obsidian';
import { get } from "svelte/store";
import View from "../View.svelte";
import { settingsStore } from "./store";
import { SvelteComponent } from "svelte";
import Notes from "../ui/settings/notes/index.svelte";

export class SettingsTab extends PluginSettingTab {
    public plugin: PeriodicNotesCalendarPlugin;
    private view: SvelteComponent;

    constructor(app: App, plugin: PeriodicNotesCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;

        setupLocale();
    }

    display() {
        this.containerEl.empty();

        this.containerEl.createEl('h3', {
            text: 'General'
        });

        this.addViewLeafPositionSetting();
        this.addViewTypeSetting();
        this.addOpenPopoverOnRibbonHoverSetting();
        this.addConfirmCreateSetting();
        this.addConfirmAutoHoverPreviewSetting();
        this.addShowWeeklyNoteSetting();
        this.addShowQuarterlyNoteSetting();

        this.containerEl.createEl('h3', {
            text: 'Notes'
        })
        this.view = new Notes({
            target: this.containerEl
        })

        if (!get(settingsStore).leafViewEnabled) {
            this.containerEl.createEl('h3', {
                text: 'Popover behavior'
            });

            this.addClosePopoversOneByOneOnClickOutSetting();
            this.addClosePopoversOneByBoneOnEscKeydownSetting();
        }

        this.containerEl.createEl('h3', {
            text: 'Localization'
        });
        this.addLocaleOverrideSetting();
        this.addWeekStartSetting();
        this.addAllowLocalesSwitchFromCommandPaletteSetting();

        // this.containerEl.createEl('h3', {
        //     text: 'Date Formats'
        // });
        // this.containerEl.createEl('p', {
        //     text: "Define moment.js formats for note creation and calendar display"
        // });
        // new FormatsSettings({ target: this.containerEl });
    }
    hide() {
        super.hide()
        this.view?.$destroy()
    }

    addViewLeafPositionSetting() {
        new Setting(this.containerEl)
            .setName('Calendar Pane Placement')
            .setDesc('Choose which side to display the Calendar pane')
            .addDropdown((viewLeafPosition) => {
                viewLeafPosition
                    .addOption('Left', 'Left')
                    .addOption('Right', 'Right')
                    .setValue(get(settingsStore).viewLeafPosition)
                    .onChange(async (position) => {
                        this.app.workspace.detachLeavesOfType(VIEW_TYPE);

                        await this.app.workspace[`get${position as 'Left' | 'Right'}Leaf`](false)?.setViewState({
                            type: VIEW_TYPE,
                            active: false
                        });

                        settingsStore.update((settings) => ({
                            ...settings,
                            viewLeafPosition: position as 'Left' | 'Right'
                        }))
                    });
            });
    }
    addViewTypeSetting() {
        new Setting(this.containerEl)
            .setName('Use Calendar Pane')
            .setDesc('Open the Calendar in a dedicated pane instead of a popover when clicking the ribbon icon')
            .addToggle((leafViewEnabled) =>
                leafViewEnabled
                    .setValue(get(settingsStore).leafViewEnabled)
                    .onChange((leafViewEnabled) => {
                        // TODO: use BasePopover.instances instead
                        if (this.plugin.popoversCleanups.length > 0) {
                            this.plugin.popoversCleanups.forEach((cleanup) => cleanup());
                            this.plugin.popoversCleanups = [];
                        }

                        if (!leafViewEnabled) {
                            Popover.create({
                                id: CALENDAR_POPOVER_ID,
                                view: {
                                    Component: View
                                }
                            });
                        }

                        settingsStore.update((settings) => ({
                            ...settings,
                            leafViewEnabled
                        }))

                        this.display(); // refresh settings panel
                    })
            );
    }
    addOpenPopoverOnRibbonHoverSetting() {
        new Setting(this.containerEl)
            .setName('Open Calendar on Ribbon Hover')
            .setDesc('Display the Calendar popover when hovering over the ribbon icon')
            .addToggle((el) =>
                el
                    .setValue(get(settingsStore).openPopoverOnRibbonHover)
                    .onChange(async (openPopoverOnRibbonHover) => {
                        console.log('setting() > popoversCleanups: 🧹🧹🧹 🌬️ ', this.plugin.popoversCleanups);
                        if (this.plugin.popoversCleanups.length > 0) {
                            this.plugin.popoversCleanups.forEach((cleanup) => cleanup());
                            this.plugin.popoversCleanups = [];
                        }

                        console.log('setting() > openPopoverOnRibbonHover: ', openPopoverOnRibbonHover);

                        settingsStore.update((settings) => ({
                            ...settings,
                            openPopoverOnRibbonHover
                        }))

                        Popover.create({
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
            .setName('Confirm Note Creation')
            .setDesc('Show a confirmation dialog before creating a new periodic note')
            .addToggle((toggle) => {
                toggle.setValue(get(settingsStore).shouldConfirmBeforeCreate);
                toggle.onChange(async (value) => {
                    settingsStore.update((settings) => ({
                        ...settings,
                        shouldConfirmBeforeCreate: value
                    }))
                });
            });
    }
    addConfirmAutoHoverPreviewSetting() {
        new Setting(this.containerEl)
            .setName('Auto-preview on Hover')
            .setDesc('Automatically preview notes when hovering over dates (no key combination required)')
            .addToggle((toggle) => {
                toggle.setValue(get(settingsStore).autoHoverPreview);
                toggle.onChange(async (value) => {
                    settingsStore.update((settings) => ({
                        ...settings,
                        autoHoverPreview: value
                    }))
                });
            });
    }

    addShowWeeklyNoteSetting(): void {
        new Setting(this.containerEl)
            .setName('Display Week Numbers')
            .setDesc('Add a column showing week numbers in the calendar')
            .addToggle((toggle) => {
                toggle.setValue(get(settingsStore).localeSettings.showWeekNums);
                toggle.onChange(async (value) => {
                    settingsStore.update((settings) => ({
                        ...settings,
                        localeSettings: {
                            ...settings.localeSettings,
                            showWeekNums: value
                        }
                    }))
                });
            });
    }
    addShowQuarterlyNoteSetting(): void {
        new Setting(this.containerEl)
            .setName('Display Quarter Numbers')
            .setDesc('Add a column showing quarter numbers in the calendar')
            .addToggle((toggle) => {
                toggle.setValue(get(settingsStore).localeSettings.showQuarterNums);
                toggle.onChange(async (value) => {
                    settingsStore.update((settings) => ({
                        ...settings,
                        localeSettings: {
                            ...settings.localeSettings,
                            showQuarterNums: value
                        }
                    }))
                });
            });
    }

    addLocaleOverrideSetting() {
        const localeSettings = get(settingsStore).localeSettings;

        new Setting(this.containerEl)
            .setName('Override System Locale')
            .setDesc('Choose a specific locale for the calendar, different from your system default')
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

        new Setting(this.containerEl)
            .setName('First Day of Week')
            .setDesc(
                "Choose which day to start the week with, or use the locale's default"
            )
            .addDropdown((dropdown) => {
                dropdown.addOption(
                    defaultWeekdays[window.moment.localeData().firstDayOfWeek()],
                    `Locale default - ${window.moment.localeData().weekdays()[window.moment.localeData().firstDayOfWeek()]
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
            .setName('Enable Locale Switching via Command Palette')
            .setDesc(
                'Allow changing the calendar locale directly from the Command Palette (requires app restart)'
            )
            .addToggle((toggle) => {
                toggle.setValue(get(settingsStore).allowLocalesSwitchFromCommandPalette);
                toggle.onChange((value) => {
                    settingsStore.update((settings) => ({
                        ...settings,
                        allowLocalesSwitchFromCommandPalette: value
                    }))
                });
            });
    }

    addClosePopoversOneByOneOnClickOutSetting() {
        const settingEl = new Setting(this.containerEl)
            .setName('Close Popovers Individually on Outside Click')
            .setDesc("Dismiss open popovers one at a time when clicking outside, instead of all at once")
            .addToggle((toggle) => {
                toggle.setValue(get(settingsStore).popoversClosing.closePopoversOneByOneOnClickOut);
                toggle.onChange((value) => {
                    settingsStore.update((settings) => ({
                        ...settings,
                        popoversClosing: {
                            ...settings.popoversClosing,
                            closePopoversOneByOneOnClickOut: value
                        }
                    }))
                });
            }).settingEl;
        settingEl.style.flexWrap = 'wrap';
    }

    addClosePopoversOneByBoneOnEscKeydownSetting() {
        new Setting(this.containerEl)
            .setName('Close Popovers Individually with Esc Key')
            .setDesc('Dismiss open popovers one at a time when pressing Esc, instead of all at once')
            .addToggle((toggle) => {
                toggle.setValue(get(settingsStore).popoversClosing.closePopoversOneByOneOnEscKeydown);
                toggle.onChange((value) => {
                    settingsStore.update((settings) => ({
                        ...settings,
                        popoversClosing: {
                            ...settings.popoversClosing,
                            closePopoversOneByOneOnEscKeydown: value
                        }
                    }))

                    this.display();
                });
            });
    }
}
