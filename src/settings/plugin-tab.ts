import { DEFAULT_FORMATS_PER_GRANULARITY } from "@/constants";
import { getPeriodicityFromGranularity, IGranularity } from "@/io";
import PeriodicNotesCalendarPlugin from "@/main";
import Settings from "@/settings/ui/Index.svelte";
import { genNoticeFragment } from "@/ui/utils";
import { capitalize } from "@/utils";
import { App, Notice, PluginSettingTab } from 'obsidian';
import { mount, unmount } from "svelte";
import { get } from "svelte/store";
import { settingsStore } from "./store";

export class SettingsTab extends PluginSettingTab {
    public plugin: PeriodicNotesCalendarPlugin;
    private view: Record<string, any>;

    constructor(app: App, plugin: PeriodicNotesCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        this.containerEl.empty();

        this.view = mount(Settings, {
            target: this.containerEl
        })
    }
    hide() {
        super.hide()
        unmount(this.view)

        const errors = [];

        const periods = get(settingsStore).periods
        for (const [g, periodSettings] of Object.entries(periods)) {
            this.replaceSelectedFormatIfNeeded(g as IGranularity);
            for (const format of Object.values(periodSettings.formats)) {
                if (format.error) {
                    errors.push(capitalize(getPeriodicityFromGranularity(g as IGranularity)))
                    break;
                }
            }
        }

        if (errors.length > 0) {
            new Notice(genNoticeFragment([
                ['Warning: Invalid settings for these periods: '],
                [errors.join(', '), 'u-pop'],
                ['. Calendar functionality may be affected.']
            ]), 8000);
        }
    }

    /**
        * Check if the selected format for a given period is invalid, if so replace it with a valid format from the formats list or a default format.
        * This ensures that the user can create a note with a valid format.
        */
    private replaceSelectedFormatIfNeeded(granularity: IGranularity) {
        const periodSettings = get(settingsStore).periods[granularity];
        let invalidValue: string;
        let correctedValue: string;

        if (periodSettings.selectedFormat.error.trim()) {
            invalidValue = periodSettings.selectedFormat.value;

            const foundValidFormat = Object.values(periodSettings.formats).find(format => !format.error.trim());
            const id = window.crypto.randomUUID();
            const defaultFormat = {
                id,
                value: DEFAULT_FORMATS_PER_GRANULARITY[granularity],
                error: '',
                loading: false,
            }
            settingsStore.update((s) => {
                s.periods[granularity].selectedFormat = foundValidFormat || defaultFormat;
                if (!foundValidFormat) {
                    s.periods[granularity].formats[id] = defaultFormat;
                }

                return s;
            })

            correctedValue = foundValidFormat?.value || defaultFormat.value;

            const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
            new Notice(genNoticeFragment([
                [periodicity, 'u-pop'],
                [' format '],
                [invalidValue, 'u-pop'],
                [' is invalid. '],
                ['Using '],
                [correctedValue, 'u-pop'],
                [' to prevent errors.'],
            ]), 8000)
        }
    }
}
