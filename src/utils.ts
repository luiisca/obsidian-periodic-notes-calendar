import { Notice } from 'obsidian';
import type { IGranularity } from './io';
import { getPeriodicityFromGranularity } from './io/parse';
import { DAILY_NOTES_PLUGIN_ID, PERIODIC_NOTES_PLUGIN_ID } from './constants';

export async function fetchWithRetry<T>(url: string, retries = 0): Promise<T | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not OK');

        const localesArr = (await response.json()) as T;
        return localesArr;
    } catch (error) {
        if (retries < 3) {
            new Notice(`Something went wrong. Retry ${retries + 1}`);
            return fetchWithRetry(url, retries + 1);
        } else {
            new Notice(
                `Fetch failed after ${retries} attempts. Using local, possibly outdated locales. Check internet and restart plugin.`
            );

            return null;
        }
    }
}

export function capitalize(string: string) {
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
}

export function getOnCreateNoteDialogNoteFromGranularity(granularity: IGranularity) {
    const periodicity = getPeriodicityFromGranularity(granularity);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotesPlugin = (<any>window.app).plugins.getPlugin(PERIODIC_NOTES_PLUGIN_ID);
    const noteSettingsFromPeriodicNotesPlugin = periodicNotesPlugin?.settings[periodicity].enabled;

    if (granularity === 'day') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dailyNotesPlugin = (<any>window.app).internalPlugins.plugins[DAILY_NOTES_PLUGIN_ID]?.enabled;

        if (periodicNotesPlugin) {
            if (noteSettingsFromPeriodicNotesPlugin) {
                return 'Note: Using Daily notes config from Periodic Notes plugin.';
            } else {
                if (dailyNotesPlugin) {
                    return 'Note: Daily notes from Periodic Notes plugin are disabled. Using Daily Notes plugin config for now.';
                } else {
                    return 'Note: Daily notes from Periodic Notes plugin and Daily Notes plugin are disabled. Using default config for now.';
                }
            }
        } else {
            if (dailyNotesPlugin) {
                return 'Note: Missing Periodic Notes plugin! Please install or activate. Using Daily Notes plugin config for now.';
            } else {
                return 'Note: Missing Periodic Notes and Daily Notes plugin! Please install or activate. Using default config for now.';
            }
        }
    }

    if (periodicNotesPlugin) {
        if (noteSettingsFromPeriodicNotesPlugin) {
            return `Note: Using ${capitalize(periodicity)} notes config from Periodic Notes plugin.`;
        } else {
            return `Note: ${capitalize(
                periodicity
            )} notes from Periodic Notes plugin are disabled. Using default config for now.`;
        }
    } else {
        return 'Note: Missing Periodic Notes plugin! Please install or activate. Defaults will be used for now.';
    }
}

export function logger(module: string, ...messages: unknown[]) {
    const prefix = `[${module}]`;

    messages.forEach((message) => {
        console.log(prefix, " ", message);
        console.log("-".repeat(20))
    })
}

export async function getPlugin(pluginId: string): Promise<any | null> {
    const plugins = (<any>window.app).plugins;
    const enabledPlugins = plugins?.enabledPlugins as Set<string>

    if (!enabledPlugins.has(pluginId)) {
        await plugins?.enablePluginAndSave(pluginId);
    }

    return plugins?.getPlugin(pluginId)
}
export async function getDailyNotesPlugin() {
    const internalPlugins = (<any>window.app).internalPlugins;
    const dailyNotesPlugin = internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID);

    if (!dailyNotesPlugin?.enabled) {
        await dailyNotesPlugin.enable()
    }
}
