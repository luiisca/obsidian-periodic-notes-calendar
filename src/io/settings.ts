import { DAILY_NOTES_PLUGIN_ID, DEFAULT_FORMATS_PER_GRANULARITY, granularities, PERIODIC_NOTES_PLUGIN_ID } from '@/constants';
import type { IGranularity } from './types';
import { get } from 'svelte/store';
import { settingsStore } from '@/settings';

type TSettings = Record<IGranularity, { format: string, folder: string, template: string }>;
/**
 * Read user settings from notes tab in `settings/plugin-tab.ts` and `daily-notes` plugins
 * to keep behavior of creating a new note in-sync.
 */
export function getNoteSettings() {
    const internalPlugins = (<any>window.app).internalPlugins;

    const pnSettings = get(settingsStore).notes;
    const dnSettings = internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID)?.instance?.options;

    return Object.fromEntries(granularities.map((granularity) => {
        const granularitySettings = pnSettings[granularity].enabled
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
