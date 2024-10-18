import { DAILY_NOTES_PLUGIN_ID, DEFAULT_FORMATS_PER_GRANULARITY } from '@/constants';
import { settingsStore } from '@/settings';
import { get } from 'svelte/store';

/**
 * Read user settings from notes tab in `settings/plugin-tab.ts` and `daily-notes` plugins
 * to keep behavior of creating a new note in-sync.
 */
export function getNoteSettings() {
    const pluginSettings = get(settingsStore).notes;
    const dailyNotesPluginSettings = (<any>window.app).internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID)?.instance?.options as {
        autorun: boolean;
        format: string;
        folder: string;
        template: string;
    };

    let settings = pluginSettings;
    if (!pluginSettings.day.enabled && dailyNotesPluginSettings) {
        settings = {
            ...settings,
            day: {
                ...settings.day,
                enabled: true,
                openAtStartup: dailyNotesPluginSettings?.autorun || false,
                selectedFormat: {
                    ...settings.day.selectedFormat,
                    value: dailyNotesPluginSettings?.format || DEFAULT_FORMATS_PER_GRANULARITY.day
                },
                folder: dailyNotesPluginSettings?.folder || '/',
                templatePath: dailyNotesPluginSettings?.template || '',
            }
        }
    }

    return settings
}
