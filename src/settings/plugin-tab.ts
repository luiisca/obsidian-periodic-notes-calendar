import PeriodicNotesCalendarPlugin from "@/main";
import Settings from "@/settings/ui/Index.svelte";
import { setupLocale } from "@/stores";
import { App, Notice, PluginSettingTab } from 'obsidian';
import { SvelteComponent } from "svelte";
import { get } from "svelte/store";
import { settingsStore } from "./store";
import { DEFAULT_FORMATS_PER_GRANULARITY, granularities } from "@/constants";
import { getPeriodicityFromGranularity, IGranularity } from "@/io";
import { capitalize } from "@/utils";
import { genNoticeFragment } from "@/ui/utils";

export class SettingsTab extends PluginSettingTab {
    public plugin: PeriodicNotesCalendarPlugin;
    private view: SvelteComponent | null = null;

    constructor(app: App, plugin: PeriodicNotesCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;

        setupLocale();
    }

    display() {
        this.containerEl.empty();

        this.view = new Settings({
            target: this.containerEl
        })
    }
    hide() {
        super.hide()
        this.view?.$destroy()

        let errors = [];

        for (const granularity of granularities) {
            const periodNotesSettings = get(settingsStore).notes[granularity];
            this.replaceSelectedFormatIfNeeded(granularity)

            for (const format of periodNotesSettings.formats) {
                if (format.error) {
                    errors.push(capitalize(getPeriodicityFromGranularity(granularity)))
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
        const periodNotesSettings = get(settingsStore).notes[granularity];
        let invalidValue: string;
        let correctedValue: string;

        if (periodNotesSettings.selectedFormat.error) {
            invalidValue = periodNotesSettings.selectedFormat.value;

            const foundValidFormat = periodNotesSettings.formats.find(format => !format.error);
            const defaultFormat = {
                id: window.crypto.randomUUID(),
                value: DEFAULT_FORMATS_PER_GRANULARITY[granularity],
                filePaths: [],
                error: ''
            }
            settingsStore.update((settings) => ({
                ...settings,
                notes: {
                    ...settings.notes,
                    [granularity]: {
                        ...settings.notes[granularity],
                        selectedFormat: foundValidFormat || defaultFormat,
                        formats: [
                            foundValidFormat ? null : defaultFormat,
                            ...settings.notes[granularity].formats
                        ].filter(Boolean)
                    }
                }
            }))

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
