import { DAILY_NOTES_PLUGIN_ID, DEFAULT_FORMATS_PER_GRANULARITY } from '@/constants';
import { PeriodSettings, settingsStore } from '@/settings';
import { get } from 'svelte/store';
import { IGranularity } from './types';

/**
 * Read user settings from notes tab in `settings/plugin-tab.ts` and `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
type TNormalizedPeriodSettings = Record<IGranularity, { settings: PeriodSettings, type: "period" | "daily" | "default" }>
export function getNormalizedPeriodSettings(granularity: IGranularity): TNormalizedPeriodSettings[IGranularity] {
    const pluginSettings = get(settingsStore).periods;
    const dailyNotesPlugin = (<any>window.app).internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID)
    const dailyNotesPluginSettings = dailyNotesPlugin?.instance?.options as {
        autorun: boolean;
        format: string;
        folder: string;
        template: string;
    };

    const settings = pluginSettings[granularity];
    if (settings.enabled) {
        return {
            type: "period",
            settings
        }
    } else if (granularity === 'day' && !pluginSettings.day.enabled && dailyNotesPlugin.enabled) {
        return {
            type: "daily",
            settings: {
                ...pluginSettings.day,
                enabled: true,
                openAtStartup: dailyNotesPluginSettings?.autorun || false,
                selectedFormat: {
                    ...pluginSettings.day.selectedFormat,
                    value: dailyNotesPluginSettings?.format || DEFAULT_FORMATS_PER_GRANULARITY.day
                },
                folder: dailyNotesPluginSettings?.folder || '/',
                templatePath: dailyNotesPluginSettings?.template || '',
            }
        }
    } else {
        return {
            type: "default",
            settings: {
                ...settings,
                selectedFormat: {
                    id: window.crypto.randomUUID(),
                    value: DEFAULT_FORMATS_PER_GRANULARITY[granularity],
                    error: "",
                    loading: false,
                }
            }
        }
    }
}
