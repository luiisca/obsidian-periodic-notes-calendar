import { PluginService } from "@/app-service";
import { DEFAULT_FORMATS_PER_GRANULARITY } from "@/constants";
import { getPeriodicityFromGranularity, IGranularity } from "@/io";
import Settings from "@/settings/ui/Index.svelte";
import { genNoticeFragment } from "@/ui/utils";
import { capitalize } from "@/utils";
import { App, Notice, PluginSettingTab } from 'obsidian';
import { mount, unmount } from "svelte";
import { get } from "svelte/store";
import { v4 as uuidv4 } from "uuid";
import { settingsStore } from "./store";
import { DUP_ERROR_PREFIX } from "@/io/validation";

export class SettingsTab extends PluginSettingTab {
    private view: Record<string, any>;

    constructor() {
        const plugin = PluginService.getPlugin();
        const app = plugin?.app as App;
        if (plugin && app) {
            super(app, plugin);
        }
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
        * Check if the selected format is invalid, if so replace it with a valid format from the formats list or a default format.
        * This ensures that creating a note will always have a valid format.
        */
    private replaceSelectedFormatIfNeeded(granularity: IGranularity) {
        const periodSettings = get(settingsStore).periods[granularity]
        const selectedFormat = periodSettings.selectedFormat;
        let correctedValue: string | null = null;

        if (!selectedFormat.error.trim()) return;

        const foundValidFormat = Object.values(periodSettings.formats).find(format => !format.error.trim());
        if (foundValidFormat) {
            settingsStore.update((s) => {
                s.periods[granularity].selectedFormat = foundValidFormat;

                return s;
            })
            correctedValue = foundValidFormat.value
        } else {
            const isSelectedFormatDup = selectedFormat.error.includes(DUP_ERROR_PREFIX)
            // remove extra duplicated formats
            if (isSelectedFormatDup) {
                settingsStore.update(s => {
                    Object.values(s.periods[granularity].formats).forEach(format => {
                        if (selectedFormat.id !== format.id && selectedFormat.value === format.value) {
                            delete s.periods[granularity].formats[format.id]
                        }
                    });
                    s.periods[granularity].selectedFormat.error = '';

                    return s
                })
            } else {
                // add a default format
                const id = uuidv4();
                const defaultFormat = {
                    id,
                    value: DEFAULT_FORMATS_PER_GRANULARITY[granularity],
                    error: '',
                    loading: false,
                }
                settingsStore.update(s => {
                    s.periods[granularity].selectedFormat = defaultFormat;
                    s.periods[granularity].formats[id] = defaultFormat;

                    return s
                })
                correctedValue = defaultFormat.value
            }
        }

        if (!correctedValue) return;

        const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
        const invalidValue = selectedFormat.value;
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
