import { DAILY_NOTES_PLUGIN_ID, DEFAULT_FORMATS_PER_GRANULARITY, granularities } from '@/constants';
import type { IGranularity } from './types';
import { get } from 'svelte/store';
import { settingsStore } from '@/settings';

type TSettings = Record<IGranularity, { enabled: boolean, format: string, folder: string, template: string }>;
/**
 * Read user settings from notes tab in `settings/plugin-tab.ts` and `daily-notes` plugins
 * to keep behavior of creating a new note in-sync.
 */
export function getNoteSettings() {
    const nSettings = get(settingsStore).notes;
    const dnSettings = (<any>window.app).internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID)?.instance?.options;

    return Object.fromEntries(granularities.map((granularity) => {
        let granularitySettings = null
        if (nSettings[granularity].enabled) {
            granularitySettings = nSettings[granularity]
        } else if (granularity == "day" && dnSettings) {
            granularitySettings = {
                ...dnSettings,
                enabled: true,
            }
        }

        const validGranularitySettings = {
            enabled: granularitySettings?.enabled || false,
            format: granularitySettings?.format?.trim() || DEFAULT_FORMATS_PER_GRANULARITY[granularity],
            folder: granularitySettings?.folder?.trim() || '/',
            template: granularitySettings?.template?.trim() || ''
        }

        return [granularity, validGranularitySettings]
    })) as TSettings
}
