import { DEFAULT_FORMATS } from '@/formats/settings';
import { getPeriodicityFromGranularity } from './parse';
import type { IGranularity } from './types';
import { Notice } from 'obsidian';

/**
 * Read user settings from periodic-notes and daily-notes plugins
 * to keep behavior of creating a new note in-sync.
 */
export function getNoteSettingsByGranularity(granularity: IGranularity) {
    const periodicity = getPeriodicityFromGranularity(granularity);

    let settings = null;
    const periodicNotesPlugin = (<any>window.app).plugins?.getPlugin('periodic-notes');
    if (periodicNotesPlugin?.settings?.[periodicity]?.enabled) {
        settings = periodicNotesPlugin?.settings?.[periodicity];
    } else if (periodicity === 'daily') {
        const dailyNotesPlugin = (<any>window.app).internalPlugins?.getPluginById('daily-notes');
        settings = dailyNotesPlugin?.instance?.options;
    }

    if (settings) {
        return {
            format: settings.format?.trim() || DEFAULT_FORMATS[periodicity],
            folder: settings.folder?.trim() || '/',
            template: settings.template?.trim() || ''
        };
    } else {
        new Notice(
            `No custom ${periodicity === 'daily' ? 'daily' : 'periodic'} note settings found! Ensure the ${periodicity == 'daily' ? 'Daily notes' : 'Periodic Notes'} plugin is active.`
        );

        return {
            format: DEFAULT_FORMATS[periodicity],
            folder: '/',
            template: ''
        }
    }
}
