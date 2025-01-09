import { Notice } from 'obsidian';
import { PluginService } from './app-service';
import { DAILY_NOTES_PLUGIN_ID } from './constants';
import { DnPluginSettings } from './io/settings';
import locales from './locales';
import { createLocalesPickerDialog, ILocaleItem } from './ui/modals/locales-picker';

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

export async function getPlugin(pluginId: string): Promise<any | null> {
    const plugins = (PluginService.getPlugin()?.app as any).plugins;
    const enabledPlugins = plugins?.enabledPlugins as Set<string>

    if (!enabledPlugins.has(pluginId)) {
        await plugins?.enablePluginAndSave(pluginId);
    }

    return plugins?.getPlugin(pluginId)
}
export async function getDailyNotesPlugin() {
    const dailyNotesPlugin = (<any>PluginService.getPlugin()?.app).internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID) as DnPluginSettings | undefined;

    if (!dailyNotesPlugin?.enabled) {
        await (dailyNotesPlugin as any).enable()
    }

    return dailyNotesPlugin;
}

export function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function handleLocaleCommands() {
    let localeItems: ILocaleItem[] = []
    const COMMAND = 'switch-locale'
    if (!PluginService.getPlugin()) return;

    window.moment.locales().forEach((momentLocale) => {
        localeItems.push({
            momentLocale,
            label: locales.get(momentLocale) || momentLocale
        })
    });

    PluginService.getPlugin()?.addCommand({
        id: COMMAND,
        name: 'Switch locale',
        callback: () => {
            createLocalesPickerDialog(localeItems)
        }
    });
}

export function isMobile() {
    return PluginService.getPlugin()?.app.isMobile as boolean | undefined
}

// https://stackoverflow.com/questions/50195475/detect-if-device-is-tablet
export function isTablet() {
    if (!isMobile()) return false; // Only check for mobile devices

    const userAgent = navigator.userAgent.toLowerCase();
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
}

export function isPhone() {
    return isMobile() && !isTablet();
}
