import { DAILY_NOTES_PLUGIN_ID, DEFAULT_FORMATS_PER_GRANULARITY, granularities, PERIODIC_NOTES_PLUGIN_ID } from '@/constants';
import type { IGranularity } from './types';

type TSettings = Record<IGranularity, { format: string, folder: string, template: string }>;
/**
 * Read user settings from periodic-notes and daily-notes plugins
 * to keep behavior of creating a new note in-sync.
 * @note only call after periodic notes plugin is fully loaded 
 */
export function getNoteSettings() {
    const plugins = (<any>window.app).plugins;
    const internalPlugins = (<any>window.app).internalPlugins;

    const pnSettings = plugins.getPlugin(PERIODIC_NOTES_PLUGIN_ID)?.settings;
    const dnSettings = internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID)?.instance?.options;

    return Object.fromEntries(granularities.map((granularity) => {
        const granularitySettings = pnSettings?.[granularity]?.enabled
            ? pnSettings[granularity]
            : granularity === "day" ? dnSettings : {};

        const validGranularitySettings = {
            format: granularitySettings.format?.trim() || DEFAULT_FORMATS_PER_GRANULARITY[granularity],
            folder: granularitySettings.folder?.trim() || '/',
            template: granularitySettings.template?.trim() || ''
        }

        return [granularity, validGranularitySettings]
    })) as TSettings
}
