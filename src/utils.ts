import { Notice } from 'obsidian';
import { DAILY_NOTES_PLUGIN_ID } from './constants';
import { DnPluginSettings } from './io/settings';

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

export function logger(module: string, ...messages: unknown[]) {
    const prefix = `[${module}]`;

    messages.forEach((message) => {
        console.log(prefix, " ", message);
        console.log("-".repeat(20))
    })
}

export async function getPlugin(pluginId: string): Promise<any | null> {
    const plugins = (window.app as any).plugins;
    const enabledPlugins = plugins?.enabledPlugins as Set<string>

    if (!enabledPlugins.has(pluginId)) {
        await plugins?.enablePluginAndSave(pluginId);
    }

    return plugins?.getPlugin(pluginId)
}
export async function getDailyNotesPlugin() {
    const dailyNotesPlugin = (<any>window.app).internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID) as DnPluginSettings | undefined;

    if (!dailyNotesPlugin?.enabled) {
        await (dailyNotesPlugin as any).enable()
    }

    return dailyNotesPlugin;
}
