import { DAILY_NOTES_PLUGIN_ID, DEFAULT_FORMATS, PERIODIC_NOTES_PLUGIN_ID } from '@/constants';
import type { IPeriodicity } from './types';

/**
 * Read user settings from periodic-notes and daily-notes plugins
 * to keep behavior of creating a new note in-sync.
 * @note only call after periodic notes plugin is fully loaded 
 */
export function getNoteSettingsByPeriodicity(periodicity: IPeriodicity) {
    let pluginSettings = null;
    const plugins = (<any>window.app).plugins;
    const internalPlugins = (<any>window.app).internalPlugins;

    const pnSettingsByPeriodicity = plugins.getPlugin(PERIODIC_NOTES_PLUGIN_ID)?.settings?.[periodicity];
    if (pnSettingsByPeriodicity?.enabled) {
        pluginSettings = pnSettingsByPeriodicity;
    } else if (periodicity === 'daily') {
        const dailyNotesPlugin = internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID);
        pluginSettings = dailyNotesPlugin?.instance?.options;
    }

    if (pluginSettings) {
        console.log("using plugin settings", pluginSettings)

        return {
            format: pluginSettings.format?.trim() || DEFAULT_FORMATS[periodicity],
            folder: pluginSettings.folder?.trim() || '/',
            template: pluginSettings.template?.trim() || ''
        };
    } else {
        console.log("using default settings", DEFAULT_FORMATS[periodicity])

        return {
            format: DEFAULT_FORMATS[periodicity],
            folder: '/',
            template: ''
        }
    }
}
